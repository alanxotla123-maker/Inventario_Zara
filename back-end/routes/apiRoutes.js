const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const uploadController = require('../controllers/uploadController');
const authController = require('../controllers/authController');
const { upload } = require('../middleware/uploadMiddleware');

// Rutas de Autenticación
router.post('/login', authController.login);

// Rutas de Inventario
router.get('/inventario', inventoryController.getInventory);
router.post('/nuevo-producto', inventoryController.addProduct);
router.post('/vender', inventoryController.sellProduct);
router.post('/vender-lote', inventoryController.sellProductBatch);
router.put('/inventario/:id', inventoryController.updateProduct);
router.delete('/inventario/:id', inventoryController.deleteProduct);

// Rutas de Ventas
router.get('/ventas', inventoryController.getVentas);

// Rutas de Tendencias e Inteligencia
router.get('/tendencias', inventoryController.getTendencias);
router.get('/sell-through', inventoryController.getSellThrough);
router.get('/clima', inventoryController.getWeatherPredictions);
router.post('/devoluciones', inventoryController.processReturn);
router.get('/heatmap', inventoryController.getHeatmap);

// Rutas de Carga
router.post('/upload', upload.single('imagen'), uploadController.uploadImage);

module.exports = router;
