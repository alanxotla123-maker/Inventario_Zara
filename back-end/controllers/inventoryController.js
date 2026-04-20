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
        stock_total: parseInt(req.body.stock_total || 0),
        tallas: req.body.tallas || []
    };
    productos.push(nuevo);
    writeData(productos);
    res.json({ success: true, id: nextId });
};

exports.sellProduct = (req, res) => {
    const { id, talla } = req.body;
    const productos = readData();
    const index = productos.findIndex(p => p.id === id);
    
    if (index !== -1) {
        const producto = productos[index];
        // If a specific size is provided, decrement that size
        if (talla && producto.tallas) {
            const tallaIndex = producto.tallas.findIndex(t => t.talla === talla);
            if (tallaIndex !== -1 && producto.tallas[tallaIndex].stock > 0) {
                producto.tallas[tallaIndex].stock -= 1;
                producto.stock_total -= 1;
                writeData(productos);
                return res.json({ success: true });
            } else {
                return res.status(400).json({ error: 'No hay stock de esa talla' });
            }
        } else if (producto.stock_total > 0) {
            // Fallback for items without specific size selected but with stock
            producto.stock_total -= 1;
            if (producto.tallas && producto.tallas.length > 0) {
                // Just decrease the first one that has stock
                const availableTalla = producto.tallas.find(t => t.stock > 0);
                if (availableTalla) availableTalla.stock -= 1;
            }
            writeData(productos);
            return res.json({ success: true });
        } else {
            return res.status(400).json({ error: 'No hay stock' });
        }
    } else {
        res.status(404).json({ error: 'Producto no encontrado' });
    }
};

exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const productos = readData();
    const index = productos.findIndex(p => p.id === id);

    if (index !== -1) {
        // Actualizamos las propiedades enviadas (manteniendo la imagen original si no se envió una nueva)
        productos[index] = { ...productos[index], ...req.body, id: id };
        
        if (req.body.stock_total !== undefined) {
            productos[index].stock_total = parseInt(req.body.stock_total);
        }
        if (req.body.tallas !== undefined) {
            productos[index].tallas = req.body.tallas;
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
