// domBuilder.js - Constructor de tarjetas de versión y filas de CDU con responsables con roles

export class DOMBuilder {
    // Iconos SVG para estados
    static getEstadoIcon(estado) {
        const icons = {
            'En Desarrollo': `<svg class="estado-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>`,
            'Pendiente de Certificacion': `<svg class="estado-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>`,
            'Certificado OK': `<svg class="estado-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`,
            'En Produccion': `<svg class="estado-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>`
        };
        return icons[estado] || '';
    }

    // Iconos SVG para roles
    static getRolIcon(rol) {
        const icons = {
            'DEV': `<svg class="rol-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
            </svg>`,
            'AF': `<svg class="rol-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>`,
            'UX': `<svg class="rol-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>`,
            'AN': `<svg class="rol-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>`,
            'QA': `<svg class="rol-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`
        };
        return icons[rol] || icons['DEV'];
    }

    // Obtener clase CSS según el estado
    static getEstadoClass(estado) {
        const classes = {
            'En Desarrollo': 'estado-desarrollo',
            'Pendiente de Certificacion': 'estado-pendiente',
            'Certificado OK': 'estado-certificado',
            'En Produccion': 'estado-produccion'
        };
        return classes[estado] || 'estado-desarrollo';
    }

    // Crear tarjeta de versión para vista de grid
    static crearTarjetaVersion(version, onClickCallback) {
        const card = document.createElement('div');
        card.className = 'version-card';
        card.dataset.versionId = version.id;
        
        // Calcular estadísticas
        const desarrollo = version.cdus.filter(c => c.estado === 'En Desarrollo').length;
        const pendiente = version.cdus.filter(c => c.estado === 'Pendiente de Certificacion').length;
        const certificado = version.cdus.filter(c => c.estado === 'Certificado OK').length;
        const produccion = version.cdus.filter(c => c.estado === 'En Produccion').length;
        
        card.innerHTML = `
            <div class="version-card-header">
                <div class="version-card-number">Versión ${version.numero}</div>
                <div class="version-card-cdus-count">${version.cdus.length} CDU${version.cdus.length !== 1 ? 's' : ''}</div>
            </div>
            <div class="version-card-body">
                <div class="version-card-stats">
                    <div class="version-card-stat">
                        <div class="version-card-stat-icon stat-desarrollo">${desarrollo}</div>
                        <div>
                            <div class="version-card-stat-label">En Desarrollo</div>
                        </div>
                    </div>
                    <div class="version-card-stat">
                        <div class="version-card-stat-icon stat-pendiente">${pendiente}</div>
                        <div>
                            <div class="version-card-stat-label">Pendiente</div>
                        </div>
                    </div>
                    <div class="version-card-stat">
                        <div class="version-card-stat-icon stat-certificado">${certificado}</div>
                        <div>
                            <div class="version-card-stat-label">Certificado</div>
                        </div>
                    </div>
                    <div class="version-card-stat">
                        <div class="version-card-stat-icon stat-produccion">${produccion}</div>
                        <div>
                            <div class="version-card-stat-label">Producción</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="version-card-footer">
                <div class="version-card-date">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    ${this.formatDate(version.fechaDespliegue)}
                </div>
                <div class="version-card-time">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${version.horaDespliegue || '--:--'}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            onClickCallback(version.id);
        });
        
        return card;
    }

    static formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString + 'T00:00:00');
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }

    // Crear fila de CDU para vista de detalle
    static crearFilaCDU(cdu) {
        const tr = document.createElement('tr');
        tr.dataset.cduId = cdu.id;
        
        // CDU con botón de historial
        const tdCDU = document.createElement('td');
        const cduContainer = document.createElement('div');
        cduContainer.className = 'cdu-cell-with-actions';
        
        const inputCDU = this.crearInput('text', 'campo-cdu', cdu.nombreCDU, 'nombreCDU', 'Nombre CDU');
        inputCDU.dataset.cduId = cdu.id;
        
        const btnHistorial = document.createElement('button');
        btnHistorial.className = 'btn-historial';
        btnHistorial.type = 'button';
        btnHistorial.title = 'Ver historial';
        btnHistorial.dataset.cduId = cdu.id;
        btnHistorial.dataset.action = 'show-historial';
        btnHistorial.innerHTML = `<svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>`;
        
        cduContainer.appendChild(inputCDU);
        cduContainer.appendChild(btnHistorial);
        tdCDU.appendChild(cduContainer);
        tr.appendChild(tdCDU);
        
        // Descripción
        const tdDescripcion = document.createElement('td');
        const textareaDescripcion = this.crearTextarea(cdu.descripcionCDU, 'descripcionCDU', 'Descripción del CDU');
        textareaDescripcion.className = 'campo-descripcion';
        textareaDescripcion.dataset.cduId = cdu.id;
        tdDescripcion.appendChild(textareaDescripcion);
        tr.appendChild(tdDescripcion);
        
        // Estado con iconos
// Estado con iconos
const tdEstado = document.createElement('td');
const selectEstado = this.crearSelectConIconos(
    ['En Desarrollo', 'Pendiente de Certificacion', 'Certificado OK', 'En Produccion'], 
    cdu.estado,
    cdu.id // AGREGAR EL cduId AQUÍ
);
// Ya no es necesario: selectEstado.dataset.cduId = cdu.id;
tdEstado.appendChild(selectEstado);
tr.appendChild(tdEstado);
        
        // Responsables con roles
        const tdResponsables = document.createElement('td');
        const containerResponsables = this.crearResponsablesContainer(cdu);
        tdResponsables.appendChild(containerResponsables);
        tr.appendChild(tdResponsables);
        
        // Observaciones
        const tdObservaciones = document.createElement('td');
        const containerObservaciones = this.crearObservacionesContainer(cdu);
        tdObservaciones.appendChild(containerObservaciones);
        tr.appendChild(tdObservaciones);
        
        // Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.style.textAlign = 'center';
        const btnEliminar = this.crearBotonEliminar(cdu.id);
        tdAcciones.appendChild(btnEliminar);
        tr.appendChild(tdAcciones);
        
        return tr;
    }

    static crearSelectConIconos(opciones, valorSeleccionado, cduId = null) {
    const container = document.createElement('div');
    container.className = 'estado-select-container ' + this.getEstadoClass(valorSeleccionado);
    
    const display = document.createElement('div');
    display.className = 'estado-display';
    display.innerHTML = `
        ${this.getEstadoIcon(valorSeleccionado)}
        <span>${valorSeleccionado}</span>
    `;
    
    const select = document.createElement('select');
    select.className = 'campo-estado';
    select.setAttribute('data-campo', 'estado');
    select.value = valorSeleccionado;
    
    // CRÍTICO: Agregar data-cdu-id al select
    if (cduId !== null) {
        select.dataset.cduId = cduId;
    }
    
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion;
        option.textContent = opcion;
        if (valorSeleccionado === opcion) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    container.appendChild(display);
    container.appendChild(select);
    return container;
}

    // NUEVO: Crear contenedor de responsables con roles
    static crearResponsablesContainer(cdu) {
        const container = document.createElement('div');
        container.className = 'responsables-container';
        container.dataset.cduId = cdu.id;
        
        // Migrar formato antiguo si existe
        let responsables = [];
        if (Array.isArray(cdu.responsables)) {
            responsables = cdu.responsables;
        } else if (cdu.responsable) {
            responsables = [{ nombre: cdu.responsable, rol: 'DEV' }];
        }
        
        if (responsables.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'responsables-empty';
            empty.textContent = 'Sin responsables';
            container.appendChild(empty);
        } else {
            responsables.forEach((resp, index) => {
                const item = this.crearResponsableItem(cdu.id, resp.nombre || '', resp.rol || 'DEV', index);
                container.appendChild(item);
            });
        }
        
        const btnAgregar = document.createElement('button');
        btnAgregar.className = 'btn-responsable btn-add';
        btnAgregar.type = 'button';
        btnAgregar.dataset.cduId = cdu.id;
        btnAgregar.dataset.action = 'add-responsable';
        btnAgregar.innerHTML = '+';
        btnAgregar.title = 'Agregar responsable';
        container.appendChild(btnAgregar);
        
        return container;
    }

    static crearResponsableItem(cduId, nombre, rol, index) {
        const item = document.createElement('div');
        item.className = 'responsable-item';
        item.dataset.index = index;
        
        // CONTENEDOR DE ROL CON DISPLAY VISUAL (similar a estados)
        const rolContainer = document.createElement('div');
        rolContainer.className = 'rol-select-container';
        
        const rolDisplay = document.createElement('div');
        rolDisplay.className = 'rol-display';
        rolDisplay.innerHTML = `${this.getRolIcon(rol)}<span>${rol}</span>`;
        
        const selectRol = document.createElement('select');
        selectRol.className = 'responsable-rol-select';
        selectRol.dataset.cduId = cduId;
        selectRol.dataset.respIndex = index;
        selectRol.dataset.campo = 'responsable-rol';
        
        const roles = ['DEV', 'AF', 'UX', 'AN', 'QA'];
        roles.forEach(rolOption => {
            const option = document.createElement('option');
            option.value = rolOption;
            option.textContent = rolOption;
            if (rol === rolOption) {
                option.selected = true;
            }
            selectRol.appendChild(option);
        });
        
        rolContainer.appendChild(rolDisplay);
        rolContainer.appendChild(selectRol);
        
        // INPUT DE NOMBRE (ahora a la derecha)
        const inputNombre = document.createElement('input');
        inputNombre.type = 'text';
        inputNombre.value = nombre || '';
        inputNombre.placeholder = 'Nombre...';
        inputNombre.dataset.cduId = cduId;
        inputNombre.dataset.respIndex = index;
        inputNombre.dataset.campo = 'responsable-nombre';
        
        // BOTÓN ELIMINAR
        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn-responsable btn-remove';
        btnRemove.type = 'button';
        btnRemove.innerHTML = '×';
        btnRemove.title = 'Eliminar responsable';
        btnRemove.dataset.cduId = cduId;
        btnRemove.dataset.respIndex = index;
        btnRemove.dataset.action = 'remove-responsable';
        
        // Orden: ROL - NOMBRE - ELIMINAR
        item.appendChild(rolContainer);
        item.appendChild(inputNombre);
        item.appendChild(btnRemove);
        
        return item;
    }

    static crearObservacionesContainer(cdu) {
        const container = document.createElement('div');
        container.className = 'observaciones-container';
        container.dataset.cduId = cdu.id;
        
        const observaciones = Array.isArray(cdu.observaciones) ? cdu.observaciones : [];
        
        if (observaciones.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'observaciones-empty';
            empty.textContent = 'Sin observaciones';
            container.appendChild(empty);
        } else {
            observaciones.forEach((obs, index) => {
                const obsTexto = typeof obs === 'string' ? obs : (obs.texto || '');
                const item = this.crearObservacionItem(cdu.id, obsTexto, index);
                container.appendChild(item);
            });
        }
        
        const btnAgregar = document.createElement('button');
        btnAgregar.className = 'btn-observacion btn-add';
        btnAgregar.type = 'button';
        btnAgregar.dataset.cduId = cdu.id;
        btnAgregar.dataset.action = 'add-observacion';
        btnAgregar.innerHTML = '+';
        btnAgregar.title = 'Agregar observación';
        container.appendChild(btnAgregar);
        
        return container;
    }

    static crearObservacionItem(cduId, texto, index) {
        const item = document.createElement('div');
        item.className = 'observacion-item';
        item.dataset.index = index;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = texto || '';
        input.placeholder = 'Observación...';
        input.dataset.cduId = cduId;
        input.dataset.obsIndex = index;
        input.dataset.campo = 'observacion';
        
        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn-observacion btn-remove';
        btnRemove.type = 'button';
        btnRemove.innerHTML = '×';
        btnRemove.title = 'Eliminar observación';
        btnRemove.dataset.cduId = cduId;
        btnRemove.dataset.obsIndex = index;
        btnRemove.dataset.action = 'remove-observacion';
        
        item.appendChild(input);
        item.appendChild(btnRemove);
        
        return item;
    }

    static crearInput(type, className, value, campo, placeholder = '') {
        const input = document.createElement('input');
        input.type = type;
        input.className = className;
        input.value = value || '';
        input.setAttribute('data-campo', campo);
        if (placeholder) input.placeholder = placeholder;
        return input;
    }

    static crearTextarea(valor, campo = 'observaciones', placeholder = 'Descripción...') {
        const textarea = document.createElement('textarea');
        textarea.className = campo === 'observaciones' ? 'campo-observaciones' : 'campo-descripcion';
        textarea.setAttribute('data-campo', campo);
        textarea.placeholder = placeholder;
        textarea.value = valor || '';
        return textarea;
    }

    static crearBotonEliminar(cduId) {
        const button = document.createElement('button');
        button.className = 'btn btn-danger btn-eliminar';
        button.setAttribute('data-cdu-id', cduId);
        button.title = 'Eliminar CDU';
        button.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;
        return button;
    }

    static actualizarEstadisticas(stats) {
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-desarrollo').textContent = stats.desarrollo;
        document.getElementById('stat-pendiente').textContent = stats.pendiente;
        document.getElementById('stat-certificado').textContent = stats.certificado;
        document.getElementById('stat-produccion').textContent = stats.produccion;
    }
}