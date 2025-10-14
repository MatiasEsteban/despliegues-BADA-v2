// VersionCard.js - Componente para tarjetas de versión

export class VersionCard {
    static create(version, onClickCallback, isEnProduccion = false) {
        const card = document.createElement('div');
        card.className = 'version-card';
        if (isEnProduccion) {
            card.classList.add('version-en-produccion');
        }
        card.dataset.versionId = version.id;
        
        // Calcular estadísticas
        const desarrollo = version.cdus.filter(c => c.estado === 'En Desarrollo').length;
        const pendiente = version.cdus.filter(c => c.estado === 'Pendiente de Certificacion').length;
        const certificado = version.cdus.filter(c => c.estado === 'Certificado OK').length;
        const produccion = version.cdus.filter(c => c.estado === 'En Produccion').length;
        
        card.innerHTML = `
            <div class="version-card-header">
                <div class="version-card-number">
                    Versión ${version.numero}
                    ${isEnProduccion ? '<span class="badge-produccion">EN PRODUCCIÓN</span>' : ''}
                </div>
                <div class="version-card-cdus-count">${version.cdus.length} CDU${version.cdus.length !== 1 ? 's' : ''}</div>
                <button class="btn-marcar-produccion" data-version-id="${version.id}" title="${isEnProduccion ? 'Desmarcar de producción' : 'Marcar como en producción'}">
                    <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${isEnProduccion 
                            ? '<path d="M20 6L9 17l-5-5"></path>' 
                            : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
                    </svg>
                </button>
                <button class="btn-version-info" data-version-id="${version.id}" title="Ver reporte de despliegue">
    <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
</button>
            </div>
            <div class="version-card-body">
                <div class="version-card-stats">
                    <div class="version-card-stat">
                        <div class="version-card-stat-icon stat-desarrollo">${desarrollo}</div>
                        <div>
                            <div class="version-card-stat-label">En Desarrollo</div>
                        </div>
                    </div>
                    <div class="version-card-stat">
                        <div class="version-card-stat-icon stat-pendiente">${pendiente}</div>
                        <div>
                            <div class="version-card-stat-label">Pendiente</div>
                        </div>
                    </div>
                    <div class="version-card-stat">
                        <div class="version-card-stat-icon stat-certificado">${certificado}</div>
                        <div>
                            <div class="version-card-stat-label">Certificado</div>
                        </div>
                    </div>
                    <div class="version-card-stat">
                        <div class="version-card-stat-icon stat-produccion">${produccion}</div>
                        <div>
                            <div class="version-card-stat-label">Producción</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="version-card-footer">
                <div class="version-card-date">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    ${this.formatDate(version.fechaDespliegue)}
                </div>
                <div class="version-card-time">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${version.horaDespliegue || '--:--'}
                </div>
            </div>
        `;
        

// Click en la tarjeta (excepto en los botones)
card.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-marcar-produccion') && 
        !e.target.closest('.btn-version-info')) {
        onClickCallback(version.id);
    }
});
        
        return card;
    }

    static formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString + 'T00:00:00');
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }
}