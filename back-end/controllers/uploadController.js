exports.uploadImage = (req, res) => {
    console.log('--- Subiendo Imagen ---');
    if (!req.file) return res.status(400).send('No se subió ninguna imagen.');
    const relativePath = `../imagenes/inventario/${req.file.filename}`;
    res.json({ url: relativePath });
};
