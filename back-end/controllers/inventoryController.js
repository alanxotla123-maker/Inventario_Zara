const { readData, writeData, readVentas, writeVentas } = require('../config/database');

exports.getInventory = (req, res) => {
    const productos = readData();
    res.json(productos);
};

exports.getVentas = (req, res) => {
    const ventas = readVentas();
    res.json(ventas);
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
    const { id, talla, cantidad, devoluciones } = req.body;
    const qtyVendidas = parseInt(cantidad) || 1;
    const dev = parseInt(devoluciones) || 0;
    const qty = Math.max(0, qtyVendidas - dev); // Cantidad neta

    const productos = readData();
    const index = productos.findIndex(p => p.id === id);

    if (index !== -1) {
        const producto = productos[index];
        let success = false;

        // If a specific size is provided, decrement that size
        if (talla && producto.tallas) {
            const tallaIndex = producto.tallas.findIndex(t => t.talla === talla);
            if (tallaIndex !== -1 && producto.tallas[tallaIndex].stock >= qty) {
                producto.tallas[tallaIndex].stock -= qty;
                producto.stock_total -= qty;
                success = true;
            } else {
                return res.status(400).json({ error: 'No hay stock suficiente de esa talla' });
            }
        } else if (producto.stock_total >= qty) {
            // Fallback for items without specific size selected but with stock
            producto.stock_total -= qty;
            if (producto.tallas && producto.tallas.length > 0) {
                let remainingQty = qty;
                for (let t of producto.tallas) {
                    if (remainingQty <= 0) break;
                    if (t.stock > 0) {
                        const subtract = Math.min(t.stock, remainingQty);
                        t.stock -= subtract;
                        remainingQty -= subtract;
                    }
                }
            }
            success = true;
        } else {
            return res.status(400).json({ error: 'No hay stock suficiente' });
        }

        if (success) {
            writeData(productos);

            // Registrar Venta
            const ventas = readVentas();
            const precioVenta = producto.precio || 0;
            const totalVenta = precioVenta * qty; // qty es la cantidad neta
            ventas.unshift({
                id: Date.now().toString(),
                fecha: new Date().toISOString(),
                productoId: producto.id,
                productoNombre: producto.nombre,
                cantidad: qtyVendidas,
                devoluciones: dev,
                cantidadNeta: qty,
                precioUnitario: precioVenta,
                total: totalVenta
            });
            writeVentas(ventas);

            return res.json({ success: true });
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
