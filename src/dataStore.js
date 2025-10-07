// dataStore.js - Manejo del estado y datos con versiones agrupadas

import { v4 as uuidv4 } from 'uuid';

export class DataStore {
    constructor() {
        // Estructura: versiones con sus CDUs
        this.versiones = [];
        this.nextVersionId = 2;
        this.nextCduId = 3;
        this.observers = [];
    }

    subscribe(callback) {
        this.observers.push(callback);
    }

    notify() {
        this.observers.forEach(callback => callback(this.versiones));
    }

    getAll() {
        // Devolver referencia directa para lectura
        return this.versiones;
    }

    // Obtener el último número de versión
    getLatestVersionNumber() {
        if (this.versiones.length === 0) return 0;
        
        const numeros = this.versiones
            .map(v => parseInt(v.numero))
            .filter(n => !isNaN(n));
        
        return numeros.length > 0 ? Math.max(...numeros) : 0;
    }

    // Crear nueva versión vacía (sin CDUs)
    addNewEmptyVersion() {
        const latestNumber = this.getLatestVersionNumber();
        const newNumber = String(latestNumber + 1);
        
        const nuevaVersion = {
            id: this.nextVersionId++,
            numero: newNumber,
            fechaDespliegue: new Date().toISOString().split('T')[0],
            horaDespliegue: '',
            cdus: []
        };
        
        this.versiones.push(nuevaVersion);
        this.notify();
        return nuevaVersion;
    }

    // Duplicar versión: crear nueva versión copiando los CDUs de otra
    duplicateVersion(versionId) {
        const versionToCopy = this.versiones.find(v => v.id === versionId);
        if (!versionToCopy) return null;
        
        const latestNumber = this.getLatestVersionNumber();
        const newNumber = String(latestNumber + 1);
        
        // Copiar CDUs manteniendo UUID, descripción y estado
        const cdusCopy = versionToCopy.cdus.map(cdu => ({
            id: this.nextCduId++, // Nuevo ID para el DOM
            uuid: cdu.uuid, // Mantener el mismo UUID para tracking
            nombreCDU: cdu.nombreCDU,
            descripcionCDU: cdu.descripcionCDU,
            estado: cdu.estado,
            responsable: cdu.responsable,
            observaciones: [...(cdu.observaciones || [])]
        }));
        
        const nuevaVersion = {
            id: this.nextVersionId++,
            numero: newNumber,
            fechaDespliegue: new Date().toISOString().split('T')[0],
            horaDespliegue: '',
            cdus: cdusCopy
        };
        
        this.versiones.push(nuevaVersion);
        this.notify();
        return nuevaVersion;
    }

    // Agregar CDU a la última versión
    addCduToLatestVersion() {
        if (this.versiones.length === 0) {
            // Si no hay versiones, crear una versión vacía primero
            this.addNewEmptyVersion();
        }
        
        const ultimaVersion = this.versiones[this.versiones.length - 1];
        
        const nuevoCdu = {
            id: this.nextCduId++,
            uuid: uuidv4(), // UUID único para rastrear el CDU a través de versiones
            nombreCDU: '',
            descripcionCDU: '',
            estado: 'En Desarrollo',
            responsable: '',
            observaciones: []
        };
        
        ultimaVersion.cdus.push(nuevoCdu);
        this.notify();
        return nuevoCdu;
    }

    // Actualizar datos de versión (fecha, hora)
    updateVersion(versionId, campo, valor) {
        const version = this.versiones.find(v => v.id === versionId);
        if (version) {
            version[campo] = valor;
            this.notify();
        }
    }

    // Actualizar datos de CDU
    updateCdu(cduId, campo, valor) {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu) {
                cdu[campo] = valor;
                this.notify();
                return;
            }
        }
    }

    // Agregar observación a un CDU
    addObservacion(cduId, texto = '') {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu) {
                if (!Array.isArray(cdu.observaciones)) {
                    cdu.observaciones = [];
                }
                cdu.observaciones.push(texto);
                this.notify();
                return;
            }
        }
    }

    // Actualizar observación específica
    updateObservacion(cduId, index, texto) {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu && Array.isArray(cdu.observaciones) && index < cdu.observaciones.length) {
                cdu.observaciones[index] = texto;
                this.notify();
                return;
            }
        }
    }

    // Eliminar observación específica
    deleteObservacion(cduId, index) {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu && Array.isArray(cdu.observaciones) && index < cdu.observaciones.length) {
                cdu.observaciones.splice(index, 1);
                this.notify();
                return;
            }
        }
    }

    // Eliminar versión completa
    deleteVersion(versionId) {
        this.versiones = this.versiones.filter(v => v.id !== versionId);
        this.notify();
    }

    // Eliminar CDU específico
    deleteCdu(cduId) {
        for (const version of this.versiones) {
            const index = version.cdus.findIndex(c => c.id === cduId);
            if (index !== -1) {
                version.cdus.splice(index, 1);
                
                // Si la versión quedó sin CDUs, eliminar la versión
                if (version.cdus.length === 0) {
                    this.deleteVersion(version.id);
                }
                
                this.notify();
                return;
            }
        }
    }

    // Reemplazar todas las versiones (para carga de archivo)
    replaceAll(nuevasVersiones) {
        if (nuevasVersiones.length > 0) {
            this.nextVersionId = Math.max(...nuevasVersiones.map(v => v.id)) + 1;
            
            let maxCduId = 0;
            nuevasVersiones.forEach(v => {
                v.cdus.forEach(c => {
                    if (c.id > maxCduId) maxCduId = c.id;
                });
            });
            this.nextCduId = maxCduId + 1;
        }
        
        this.versiones = nuevasVersiones;
        this.notify();
    }

    // Obtener estadísticas únicas (por UUID de CDU)
    getUniqueStats() {
        const cduMap = new Map();
        
        // Recorrer versiones de la más reciente a la más antigua
        // para obtener el último estado de cada CDU
        for (let i = this.versiones.length - 1; i >= 0; i--) {
            const version = this.versiones[i];
            version.cdus.forEach(cdu => {
                const uuid = cdu.uuid;
                
                // Solo agregar si no existe (usamos la versión más reciente)
                if (uuid && !cduMap.has(uuid)) {
                    cduMap.set(uuid, cdu.estado);
                }
            });
        }
        
        // Contar estados
        let total = 0;
        let desarrollo = 0;
        let pendiente = 0;
        let certificado = 0;
        let produccion = 0;
        
        cduMap.forEach(estado => {
            total++;
            switch(estado) {
                case 'En Desarrollo':
                    desarrollo++;
                    break;
                case 'Pendiente de Certificacion':
                    pendiente++;
                    break;
                case 'Certificado OK':
                    certificado++;
                    break;
                case 'En Produccion':
                    produccion++;
                    break;
            }
        });
        
        return { total, desarrollo, pendiente, certificado, produccion };
    }

    // Obtener estadísticas normales (todos los CDUs)
    getStats() {
        let total = 0;
        let desarrollo = 0;
        let pendiente = 0;
        let certificado = 0;
        let produccion = 0;
        
        this.versiones.forEach(version => {
            version.cdus.forEach(cdu => {
                total++;
                switch(cdu.estado) {
                    case 'En Desarrollo':
                        desarrollo++;
                        break;
                    case 'Pendiente de Certificacion':
                        pendiente++;
                        break;
                    case 'Certificado OK':
                        certificado++;
                        break;
                    case 'En Produccion':
                        produccion++;
                        break;
                }
            });
        });
        
        return { total, desarrollo, pendiente, certificado, produccion };
    }
}