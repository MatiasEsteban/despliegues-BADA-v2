// dataStore.js - Manejo del estado y datos de la aplicación

export class DataStore {
    constructor() {
        this.registros = [
            {
                id: 1,
                fechaDespliegue: '2025-10-06',
                version: '8.0',
                nombreCDU: 'PORTA',
                descripcionCDU: 'Portabilidad de líneas',
                estado: 'Listo',
                observaciones: 'Se actualizó el flujo de validación de números',
                responsable: 'Juan Pérez',
                horaDespliegue: '09:00'
            },
            {
                id: 2,
                fechaDespliegue: '2025-10-06',
                version: '8.0',
                nombreCDU: 'PREPAGO',
                descripcionCDU: 'Gestión de recargas prepago',
                estado: 'Listo',
                observaciones: 'Corrección de bug en el cálculo de saldo',
                responsable: 'María García',
                horaDespliegue: '09:00'
            }
        ];
        this.nextId = 3;
        this.observers = [];
    }

    subscribe(callback) {
        this.observers.push(callback);
    }

    notify() {
        this.observers.forEach(callback => callback(this.registros));
    }

    getAll() {
        return [...this.registros];
    }

    add(registro = {}) {
        const nuevoRegistro = {
            id: this.nextId++,
            fechaDespliegue: '',
            version: '',
            nombreCDU: '',
            descripcionCDU: '',
            estado: 'Pendiente',
            observaciones: '',
            responsable: '',
            horaDespliegue: '',
            ...registro
        };
        
        this.registros.push(nuevoRegistro);
        this.notify();
        return nuevoRegistro;
    }

    update(id, campo, valor) {
        const registro = this.registros.find(r => r.id === id);
        if (registro) {
            registro[campo] = valor;
            this.notify();
        }
    }

    delete(id) {
        this.registros = this.registros.filter(r => r.id !== id);
        this.notify();
    }

    getStats() {
        return {
            total: this.registros.length,
            listos: this.registros.filter(r => r.estado === 'Listo').length,
            proceso: this.registros.filter(r => r.estado === 'En Proceso').length,
            pendientes: this.registros.filter(r => r.estado === 'Pendiente').length
        };
    }
}