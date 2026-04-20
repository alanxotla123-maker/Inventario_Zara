const { readData, writeData } = require('../config/database');

exports.getInventory = (req, res) => {
    const productos = readData();
    res.json(productos);
};

exports.addProduct = (req, res) => {
    console.log('--- Añadiendo Producto ---');
    const productos = readData();
    
    // Auto-increment ID
    let maxId = 0;
    productos.forEach(p => {
        const numId = parseInt(p.id);
        if (!isNaN(numId) && numId > maxId) {
            maxId = numId;
        }
    });
    const nextId = (maxId + 1).toString();

    const nuevo = {
        ...req.body,
        id: nextId,
        stock: parseInt(req.body.stock)
    };
    productos.push(nuevo);
    writeData(productos);
    res.json({ success: true, id: nextId });
};

exports.sellProduct = (req, res) => {
    const { id } = req.body;
    const productos = readData();
    const index = productos.findIndex(p => p.id === id);
    
    if (index !== -1 && productos[index].stock > 0) {
        productos[index].stock -= 1;
        writeData(productos);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'No hay stock o producto no encontrado' });
    }
};

exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const productos = readData();
    const index = productos.findIndex(p => p.id === id);

    if (index !== -1) {
        // Actualizamos las propiedades enviadas (manteniendo la imagen original si no se envió una nueva)
        productos[index] = { ...productos[index], ...req.body, id: id };
        // Si hay stock, asegurar que sea numérico
        if (req.body.stock !== undefined) {
            productos[index].stock = parseInt(req.body.stock);
        }
        writeData(productos);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Producto no encontrado' });
    }
};

exports.deleteProduct = (req, res) => {
    const { id } = req.params;
    let productos = readData();
    const index = productos.findIndex(p => p.id === id);

    if (index !== -1) {
        productos.splice(index, 1);
        writeData(productos);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Producto no encontrado' });
    }
};
