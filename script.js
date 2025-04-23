//Las palabras a buscar por cada índice
const palabrasPorIndice = {
    1: ["CAERIA", "CAIDOS", "CAQUI", "CARRO", "CONSOLIDAS"],
    2: ["AISLANTE", "AJA", "AJO", "AQUILATAR"],
    3: ["UCLES", "UNI", "URANO", "USA"],
    4: ["CENA", "CESO", "CID", "COPIE", "CROE"],
    5: ["RIAIS", "RILE", "ROIA"],
    6: ["LIA", "LOA"],
    7: ["BOCIO"],
    8: ["SINO"],
    9: ["DAS", "DESATA"],
    10: ["LELAS", "LIVIANO", "LOS"],
    11: ["CACAHUETE", "COENDU"],
    12: ["ACROBACIA", "ARAS", "ASOLAIS"]
};

const DIRECCIONES = [
    { dx: 1, dy: 0, nombre: 'derecha' },
    { dx: -1, dy: 0, nombre: 'izquierda' },
    { dx: 0, dy: 1, nombre: 'abajo' },
    { dx: 0, dy: -1, nombre: 'arriba' },
    { dx: 1, dy: 1, nombre: 'abajo-derecha' },
    { dx: -1, dy: 1, nombre: 'abajo-izquierda' },
    { dx: 1, dy: -1, nombre: 'arriba-derecha' },
    { dx: -1, dy: -1, nombre: 'arriba-izquierda' }
];

const letrasTablero = [
    { letra: 'C', fila: 0, columna: 5, indice: 1 },
    { letra: 'A', fila: 1, columna: 7, indice: 2 },
    { letra: 'U', fila: 2, columna: 4, indice: 3 },
    { letra: 'C', fila: 3, columna: 0, indice: 4 },
    { letra: 'R', fila: 3, columna: 3, indice: 5 },
    { letra: 'L', fila: 4, columna: 4, indice: 6 },
    { letra: 'B', fila: 5, columna: 6, indice: 7 },
    { letra: 'S', fila: 6, columna: 4, indice: 8 },
    { letra: 'D', fila: 7, columna: 5, indice: 9 },
    { letra: 'L', fila: 7, columna: 9, indice: 10 },
    { letra: 'C', fila: 8, columna: 8, indice: 11 },
    { letra: 'A', fila: 9, columna: 6, indice: 12 }
];

let tableroEstado = Array.from({ length: 10 }, () => Array(10).fill(null));
let palabrasColocadas = [];
let palabraSeleccionada = null;
let indiceSeleccionado = null;
let celdaInicial = null;
let modoMover = false;
let palabraMoviendo = null;

// Estado para selección visual
let palabraSeleccionadaPanel = null;
let indiceSeleccionadoPanel = null;

// Variables para modo edición de palabra colocada
let palabraEditando = null;
let palabraEditandoInfo = null;

// Variables para cronómetro
let tiempoInicio = null;
let tiempoFin = null;
let cronometroActivo = false;
let intervaloCronometro = null;

function crearTablero() {
    const tablero = document.getElementById('tablero');
    tablero.innerHTML = '';
    for (let fila = 0; fila < 10; fila++) {
        for (let columna = 0; columna < 10; columna++) {
            const celda = document.createElement('div');
            celda.className = 'celda';
            celda.dataset.fila = fila;
            celda.dataset.columna = columna;
            const letraEnPosicion = letrasTablero.find(
                item => item.fila === fila && item.columna === columna
            );
            if (letraEnPosicion) {
                celda.textContent = letraEnPosicion.letra;
                celda.classList.add('celda-con-letra');
                celda.dataset.indice = letraEnPosicion.indice;
                celda.dataset.letraOriginal = letraEnPosicion.letra;
                const indiceElemento = document.createElement('span');
                indiceElemento.className = 'indice';
                indiceElemento.textContent = letraEnPosicion.indice;
                celda.appendChild(indiceElemento);
                celda.addEventListener('click', () => seleccionarIndiceCelda(celda, letraEnPosicion.indice));
            } else {
                celda.addEventListener('click', () => seleccionarCeldaVacia(celda));
            }
            tablero.appendChild(celda);
        }
    }
    restaurarPalabrasColocadas();
}

function seleccionarIndiceCelda(celda, indice) {
    if (modoMover) return;
    // Si ya hay una selección de palabra y la celda es seleccionable, solo intenta colocar la palabra
    if (palabraSeleccionada && celda.classList.contains('celda-seleccionable')) {
        colocarPalabraEnDireccion(celda);
        return;
    }
    limpiarResaltados();
    celda.classList.add('celda-resaltada');
    indiceSeleccionado = indice;
    celdaInicial = celda;
    mostrarPalabrasDisponibles(indice);
}

function seleccionarCeldaVacia(celda) {
    // Si hay palabra seleccionada y la celda es seleccionable, intenta colocar la palabra
    if (palabraSeleccionada && celda.classList.contains('celda-seleccionable')) {
        colocarPalabraEnDireccion(celda);
        return;
    }
    // Si no es seleccionable, no cambia la selección, ni hace nada
}

function mostrarPalabrasDisponibles(indice) {
    const lista = document.getElementById('lista-palabras-disponibles');
    if (!lista) return; // Protege si el elemento no existe
    lista.innerHTML = '';
    (palabrasPorIndice[indice] || []).forEach(palabra => {
        const colocada = palabrasColocadas.find(p => p.palabra === palabra);
        const item = document.createElement('div');
        item.className = 'palabra-lista' + (colocada ? ' tachada' : '');
        item.textContent = palabra;
        if (!colocada) {
            item.addEventListener('click', () => seleccionarPalabra(palabra));
        } else {
            // Permitir mover o borrar
            const btnMover = document.createElement('button');
            btnMover.textContent = 'Mover';
            btnMover.onclick = e => { e.stopPropagation(); iniciarMoverPalabra(palabra); };
            item.appendChild(btnMover);
            const btnBorrar = document.createElement('button');
            btnBorrar.textContent = 'Borrar';
            btnBorrar.onclick = e => { e.stopPropagation(); borrarPalabra(palabra); };
            item.appendChild(btnBorrar);
        }
        lista.appendChild(item);
    });
}

function seleccionarPalabra(palabra) {
    palabraSeleccionada = palabra;
    mostrarDireccionesValidas();
}

function mostrarDireccionesValidas() {
    limpiarSeleccionables();
    if (!celdaInicial || !palabraSeleccionada) return;
    DIRECCIONES.forEach(dir => {
        const celdas = obtenerCeldasParaPalabra(celdaInicial, palabraSeleccionada, dir, true);
        if (celdas && celdas.length === palabraSeleccionada.length) {
            const celdaFinal = celdas[celdas.length - 1];
            celdaFinal.classList.add('celda-seleccionable');
            celdaFinal.dataset.direccion = JSON.stringify(dir);
        }
    });
}

function obtenerCeldasParaPalabra(celdaInicial, palabra, dir, permitirFinalEnLetraConIndice=false) {
    const filaIni = parseInt(celdaInicial.dataset.fila);
    const colIni = parseInt(celdaInicial.dataset.columna);
    let celdas = [];
    for (let i = 0; i < palabra.length; i++) {
        const f = filaIni + dir.dy * i;
        const c = colIni + dir.dx * i;
        if (f < 0 || f >= 10 || c < 0 || c >= 10) return null;
        const celda = document.querySelector(`.celda[data-fila='${f}'][data-columna='${c}']`);
        if (!celda) return null;
        const letraActual = celda.textContent[0];
        // Si la celda tiene letra (por índice o por palabra colocada), SOLO es válida si la letra coincide exactamente
        if (celda.classList.contains('celda-con-letra') || celda.classList.contains('celda-palabra-colocada')) {
            if (letraActual !== palabra[i]) return null;
        } else if (tableroEstado[f][c] && tableroEstado[f][c] !== palabra[i]) {
            return null;
        }
        celdas.push(celda);
    }
    return celdas;
}

function colocarPalabraEnDireccion(celdaFinal) {
    if (!celdaFinal.dataset.direccion) return;
    const dir = JSON.parse(celdaFinal.dataset.direccion);
    const filaIni = parseInt(celdaInicial.dataset.fila);
    const colIni = parseInt(celdaInicial.dataset.columna);
    let celdas = [];
    for (let i = 0; i < palabraSeleccionada.length; i++) {
        const f = filaIni + dir.dy * i;
        const c = colIni + dir.dx * i;
        const celda = document.querySelector(`.celda[data-fila='${f}'][data-columna='${c}']`);
        celdas.push(celda);
    }
    // Validación final de cruce y espacio
    for (let i = 0; i < palabraSeleccionada.length; i++) {
        const f = filaIni + dir.dy * i;
        const c = colIni + dir.dx * i;
        if (tableroEstado[f][c] && tableroEstado[f][c] !== palabraSeleccionada[i]) {
            mostrarError(celdas[i]);
            return;
        }
    }
    // Si estamos editando una palabra ya colocada, bórrala de su posición original antes de colocarla nueva
    if (palabraEditando && palabraEditandoInfo) {
        // Borra la palabra de su posición original
        const { palabra, inicio, direccion } = palabraEditandoInfo;
        for (let i = 0; i < palabra.length; i++) {
            const f = inicio.fila + direccion.dy * i;
            const c = inicio.columna + direccion.dx * i;
            tableroEstado[f][c] = null;
            const celda = document.querySelector(`.celda[data-fila='${f}'][data-columna='${c}']`);
            if (celda && !letrasTablero.find(item => item.fila === f && item.columna === c)) {
                celda.textContent = '';
                celda.classList.remove('celda-palabra-colocada');
            }
        }
        palabrasColocadas = palabrasColocadas.filter(obj => obj.palabra !== palabraEditando);
    }
    // Colocar palabra
    for (let i = 0; i < palabraSeleccionada.length; i++) {
        const f = filaIni + dir.dy * i;
        const c = colIni + dir.dx * i;
        tableroEstado[f][c] = palabraSeleccionada[i];
        celdas[i].textContent = palabraSeleccionada[i];
        celdas[i].classList.add('celda-palabra-colocada');
        celdas[i].classList.remove('celda-seleccionable');
        // Mantener índice si es celda con letra original
        const letraOrig = letrasTablero.find(item => item.fila === f && item.columna === c);
        if (letraOrig) {
            let indiceElem = celdas[i].querySelector('.indice');
            if (!indiceElem) {
                indiceElem = document.createElement('span');
                indiceElem.className = 'indice';
                indiceElem.textContent = letraOrig.indice;
                celdas[i].appendChild(indiceElem);
            }
            celdas[i].dataset.indice = letraOrig.indice;
        } else {
            if (celdas[i].querySelector('.indice')) celdas[i].querySelector('.indice').remove();
            celdas[i].removeAttribute('data-indice');
        }
    }
    palabrasColocadas.push({ palabra: palabraSeleccionada, indice: indiceSeleccionado, inicio: { fila: filaIni, columna: colIni }, direccion: dir });
    limpiarResaltados();
    limpiarSeleccionables();
    palabraSeleccionada = null;
    celdaInicial = null;
    modoMover = false;
    palabraMoviendo = null;
    palabraEditando = null;
    palabraEditandoInfo = null;
    actualizarListaPalabras();
    comprobarVictoria();
}

function limpiarResaltados() {
    document.querySelectorAll('.celda-resaltada').forEach(c => c.classList.remove('celda-resaltada'));
}
function limpiarSeleccionables() {
    document.querySelectorAll('.celda-seleccionable').forEach(c => {
        c.classList.remove('celda-seleccionable');
        delete c.dataset.direccion;
    });
}

function renderizarPanelGlobalPalabras() {
    const panel = document.getElementById('panel-global-palabras');
    panel.innerHTML = '';
    Object.keys(palabrasPorIndice).forEach(indice => {
        const grupo = document.createElement('div');
        grupo.className = 'grupo-indice';
        grupo.dataset.indice = indice;
        if (indiceSeleccionadoPanel == indice) grupo.classList.add('grupo-indice-resaltado');
        const titulo = document.createElement('div');
        titulo.className = 'indice-titulo';
        titulo.textContent = `Índice ${indice}`;
        grupo.appendChild(titulo);
        palabrasPorIndice[indice].forEach(palabra => {
            const estaEnTablero = palabraEstaEnTablero(palabra);
            const item = document.createElement('div');
            item.className = 'panel-palabra-item';
            if (palabraSeleccionadaPanel === palabra) item.classList.add('palabra-global-seleccionada');
            item.textContent = palabra;
            item.tabIndex = 0;
            if (!estaEnTablero) {
                item.onclick = () => seleccionarPalabraPanel(palabra, indice);
            } else {
                // Si la palabra está en el tablero, permite borrar o editar
                item.onclick = () => mostrarOpcionesPalabraColocada(palabra, indice, item);
            }
            grupo.appendChild(item);
        });
        panel.appendChild(grupo);
    });
}

function seleccionarPalabraPanel(palabra, indice) {
    palabraSeleccionadaPanel = palabra;
    indiceSeleccionadoPanel = indice;
    // Resalta la letra en el tablero
    limpiarResaltados();
    const letraOrig = letrasTablero.find(item => item.indice == indice);
    if (letraOrig) {
        const celda = document.querySelector(`.celda[data-fila='${letraOrig.fila}'][data-columna='${letraOrig.columna}']`);
        celda.classList.add('celda-resaltada');
        celdaInicial = celda;
    }
    palabraSeleccionada = palabra;
    indiceSeleccionado = indice;
    mostrarDireccionesValidas();
    renderizarPanelGlobalPalabras();
}

function mostrarOpcionesPalabraColocada(palabra, indice, itemDiv) {
    // Quita otros menús de opciones
    document.querySelectorAll('.panel-opciones-palabra').forEach(e => e.remove());
    // Crea el menú de opciones
    const opciones = document.createElement('span');
    opciones.className = 'panel-opciones-palabra';
    opciones.innerHTML = `
        <button class="btn-borrar-palabra">Borrar</button>
        <button class="btn-editar-palabra">Editar</button>
    `;
    itemDiv.appendChild(opciones);
    opciones.addEventListener('click', e => e.stopPropagation());
    opciones.querySelector('.btn-borrar-palabra').onclick = (e) => {
        e.stopPropagation();
        borrarPalabra(palabra);
        renderizarPanelGlobalPalabras();
    };
    opciones.querySelector('.btn-editar-palabra').onclick = (e) => {
        e.stopPropagation();
        activarEdicionPalabra(palabra, indice);
        opciones.remove();
    };
    setTimeout(() => {
        document.addEventListener('click', function cerrarMenu(ev) {
            if (!opciones.contains(ev.target)) {
                opciones.remove();
                document.removeEventListener('click', cerrarMenu);
            }
        });
    }, 10);
}

function activarEdicionPalabra(palabra, indice) {
    // Busca la info de la palabra colocada
    const obj = palabrasColocadas.find(p => p.palabra === palabra);
    if (!obj) return;
    palabraEditando = palabra;
    palabraEditandoInfo = { ...obj };
    // Resalta la letra en el tablero
    limpiarResaltados();
    const letraOrig = letrasTablero.find(item => item.indice == indice);
    if (letraOrig) {
        const celda = document.querySelector(`.celda[data-fila='${letraOrig.fila}'][data-columna='${letraOrig.columna}']`);
        celda.classList.add('celda-resaltada');
        celdaInicial = celda;
    }
    palabraSeleccionada = palabra;
    indiceSeleccionado = indice;
    mostrarDireccionesValidas();
    mostrarMensaje('Selecciona la nueva posición para la palabra.');
}

function palabraEstaEnTablero(palabra) {
    // Busca si la palabra está formada en el tablero, en cualquier dirección, pero SOLO si empieza en la celda con el índice correcto
    // Encuentra el índice correspondiente a esta palabra
    let indice = null;
    for (const [ind, arr] of Object.entries(palabrasPorIndice)) {
        if (arr.includes(palabra)) {
            indice = parseInt(ind);
            break;
        }
    }
    if (!indice) return false;
    // Busca la celda de inicio (con el índice correspondiente)
    const letraOrig = letrasTablero.find(item => item.indice === indice);
    if (!letraOrig) return false;
    const filaIni = letraOrig.fila;
    const colIni = letraOrig.columna;
    for (const dir of DIRECCIONES) {
        let encaja = true;
        for (let i = 0; i < palabra.length; i++) {
            const f = filaIni + dir.dy * i;
            const c = colIni + dir.dx * i;
            if (f < 0 || f >= 10 || c < 0 || c >= 10) {
                encaja = false;
                break;
            }
            // Acepta letra si está en tableroEstado o si es letra original con índice
            const letraTablero = tableroEstado[f][c];
            const letraOriginal = letrasTablero.find(item => item.fila === f && item.columna === c)?.letra;
            if (letraTablero !== palabra[i] && letraOriginal !== palabra[i]) {
                encaja = false;
                break;
            }
        }
        if (encaja) return true;
    }
    return false;
}

function actualizarListaPalabras() {
    // Marca en azul fuerte todas las letras de palabras encontradas automáticamente
    Object.values(palabrasPorIndice).flat().forEach(palabra => {
        if (palabraEstaEnTablero(palabra)) {
            marcarPalabraEnTablero(palabra);
        }
    });
    renderizarPanelGlobalPalabras();
}

function marcarPalabraEnTablero(palabra) {
    let indice = null;
    for (const [ind, arr] of Object.entries(palabrasPorIndice)) {
        if (arr.includes(palabra)) {
            indice = parseInt(ind);
            break;
        }
    }
    if (!indice) return;
    const letraOrig = letrasTablero.find(item => item.indice === indice);
    if (!letraOrig) return;
    const filaIni = letraOrig.fila;
    const colIni = letraOrig.columna;
    for (const dir of DIRECCIONES) {
        let celdas = [];
        let encaja = true;
        for (let i = 0; i < palabra.length; i++) {
            const f = filaIni + dir.dy * i;
            const c = colIni + dir.dx * i;
            if (f < 0 || f >= 10 || c < 0 || c >= 10) {
                encaja = false;
                break;
            }
            const letraTablero = tableroEstado[f][c];
            const letraOriginal = letrasTablero.find(item => item.fila === f && item.columna === c)?.letra;
            if (letraTablero !== palabra[i] && letraOriginal !== palabra[i]) {
                encaja = false;
                break;
            }
            celdas.push({f, c});
        }
        if (encaja) {
            for (const {f, c} of celdas) {
                const celda = document.querySelector(`.celda[data-fila='${f}'][data-columna='${c}']`);
                celda.classList.add('celda-palabra-colocada');
                // Si tenía índice, vuelve a agregarlo
                const letraOrigObj = letrasTablero.find(item => item.fila === f && item.columna === c);
                if (letraOrigObj && celda.querySelector('.indice') === null) {
                    const indiceElem = document.createElement('span');
                    indiceElem.className = 'indice';
                    indiceElem.textContent = letraOrigObj.indice;
                    celda.appendChild(indiceElem);
                    celda.dataset.indice = letraOrigObj.indice;
                }
            }
            break;
        }
    }
}

function restaurarPalabrasColocadas() {
    // Limpia el tablero y coloca las palabras ya puestas
    for (let fila = 0; fila < 10; fila++) {
        for (let col = 0; col < 10; col++) {
            tableroEstado[fila][col] = null;
            const celda = document.querySelector(`.celda[data-fila='${fila}'][data-columna='${col}']`);
            if (celda && !letrasTablero.find(item => item.fila === fila && item.columna === col)) {
                celda.textContent = '';
                celda.classList.remove('celda-palabra-colocada');
            }
        }
    }
    palabrasColocadas.forEach(obj => {
        const { palabra, inicio, direccion } = obj;
        for (let i = 0; i < palabra.length; i++) {
            const f = inicio.fila + direccion.dy * i;
            const c = inicio.columna + direccion.dx * i;
            tableroEstado[f][c] = palabra[i];
            const celda = document.querySelector(`.celda[data-fila='${f}'][data-columna='${c}']`);
            if (celda) {
                celda.textContent = palabra[i];
                celda.classList.add('celda-palabra-colocada');
            }
        }
    });
    actualizarListaPalabras();
}

function mostrarError(celda) {
    celda.classList.add('celda-error');
    setTimeout(() => celda.classList.remove('celda-error'), 600);
}

function borrarPalabra(palabra) {
    palabrasColocadas = palabrasColocadas.filter(obj => obj.palabra !== palabra);
    restaurarPalabrasColocadas();
    limpiarResaltados();
    limpiarSeleccionables();
    palabraSeleccionada = null;
    celdaInicial = null;
    comprobarVictoria();
}

function iniciarMoverPalabra(palabra) {
    // Busca el objeto palabraColocada
    const obj = palabrasColocadas.find(p => p.palabra === palabra);
    if (!obj) return;
    // Elimina la palabra del tablero
    borrarPalabra(palabra);
    // Activa el modo mover y prepara la recolocación
    modoMover = true;
    palabraMoviendo = palabra;
    palabraSeleccionada = palabra;
    indiceSeleccionado = obj.indice;
    // Busca la celda del índice original
    const letraOrig = letrasTablero.find(item => item.indice === obj.indice);
    if (letraOrig) {
        const celda = document.querySelector(`.celda[data-fila='${letraOrig.fila}'][data-columna='${letraOrig.columna}']`);
        celdaInicial = celda;
        limpiarResaltados();
        celda.classList.add('celda-resaltada');
        mostrarDireccionesValidas();
        mostrarMensaje('Selecciona la nueva posición para la palabra.');
    }
}

function mostrarMensaje(mensaje, tipo = "normal") {
    const divVictoria = document.getElementById('mensaje-victoria');
    if (tipo === 'victoria' || mensaje.startsWith('¡Felicidades!')) {
        divVictoria.textContent = mensaje;
        divVictoria.style.display = 'block';
    } else {
        // Si tienes otro sistema de mensajes, ponlo aquí
        alert(mensaje); // O usa tu sistema de mensajes flotantes
    }
}

function comprobarVictoria() {
    // 1. Todas las palabras deben estar en el tablero
    const todasPalabras = Object.values(palabrasPorIndice).flat();
    const todasEnTablero = todasPalabras.every(palabraEstaEnTablero);
    // 2. No debe haber ninguna celda vacía (todas deben tener letra de origen o colocada)
    let tableroLleno = true;
    for (let f = 0; f < 10; f++) {
        for (let c = 0; c < 10; c++) {
            const letraColocada = tableroEstado[f][c];
            const letraOriginal = letrasTablero.find(item => item.fila === f && item.columna === c)?.letra;
            if (!letraColocada && !letraOriginal) {
                tableroLleno = false;
                break;
            }
        }
        if (!tableroLleno) break;
    }
    if (todasEnTablero && tableroLleno) {
        detenerCronometro();
        const segundos = Math.floor((tiempoFin - tiempoInicio) / 1000);
        const minutos = Math.floor(segundos / 60);
        const seg = segundos % 60;
        mostrarMensaje(`¡Felicidades! Has completado la cruzisopa en ${minutos}m ${seg < 10 ? '0' : ''}${seg}s.`, 'victoria');
    }
}

function limpiarSeleccionVisual() {
    palabraSeleccionadaPanel = null;
    indiceSeleccionadoPanel = null;
}

function actualizarCronometro() {
    if (!cronometroActivo || !tiempoInicio) return;
    const ahora = tiempoFin ? tiempoFin : Date.now();
    const segundos = Math.floor((ahora - tiempoInicio) / 1000);
    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;
    document.getElementById('cronometro').textContent = `${minutos < 10 ? '0' : ''}${minutos}:${seg < 10 ? '0' : ''}${seg}`;
}

function iniciarCronometro() {
    if (!cronometroActivo) {
        tiempoInicio = Date.now();
        tiempoFin = null;
        cronometroActivo = true;
        if (intervaloCronometro) clearInterval(intervaloCronometro);
        intervaloCronometro = setInterval(actualizarCronometro, 1000);
        actualizarCronometro();
    }
}

function detenerCronometro() {
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = null;
    tiempoFin = Date.now();
    actualizarCronometro();
    cronometroActivo = false;
}

function setupCronometroListeners() {
    const panel = document.getElementById('panel-global-palabras');
    const tablero = document.getElementById('tablero');
    if (!panel || !tablero) return;
    function startIfNeeded() {
        iniciarCronometro();
        panel.removeEventListener('click', startIfNeeded);
        tablero.removeEventListener('click', tableroStartIfNeeded);
    }
    function tableroStartIfNeeded(e) {
        const celda = e.target.closest('.celda-con-letra');
        if (celda && celda.dataset.indice) {
            iniciarCronometro();
            panel.removeEventListener('click', startIfNeeded);
            tablero.removeEventListener('click', tableroStartIfNeeded);
        }
    }
    panel.addEventListener('click', startIfNeeded);
    tablero.addEventListener('click', tableroStartIfNeeded);
}

window.onload = () => {
    crearTablero();
    actualizarListaPalabras();
    document.getElementById('cronometro').textContent = '00:00';
    tiempoInicio = null;
    tiempoFin = null;
    cronometroActivo = false;
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = null;
    setupCronometroListeners();
};

document.getElementById('btnReinicio').addEventListener('click', () => {
    palabrasColocadas = [];
    palabraSeleccionada = null;
    indiceSeleccionado = null;
    celdaInicial = null;
    modoMover = false;
    palabraMoviendo = null;
    limpiarSeleccionVisual();
    crearTablero();
    actualizarListaPalabras();
    detenerCronometro();
    tiempoInicio = null;
    tiempoFin = null;
    cronometroActivo = false;
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = null;
    document.getElementById('cronometro').textContent = '00:00';
    const divVictoria = document.getElementById('mensaje-victoria');
    divVictoria.style.display = 'none';
});
