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
    console.error(' Error en getPuzzle:', error);
    res.status(500).json({ error: error.message });
  }
};

const getPuzzleInstructions = async (req, res) => {
  const { id: puzzleId } = req.params;
  const startId = req.query.start;

  if (!startId) {
    return res.status(400).json({ error: 'Debe proporcionar el ID de la pieza inicial con ?start=...' });
  }

  const query = `
    MATCH (r:Rompecabezas {id: $puzzleId})<-[:PERTENECE_A]-(start:Pieza {id: $startId})
    CALL apoc.path.expand(start, 'CONECTA_CON>', null, 0, 100) YIELD path
    WITH nodes(path) AS piezas, relationships(path) AS conexiones
    UNWIND range(0, size(piezas) - 2) AS i
    WITH piezas[i] AS from, piezas[i+1] AS to, conexiones[i] AS conn
    RETURN from.id AS desdeId, from.forma AS formaDesde, from.posicion_relativa AS posDesde,
           conn.lado AS ladoDesde,
           to.id AS haciaId, to.forma AS formaHacia, to.posicion_relativa AS posHacia
  `;

  try {
    const result = await neo4j.executeQuery(query, { puzzleId, startId });

    const instrucciones = result.map((record, idx) => {
      const desde = record.desdeId;
      const formaDesde = record.formaDesde;
      const posDesde = record.posDesde;
      const ladoDesde = record.ladoDesde;

      const hacia = record.haciaId;
      const formaHacia = record.formaHacia;
      const posHacia = record.posHacia;

      return `Paso ${idx + 1}: Desde la pieza ${desde} (forma ${formaDesde}, posición ${posDesde}), conéctala por el lado ${ladoDesde} con la pieza ${hacia} (forma ${formaHacia}, posición ${posHacia}).`;
    });

    res.json({ instrucciones });
  } catch (error) {
    console.error('Error al obtener instrucciones del rompecabezas:', error);
    res.status(500).json({ error: 'Error al obtener instrucciones.' });
  }
};

const buildPuzzleSteps = async (req, res) => {
  const puzzleId = req.params.id;
  const startId = req.query.start;

  if (!startId) {
    return res.status(400).json({ error: 'Debes especificar la pieza inicial con ?start=ID' });
  }

  try {
    const visited = new Set();
    const steps = [];

    // Cola para BFS: cada entrada es { currentId, fromId, fromSide }
    const queue = [{ currentId: startId, fromId: null, fromSide: null }];

    while (queue.length > 0) {
      const { currentId, fromId, fromSide } = queue.shift();

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Obtener datos de la pieza actual y sus conexiones
      const query = `
        MATCH (p:Pieza {id: $id})-[:PERTENECE_A]->(r:Rompecabezas {id: $puzzleId})
        OPTIONAL MATCH (p)-[c:CONECTA_CON]->(p2:Pieza)
        RETURN p, collect({to: p2, lado: c.lado}) AS conexiones
      `;

      const result = await neo4j.executeQuery(query, { id: currentId, puzzleId });
      const record = result[0];

      const pieza = record.p.properties;
      const conexiones = record.conexiones;

      // Si esta pieza vino de otra, agrega paso
      if (fromId && fromSide) {
        steps.push({
          texto: `Desde la pieza ${fromId} (forma ${pieza.forma}, posición ${pieza.posicion_relativa}), ` +
                 `conéctala por el lado ${fromSide} con la pieza ${pieza.id} ` +
                 `(forma ${pieza.forma}, posición ${pieza.posicion_relativa})`
        });
      }

      // Añadir piezas conectadas a la cola
      for (const conexion of conexiones) {
        if (conexion.to && conexion.to.properties && !visited.has(conexion.to.properties.id)) {
          queue.push({
            currentId: conexion.to.properties.id,
            fromId: pieza.id,
            fromSide: conexion.lado
          });
        }
      }
    }

    const instrucciones = steps.map((step, i) => `Paso ${i + 1}: ${step.texto}`);
    res.json({ instrucciones });
  } catch (error) {
    console.error('Error al construir el rompecabezas:', error);
    res.status(500).json({ error: 'No se pudieron construir las instrucciones.' });
  }
};

module.exports = { 
    createPuzzle, 
    getPuzzle, 
    getPuzzleInstructions,
    buildPuzzleSteps
};