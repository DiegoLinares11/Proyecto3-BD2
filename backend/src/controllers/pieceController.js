const neo4j = require('../utils/neo4j');

// Obtener todas las piezas
const getAllPieces = async (req, res) => {
  try {
    const query = `
      MATCH (p:Pieza)
      RETURN p
    `;
    const result = await neo4j.executeQuery(query);
    const piezas = result.map(r => r.p.properties);
    res.json(piezas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener pieza por ID
const getPieceById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      MATCH (p:Pieza {id: $id})
      OPTIONAL MATCH (p)-[c:CONECTA_CON]->(p2:Pieza)
      RETURN p, collect({to: p2.id, lado: c.lado}) AS conexiones
    `;
    const result = await neo4j.executeQuery(query, { id });
    if (!result[0] || !result[0].p) return res.status(404).json({ error: "Pieza no encontrada" });

    const pieza = result[0].p.properties;
    const conexiones = (result[0].conexiones || []).filter(c => c.to !== null);

    res.json({ ...pieza, conexiones });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// EDITAR pieza
const updatePiece = async (req, res) => {
  const { id } = req.params;
  const { forma, posicion_relativa } = req.body;
  try {
    const query = `
      MATCH (p:Pieza {id: $id})
      SET p.forma = $forma, p.posicion_relativa = $posicion_relativa
      RETURN p
    `;
    const result = await neo4j.executeQuery(query, { id, forma, posicion_relativa });
    if (!result[0]) return res.status(404).json({ error: "Pieza no encontrada" });
    res.json({ message: "Pieza actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ELIMINAR pieza
const deletePiece = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      MATCH (p:Pieza {id: $id})
      DETACH DELETE p
    `;
    await neo4j.executeQuery(query, { id });
    res.json({ message: "Pieza eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = { getAllPieces, getPieceById, updatePiece,  deletePiece};
