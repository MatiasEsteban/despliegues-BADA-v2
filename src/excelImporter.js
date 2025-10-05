// excelImporter.js - Importación de datos con versiones agrupadas

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
        
        jsonData.forEach(row => {
            // Limpiar el número de versión (remover puntos y espacios)
            const versionNum = String(row['Versión'] || row['Version'] || '').replace(/\./g, '').trim();
            if (!versionNum) return;
            
            const nombreCDU = row['Nombre CDU'] || row['CDU'] || '';
            if (!nombreCDU) return;
            
            // Si la versión no existe, crearla
            if (!versionesMap.has(versionNum)) {
                versionesMap.set(versionNum, {
                    numero: versionNum,
                    fechaDespliegue: this.formatearFecha(row['Fecha Despliegue'] || row['Fecha'] || ''),
                    horaDespliegue: row['Hora'] || '',
                    cdus: []
                });
            }
            
            // Agregar el CDU a la versión
            const version = versionesMap.get(versionNum);
            version.cdus.push({
                id: cduIdCounter++,
                nombreCDU: nombreCDU,
                descripcionCDU: row['Descripción CDU'] || row['Descripcion CDU'] || row['Descripción'] || '',
                estado: this.normalizarEstado(row['Estado'] || 'En Desarrollo'),
                responsable: row['Responsable'] || '',
                observaciones: row['Observaciones/Cambios'] || row['Observaciones'] || row['Cambios'] || ''
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
        
        return versiones;
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