const express = require('express');
const {
  getAllPieces,
  getPieceById,
  updatePiece,
  deletePiece
} = require('../controllers/pieceController');

const router = express.Router();

router.get('/', getAllPieces);
router.get('/:id', getPieceById);
router.put('/:id', updatePiece);
router.delete('/:id', deletePiece);

module.exports = router;
