// dataStore.js - Manejo del estado y datos con versiones agrupadas

export class DataStore {
    constructor() {
        // Estructura: versiones con sus CDUs
        this.versiones = [
            {
                id: 1,
                numero: '8',
                fechaDespliegue: '2025-10-06',
                horaDespliegue: '09:00',
                cdus: [
                    {
                        id: 1,
                        nombreCDU: 'PORTA',
                        descripcionCDU: 'Portabilidad de líneas',
                        estado: 'En Produccion',
                        responsable: 'Juan Pérez',
                        observaciones: 'Se actualizó el flujo de validación de números'
                    },
                    {
                        id: 2,
                        nombreCDU: 'PREPAGO',
                        descripcionCDU: 'Gestión de recargas prepago',
                        estado: 'Certificado OK',
                        responsable: 'María García',
                        observaciones: 'Corrección de bug en el cálculo de saldo'
                    }
                ]
            }
        ];
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
        return JSON.parse(JSON.stringify(this.versiones)); // Deep copy
    }

    // Obtener el último número de versión
    getLatestVersionNumber() {
        if (this.versiones.length === 0) return 0;
        
        const numeros = this.versiones
            .map(v => parseInt(v.numero))
            .filter(n => !isNaN(n));
        
        return numeros.length > 0 ? Math.max(...numeros) : 0;
    }

    // Crear nueva versión con el número incrementado
    addNewVersion() {
        const latestNumber = this.getLatestVersionNumber();
        const newNumber = String(latestNumber + 1);
        
        const nuevaVersion = {
            id: this.nextVersionId++,
            numero: newNumber,
            fechaDespliegue: new Date().toISOString().split('T')[0],
            horaDespliegue: '',
            cdus: [
                {
                    id: this.nextCduId++,
                    nombreCDU: '',
                    descripcionCDU: '',
                    estado: 'En Desarrollo',
                    responsable: '',
                    observaciones: ''
                }
            ]
        };
        
        this.versiones.push(nuevaVersion);
        this.notify();
        return nuevaVersion;
    }

    // Agregar CDU a la última versión
    addCduToLatestVersion() {
        if (this.versiones.length === 0) {
            // Si no hay versiones, crear la versión 1
            return this.addNewVersion();
        }
        
        const ultimaVersion = this.versiones[this.versiones.length - 1];
        
        const nuevoCdu = {
            id: this.nextCduId++,
            nombreCDU: '',
            descripcionCDU: '',
            estado: 'En Desarrollo',
            responsable: '',
            observaciones: ''
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

    // Obtener estadísticas
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