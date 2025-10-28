// core/dataStore.js - Orquestador principal (REFACTORIZADO)

import { VersionStore } from './stores/VersionStore.js';
import { CduStore } from './stores/CduStore.js';
import { ChangeTracker } from './stores/ChangeTracker.js';
import { StatsCalculator } from './stores/StatsCalculator.js';
import { StorageManager } from './storageManager.js';

export class DataStore {
    constructor() {
        // Inicializar stores especializados
        this.versionStore = new VersionStore();
        this.cduStore = new CduStore(this.versionStore);
        this.changeTracker = new ChangeTracker(this.versionStore);
        this.statsCalculator = new StatsCalculator(this.versionStore);
        
        // Observers generales
        this.observers = [];
    }

    // =============== SISTEMA DE OBSERVACIÓN ===============
    
    subscribe(callback) {
        this.observers.push(callback);
    }

    subscribeToChanges(callback) {
        this.changeTracker.subscribe(callback);
    }

    notify(options = {}) {
        const { fullRender = false } = options;
        this.observers.forEach(callback => {
            callback(this.versionStore.getAll(), { fullRender });
        });
        
        // ¡NUEVO! Guarda el estado cada vez que se notifica un cambio
        // Solo guarda si no hay cambios pendientes para evitar guardar estados intermedios
        if (!this.hasPendingChanges()) {
            StorageManager.saveState(this);
        }
    }

    // =============== ACCESO A DATOS ===============
    
    getAll() {
        return this.versionStore.getAll();
    }

    getPendingChanges() {
        return this.changeTracker.getPendingChanges();
    }

    hasPendingChanges() {
        return this.changeTracker.hasPendingChanges();
    }

    // =============== GESTIÓN DE VERSIONES ===============
    
    getLatestVersionNumber() {
        return this.versionStore.getLatestVersionNumber();
    }

    addNewEmptyVersion() {
        const nuevaVersion = this.versionStore.addEmptyVersion();
        this.notify({ fullRender: true });
        return nuevaVersion;
    }

    duplicateVersion(versionId) {
        const versionToCopy = this.versionStore.getById(versionId);
        if (!versionToCopy) return null;
        
        // Duplicar CDUs usando CduStore
        const cdusCopy = versionToCopy.cdus.map(cdu => 
            this.cduStore.duplicateCdu(cdu)
        );
        
        const nuevaVersion = this.versionStore.duplicateVersion(versionId, cdusCopy);
        this.notify({ fullRender: true });
        return nuevaVersion;
    }

    updateVersion(versionId, campo, valor) {
        if (this.versionStore.updateVersion(versionId, campo, valor)) {
            this.notify({ fullRender: false });
        }
    }

deleteVersion(versionId) {
        // Llama a VersionStore para eliminar y guarda el resultado (true/false)
        const deleted = this.versionStore.deleteVersion(versionId); 
        
        // Si se eliminó correctamente, notifica a los observers
        if (deleted) {
            // CAMBIO IMPORTANTE: Usar fullRender: true para asegurar que la UI se actualice completamente
            // al eliminar un elemento, especialmente en la vista de lista/grid.
            this.notify({ fullRender: true }); 
        }
        
        // Devuelve el resultado de la operación
        return deleted; 
    }

    setVersionEnProduccion(versionId) {
        this.versionStore.setVersionEnProduccion(versionId);
        this.notify({ fullRender: false });
    }

    getVersionEnProduccionId() {
        return this.versionStore.getVersionEnProduccionId();
    }

    setVersionEnProduccionTemporal(versionId) {
        // Crear snapshot si es el primer cambio pendiente
        if (this.changeTracker.getPendingChanges().length === 0) {
            this.changeTracker.createSnapshot();
        }
        
        // Aplicar temporalmente
        const valorAnterior = this.versionStore.getVersionEnProduccionId();
        this.versionStore.setVersionEnProduccion(versionId);
        
        this.notify({ fullRender: false });
        
        return valorAnterior;
    }

    // =============== GESTIÓN DE COMENTARIOS DE VERSIÓN ===============
    
    addComentarioCategoria(versionId, categoria, texto = '') {
        if (this.versionStore.addComentarioCategoria(versionId, categoria, texto)) {
            this.notify({ fullRender: false });
        }
    }

    updateComentarioCategoria(versionId, categoria, index, texto) {
        if (this.versionStore.updateComentarioCategoria(versionId, categoria, index, texto)) {
            this.notify({ fullRender: false });
        }
    }

    deleteComentarioCategoria(versionId, categoria, index) {
        if (this.versionStore.deleteComentarioCategoria(versionId, categoria, index)) {
            this.notify({ fullRender: false });
        }
    }

    getDefaultComentarios() {
        return this.versionStore.getDefaultComentarios();
    }

    // =============== GESTIÓN DE CDUs ===============
    
    addCduToLatestVersion() {
        const versiones = this.versionStore.getAll();
        
        if (versiones.length === 0) {
            this.addNewEmptyVersion();
        }
        
        const ultimaVersion = this.versionStore.getAll()[versiones.length - 1] || 
                              this.versionStore.getAll()[0];
        
        if (!ultimaVersion) return null;
        
        const nuevoCdu = this.cduStore.addCduToVersion(ultimaVersion.id);
        
        if (nuevoCdu) {
            this.changeTracker.addPendingChange({
                cduId: nuevoCdu.id,
                campo: 'creacion',
                valorAnterior: null,
                valorNuevo: 'CDU creado',
                cduNombre: 'Nuevo CDU',
                versionNumero: ultimaVersion.numero,
                timestamp: new Date().toISOString(),
                tipo: 'creacion'
            });
            
            this.notify({ fullRender: false });
        }
        
        return nuevoCdu;
    }

    addCduToVersion(versionId) {
        const version = this.versionStore.getById(versionId);
        if (!version) return null;
        
        const nuevoCdu = this.cduStore.addCduToVersion(versionId);
        
        if (nuevoCdu) {
            this.changeTracker.addPendingChange({
                cduId: nuevoCdu.id,
                campo: 'creacion',
                valorAnterior: null,
                valorNuevo: 'CDU creado',
                cduNombre: 'Nuevo CDU',
                versionNumero: version.numero,
                timestamp: new Date().toISOString(),
                tipo: 'creacion'
            });
            
            this.notify({ fullRender: false });
        }
        
        return nuevoCdu;
    }

    updateCdu(cduId, campo, valor) {
        if (this.cduStore.updateCdu(cduId, campo, valor)) {
            this.notify({ fullRender: false });
        }
    }

    deleteCdu(cduId) {
        if (this.cduStore.deleteCdu(cduId)) {
            this.notify({ fullRender: false });
        }
    }

    // =============== GESTIÓN DE RESPONSABLES ===============
    
    addResponsable(cduId, nombre = '', rol = 'DEV') {
        if (this.cduStore.addResponsable(cduId, nombre, rol)) {
            this.notify({ fullRender: false });
        }
    }

    updateResponsable(cduId, index, campo, valor) {
        if (this.cduStore.updateResponsable(cduId, index, campo, valor)) {
            this.notify({ fullRender: false });
        }
    }

    deleteResponsable(cduId, index) {
        if (this.cduStore.deleteResponsable(cduId, index)) {
            this.notify({ fullRender: false });
        }
    }

    // =============== GESTIÓN DE OBSERVACIONES ===============
    
    addObservacion(cduId, texto = '') {
        if (this.cduStore.addObservacion(cduId, texto)) {
            this.notify({ fullRender: false });
        }
    }

    updateObservacion(cduId, index, texto) {
        if (this.cduStore.updateObservacion(cduId, index, texto)) {
            this.notify({ fullRender: false });
        }
    }

    deleteObservacion(cduId, index) {
        if (this.cduStore.deleteObservacion(cduId, index)) {
            this.notify({ fullRender: false });
        }
    }

    // =============== HISTORIAL ===============
    
    addHistorialEntry(cduId, tipo, valorAnterior, valorNuevo, campo = '') {
        this.cduStore.addHistorialEntry(cduId, tipo, valorAnterior, valorNuevo, campo);
    }

    // =============== GESTIÓN DE CAMBIOS PENDIENTES ===============
    
    addPendingChange(change) {
        this.changeTracker.addPendingChange(change);
    }

    applyPendingChanges() {
        const appliedChanges = this.changeTracker.applyPendingChanges();
        this.notify({ fullRender: false });
        return appliedChanges;
    }

    discardPendingChanges() {
        this.changeTracker.discardPendingChanges();
        this.notify({ fullRender: false });
    }

    // =============== IMPORTACIÓN / REEMPLAZO ===============
    
    replaceAll(nuevasVersiones, versionEnProduccionId = null) {
        console.log('🔄 DIAGNÓSTICO - dataStore.replaceAll llamado');
        console.log('  Versiones actuales:', this.versionStore.getAll().length);
        console.log('  Nuevas versiones:', nuevasVersiones.length);
        console.log('  Versión en producción ID:', versionEnProduccionId);
        
        // Normalizar datos antes de importar
        nuevasVersiones.forEach(v => {
            v.cdus.forEach(c => {
                // Retrocompatibilidad versionBADA
                if (!c.versionBADA) {
                    c.versionBADA = 'V1';
                }
                
                // Retrocompatibilidad responsables
                if (c.responsable && !Array.isArray(c.responsables)) {
                    c.responsables = [{ nombre: c.responsable, rol: 'DEV' }];
                } else if (!Array.isArray(c.responsables)) {
                    c.responsables = [];
                }
            });
            
            // Retrocompatibilidad comentarios
            if (typeof v.comentarios === 'string') {
                const oldComments = v.comentarios;
                v.comentarios = this.versionStore.getDefaultComentarios();
                if (oldComments) {
                    v.comentarios.observaciones.push(oldComments);
                }
            } else if (!v.comentarios) {
                v.comentarios = this.versionStore.getDefaultComentarios();
            }
        });
        
        // Reemplazar versiones
        this.versionStore.replaceAll(nuevasVersiones);
        
        // NUEVO: Establecer versión en producción si viene del Excel
        if (versionEnProduccionId !== null) {
            this.versionStore.versionEnProduccionId = versionEnProduccionId;
            console.log('✅ Versión en producción establecida:', versionEnProduccionId);
        }
        
        // Sincronizar IDs
        this.versionStore.syncNextVersionId();
        this.cduStore.syncNextCduId();
        
        this.notify({ fullRender: true });
        
        console.log('✅ DIAGNÓSTICO - Después de replaceAll:');
        console.log('  Total versiones:', this.versionStore.getAll().length);
        console.log('  Versión en producción final:', this.versionStore.getVersionEnProduccionId());
    }

    // =============== ESTADÍSTICAS ===============
    
    getUniqueStats() {
        return this.statsCalculator.getUniqueStats();
    }

    getStats() {
        return this.statsCalculator.getGlobalStats();
    }

    getVersionStats(versionId) {
        return this.statsCalculator.getVersionStats(versionId);
    }

    getAggregatedStats() {
        return this.statsCalculator.getAggregatedStats();
    }
}