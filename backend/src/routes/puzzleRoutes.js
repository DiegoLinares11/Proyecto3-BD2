const express = require('express');
const { createPuzzle, getPuzzle } = require('../controllers/puzzleController');
const router = express.Router();

// Middleware de validación
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

router.post('/', validatePuzzleData, createPuzzle);
router.get('/:id', getPuzzle);
module.exports = router;