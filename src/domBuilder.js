// domBuilder.js - Construcción de elementos del DOM con versiones agrupadas

export class DOMBuilder {
    static crearFilasVersion(version) {
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
        
        // Renderizar todos los CDUs con scroll
        version.cdus.forEach((cdu, index) => {
            const tr = document.createElement('tr');
            tr.dataset.versionId = version.id;
            tr.dataset.cduId = cdu.id;
            tr.className = 'fila-cdu';
            
            // Primera fila de la versión: mostrar fecha, hora y versión con rowspan
            if (index === 0) {
                tr.classList.add('primera-fila-version');
                
                // Fecha (compartida por toda la versión)
                const tdFecha = document.createElement('td');
                tdFecha.rowSpan = numCdus;
                tdFecha.className = 'celda-version';
                const inputFecha = this.crearInput('date', 'campo-fecha-version', version.fechaDespliegue, 'fechaDespliegue');
                inputFecha.dataset.versionId = version.id;
                tdFecha.appendChild(inputFecha);
                tr.appendChild(tdFecha);
                
                // Hora (compartida por toda la versión)
                const tdHora = document.createElement('td');
                tdHora.rowSpan = numCdus;
                tdHora.className = 'celda-version';
                const inputHora = this.crearInput('time', 'campo-hora-version', version.horaDespliegue, 'horaDespliegue');
                inputHora.dataset.versionId = version.id;
                tdHora.appendChild(inputHora);
                tr.appendChild(tdHora);
                
                // Versión (compartida)
                const tdVersion = document.createElement('td');
                tdVersion.rowSpan = numCdus;
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
            
            // Descripción (cambiado a textarea para expandir)
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
            
            // Observaciones (nuevo sistema de lista)
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
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = obsData.texto || '';
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
        
        inputRow.appendChild(input);
        inputRow.appendChild(btnRemove);
        item.appendChild(inputRow);
        
        // Agregar timestamp si existe
        if (obsData.timestamp) {
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'observacion-timestamp';
            
            const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>`;
            
            const formattedDate = this.formatTimestamp(obsData.timestamp);
            const modifiedText = obsData.lastModified ? ` (editado: ${this.formatTimestamp(obsData.lastModified)})` : '';
            
            timestampDiv.innerHTML = `${icon} ${formattedDate}${modifiedText}`;
            item.appendChild(timestampDiv);
        }
        
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