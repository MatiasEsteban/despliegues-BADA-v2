// excelImporter.js - Importación de datos con historial, comentarios y responsables con roles

import { v4 as uuidv4 } from 'uuid';

export class ExcelImporter {
    static async importar(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    let sheetName = 'Detalle Despliegues';
                    if (!workbook.Sheets[sheetName]) {
                        sheetName = workbook.SheetNames[0];
                    }
                    
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    const versiones = this.transformarDatos(jsonData);
                    
                    resolve(versiones);
                } catch (error) {
                    reject(new Error('Error al leer el archivo Excel: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error al leer el archivo'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    static transformarDatos(jsonData) {
        const versionesMap = new Map();
        let cduIdCounter = 1;
        
        const nombreToUuidMap = new Map();
        const uuidMap = new Map();
        
        jsonData.forEach(row => {
            const versionNum = String(row['Versión'] || row['Version'] || '').replace(/\./g, '').trim();
            if (!versionNum) return;
            
            const nombreCDU = row['Nombre CDU'] || row['CDU'] || '';
            if (!nombreCDU) return;
            
            const nombreNormalizado = nombreCDU.trim().toLowerCase();
            
            if (!versionesMap.has(versionNum)) {
                versionesMap.set(versionNum, {
                    numero: versionNum,
                    fechaDespliegue: this.formatearFecha(row['Fecha Despliegue'] || row['Fecha'] || ''),
                    horaDespliegue: row['Hora'] || '',
                    comentarios: row['Comentarios Versión'] || row['Comentarios Version'] || '',
                    cdus: []
                });
            }
            
            let uuid = row['UUID'] || '';
            
            if (uuid && !uuidMap.has(uuid)) {
                uuidMap.set(uuid, true);
                if (nombreNormalizado && !nombreToUuidMap.has(nombreNormalizado)) {
                    nombreToUuidMap.set(nombreNormalizado, uuid);
                }
            } else {
                if (nombreNormalizado && nombreToUuidMap.has(nombreNormalizado)) {
                    uuid = nombreToUuidMap.get(nombreNormalizado);
                } else {
                    uuid = uuidv4();
                    uuidMap.set(uuid, true);
                    if (nombreNormalizado) {
                        nombreToUuidMap.set(nombreNormalizado, uuid);
                    }
                }
            }
            
            const observacionesText = row['Observaciones/Cambios'] || row['Observaciones'] || row['Cambios'] || '';
            const observaciones = this.parsearObservaciones(observacionesText);
            
            // NUEVO: Parsear responsables con roles
            const responsablesText = row['Responsables'] || row['Responsable'] || '';
            const responsables = this.parsearResponsables(responsablesText);
            
            // Parsear historial
            const historialText = row['Historial'] || '';
            const historial = this.parsearHistorial(historialText);
            
            const version = versionesMap.get(versionNum);
            version.cdus.push({
                id: cduIdCounter++,
                uuid: uuid,
                nombreCDU: nombreCDU,
                descripcionCDU: row['Descripción CDU'] || row['Descripcion CDU'] || row['Descripción'] || '',
                estado: this.normalizarEstado(row['Estado'] || 'En Desarrollo'),
                responsables: responsables,
                observaciones: observaciones,
                historial: historial
            });
        });
        
        let versionIdCounter = 1;
        const versiones = Array.from(versionesMap.values()).map(version => ({
            id: versionIdCounter++,
            ...version
        }));
        
        versiones.sort((a, b) => {
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numA - numB;
        });
        
        console.log(`✅ Importación completada: ${versiones.length} versiones, ${nombreToUuidMap.size} CDUs únicos detectados`);
        
        return versiones;
    }

    // NUEVO: Parsear responsables con roles
    static parsearResponsables(texto) {
        if (!texto || texto.trim() === '') return [];
        
        const separadores = ['||', '\n', '|', ';'];
        let items = [];
        
        for (const sep of separadores) {
            if (texto.includes(sep)) {
                items = texto
                    .split(sep)
                    .map(resp => resp.trim())
                    .filter(resp => resp.length > 0);
                break;
            }
        }
        
        if (items.length === 0) {
            items = [texto.trim()];
        }
        
        // Parsear cada item en formato "Nombre (Rol)" o solo "Nombre"
        return items.map(item => {
            const match = item.match(/^(.+?)\s*\((\w+)\)\s*$/);
            if (match) {
                return {
                    nombre: match[1].trim(),
                    rol: this.normalizarRol(match[2].trim())
                };
            } else {
                return {
                    nombre: item.trim(),
                    rol: 'DEV' // Rol por defecto
                };
            }
        });
    }

    // NUEVO: Normalizar roles
    static normalizarRol(rol) {
        const rolUpper = rol.toUpperCase();
        const rolesValidos = ['DEV', 'AF', 'UX', 'AN', 'QA'];
        
        if (rolesValidos.includes(rolUpper)) {
            return rolUpper;
        }
        
        // Mapeo de variaciones comunes
        const mapeoRoles = {
            'developer': 'DEV',
            'desarrollo': 'DEV',
            'dev': 'DEV',
            'analista': 'AN',
            'an': 'AN',
            'analista funcional': 'AF',
            'af': 'AF',
            'ux': 'UX',
            'diseño': 'UX',
            'uxui': 'UX',
            'qa': 'QA',
            'quality assurance': 'QA',
            'testing': 'QA',
            'tester': 'QA'
        };
        
        return mapeoRoles[rol.toLowerCase()] || 'DEV';
    }

    static parsearHistorial(texto) {
        if (!texto || texto.trim() === '') return [];
        
        const items = texto.split(' || ').map(item => {
            // Formato: [fecha] tipo: valorAnterior → valorNuevo
            const match = item.match(/\[(.*?)\]\s*(\w+):\s*(.*?)\s*→\s*(.*?)$/);
            if (match) {
                return {
                    timestamp: new Date(match[1]).toISOString(),
                    tipo: match[2],
                    campo: '',
                    valorAnterior: match[3],
                    valorNuevo: match[4]
                };
            }
            return null;
        }).filter(item => item !== null);
        
        return items;
    }

    static parsearObservaciones(texto) {
        if (!texto || texto.trim() === '') return [];
        
        const separadores = ['||', '\n', '•', '-', '*', '|', ';'];
        
        let items = [];
        for (const sep of separadores) {
            if (texto.includes(sep)) {
                items = texto
                    .split(sep)
                    .map(obs => obs.trim())
                    .filter(obs => obs.length > 0);
                break;
            }
        }
        
        if (items.length === 0) {
            items = [texto.trim()];
        }
        
        return items;
    }

    static formatearFecha(fecha) {
        if (!fecha) return '';
        
        if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return fecha;
        }
        
        if (typeof fecha === 'number') {
            const excelDate = XLSX.SSF.parse_date_code(fecha);
            return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
        }
        
        if (fecha instanceof Date) {
            return fecha.toISOString().split('T')[0];
        }
        
        try {
            const parsedDate = new Date(fecha);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0];
            }
        } catch (e) {
            // Ignorar error
        }
        
        return '';
    }

    static normalizarEstado(estado) {
        const estadoLower = String(estado).toLowerCase().trim();
        
        const mapeoEstados = {
            'pendiente': 'Pendiente de Certificacion',
            'listo': 'Certificado OK',
            'en proceso': 'En Desarrollo',
            'bloqueado': 'Pendiente de Certificacion',
            'en desarrollo': 'En Desarrollo',
            'pendiente de certificacion': 'Pendiente de Certificacion',
            'pendiente de certificación': 'Pendiente de Certificacion',
            'certificado ok': 'Certificado OK',
            'certificado': 'Certificado OK',
            'en produccion': 'En Produccion',
            'en producción': 'En Produccion',
            'produccion': 'En Produccion',
            'producción': 'En Produccion'
        };
        
        return mapeoEstados[estadoLower] || 'En Desarrollo';
    }
}