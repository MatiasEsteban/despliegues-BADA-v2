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
            
            // Estado
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
            
            // Observaciones
            const tdObservaciones = document.createElement('td');
            const textareaObs = this.crearTextarea(cdu.observaciones, 'observaciones', 'Cambios realizados...');
            textareaObs.dataset.cduId = cdu.id;
            tdObservaciones.appendChild(textareaObs);
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