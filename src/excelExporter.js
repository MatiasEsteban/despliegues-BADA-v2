// excelExporter.js - Exportación de datos con historial, comentarios y responsables con roles

export class ExcelExporter {
    static exportar(versiones) {
        const datosExcel = [];
        
        versiones.forEach(version => {
            if (!version.cdus || version.cdus.length === 0) {
                return;
            }
            
            version.cdus.forEach(cdu => {
                let observacionesTexto = '';
                if (Array.isArray(cdu.observaciones)) {
                    observacionesTexto = cdu.observaciones
                        .map(obs => typeof obs === 'string' ? obs : (obs.texto || ''))
                        .filter(obs => obs.trim())
                        .join(' || ');
                } else if (cdu.observaciones) {
                    observacionesTexto = cdu.observaciones;
                }
                
                // Formatear responsables con roles
                let responsablesTexto = '';
                if (Array.isArray(cdu.responsables) && cdu.responsables.length > 0) {
                    responsablesTexto = cdu.responsables
                        .map(r => `${r.nombre} (${r.rol})`)
                        .join(' || ');
                } else if (cdu.responsable) {
                    // Migración de formato antiguo
                    responsablesTexto = `${cdu.responsable} (Dev)`;
                }
                
                // Formatear historial para Excel
                let historialTexto = '';
                if (Array.isArray(cdu.historial) && cdu.historial.length > 0) {
                    historialTexto = cdu.historial
                        .map(entry => {
                            const fecha = new Date(entry.timestamp).toLocaleString('es-ES');
                            return `[${fecha}] ${entry.tipo}: ${entry.valorAnterior || ''} → ${entry.valorNuevo || ''}`;
                        })
                        .join(' || ');
                }
                
                datosExcel.push({
                    'UUID': cdu.uuid || '',
                    'Fecha Despliegue': version.fechaDespliegue || '',
                    'Hora': version.horaDespliegue || '',
                    'Versión': version.numero || '',
                    'Comentarios Versión': version.comentarios || '',
                    'Nombre CDU': cdu.nombreCDU || '',
                    'Descripción CDU': cdu.descripcionCDU || '',
                    'Estado': cdu.estado || '',
                    'Responsables': responsablesTexto,
                    'Observaciones/Cambios': observacionesTexto,
                    'Historial': historialTexto
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
            { wch: 15 }, // Fecha
            { wch: 8 },  // Hora
            { wch: 10 }, // Versión
            { wch: 40 }, // Comentarios Versión
            { wch: 20 }, // Nombre CDU
            { wch: 30 }, // Descripción
            { wch: 25 }, // Estado
            { wch: 30 }, // Responsables (con roles)
            { wch: 50 }, // Observaciones
            { wch: 60 }  // Historial
        ];
        XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Despliegues');

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

        const cduUnicosGlobal = new Map();
        let totalRegistrosGeneral = 0;
        
        versiones.forEach(version => {
            const desarrollo = version.cdus.filter(c => c.estado === 'En Desarrollo').length;
            const pendiente = version.cdus.filter(c => c.estado === 'Pendiente de Certificacion').length;
            const certificado = version.cdus.filter(c => c.estado === 'Certificado OK').length;
            const produccion = version.cdus.filter(c => c.estado === 'En Produccion').length;
            
            totalRegistrosGeneral += version.cdus.length;
            
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
        resumen.push(['El historial registra todos los cambios realizados en cada CDU.']);
        resumen.push(['Los responsables se muestran con su rol: Nombre (Rol).']);

        return resumen;
    }
}