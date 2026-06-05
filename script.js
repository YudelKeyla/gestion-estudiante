const STORAGE_GRUPOS = 'unigrupos';
const STORAGE_ASISTENCIA = 'uniasistencia';

function generarID() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function cargarGrupos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_GRUPOS) || '[]'); }
  catch(e) { return []; }
}
function guardarGrupos(grupos) { localStorage.setItem(STORAGE_GRUPOS, JSON.stringify(grupos)); }
function cargarAsistencia() {
  try { return JSON.parse(localStorage.getItem(STORAGE_ASISTENCIA) || '{}'); }
  catch(e) { return {}; }
}
function guardarAsistencia(asistencia) { localStorage.setItem(STORAGE_ASISTENCIA, JSON.stringify(asistencia)); }

let grupos = cargarGrupos();
let asistenciaData = cargarAsistencia();
let grupoActualId = null;
let alumnoEditandoId = null;
let grupoEditandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos fijos
  window.vistaGrupos = document.getElementById('vista-grupos');
  window.vistaGrupo = document.getElementById('vista-grupo');
  window.listaGrupos = document.getElementById('lista-grupos');
  window.tituloGrupo = document.getElementById('titulo-grupo');
  window.modalAlumno = document.getElementById('modal-alumno');
  window.modalGrupo = document.getElementById('modal-grupo');
  window.modalEval = document.getElementById('modal-evaluaciones');
  window.modalNuevaEval = document.getElementById('modal-nueva-evaluacion');
  window.modalAsistencia = document.getElementById('modal-asistencia');
  
  // Referencias dentro de modales y paneles
  window.inputNombre = document.getElementById('input-nombre');
  window.inputApellido = document.getElementById('input-apellido');
  window.inputEditarNombre = document.getElementById('input-editar-nombre');
  window.inputEditarAnio = document.getElementById('input-editar-anio');
  window.inputEditarFacultad = document.getElementById('input-editar-facultad');
  window.inputEditarAsignaturas = document.getElementById('input-editar-asignaturas');
  window.inputNombreEval = document.getElementById('input-nombre-eval');
  window.selectAsignatura = document.getElementById('select-asignatura');
  window.inputNota = document.getElementById('input-nota');
  window.nombreAlumnoEval = document.getElementById('nombre-alumno-eval');
  window.listaEvaluaciones = document.getElementById('lista-evaluaciones');
  window.promedioActual = document.getElementById('promedio-actual');
  window.fechaAsistencia = document.getElementById('fecha-asistencia');
  window.asistenciaLista = document.getElementById('asistencia-lista');
  window.inputNombreNuevaEval = document.getElementById('input-nombre-nueva-eval');

  // Inicializar fecha
  if (fechaAsistencia) fechaAsistencia.value = new Date().toISOString().split('T')[0];

  // Navegación principal
  document.getElementById('btn-volver-grupos').addEventListener('click', () => {
    vistaGrupo.classList.remove('activa');
    vistaGrupos.classList.add('activa');
    grupoActualId = null;
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
      tab.classList.add('activo');
      const panel = tab.dataset.tab;
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('activo'));
      document.getElementById(`panel-${panel}`).classList.add('activo');
      if (panel === 'evaluaciones') renderTablaEvaluaciones();
      if (panel === 'asistencia') renderTablaAsistencia();
    });
  });

  // Grupo: nuevo y editar
  document.getElementById('btn-nuevo-grupo').addEventListener('click', () => {
    grupoEditandoId = null;
    document.getElementById('modal-titulo-grupo').textContent = 'Nuevo grupo';
    inputEditarNombre.value = '';
    inputEditarAnio.value = '';
    inputEditarFacultad.value = '';
    inputEditarAsignaturas.value = '';
    modalGrupo.classList.remove('oculto');
  });

  document.getElementById('btn-guardar-editar-grupo').addEventListener('click', () => {
    const nombre = inputEditarNombre.value.trim();
    const año = parseInt(inputEditarAnio.value);
    const facultad = inputEditarFacultad.value.trim();
    if (!nombre || !año || !facultad) return alert('Completa nombre, año y facultad');
    const asignaturas = inputEditarAsignaturas.value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (grupoEditandoId) {
      const grupo = grupos.find(g => g.id === grupoEditandoId);
      if (grupo) {
        grupo.nombre = nombre;
        grupo.año = año;
        grupo.facultad = facultad;
        grupo.asignaturas = asignaturas;
        guardarGrupos(grupos);
        if (grupoActualId === grupo.id) {
          actualizarTituloGrupo();
        }
      }
    } else {
      grupos.push({
        id: generarID(),
        nombre,
        año,
        facultad,
        asignaturas,
        alumnos: []
      });
      guardarGrupos(grupos);
    }
    modalGrupo.classList.add('oculto');
    renderGrupos();
  });

  document.getElementById('btn-cancelar-editar-grupo').addEventListener('click', () => modalGrupo.classList.add('oculto'));

  // Alumno: agregar/editar
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
      grupo.alumnos.push({ id: generarID(), nombre, apellido, evaluaciones: [] });
    }
    guardarGrupos(grupos);
    modalAlumno.classList.add('oculto');
    renderTablaEvaluaciones();
  });

  document.getElementById('btn-cancelar-modal').addEventListener('click', () => modalAlumno.classList.add('oculto'));

  // Nueva evaluación global
  document.getElementById('btn-agregar-evaluacion').addEventListener('click', () => {
    inputNombreNuevaEval.value = '';
    modalNuevaEval.classList.remove('oculto');
  });

  document.getElementById('btn-guardar-nueva-eval').addEventListener('click', () => {
    const nombreEval = inputNombreNuevaEval.value.trim();
    if (!nombreEval) return alert('Ingresa un nombre para la evaluación');
    // Añadir evaluación vacía a todos los alumnos del grupo actual
    const grupo = grupos.find(g => g.id === grupoActualId);
    if (!grupo) return;
    grupo.alumnos.forEach(al => {
      // Verificar si ya existe una evaluación con ese nombre (y sin asignatura) para no duplicar
      const yaExiste = al.evaluaciones.some(e => e.nombre === nombreEval && !e.asignatura);
      if (!yaExiste) {
        al.evaluaciones.push({ nombre: nombreEval, nota: null, asignatura: '' });
      }
    });
    guardarGrupos(grupos);
    modalNuevaEval.classList.add('oculto');
    renderTablaEvaluaciones();
  });

  document.getElementById('btn-cancelar-nueva-eval').addEventListener('click', () => modalNuevaEval.classList.add('oculto'));

  // Modal de asistencia (registrar fecha)
  document.getElementById('btn-registrar-asistencia').addEventListener('click', () => {
    cargarAsistenciaPanel();
    modalAsistencia.classList.remove('oculto');
  });

  document.getElementById('btn-guardar-asistencia').addEventListener('click', () => {
    const fecha = fechaAsistencia.value;
    if (!fecha) return alert('Selecciona una fecha');
    const checks = asistenciaLista.querySelectorAll('input[type=checkbox]');
    const presentes = Array.from(checks).filter(c => c.checked).map(c => c.value);
    if (!asistenciaData[grupoActualId]) asistenciaData[grupoActualId] = {};
    asistenciaData[grupoActualId][fecha] = presentes;
    guardarAsistencia(asistenciaData);
    modalAsistencia.classList.add('oculto');
    renderTablaAsistencia();
  });

  document.getElementById('btn-cancelar-asistencia').addEventListener('click', () => modalAsistencia.classList.add('oculto'));

  // Evaluaciones individuales
  document.getElementById('btn-agregar-evaluacion').addEventListener('click', () => {
    // Este botón es el de "➕" en el modal de evaluaciones, no el global
    const nombre = inputNombreEval.value.trim();
    const nota = parseInt(inputNota.value);
    const asignatura = selectAsignatura.value;
    if (!nombre || isNaN(nota) || nota < 2 || nota > 5) {
      return alert('Nombre de evaluación y nota entera entre 2 y 5');
    }
    const grupo = grupos.find(g => g.id === grupoActualId);
    const alumno = grupo?.alumnos.find(a => a.id === alumnoEditandoId);
    if (!alumno) return;
    alumno.evaluaciones.push({ nombre, nota, asignatura });
    guardarGrupos(grupos);
    inputNombreEval.value = '';
    inputNota.value = '';
    renderEvaluaciones(alumno);
    renderTablaEvaluaciones(); // actualizar tabla
  });

  document.getElementById('btn-cerrar-evaluaciones').addEventListener('click', () => modalEval.classList.add('oculto'));

  // Cerrar modales clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === modalAlumno) modalAlumno.classList.add('oculto');
    if (e.target === modalGrupo) modalGrupo.classList.add('oculto');
    if (e.target === modalEval) modalEval.classList.add('oculto');
    if (e.target === modalNuevaEval) modalNuevaEval.classList.add('oculto');
    if (e.target === modalAsistencia) modalAsistencia.classList.add('oculto');
  });

  renderGrupos();
});

// Funciones globales
function renderGrupos() {
  if (!listaGrupos) return;
  listaGrupos.innerHTML = grupos.map(g => {
    const asignaturas = g.asignaturas?.length ? g.asignaturas.join(', ') : 'Sin asignaturas';
    return `
      <div class="tarjeta">
        <div class="info">
          <strong>${g.nombre}</strong><br>
          <small>Año ${g.año} · ${g.facultad} · ${g.alumnos.length} alumnos</small><br>
          <small>📚 ${asignaturas}</small>
        </div>
        <div class="acciones-tarjeta">
          <button onclick="editarGrupo('${g.id}')" title="Editar">✏️</button>
          <button onclick="eliminarGrupo('${g.id}')" title="Eliminar">🗑️</button>
          <button onclick="abrirGrupo('${g.id}')">Abrir</button>
        </div>
      </div>`;
  }).join('');
}

function actualizarTituloGrupo() {
  const grupo = grupos.find(g => g.id === grupoActualId);
  if (!grupo) return;
  const asignaturas = grupo.asignaturas?.length ? grupo.asignaturas.join(', ') : '';
  tituloGrupo.textContent = `${grupo.nombre} - ${grupo.facultad} (Año ${grupo.año}) ${asignaturas ? '· ' + asignaturas : ''}`;
}

function abrirGrupo(id) {
  const grupo = grupos.find(g => g.id === id);
  if (!grupo) return;
  grupoActualId = id;
  actualizarTituloGrupo();
  vistaGrupos.classList.remove('activa');
  vistaGrupo.classList.add('activa');
  // Activar pestaña Evaluaciones por defecto
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
  document.querySelector('.tab[data-tab="evaluaciones"]').classList.add('activo');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('activo'));
  document.getElementById('panel-evaluaciones').classList.add('activo');
  renderTablaEvaluaciones();
}

function editarGrupo(id) {
  const grupo = grupos.find(g => g.id === id);
  if (!grupo) return;
  grupoEditandoId = id;
  document.getElementById('modal-titulo-grupo').textContent = 'Editar grupo';
  inputEditarNombre.value = grupo.nombre;
  inputEditarAnio.value = grupo.año;
  inputEditarFacultad.value = grupo.facultad;
  inputEditarAsignaturas.value = grupo.asignaturas?.join(', ') || '';
  modalGrupo.classList.remove('oculto');
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
    grupoActualId = null;
  }
}

// Tabla de Evaluaciones
function renderTablaEvaluaciones() {
  const grupo = grupos.find(g => g.id === grupoActualId);
  if (!grupo) return;

  // Obtener todas las evaluaciones únicas (nombre) para las columnas
  const nombresEval = new Set();
  grupo.alumnos.forEach(al => {
    al.evaluaciones.forEach(e => {
      if (e.nombre) nombresEval.add(e.nombre);
    });
  });
  const columnas = Array.from(nombresEval).sort();

  const thead = document.querySelector('#tabla-evaluaciones thead');
  const tbody = document.querySelector('#tabla-evaluaciones tbody');
  
  let htmlHead = '<tr><th>Alumno</th>';
  columnas.forEach(col => {
    htmlHead += `<th>${col}</th>`;
  });
  htmlHead += '<th>Acciones</th></tr>';
  thead.innerHTML = htmlHead;

  let htmlBody = '';
  grupo.alumnos.forEach(al => {
    htmlBody += '<tr>';
    htmlBody += `<td>${al.nombre} ${al.apellido}</td>`;
    columnas.forEach(col => {
      const ev = al.evaluaciones.find(e => e.nombre === col);
      const nota = ev && ev.nota !== null ? ev.nota : '-';
      htmlBody += `<td style="cursor:pointer;" onclick="abrirEvaluaciones('${al.id}')">${nota}</td>`;
    });
    htmlBody += `<td>
      <button onclick="editarAlumno('${al.id}')" title="Editar">✏️</button>
      <button onclick="eliminarAlumno('${al.id}')" title="Eliminar">🗑️</button>
    </td>`;
    htmlBody += '</tr>';
  });
  tbody.innerHTML = htmlBody;
}

// Tabla de Asistencia
function renderTablaAsistencia() {
  const grupo = grupos.find(g => g.id === grupoActualId);
  if (!grupo) return;

  const fechas = asistenciaData[grupoActualId] 
    ? Object.keys(asistenciaData[grupoActualId]).sort() 
    : [];

  const thead = document.querySelector('#tabla-asistencia thead');
  const tbody = document.querySelector('#tabla-asistencia tbody');

  let htmlHead = '<tr><th>Alumno</th>';
  fechas.forEach(f => {
    htmlHead += `<th>${f}</th>`;
  });
  htmlHead += '</tr>';
  thead.innerHTML = htmlHead;

  let htmlBody = '';
  grupo.alumnos.forEach(al => {
    htmlBody += '<tr>';
    htmlBody += `<td>${al.nombre} ${al.apellido}</td>`;
    fechas.forEach(f => {
      const presentes = asistenciaData[grupoActualId][f] || [];
      const presente = presentes.includes(al.id);
      htmlBody += `<td>${presente ? '✓' : '✗'}</td>`;
    });
    htmlBody += '</tr>';
  });
  tbody.innerHTML = htmlBody;
}

function cargarAsistenciaPanel() {
  // Llena el modal de asistencia con checkboxes
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

// Resto de funciones de alumnos y evaluaciones (sin cambios importantes)
function renderEvaluaciones(alumno) {
  listaEvaluaciones.innerHTML = alumno.evaluaciones.map((e, index) => `
    <div style="display:flex; justify-content:space-between; margin-bottom:4px; align-items:center;">
      <span>${e.nombre} ${e.asignatura ? '(' + e.asignatura + ')' : ''}</span>
      <span><strong>${e.nota !== null ? e.nota : '-'}</strong></span>
      <button onclick="eliminarEvaluacion('${alumno.id}', ${index})" style="padding:2px 8px; background:#fee2e2;">✕</button>
    </div>
  `).join('');
  promedioActual.textContent = calcularPromedio(alumno.evaluaciones);
}

function calcularPromedio(evaluaciones) {
  const validas = evaluaciones.filter(e => e.nota !== null);
  if (validas.length === 0) return '-';
  const suma = validas.reduce((acc, e) => acc + e.nota, 0);
  return (suma / validas.length).toFixed(2);
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
  renderTablaEvaluaciones();
  renderTablaAsistencia();
}

function abrirEvaluaciones(alumnoId) {
  const grupo = grupos.find(g => g.id === grupoActualId);
  const alumno = grupo?.alumnos.find(a => a.id === alumnoId);
  if (!alumno) return;
  alumnoEditandoId = alumnoId;
  nombreAlumnoEval.textContent = alumno.nombre + ' ' + alumno.apellido;
  
  // Llenar selector de asignaturas
  selectAsignatura.innerHTML = '<option value="">Sin asignatura</option>';
  if (grupo.asignaturas?.length) {
    grupo.asignaturas.forEach(asig => {
      const option = document.createElement('option');
      option.value = asig;
      option.textContent = asig;
      selectAsignatura.appendChild(option);
    });
  }
  
  renderEvaluaciones(alumno);
  modalEval.classList.remove('oculto');
}

function eliminarEvaluacion(alumnoId, index) {
  const grupo = grupos.find(g => g.id === grupoActualId);
  const alumno = grupo?.alumnos.find(a => a.id === alumnoId);
  if (!alumno) return;
  alumno.evaluaciones.splice(index, 1);
  guardarGrupos(grupos);
  renderEvaluaciones(alumno);
  renderTablaEvaluaciones();
}