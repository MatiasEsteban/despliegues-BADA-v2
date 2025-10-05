// excelExporter.js - Exportación de datos a Excel

export class ExcelExporter {
    static exportar(registros) {
        const datosExcel = registros.map(r => ({
            'Fecha Despliegue': r.fechaDespliegue,
            'Hora': r.horaDespliegue,
            'Versión': r.version,
            'Nombre CDU': r.nombreCDU,
            'Descripción CDU': r.descripcionCDU,
            'Estado': r.estado,
            'Responsable': r.responsable,
            'Observaciones/Cambios': r.observaciones
        }));

        const resumen = this.generarResumen(registros);
        const wb = XLSX.utils.book_new();
        
        // Hoja de resumen
        const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
        wsResumen['!cols'] = [
            { wch: 25 },
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

    static generarResumen(registros) {
        const resumen = [
            ['DOCUMENTACIÓN DE DESPLIEGUES EN PRODUCCIÓN'],
            ['Herramienta: BADA'],
            ['Fecha Generación:', new Date().toLocaleDateString('es-ES')],
            [],
            ['Resumen por Versión'],
            ['Versión', 'Total CDUs', 'En Desarrollo', 'Pendiente Cert.', 'Certificado OK', 'En Producción']
        ];

        const versionesUnicas = [...new Set(registros.map(r => r.version))].sort();
        
        versionesUnicas.forEach(version => {
            const cdusVersion = registros.filter(r => r.version === version);
            const desarrollo = cdusVersion.filter(r => r.estado === 'En Desarrollo').length;
            const pendiente = cdusVersion.filter(r => r.estado === 'Pendiente de Certificacion').length;
            const certificado = cdusVersion.filter(r => r.estado === 'Certificado OK').length;
            const produccion = cdusVersion.filter(r => r.estado === 'En Produccion').length;
            
            resumen.push([
                version, 
                cdusVersion.length, 
                desarrollo, 
                pendiente, 
                certificado, 
                produccion
            ]);
        });

        // Agregar totales generales
        resumen.push([]);
        resumen.push(['TOTALES GENERALES']);
        resumen.push(['Total CDUs:', registros.length]);
        resumen.push(['En Desarrollo:', registros.filter(r => r.estado === 'En Desarrollo').length]);
        resumen.push(['Pendiente Certificación:', registros.filter(r => r.estado === 'Pendiente de Certificacion').length]);
        resumen.push(['Certificado OK:', registros.filter(r => r.estado === 'Certificado OK').length]);
        resumen.push(['En Producción:', registros.filter(r => r.estado === 'En Produccion').length]);

        return resumen;
    }
}