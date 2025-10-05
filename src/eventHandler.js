// eventHandlers.js - Manejo de eventos de la interfaz

import { ExcelExporter } from './excelExporter.js';

export class EventHandlers {
    constructor(dataStore) {
        this.dataStore = dataStore;
    }

    setupEventListeners() {
        this.setupAgregarButton();
        this.setupDescargarButton();
        this.setupTablaEvents();
    }

    setupAgregarButton() {
        document.getElementById('btn-agregar').addEventListener('click', () => {
            this.dataStore.add();
        });
    }

    setupDescargarButton() {
        document.getElementById('btn-descargar').addEventListener('click', () => {
            ExcelExporter.exportar(this.dataStore.getAll());
        });
    }

    setupTablaEvents() {
        const tbody = document.getElementById('tabla-body');
        
        // Evento para actualizar datos cuando se editan campos
        tbody.addEventListener('input', (e) => {
            if (e.target.dataset.campo) {
                const tr = e.target.closest('tr');
                const id = parseInt(tr.dataset.id);
                const campo = e.target.dataset.campo;
                const valor = e.target.value;
                
                this.dataStore.update(id, campo, valor);
            }
        });

        // Evento para eliminar registros
        tbody.addEventListener('click', (e) => {
            const btnEliminar = e.target.closest('.btn-eliminar');
            if (btnEliminar) {
                const id = parseInt(btnEliminar.dataset.id);
                if (confirm('¿Está seguro de eliminar este registro?')) {
                    this.dataStore.delete(id);
                }
            }
        });
    }
}