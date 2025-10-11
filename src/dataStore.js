// dataStore.js - Manejo del estado y datos con sistema de cambios pendientes y anulación

import { v4 as uuidv4 } from 'uuid';

export class DataStore {
    constructor() {
        this.versiones = [];
        this.nextVersionId = 2;
        this.nextCduId = 3;
        this.versionEnProduccionId = null;
        this.observers = [];
        
        // Sistema de cambios pendientes
        this.pendingChanges = [];
        this.changeObservers = [];
        
        // Sistema de snapshot para poder revertir cambios
        this.snapshot = null;
    }

    subscribe(callback) {
        this.observers.push(callback);
    }

    subscribeToChanges(callback) {
        this.changeObservers.push(callback);
    }

    notifyChangeObservers() {
        this.changeObservers.forEach(callback => callback(this.pendingChanges));
    }

    notify() {
        this.observers.forEach(callback => callback(this.versiones));
    }

    getAll() {
        return this.versiones;
    }

    getPendingChanges() {
        return this.pendingChanges;
    }

    hasPendingChanges() {
        return this.pendingChanges.length > 0;
    }

    // Agregar cambio pendiente con lógica de anulación
    addPendingChange(change) {
        // Crear snapshot si es el primer cambio
        if (this.pendingChanges.length === 0) {
            this.snapshot = JSON.parse(JSON.stringify(this.versiones));
            console.log('📸 Snapshot creado');
        }
        
        // LÓGICA DE ANULACIÓN: Buscar cambios opuestos
        const oppositeIndex = this.findOppositeChange(change);
        
        if (oppositeIndex !== -1) {
            // Hay un cambio opuesto, anularlos
            console.log('🔄 Cambio opuesto encontrado, anulando ambos');
            this.pendingChanges.splice(oppositeIndex, 1);
            
            // Si ya no hay cambios pendientes, limpiar snapshot
            if (this.pendingChanges.length === 0) {
                this.snapshot = null;
                console.log('🗑️ Snapshot limpiado (sin cambios pendientes)');
            }
            
            this.notifyChangeObservers();
            return;
        }
        
        // Verificar si ya existe un cambio para el mismo item y campo
        const existingIndex = this.pendingChanges.findIndex(
            c => c.cduId === change.cduId && 
                 c.campo === change.campo && 
                 c.versionId === change.versionId &&
                 (c.index === change.index || (c.index === undefined && change.index === undefined))
        );

        if (existingIndex !== -1) {
            const originalValorAnterior = this.pendingChanges[existingIndex].valorAnterior;
            
            if (change.valorNuevo === originalValorAnterior) {
                this.pendingChanges.splice(existingIndex, 1);
            } else {
                this.pendingChanges[existingIndex] = {
                    ...change,
                    valorAnterior: originalValorAnterior
                };
            }
        } else {
            this.pendingChanges.push(change);
        }

        this.notifyChangeObservers();
    }

    // Buscar cambio opuesto para anular (crear vs eliminar)
    findOppositeChange(change) {
        // Crear CDU vs Eliminar CDU
        if (change.tipo === 'creacion' && change.campo === 'creacion') {
            return this.pendingChanges.findIndex(
                c => c.cduId === change.cduId && c.tipo === 'eliminacion' && c.campo === 'cdu-eliminado'
            );
        }
        if (change.tipo === 'eliminacion' && change.campo === 'cdu-eliminado') {
            return this.pendingChanges.findIndex(
                c => c.cduId === change.cduId && c.tipo === 'creacion' && c.campo === 'creacion'
            );
        }
        
        // Agregar responsable vs Eliminar responsable
        if (change.campo === 'responsable-agregado') {
            return this.pendingChanges.findIndex(
                c => c.cduId === change.cduId && 
                     c.campo === 'responsable-eliminado' &&
                     c.index === change.index
            );
        }
        if (change.campo === 'responsable-eliminado') {
            // Buscar si se agregó recientemente
            for (let i = this.pendingChanges.length - 1; i >= 0; i--) {
                const c = this.pendingChanges[i];
                if (c.cduId === change.cduId && c.campo === 'responsable-agregado') {
                    // Verificar si es el mismo índice o el último agregado
                    return i;
                }
            }
        }
        
        // Agregar observación vs Eliminar observación
        if (change.campo === 'observacion-agregada') {
            return this.pendingChanges.findIndex(
                c => c.cduId === change.cduId && 
                     c.campo === 'observacion-eliminada' &&
                     c.index === change.index
            );
        }
        if (change.campo === 'observacion-eliminada') {
            // Buscar si se agregó recientemente
            for (let i = this.pendingChanges.length - 1; i >= 0; i--) {
                const c = this.pendingChanges[i];
                if (c.cduId === change.cduId && c.campo === 'observacion-agregada') {
                    return i;
                }
            }
        }
        
        // Agregar comentario de versión vs Eliminar comentario de versión
        if (change.campo && change.campo.includes('-agregado')) {
            const categoria = change.campo.replace('-agregado', '');
            return this.pendingChanges.findIndex(
                c => c.versionId === change.versionId &&
                     c.campo === categoria + '-eliminado' &&
                     c.index === change.index
            );
        }
        if (change.campo && change.campo.includes('-eliminado')) {
            const categoria = change.campo.replace('-eliminado', '');
            for (let i = this.pendingChanges.length - 1; i >= 0; i--) {
                const c = this.pendingChanges[i];
                if (c.versionId === change.versionId && c.campo === categoria + '-agregado') {
                    return i;
                }
            }
        }
        
        return -1;
    }

applyPendingChanges() {
    const appliedChanges = [...this.pendingChanges];
    
    // Los cambios ya están aplicados en versiones, solo limpiamos
    this.pendingChanges = [];
    this.snapshot = null;
    
    console.log('✅ Cambios confirmados, snapshot eliminado');
    
    this.notifyChangeObservers();
    this.notify();

    return appliedChanges;
}

    discardPendingChanges() {
        // Restaurar desde snapshot si existe
        if (this.snapshot) {
            this.versiones = JSON.parse(JSON.stringify(this.snapshot));
                    if (this.snapshot.versionEnProduccionId !== undefined) {
            this.versionEnProduccionId = this.snapshot.versionEnProduccionId;
        }
            this.snapshot = null;
            console.log('↩️ Cambios revertidos desde snapshot');
        }
        
        this.pendingChanges = [];
        this.notifyChangeObservers();
        this.notify();
    }

    getLatestVersionNumber() {
        if (this.versiones.length === 0) return 0;
        
        const numeros = this.versiones
            .map(v => parseInt(v.numero))
            .filter(n => !isNaN(n));
        
        return numeros.length > 0 ? Math.max(...numeros) : 0;
    }

    addHistorialEntry(cduId, tipo, valorAnterior, valorNuevo, campo = '') {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu) {
                if (!Array.isArray(cdu.historial)) {
                    cdu.historial = [];
                }
                
                const entry = {
                    timestamp: new Date().toISOString(),
                    tipo,
                    campo,
                    valorAnterior,
                    valorNuevo
                };
                
                cdu.historial.push(entry);
                return;
            }
        }
    }

    getDefaultComentarios() {
        return {
            mejoras: [],
            salidas: [],
            cambiosCaliente: [],
            observaciones: []
        };
    }

    addNewEmptyVersion() {
        const latestNumber = this.getLatestVersionNumber();
        const newNumber = String(latestNumber + 1);
        
        const nuevaVersion = {
            id: this.nextVersionId++,
            numero: newNumber,
            fechaDespliegue: new Date().toISOString().split('T')[0],
            horaDespliegue: '',
            comentarios: this.getDefaultComentarios(),
            cdus: []
        };
        
        this.versiones.push(nuevaVersion);
        this.notify();
        return nuevaVersion;
    }

    duplicateVersion(versionId) {
        const versionToCopy = this.versiones.find(v => v.id === versionId);
        if (!versionToCopy) return null;
        
        const latestNumber = this.getLatestVersionNumber();
        const newNumber = String(latestNumber + 1);
        
const cdusCopy = versionToCopy.cdus.map(cdu => ({
    id: this.nextCduId++,
    uuid: cdu.uuid,
    nombreCDU: cdu.nombreCDU,
    descripcionCDU: cdu.descripcionCDU,
    estado: cdu.estado,
    versionBADA: cdu.versionBADA || 'V1', // NUEVO
    responsables: Array.isArray(cdu.responsables) 
        ? cdu.responsables.map(r => ({...r}))
        : (cdu.responsable ? [{ nombre: cdu.responsable, rol: 'DEV' }] : []),
    observaciones: [...(cdu.observaciones || [])],
    historial: []
}));
        
        const nuevaVersion = {
            id: this.nextVersionId++,
            numero: newNumber,
            fechaDespliegue: new Date().toISOString().split('T')[0],
            horaDespliegue: '',
            comentarios: this.getDefaultComentarios(),
            cdus: cdusCopy
        };
        
        this.versiones.push(nuevaVersion);
        this.notify();
        return nuevaVersion;
    }

    addCduToLatestVersion() {
        if (this.versiones.length === 0) {
            this.addNewEmptyVersion();
        }
        
        const ultimaVersion = this.versiones[this.versiones.length - 1];
        
        const nuevoCdu = {
    id: this.nextCduId++,
    uuid: uuidv4(),
    nombreCDU: '',
    descripcionCDU: '',
    estado: 'En Desarrollo',
    versionBADA: 'V1', // NUEVO
    responsables: [],
    observaciones: [],
    historial: [{
        timestamp: new Date().toISOString(),
        tipo: 'creacion',
        campo: '',
        valorAnterior: null,
        valorNuevo: 'CDU Creado'
    }]
};
        
        ultimaVersion.cdus.push(nuevoCdu);
        
        this.addPendingChange({
            cduId: nuevoCdu.id,
            campo: 'creacion',
            valorAnterior: null,
            valorNuevo: 'CDU creado',
            cduNombre: 'Nuevo CDU',
            versionNumero: ultimaVersion.numero,
            timestamp: new Date().toISOString(),
            tipo: 'creacion'
        });
        
        this.notify();
        return nuevoCdu;
    }

    addCduToVersion(versionId) {
        const version = this.versiones.find(v => v.id === versionId);
        if (!version) return null;
        
const nuevoCdu = {
    id: this.nextCduId++,
    uuid: uuidv4(),
    nombreCDU: '',
    descripcionCDU: '',
    estado: 'En Desarrollo',
    versionBADA: 'V1', // NUEVO
    responsables: [],
    observaciones: [],
    historial: [{
        timestamp: new Date().toISOString(),
        tipo: 'creacion',
        campo: '',
        valorAnterior: null,
        valorNuevo: 'CDU Creado'
    }]
};
        
        version.cdus.push(nuevoCdu);
        
        this.addPendingChange({
            cduId: nuevoCdu.id,
            campo: 'creacion',
            valorAnterior: null,
            valorNuevo: 'CDU creado',
            cduNombre: 'Nuevo CDU',
            versionNumero: version.numero,
            timestamp: new Date().toISOString(),
            tipo: 'creacion'
        });
        
        this.notify();
        return nuevoCdu;
    }

    updateVersion(versionId, campo, valor) {
        const version = this.versiones.find(v => v.id === versionId);
        if (version) {
            version[campo] = valor;
            this.notify();
        }
    }
    setVersionEnProduccion(versionId) {
    // Si es la misma versión, desmarcar
    if (this.versionEnProduccionId === versionId) {
        this.versionEnProduccionId = null;
    } else {
        this.versionEnProduccionId = versionId;
    }
    this.notify();
}

getVersionEnProduccionId() {
    return this.versionEnProduccionId;
}
setVersionEnProduccionTemporal(versionId) {
    // Crear snapshot si es el primer cambio pendiente
    if (this.pendingChanges.length === 0) {
        this.snapshot = JSON.parse(JSON.stringify({
            versiones: this.versiones,
            versionEnProduccionId: this.versionEnProduccionId
        }));
        console.log('📸 Snapshot creado (incluye versión en producción)');
    }
    
    // Aplicar temporalmente
    const valorAnterior = this.versionEnProduccionId;
    
    if (this.versionEnProduccionId === versionId) {
        this.versionEnProduccionId = null;
    } else {
        this.versionEnProduccionId = versionId;
    }
    
    this.notify();
    
    return valorAnterior;
}

    addComentarioCategoria(versionId, categoria, texto = '') {
        const version = this.versiones.find(v => v.id === versionId);
        if (version) {
            if (typeof version.comentarios === 'string') {
                const oldComments = version.comentarios;
                version.comentarios = this.getDefaultComentarios();
                if (oldComments) {
                    version.comentarios.observaciones.push(oldComments);
                }
            }
            
            if (!version.comentarios[categoria]) {
                version.comentarios[categoria] = [];
            }
            
            version.comentarios[categoria].push(texto);
            this.notify();
        }
    }

    updateComentarioCategoria(versionId, categoria, index, texto) {
        const version = this.versiones.find(v => v.id === versionId);
        if (version && version.comentarios[categoria] && index < version.comentarios[categoria].length) {
            version.comentarios[categoria][index] = texto;
            this.notify();
        }
    }

    deleteComentarioCategoria(versionId, categoria, index) {
        const version = this.versiones.find(v => v.id === versionId);
        if (version && version.comentarios[categoria] && index < version.comentarios[categoria].length) {
            version.comentarios[categoria].splice(index, 1);
            this.notify();
        }
    }

    updateCdu(cduId, campo, valor) {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu) {
                const valorAnterior = cdu[campo];
                
                if (valorAnterior !== valor) {
                    cdu[campo] = valor;
                    
                    let tipo = campo;
                    if (campo === 'nombreCDU') tipo = 'nombre';
                    if (campo === 'descripcionCDU') tipo = 'descripcion';
                    
                    this.addHistorialEntry(cduId, tipo, valorAnterior, valor, campo);
                    this.notify();
                }
                return;
            }
        }
    }

    addResponsable(cduId, nombre = '', rol = 'DEV') {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu) {
                if (!Array.isArray(cdu.responsables)) {
                    cdu.responsables = [];
                }
                cdu.responsables.push({ nombre, rol });
                
                this.addHistorialEntry(cduId, 'responsable', null, `Agregado: ${nombre || '(vacío)'} (${rol})`);
                this.notify();
                return;
            }
        }
    }

    updateResponsable(cduId, index, campo, valor) {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu && Array.isArray(cdu.responsables) && index < cdu.responsables.length) {
                const valorAnterior = cdu.responsables[index][campo];
                
                if (valorAnterior !== valor) {
                    cdu.responsables[index][campo] = valor;
                    
                    if (campo === 'nombre') {
                        this.addHistorialEntry(cduId, 'responsable', 
                            `${valorAnterior || '(vacío)'} (${cdu.responsables[index].rol})`, 
                            `${valor || '(vacío)'} (${cdu.responsables[index].rol})`);
                    } else if (campo === 'rol') {
                        this.addHistorialEntry(cduId, 'responsable', 
                            `${cdu.responsables[index].nombre || '(vacío)'} (${valorAnterior})`,
                            `${cdu.responsables[index].nombre || '(vacío)'} (${valor})`);
                    }
                    
                    this.notify();
                }
                return;
            }
        }
    }

    deleteResponsable(cduId, index) {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu && Array.isArray(cdu.responsables) && index < cdu.responsables.length) {
                const responsable = cdu.responsables[index];
                cdu.responsables.splice(index, 1);
                
                this.addHistorialEntry(cduId, 'responsable', 
                    `${responsable.nombre || '(vacío)'} (${responsable.rol})`, 
                    'Eliminado');
                this.notify();
                return;
            }
        }
    }

    addObservacion(cduId, texto = '') {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu) {
                if (!Array.isArray(cdu.observaciones)) {
                    cdu.observaciones = [];
                }
                cdu.observaciones.push(texto);
                
                this.addHistorialEntry(cduId, 'observacion', null, 'Nueva observación agregada');
                this.notify();
                return;
            }
        }
    }

    updateObservacion(cduId, index, texto) {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu && Array.isArray(cdu.observaciones) && index < cdu.observaciones.length) {
                const valorAnterior = cdu.observaciones[index];
                
                if (valorAnterior !== texto) {
                    cdu.observaciones[index] = texto;
                    this.notify();
                }
                return;
            }
        }
    }

    deleteObservacion(cduId, index) {
        for (const version of this.versiones) {
            const cdu = version.cdus.find(c => c.id === cduId);
            if (cdu && Array.isArray(cdu.observaciones) && index < cdu.observaciones.length) {
                cdu.observaciones.splice(index, 1);
                
                this.addHistorialEntry(cduId, 'observacion', null, 'Observación eliminada');
                this.notify();
                return;
            }
        }
    }

    deleteVersion(versionId) {
        this.versiones = this.versiones.filter(v => v.id !== versionId);
        this.notify();
    }

    deleteCdu(cduId) {
        for (const version of this.versiones) {
            const index = version.cdus.findIndex(c => c.id === cduId);
            if (index !== -1) {
                version.cdus.splice(index, 1);
                
                if (version.cdus.length === 0) {
                    this.deleteVersion(version.id);
                }
                
                this.notify();
                return;
            }
        }
    }

    replaceAll(nuevasVersiones) {
        console.log('🔄 DIAGNÓSTICO - dataStore.replaceAll llamado');
    console.log('  Versiones actuales antes de reemplazar:', this.versiones.length);
    console.log('  Nuevas versiones a agregar:', nuevasVersiones.length);
        if (nuevasVersiones.length > 0) {
            this.nextVersionId = Math.max(...nuevasVersiones.map(v => v.id)) + 1;
            
            let maxCduId = 0;
            nuevasVersiones.forEach(v => {
    v.cdus.forEach(c => {
        if (c.id > maxCduId) maxCduId = c.id;
        
        // NUEVO: Retrocompatibilidad
        if (!c.versionBADA) {
            c.versionBADA = 'V1';
        }
        
        if (c.responsable && !Array.isArray(c.responsables)) {
            c.responsables = [{ nombre: c.responsable, rol: 'DEV' }];
        } else if (!Array.isArray(c.responsables)) {
            c.responsables = [];
        }
    });
                
                if (typeof v.comentarios === 'string') {
                    const oldComments = v.comentarios;
                    v.comentarios = this.getDefaultComentarios();
                    if (oldComments) {
                        v.comentarios.observaciones.push(oldComments);
                    }
                } else if (!v.comentarios) {
                    v.comentarios = this.getDefaultComentarios();
                }
            });
            this.nextCduId = maxCduId + 1;
        }
            // AGREGAR ESTO:
    console.log('🔍 DIAGNÓSTICO - Antes de asignar:');
    nuevasVersiones.forEach(v => {
        console.log(`  Versión ${v.numero}: ${v.cdus.length} CDUs`);
    });
        this.versiones = nuevasVersiones;
        if (this.versionEnProduccionId) {
    const existe = this.versiones.find(v => v.id === this.versionEnProduccionId);
    if (!existe) {
        this.versionEnProduccionId = null;
    }
}
        this.notify();
            // AGREGAR ESTO:
    console.log('✅ DIAGNÓSTICO - DESPUÉS de notify:');
    console.log('  Total versiones en dataStore:', this.versiones.length);
    this.versiones.forEach(v => {
        console.log(`  Versión ${v.numero}: ${v.cdus.length} CDUs`);
    });
    }

    getUniqueStats() {
        const cduMap = new Map();
        
        for (let i = this.versiones.length - 1; i >= 0; i--) {
            const version = this.versiones[i];
            version.cdus.forEach(cdu => {
                const uuid = cdu.uuid;
                
                if (uuid && !cduMap.has(uuid)) {
                    cduMap.set(uuid, cdu.estado);
                }
            });
        }
        
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