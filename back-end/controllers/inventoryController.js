const { readData, writeData, readPedidos, writePedidos } = require('../config/database');

exports.getInventory = (req, res) => {
    const productos = readData();
    res.json(productos);
};

exports.getPedidos = (req, res) => {
    const pedidos = readPedidos();
    res.json(pedidos);
};

exports.addPedido = (req, res) => {
    console.log('--- Añadiendo Pedido ---');
    const pedidos = readPedidos();
    
    // Auto-increment ID
    let maxId = 0;
    pedidos.forEach(p => {
        const numId = parseInt(p.id);
        if (!isNaN(numId) && numId > maxId) {
            maxId = numId;
        }
    });
    const nextId = (maxId + 1).toString();

    const nuevoPedido = {
        ...req.body,
        id: nextId,
        fechaCreacion: new Date().toISOString()
    };
    pedidos.push(nuevoPedido);
    writePedidos(pedidos);
    res.json({ success: true, id: nextId });
};

exports.receivePedido = (req, res) => {
    const { id } = req.params;
    let pedidos = readPedidos();
    const pedidoIndex = pedidos.findIndex(p => p.id === id);

    if (pedidoIndex !== -1) {
        const pedido = pedidos[pedidoIndex];
        let productos = readData();

        // Actualizar inventario
        pedido.items.forEach(item => {
            const prodIndex = productos.findIndex(p => p.id === item.id);
            if (prodIndex !== -1) {
                const producto = productos[prodIndex];
                producto.stock_total += item.cantidad;

                if (producto.tallas) {
                    const tallaIndex = producto.tallas.findIndex(t => t.talla === item.talla);
                    if (tallaIndex !== -1) {
                        producto.tallas[tallaIndex].stock += item.cantidad;
                    } else {
                        // Si por alguna razón la talla no existe, la creamos
                        producto.tallas.push({ talla: item.talla, stock: item.cantidad });
                    }
                }
            }
        });

        // Guardar inventario
        writeData(productos);

        // Eliminar pedido de la lista de pendientes
        pedidos.splice(pedidoIndex, 1);
        writePedidos(pedidos);

        res.json({ success: true, message: 'Stock actualizado correctamente' });
    } else {
        res.status(404).json({ error: 'Pedido no encontrado' });
    }
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
