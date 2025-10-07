// domBuilder.js - Construcción de elementos del DOM con iconos y historial

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

    static crearFilasVersion(version, isExpanded = false) {
        const filas = [];
        const numCdus = version.cdus.length;
        
        // Fila de comentarios de versión (si existen)
        if (version.comentarios && version.comentarios.trim()) {
            const trComentarios = document.createElement('tr');
            trComentarios.className = 'version-comments-row';
            trComentarios.dataset.versionId = version.id;
            
            const tdComentarios = document.createElement('td');
            tdComentarios.colSpan = 9;
            tdComentarios.className = 'version-comments-cell';
            tdComentarios.innerHTML = `
                <div class="version-comments-container">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span class="version-comments-label">Comentarios de versión:</span>
                    <span class="version-comments-text">${version.comentarios}</span>
                </div>
            `;
            trComentarios.appendChild(tdComentarios);
            filas.push(trComentarios);
        }
        
        // Si no hay CDUs, crear una fila placeholder
        if (numCdus === 0) {
            const tr = document.createElement('tr');
            tr.dataset.versionId = version.id;
            tr.className = 'fila-version-vacia primera-fila-version';
            
            // Fecha
            const tdFecha = document.createElement('td');
            tdFecha.className = 'celda-version';
            const inputFecha = this.crearInput('date', 'campo-fecha-version', version.fechaDespliegue, 'fechaDespliegue');
            inputFecha.dataset.versionId = version.id;
            tdFecha.appendChild(inputFecha);
            tr.appendChild(tdFecha);
            
            // Hora
            const tdHora = document.createElement('td');
            tdHora.className = 'celda-version';
            const inputHora = this.crearInput('time', 'campo-hora-version', version.horaDespliegue, 'horaDespliegue');
            inputHora.dataset.versionId = version.id;
            tdHora.appendChild(inputHora);
            tr.appendChild(tdHora);
            
            // Versión con botón de comentarios
            const tdVersion = document.createElement('td');
            tdVersion.className = 'celda-version version-cell-with-actions';
            const inputVersion = this.crearInput('text', 'campo-version', version.numero, 'numero');
            inputVersion.dataset.versionId = version.id;
            
            const btnComentarios = document.createElement('button');
            btnComentarios.className = 'btn-version-comments';
            btnComentarios.type = 'button';
            btnComentarios.title = 'Comentarios de versión';
            btnComentarios.dataset.versionId = version.id;
            btnComentarios.dataset.action = 'toggle-comments';
            btnComentarios.innerHTML = `<svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>`;
            
            tdVersion.appendChild(inputVersion);
            tdVersion.appendChild(btnComentarios);
            tr.appendChild(tdVersion);
            
            // Mensaje de versión vacía
            const tdMensaje = document.createElement('td');
            tdMensaje.colSpan = 6;
            tdMensaje.style.textAlign = 'center';
            tdMensaje.style.fontStyle = 'italic';
            tdMensaje.style.color = 'var(--text-secondary)';
            tdMensaje.textContent = 'Versión sin CDUs - Haz clic en "Nuevo CDU" para agregar';
            tr.appendChild(tdMensaje);
            
            filas.push(tr);
            return filas;
        }
        
        // Determinar qué CDUs mostrar
        const hasMoreThanTwo = numCdus > 2;
        const cdusToShow = (isExpanded || !hasMoreThanTwo) 
            ? version.cdus 
            : version.cdus.slice(-2);
        
        const numCdusToShow = cdusToShow.length;
        
        // Renderizar los CDUs visibles
        cdusToShow.forEach((cdu, index) => {
            const tr = document.createElement('tr');
            tr.dataset.versionId = version.id;
            tr.dataset.cduId = cdu.id;
            tr.className = 'fila-cdu';
            
            // Primera fila de la versión
            if (index === 0) {
                tr.classList.add('primera-fila-version');
                
                // Fecha
                const tdFecha = document.createElement('td');
                tdFecha.rowSpan = numCdusToShow;
                tdFecha.className = 'celda-version';
                const inputFecha = this.crearInput('date', 'campo-fecha-version', version.fechaDespliegue, 'fechaDespliegue');
                inputFecha.dataset.versionId = version.id;
                tdFecha.appendChild(inputFecha);
                tr.appendChild(tdFecha);
                
                // Hora
                const tdHora = document.createElement('td');
                tdHora.rowSpan = numCdusToShow;
                tdHora.className = 'celda-version';
                const inputHora = this.crearInput('time', 'campo-hora-version', version.horaDespliegue, 'horaDespliegue');
                inputHora.dataset.versionId = version.id;
                tdHora.appendChild(inputHora);
                tr.appendChild(tdHora);
                
                // Versión con botón de comentarios
                const tdVersion = document.createElement('td');
                tdVersion.rowSpan = numCdusToShow;
                tdVersion.className = 'celda-version version-cell-with-actions';
                const inputVersion = this.crearInput('text', 'campo-version', version.numero, 'numero');
                inputVersion.dataset.versionId = version.id;
                
                const btnComentarios = document.createElement('button');
                btnComentarios.className = 'btn-version-comments';
                btnComentarios.type = 'button';
                btnComentarios.title = 'Comentarios de versión';
                btnComentarios.dataset.versionId = version.id;
                btnComentarios.dataset.action = 'toggle-comments';
                btnComentarios.innerHTML = `<svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>`;
                
                tdVersion.appendChild(inputVersion);
                tdVersion.appendChild(btnComentarios);
                tr.appendChild(tdVersion);
            }
            
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
            const tdEstado = document.createElement('td');
            const selectEstado = this.crearSelectConIconos(
                ['En Desarrollo', 'Pendiente de Certificacion', 'Certificado OK', 'En Produccion'], 
                cdu.estado
            );
            selectEstado.dataset.cduId = cdu.id;
            tdEstado.appendChild(selectEstado);
            tr.appendChild(tdEstado);
            
            // Responsable
            const tdResponsable = document.createElement('td');
            const inputResponsable = this.crearInput('text', 'campo-responsable', cdu.responsable, 'responsable', 'Nombre');
            inputResponsable.dataset.cduId = cdu.id;
            tdResponsable.appendChild(inputResponsable);
            tr.appendChild(tdResponsable);
            
            // Observaciones
            const tdObservaciones = document.createElement('td');
            const containerObservaciones = this.crearObservacionesContainer(cdu);
            tdObservaciones.appendChild(containerObservaciones);
            tr.appendChild(tdObservaciones);
            
            // Acciones
            const tdAcciones = document.createElement('td');
            tdAcciones.style.textAlign = 'center';
            const btnEliminar = this.crearBotonEliminar(cdu.id, index === 0 && numCdus === 1 ? version.id : null);
            tdAcciones.appendChild(btnEliminar);
            tr.appendChild(tdAcciones);
            
            filas.push(tr);
        });
        
        // Botón para expandir/colapsar CDUs
        if (hasMoreThanTwo && !isExpanded) {
            const trExpand = document.createElement('tr');
            trExpand.className = 'expand-cdus-row';
            trExpand.dataset.versionId = version.id;
            
            const tdExpand = document.createElement('td');
            tdExpand.colSpan = 9;
            tdExpand.className = 'expand-cdus-cell';
            
            const btnExpand = document.createElement('button');
            btnExpand.className = 'btn-expand-cdus';
            btnExpand.dataset.versionId = version.id;
            btnExpand.dataset.action = 'expand-cdus';
            btnExpand.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <span>Mostrar ${numCdus - 2} CDUs anteriores</span>
            `;
            
            tdExpand.appendChild(btnExpand);
            trExpand.appendChild(tdExpand);
            filas.push(trExpand);
        }
        
        if (hasMoreThanTwo && isExpanded) {
            const trCollapse = document.createElement('tr');
            trCollapse.className = 'expand-cdus-row';
            trCollapse.dataset.versionId = version.id;
            
            const tdCollapse = document.createElement('td');
            tdCollapse.colSpan = 9;
            tdCollapse.className = 'expand-cdus-cell';
            
            const btnCollapse = document.createElement('button');
            btnCollapse.className = 'btn-expand-cdus expanded';
            btnCollapse.dataset.versionId = version.id;
            btnCollapse.dataset.action = 'collapse-cdus';
            btnCollapse.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                <span>Ocultar CDUs anteriores</span>
            `;
            
            tdCollapse.appendChild(btnCollapse);
            trCollapse.appendChild(tdCollapse);
            filas.push(trCollapse);
        }
        
        return filas;
    }

    static crearSelectConIconos(opciones, valorSeleccionado) {
        const container = document.createElement('div');
        container.className = 'estado-select-container';
        
        // Mostrar el estado actual con icono
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
        
        const inputRow = document.createElement('div');
        inputRow.className = 'observacion-input-row';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = texto || '';
        input.placeholder = 'Observación...';
        input.dataset.cduId = cduId;
        input.dataset.obsIndex = index;
        input.dataset.campo = 'observacion';
        
        inputRow.appendChild(input);
        
        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn-observacion btn-remove';
        btnRemove.type = 'button';
        btnRemove.innerHTML = '×';
        btnRemove.title = 'Eliminar observación';
        btnRemove.dataset.cduId = cduId;
        btnRemove.dataset.obsIndex = index;
        btnRemove.dataset.action = 'remove-observacion';
        
        inputRow.appendChild(btnRemove);
        item.appendChild(inputRow);
        
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

    static crearSelect(opciones, valorSeleccionado) {
        const select = document.createElement('select');
        select.className = 'campo-estado';
        select.setAttribute('data-campo', 'estado');
        select.value = valorSeleccionado;
        
        opciones.forEach(opcion => {
            const option = document.createElement('option');
            option.value = opcion;
            option.textContent = opcion;
            if (valorSeleccionado === opcion) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        return select;
    }

    static crearTextarea(valor, campo = 'observaciones', placeholder = 'Cambios realizados...') {
        const textarea = document.createElement('textarea');
        textarea.className = campo === 'observaciones' ? 'campo-observaciones' : 'campo-descripcion';
        textarea.setAttribute('data-campo', campo);
        textarea.placeholder = placeholder;
        textarea.value = valor || '';
        return textarea;
    }

    static crearBotonEliminar(cduId, versionId = null) {
        const button = document.createElement('button');
        button.className = 'btn btn-danger btn-eliminar';
        button.setAttribute('data-cdu-id', cduId);
        if (versionId !== null) {
            button.setAttribute('data-version-id', versionId);
            button.title = 'Eliminar versión completa';
        } else {
            button.title = 'Eliminar CDU';
        }
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