const express = require('express');
// Importa TODOS los controladores que vas a usar
const { 
  createPuzzle, 
  getPuzzle, 
  getAllPuzzles, 
  buildPuzzleSteps, 
  getPuzzleInstructions, 
  updatePuzzle,       // <-- AGREGAR ESTE
  deletePuzzle        // <-- Y ESTE SI USAS DELETE
} = require('../controllers/puzzleController');

const router = express.Router();

// Middleware de validación para el registro de puzzles
const validatePuzzleData = (req, res, next) => {
  const { puzzle, pieces } = req.body;
  if (!puzzle || !pieces) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  if (!puzzle.id) {
    return res.status(400).json({ error: 'ID de rompecabezas requerido' });
  }
  next();
};

// Registro de un nuevo puzzle
router.post('/', validatePuzzleData, createPuzzle);

// Obtener todos los puzzles
router.get('/', getAllPuzzles);

// Obtener detalles de un puzzle por ID
router.get('/:id', getPuzzle);
// Editar puzzle
router.put('/:id', updatePuzzle);      
// Eliminar puzzle
router.delete('/:id', deletePuzzle);    

module.exports = router;
// Obtener pasos de armado (BFS/DFS)
router.get('/:id/steps', buildPuzzleSteps);

// Obtener instrucciones con apoc.path.expand (experimental/extra)
router.get('/:id/instrucciones', getPuzzleInstructions);

module.exports = router;
