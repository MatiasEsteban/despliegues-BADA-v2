// renderer.js - Renderizado de la interfaz con versiones agrupadas

import { DOMBuilder } from './domBuilder.js';

export class Renderer {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.tbody = document.getElementById('tabla-body');
        this.isInitialRender = true;
    }

    // Renderizar la tabla completa
    renderTable() {
        const versiones = this.dataStore.getAll();
        
        // Limpiar tabla
        this.tbody.innerHTML = '';
        
        // Agregar filas por versión
        versiones.forEach(version => {
            const filas = DOMBuilder.crearFilasVersion(version);
            filas.forEach(fila => this.tbody.appendChild(fila));
        });
    }

    // Actualizar solo las estadísticas (más eficiente)
    updateStats() {
        const stats = this.dataStore.getStats();
        DOMBuilder.actualizarEstadisticas(stats);
    }

    init() {
        // Renderizar tabla inicial
        this.renderTable();
        this.updateStats();
        
        // Suscribirse a cambios en el dataStore
        this.dataStore.subscribe(() => {
            if (this.isInitialRender) {
                this.isInitialRender = false;
                return;
            }
            // Solo actualizar estadísticas, no re-renderizar toda la tabla
            this.updateStats();
        });
    }

    // Método público para forzar re-renderizado completo (usado al agregar/eliminar)
    fullRender() {
        this.renderTable();
        this.updateStats();
    }
}