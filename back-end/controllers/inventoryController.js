const { readData, writeData, readVentas, writeVentas, readPedidos, writePedidos } = require('../config/database');

exports.getPedidos = (req, res) => {
    const pedidos = readPedidos();
    res.json(pedidos);
};

exports.addPedido = (req, res) => {
    const pedidos = readPedidos();
    const nuevoPedido = {
        ...req.body,
        id: Date.now().toString(),
        fechaRegistro: new Date().toISOString()
    };
    pedidos.unshift(nuevoPedido);
    writePedidos(pedidos);
    res.json({ success: true, id: nuevoPedido.id });
};

exports.recibirPedido = (req, res) => {
    const { id } = req.params;
    const pedidos = readPedidos();
    const productos = readData();
    const index = pedidos.findIndex(p => p.id === id);

    if (index !== -1) {
        const pedido = pedidos[index];
        
        // Actualizar stock de cada item en el pedido
        pedido.items.forEach(item => {
            const prodIndex = productos.findIndex(p => p.id === item.id);
            if (prodIndex !== -1) {
                const producto = productos[prodIndex];
                
                // Actualizar talla específica si existe
                if (item.talla && producto.tallas) {
                    const tallaIndex = producto.tallas.findIndex(t => t.talla === item.talla);
                    if (tallaIndex !== -1) {
                        producto.tallas[tallaIndex].stock += item.cantidad;
                    } else {
                        // Si la talla no existe, la creamos (opcional, dependiendo del flujo)
                        producto.tallas.push({ talla: item.talla, stock: item.cantidad });
                    }
                }
                
                // Actualizar stock total
                producto.stock_total = (producto.stock_total || 0) + item.cantidad;
            }
        });

        // Eliminar pedido de la lista de pendientes (o marcarlo como completado)
        // En este caso el frontend parece esperar que se elimine o recargue la lista
        pedidos.splice(index, 1);
        
        writeData(productos);
        writePedidos(pedidos);
        
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Pedido no encontrado' });
    }
};

exports.getInventory = (req, res) => {
    const productos = readData();
    res.json(productos);
};
    
exports.getVentas = (req, res) => {
    const ventas = readVentas();
    res.json(ventas);
};

exports.getTendencias = (req, res) => {
    const productos = readData();
    const ventas = readVentas();
    const temporada = req.query.temporada || 'invierno'; // default to invierno as per user's example

    // 1. Calcular cuáles son los productos más vendidos
    const ventasPorProducto = {};
    ventas.forEach(v => {
        if (!ventasPorProducto[v.productoId]) {
            ventasPorProducto[v.productoId] = { cantidad: 0, nombre: v.productoNombre };
        }
        ventasPorProducto[v.productoId].cantidad += v.cantidadNeta;
    });

    const productosMasVendidos = Object.keys(ventasPorProducto)
        .map(id => ({ id, ...ventasPorProducto[id] }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5); // top 5

    // 2. Calcular cuándo podrían acabarse (predicción)
    // Asumimos ventas totales / 30 como ventas diarias (un mes de datos)
    const prediccionStock = productosMasVendidos.map(pv => {
        const prod = productos.find(p => p.id === pv.id);
        const stockActual = prod ? prod.stock_total : 0;
        const ventasDiarias = pv.cantidad / 30; // Promedio diario
        let diasParaAgotarse = 'Infinito';
        if (ventasDiarias > 0) {
            diasParaAgotarse = Math.ceil(stockActual / ventasDiarias);
        }
        return {
            ...pv,
            stockActual,
            diasParaAgotarse: diasParaAgotarse
        };
    });

    // 3. Recomendación de temporada
    let recomendacion = '';
    const tempLower = temporada.toLowerCase();
    if (tempLower === 'invierno') {
        recomendacion = 'Recomendamos comprar Abrigos, Chamarras y ropa térmica para la temporada de Invierno.';
    } else if (tempLower === 'primavera') {
        recomendacion = 'Recomendamos comprar Camisas ligeras, vestidos de flores y accesorios coloridos para Primavera.';
    } else if (tempLower === 'verano') {
        recomendacion = 'Recomendamos comprar Playeras, shorts y trajes de baño para la temporada de Verano.';
    } else if (tempLower === 'otoño' || tempLower === 'otono') {
        recomendacion = 'Recomendamos comprar Suéteres ligeros, pantalones de pana y bufandas para Otoño.';
    } else {
        recomendacion = 'Recomendamos revisar artículos básicos que se venden bien durante todo el año.';
    }

    res.json({
        temporadaActual: temporada,
        prediccionStock,
        recomendacion
    });
};

exports.getSellThrough = (req, res) => {
    const productos = readData();
    const ventas = readVentas();

    // Sell-through: % of inventory sold over a period
    const stats = productos.map(p => {
        const productSales = ventas.filter(v => v.productoId === p.id);
        const totalSold = productSales.reduce((sum, v) => sum + (v.cantidadNeta || v.cantidad), 0);
        const initialStock = (p.stock_total || 0) + totalSold;
        
        const sellThroughRate = initialStock > 0 ? ((totalSold / initialStock) * 100).toFixed(2) : 0;
        const velocity = totalSold; // Assuming 30 days period for simplicity

        let suggestion = "Mantener";
        if (sellThroughRate > 70 && p.stock_total < 20) suggestion = "Reabastecimiento Automático Sugerido";
        if (sellThroughRate > 50 && p.stock_total >= 20) suggestion = "Alta Rotación";
        if (sellThroughRate < 20 && p.stock_total > 50) suggestion = "Redistribuir a otra sucursal";

        return {
            id: p.id,
            nombre: p.nombre,
            vendidos: totalSold,
            stockActual: p.stock_total,
            sellThrough: sellThroughRate + "%",
            sugerencia: suggestion
        };
    }).filter(s => s.vendidos > 0).sort((a, b) => parseFloat(b.sellThrough) - parseFloat(a.sellThrough));

    res.json(stats);
};

exports.getWeatherPredictions = async (req, res) => {
    try {
        // Integración con Open-Meteo (API pública sin key) para Madrid (ejemplo)
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.4165&longitude=-3.7026&current_weather=true');
        const data = await response.json();
        const temp = data.current_weather.temperature;
        
        let recomendacion = "";
        let prioridad = [];
        
        if (temp < 15) {
            recomendacion = `La temperatura actual es de ${temp}°C (Clima Frío). Se sugiere priorizar en vitrinas y online: Abrigos, suéteres y bufandas.`;
            prioridad = ['Abrigo', 'Suéter', 'Chamarra'];
        } else if (temp >= 15 && temp < 25) {
            recomendacion = `La temperatura actual es de ${temp}°C (Clima Templado). Se sugiere priorizar: Camisas manga larga, pantalones ligeros y chaquetas de entretiempo.`;
            prioridad = ['Camisa', 'Pantalón'];
        } else {
            recomendacion = `La temperatura actual es de ${temp}°C (Clima Cálido). Se sugiere priorizar: Playeras, vestidos, faldas y shorts.`;
            prioridad = ['Playera', 'Vestido', 'Shorts'];
        }

        res.json({ temp, recomendacion, prioridad });
    } catch (error) {
        res.json({ error: "No se pudo obtener el clima", temp: 20, recomendacion: "Clima templado (Simulado). Priorizar ropa de entretiempo." });
    }
};

exports.processReturn = (req, res) => {
    const { id, talla, cantidad, motivo, estado } = req.body;
    const qty = parseInt(cantidad) || 1;
    
    const productos = readData();
    const index = productos.findIndex(p => p.id === id);
    
    if (index !== -1) {
        const producto = productos[index];
        let reintegrado = false;
        
        if (estado === 'perfecto') {
            // Reintegrar al stock
            if (talla && producto.tallas) {
                const tallaIndex = producto.tallas.findIndex(t => t.talla === talla);
                if (tallaIndex !== -1) {
                    producto.tallas[tallaIndex].stock += qty;
                    producto.stock_total += qty;
                    reintegrado = true;
                }
            } else {
                producto.stock_total += qty;
                reintegrado = true;
            }
        }
        
        // Save the product data
        writeData(productos);
        
        // Log in sales/returns history (Optional, but good for tracking)
        const ventas = readVentas();
        ventas.unshift({
            id: 'RET-' + Date.now().toString(),
            fecha: new Date().toISOString(),
            productoId: producto.id,
            productoNombre: producto.nombre,
            cantidad: 0,
            devoluciones: qty,
            cantidadNeta: -qty, // It's a return, so net sold is negative
            precioUnitario: producto.precio || 0,
            total: -(producto.precio || 0) * qty,
            notas: `Devolución: ${motivo}. Reintegrado: ${reintegrado ? 'Sí' : 'No'}`
        });
        writeVentas(ventas);
        
        res.json({ success: true, reintegrado, mensaje: reintegrado ? 'Stock reintegrado correctamente' : 'Producto marcado como merma/tarado.' });
    } else {
        res.status(404).json({ error: 'Producto no encontrado' });
    }
};

exports.getHeatmap = (req, res) => {
    // Simulating zones in a store
    const zonas = ['Zona A (Entrada)', 'Zona B (Centro)', 'Zona C (Fondo)', 'Zona D (Cajas)', 'Aparadores'];
    
    // Generar datos aleatorios para demostración de mapa de calor
    const heatData = zonas.map(zona => ({
        zona,
        trafico_estimado: Math.floor(Math.random() * 500) + 100,
        rotacion: Math.floor(Math.random() * 100) + '%'
    })).sort((a, b) => b.trafico_estimado - a.trafico_estimado);

    res.json(heatData);
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
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const productos = readData();
    const ventas = readVentas();
    const resultados = [];
    let errorOccurred = false;

    // Validate all items first to ensure we have stock for everything (simple validation)
    for (const item of items) {
        const { id, talla, cantidad, devoluciones } = item;
        const qtyVendidas = parseInt(cantidad) || 1;
        const dev = parseInt(devoluciones) || 0;
        const qty = Math.max(0, qtyVendidas - dev);

        const prodIndex = productos.findIndex(p => p.id === id);
        if (prodIndex === -1) {
            errorOccurred = true;
            return res.status(404).json({ error: `Producto con ID ${id} no encontrado` });
        }

        const producto = productos[prodIndex];
        if (talla && producto.tallas) {
            const tallaIndex = producto.tallas.findIndex(t => t.talla === talla);
            if (tallaIndex === -1 || producto.tallas[tallaIndex].stock < qty) {
                errorOccurred = true;
                return res.status(400).json({ error: `No hay stock suficiente de ${producto.nombre} en talla ${talla}` });
            }
        } else if (producto.stock_total < qty) {
            errorOccurred = true;
            return res.status(400).json({ error: `No hay stock suficiente de ${producto.nombre}` });
        }
    }

    if (errorOccurred) return;

    // Process sales
    const saleGroupId = Date.now().toString();
    
    for (const item of items) {
        const { id, talla, cantidad, devoluciones } = item;
        const qtyVendidas = parseInt(cantidad) || 1;
        const dev = parseInt(devoluciones) || 0;
        const qty = Math.max(0, qtyVendidas - dev);

        const producto = productos.find(p => p.id === id);
        
        // Update stock
        if (talla && producto.tallas) {
            const tallaIndex = producto.tallas.findIndex(t => t.talla === talla);
            producto.tallas[tallaIndex].stock -= qty;
            producto.stock_total -= qty;
        } else {
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
        }

        // Record Sale
        const precioVenta = producto.precio || 0;
        const totalVenta = precioVenta * qty;
        ventas.unshift({
            id: saleGroupId + '-' + id,
            saleGroupId: saleGroupId,
            fecha: new Date().toISOString(),
            productoId: producto.id,
            productoNombre: producto.nombre,
            cantidad: qtyVendidas,
            devoluciones: dev,
            cantidadNeta: qty,
            precioUnitario: precioVenta,
            total: totalVenta
        });
    }

    writeData(productos);
    writeVentas(ventas);

    return res.json({ success: true, saleGroupId });
};

exports.sellProductBatch = (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No se enviaron productos válidos.' });
    }

    const productos = readData();
    const ventas = readVentas();
    const batchId = 'BATCH-' + Date.now().toString();
    const fecha = new Date().toISOString();

    let errors = [];
    let itemsProcesados = [];

    // Pre-validate stock
    for (let item of items) {
        const index = productos.findIndex(p => p.id === item.id);
        if (index === -1) {
            errors.push(`Producto ${item.id} no encontrado.`);
            continue;
        }

        const producto = productos[index];
        const qtyVendidas = parseInt(item.cantidad) || 1;
        const dev = parseInt(item.devoluciones) || 0;
        const qty = Math.max(0, qtyVendidas - dev);

        if (producto.stock_total < qty) {
            errors.push(`No hay stock suficiente para ${producto.nombre}.`);
            continue;
        }

        itemsProcesados.push({
            productoIndex: index,
            producto: producto,
            qtyVendidas,
            dev,
            qty
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: 'Errores de validación', details: errors });
    }

    // Process updates
    itemsProcesados.forEach((item, i) => {
        const { producto, qtyVendidas, dev, qty } = item;
        
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

        const precioVenta = producto.precio || 0;
        const totalVenta = precioVenta * qty;

        ventas.unshift({
            id: batchId + '-' + i,
            batchId: batchId,
            fecha: fecha,
            productoId: producto.id,
            productoNombre: producto.nombre,
            cantidad: qtyVendidas,
            devoluciones: dev,
            cantidadNeta: qty,
            precioUnitario: precioVenta,
            total: totalVenta
        });
    });

    writeData(productos);
    writeVentas(ventas);

    res.json({ success: true, batchId });
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
