const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getAllWarga, createWarga, updateWarga, deleteWarga } = require('../controllers/wargaController');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/', getAllWarga);
router.post('/', createWarga);
router.put('/:id', updateWarga);
router.delete('/:id', deleteWarga);

module.exports = router;
