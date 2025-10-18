const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')
const csv = require('fast-csv')
const BulkUploadJob = require('../models/warehouse/bulk-upload-job')
const { WherehouseModel } = require('../models/warehouse/wherehouse-model')
const { CategoryModel } = require('../models/categorys/category-scheema')
const { StockModal } = require('../models/stock/stock-scheema')

function parseXlsxFileToRows(filePath) {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet, { defval: null })
}

// Handlers per resource type
const handlers = {
  warehouse: {
    validate: (row) => {
      const name = (row.name || row.Name || row.warehouse || '').toString().trim()
      const location = (row.location || row.Location || row.addr || '').toString().trim()
      if (!name) return { ok: false, reason: 'Missing warehouse name' }
      if (!location) return { ok: false, reason: 'Missing location' }
      return { ok: true, payload: { name, location } }
    },
    process: async (payload) => {
      const existing = await WherehouseModel.findOne({ name: payload.name, orgNo: payload.orgNo || payload.jobOrgNo }).lean()
      if (existing) {
        return { ok: false, reason: 'Duplicate warehouse' }
      }
      const w = new WherehouseModel({ name: payload.name, location: payload.location, orgNo: payload.orgNo, createdBy: payload.uploader })
      await w.save()
      return { ok: true, id: w._id }
    }
  },
  category: {
    validate: (row) => {
      const name = (row.name || row.Name || row.category || '').toString().trim()
      const description = (row.description || row.Description || row.desc || '').toString().trim()
      if (!name) return { ok: false, reason: 'Missing category name' }
      return { ok: true, payload: { name, description } }
    },
    process: async (payload) => {
      const existing = await CategoryModel.findOne({ name: payload.name, orgNo: payload.orgNo }).lean()
      if (existing) {
        return { ok: false, reason: 'Duplicate category' }
      }
      const c = new CategoryModel({ name: payload.name, description: payload.description, orgNo: payload.orgNo, createdBy: payload.uploader })
      await c.save()
      return { ok: true, id: c._id }
    }
  },
  stock: {
    validate: (row) => {
      // expected headers: sku, productName, warehouseName, quantity, unit, purchasePrice, sellingPrice, categoryName
      const sku = (row.sku || row.SKU || '').toString().trim()
      const productName = (row.productName || row.productname || row.product || '').toString().trim()
      const warehouseName = (row.warehouseName || row.warehouse || '').toString().trim()
      const categoryName = (row.categoryName || row.category || '').toString().trim()
      const quantity = Number(row.quantity || 0)
      const unit = (row.unit || 'pcs').toString().trim()
      const purchasePrice = Number(row.purchasePrice || row.purchase_price || 0)
      const sellingPrice = Number(row.sellingPrice || row.selling_price || 0)

      if (!sku) return { ok: false, reason: 'Missing SKU' }
      if (!productName) return { ok: false, reason: 'Missing productName' }
      if (!warehouseName) return { ok: false, reason: 'Missing warehouseName' }
      if (!categoryName) return { ok: false, reason: 'Missing categoryName' }

      return { ok: true, payload: { sku, productName, warehouseName, categoryName, quantity, unit, purchasePrice, sellingPrice } }
    },
    process: async (payload) => {
      // resolve category and warehouse by name
      const category = await CategoryModel.findOne({ name: payload.categoryName, orgNo: payload.orgNo }).lean()
      if (!category) return { ok: false, reason: 'Category not found' }
      const warehouse = await WherehouseModel.findOne({ name: payload.warehouseName, orgNo: payload.orgNo }).lean()
      if (!warehouse) return { ok: false, reason: 'Warehouse not found' }

      // check unique sku per org
      const existing = await StockModal.findOne({ orgNo: payload.orgNo, sku: payload.sku }).lean()
      if (existing) return { ok: false, reason: 'Duplicate SKU' }

      const s = new StockModal({
        orgNo: payload.orgNo,
        createdBy: payload.uploader,
        productName: payload.productName,
        sku: payload.sku,
        category: category._id,
        warehouse: warehouse._id,
        description: payload.description || '',
        quantity: payload.quantity,
        unit: payload.unit,
        purchasePrice: payload.purchasePrice,
        sellingPrice: payload.sellingPrice,
      })
      await s.save()
      return { ok: true, id: s._id }
    }
  }
}

async function processGenericJob(jobId, filePath) {
  const job = await BulkUploadJob.findById(jobId)
  if (!job) return

  try {
    job.status = 'PROCESSING'
    await job.save()

    // Prepare failure CSV writer
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'bulk')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    const failurePath = path.join(uploadsDir, `${jobId}-failures.csv`)
    const failureStream = fs.createWriteStream(failurePath)
    const csvStream = csv.format({ headers: true })
    csvStream.pipe(failureStream)

    // Read rows depending on file type
    let rows = []
    if (filePath.endsWith('.csv')) {
      // stream CSV
      await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath)
        const parser = csv.parse({ headers: true })
        parser.on('error', reject)
        parser.on('data', (row) => rows.push(row))
        parser.on('end', () => resolve())
        stream.pipe(parser)
      })
    } else {
      rows = parseXlsxFileToRows(filePath)
    }

    const total = rows.length
    job.total = total
    await job.save()

    const handler = handlers[job.resourceType] || handlers.warehouse
    for (let i = 0; i < total; i++) {
      const row = rows[i]
      job.processed = i + 1
      try {
        const validation = handler.validate(row)
        if (!validation.ok) {
          job.failCount += 1
          csvStream.write({ row: i + 1, reason: validation.reason, ...row })
          if (i % 50 === 0) await job.save()
          continue
        }

        // call handler and inspect result
        const payload = Object.assign({}, validation.payload, { orgNo: job.orgNo, uploader: job.uploader })
        const result = await handler.process(payload)
        if (result && result.ok) {
          job.successCount += 1
        } else {
          job.failCount += 1
          const reason = (result && result.reason) || 'Processing failed'
          csvStream.write({ row: i + 1, reason, ...row })
        }
      } catch (e) {
        job.failCount += 1
        csvStream.write({ row: i + 1, reason: e.message, ...row })
      }
      // persist counters periodically
      if (i % 50 === 0) await job.save()
    }

    csvStream.end()
    await new Promise((r) => failureStream.on('close', r))

    job.status = 'COMPLETED'
    await job.save()
  } catch (err) {
    job.status = 'FAILED'
    await job.save()
  }
}

const uploadGeneric = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).send({ status: false, message: 'No file uploaded' })
    const orgNo = req.profile?.orgNo
    const uploader = req.profile?._id
    const filename = req.file.originalname
    const resourceType = req.params.type || req.body?.resourceType || 'warehouse'
    // write uploaded file to disk first
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'bulk')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    const destPath = path.join(uploadsDir, `${Date.now()}-${filename}`)
    fs.writeFileSync(destPath, req.file.buffer)

    const job = new BulkUploadJob({ orgNo, uploader, filename, resourceType, total: 0, status: 'PENDING' })
    await job.save()

    setImmediate(() => processGenericJob(job._id, destPath))

    return res.status(202).send({ status: true, message: 'Upload accepted', jobId: job._id })
  } catch (err) {
    console.error('uploadGeneric error', err)
    return res.status(500).send({ status: false, message: err.message })
  }
}

const getJobStatus = async (req, res) => {
  try {
    const jobId = req.params.jobId
    const job = await BulkUploadJob.findById(jobId).lean()
    if (!job) return res.status(404).send({ status: false, message: 'Job not found' })
    if (String(job.orgNo) !== String(req.profile?.orgNo)) return res.status(403).send({ status: false, message: 'Forbidden' })

    return res.status(200).send({ status: true, data: { total: job.total, processed: job.processed, failCount: job.failCount, status: job.status } })
  } catch (err) {
    console.error('getJobStatus error', err)
    return res.status(500).send({ status: false, message: err.message })
  }
}

const getJobResults = async (req, res) => {
  try {
    const jobId = req.params.jobId
    const job = await BulkUploadJob.findById(jobId).lean()
    if (!job) return res.status(404).send({ status: false, message: 'Job not found' })
    if (String(job.orgNo) !== String(req.profile?.orgNo)) return res.status(403).send({ status: false, message: 'Forbidden' })
    // Failures are stored on disk as CSV: uploads/bulk/<jobId>-failures.csv
    const failurePath = path.resolve(process.cwd(), 'uploads', 'bulk', `${jobId}-failures.csv`)
    if (!fs.existsSync(failurePath)) return res.status(200).send({ status: true, data: { results: [], errors: [] } })
    return res.sendFile(failurePath)
  } catch (err) {
    console.error('getJobResults error', err)
    return res.status(500).send({ status: false, message: err.message })
  }
}

module.exports = {
  uploadGeneric,
  getJobStatus,
  getJobResults,
}
