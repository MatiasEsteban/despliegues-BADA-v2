// excelExporter.js - Exportación de datos con versiones agrupadas y conteo único por UUID

export class ExcelExporter {
    static exportar(versiones) {
        // Aplanar la estructura para el Excel
        const datosExcel = [];
        
        versiones.forEach(version => {
            if (!version.cdus || version.cdus.length === 0) {
                return;
            }
            
            version.cdus.forEach(cdu => {
                // Convertir array de observaciones a texto separado por ||
                let observacionesTexto = '';
                if (Array.isArray(cdu.observaciones)) {
                    observacionesTexto = cdu.observaciones
                        .map(obs => typeof obs === 'string' ? obs : (obs.texto || ''))
                        .filter(obs => obs.trim())
                        .join(' || ');
                } else if (cdu.observaciones) {
                    observacionesTexto = cdu.observaciones;
                }
                
                datosExcel.push({
                    'UUID': cdu.uuid || '',
                    'Fecha Despliegue': version.fechaDespliegue || '',
                    'Hora': version.horaDespliegue || '',
                    'Versión': version.numero || '',
                    'Nombre CDU': cdu.nombreCDU || '',
                    'Descripción CDU': cdu.descripcionCDU || '',
                    'Estado': cdu.estado || '',
                    'Responsable': cdu.responsable || '',
                    'Observaciones/Cambios': observacionesTexto
                });
            });
        });

        const resumen = this.generarResumen(versiones);
        const wb = XLSX.utils.book_new();
        
        // Hoja de resumen
        const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
        wsResumen['!cols'] = [
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

        // Hoja de detalle
        const wsDetalle = XLSX.utils.json_to_sheet(datosExcel);
        wsDetalle['!cols'] = [
            { wch: 36 }, // UUID
            { wch: 15 },
            { wch: 8 },
            { wch: 10 },
            { wch: 20 },
            { wch: 30 },
            { wch: 25 },
            { wch: 20 },
            { wch: 50 }
        ];
        XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Despliegues');

        // Descargar archivo
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Despliegues_BADA_${fecha}.xlsx`);
    }

    static generarResumen(versiones) {
        const resumen = [
            ['DOCUMENTACIÓN DE DESPLIEGUES EN PRODUCCIÓN'],
            ['Herramienta: BADA'],
            ['Fecha Generación:', new Date().toLocaleDateString('es-ES')],
            [],
            ['Resumen por Versión'],
            ['Versión', 'Fecha', 'Hora', 'Total CDUs', 'En Desarrollo', 'Pendiente Cert.', 'Certificado OK', 'En Producción']
        ];

        // Mapa para rastrear CDUs únicos por UUID
        const cduUnicosGlobal = new Map();
        let totalRegistrosGeneral = 0;
        
        versiones.forEach(version => {
            const desarrollo = version.cdus.filter(c => c.estado === 'En Desarrollo').length;
            const pendiente = version.cdus.filter(c => c.estado === 'Pendiente de Certificacion').length;
            const certificado = version.cdus.filter(c => c.estado === 'Certificado OK').length;
            const produccion = version.cdus.filter(c => c.estado === 'En Produccion').length;
            
            totalRegistrosGeneral += version.cdus.length;
            
            // Rastrear CDUs únicos (por UUID) con su último estado
            version.cdus.forEach(cdu => {
                if (cdu.uuid) {
                    cduUnicosGlobal.set(cdu.uuid, cdu.estado);
                }
            });
            
            resumen.push([
                version.numero,
                version.fechaDespliegue,
                version.horaDespliegue,
                version.cdus.length,
                desarrollo,
                pendiente,
                certificado,
                produccion
            ]);
        });

        // Contar estados de CDUs únicos
        let desarrolloUnico = 0;
        let pendienteUnico = 0;
        let certificadoUnico = 0;
        let produccionUnico = 0;
        
        cduUnicosGlobal.forEach(estado => {
            switch(estado) {
                case 'En Desarrollo':
                    desarrolloUnico++;
                    break;
                case 'Pendiente de Certificacion':
                    pendienteUnico++;
                    break;
                case 'Certificado OK':
                    certificadoUnico++;
                    break;
                case 'En Produccion':
                    produccionUnico++;
                    break;
            }
        });

        // Agregar totales generales
        resumen.push([]);
        resumen.push(['TOTALES GENERALES']);
        resumen.push(['Total Versiones:', versiones.length]);
        resumen.push(['Total Registros de CDUs:', totalRegistrosGeneral]);
        resumen.push([]);
        resumen.push(['CDUs ÚNICOS (por UUID):']);
        resumen.push(['Total CDUs Únicos:', cduUnicosGlobal.size]);
        resumen.push(['En Desarrollo:', desarrolloUnico]);
        resumen.push(['Pendiente Certificación:', pendienteUnico]);
        resumen.push(['Certificado OK:', certificadoUnico]);
        resumen.push(['En Producción:', produccionUnico]);
        resumen.push([]);
        resumen.push(['Nota: Los CDUs únicos se cuentan una sola vez aunque aparezcan en múltiples versiones.']);
        resumen.push(['El estado mostrado es el más reciente de cada CDU.']);

        return resumen;
    }
}