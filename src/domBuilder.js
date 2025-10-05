// domBuilder.js - Construcción de elementos del DOM

export class DOMBuilder {
    static crearFilaTabla(registro) {
        const tr = document.createElement('tr');
        tr.dataset.id = registro.id;
        
        // Fecha
        const tdFecha = document.createElement('td');
        const inputFecha = this.crearInput('date', 'campo-fecha', registro.fechaDespliegue, 'fechaDespliegue');
        tdFecha.appendChild(inputFecha);
        
        // Hora
        const tdHora = document.createElement('td');
        const inputHora = this.crearInput('time', 'campo-hora', registro.horaDespliegue, 'horaDespliegue');
        tdHora.appendChild(inputHora);
        
        // Versión
        const tdVersion = document.createElement('td');
        const inputVersion = this.crearInput('text', 'campo-version', registro.version, 'version', '8.0');
        tdVersion.appendChild(inputVersion);
        
        // CDU
        const tdCDU = document.createElement('td');
        const inputCDU = this.crearInput('text', 'campo-cdu', registro.nombreCDU, 'nombreCDU', 'Nuevo CDU');
        tdCDU.appendChild(inputCDU);
        
        // Descripción
        const tdDescripcion = document.createElement('td');
        const inputDescripcion = this.crearInput('text', 'campo-descripcion', registro.descripcionCDU, 'descripcionCDU', 'Descripción del CDU');
        tdDescripcion.appendChild(inputDescripcion);
        
        // Estado
        const tdEstado = document.createElement('td');
        const selectEstado = this.crearSelect(['Pendiente', 'Listo', 'En Proceso', 'Bloqueado'], registro.estado);
        tdEstado.appendChild(selectEstado);
        
        // Responsable
        const tdResponsable = document.createElement('td');
        const inputResponsable = this.crearInput('text', 'campo-responsable', registro.responsable, 'responsable', 'Nombre');
        tdResponsable.appendChild(inputResponsable);
        
        // Observaciones
        const tdObservaciones = document.createElement('td');
        const textareaObs = this.crearTextarea(registro.observaciones);
        tdObservaciones.appendChild(textareaObs);
        
        // Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.style.textAlign = 'center';
        const btnEliminar = this.crearBotonEliminar(registro.id);
        tdAcciones.appendChild(btnEliminar);
        
        // Agregar todas las celdas a la fila
        [tdFecha, tdHora, tdVersion, tdCDU, tdDescripcion, tdEstado, tdResponsable, tdObservaciones, tdAcciones]
            .forEach(td => tr.appendChild(td));
        
        return tr;
    }

    static crearInput(type, className, value, campo, placeholder = '') {
        const input = document.createElement('input');
        input.type = type;
        input.className = className;
        input.value = value;
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

    static crearTextarea(valor) {
        const textarea = document.createElement('textarea');
        textarea.className = 'campo-observaciones';
        textarea.setAttribute('data-campo', 'observaciones');
        textarea.placeholder = 'Cambios realizados...';
        textarea.value = valor;
        return textarea;
    }

    static crearBotonEliminar(id) {
        const button = document.createElement('button');
        button.className = 'btn btn-danger btn-eliminar';
        button.setAttribute('data-id', id);
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
        document.getElementById('stat-listos').textContent = stats.listos;
        document.getElementById('stat-proceso').textContent = stats.proceso;
        document.getElementById('stat-pendientes').textContent = stats.pendientes;
    }
}