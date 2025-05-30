import { useState, useEffect } from "react";

function EditarPuzzleForm({ puzzle, onClose, onSave }) {
  // Soporta edición de todos los campos principales
  const [id, setId] = useState(puzzle.id || "");
  const [tema, setTema] = useState(puzzle.tema || "");
  const [tipo, setTipo] = useState(puzzle.tipo || "");
  const [pieces, setPieces] = useState(puzzle.piezas || []);
  const [connections, setConnections] = useState(puzzle.conexiones || []);
  const [saving, setSaving] = useState(false);

  // Sincroniza campos cuando cambia el puzzle a editar
  useEffect(() => {
    setId(puzzle.id || "");
    setTema(puzzle.tema || "");
    setTipo(puzzle.tipo || "");
    setPieces(puzzle.piezas || []);
    setConnections(puzzle.conexiones || []);
  }, [puzzle.id, puzzle.tema, puzzle.tipo, puzzle.piezas, puzzle.conexiones]);

  // Handlers para piezas
  const handlePieceChange = (i, field, value) => {
    const updated = [...pieces];
    updated[i][field] = value;
    setPieces(updated);
  };
  const addPiece = () =>
    setPieces([...pieces, { id: "", forma: "", posicion_relativa: "" }]);
  const removePiece = (i) =>
    setPieces(pieces.filter((_, idx) => idx !== i));

  // Handlers para conexiones
  const handleConnectionChange = (i, field, value) => {
    const updated = [...connections];
    updated[i][field] = value;
    setConnections(updated);
  };
  const addConnection = () =>
    setConnections([
      ...connections,
      { sourceId: "", targetId: "", sourceSide: "", targetSide: "" },
    ]);
  const removeConnection = (i) =>
    setConnections(connections.filter((_, idx) => idx !== i));

  // Guardar
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Envía todo el objeto actualizado
    await onSave({
      id,
      tema,
      tipo,
      pieces,
      connections,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: 340 }}>
      <h3>Editar Rompecabezas</h3>
      <div style={{ marginBottom: 12 }}>
        <label>ID:</label>
        <input
          value={id}
          onChange={e => setId(e.target.value)}
          className="puzzle-input"
          required
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Tema:</label>
        <input
          value={tema}
          onChange={e => setTema(e.target.value)}
          className="puzzle-input"
          required
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Tipo:</label>
        <input
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          className="puzzle-input"
          required
        />
      </div>
      {/* Edición de piezas */}
      <div style={{ marginBottom: 16 }}>
        <label><b>Piezas:</b></label>
        <button type="button" onClick={addPiece} style={{ marginLeft: 8 }}>+ Añadir Pieza</button>
        {pieces.map((pieza, i) => (
          <div key={i} style={{ marginTop: 8, border: "1px solid #eee", padding: 8, borderRadius: 5 }}>
            <input
              style={{ width: 70, marginRight: 4 }}
              placeholder="ID"
              value={pieza.id}
              onChange={e => handlePieceChange(i, "id", e.target.value)}
            />
            <input
              style={{ width: 70, marginRight: 4 }}
              placeholder="Forma"
              value={pieza.forma}
              onChange={e => handlePieceChange(i, "forma", e.target.value)}
            />
            <input
              style={{ width: 100, marginRight: 4 }}
              placeholder="Posición"
              value={pieza.posicion_relativa}
              onChange={e => handlePieceChange(i, "posicion_relativa", e.target.value)}
            />
            <button type="button" onClick={() => removePiece(i)} style={{ color: "red" }}>X</button>
          </div>
        ))}
      </div>
      {/* Edición de conexiones */}
      <div style={{ marginBottom: 16 }}>
        <label><b>Conexiones:</b></label>
        <button type="button" onClick={addConnection} style={{ marginLeft: 8 }}>+ Añadir</button>
        {connections.map((conn, i) => (
          <div key={i} style={{ marginTop: 8, border: "1px solid #eee", padding: 8, borderRadius: 5 }}>
            <input
              style={{ width: 60, marginRight: 4 }}
              placeholder="Origen"
              value={conn.sourceId}
              onChange={e => handleConnectionChange(i, "sourceId", e.target.value)}
            />
            <input
              style={{ width: 60, marginRight: 4 }}
              placeholder="Destino"
              value={conn.targetId}
              onChange={e => handleConnectionChange(i, "targetId", e.target.value)}
            />
            <input
              style={{ width: 60, marginRight: 4 }}
              placeholder="Lado Origen"
              value={conn.sourceSide}
              onChange={e => handleConnectionChange(i, "sourceSide", e.target.value)}
            />
            <input
              style={{ width: 60, marginRight: 4 }}
              placeholder="Lado Destino"
              value={conn.targetSide}
              onChange={e => handleConnectionChange(i, "targetSide", e.target.value)}
            />
            <button type="button" onClick={() => removeConnection(i)} style={{ color: "red" }}>X</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button type="submit" disabled={saving} className="puzzle-button puzzle-button-success">
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button type="button" className="puzzle-button puzzle-button-danger" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default EditarPuzzleForm;
