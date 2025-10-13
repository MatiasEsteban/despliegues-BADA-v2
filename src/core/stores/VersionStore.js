// stores/VersionStore.js - Gestión de versiones

export class VersionStore {
    constructor() {
        this.versiones = [];
        this.nextVersionId = 2;
        this.versionEnProduccionId = null;
    }

    /**
     * Obtiene todas las versiones
     */
    getAll() {
        return this.versiones;
    }

    /**
     * Obtiene una versión por ID
     */
    getById(versionId) {
        return this.versiones.find(v => v.id === versionId);
    }

    /**
     * Obtiene el número de versión más alto
     */
    getLatestVersionNumber() {
        if (this.versiones.length === 0) return 0;
        
        const numeros = this.versiones
            .map(v => parseInt(v.numero))
            .filter(n => !isNaN(n));
        
        return numeros.length > 0 ? Math.max(...numeros) : 0;
    }

    /**
     * Agrega una nueva versión vacía
     */
    addEmptyVersion() {
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
        return nuevaVersion;
    }

    /**
     * Duplica una versión existente con nuevo ID
     */
    duplicateVersion(versionId, cdusCopy) {
        const versionToCopy = this.getById(versionId);
        if (!versionToCopy) return null;
        
        const latestNumber = this.getLatestVersionNumber();
        const newNumber = String(latestNumber + 1);
        
        const nuevaVersion = {
            id: this.nextVersionId++,
            numero: newNumber,
            fechaDespliegue: new Date().toISOString().split('T')[0],
            horaDespliegue: '',
            comentarios: this.getDefaultComentarios(),
            cdus: cdusCopy
        };
        
        this.versiones.push(nuevaVersion);
        return nuevaVersion;
    }

    /**
     * Actualiza un campo de una versión
     */
    updateVersion(versionId, campo, valor) {
        const version = this.getById(versionId);
        if (version) {
            version[campo] = valor;
            return true;
        }
        return false;
    }

    /**
     * Elimina una versión
     */
    deleteVersion(versionId) {
        const index = this.versiones.findIndex(v => v.id === versionId);
        if (index !== -1) {
            this.versiones.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Reemplaza todas las versiones
     */
    replaceAll(nuevasVersiones) {
        if (nuevasVersiones.length > 0) {
            this.nextVersionId = Math.max(...nuevasVersiones.map(v => v.id)) + 1;
        }
        
        this.versiones = nuevasVersiones;
        
        // Verificar si la versión en producción aún existe
        if (this.versionEnProduccionId) {
            const existe = this.versiones.find(v => v.id === this.versionEnProduccionId);
            if (!existe) {
                this.versionEnProduccionId = null;
            }
        }
    }

    /**
     * Gestión de versión en producción
     */
    setVersionEnProduccion(versionId) {
        if (this.versionEnProduccionId === versionId) {
            this.versionEnProduccionId = null;
        } else {
            this.versionEnProduccionId = versionId;
        }
    }

    getVersionEnProduccionId() {
        return this.versionEnProduccionId;
    }

    /**
     * Gestión de comentarios de versión
     */
    addComentarioCategoria(versionId, categoria, texto = '') {
        const version = this.getById(versionId);
        if (!version) return false;
        
        // Migrar formato antiguo si es necesario
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
        return true;
    }

    updateComentarioCategoria(versionId, categoria, index, texto) {
        const version = this.getById(versionId);
        if (!version || !version.comentarios[categoria]) return false;
        
        if (index < version.comentarios[categoria].length) {
            version.comentarios[categoria][index] = texto;
            return true;
        }
        return false;
    }

    deleteComentarioCategoria(versionId, categoria, index) {
        const version = this.getById(versionId);
        if (!version || !version.comentarios[categoria]) return false;
        
        if (index < version.comentarios[categoria].length) {
            version.comentarios[categoria].splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Estructura de comentarios por defecto
     */
    getDefaultComentarios() {
        return {
            mejoras: [],
            salidas: [],
            cambiosCaliente: [],
            observaciones: []
        };
    }

    /**
     * Sincroniza el nextVersionId con los IDs existentes
     */
    syncNextVersionId() {
        if (this.versiones.length > 0) {
            this.nextVersionId = Math.max(...this.versiones.map(v => v.id)) + 1;
        }
    }
}