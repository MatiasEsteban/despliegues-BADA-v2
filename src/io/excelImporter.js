// excelImporter.js - Importación de datos desde Excel

import * as XLSX from 'xlsx'; // Mantenemos la importación de xlsx, asumiendo que lo necesitas
import { Modal } from '../modals/Modal.js';
import { NotificationSystem } from '../utils/notifications.js';

export class ExcelImporter {
    constructor(dataStore, renderer) {
        this.dataStore = dataStore;
        this.renderer = renderer;
    }

    async importExcel(file) {
        try {
            const data = await this.readExcelFile(file);
            const { versiones, cduCount } = this.processExcelData(data);

            if (versiones.length === 0) {
                NotificationSystem.warning('El archivo Excel no contiene datos de versiones o CDUs válidos.');
                return;
            }

            // --- ESTE ES EL CAMBIO CLAVE ---
            // Construimos el mensaje como un string que contiene HTML.
            // Modal.confirm() lo interpretará correctamente.
            const messageHtml = `
                <p>Se encontraron:</p>
                <ul>
                    <li>${versiones.length} versiones</li>
                    <li>${cduCount} CDUs únicos</li>
                </ul>
                <p>¿Desea reemplazar los datos actuales?</p>
            `;

            const confirmed = await Modal.confirm(
                messageHtml, // Pasamos el string HTML aquí
                'Sí, reemplazar',
                'No, cancelar',
                'Confirmar Importación',
                'warning'
            );
            // --- FIN DEL CAMBIO CLAVE ---

            if (confirmed) {
                this.dataStore.reset();
                versiones.forEach(version => this.dataStore.addVersion(version));
                this.renderer.renderAll();
                NotificationSystem.success('Datos importados correctamente.');
            } else {
                NotificationSystem.info('Importación cancelada.');
            }

        } catch (error) {
            console.error('Error al cargar el archivo:', error);
            NotificationSystem.error(`Error al cargar el archivo: ${error.message}`);
        }
    }

    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    resolve(json);
                } catch (error) {
                    reject(new Error('No se pudo leer el archivo Excel. Asegúrate de que sea un formato válido.'));
                }
            };

            reader.onerror = (error) => {
                reject(new Error('Error al leer el archivo.'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    processExcelData(json) {
        const versionesMap = new Map();
        let cduIdCounter = 1;

        json.forEach(row => {
            const versionNumero = row['Versión'] || 'V_Desconocida';
            if (!versionesMap.has(versionNumero)) {
                versionesMap.set(versionNumero, {
                    id: versionesMap.size + 1,
                    numero: versionNumero,
                    fechaDespliegue: row['Fecha Despliegue'] || '',
                    horaDespliegue: row['Hora'] || '',
                    comentarios: {
                        mejoras: this.parseExcelStringToArray(row['Mejoras/Bugfixes']),
                        salidas: this.parseExcelStringToArray(row['Salidas a Producción']),
                        cambiosCaliente: this.parseExcelStringToArray(row['Cambios en Caliente']),
                        observaciones: this.parseExcelStringToArray(row['Observaciones Versión'])
                    },
                    cdus: []
                });
            }

            const version = versionesMap.get(versionNumero);

            const nombreCDU = row['Nombre CDU'] || '';
            if (nombreCDU) {
                // Parsear responsables
                const responsablesTexto = row['Responsables'] || '';
                const responsables = responsablesTexto.split(';').filter(r => r.trim() !== '').map(r => {
                    const parts = r.split(':');
                    return {
                        nombre: parts[0].trim(),
                        rol: parts[1] ? parts[1].trim() : 'DEV' // Por defecto a DEV
                    };
                });

                // Parsear observaciones
                const observacionesTexto = row['Observaciones CDU'] || '';
                const observaciones = observacionesTexto.split(';').filter(o => o.trim() !== '');

                // Parsear historial (ejemplo simplificado)
                const historialTexto = row['Historial'] || '';
                const historial = historialTexto.split(';').filter(h => h.trim() !== '').map(h => ({
                    timestamp: new Date().toISOString(), // Usar fecha actual para el historial importado
                    tipo: 'importacion',
                    campo: 'historial',
                    valorAnterior: null,
                    valorNuevo: h
                }));

                version.cdus.push({
                    id: cduIdCounter++,
                    uuid: row['UUID'] || null, // Mantener UUID si viene del Excel
                    nombreCDU: nombreCDU,
                    descripcionCDU: row['Descripción CDU'] || row['Descripcion CDU'] || row['Descripción'] || '',
                    estado: this.normalizarEstado(row['Estado'] || 'En Desarrollo'),
                    versionBADA: row['Versión BADA'] || row['Version BADA'] || 'V1',
                    versionMiro: row['Version de Miró'] || '',
                    responsables: responsables,
                    observaciones: observaciones,
                    historial: historial
                });
            }
        });

        return {
            versiones: Array.from(versionesMap.values()),
            cduCount: cduIdCounter - 1
        };
    }

    normalizarEstado(estado) {
        switch (estado.toLowerCase().trim()) {
            case 'en desarrollo': return 'En Desarrollo';
            case 'pendiente':
            case 'pendiente de certificacion': return 'Pendiente de Certificacion';
            case 'certificado':
            case 'certificado ok': return 'Certificado OK';
            case 'en produccion': return 'En Produccion';
            default: return 'En Desarrollo';
        }
    }

    parseExcelStringToArray(str) {
        if (!str) return [];
        return String(str).split(';').map(s => s.trim()).filter(s => s !== '');
    }
}