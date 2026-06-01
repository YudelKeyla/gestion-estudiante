// ---- ESTRUCTURA DE DATOS EN LOCALSTORAGE ----
const STORAGE_GRUPOS = 'unigrupos';
const STORAGE_ASISTENCIA = 'uniasistencia';

// Función para generar IDs únicos compatible con todos los navegadores
function generarID() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function cargarGrupos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_GRUPOS) || '[]');
  } catch(e) {
    return [];
  }
}
function guardarGrupos(grupos) {
  localStorage.setItem(STORAGE_GRUPOS, JSON.stringify(grupos));
}
function cargarAsistencia() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_ASISTENCIA) || '{}');
  } catch(e) {
    return {};
  }
}
function guardarAsistencia(asistencia) {
  localStorage.setItem(STORAGE_ASISTENCIA, JSON.stringify(asistencia));
}

let grupos = cargarGrupos();
let asistenciaData = cargarAsistencia();
let grupoActualId = null;
let alumnoEditandoId = null;

// Elementos DOM (se ejecuta después de que cargue el DOM)
document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos
  window.vistaGrupos = document.getElementById('vista-grupos');
  window.vistaGrupo = document.getElementById('vista-grupo');
  window.listaGrupos = document.getElementById('lista-grupos');
  window.tituloGrupo = document.getElementById('titulo-grupo');
  window.listaAlumnos = document.getElementById('lista-alumnos');
  window.asistenciaLista = document.getElementById('asistencia-lista');
  window.fechaAsistencia = document.getElementById('fecha-asistencia');
  window.modalAlumno = document.getElementById('modal-alumno');
  window.modalEval = document.getElementById('modal-evaluaciones');
  window.inputNombre = document.getElementById('input-nombre');
  window.inputApellido = document.getElementById('input-apellido');
  window.inputNombreEval = document.getElementById('input-nombre-eval');
  window.inputNota = document.getElementById('input-nota');
  window.nombreAlumnoEval = document.getElementById('nombre-alumno-eval');
  window.listaEvaluaciones = document.getElementById('lista-evaluaciones');
  window.promedioActual = document.getElementById('promedio-actual');

  // Fecha por defecto: hoy
  if (fechaAsistencia) fechaAsistencia.value = new Date().toISOString().split('T')[0];

  // Eventos de navegación
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

  // Botón nuevo grupo
  document.getElementById('btn-nuevo-grupo').addEventListener('click', () => {
    const nombre = prompt('Nombre del grupo (ej: Ing. Informática):');
    if (!nombre) return;
    const año = prompt('Año (1,2,3...):');
    if (!año) return;
    const facultad = prompt('Facultad:');
    if (!facultad) return;
    
    const nuevoGrupo = {
      id: generarID(),
      nombre,
      año: parseInt(año),
      facultad,
      alumnos: []
    };
    grupos.push(nuevoGrupo);
    guardarGrupos(grupos);
    renderGrupos();
    console.log('Grupo agregado:', nuevoGrupo, 'Total grupos:', grupos.length);
  });

  // Botón agregar alumno
  document.getElementById('btn-agregar-alumno').addEventListener('click', () => {
    alumnoEditandoId = null;
    inputNombre.value = '';
    inputApellido.value = '';
    document.getElementById('modal-titulo').textContent = 'Nuevo alumno';
    modalAlumno.classList.remove('oculto');
  });

  // Guardar alumno
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
        id: generarID(),
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

  // Asistencia
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

  // Evaluaciones
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
    renderAlumnos();
  });

  document.getElementById('btn-cerrar-evaluaciones').addEventListener('click', () => {
    modalEval.classList.add('oculto');
  });

  // Cerrar modales clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === modalAlumno) modalAlumno.classList.add('oculto');
    if (e.target === modalEval) modalEval.classList.add('oculto');
  });

  // Render inicial
  renderGrupos();
});

// ---- FUNCIONES (fuera del DOMContentLoaded pero accesibles) ----
function renderGrupos() {
  if (!listaGrupos) return;
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

function abrirEvaluaciones(alumnoId) {
  const grupo = grupos.find(g => g.id === grupoActualId);
  const alumno = grupo?.alumnos.find(a => a.id === alumnoId);
  if (!alumno) return;
  alumnoEditandoId = alumnoId;
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

function eliminarEvaluacion(alumnoId, index) {
  const grupo = grupos.find(g => g.id === grupoActualId);
  const alumno = grupo?.alumnos.find(a => a.id === alumnoId);
  if (!alumno) return;
  alumno.evaluaciones.splice(index, 1);
  guardarGrupos(grupos);
  renderEvaluaciones(alumno);
  renderAlumnos();
}