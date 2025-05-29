const readline = require("readline");
const axios = require("axios");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const BASE_URL = "http://localhost:3000/api/puzzles";

// Promesa para preguntas en consola
const ask = (q) => new Promise((res) => rl.question(q, res));

// Menú principal
const mainMenu = async () => {
  console.log("\n MENÚ DE ROMPECABEZAS");
  console.log("1. Crear rompecabezas");
  console.log("2. Obtener rompecabezas por ID");
  console.log("3. Generar instrucciones para armar rompecabezas");
  console.log("4. Salir");

  const opt = await ask("\nSeleccione una opción (1-3): ");

  switch (opt.trim()) {
    case "1":
      await crearRompecabezasInteractivo();
      break;
    case "2":
      await obtenerRompecabezas();
      break;
    case "3":
        await generarInstrucciones();
        break;
    case "4":
      console.log(" ¡Hasta luego!");
      rl.close();
      process.exit(0);
    default:
      console.log(" Opción inválida");
      mainMenu();
  }
};

// Función para crear rompecabezas
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
    const res = await axios.post(BASE_URL, {
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

const generarInstrucciones = async () => {
  const id = await ask("ID del rompecabezas: ");
  const piezaInicial = await ask("ID de la pieza inicial: ");

  try {
    const res = await axios.get(`${BASE_URL}/${id}/instrucciones?start=${piezaInicial}`);
    console.log("\n Instrucciones para armar el rompecabezas:");
    res.data.instrucciones.forEach((linea, i) => {
      console.log(`${i + 1}. ${linea}`);
    });
  } catch (err) {
    console.error("Error al generar instrucciones:", err.response?.data || err.message);
  }

  mainMenu();
};


// Función para obtener rompecabezas
const obtenerRompecabezas = async () => {
  const id = await ask("Ingrese el ID del rompecabezas: ");

  try {
    const res = await axios.get(`${BASE_URL}/${id}`);
    console.log("\nResultado:");
    console.dir(res.data, { depth: null });
  } catch (err) {
    console.error(" Error al obtener rompecabezas:", err.response?.data || err.message);
  }

  mainMenu();
};

// Inicia el menú
mainMenu();
