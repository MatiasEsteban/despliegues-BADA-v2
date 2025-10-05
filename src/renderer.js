// renderer.js - Renderizado de la interfaz

import { DOMBuilder } from './domBuilder.js';

export class Renderer {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.tbody = document.getElementById('tabla-body');
    }

    render() {
        const registros = this.dataStore.getAll();
        
        // Limpiar tabla
        this.tbody.innerHTML = '';
        
        // Agregar filas
        registros.forEach(registro => {
            const fila = DOMBuilder.crearFilaTabla(registro);
            this.tbody.appendChild(fila);
        });

        // Actualizar estadísticas
        const stats = this.dataStore.getStats();
        DOMBuilder.actualizarEstadisticas(stats);
    }

    init() {
        // Suscribirse a cambios en el dataStore
        this.dataStore.subscribe(() => this.render());
        
        // Renderizar inicialmente
        this.render();
    }
}