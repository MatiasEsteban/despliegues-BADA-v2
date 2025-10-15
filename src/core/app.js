// app.js - Clase principal de la aplicación
// app.js - Clase principal de la aplicación

import { DataStore } from './dataStore.js';
import { EventCoordinator } from '../events/eventCoordinator.js';
import { Renderer } from './renderer.js';
import { StorageManager } from './storageManager.js';

export class App {
    constructor() {
        this.dataStore = new DataStore();
        this.renderer = new Renderer(this.dataStore);
        this.eventCoordinator = new EventCoordinator(this.dataStore, this.renderer);
    }

    init() {
        // ¡NUEVO! Carga el estado desde localStorage ANTES de inicializar el resto
        StorageManager.loadState(this.dataStore);
        
        this.renderer.init();
        this.eventCoordinator.setupEventListeners();
    }
}