import { NotificationSystem } from '../utils/notifications.js';

const STORAGE_KEY = 'desplieguesBadaState';

export class StorageManager {
    /**
     * Guarda el estado actual de la aplicación en localStorage.
     * @param {DataStore} dataStore - La instancia del dataStore.
     */
    static saveState(dataStore) {
        try {
            const state = {
                versiones: dataStore.getAll(),
                versionEnProduccionId: dataStore.getVersionEnProduccionId(),
                timestamp: new Date().toISOString()
            };
            const serializedState = JSON.stringify(state);
            localStorage.setItem(STORAGE_KEY, serializedState);
        } catch (error) {
            console.error("Error al guardar en localStorage:", error);
            NotificationSystem.error('No se pudo guardar el estado de la aplicación.');
        }
    }

    /**
     * Carga el estado de la aplicación desde localStorage.
     * @param {DataStore} dataStore - La instancia del dataStore.
     */
    static loadState(dataStore) {
        try {
            const serializedState = localStorage.getItem(STORAGE_KEY);
            if (serializedState === null) {
                return; // No hay datos guardados
            }

            const savedState = JSON.parse(serializedState);
            
            // Validar y normalizar los datos cargados antes de pasarlos al store
            if (savedState && Array.isArray(savedState.versiones)) {
                const normalizedVersiones = this.normalizeLoadedData(savedState.versiones);
                
                dataStore.replaceAll(normalizedVersiones, savedState.versionEnProduccionId);
                console.log('✅ Estado de la aplicación cargado desde localStorage.');
                NotificationSystem.success('Sesión anterior restaurada.', 2500);
            }
        } catch (error) {
            console.error("Error al cargar desde localStorage:", error);
            NotificationSystem.warning('No se pudo restaurar la sesión anterior (datos corruptos).');
            this.clearState(); // Limpiar datos corruptos
        }
    }

    /**
     * Valida y asegura que los datos cargados tengan la estructura correcta.
     * Esto previene errores si la estructura de datos cambia entre versiones de la app.
     * @param {Array} versiones - Las versiones cargadas de localStorage.
     * @returns {Array} - Las versiones normalizadas y seguras para usar.
     */
    static normalizeLoadedData(versiones) {
        return versiones.map(v => {
            const defaultComentarios = {
                mejoras: [],
                salidas: [],
                cambiosCaliente: [],
                observaciones: []
            };

            // Asegurar que cada versión tenga las propiedades esperadas
            const normalizedVersion = {
                id: v.id,
                numero: v.numero || 'Sin número',
                fechaDespliegue: v.fechaDespliegue || '',
                horaDespliegue: v.horaDespliegue || '',
                // Asegurar que `comentarios` sea un objeto con todas las claves
                comentarios: (typeof v.comentarios === 'object' && v.comentarios !== null) 
                    ? { ...defaultComentarios, ...v.comentarios } 
                    : defaultComentarios,
                // ¡CRÍTICO! Asegurar que `cdus` sea siempre un array.
                cdus: Array.isArray(v.cdus) ? v.cdus.map(c => {
                    // Normalizar cada CDU también
                    return {
                        ...c,
                        responsables: Array.isArray(c.responsables) ? c.responsables : [],
                        observaciones: Array.isArray(c.observaciones) ? c.observaciones : [],
                        historial: Array.isArray(c.historial) ? c.historial : [],
                    };
                }) : [], 
            };
            
            // Migrar comentarios de formato string a objeto
            if (typeof v.comentarios === 'string' && v.comentarios.trim()) {
                normalizedVersion.comentarios.observaciones = [v.comentarios];
            }

            return normalizedVersion;
        });
    }

    /**
     * Limpia el estado de la aplicación de localStorage.
     */
    static clearState() {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Estado de localStorage limpiado.');
    }
}