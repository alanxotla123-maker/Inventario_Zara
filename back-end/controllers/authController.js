const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '../../front-end/bd/usuarios.json');

const login = (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!fs.existsSync(usersFilePath)) {
            return res.status(500).json({ error: 'Base de datos de usuarios no encontrada.' });
        }

        const data = fs.readFileSync(usersFilePath, 'utf8');
        const users = JSON.parse(data);

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Remove password before sending to frontend
            const { password, ...userWithoutPassword } = user;
            res.json({ success: true, user: userWithoutPassword });
        } else {
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    login
};
