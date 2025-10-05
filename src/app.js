
// app.js - Clase principal de la aplicación

import { DataStore } from './dataStore.js';
import { EventHandlers } from './eventHandler.js';
import { Renderer } from './renderer.js';

export class App {
    constructor() {
        this.dataStore = new DataStore();
        this.eventHandlers = new EventHandlers(this.dataStore);
        this.renderer = new Renderer(this.dataStore);
    }

    init() {
        this.renderer.init();
        this.eventHandlers.setupEventListeners();
        console.log('✅ Aplicación de Control de Despliegues inicializada');
    }
}