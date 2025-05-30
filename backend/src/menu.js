const readline = require("readline");
const axios = require("axios");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const BASE_URL = "http://localhost:3000/api";

// Promesa para preguntas en consola
const ask = (q) => new Promise((res) => rl.question(q, res));

// Menú principal
const mainMenu = async () => {
  console.log("\n--- MENÚ DE ROMPECABEZAS ---");
  console.log("1. Crear rompecabezas");
  console.log("2. Listar todos los rompecabezas");
  console.log("3. Obtener rompecabezas por ID");
  console.log("4. Listar todas las piezas");
  console.log("5. Obtener pieza por ID");
  console.log("6. Listar todas las relaciones");
  console.log("7. Obtener relación por ID");
  console.log("9. Salir");

  const opt = await ask("\nSeleccione una opción (1-9): ");

  switch (opt.trim()) {
    case "1":
      await crearRompecabezasInteractivo();
      break;
    case "2":
      await listarRompecabezas();
      break;
    case "3":
      await obtenerRompecabezas();
      break;
    case "4":
      await listarPiezas();
      break;
    case "5":
      await obtenerPiezaPorId();
      break;
    case "6":
      await listarRelaciones();
      break;
    case "7":
      await obtenerRelacionPorId();
      break;
    case "8":
      console.log("¡Hasta luego!");
      rl.close();
      process.exit(0);
    default:
      console.log("Opción inválida");
      mainMenu();
  }
};

// --- Funciones de CRUD ---

const crearRompecabezasInteractivo = async () => {
  const id = await ask("ID del rompecabezas: ");
  const tema = await ask("Tema: ");
  const tipo = await ask("Tipo (cuadrado, circular, etc.): ");

  const puzzle = { id, tema, tipo };

  const pieces = [];
  const n = parseInt(await ask("¿Cuántas piezas desea ingresar?: "));
  for (let i = 0; i < n; i++) {
    console.log(`\n Pieza ${i + 1}`);
    const pid = await ask("  ID: ");
    const forma = await ask("  Forma: ");
    const pos = await ask("  Posición relativa: ");
    pieces.push({ id: pid, forma, posicion_relativa: pos });
  }

  const connections = [];
  const c = parseInt(await ask("¿Cuántas conexiones desea ingresar?: "));
  for (let i = 0; i < c; i++) {
    console.log(`\n Conexión ${i + 1}`);
    const sourceId = await ask("  ID de pieza origen: ");
    const targetId = await ask("  ID de pieza destino: ");
    const sourceSide = await ask("  Lado desde origen (ej: abajo): ");
    const targetSide = await ask("  Lado hacia destino (ej: arriba): ");
    connections.push({ sourceId, targetId, sourceSide, targetSide });
  }

  try {
    const res = await axios.post(`${BASE_URL}/puzzles`, {
      puzzle,
      pieces,
      connections,
    });
    console.log("\nRompecabezas creado exitosamente:", res.data.message);
  } catch (err) {
    console.error(" Error al crear rompecabezas:", err.response?.data || err.message);
  }

  mainMenu();
};

// --- Listar todos los rompecabezas ---
const listarRompecabezas = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/puzzles`);
    console.log("\nRompecabezas encontrados:");
    res.data.forEach((p) => {
      console.log(`- ID: ${p.id} | Tema: ${p.tema} | Tipo: ${p.tipo}`);
    });
  } catch (err) {
    console.error(" Error al listar rompecabezas:", err.response?.data || err.message);
  }
  mainMenu();
};

// --- Obtener rompecabezas por ID ---
const obtenerRompecabezas = async () => {
  const id = await ask("Ingrese el ID del rompecabezas: ");
  try {
    const res = await axios.get(`${BASE_URL}/puzzles/${id}`);
    console.log("\nResultado:");
    console.dir(res.data, { depth: null });
  } catch (err) {
    console.error(" Error al obtener rompecabezas:", err.response?.data || err.message);
  }
  mainMenu();
};

// --- Listar todas las piezas ---
const listarPiezas = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/pieces`);
    console.log("\nPiezas encontradas:");
    res.data.forEach((piece) => {
      console.log(`- ID: ${piece.id} | Forma: ${piece.forma} | Posición: ${piece.posicion_relativa}`);
    });
  } catch (err) {
    console.error(" Error al listar piezas:", err.response?.data || err.message);
  }
  mainMenu();
};

// --- Obtener pieza por ID ---
const obtenerPiezaPorId = async () => {
  const id = await ask("Ingrese el ID de la pieza: ");
  try {
    const res = await axios.get(`${BASE_URL}/pieces/${id}`);
    console.log("\nPieza encontrada:");
    console.dir(res.data, { depth: null });
  } catch (err) {
    console.error(" Error al obtener pieza:", err.response?.data || err.message);
  }
  mainMenu();
};

// --- Listar todas las relaciones ---
const listarRelaciones = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/connections`);
    console.log("\nRelaciones encontradas:");
    res.data.forEach((conn) => {
      console.log(`- ${conn.sourceId} [${conn.sourceSide}] --> ${conn.targetId} [${conn.targetSide}]`);
    });
  } catch (err) {
    console.error(" Error al listar relaciones:", err.response?.data || err.message);
  }
  mainMenu();
};

// --- Obtener relación por ID ---
const obtenerRelacionPorId = async () => {
  const id = await ask("Ingrese el ID de la relación: ");
  try {
    const res = await axios.get(`${BASE_URL}/connections/${id}`);
    console.log("\nRelación encontrada:");
    console.dir(res.data, { depth: null });
  } catch (err) {
    console.error(" Error al obtener relación:", err.response?.data || err.message);
  }
  mainMenu();
};

// --- Generar instrucciones ---
const generarInstrucciones = async () => {
  const id = await ask("ID del rompecabezas: ");
  const piezaInicial = await ask("ID de la pieza inicial: ");

  try {
    const res = await axios.get(`${BASE_URL}/puzzles/${id}/instrucciones?start=${piezaInicial}`);
    console.log("\n Instrucciones para armar el rompecabezas:");
    res.data.instrucciones.forEach((linea, i) => {
      console.log(`${i + 1}. ${linea}`);
    });
  } catch (err) {
    console.error("Error al generar instrucciones:", err.response?.data || err.message);
  }
  mainMenu();
};

// Inicia el menú
mainMenu();


