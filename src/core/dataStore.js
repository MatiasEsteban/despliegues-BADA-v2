// core/dataStore.js

import { VersionStore } from './stores/VersionStore.js';
import { CduStore } from './stores/CduStore.js';
import { ChangeTracker } from './stores/ChangeTracker.js';
import { StatsCalculator } from './stores/StatsCalculator.js';
import { StorageManager } from './storageManager.js'; // Asegurar importación
import { NotificationSystem } from '../utils/notifications.js';

export class DataStore {
    constructor() {
        this.versionStore = new VersionStore();
        this.cduStore = new CduStore(this.versionStore);
        this.changeTracker = new ChangeTracker(this.versionStore);
        this.statsCalculator = new StatsCalculator(this.versionStore);
        this.observers = []; // Observers de UI
    }

    // =============== SISTEMA DE OBSERVACIÓN Y GUARDADO ===============

    /** Suscribe un callback para notificaciones de cambio de datos */
    subscribe(callback) {
        if (typeof callback === 'function') {
            this.observers.push(callback);
        } else {
             console.error("Intento de suscribir un observer no válido:", callback);
        }
    }

    /** Suscribe un callback para notificaciones de cambios pendientes */
    subscribeToChanges(callback) {
        this.changeTracker.subscribe(callback);
    }

    /** Notifica a los observers de UI y guarda el estado si no hay cambios pendientes */
    notify(options = {}) {
        const { fullRender = false, skipSave = false } = options;
        console.log(`🔔 Notificando observers... fullRender: ${fullRender}, skipSave: ${skipSave}`);

        this.observers.forEach(callback => {
             if (typeof callback === 'function') {
                 try { callback(this.versionStore.getAll(), { fullRender }); }
                 catch (error) { console.error("Error en observer:", error); }
             }
        });

        // Guardar estado si no se salta y NO hay cambios pendientes
        if (!skipSave && !this.hasPendingChanges()) {
            try {
                // CORRECCIÓN: La llamada a StorageManager.saveState está aquí y es correcta
                StorageManager.saveState(this);
                console.log("💾 Estado guardado en localStorage.");
            } catch (error) {
                 console.error("Error al llamar a StorageManager.saveState:", error);
                 NotificationSystem.error("Error al guardar el estado.");
            }
        } else if (skipSave) { console.log("💾 Guardado saltado (skipSave=true)."); }
          else { console.log("💾 Guardado saltado (cambios pendientes)."); }
    }

    // =============== ACCESO A DATOS ===============

    getAll() { return this.versionStore.getAll(); }
    getById(versionId) { return this.versionStore.getById(versionId); }
    getVersionNumberById(versionId) { return this.versionStore.getVersionNumberById(versionId); }
    getPendingChanges() { return this.changeTracker.getPendingChanges(); }
    hasPendingChanges() { return this.changeTracker.hasPendingChanges(); }

    // =============== GESTIÓN DE VERSIONES ===============

    getLatestVersionNumber() { return this.versionStore.getLatestVersionNumber(); }
    addNewEmptyVersion() {
        const nuevaVersion = this.versionStore.addEmptyVersion();
        this.notify({ fullRender: true }); // Notificar con render completo y guardar
        return nuevaVersion;
    }
    duplicateVersion(versionId) {
        const versionToCopy = this.versionStore.getById(versionId);
        if (!versionToCopy) return null;
        const cdusOriginales = Array.isArray(versionToCopy.cdus) ? versionToCopy.cdus : [];
        const cdusCopy = cdusOriginales.map(cdu => this.cduStore.duplicateCdu(cdu)); // Duplicar CDUs con nuevos IDs
        const nuevaVersion = this.versionStore.duplicateVersion(versionId, cdusCopy);
        this.notify({ fullRender: true }); // Notificar con render completo y guardar
        return nuevaVersion;
    }
    updateVersion(versionId, campo, valor) {
        const changed = this.versionStore.updateVersion(versionId, campo, valor);
        if (changed) {
            // Notificar SIN render completo, y saltar guardado si hay pendientes
            this.notify({ fullRender: false, skipSave: this.hasPendingChanges() });
        }
        return changed;
    }
    deleteVersion(versionId) {
        const deleted = this.versionStore.deleteVersion(versionId);
        if (deleted) {
            this.notify({ fullRender: true }); // Forzar render completo y guardar
        }
        return deleted;
    }

    setVersionEnProduccion(versionId) {
        const idAnterior = this.versionStore.getVersionEnProduccionId();
        this.versionStore.setVersionEnProduccion(versionId);
        const idNuevo = this.versionStore.getVersionEnProduccionId();
        if (idAnterior !== idNuevo) {
             // Este método usualmente se llama DESPUÉS de registrar el cambio pendiente
             // Así que notificamos sin guardar aquí, asumiendo que se guardará al aplicar cambios.
             this.notify({ fullRender: true, skipSave: true }); // Render completo, sin guardar
        }
    }
    getVersionEnProduccionId() { return this.versionStore.getVersionEnProduccionId(); }
    setVersionEnProduccionTemporal(versionId) {
        // Este método sigue siendo problemático/redundante.
        // La lógica correcta está en handleMarkProdClick que registra el cambio
        // y luego actualiza VersionStore directamente SIN llamar a este método.
        // Lo dejamos aquí por si se usa en otro lado, pero debería revisarse.
        const valorAnterior = this.versionStore.getVersionEnProduccionId();
        this.versionStore.setVersionEnProduccion(versionId);
        this.notify({ fullRender: true, skipSave: true }); // Notificar UI sin guardar
        return valorAnterior;
    }

    // =============== GESTIÓN DE COMENTARIOS DE VERSIÓN ===============
    addComentarioCategoria(versionId, categoria, texto = '') {
        if (this.versionStore.addComentarioCategoria(versionId, categoria, texto)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }
    updateComentarioCategoria(versionId, categoria, index, texto) {
        if (this.versionStore.updateComentarioCategoria(versionId, categoria, index, texto)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }
    deleteComentarioCategoria(versionId, categoria, index) {
        if (this.versionStore.deleteComentarioCategoria(versionId, categoria, index)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }
    getDefaultComentarios() { return this.versionStore.getDefaultComentarios(); }

    // =============== GESTIÓN DE CDUs ===============

    addCduToVersion(versionId) {
        const version = this.versionStore.getById(versionId);
        if (!version) return null;
        const nuevoCdu = this.cduStore.addCduToVersion(versionId);
        if (nuevoCdu) {
            this.changeTracker.addPendingChange({
                cduId: nuevoCdu.id, campo: 'creacion', valorAnterior: null, valorNuevo: 'CDU creado',
                cduNombre: 'Nuevo CDU', versionId: versionId, versionNumero: version.numero,
                timestamp: new Date().toISOString(), tipo: 'creacion'
            });
            this.notify({ fullRender: false, skipSave: true }); // No guardar, hay pendiente
        }
        return nuevoCdu;
    }
    updateCdu(cduId, campo, valor) {
        const changed = this.cduStore.updateCdu(cduId, campo, valor);
        if (changed) {
            this.notify({ fullRender: false, skipSave: this.hasPendingChanges() });
        }
        return changed;
    }
    deleteCdu(cduId) {
        // Obtener info ANTES de eliminar
        const { cdu, version } = this.cduStore.findCdu(cduId) || {};
        if (!cdu || !version) return false;

        // Registrar cambio pendiente ANTES
        this.changeTracker.addPendingChange({
            cduId: cduId, campo: 'cdu-eliminado', valorAnterior: `CDU: ${cdu.nombreCDU || 'Sin nombre'}`,
            valorNuevo: null, cduNombre: cdu.nombreCDU || 'Sin nombre', versionId: version.id,
            versionNumero: version.numero, timestamp: new Date().toISOString(), tipo: 'eliminacion'
        });

        // Eliminar
        const deleted = this.cduStore.deleteCdu(cduId);
        if (deleted) {
             // Notificar SIN guardar
            this.notify({ fullRender: false, skipSave: true });
        }
        return deleted;
    }

    // =============== GESTIÓN DE RESPONSABLES ===============
    addResponsable(cduId, nombre = '', rol = 'DEV') {
        if (this.cduStore.addResponsable(cduId, nombre, rol)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }
    updateResponsable(cduId, index, campo, valor) {
        if (this.cduStore.updateResponsable(cduId, index, campo, valor)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }
    deleteResponsable(cduId, index) {
        if (this.cduStore.deleteResponsable(cduId, index)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }

    // =============== GESTIÓN DE OBSERVACIONES ===============
    addObservacion(cduId, texto = '') {
        if (this.cduStore.addObservacion(cduId, texto)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }
    updateObservacion(cduId, index, texto) {
        if (this.cduStore.updateObservacion(cduId, index, texto)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }
    deleteObservacion(cduId, index) {
        if (this.cduStore.deleteObservacion(cduId, index)) {
            this.notify({ skipSave: this.hasPendingChanges() });
        }
    }

    // =============== HISTORIAL (Accedido vía CduStore) ===============
    addHistorialEntry(cduId, tipo, valorAnterior, valorNuevo, campo = '') {
        this.cduStore.addHistorialEntry(cduId, tipo, valorAnterior, valorNuevo, campo);
        // No notificar aquí generalmente
    }

    // =============== GESTIÓN DE CAMBIOS PENDIENTES ===============
    addPendingChange(change) {
        this.changeTracker.addPendingChange(change);
        this.notify({ skipSave: true }); // Notificar UI sin guardar estado principal
    }
    applyPendingChanges() {
        const appliedChanges = this.changeTracker.applyPendingChanges(); // Limpia lista y snapshot
        // CORRECCIÓN: Notificar DESPUÉS para que guarde el estado final
        this.notify({ fullRender: true }); // Forzar render completo Y guardado
        return appliedChanges;
    }
    discardPendingChanges() {
        const restored = this.changeTracker.restoreSnapshot(); // Restaura datos en versionStore/cduStore
        this.changeTracker.reset(); // Limpia lista pendiente y snapshot
        if (restored) {
             // Notificar que se restauró, forzando render pero SIN guardar (estado ya estaba guardado)
             this.notify({ fullRender: true, skipSave: true });
        } else {
             // Si no había snapshot, igual notificar por si acaso
             this.notify({ fullRender: true, skipSave: true });
        }
    }

    // =============== IMPORTACIÓN / REEMPLAZO ===============
    replaceAll(nuevasVersiones, versionEnProduccionIdImportado = null) {
        console.log('🔄 DIAGNÓSTICO - dataStore.replaceAll llamado');
        this.changeTracker.reset(); // Limpiar cambios pendientes
        this.versionStore.replaceAll(nuevasVersiones, versionEnProduccionIdImportado); // Reemplazar y normalizar
        this.cduStore.syncNextCduId(); // Sincronizar IDs CDU
        this.notify({ fullRender: true }); // Notificar con render completo Y guardar
        console.log('✅ DIAGNÓSTICO - replaceAll completado.');
    }

    // =============== ESTADÍSTICAS ===============
    getUniqueStats() { return this.statsCalculator.getUniqueStats(); }
    getStats() { return this.statsCalculator.getGlobalStats(); }
    getVersionStats(versionId) { return this.statsCalculator.getVersionStats(versionId); }
    getAggregatedStats() { return this.statsCalculator.getAggregatedStats(); }

} // Fin clase DataStore