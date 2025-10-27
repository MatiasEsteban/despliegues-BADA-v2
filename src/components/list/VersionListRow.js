// src/components/list/VersionListRow.js - Componente para filas de versión en lista

export class VersionListRow {
    static create(version, isEnProduccion = false, onClickCallback) {
        const tr = document.createElement('tr');
        tr.className = 'version-list-row';
        if (isEnProduccion) {
            tr.classList.add('version-en-produccion');
        }
        tr.dataset.versionId = version.id;

        // --- Calcular estadísticas ---
        const desarrollo = version.cdus.filter(c => c.estado === 'En Desarrollo').length;
        const pendiente = version.cdus.filter(c => c.estado === 'Pendiente de Certificacion').length;
        const certificado = version.cdus.filter(c => c.estado === 'Certificado OK').length;
        const produccion = version.cdus.filter(c => c.estado === 'En Produccion').length;

        // Generar HTML para los dots de estado
        const statsHTML = [
            desarrollo > 0 ? `<div class="cdu-stat-dot stat-desarrollo" title="${desarrollo} En Desarrollo">${desarrollo}</div>` : '',
            pendiente > 0 ? `<div class="cdu-stat-dot stat-pendiente" title="${pendiente} Pendiente">${pendiente}</div>` : '',
            certificado > 0 ? `<div class="cdu-stat-dot stat-certificado" title="${certificado} Certificado">${certificado}</div>` : '',
            produccion > 0 ? `<div class="cdu-stat-dot stat-produccion" title="${produccion} Producción">${produccion}</div>` : ''
        ].filter(Boolean).join(''); // Filtrar vacíos y unir

        // --- Iconos SVG Paths ---
        // Icono para marcar producción
        const prodButtonIconPath = isEnProduccion
            ? '<path d="M20 6L9 17l-5-5"></path>' // Checkmark
            : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'; // Info circle
        // Icono Info
        const infoIconPath = '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="8" r="1"></circle><line x1="12" y1="12" x2="12" y2="16"></line>';
        // Icono Duplicar (Archivo + Plus)
        const duplicateIconPath = '<path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 17h6"></path><path d="M12 14v6"></path>';
        // Icono Eliminar (Basura)
        const deleteIconPath = '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>';

        // --- Formatear fecha/hora ---
        const fechaFormateada = this.formatDate(version.fechaDespliegue);
        const horaFormateada = version.horaDespliegue || '--:--';
        const despliegueTexto = `${fechaFormateada} - ${horaFormateada} hs`;

        // --- Construir innerHTML (SIN div wrapper extra) ---
        tr.innerHTML = `
            <td class="version-list-cell-numero">
                V${version.numero || ''}
                ${isEnProduccion ? '<span class="badge-produccion">EN PRODUCCIÓN</span>' : ''}
            </td>
            <td class="version-list-cell-cdus">
                ${statsHTML || '<span style="font-size: 0.8rem; color: var(--text-secondary);">Sin CDUs</span>'}
            </td>
            <td class="version-list-cell-fecha">
                ${despliegueTexto}
            </td>
            <td class="version-list-cell-info">
                <button class="btn-action-list btn-version-info" data-version-id="${version.id}" title="Ver reporte de despliegue">
                    <svg viewBox="0 0 24 24">${infoIconPath}</svg>
                </button>
            </td>
            <td class="version-list-cell-prod">
                 <button class="btn-action-list btn-marcar-produccion" data-version-id="${version.id}" title="${isEnProduccion ? 'Desmarcar de producción' : 'Marcar como en producción'}">
                    <svg viewBox="0 0 24 24">${prodButtonIconPath}</svg>
                </button>
                 <button class="btn-action-list btn-duplicar-version" data-version-id="${version.id}" data-action="duplicate-version-list" title="Duplicar esta versión">
                    <svg viewBox="0 0 24 24">${duplicateIconPath}</svg>
                </button>
                <button class="btn-action-list btn-eliminar-version" data-version-id="${version.id}" data-action="delete-version-list" title="Eliminar esta versión">
                    <svg viewBox="0 0 24 24">${deleteIconPath}</svg>
                </button>
            </td>
        `;

        // --- Event Listener ---
        tr.addEventListener('click', (e) => {
            // Ir al detalle si no se clickeó en las celdas de acción
            if (!e.target.closest('.version-list-cell-info, .version-list-cell-prod')) {
                onClickCallback(version.id);
            }
        });

        return tr;
    }

    // --- formatDate ---
    static formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        try {
            const date = new Date(dateString + 'T00:00:00Z');
             if (isNaN(date)) return 'Fecha inválida';
            const day = date.getUTCDate().toString().padStart(2, '0');
            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            const year = date.getUTCFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            console.error("Error formateando fecha:", dateString, e);
            return 'Fecha inválida';
        }
    }
}