// domBuilder.js - Construcción de elementos del DOM con versiones agrupadas

export class DOMBuilder {
    static crearFilasVersion(version, isExpanded = false) {
        const filas = [];
        const numCdus = version.cdus.length;
        
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
            
            // Versión
            const tdVersion = document.createElement('td');
            tdVersion.className = 'celda-version';
            const inputVersion = this.crearInput('text', 'campo-version', version.numero, 'numero');
            inputVersion.dataset.versionId = version.id;
            tdVersion.appendChild(inputVersion);
            tr.appendChild(tdVersion);
            
            // Mensaje de versión vacía (colspan para ocupar el resto)
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
            : version.cdus.slice(-2); // Mostrar solo los últimos 2
        
        const numCdusToShow = cdusToShow.length;
        
        // Renderizar los CDUs visibles
        cdusToShow.forEach((cdu, index) => {
            const tr = document.createElement('tr');
            tr.dataset.versionId = version.id;
            tr.dataset.cduId = cdu.id;
            tr.className = 'fila-cdu';
            
            // Primera fila de la versión: mostrar fecha, hora y versión con rowspan
            if (index === 0) {
                tr.classList.add('primera-fila-version');
                
                // Fecha (compartida por toda la versión visible)
                const tdFecha = document.createElement('td');
                tdFecha.rowSpan = numCdusToShow;
                tdFecha.className = 'celda-version';
                const inputFecha = this.crearInput('date', 'campo-fecha-version', version.fechaDespliegue, 'fechaDespliegue');
                inputFecha.dataset.versionId = version.id;
                tdFecha.appendChild(inputFecha);
                tr.appendChild(tdFecha);
                
                // Hora (compartida por toda la versión visible)
                const tdHora = document.createElement('td');
                tdHora.rowSpan = numCdusToShow;
                tdHora.className = 'celda-version';
                const inputHora = this.crearInput('time', 'campo-hora-version', version.horaDespliegue, 'horaDespliegue');
                inputHora.dataset.versionId = version.id;
                tdHora.appendChild(inputHora);
                tr.appendChild(tdHora);
                
                // Versión (compartida)
                const tdVersion = document.createElement('td');
                tdVersion.rowSpan = numCdusToShow;
                tdVersion.className = 'celda-version';
                const inputVersion = this.crearInput('text', 'campo-version', version.numero, 'numero');
                inputVersion.dataset.versionId = version.id;
                tdVersion.appendChild(inputVersion);
                tr.appendChild(tdVersion);
            }
            
            // CDU (específico de cada fila)
            const tdCDU = document.createElement('td');
            const inputCDU = this.crearInput('text', 'campo-cdu', cdu.nombreCDU, 'nombreCDU', 'Nombre CDU');
            inputCDU.dataset.cduId = cdu.id;
            tdCDU.appendChild(inputCDU);
            tr.appendChild(tdCDU);
            
            // Descripción (textarea que ocupa todo el alto)
            const tdDescripcion = document.createElement('td');
            const textareaDescripcion = this.crearTextarea(cdu.descripcionCDU, 'descripcionCDU', 'Descripción del CDU');
            textareaDescripcion.className = 'campo-descripcion';
            textareaDescripcion.dataset.cduId = cdu.id;
            tdDescripcion.appendChild(textareaDescripcion);
            tr.appendChild(tdDescripcion);
            
            // Estado con colores
            const tdEstado = document.createElement('td');
            const selectEstado = this.crearSelect(
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
            
            // Observaciones (nuevo sistema con timestamp fuera)
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
        
        // Si hay más de 2 CDUs y no está expandido, agregar botón para expandir
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
            
            // Insertar al FINAL (después de los CDUs visibles)
            filas.push(trExpand);
        }
        
        // Si está expandido y hay más de 2 CDUs, agregar botón para colapsar
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
            
            // Insertar al FINAL también
            filas.push(trCollapse);
        }
        
        return filas;
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
                // Manejar tanto formato antiguo (string) como nuevo (objeto)
                const obsData = typeof obs === 'string' ? { texto: obs, timestamp: null } : obs;
                const item = this.crearObservacionItem(cdu.id, obsData, index);
                container.appendChild(item);
            });
        }
        
        // Botón para agregar observación
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

    static crearObservacionItem(cduId, obsData, index) {
        const item = document.createElement('div');
        item.className = 'observacion-item';
        item.dataset.index = index;
        
        const inputRow = document.createElement('div');
        inputRow.className = 'observacion-input-row';
        
        // Wrapper para input y timestamp
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'observacion-input-wrapper';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = obsData.texto || '';
        input.placeholder = 'Observación...';
        input.dataset.cduId = cduId;
        input.dataset.obsIndex = index;
        input.dataset.campo = 'observacion';
        
        inputWrapper.appendChild(input);
        
        // Agregar timestamp FUERA del input si existe
        if (obsData.timestamp || obsData.lastModified) {
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'observacion-timestamp';
            
            const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>`;
            
            // Mostrar la fecha más reciente (última modificación o creación)
            const dateToShow = obsData.lastModified || obsData.timestamp;
            const formattedDate = this.formatTimestamp(dateToShow);
            
            timestampDiv.innerHTML = `${icon} ${formattedDate}`;
            inputWrapper.appendChild(timestampDiv);
        }
        
        inputRow.appendChild(inputWrapper);
        
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

    static formatTimestamp(isoString) {
        if (!isoString) return '';
        
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Formato relativo para tiempos recientes
        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        
        // Formato absoluto para fechas más antiguas
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
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
        select.value = valorSeleccionado; // Establecer valor para aplicar color
        
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