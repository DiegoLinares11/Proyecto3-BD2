import { useState, useEffect } from "react";
import { Plus, Trash2, Play, Puzzle, Search, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import GrafoPuzzle from "./components/GrafoPuzzle";
import './App.css';
import EditarPuzzleForm from "./components/EditarPuzzleForm";

const API_URL = "http://localhost:3000/api";

function App() {
  // Estados para el registro
  const [puzzle, setPuzzle] = useState({ id: "", tema: "", tipo: "" });
  const [pieces, setPieces] = useState([]);
  const [connections, setConnections] = useState([]);

  // Estados para la consulta
  const [puzzles, setPuzzles] = useState([]);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState("");
  const [pasos, setPasos] = useState([]);
  const [alg, setAlg] = useState("bfs");
  const [startId, setStartId] = useState("");

  // Estados de UI
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [solvingLoading, setSolvingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("register");

  // Estado para el grafo
  const [grafo, setGrafo] = useState({ nodes: [], edges: [] });
  const [detallePuzzle, setDetallePuzzle] = useState(null);

  // Función para hacer peticiones HTTP
  const fetchData = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }
  };

  // Consulta de puzzles existentes
  useEffect(() => {
    const loadPuzzles = async () => {
      setLoading(true);
      try {
        const data = await fetchData(`${API_URL}/puzzles`);
        setPuzzles(Array.isArray(data) ? data : []);
      } catch (err) {
        setPuzzles([]);
        setError("Error al cargar los puzzles");
      } finally {
        setLoading(false);
      }
    };
    loadPuzzles();
  }, [message]);

  // Cargar datos del grafo cuando se selecciona un puzzle
  useEffect(() => {
    if (!selectedPuzzleId) {
      setGrafo({ nodes: [], edges: [] });
      return;
    }
    const loadPuzzleData = async () => {
      try {
        const data = await fetchData(`${API_URL}/puzzles/${selectedPuzzleId}`);
        const { piezas = [], conexiones = [] } = data;
        setGrafo({
          nodes: piezas.map((p) => ({
            id: p.id,
            label: `${p.id}\\n${p.forma}\\n${p.posicion_relativa}`,
          })),
          edges: conexiones.map((c) => ({
            source: c.from,
            target: c.to,
            label: c.lado,
          })),
        });
      } catch (err) {
        setGrafo({ nodes: [], edges: [] });
      }
    };
    loadPuzzleData();
  }, [selectedPuzzleId]);

  // Handlers para registro de rompecabezas
  const addPiece = () => setPieces([...pieces, { id: "", forma: "", posicion_relativa: "" }]);
  const addConnection = () =>
    setConnections([...connections, { sourceId: "", targetId: "", sourceSide: "", targetSide: "" }]);

  const removePiece = (index) => {
    const updated = pieces.filter((_, i) => i !== index);
    setPieces(updated);
  };

  const removeConnection = (index) => {
    const updated = connections.filter((_, i) => i !== index);
    setConnections(updated);
  };

  const handlePieceChange = (i, field, value) => {
    const updated = [...pieces];
    updated[i][field] = value;
    setPieces(updated);
  };

  const handleConnectionChange = (i, field, value) => {
    const updated = [...connections];
    updated[i][field] = value;
    setConnections(updated);
  };

  // Crear nuevo rompecabezas
  const submitPuzzle = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await fetchData(`${API_URL}/puzzles`, {
        method: 'POST',
        body: JSON.stringify({
          puzzle,
          pieces,
          connections,
        })
      });
      setMessage("¡Rompecabezas creado exitosamente!");
      setPuzzle({ id: "", tema: "", tipo: "" });
      setPieces([]);
      setConnections([]);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Error al crear el rompecabezas. Verifique los datos e intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Consultar pasos de solución
  const obtenerPasos = async () => {
    setPasos([]);
    setError("");
    setSolvingLoading(true);
    try {
      const data = await fetchData(`${API_URL}/puzzles/${selectedPuzzleId}/steps?start=${startId}&alg=${alg}`);
      setPasos(data.instrucciones || []);
    } catch (err) {
      setError("No se pudo obtener los pasos. Verifique la pieza inicial y el rompecabezas seleccionado.");
    } finally {
      setSolvingLoading(false);
    }
  };

  // EDITAR un puzzle
  const editarPuzzle = async (id, updated) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await fetchData(`${API_URL}/puzzles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setMessage("Rompecabezas actualizado correctamente");
      // Recargar la lista de puzzles
      const data = await fetchData(`${API_URL}/puzzles`);
      setPuzzles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Error al actualizar el rompecabezas");
    } finally {
      setLoading(false);
    }
  };

  // ELIMINAR un puzzle
  const eliminarPuzzle = async (id) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await fetchData(`${API_URL}/puzzles/${id}`, {
        method: 'DELETE',
      });
      setMessage("Rompecabezas eliminado correctamente");
      // Recargar la lista de puzzles
      const data = await fetchData(`${API_URL}/puzzles`);
      setPuzzles(Array.isArray(data) ? data : []);
      setDetallePuzzle(null);
    } catch (err) {
      setError("Error al eliminar el rompecabezas");
    } finally {
      setLoading(false);
    }
  };

  // Modal: ver detalle
  const verDetallePuzzle = async (puzzleId) => {
    setDetallePuzzle(null);
    try {
      const data = await fetchData(`${API_URL}/puzzles/${puzzleId}`);
      setDetallePuzzle({
        id: data.rompecabezas.id,
        tema: data.rompecabezas.tema,
        tipo: data.rompecabezas.tipo,
        piezas: data.piezas,
      });
    } catch (err) {
      setDetallePuzzle({ error: "No se pudo cargar el detalle del puzzle." });
    }
  };
  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`puzzle-tab-button ${activeTab === id ? "puzzle-tab-active" : "puzzle-tab-inactive"
        }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="puzzle-app">
      <div className="puzzle-container">
        {/* Header */}
        <div className="puzzle-header">
          <div className="puzzle-title">
            <Puzzle className="puzzle-title-icon" size={32} />
            <h1>Puzzle Solver</h1>
          </div>
          <p className="puzzle-subtitle">Registra y resuelve rompecabezas con algoritmos de búsqueda</p>
        </div>

        {/* Navigation Tabs */}
        <div className="puzzle-navigation">
          <TabButton id="register" label="Registrar" icon={Plus} />
          <TabButton id="solve" label="Resolver" icon={Play} />
          <TabButton id="view" label="Ver Puzzles" icon={Search} />
        </div>

        {/* Global Messages */}
        {message && (
          <div className="puzzle-message puzzle-message-success">
            <CheckCircle size={20} />
            {message}
          </div>
        )}

        {error && (
          <div className="puzzle-message puzzle-message-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Register Tab */}
        {activeTab === "register" && (
          <div className="puzzle-card">
            <h2 className="puzzle-card-title">
              <Plus size={24} />
              Registrar Nuevo Rompecabezas
            </h2>

            <form onSubmit={submitPuzzle} className="puzzle-form">
              {/* Puzzle Info */}
              <div className="puzzle-form-grid">
                <div className="puzzle-form-group">
                  <label className="puzzle-label">ID del Puzzle</label>
                  <input
                    type="text"
                    placeholder="ej: puzzle_001"
                    value={puzzle.id}
                    required
                    onChange={(e) => setPuzzle({ ...puzzle, id: e.target.value })}
                    className="puzzle-input"
                  />
                </div>
                <div className="puzzle-form-group">
                  <label className="puzzle-label">Tema</label>
                  <input
                    type="text"
                    placeholder="ej: Paisaje, Animales"
                    value={puzzle.tema}
                    required
                    onChange={(e) => setPuzzle({ ...puzzle, tema: e.target.value })}
                    className="puzzle-input"
                  />
                </div>
                <div className="puzzle-form-group">
                  <label className="puzzle-label">Tipo</label>
                  <input
                    type="text"
                    placeholder="ej: 2D, 3D"
                    value={puzzle.tipo}
                    required
                    onChange={(e) => setPuzzle({ ...puzzle, tipo: e.target.value })}
                    className="puzzle-input"
                  />
                </div>
              </div>

              {/* Pieces Section */}
              <div className="puzzle-section">
                <div className="puzzle-section-header">
                  <h3 className="puzzle-section-title">Piezas</h3>
                  <button
                    type="button"
                    onClick={addPiece}
                    className="puzzle-button puzzle-button-primary puzzle-button-small"
                  >
                    <Plus size={16} />
                    Agregar Pieza
                  </button>
                </div>

                <div className="puzzle-items-container">
                  {pieces.map((piece, i) => (
                    <div key={i} className="puzzle-item puzzle-piece-item">
                      <input
                        type="text"
                        placeholder="ID de la pieza"
                        value={piece.id}
                        required
                        onChange={(e) => handlePieceChange(i, "id", e.target.value)}
                        className="puzzle-input"
                      />
                      <input
                        type="text"
                        placeholder="Forma"
                        value={piece.forma}
                        required
                        onChange={(e) => handlePieceChange(i, "forma", e.target.value)}
                        className="puzzle-input"
                      />
                      <input
                        type="text"
                        placeholder="Posición relativa"
                        value={piece.posicion_relativa}
                        required
                        onChange={(e) => handlePieceChange(i, "posicion_relativa", e.target.value)}
                        className="puzzle-input"
                      />
                      <button
                        type="button"
                        onClick={() => removePiece(i)}
                        className="puzzle-button puzzle-button-danger puzzle-button-small"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connections Section */}
              <div className="puzzle-section">
                <div className="puzzle-section-header">
                  <h3 className="puzzle-section-title">Conexiones</h3>
                  <button
                    type="button"
                    onClick={addConnection}
                    className="puzzle-button puzzle-button-success puzzle-button-small"
                  >
                    <Plus size={16} />
                    Agregar Conexión
                  </button>
                </div>

                <div className="puzzle-items-container">
                  {connections.map((connection, i) => (
                    <div key={i} className="puzzle-item puzzle-connection-item">
                      <input
                        type="text"
                        placeholder="ID Origen"
                        value={connection.sourceId}
                        required
                        onChange={(e) => handleConnectionChange(i, "sourceId", e.target.value)}
                        className="puzzle-input"
                      />
                      <input
                        type="text"
                        placeholder="ID Destino"
                        value={connection.targetId}
                        required
                        onChange={(e) => handleConnectionChange(i, "targetId", e.target.value)}
                        className="puzzle-input"
                      />
                      <input
                        type="text"
                        placeholder="Lado Origen"
                        value={connection.sourceSide}
                        required
                        onChange={(e) => handleConnectionChange(i, "sourceSide", e.target.value)}
                        className="puzzle-input"
                      />
                      <input
                        type="text"
                        placeholder="Lado Destino"
                        value={connection.targetSide}
                        required
                        onChange={(e) => handleConnectionChange(i, "targetSide", e.target.value)}
                        className="puzzle-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeConnection(i)}
                        className="puzzle-button puzzle-button-danger puzzle-button-small"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="puzzle-flex" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="puzzle-button puzzle-button-primary"
                >
                  {loading ? <Loader2 size={20} className="puzzle-spinner" /> : <Plus size={20} />}
                  {loading ? "Registrando..." : "Registrar Rompecabezas"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Solve Tab */}
        {activeTab === "solve" && (
          <div className="puzzle-card">
            <h2 className="puzzle-card-title">
              <Play size={24} />
              Resolver Rompecabezas
            </h2>

            <div className="puzzle-results">
              {/* Controls */}
              <div className="puzzle-form">
                <div className="puzzle-form-group">
                  <label className="puzzle-label">Seleccionar Rompecabezas</label>
                  <select
                    value={selectedPuzzleId}
                    onChange={(e) => setSelectedPuzzleId(e.target.value)}
                    className="puzzle-select"
                  >
                    <option value="">Seleccione un rompecabezas</option>
                    {puzzles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.tema}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="puzzle-form-group">
                  <label className="puzzle-label">Pieza Inicial</label>
                  <input
                    type="text"
                    placeholder="ID de la pieza inicial"
                    value={startId}
                    onChange={(e) => setStartId(e.target.value)}
                    className="puzzle-input"
                  />
                </div>

                <div className="puzzle-form-group">
                  <label className="puzzle-label">Algoritmo</label>
                  <select
                    value={alg}
                    onChange={(e) => setAlg(e.target.value)}
                    className="puzzle-select"
                  >
                    <option value="bfs">BFS (Búsqueda en Anchura)</option>
                    <option value="dfs">DFS (Búsqueda en Profundidad)</option>
                  </select>
                </div>

                <button
                  onClick={obtenerPasos}
                  disabled={!selectedPuzzleId || !startId || solvingLoading}
                  className="puzzle-button puzzle-button-success"
                >
                  {solvingLoading ? <Loader2 size={20} className="puzzle-spinner" /> : <Play size={20} />}
                  {solvingLoading ? "Resolviendo..." : "Resolver Puzzle"}
                </button>

                {/* Visualización del Grafo */}
                <div className="puzzle-mt-4">
                  <h3 className="puzzle-section-title puzzle-mb-4">Visualización del Puzzle</h3>
                  <GrafoPuzzle nodes={grafo.nodes} edges={grafo.edges} />
                </div>
              </div>

              {/* Results */}
              <div>
                <h3 className="puzzle-section-title puzzle-mb-4">Pasos de Solución</h3>
                  <p className="puzzle-note-text">
                    <strong>Nota:</strong> Asegúrese de que cuando agarres las piezas estén al derecho antes de comenzar. Guiate por el identificador.
                  </p>
                {pasos.length > 0 ? (
                  <div className="puzzle-steps-container">
                    <ol className="puzzle-steps-list">
                      {pasos.map((paso, i) => (
                        <li key={i} className="puzzle-step-item">
                          <span className="puzzle-step-number">
                            {i + 1}
                          </span>
                          <span className="puzzle-step-text">{paso}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="puzzle-empty-state">
                    <Puzzle size={48} className="puzzle-empty-icon" />
                    <p className="puzzle-empty-text">Los pasos de solución aparecerán aquí</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Tab */}
        {activeTab === "view" && (
          <div className="puzzle-card">
            <h2 className="puzzle-card-title">
              <Search size={24} />
              Rompecabezas Registrados
            </h2>
            {loading ? (
              <div className="puzzle-loading">
                <Loader2 size={32} className="puzzle-spinner" />
              </div>
            ) : puzzles.length > 0 ? (
              <div className="puzzle-grid">
                {puzzles.map((puzzle, i) => (
                  <div
                    key={i}
                    className="puzzle-item-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => verDetallePuzzle(puzzle.id)}
                  >
                    <div className="puzzle-item-header">
                      <Puzzle className="puzzle-item-icon" size={20} />
                      <div className="puzzle-item-content">
                        <h3 className="puzzle-item-title">{puzzle.id}</h3>
                        <p className="puzzle-item-meta">Tema: {puzzle.tema}</p>
                        <p className="puzzle-item-meta">Tipo: {puzzle.tipo}</p>
                      </div>
                    </div>
                    {/* Botones para editar y eliminar */}
                    <div className="puzzle-item-actions" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        className="puzzle-button puzzle-button-primary"
                        onClick={e => {
                          e.stopPropagation();
                          setDetallePuzzle({
                            ...puzzle,
                            modoEdicion: true, // Activar modo edición
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="puzzle-button puzzle-button-danger"
                        onClick={e => {
                          e.stopPropagation();
                          if (window.confirm("¿Seguro que deseas eliminar este rompecabezas?")) {
                            eliminarPuzzle(puzzle.id);
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="puzzle-empty-state">
                <Puzzle size={48} className="puzzle-empty-icon" />
                <p className="puzzle-empty-text">No hay rompecabezas registrados</p>
                <button
                  onClick={() => setActiveTab("register")}
                  className="puzzle-button puzzle-button-primary puzzle-mt-4"
                >
                  Registrar el primero
                </button>
              </div>
            )}
            {/* Puzzle Detail & Edición */}
            {detallePuzzle && (
              <div className="puzzle-modal-overlay" onClick={() => setDetallePuzzle(null)}>
                <div className="puzzle-modal-card" onClick={e => e.stopPropagation()}>
                  <button className="puzzle-modal-close" onClick={() => setDetallePuzzle(null)}>×</button>
                  {detallePuzzle.modoEdicion ? (
                    // FORMULARIO DE EDICIÓN
                    <EditarPuzzleForm
                      puzzle={detallePuzzle}
                      onClose={() => setDetallePuzzle(null)}
                      onSave={async (updated) => {
                        await editarPuzzle(detallePuzzle.id, updated);
                        setDetallePuzzle(null);
                      }}
                    />
                  ) : detallePuzzle.error ? (
                    <p>{detallePuzzle.error}</p>
                  ) : (
                    <>
                      <h3>Detalle de {detallePuzzle.id}</h3>
                      <p>Tema: {detallePuzzle.tema}</p>
                      <p>Tipo: {detallePuzzle.tipo}</p>
                      <p>Cantidad de piezas: {detallePuzzle.piezas?.length || 0}</p>
                      <ul>
                        {detallePuzzle.piezas?.map((pieza, idx) => (
                          <li key={idx}>
                            ID: {pieza.id}, Forma: {pieza.forma}, Posición: {pieza.posicion_relativa}
                          </li>
                        ))}
                      </ul>
                      {/* Botón para editar desde el modal */}
                      <button
                        className="puzzle-button puzzle-button-primary"
                        style={{ marginTop: 16 }}
                        onClick={() => setDetallePuzzle({ ...detallePuzzle, modoEdicion: true })}
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Puzzle Detail */}
        {detallePuzzle && (
          <div className="puzzle-modal-overlay" onClick={() => setDetallePuzzle(null)}>
            <div className="puzzle-modal-card" onClick={e => e.stopPropagation()}>
              <button className="puzzle-modal-close" onClick={() => setDetallePuzzle(null)}>×</button>
              {/* SOLO MUESTRA UNO SEGÚN modoEdicion */}
              {detallePuzzle.modoEdicion ? (
                <EditarPuzzleForm
                  puzzle={detallePuzzle}
                  onClose={() => setDetallePuzzle(null)}
                  onSave={async (updated) => {
                    await editarPuzzle(detallePuzzle.id, updated);
                    setDetallePuzzle(null);
                  }}
                />
              ) : (
                <>
                  <h3>Detalle de {detallePuzzle.id}</h3>
                  <p>Tema: {detallePuzzle.tema}</p>
                  <p>Tipo: {detallePuzzle.tipo}</p>
                  <p>Cantidad de piezas: {detallePuzzle.piezas?.length || 0}</p>
                  {/* ...más detalle aquí... */}
                  <button
                    className="puzzle-button puzzle-button-primary"
                    style={{ marginTop: 16 }}
                    onClick={() => setDetallePuzzle({ ...detallePuzzle, modoEdicion: true })}
                  >
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

