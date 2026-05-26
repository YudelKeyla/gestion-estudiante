// ---- ESTRUCTURA DE DATOS EN LOCALSTORAGE ----
// grupos: [{ id, nombre (carrera), año, facultad, alumnos: [] }]
// alumnos: dentro de grupo.alumnos -> { id, nombre, apellido, evaluaciones: [{nombre, nota}] }
// asistencia: { [grupoId]: { [fecha]: [idAlumno1, idAlumno2...] } }

const STORAGE_GRUPOS = 'unigrupos';
const STORAGE_ASISTENCIA = 'uniasistencia';

function cargarGrupos() {
  return JSON.parse(localStorage.getItem(STORAGE_GRUPOS) || '[]');
}
function guardarGrupos(grupos) {
  localStorage.setItem(STORAGE_GRUPOS, JSON.stringify(grupos));
}
function cargarAsistencia() {
  return JSON.parse(localStorage.getItem(STORAGE_ASISTENCIA) || '{}');
}
function guardarAsistencia(asistencia) {
  localStorage.setItem(STORAGE_ASISTENCIA, JSON.stringify(asistencia));
}

let grupos = cargarGrupos();
let asistenciaData = cargarAsistencia();
let grupoActualId = null;
let alumnoEditandoId = null; // para evaluaciones

// Elementos DOM
const vistaGrupos = document.getElementById('vista-grupos');
const vistaGrupo = document.getElementById('vista-grupo');
const listaGrupos = document.getElementById('lista-grupos');
const tituloGrupo = document.getElementById('titulo-grupo');
const listaAlumnos = document.getElementById('lista-alumnos');
const asistenciaLista = document.getElementById('asistencia-lista');
const fechaAsistencia = document.getElementById('fecha-asistencia');
const modalAlumno = document.getElementById('modal-alumno');
const modalEval = document.getElementById('modal-evaluaciones');
const inputNombre = document.getElementById('input-nombre');
const inputApellido = document.getElementById('input-apellido');
const inputNombreEval = document.getElementById('input-nombre-eval');
const inputNota = document.getElementById('input-nota');
const nombreAlumnoEval = document.getElementById('nombre-alumno-eval');
const listaEvaluaciones = document.getElementById('lista-evaluaciones');
const promedioActual = document.getElementById('promedio-actual');

// Fecha por defecto: hoy
fechaAsistencia.value = new Date().toISOString().split('T')[0];

// Navegación
document.getElementById('btn-volver-grupos').addEventListener('click', () => {
  vistaGrupo.classList.remove('activa');
  vistaGrupos.classList.add('activa');
  grupoActualId = null;
});

// Pestañas
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
    tab.classList.add('activo');
    const panel = tab.dataset.tab;
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('activo'));
    document.getElementById(`panel-${panel}`).classList.add('activo');
    if (panel === 'asistencia') cargarAsistenciaPanel();
  });
});

// ---- FUNCIONES GRUPOS ----
function renderGrupos() {
  listaGrupos.innerHTML = grupos.map(g => `
    <div class="tarjeta">
      <div class="info">
        <strong>${g.nombre}</strong><br>
        <small>Año ${g.año} · ${g.facultad} · ${g.alumnos.length} alumnos</small>
      </div>
      <div class="acciones-tarjeta">
        <button onclick="eliminarGrupo('${g.id}')" title="Eliminar">🗑️</button>
        <button onclick="abrirGrupo('${g.id}')">Abrir</button>
      </div>
    </div>
  `).join('');
}

function abrirGrupo(id) {
  const grupo = grupos.find(g => g.id === id);
  if (!grupo) return;
  grupoActualId = id;
  tituloGrupo.textContent = `${grupo.nombre} - ${grupo.facultad} (Año ${grupo.año})`;
  vistaGrupos.classList.remove('activa');
  vistaGrupo.classList.add('activa');
  // Reset tabs
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
  document.querySelector('.tab[data-tab="alumnos"]').classList.add('activo');
  document.getElementById('panel-alumnos').classList.add('activo');
  document.getElementById('panel-asistencia').classList.remove('activo');
  renderAlumnos();
}

function eliminarGrupo(id) {
  if (!confirm('¿Eliminar grupo y todos sus datos?')) return;
  grupos = grupos.filter(g => g.id !== id);
  delete asistenciaData[id];
  guardarGrupos(grupos);
  guardarAsistencia(asistenciaData);
  renderGrupos();
  if (grupoActualId === id) {
    vistaGrupo.classList.remove('activa');
    vistaGrupos.classList.add('activa');
  }
}

document.getElementById('btn-nuevo-grupo').addEventListener('click', () => {
  const nombre = prompt('Nombre del grupo (ej: Ing. Informática):');
  if (!nombre) return;
  const año = prompt('Año (1,2,3...):');
  if (!año) return;
  const facultad = prompt('Facultad:');
  if (!facultad) return;
  grupos.push({
    id: crypto.randomUUID(),
    nombre,
    año: parseInt(año),
    facultad,
    alumnos: []
  });
  guardarGrupos(grupos);
  renderGrupos();
});

// ---- FUNCIONES ALUMNOS ----
function renderAlumnos() {
  const grupo = grupos.find(g => g.id === grupoActualId);
  if (!grupo) return;
  listaAlumnos.innerHTML = grupo.alumnos.map(al => {
    const promedio = calcularPromedio(al.evaluaciones);
    return `
      <div class="tarjeta">
        <div class="info">
          ${al.nombre} ${al.apellido} 
          <span style="float:right; font-weight:bold;">${promedio}</span>
        </div>
        <div class="acciones-tarjeta">
          <button onclick="editarAlumno('${al.id}')">✏️</button>
          <button onclick="abrirEvaluaciones('${al.id}')">📊 Evaluar</button>
          <button onclick="eliminarAlumno('${al.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

function calcularPromedio(evaluaciones) {
  if (!evaluaciones || evaluaciones.length === 0) return '-';
  const suma = evaluaciones.reduce((acc, e) => acc + e.nota, 0);
  return (suma / evaluaciones.length).toFixed(2);
}

document.getElementById('btn-agregar-alumno').addEventListener('click', () => {
  alumnoEditandoId = null;
  inputNombre.value = '';
  inputApellido.value = '';
  document.getElementById('modal-titulo').textContent = 'Nuevo alumno';
  modalAlumno.classList.remove('oculto');
});

document.getElementById('btn-guardar-alumno').addEventListener('click', () => {
  const nombre = inputNombre.value.trim();
  const apellido = inputApellido.value.trim();
  if (!nombre || !apellido) return alert('Completa los campos');
  const grupo = grupos.find(g => g.id === grupoActualId);
  if (!grupo) return;
  if (alumnoEditandoId) {
    const al = grupo.alumnos.find(a => a.id === alumnoEditandoId);
    if (al) { al.nombre = nombre; al.apellido = apellido; }
  } else {
    grupo.alumnos.push({
      id: crypto.randomUUID(),
      nombre,
      apellido,
      evaluaciones: []
    });
  }
  guardarGrupos(grupos);
  modalAlumno.classList.add('oculto');
  renderAlumnos();
});

document.getElementById('btn-cancelar-modal').addEventListener('click', () => {
  modalAlumno.classList.add('oculto');
});

function editarAlumno(id) {
  const grupo = grupos.find(g => g.id === grupoActualId);
  const al = grupo?.alumnos.find(a => a.id === id);
  if (!al) return;
  alumnoEditandoId = id;
  inputNombre.value = al.nombre;
  inputApellido.value = al.apellido;
  document.getElementById('modal-titulo').textContent = 'Editar alumno';
  modalAlumno.classList.remove('oculto');
}

function eliminarAlumno(id) {
  if (!confirm('¿Eliminar alumno?')) return;
  const grupo = grupos.find(g => g.id === grupoActualId);
  grupo.alumnos = grupo.alumnos.filter(a => a.id !== id);
  guardarGrupos(grupos);
  renderAlumnos();
}

// ---- ASISTENCIA ----
function cargarAsistenciaPanel() {
  const grupo = grupos.find(g => g.id === grupoActualId);
  if (!grupo) return;
  const fecha = fechaAsistencia.value;
  const presentes = asistenciaData[grupoActualId]?.[fecha] || [];
  asistenciaLista.innerHTML = grupo.alumnos.map(al => `
    <div class="asistencia-item">
      <label>
        <input type="checkbox" value="${al.id}" ${presentes.includes(al.id) ? 'checked' : ''}>
        ${al.nombre} ${al.apellido}
      </label>
    </div>
  `).join('');
}

document.getElementById('btn-guardar-asistencia').addEventListener('click', () => {
  const fecha = fechaAsistencia.value;
  if (!fecha) return alert('Selecciona una fecha');
  const checks = asistenciaLista.querySelectorAll('input[type=checkbox]');
  const presentes = Array.from(checks).filter(c => c.checked).map(c => c.value);
  if (!asistenciaData[grupoActualId]) asistenciaData[grupoActualId] = {};
  asistenciaData[grupoActualId][fecha] = presentes;
  guardarAsistencia(asistenciaData);
  alert('Asistencia guardada');
  cargarAsistenciaPanel();
});

fechaAsistencia.addEventListener('change', cargarAsistenciaPanel);

// ---- EVALUACIONES ----
function abrirEvaluaciones(alumnoId) {
  const grupo = grupos.find(g => g.id === grupoActualId);
  const alumno = grupo?.alumnos.find(a => a.id === alumnoId);
  if (!alumno) return;
  alumnoEditandoId = alumnoId; // para agregar evaluación
  nombreAlumnoEval.textContent = alumno.nombre + ' ' + alumno.apellido;
  renderEvaluaciones(alumno);
  modalEval.classList.remove('oculto');
}

function renderEvaluaciones(alumno) {
  listaEvaluaciones.innerHTML = alumno.evaluaciones.map((e, index) => `
    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
      <span>${e.nombre}</span>
      <span><strong>${e.nota.toFixed(1)}</strong></span>
      <button onclick="eliminarEvaluacion('${alumno.id}', ${index})" style="padding:2px 8px; background:#fee2e2;">✕</button>
    </div>
  `).join('');
  promedioActual.textContent = calcularPromedio(alumno.evaluaciones);
}

document.getElementById('btn-agregar-evaluacion').addEventListener('click', () => {
  const nombre = inputNombreEval.value.trim();
  const nota = parseFloat(inputNota.value);
  if (!nombre || isNaN(nota) || nota < 0 || nota > 5) {
    return alert('Nombre de evaluación válido y nota entre 0 y 5');
  }
  const grupo = grupos.find(g => g.id === grupoActualId);
  const alumno = grupo?.alumnos.find(a => a.id === alumnoEditandoId);
  if (!alumno) return;
  alumno.evaluaciones.push({ nombre, nota });
  guardarGrupos(grupos);
  inputNombreEval.value = '';
  inputNota.value = '';
  renderEvaluaciones(alumno);
  renderAlumnos(); // actualizar promedio en lista
});

function eliminarEvaluacion(alumnoId, index) {
  const grupo = grupos.find(g => g.id === grupoActualId);
  const alumno = grupo?.alumnos.find(a => a.id === alumnoId);
  if (!alumno) return;
  alumno.evaluaciones.splice(index, 1);
  guardarGrupos(grupos);
  renderEvaluaciones(alumno);
  renderAlumnos();
}

document.getElementById('btn-cerrar-evaluaciones').addEventListener('click', () => {
  modalEval.classList.add('oculto');
});

// Cerrar modales con clic fuera (opcional)
window.addEventListener('click', (e) => {
  if (e.target === modalAlumno) modalAlumno.classList.add('oculto');
  if (e.target === modalEval) modalEval.classList.add('oculto');
});

// Inicializar
renderGrupos();