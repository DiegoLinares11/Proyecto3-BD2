
const neo4j = require('../utils/neo4j');

// Construye el grafo del puzzle { piezaId: [{ destinoId, lado }] }
async function getPuzzleGraph(puzzleId) {
  const query = `
    MATCH (r:Rompecabezas {id: $puzzleId})<-[:PERTENECE_A]-(p:Pieza)
    OPTIONAL MATCH (p)-[c:CONECTA_CON]->(p2:Pieza)
    RETURN p.id AS from, p2.id AS to, c.lado AS lado
  `;
  const results = await neo4j.executeQuery(query, { puzzleId });
  const graph = {};
  results.forEach(r => {
    if (!r.from) return;
    if (!graph[r.from]) graph[r.from] = [];
    if (r.to) graph[r.from].push({ destinoId: r.to, lado: r.lado });
  });
  return graph;
}

// Algoritmo BFS para armar el puzzle desde una pieza inicial
function recorridoBFS(grafo, piezaInicial) {
  const visitados = new Set();
  const pasos = [];
  const queue = [{ actual: piezaInicial, anterior: null, lado: null }];

  while (queue.length > 0) {
    const { actual, anterior, lado } = queue.shift();
    if (visitados.has(actual)) continue;
    visitados.add(actual);
    if (anterior) {
      pasos.push(`Conecta la pieza ${actual} al lado ${lado} de ${anterior}`);
    }
    for (const conn of (grafo[actual] || [])) {
      if (!visitados.has(conn.destinoId)) {
        queue.push({ actual: conn.destinoId, anterior: actual, lado: conn.lado });
      }
    }
  }
  return pasos;
}

// Algoritmo DFS alternativo (opcional)
function recorridoDFS(grafo, piezaInicial) {
  const visitados = new Set();
  const pasos = [];
  function dfs(actual, anterior, lado) {
    visitados.add(actual);
    if (anterior) {
      pasos.push(`Conecta la pieza ${actual} al lado ${lado} de ${anterior}`);
    }
    for (const conn of (grafo[actual] || [])) {
      if (!visitados.has(conn.destinoId)) {
        dfs(conn.destinoId, actual, conn.lado);
      }
    }
  }
  dfs(piezaInicial, null, null);
  return pasos;
}

module.exports = { getPuzzleGraph, recorridoBFS, recorridoDFS };
