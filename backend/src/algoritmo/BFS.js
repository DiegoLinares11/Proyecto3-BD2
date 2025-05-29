const neo4j = require('../utils/neo4j');

const buildPuzzleSteps = async (req, res) => {
  const { startPieceId } = req.params;

  try {
    const visited = new Set();
    const steps = [];

    // Cola para BFS: cada entrada es { currentId, fromId, fromSide }
    const queue = [{ currentId: startPieceId, fromId: null, fromSide: null }];

    while (queue.length > 0) {
      const { currentId, fromId, fromSide } = queue.shift();

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Obtener detalles de la pieza actual
      const query = `
        MATCH (p:Pieza {id: $id})
        OPTIONAL MATCH (p)-[c:CONECTA_CON]->(p2:Pieza)
        RETURN p, collect({toId: p2.id, side: c.lado}) AS conexiones
      `;
      const result = await neo4j.executeQuery(query, { id: currentId });
      const record = result[0];

      const pieza = record.p.properties;
      const conexiones = record.conexiones;

      // Agregar paso
      steps.push({
        piezaId: pieza.id,
        forma: pieza.forma,
        posicion_relativa: pieza.posicion_relativa,
        conectadaDesde: fromId,
        ladoConexion: fromSide
      });

      // Agregar piezas conectadas a la cola
      for (const conexion of conexiones) {
        if (conexion.toId && !visited.has(conexion.toId)) {
          queue.push({
            currentId: conexion.toId,
            fromId: pieza.id,
            fromSide: conexion.side
          });
        }
      }
    }

    res.json({ pasos: steps });
  } catch (error) {
    console.error('Error al construir el rompecabezas:', error);
    res.status(500).json({ error: error.message });
  }
};
