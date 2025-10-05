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
            { wch: 20 },
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
            { wch: 12 },
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
            ['Versión', 'Total CDUs', 'Listos', 'Pendientes']
        ];

        const versionesUnicas = [...new Set(registros.map(r => r.version))];
        
        versionesUnicas.forEach(version => {
            const cdusVersion = registros.filter(r => r.version === version);
            const listos = cdusVersion.filter(r => r.estado === 'Listo').length;
            const pendientes = cdusVersion.filter(r => r.estado === 'Pendiente').length;
            resumen.push([version, cdusVersion.length, listos, pendientes]);
        });

        return resumen;
    }
}