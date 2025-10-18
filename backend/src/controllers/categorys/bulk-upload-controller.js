const XLSX = require('xlsx')
const BulkUploadJob = require('../../models/warehouse/bulk-upload-job')
const { CategoryModel } = require('../../models/categorys/category-scheema')

// Helper to parse uploaded buffer (xlsx or csv)
function parseBufferToRows(buffer, filename) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null })
  return rows
}

function validateRow(row) {
  const name = (row.name || row.Name || row.category || '').toString().trim()
  const description = (row.description || row.Description || row.desc || '').toString().trim()
  if (!name) return { ok: false, reason: 'Missing category name' }
  return { ok: true, payload: { name, description } }
}

async function processCategoryBulkJob(jobId) {
  const job = await BulkUploadJob.findById(jobId)
  if (!job) return

  try {
    job.status = 'PROCESSING'
    await job.save()

    const rows = job.meta?.rows || []
    const total = rows.length
    job.total = total
    await job.save()

    const BATCH = 20
    for (let i = 0; i < total; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH)
      for (let j = 0; j < chunk.length; j++) {
        const rowIndex = i + j
        const row = chunk[j]
        const validation = validateRow(row)
        job.processed = rowIndex + 1
        try {
          if (!validation.ok) {
            job.failCount += 1
            job.errors.push({ row: rowIndex + 1, reason: validation.reason, payload: row })
            job.results.push({ row: rowIndex + 1, status: 'FAILED' })
            await job.save()
            continue
          }

          const payload = { name: validation.payload.name, description: validation.payload.description, orgNo: job.orgNo, createdBy: job.uploader }
          try {
            const existing = await CategoryModel.findOne({ name: payload.name, orgNo: job.orgNo }).lean()
            if (existing) {
              job.failCount += 1
              job.errors.push({ row: rowIndex + 1, reason: 'Duplicate category', payload: row })
              job.results.push({ row: rowIndex + 1, status: 'FAILED' })
            } else {
              const c = new CategoryModel(payload)
              await c.save()
              job.results.push({ row: rowIndex + 1, categoryId: c._id, status: 'SUCCESS' })
            }
          } catch (e) {
            job.failCount += 1
            job.errors.push({ row: rowIndex + 1, reason: e.message, payload: row })
            job.results.push({ row: rowIndex + 1, status: 'FAILED' })
          }
        } catch (inner) {
          job.failCount += 1
          job.errors.push({ row: rowIndex + 1, reason: inner.message, payload: row })
          job.results.push({ row: rowIndex + 1, status: 'FAILED' })
        }
      }
      await job.save()
      await new Promise(r => setTimeout(r, 50))
    }

    job.status = 'COMPLETED'
    await job.save()
  } catch (err) {
    job.status = 'FAILED'
    job.errors.push({ row: null, reason: err.message })
    await job.save()
  }
}

// Upload endpoint (expects multer middleware to populate req.file.buffer)
const uploadBulkCategories = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).send({ status: false, message: 'No file uploaded' })
    const orgNo = req.profile?.orgNo
    const uploader = req.profile?._id
    const filename = req.file.originalname

    const rows = parseBufferToRows(req.file.buffer, filename)

    const job = new BulkUploadJob({ orgNo, uploader, filename, total: rows.length, meta: { rows }, status: 'PENDING' })
    await job.save()

    setImmediate(() => processCategoryBulkJob(job._id))

    return res.status(202).send({ status: true, message: 'Upload accepted', jobId: job._id })
  } catch (err) {
    console.error('uploadBulkCategories error', err)
    return res.status(500).send({ status: false, message: err.message })
  }
}

const getCategoryBulkJobStatus = async (req, res) => {
  try {
    const jobId = req.params.jobId
    const job = await BulkUploadJob.findById(jobId).lean()
    if (!job) return res.status(404).send({ status: false, message: 'Job not found' })
    if (String(job.orgNo) !== String(req.profile?.orgNo)) return res.status(403).send({ status: false, message: 'Forbidden' })

    return res.status(200).send({ status: true, data: { total: job.total, processed: job.processed, failCount: job.failCount, status: job.status } })
  } catch (err) {
    console.error('getCategoryBulkJobStatus error', err)
    return res.status(500).send({ status: false, message: err.message })
  }
}

const getCategoryBulkJobResults = async (req, res) => {
  try {
    const jobId = req.params.jobId
    const job = await BulkUploadJob.findById(jobId).lean()
    if (!job) return res.status(404).send({ status: false, message: 'Job not found' })
    if (String(job.orgNo) !== String(req.profile?.orgNo)) return res.status(403).send({ status: false, message: 'Forbidden' })

    return res.status(200).send({ status: true, data: { results: job.results || [], errors: job.errors || [] } })
  } catch (err) {
    console.error('getCategoryBulkJobResults error', err)
    return res.status(500).send({ status: false, message: err.message })
  }
}

module.exports = {
  uploadBulkCategories,
  getCategoryBulkJobStatus,
  getCategoryBulkJobResults,
}
