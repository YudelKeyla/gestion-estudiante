// ==================== AUTENTICACIÓN ====================
const PIN_POR_DEFECTO = '1234';
let pinCorrecto = localStorage.getItem('pin') || PIN_POR_DEFECTO;
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const pinInput = document.getElementById('pinInput');
const btnIngresar = document.getElementById('btnIngresar');
const pinError = document.getElementById('pinError');

function verificarSesion() {
    if (sessionStorage.getItem('autenticado') === 'true') {
        mostrarApp();
    }
}
function mostrarApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'block';
    sessionStorage.setItem('autenticado', 'true');
}
btnIngresar.addEventListener('click', () => {
    if (pinInput.value === pinCorrecto) {
        mostrarApp();
        pinError.style.display = 'none';
        pinInput.value = '';
    } else {
        pinError.style.display = 'block';
        pinInput.value = '';
    }
});
// Teclado numérico
document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        if (value === 'clear') pinInput.value = pinInput.value.slice(0, -1);
        else if (pinInput.value.length < 4) pinInput.value += value;
        if (pinInput.value.length === 4) setTimeout(() => btnIngresar.click(), 100);
    });
});
pinInput.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/[^0-9]/g, '').slice(0, 4);
});
verificarSesion();

// ==================== DATOS ====================
let facultades = [];
let carreras = [];
let anios = ['1ro','2do','3ro','4to','5to'];
let grupos = []; // {id, facultad, carrera, anio, letra}
let estudiantes = []; // {id, nombre, apellidos, grupoId}
let asistencias = []; // {fecha, grupoId, registros: [{estudianteId, estado}]}
let evaluaciones = []; // {id, tipo, descripcion, fecha, grupoId, notas: [{estudianteId, nota}]}

function cargarDatos() {
    const datos = localStorage.getItem('datosAcademicos');
    if (datos) {
        const parsed = JSON.parse(datos);
        facultades = parsed.facultades || [];
        carreras = parsed.carreras || [];
        grupos = parsed.grupos || [];
        estudiantes = parsed.estudiantes || [];
        asistencias = parsed.asistencias || [];
        evaluaciones = parsed.evaluaciones || [];
    }
}
function guardarDatos() {
    localStorage.setItem('datosAcademicos', JSON.stringify({
        facultades, carreras, grupos, estudiantes, asistencias, evaluaciones
    }));
}
cargarDatos();

// ==================== NAVEGACIÓN ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        if (btn.dataset.tab === 'estudiantes') actualizarListaEstudiantes();
        else if (btn.dataset.tab === 'asistencia') { cargarGruposEnSelect('grupoAsistencia'); actualizarAsistencia(); }
        else if (btn.dataset.tab === 'evaluaciones') { cargarGruposEnSelect('grupoEvaluacion'); actualizarListaEvaluaciones(); }
        else if (btn.dataset.tab === 'grupos') actualizarListaGrupos();
        else if (btn.dataset.tab === 'resumen') actualizarResumen();
    });
});

// ==================== GRUPOS ====================
document.getElementById('btnAgregarGrupo').addEventListener('click', () => {
    const facultad = document.getElementById('nombreFacultad').value.trim();
    const carrera = document.getElementById('nombreCarrera').value.trim();
    const anio = document.getElementById('anioCarrera').value;
    const letra = document.getElementById('letraGrupo').value.trim();
    if (!facultad || !carrera || !letra) return alert('Completa todos los campos');
    if (!facultades.includes(facultad)) facultades.push(facultad);
    if (!carreras.includes(carrera)) carreras.push(carrera);
    const existe = grupos.find(g => g.facultad === facultad && g.carrera === carrera && g.anio === anio && g.letra === letra);
    if (existe) return alert('El grupo ya existe');
    grupos.push({ id: Date.now(), facultad, carrera, anio, letra });
    guardarDatos();
    actualizarListaGrupos();
    document.getElementById('nombreFacultad').value = '';
    document.getElementById('nombreCarrera').value = '';
    document.getElementById('letraGrupo').value = '';
});

function actualizarListaGrupos() {
    const div = document.getElementById('listaGrupos');
    if (grupos.length === 0) {
        div.innerHTML = '<div class="empty-state">No hay grupos creados</div>';
        return;
    }
    div.innerHTML = grupos.map(g => `
        <div class="grupo-item">
            <div>${g.facultad} - ${g.carrera} (${g.anio}) Grupo ${g.letra}</div>
            <button onclick="eliminarGrupo(${g.id})">🗑️</button>
        </div>
    `).join('');
}
function eliminarGrupo(id) {
    if (!confirm('¿Eliminar grupo?')) return;
    grupos = grupos.filter(g => g.id !== id);
    guardarDatos();
    actualizarListaGrupos();
}
document.getElementById('btnLimpiarGrupos').addEventListener('click', () => {
    if (confirm('¿Eliminar todos los grupos?')) {
        grupos = [];
        guardarDatos();
        actualizarListaGrupos();
    }
});

function cargarGruposEnSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Selecciona un grupo</option>';
    grupos.forEach(g => {
        const option = document.createElement('option');
        option.value = g.id;
        option.textContent = `${g.facultad} - ${g.carrera} (${g.anio}) Grupo ${g.letra}`;
        select.appendChild(option);
    });
}

// ==================== ESTUDIANTES ====================
document.getElementById('btnGuardarEstudiante').addEventListener('click', () => {
    const nombre = document.getElementById('nombreEstudiante').value.trim();
    const apellidos = document.getElementById('apellidosEstudiante').value.trim();
    const grupoId = parseInt(document.getElementById('grupoEstudiante').value);
    const editandoId = document.getElementById('editandoIdEstudiante').value;
    if (!nombre || !apellidos || !grupoId) return alert('Completa todos los campos');
    if (editandoId) {
        const idx = estudiantes.findIndex(e => e.id == editandoId);
        if (idx !== -1) {
            estudiantes[idx].nombre = nombre;
            estudiantes[idx].apellidos = apellidos;
            estudiantes[idx].grupoId = grupoId;
        }
        document.getElementById('editandoIdEstudiante').value = '';
        document.getElementById('btnCancelarEstudiante').style.display = 'none';
        document.getElementById('formTitleEstudiante').textContent = '➕ Agregar Estudiante';
    } else {
        estudiantes.push({ id: Date.now(), nombre, apellidos, grupoId });
    }
    guardarDatos();
    actualizarListaEstudiantes();
    document.getElementById('nombreEstudiante').value = '';
    document.getElementById('apellidosEstudiante').value = '';
});
function editarEstudiante(id) {
    const est = estudiantes.find(e => e.id === id);
    if (!est) return;
    document.getElementById('nombreEstudiante').value = est.nombre;
    document.getElementById('apellidosEstudiante').value = est.apellidos;
    document.getElementById('grupoEstudiante').value = est.grupoId;
    document.getElementById('editandoIdEstudiante').value = est.id;
    document.getElementById('formTitleEstudiante').textContent = '✏️ Editar Estudiante';
    document.getElementById('btnCancelarEstudiante').style.display = 'inline-block';
}
document.getElementById('btnCancelarEstudiante').addEventListener('click', () => {
    document.getElementById('editandoIdEstudiante').value = '';
    document.getElementById('nombreEstudiante').value = '';
    document.getElementById('apellidosEstudiante').value = '';
    document.getElementById('grupoEstudiante').value = '';
    document.getElementById('formTitleEstudiante').textContent = '➕ Agregar Estudiante';
    document.getElementById('btnCancelarEstudiante').style.display = 'none';
});
function actualizarListaEstudiantes() {
    cargarGruposEnSelect('grupoEstudiante');
    const div = document.getElementById('listaEstudiantes');
    const termino = document.getElementById('buscarEstudiante')?.value?.toLowerCase() || '';
    let filtrados = estudiantes;
    if (termino) {
        filtrados = estudiantes.filter(e => (e.nombre + ' ' + e.apellidos).toLowerCase().includes(termino));
    }
    document.getElementById('cantidadEstudiantes').textContent = estudiantes.length;
    if (filtrados.length === 0) {
        div.innerHTML = '<div class="empty-state">No se encontraron estudiantes</div>';
        return;
    }
    div.innerHTML = filtrados.map(e => {
        const grupo = grupos.find(g => g.id === e.grupoId);
        const nombreGrupo = grupo ? `${grupo.facultad} - ${grupo.carrera} (${grupo.anio}) Grupo ${grupo.letra}` : 'Sin grupo';
        return `<div class="estudiante-item">
            <div><strong>${e.nombre} ${e.apellidos}</strong><br><small>${nombreGrupo}</small></div>
            <div>
                <button onclick="editarEstudiante(${e.id})">✏️</button>
                <button onclick="eliminarEstudiante(${e.id})">🗑️</button>
            </div>
        </div>`;
    }).join('');
}
function eliminarEstudiante(id) {
    if (!confirm('¿Eliminar estudiante?')) return;
    estudiantes = estudiantes.filter(e => e.id !== id);
    guardarDatos();
    actualizarListaEstudiantes();
}
document.getElementById('buscarEstudiante').addEventListener('input', actualizarListaEstudiantes);
document.getElementById('btnLimpiarBusquedaEstudiante').addEventListener('click', () => {
    document.getElementById('buscarEstudiante').value = '';
    actualizarListaEstudiantes();
});

// ==================== ASISTENCIA ====================
document.getElementById('grupoAsistencia').addEventListener('change', actualizarAsistencia);
document.getElementById('fechaAsistencia').addEventListener('change', actualizarAsistencia);

function actualizarAsistencia() {
    const grupoId = parseInt(document.getElementById('grupoAsistencia').value);
    const fecha = document.getElementById('fechaAsistencia').value;
    const div = document.getElementById('listaAsistencia');
    if (!grupoId || !fecha) {
        div.innerHTML = '<p>Selecciona grupo y fecha.</p>';
        return;
    }
    const ests = estudiantes.filter(e => e.grupoId === grupoId);
    if (ests.length === 0) {
        div.innerHTML = '<p>No hay estudiantes en este grupo.</p>';
        return;
    }
    let registro = asistencias.find(a => a.grupoId === grupoId && a.fecha === fecha);
    if (!registro) {
        registro = { fecha, grupoId, registros: ests.map(e => ({ estudianteId: e.id, estado: 'presente' })) };
        asistencias.push(registro);
        guardarDatos();
    }
    div.innerHTML = ests.map(e => {
        const estadoActual = registro.registros.find(r => r.estudianteId === e.id)?.estado || 'presente';
        return `<div class="estudiante-item">
            <span>${e.nombre} ${e.apellidos}</span>
            <select onchange="cambiarEstado(${e.id}, this.value, ${grupoId}, '${fecha}')">
                <option value="presente" ${estadoActual === 'presente' ? 'selected' : ''}>Presente</option>
                <option value="ausente" ${estadoActual === 'ausente' ? 'selected' : ''}>Ausente</option>
                <option value="tarde" ${estadoActual === 'tarde' ? 'selected' : ''}>Tarde</option>
            </select>
        </div>`;
    }).join('');
}
function cambiarEstado(estudianteId, estado, grupoId, fecha) {
    const registro = asistencias.find(a => a.grupoId === grupoId && a.fecha === fecha);
    if (registro) {
        const reg = registro.registros.find(r => r.estudianteId === estudianteId);
        if (reg) reg.estado = estado;
        guardarDatos();
    }
}
document.getElementById('btnGuardarAsistencia').addEventListener('click', () => {
    alert('Asistencia guardada automáticamente al cambiar estados.');
});

// ==================== EVALUACIONES ====================
document.getElementById('grupoEvaluacion').addEventListener('change', cargarNotasEvaluacion);
function cargarNotasEvaluacion() {
    const grupoId = parseInt(document.getElementById('grupoEvaluacion').value);
    const div = document.getElementById('listaNotas');
    if (!grupoId) {
        div.innerHTML = '<p>Selecciona un grupo.</p>';
        return;
    }
    const ests = estudiantes.filter(e => e.grupoId === grupoId);
    if (ests.length === 0) {
        div.innerHTML = '<p>No hay estudiantes en este grupo.</p>';
        return;
    }
    div.innerHTML = ests.map(e => `
        <div class="estudiante-item">
            <span>${e.nombre} ${e.apellidos}</span>
            <input type="number" id="nota_${e.id}" min="1" max="5" step="0.1" placeholder="Nota" style="width:80px;">
        </div>
    `).join('');
}
document.getElementById('btnGuardarEvaluacion').addEventListener('click', () => {
    const tipo = document.getElementById('tipoEvaluacion').value;
    const descripcion = document.getElementById('descripcionEvaluacion').value.trim();
    const fecha = document.getElementById('fechaEvaluacion').value;
    const grupoId = parseInt(document.getElementById('grupoEvaluacion').value);
    if (!descripcion || !fecha || !grupoId) return alert('Completa todos los campos');
    const notas = [];
    estudiantes.filter(e => e.grupoId === grupoId).forEach(e => {
        const notaInput = document.getElementById(`nota_${e.id}`);
        if (notaInput && notaInput.value) {
            const nota = parseFloat(notaInput.value);
            if (nota >= 1 && nota <= 5) notas.push({ estudianteId: e.id, nota });
        }
    });
    if (notas.length === 0) return alert('Asigna al menos una nota');
    evaluaciones.push({ id: Date.now(), tipo, descripcion, fecha, grupoId, notas });
    guardarDatos();
    actualizarListaEvaluaciones();
    alert('Evaluación guardada correctamente.');
    document.getElementById('descripcionEvaluacion').value = '';
    document.getElementById('fechaEvaluacion').value = '';
    cargarNotasEvaluacion();
});
function actualizarListaEvaluaciones() {
    const div = document.getElementById('listaEvaluaciones');
    if (evaluaciones.length === 0) {
        div.innerHTML = '<div class="empty-state">No hay evaluaciones</div>';
        return;
    }
    div.innerHTML = evaluaciones.map(ev => {
        const grupo = grupos.find(g => g.id === ev.grupoId);
        const nombreGrupo = grupo ? `${grupo.facultad} - ${grupo.carrera} (${grupo.anio}) Grupo ${grupo.letra}` : '?';
        return `<div class="evaluacion-item">
            <div><strong>${ev.tipo.toUpperCase()}</strong>: ${ev.descripcion}<br><small>${fecha} - ${nombreGrupo}</small></div>
            <button onclick="eliminarEvaluacion(${ev.id})">🗑️</button>
        </div>`;
    }).join('');
}
function eliminarEvaluacion(id) {
    if (!confirm('¿Eliminar evaluación?')) return;
    evaluaciones = evaluaciones.filter(ev => ev.id !== id);
    guardarDatos();
    actualizarListaEvaluaciones();
}

// ==================== RESUMEN (PROMEDIOS) ====================
function actualizarResumen() {
    const div = document.getElementById('tablaPromedios');
    if (estudiantes.length === 0) {
        div.innerHTML = '<p>No hay estudiantes para mostrar promedios.</p>';
        return;
    }
    let html = '<table><tr><th>Estudiante</th><th>Grupo</th><th>Promedio</th></tr>';
    estudiantes.forEach(e => {
        let suma = 0, cantidad = 0;
        evaluaciones.forEach(ev => {
            const nota = ev.notas.find(n => n.estudianteId === e.id);
            if (nota) { suma += nota.nota; cantidad++; }
        });
        const promedio = cantidad > 0 ? (suma / cantidad).toFixed(2) : 'N/A';
        const grupo = grupos.find(g => g.id === e.grupoId);
        const nombreGrupo = grupo ? `${grupo.facultad} - ${grupo.carrera} (${grupo.anio}) Grupo ${grupo.letra}` : 'Sin grupo';
        html += `<tr><td>${e.nombre} ${e.apellidos}</td><td>${nombreGrupo}</td><td>${promedio}</td></tr>`;
    });
    html += '</table>';
    div.innerHTML = html;
}

// ==================== RESPALDO Y RESTAURACIÓN ====================
document.getElementById('btnRespaldar').addEventListener('click', () => {
    const datos = { facultades, carreras, grupos, estudiantes, asistencias, evaluaciones };
    const blob = new Blob([JSON.stringify(datos)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_academico_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});
document.getElementById('btnRestaurar').addEventListener('click', () => {
    document.getElementById('inputRestaurar').click();
});
document.getElementById('inputRestaurar').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const datos = JSON.parse(ev.target.result);
            facultades = datos.facultades || [];
            carreras = datos.carreras || [];
            grupos = datos.grupos || [];
            estudiantes = datos.estudiantes || [];
            asistencias = datos.asistencias || [];
            evaluaciones = datos.evaluaciones || [];
            guardarDatos();
            alert('Datos restaurados correctamente.');
            location.reload();
        } catch (ex) {
            alert('Archivo no válido.');
        }
    };
    reader.readAsText(file);
});

// ==================== CAMBIO DE PIN ====================
document.getElementById('btnCambiarPIN').addEventListener('click', () => {
    document.getElementById('modalCambiarPIN').style.display = 'flex';
});
document.getElementById('btnCancelarPIN').addEventListener('click', () => {
    document.getElementById('modalCambiarPIN').style.display = 'none';
});
document.getElementById('btnGuardarPIN').addEventListener('click', () => {
    const actual = document.getElementById('pinActual').value;
    const nuevo = document.getElementById('pinNuevo').value;
    const confirmacion = document.getElementById('pinConfirmacion').value;
    const pista = document.getElementById('pinPista').value;
    const mensaje = document.getElementById('mensajePIN');
    if (actual !== pinCorrecto) {
        mensaje.textContent = 'PIN actual incorrecto';
        mensaje.style.display = 'block';
        return;
    }
    if (nuevo.length !== 4 || !/^\d{4}$/.test(nuevo)) {
        mensaje.textContent = 'El PIN debe ser de 4 dígitos';
        mensaje.style.display = 'block';
        return;
    }
    if (nuevo !== confirmacion) {
        mensaje.textContent = 'Los PINs no coinciden';
        mensaje.style.display = 'block';
        return;
    }
    localStorage.setItem('pin', nuevo);
    if (pista) localStorage.setItem('pin_hint', pista);
    pinCorrecto = nuevo;
    document.getElementById('modalCambiarPIN').style.display = 'none';
    alert('PIN cambiado exitosamente');
});

// ==================== EXPORTACIÓN GENÉRICA ====================
document.getElementById('btnExportarEstudiantes').addEventListener('click', () => {
    let texto = 'Nombre,Apellidos,Grupo\n';
    estudiantes.forEach(e => {
        const grupo = grupos.find(g => g.id === e.grupoId);
        texto += `${e.nombre},${e.apellidos},${grupo ? grupo.facultad + ' ' + grupo.carrera : ''}\n`;
    });
    mostrarModalExportar(texto, 'Estudiantes');
});
function mostrarModalExportar(texto, titulo) {
    document.getElementById('modalTitulo').textContent = '📤 ' + titulo;
    document.getElementById('modalContenido').value = texto;
    document.getElementById('modalExportar').style.display = 'flex';
}
document.getElementById('btnCerrarModal').addEventListener('click', () => {
    document.getElementById('modalExportar').style.display = 'none';
});
document.getElementById('btnCopiarModal').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('modalContenido').value);
    alert('Copiado al portapapeles');
});
document.getElementById('btnCompartirModal').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({ text: document.getElementById('modalContenido').value });
    } else {

alert('Compartir no soportado en este navegador');
    }
});

// Inicializar listas al cargar
actualizarListaGrupos();
cargarGruposEnSelect('grupoEstudiante');
actualizarListaEstudiantes();
```

4. manifest.json

```json
{
    "name": "Gestor Académico",
    "short_name": "Académico",
    "start_url": ".",
    "display": "standalone",
    "background_color": "#1a1a2e",
    "theme_color": "#1a1a2e",
    "icons": [
        { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
{ "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```
5. service-worker.js

```javascript
const CACHE = 'academico-v1';
const urls = ['./','index.html','style.css','script.js','manifest.json'];
self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls)));
});
self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

