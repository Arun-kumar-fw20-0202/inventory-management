const express = require('express')
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const { uploadGeneric, getJobStatus, getJobResults } = require('../controllers/bulk-upload-controller')

const BulkUploadRouter = express.Router()

// POST /bulk-upload/:type  e.g. /bulk-upload/category or /bulk-upload/stock
BulkUploadRouter.post('/:type', RoleVerifyMiddleware('admin','superadmin','manager'), upload.single('file'), uploadGeneric)
BulkUploadRouter.get('/job/:jobId/status', RoleVerifyMiddleware('admin','superadmin','manager'), getJobStatus)
BulkUploadRouter.get('/job/:jobId/results', RoleVerifyMiddleware('admin','superadmin','manager'), getJobResults)
BulkUploadRouter.get('/job/:jobId/failures', RoleVerifyMiddleware('admin','superadmin','manager'), (req, res) => {
  const jobId = req.params.jobId
  const failurePath = require('path').resolve(process.cwd(), 'uploads', 'bulk', `${jobId}-failures.csv`)
  if (!require('fs').existsSync(failurePath)) return res.status(404).send({ status: false, message: 'No failures found' })
  return res.sendFile(failurePath)
})

module.exports = {
  BulkUploadRouter
}
