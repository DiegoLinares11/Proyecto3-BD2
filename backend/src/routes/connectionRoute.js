const express = require('express');
const { getAllConnections, getConnectionById } = require('../controllers/connectionController');
const router = express.Router();

router.get('/', getAllConnections);       // Listar todas las conexiones
router.get('/:id', getConnectionById);    // Obtener una conexión por ID compuesto

module.exports = router;
