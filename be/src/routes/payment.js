const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getPayments,
  getSummary,
  getPendingApprovals,
  createPayment,
  updatePaymentStatus,
  manualPaymentStatus,
} = require('../controllers/paymentController');

const router = express.Router();

router.use(requireAuth);

router.get('/', getPayments);
router.post('/', upload.single('receipt'), createPayment);

router.get('/summary', requireAdmin, getSummary);
router.get('/pending', requireAdmin, getPendingApprovals);
router.put('/:id/status', requireAdmin, updatePaymentStatus);
router.post('/manual', requireAdmin, manualPaymentStatus);

module.exports = router;
