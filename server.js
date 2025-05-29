const express = require('express');
const bodyParser = require('body-parser');
const puzzleRoutes = require('./routes/puzzleRoutes');

const app = express();
app.use(bodyParser.json());

// Configuración de rutas
app.use('/api/puzzles', puzzleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});