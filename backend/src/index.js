require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const puzzleRoutes = require('./routes/puzzleRoutes');
const pieceRoutes = require('./routes/piecesRoute');
const connectionRoutes = require('./routes/connectionRoute'); // OJO al nombre

const app = express();

// Middlewares esenciales
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/puzzles', puzzleRoutes);
app.use('/api/pieces', pieceRoutes);
app.use('/api/connections', connectionRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Endpoints disponibles:`);
  console.log(`  - POST   /api/puzzles`);
  console.log(`  - GET    /api/puzzles/:id`);
  console.log(`  - PUT    /api/puzzles/:id`);
  console.log(`  - DELETE /api/puzzles/:id`);
  console.log(`  - GET    /api/pieces`);
  console.log(`  - GET    /api/pieces/:id`);
  console.log(`  - PUT    /api/pieces/:id`);
  console.log(`  - DELETE /api/pieces/:id`);
  console.log(`  - GET    /api/connections`);
  console.log(`  - GET    /api/connections/:id`);
  try {
    require('./menu'); 
  } catch (err) {
    // Opcional: puedes mostrar mensaje si no existe
  }
});
