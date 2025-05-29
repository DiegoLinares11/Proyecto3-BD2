require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const puzzleRoutes = require('./routes/puzzleRoutes');

const app = express();

// Middlewares esenciales
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/puzzles', puzzleRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`• Endpoint de rompecabezas: POST http://localhost:${PORT}/api/puzzles`);
});