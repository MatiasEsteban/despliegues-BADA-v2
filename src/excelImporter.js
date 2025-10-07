// excelImporter.js - Importación de datos con versiones agrupadas y UUID retrocompatible

import { v4 as uuidv4 } from 'uuid';

export class ExcelImporter {
    static async importar(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Buscar la hoja de "Detalle Despliegues"
                    let sheetName = 'Detalle Despliegues';
                    if (!workbook.Sheets[sheetName]) {
                        // Si no existe, usar la primera hoja
                        sheetName = workbook.SheetNames[0];
                    }
                    
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Transformar los datos al formato interno agrupado
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
        // Primero, crear un mapa de versiones
        const versionesMap = new Map();
        let cduIdCounter = 1;
        
        // Mapa para rastrear UUIDs por nombre de CDU (para retrocompatibilidad)
        // Estructura: nombreCDU normalizado -> UUID
        const nombreToUuidMap = new Map();
        
        // Mapa para evitar UUIDs duplicados
        const uuidMap = new Map();
        
        jsonData.forEach(row => {
            // Limpiar el número de versión (remover puntos y espacios)
            const versionNum = String(row['Versión'] || row['Version'] || '').replace(/\./g, '').trim();
            if (!versionNum) return;
            
            const nombreCDU = row['Nombre CDU'] || row['CDU'] || '';
            if (!nombreCDU) return;
            
            // Normalizar nombre para comparación (sin espacios, minúsculas)
            const nombreNormalizado = nombreCDU.trim().toLowerCase();
            
            // Si la versión no existe, crearla
            if (!versionesMap.has(versionNum)) {
                versionesMap.set(versionNum, {
                    numero: versionNum,
                    fechaDespliegue: this.formatearFecha(row['Fecha Despliegue'] || row['Fecha'] || ''),
                    horaDespliegue: row['Hora'] || '',
                    cdus: []
                });
            }
            
            // Obtener o generar UUID con lógica retrocompatible
            let uuid = row['UUID'] || '';
            
            // Si tiene UUID en el archivo y es válido, usarlo
            if (uuid && !uuidMap.has(uuid)) {
                // UUID válido del archivo
                uuidMap.set(uuid, true);
                // Asociar este UUID con el nombre del CDU
                if (nombreNormalizado && !nombreToUuidMap.has(nombreNormalizado)) {
                    nombreToUuidMap.set(nombreNormalizado, uuid);
                }
            } else {
                // No tiene UUID o está duplicado
                // Verificar si ya existe un UUID para este nombre de CDU
                if (nombreNormalizado && nombreToUuidMap.has(nombreNormalizado)) {
                    // Reutilizar UUID existente para el mismo nombre de CDU
                    uuid = nombreToUuidMap.get(nombreNormalizado);
                } else {
                    // Generar nuevo UUID
                    uuid = uuidv4();
                    // Registrar el UUID
                    uuidMap.set(uuid, true);
                    // Asociar con el nombre del CDU
                    if (nombreNormalizado) {
                        nombreToUuidMap.set(nombreNormalizado, uuid);
                    }
                }
            }
            
            // Procesar observaciones
            const observacionesText = row['Observaciones/Cambios'] || row['Observaciones'] || row['Cambios'] || '';
            const observaciones = this.parsearObservaciones(observacionesText);
            
            // Agregar el CDU a la versión
            const version = versionesMap.get(versionNum);
            version.cdus.push({
                id: cduIdCounter++,
                uuid: uuid, // UUID único para tracking (mismo para CDUs con mismo nombre)
                nombreCDU: nombreCDU,
                descripcionCDU: row['Descripción CDU'] || row['Descripcion CDU'] || row['Descripción'] || '',
                estado: this.normalizarEstado(row['Estado'] || 'En Desarrollo'),
                responsable: row['Responsable'] || '',
                observaciones: observaciones
            });
        });
        
        // Convertir el mapa a array y asignar IDs
        let versionIdCounter = 1;
        const versiones = Array.from(versionesMap.values()).map(version => ({
            id: versionIdCounter++,
            ...version
        }));
        
        // Ordenar por número de versión (convertir a número para ordenar correctamente)
        versiones.sort((a, b) => {
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numA - numB;
        });
        
        console.log(`✅ Importación completada: ${versiones.length} versiones, ${nombreToUuidMap.size} CDUs únicos detectados`);
        
        return versiones;
    }

    static parsearObservaciones(texto) {
        if (!texto || texto.trim() === '') return [];
        
        // Intentar dividir por varios separadores comunes, priorizando ||
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
        
        // Si no hay separadores, devolver como un solo item
        if (items.length === 0) {
            items = [texto.trim()];
        }
        
        return items;
    }

    static formatearFecha(fecha) {
        if (!fecha) return '';
        
        // Si ya está en formato YYYY-MM-DD
        if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return fecha;
        }
        
        // Si es un número de serie de Excel
        if (typeof fecha === 'number') {
            const excelDate = XLSX.SSF.parse_date_code(fecha);
            return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
        }
        
        // Si es un objeto Date
        if (fecha instanceof Date) {
            return fecha.toISOString().split('T')[0];
        }
        
        // Intentar parsear string
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
        
        // Mapear estados antiguos a nuevos
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