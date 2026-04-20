const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const uploadController = require('../controllers/uploadController');
const { upload } = require('../middleware/uploadMiddleware');

// Rutas de Inventario
router.get('/inventario', inventoryController.getInventory);
router.post('/nuevo-producto', inventoryController.addProduct);
router.post('/vender', inventoryController.sellProduct);
router.put('/inventario/:id', inventoryController.updateProduct);
router.delete('/inventario/:id', inventoryController.deleteProduct);

// Rutas de Carga
router.post('/upload', upload.single('imagen'), uploadController.uploadImage);

module.exports = router;
