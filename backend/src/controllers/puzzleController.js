const neo4j = require('../utils/neo4j');

const createPuzzle = async (req, res) => {
  const { puzzle, pieces } = req.body;

  try {
    // Crear rompecabezas
    const puzzleQuery = `
      CREATE (r:Rompecabezas {
        id: $id,
        tema: $tema,
        tipo: $tipo
      })
      RETURN r
    `;
    
    await neo4j.executeQuery(puzzleQuery, puzzle);

    // Crear piezas y relaciones
    for (const piece of pieces) {
      const pieceQuery = `
        MATCH (r:Rompecabezas {id: $puzzleId})
        CREATE (p:Pieza {
          id: $id,
          forma: $forma,
          posicion_relativa: $posicion_relativa
        })
        CREATE (p)-[:PERTENECE_A]->(r)
      `;
      
      await neo4j.executeQuery(pieceQuery, {
        puzzleId: puzzle.id,
        ...piece
      });
    }

    // Crear conexiones entre piezas
    for (const connection of req.body.connections || []) {
      const { sourceId, targetId, sourceSide, targetSide } = connection;
      
      const connectionQuery = `
        MATCH (p1:Pieza {id: $sourceId}), (p2:Pieza {id: $targetId})
        CREATE (p1)-[:CONECTA_CON {
          lado: $sourceSide
        }]->(p2)
        CREATE (p2)-[:CONECTA_CON {
          lado: $targetSide
        }]->(p1)
      `;
      
      await neo4j.executeQuery(connectionQuery, {
        sourceId,
        targetId,
        sourceSide,
        targetSide
      });
    }

    res.status(201).json({ message: 'Rompecabezas creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPuzzle = async (req, res) => {
  const { id } = req.params;

  const query = `
    MATCH (r:Rompecabezas {id: $id})
    OPTIONAL MATCH (r)<-[:PERTENECE_A]-(p:Pieza)
    OPTIONAL MATCH (p)-[c:CONECTA_CON]->(p2:Pieza)
    RETURN r, collect(DISTINCT p) AS piezas, collect(DISTINCT {from: p.id, to: p2.id, lado: c.lado}) AS conexiones
  `;

  try {
    const result = await neo4j.executeQuery(query, { id });

    if (!Array.isArray(result) || result.length === 0) {
      return res.status(404).json({ message: 'Rompecabezas no encontrado' });
    }

    const record = result[0];

    const rompecabezas = record.r?.properties || {};
    const piezas = (record.piezas || []).map(p => p?.properties ?? {});
    const conexiones = record.conexiones || [];

    res.json({ rompecabezas, piezas, conexiones });
  } catch (error) {
    console.error('❌ Error en getPuzzle:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createPuzzle, getPuzzle };