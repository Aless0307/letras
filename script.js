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
    const lista = document.getElementById('lista-palabras');
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
        const celdas = obtenerCeldasParaPalabra(celdaInicial, palabraSeleccionada, dir);
        if (celdas && celdas.length === palabraSeleccionada.length) {
            const celdaFinal = celdas[celdas.length - 1];
            celdaFinal.classList.add('celda-seleccionable');
            celdaFinal.dataset.direccion = JSON.stringify(dir);
        }
    });
}

function obtenerCeldasParaPalabra(celdaInicial, palabra, dir) {
    const filaIni = parseInt(celdaInicial.dataset.fila);
    const colIni = parseInt(celdaInicial.dataset.columna);
    let celdas = [];
    for (let i = 0; i < palabra.length; i++) {
        const f = filaIni + dir.dy * i;
        const c = colIni + dir.dx * i;
        if (f < 0 || f >= 10 || c < 0 || c >= 10) return null;
        const celda = document.querySelector(`.celda[data-fila='${f}'][data-columna='${c}']`);
        if (!celda) return null;
        // Validación de cruce
        const letraActual = celda.textContent[0];
        if (celda.classList.contains('celda-con-letra')) {
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
            const indiceElem = document.createElement('span');
            indiceElem.className = 'indice';
            indiceElem.textContent = letraOrig.indice;
            celdas[i].appendChild(indiceElem);
            celdas[i].dataset.indice = letraOrig.indice;
        } else {
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
        const titulo = document.createElement('div');
        titulo.className = 'indice-titulo';
        titulo.textContent = `Índice ${indice}`;
        grupo.appendChild(titulo);
        palabrasPorIndice[indice].forEach(palabra => {
            // Verifica si la palabra está en el tablero (no solo en palabrasColocadas)
            const estaEnTablero = palabraEstaEnTablero(palabra);
            const item = document.createElement('div');
            item.className = 'palabra-global' + (estaEnTablero ? ' tachada' : '');
            item.textContent = palabra;
            grupo.appendChild(item);
        });
        panel.appendChild(grupo);
    });
}

function palabraEstaEnTablero(palabra) {
    // Busca si la palabra está formada en el tablero en cualquier dirección y posición
    for (let fila = 0; fila < 10; fila++) {
        for (let col = 0; col < 10; col++) {
            for (const dir of DIRECCIONES) {
                let encaja = true;
                for (let i = 0; i < palabra.length; i++) {
                    const f = fila + dir.dy * i;
                    const c = col + dir.dx * i;
                    if (f < 0 || f >= 10 || c < 0 || c >= 10) {
                        encaja = false;
                        break;
                    }
                    if (tableroEstado[f][c] !== palabra[i]) {
                        encaja = false;
                        break;
                    }
                }
                if (encaja) return true;
            }
        }
    }
    return false;
}

function actualizarListaPalabras() {
    renderizarPanelGlobalPalabras();
    Object.keys(palabrasPorIndice).forEach(indice => {
        mostrarPalabrasDisponibles(indice);
    });
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

function mostrarMensaje(msg) {
    let div = document.getElementById('mensaje-usuario');
    if (!div) {
        div = document.createElement('div');
        div.id = 'mensaje-usuario';
        div.style.margin = '15px';
        div.style.fontWeight = 'bold';
        document.body.insertBefore(div, document.body.firstChild);
    }
    div.textContent = msg;
    setTimeout(() => { div.textContent = ''; }, 2000);
}

function comprobarVictoria() {
    let total = 0, colocadas = 0;
    Object.values(palabrasPorIndice).forEach(arr => total += arr.length);
    colocadas = palabrasColocadas.length;
    if (colocadas === total) {
        mostrarMensaje('¡Felicidades! Has completado el juego.');
    }
}

document.getElementById('btnReinicio').addEventListener('click', () => {
    palabrasColocadas = [];
    palabraSeleccionada = null;
    indiceSeleccionado = null;
    celdaInicial = null;
    modoMover = false;
    palabraMoviendo = null;
    crearTablero();
    actualizarListaPalabras();
});

window.onload = () => {
    crearTablero();
    actualizarListaPalabras();
};
