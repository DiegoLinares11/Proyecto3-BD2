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
      MERGE (p:Pieza {
        id: $id
      })
      SET p.forma = $forma, p.posicion_relativa = $posicion_relativa
      MERGE (p)-[:PERTENECE_A]->(r)
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

  const query = 
   ` 
  MATCH (r:Rompecabezas {id: $id})
    OPTIONAL MATCH (r)<-[:PERTENECE_A]-(p:Pieza)
    OPTIONAL MATCH (p)-[c:CONECTA_CON]->(p2:Pieza)
    RETURN r, collect(DISTINCT p) AS piezas, collect(DISTINCT {from: p.id, to: p2.id, lado: c.lado}) AS conexiones
    `
  ;

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

  const query = 
  `
    MATCH (r:Rompecabezas {id: $puzzleId})<-[:PERTENECE_A]-(start:Pieza {id: $startId})
    CALL apoc.path.expand(start, 'CONECTA_CON>', null, 0, 100) YIELD path
    WITH nodes(path) AS piezas, relationships(path) AS conexiones
    UNWIND range(0, size(piezas) - 2) AS i
    WITH piezas[i] AS from, piezas[i+1] AS to, conexiones[i] AS conn
    RETURN from.id AS desdeId, from.forma AS formaDesde, from.posicion_relativa AS posDesde,
           conn.lado AS ladoDesde,
           to.id AS haciaId, to.forma AS formaHacia, to.posicion_relativa AS posHacia
  `
  ;

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

      return `Step ${idx + 1}: From piece ${desde} (shape ${formaDesde}, position ${posDesde}), connect it by side ${ladoDesde} with piece ${hacia} (shape ${formaHacia}, position ${posHacia}).`;
    });
    res.json({ instrucciones });
  } catch (error) {
    console.error('Error al obtener instrucciones del rompecabezas:', error);
    res.status(500).json({ error: 'Error al obtener instrucciones.' });
  }
};
async function getPuzzleGraph(puzzleId) {
  const query = 
  `
    MATCH (r:Rompecabezas {id: $puzzleId})<-[:PERTENECE_A]-(p:Pieza)
    OPTIONAL MATCH (p)-[c:CONECTA_CON]->(p2:Pieza)
    RETURN p {
      .id, .forma, .posicion_relativa
    } AS pieza,
    p2 {
      .id, .forma, .posicion_relativa
    } AS destino,
    c.lado AS lado
  `;
  
  const results = await neo4j.executeQuery(query, { puzzleId });

  const graph = {};

  results.forEach(r => {
    if (!r.pieza?.id) return;

    const id = r.pieza.id;
    if (!graph[id]) {
      graph[id] = {
        pieza: r.pieza,
        conexiones: []
      };
    }

    if (r.destino?.id) {
      graph[id].conexiones.push({
        destinoId: r.destino.id,
        destinoPieza: r.destino,
        lado: r.lado
      });
    }
  });

  return graph;
}


// ---- BFS ----
function recorridoBFS(grafo, piezaInicial) {
  const visitados = new Set();
  const pasos = [];
  const queue = [{ actual: piezaInicial, anterior: null, lado: null }];

  while (queue.length > 0) {
    const { actual, anterior, lado } = queue.shift();
    if (visitados.has(actual)) continue;
    visitados.add(actual);

    const pieza = grafo[actual]?.pieza;
    const anteriorPieza = grafo[anterior]?.pieza;

    if (anterior && pieza && anteriorPieza) {
      pasos.push(
        `Desde la pieza ${anterior} (forma ${anteriorPieza.forma}, posición ${anteriorPieza.posicion_relativa}), ` +
        `conéctala por el lado ${lado} con la pieza ${actual} ` +
        `(forma ${pieza.forma}, posición ${pieza.posicion_relativa})`
      );
    }

    for (const conn of grafo[actual]?.conexiones || []) {
      if (!visitados.has(conn.destinoId)) {
        queue.push({ actual: conn.destinoId, anterior: actual, lado: conn.lado });
      }
    }
  }

  // Verifica si hay piezas no alcanzadas
  const todosLosNodos = Object.keys(grafo);
  if (visitados.size < todosLosNodos.length) {
    pasos.push("⚠️ Nota: La solución es parcial. 😒Algunas piezas no están conectadas desde la pieza inicial.");
  }

  return pasos.map((msg, i) => `Paso ${i + 1}: ${msg}`);
}



// ---- DFS 
function recorridoDFS(grafo, piezaInicial) {
  const visitados = new Set();
  const pasos = [];

  function dfs(actual, anterior = null, lado = null) {
    if (visitados.has(actual)) return;
    visitados.add(actual);

    const pieza = grafo[actual]?.pieza;
    const anteriorPieza = grafo[anterior]?.pieza;

    if (anterior && pieza && anteriorPieza) {
      pasos.push(
        `Desde la pieza ${anterior} (forma ${anteriorPieza.forma}, posición ${anteriorPieza.posicion_relativa}), ` +
        `conéctala por el lado ${lado} con la pieza ${actual} ` +
        `(forma ${pieza.forma}, posición ${pieza.posicion_relativa})`
      );
    }

    for (const conn of grafo[actual]?.conexiones || []) {
      dfs(conn.destinoId, actual, conn.lado);
    }
  }

  dfs(piezaInicial);

  //  Verifica si hay piezas no alcanzadas
  const todosLosNodos = Object.keys(grafo);
  if (visitados.size < todosLosNodos.length) {
    pasos.push("⚠️ Nota: La solución es parcial. 😒Algunas piezas no están conectadas desde la pieza inicial.");
  }

  return pasos.map((msg, i) => `Paso ${i + 1}: ${msg}`);
}



// ---- ENDPOINT ----
const buildPuzzleSteps = async (req, res) => {
  const puzzleId = req.params.id;
  const startId = req.query.start;
  const alg = req.query.alg || 'bfs'; 

  if (!startId) {
    return res.status(400).json({ error: 'Debes especificar la pieza inicial con ?start=ID' });
  }
  try {
    const grafo = await getPuzzleGraph(puzzleId);
    let instrucciones;
    if (alg === 'dfs') {
      instrucciones = recorridoDFS(grafo, startId);
    } else {
      instrucciones = recorridoBFS(grafo, startId);
    }
    res.json({ instrucciones });
  } catch (error) {
    console.error('Error al construir el rompecabezas:', error);
    res.status(500).json({ error: error.message });
  }
};
const getAllPuzzles = async (req, res) => {
  try {
    const query = `
      MATCH (r:Rompecabezas)
      RETURN r
    `;
    const result = await neo4j.executeQuery(query);
    const puzzles = result.map(r => r.r.properties);
    res.json(puzzles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// EDITAR rompecabezas
const updatePuzzle = async (req, res) => {
  const { id } = req.params;
  const { tema, tipo } = req.body;
  try {
    const query = `
      MATCH (r:Rompecabezas {id: $id})
      SET r.tema = $tema, r.tipo = $tipo
      RETURN r
    `;
    const result = await neo4j.executeQuery(query, { id, tema, tipo });
    if (!result[0]) return res.status(404).json({ error: "Rompecabezas no encontrado" });
    res.json({ message: "Rompecabezas actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ELIMINAR rompecabezas y todo lo asociado
const deletePuzzle = async (req, res) => {
  const { id } = req.params;
  try {
    // Opcional: Elimina todo (rompecabezas, piezas, relaciones)
    const query = `
      MATCH (r:Rompecabezas {id: $id})
      OPTIONAL MATCH (r)<-[:PERTENECE_A]-(p:Pieza)
      DETACH DELETE r, p
    `;
    await neo4j.executeQuery(query, { id });
    res.json({ message: "Rompecabezas y piezas asociadas eliminados" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  createPuzzle,
  getPuzzle,
  getPuzzleInstructions,
  buildPuzzleSteps,
  getAllPuzzles,
  updatePuzzle,   
  deletePuzzle    
}
