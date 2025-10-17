// excelImporter.js - Importación de datos desde Excel (VERSIÓN CORREGIDA)

import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid'; // Importar UUID para CDUs sin ID

export class ExcelImporter {

    /**
     * Método estático principal para importar.
     * Lee y procesa el archivo Excel.
     */
    static async importExcel(file) {
        try {
            // 1. Leer el archivo
            const json = await this.readExcelFile(file);
            
            // 2. Procesar los datos
            const processedData = this.processExcelData(json);

            // 3. Devolver los datos
            return processedData;

        } catch (error) {
            console.error('Error en ExcelImporter.importExcel:', error);
            throw error; // Relanzar el error
        }
    }

    /**
     * Lee la hoja 'Detalle Despliegues' del archivo Excel.
     */
    static readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const wsDetalle = workbook.Sheets['Detalle Despliegues'];
                    
                    if (!wsDetalle) {
                        throw new Error("No se encontró la hoja 'Detalle Despliegues'.");
                    }

                    const json = XLSX.utils.sheet_to_json(wsDetalle);
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

    /**
     * Procesa el JSON del Excel y lo transforma en la estructura de datos de la app.
     */
    static processExcelData(json) {
        const versionesMap = new Map();
        let versionEnProduccionId = null;
        let nextCduId = 1;
        let nextVersionId = 1;

        json.forEach(row => {
            const versionNumero = String(row['Versión'] || 'V_Desconocida');
            let version = versionesMap.get(versionNumero);

            // Si la versión no existe, crearla
            if (!version) {
                const newId = nextVersionId++;
                version = {
                    id: newId,
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
                };
                versionesMap.set(versionNumero, version);
            }

            // Detectar la versión en producción (el exporter usa 'SÍ')
            if (row['En Producción'] === 'SÍ' && versionEnProduccionId === null) {
                versionEnProduccionId = version.id; 
            }

            // Procesar el CDU (si existe en esta fila)
            const nombreCDU = row['Nombre CDU'] || '';
            if (nombreCDU) {
                // Formato de Responsables: "Nombre (Rol) || Nombre (Rol)"
                const responsablesTexto = row['Responsables'] || '';
                const responsables = responsablesTexto.split(' || ').filter(r => r.trim() !== '').map(r => {
                    const match = r.match(/^(.*?)\s\((.*?)\)$/);
                    if (match) {
                        return { nombre: match[1].trim(), rol: match[2].trim() };
                    }
                    return { nombre: r.trim(), rol: 'DEV' }; // Fallback
                });

                // Formato de Observaciones: "Obs 1 || Obs 2"
                const observacionesTexto = row['Observaciones CDU'] || '';
                const observaciones = observacionesTexto.split(' || ').filter(o => o.trim() !== '');

                // Formato de Historial: "[Fecha] Tipo: ... || [Fecha] Tipo: ..."
                const historialTexto = row['Historial'] || '';
                const historial = historialTexto.split(' || ').filter(h => h.trim() !== '').map(h_str => {
                    const match = h_str.match(/\[(.*?)\] (.*?): (.*?) → (.*)/);
                    if(match) {
                        return {
                            timestamp: match[1],
                            tipo: match[2],
                            valorAnterior: match[3],
                            valorNuevo: match[4]
                        };
                    }
                    return {
                        timestamp: new Date().toISOString(),
                        tipo: 'importacion',
                        valorAnterior: null,
                        valorNuevo: h_str
                    };
                });

                version.cdus.push({
                    id: nextCduId++,
                    uuid: row['UUID'] || uuidv4(),
                    nombreCDU: nombreCDU,
                    descripcionCDU: row['Descripción CDU'] || '',
                    estado: this.normalizarEstado(row['Estado'] || 'En Desarrollo'),
                    versionBADA: row['Versión BADA'] || 'V1',
                    versionMiro: row['Version de Miró'] || '',
                    responsables: responsables,
                    observaciones: observaciones,
                    historial: historial
                });
            }
        });

        const versiones = Array.from(versionesMap.values());

        return {
            versiones: versiones,
            versionEnProduccionId: versionEnProduccionId
            // Nota: versionEvents.js calcula cduCount por sí mismo
        };
    }

    /**
     * Normaliza los diferentes textos de estado.
     */
    static normalizarEstado(estado) {
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

    /**
     * Parsea un string del Excel (separado por '||') a un array.
     */
    static parseExcelStringToArray(str) {
        if (!str) return [];
        return String(str).split(' || ').map(s => s.trim()).filter(s => s !== '');
    }
}