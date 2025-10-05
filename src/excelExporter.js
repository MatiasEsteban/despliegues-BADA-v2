// excelExporter.js - Exportación de datos con versiones agrupadas

export class ExcelExporter {
    static exportar(versiones) {
        // Aplanar la estructura para el Excel
        const datosExcel = [];
        
        versiones.forEach(version => {
            if (!version.cdus || version.cdus.length === 0) {
                return;
            }
            
            version.cdus.forEach(cdu => {
                // Convertir array de observaciones a texto con saltos de línea
                let observacionesTexto = '';
                if (Array.isArray(cdu.observaciones)) {
                    observacionesTexto = cdu.observaciones
                        .map(obs => {
                            if (typeof obs === 'string') {
                                return obs;
                            } else if (obs.texto) {
                                // Incluir timestamp si existe
                                if (obs.timestamp) {
                                    const fecha = new Date(obs.timestamp);
                                    const fechaStr = fecha.toLocaleDateString('es-ES');
                                    const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                    return `[${fechaStr} ${horaStr}] ${obs.texto}`;
                                }
                                return obs.texto;
                            }
                            return '';
                        })
                        .filter(obs => obs.trim())
                        .join('\n');
                } else if (cdu.observaciones) {
                    observacionesTexto = cdu.observaciones;
                }
                
                datosExcel.push({
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

        let totalGeneral = 0;
        let desarrolloGeneral = 0;
        let pendienteGeneral = 0;
        let certificadoGeneral = 0;
        let produccionGeneral = 0;
        
        versiones.forEach(version => {
            const desarrollo = version.cdus.filter(c => c.estado === 'En Desarrollo').length;
            const pendiente = version.cdus.filter(c => c.estado === 'Pendiente de Certificacion').length;
            const certificado = version.cdus.filter(c => c.estado === 'Certificado OK').length;
            const produccion = version.cdus.filter(c => c.estado === 'En Produccion').length;
            
            totalGeneral += version.cdus.length;
            desarrolloGeneral += desarrollo;
            pendienteGeneral += pendiente;
            certificadoGeneral += certificado;
            produccionGeneral += produccion;
            
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

        // Agregar totales generales
        resumen.push([]);
        resumen.push(['TOTALES GENERALES']);
        resumen.push(['Total Versiones:', versiones.length]);
        resumen.push(['Total CDUs:', totalGeneral]);
        resumen.push(['En Desarrollo:', desarrolloGeneral]);
        resumen.push(['Pendiente Certificación:', pendienteGeneral]);
        resumen.push(['Certificado OK:', certificadoGeneral]);
        resumen.push(['En Producción:', produccionGeneral]);

        return resumen;
    }
}