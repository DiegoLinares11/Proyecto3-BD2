const neo4j = require('../utils/neo4j');

// Listar todas las conexiones mostrando ambos lados
const getAllConnections = async (req, res) => {
  try {
    const query = `
      MATCH (p1:Pieza)-[c1:CONECTA_CON]->(p2:Pieza)
      OPTIONAL MATCH (p2)-[c2:CONECTA_CON]->(p1)
      RETURN 
        p1.id AS sourceId, 
        c1.lado AS sourceSide, 
        p2.id AS targetId, 
        c2.lado AS targetSide
    `;
    const result = await neo4j.executeQuery(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener una conexión por ID compuesto (sourceId-targetId-sourceSide)
const getConnectionById = async (req, res) => {
  try {
    // id esperado formato: sourceId-targetId-sourceSide
    const { id } = req.params;
    const [sourceId, targetId, sourceSide] = id.split('-');
    if (!sourceId || !targetId || !sourceSide) {
      return res.status(400).json({ error: "Formato de ID de conexión inválido (debe ser sourceId-targetId-sourceSide)" });
    }

    const query = `
      MATCH (p1:Pieza {id: $sourceId})-[c1:CONECTA_CON {lado: $sourceSide}]->(p2:Pieza {id: $targetId})
      OPTIONAL MATCH (p2)-[c2:CONECTA_CON]->(p1)
      RETURN 
        p1.id AS sourceId, 
        c1.lado AS sourceSide, 
        p2.id AS targetId, 
        c2.lado AS targetSide
    `;
    const result = await neo4j.executeQuery(query, { sourceId, targetId, sourceSide });
    if (!result[0]) return res.status(404).json({ error: "Conexión no encontrada" });

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllConnections, getConnectionById };
