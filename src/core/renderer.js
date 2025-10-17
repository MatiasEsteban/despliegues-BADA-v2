// renderer.js - Sistema dual de renderizado con comentarios categorizados

import { DOMBuilder } from '../components/domBuilder.js';
import { VirtualScroll } from '../components/table/VirtualScroll.js';

window.DOMBuilder = DOMBuilder;

export class Renderer {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.currentView = 'cards';
        this.currentVersionId = null;
        this.isRendering = false;
        this.versionesVisibles = 5;
        
        // NUEVO: Instancia de VirtualScroll
        this.virtualScroll = new VirtualScroll({
            rowHeight: 120,
            visibleRows: 10,
            bufferRows: 5
        });
        
        this.filters = {
            search: '',
            estado: '',
            responsable: '',
            fechaDesde: '',
            fechaHasta: ''
        };
        
        this.detailFilters = {
            search: '',
            estado: '',
            responsable: ''
        };
    }

    showCardsView() {
        document.getElementById('view-cards').classList.add('active');
        document.getElementById('view-detail').classList.remove('active');
        this.currentView = 'cards';
        this.currentVersionId = null;
        this.versionesVisibles = 5;
        this.renderCardsView();
    }

    showDetailView(versionId) {
        document.getElementById('view-cards').classList.remove('active');
        document.getElementById('view-detail').classList.add('active');
        this.currentView = 'detail';
        this.currentVersionId = versionId;
        this.renderDetailView(versionId);
    }

    applyFilters(versiones) {
        const hasActiveFilters = this.filters.search || 
                                 this.filters.estado || 
                                 this.filters.responsable || 
                                 this.filters.fechaDesde || 
                                 this.filters.fechaHasta;
        
        if (!hasActiveFilters) {
            return versiones;
        }
        
        let filtered = versiones.map(version => {
            const filteredCdus = version.cdus.filter(cdu => {
                if (this.filters.search) {
                    const searchLower = this.filters.search.toLowerCase();
                    const matchesSearch = 
                        version.numero.toLowerCase().includes(searchLower) ||
                        cdu.nombreCDU.toLowerCase().includes(searchLower) ||
                        cdu.descripcionCDU.toLowerCase().includes(searchLower) ||
                        this.getResponsablesText(cdu).toLowerCase().includes(searchLower);
                    
                    if (!matchesSearch) return false;
                }
                
                if (this.filters.estado && cdu.estado !== this.filters.estado) {
                    return false;
                }
                
                if (this.filters.responsable) {
                    const responsableLower = this.filters.responsable.toLowerCase();
                    const responsablesText = this.getResponsablesText(cdu).toLowerCase();
                    if (!responsablesText.includes(responsableLower)) {
                        return false;
                    }
                }
                
                if (this.filters.fechaDesde && version.fechaDespliegue < this.filters.fechaDesde) {
                    return false;
                }
                
                if (this.filters.fechaHasta && version.fechaDespliegue > this.filters.fechaHasta) {
                    return false;
                }
                
                return true;
            });
            
            return {
                ...version,
                cdus: filteredCdus
            };
        }).filter(version => version.cdus.length > 0);
        
        return filtered;
    }

    getResponsablesText(cdu) {
        if (Array.isArray(cdu.responsables) && cdu.responsables.length > 0) {
            return cdu.responsables.map(r => `${r.nombre} ${r.rol}`).join(' ');
        } else if (cdu.responsable) {
            return cdu.responsable;
        }
        return '';
    }

    updateFilterStats(filteredVersions, totalVersions) {
        const totalCdus = totalVersions.reduce((sum, v) => sum + v.cdus.length, 0);
        const showingCdus = filteredVersions.reduce((sum, v) => sum + v.cdus.length, 0);
        
        document.getElementById('filter-showing').textContent = showingCdus;
        document.getElementById('filter-total').textContent = totalCdus;
        document.getElementById('filter-versions').textContent = filteredVersions.length;
    }

    renderCardsView() {
        const allVersions = this.dataStore.getAll();
        const filteredVersions = this.applyFilters(allVersions);
        
        this.updateFilterStats(filteredVersions, allVersions);
        
        const grid = document.getElementById('versions-grid');
        grid.innerHTML = '';
        
        if (filteredVersions.length === 0) {
            this.showNoVersionsMessage(grid);
            this.updateLoadMoreButton(0, 0);
            return;
        }
        
        const sortedVersions = [...filteredVersions].sort((a, b) => {
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numB - numA;
        });
        
        console.log('🎨 RENDER CARDS - Versiones a renderizar:', sortedVersions.length);
        
        const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
        
        const versionesToShow = sortedVersions.slice(0, this.versionesVisibles);
        
        versionesToShow.forEach(version => {
            console.log(`  Renderizando Versión ${version.numero}: ${version.cdus.length} CDUs`);
            const isEnProduccion = version.id === versionEnProduccionId;
            const card = DOMBuilder.crearTarjetaVersion(version, (vId) => {
                this.showDetailView(vId);
            }, isEnProduccion);
            grid.appendChild(card);
        });
        
        this.updateLoadMoreButton(versionesToShow.length, sortedVersions.length);
    }

    updateLoadMoreButton(showing, total) {
        const btnLoadMore = document.getElementById('btn-load-more-versions');
        const loadMoreContainer = document.getElementById('load-more-container');
        const countSpan = document.getElementById('versions-remaining-count');
        
        if (!btnLoadMore || !loadMoreContainer) return;
        
        const remaining = total - showing;
        
        if (remaining > 0) {
            loadMoreContainer.style.display = 'flex';
            countSpan.textContent = remaining;
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    cargarMasVersiones() {
        this.versionesVisibles += 10;
        this.renderCardsView();
    }

    showNoVersionsMessage(container) {
        const message = document.createElement('div');
        message.className = 'no-versions-message';
        message.innerHTML = `
            <svg style="width: 64px; height: 64px; margin-bottom: 1rem; opacity: 0.5; color: var(--text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
            </svg>
            <div style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                No hay versiones disponibles
            </div>
            <div style="font-size: 0.95rem; color: var(--text-secondary);">
                Crea una nueva versión o sube un archivo para comenzar
            </div>
        `;
        message.style.gridColumn = '1 / -1';
        message.style.textAlign = 'center';
        message.style.padding = '4rem 2rem';
        container.appendChild(message);
    }

    renderDetailView(versionId) {
        const version = this.dataStore.getAll().find(v => v.id === versionId);

        if (!version) {
            this.showCardsView();
            return;
        }
        
        document.getElementById('detail-version-title').textContent = `Versión ${version.numero}`;
        document.getElementById('detail-version-date').value = version.fechaDespliegue || '';
        document.getElementById('detail-version-time').value = version.horaDespliegue || '';
        
        const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
        const titleElement = document.getElementById('detail-version-title');
        if (version.id === versionEnProduccionId) {
            titleElement.innerHTML = `Versión ${version.numero} <span class="badge-produccion-inline">EN PRODUCCIÓN</span>`;
        } else {
            titleElement.textContent = `Versión ${version.numero}`;
        }
        
        // Mostrar comentarios categorizados
        const commentsDisplay = document.getElementById('version-comments-display');
        const commentsContainer = document.getElementById('version-comments-container');
        
        const hasComentarios = this.tieneComentarios(version.comentarios);
        
        if (hasComentarios) {
            commentsContainer.innerHTML = this.renderComentariosCategorizados(version.comentarios);
            commentsDisplay.style.display = 'block';
        } else {
            commentsDisplay.style.display = 'none';
        }
        
        console.log('🎨 RENDER DETAIL - Versión:', version.numero);
        console.log('  Total CDUs en version:', version.cdus.length);
        
        if (version.cdus.length === 0) {
            const tbody = document.getElementById('tabla-body');
            tbody.innerHTML = '';
            this.showNoCdusMessage(tbody);
            return;
        }
        // MODIFICADO: Usar updateData si virtualScroll ya está activo
if (this.virtualScroll.currentCdus.length > 0) {
    console.log('🔄 Actualizando datos del virtual scroll existente');
    this.virtualScroll.updateData(version.cdus);
} else {
    console.log('🆕 Renderizando virtual scroll por primera vez');
    this.virtualScroll.render(version.cdus);
}
        
        // MODIFICADO: Usar VirtualScroll
        this.virtualScroll.render(version.cdus);
        
        // Actualizar stats de filtros
        document.getElementById('detail-filter-showing').textContent = version.cdus.length;
        document.getElementById('detail-filter-total').textContent = version.cdus.length;
        
        // Aplicar filtros si existen
        if (this.detailFilters.search || this.detailFilters.estado || this.detailFilters.responsable) {
            this.applyDetailFilters();
        }
        
        setTimeout(() => {
            const tbody = document.getElementById('tabla-body');
            tbody.querySelectorAll('.campo-descripcion').forEach(textarea => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        }, 50);
    }
    /**
 * Actualiza solo la sección de comentarios sin tocar la tabla
 */
updateVersionComments() {
    if (this.currentView !== 'detail' || !this.currentVersionId) return;
    
    const version = this.dataStore.getAll().find(v => v.id === this.currentVersionId);
    if (!version) return;
    
    const commentsDisplay = document.getElementById('version-comments-display');
    const commentsContainer = document.getElementById('version-comments-container');
    
    if (!commentsDisplay || !commentsContainer) return;
    
    const hasComentarios = this.tieneComentarios(version.comentarios);
    
    if (hasComentarios) {
        commentsContainer.innerHTML = this.renderComentariosCategorizados(version.comentarios);
        commentsDisplay.style.display = 'block';
        
        // Animación suave de actualización
        commentsContainer.style.opacity = '0';
        setTimeout(() => {
            commentsContainer.style.transition = 'opacity 0.3s ease';
            commentsContainer.style.opacity = '1';
        }, 10);
    } else {
        commentsDisplay.style.display = 'none';
    }
    
    console.log('✅ Comentarios de versión actualizados');
}

    tieneComentarios(comentarios) {
        if (typeof comentarios === 'string') {
            return comentarios.trim().length > 0;
        }
        
        if (!comentarios) return false;
        
        return (comentarios.mejoras && comentarios.mejoras.length > 0) ||
               (comentarios.salidas && comentarios.salidas.length > 0) ||
               (comentarios.cambiosCaliente && comentarios.cambiosCaliente.length > 0) ||
               (comentarios.observaciones && comentarios.observaciones.length > 0);
    }

    renderComentariosCategorizados(comentarios) {
        // Migrar formato antiguo
        if (typeof comentarios === 'string') {
            return `
                <div class="comentario-display-categoria">
                    <div class="comentario-display-header">
                        <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <strong>Observaciones</strong>
                    </div>
                    <ul class="comentario-display-list">
                        <li>${comentarios}</li>
                    </ul>
                </div>
            `;
        }
        
        let html = '';
        
        const categorias = [
            { key: 'mejoras', titulo: 'Mejoras y Bugfixes', icon: 'bug' },
            { key: 'salidas', titulo: 'Salidas a Producción', icon: 'zap' },
            { key: 'cambiosCaliente', titulo: 'Cambios en Caliente (CeC)', icon: 'flame' },
            { key: 'observaciones', titulo: 'Observaciones', icon: 'file' }
        ];
        
        const iconos = {
            'bug': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"></path>
                <path d="M8.5 2h7"></path>
                <path d="M7 16h10"></path>
            </svg>`,
            'zap': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>`,
            'flame': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>`,
            'file': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>`
        };
        
        categorias.forEach(cat => {
            const items = comentarios[cat.key];
            if (items && items.length > 0) {
                const itemsHTML = items.map(item => `<li>${item}</li>`).join('');
                html += `
                    <div class="comentario-display-categoria">
                        <div class="comentario-display-header">
                            ${iconos[cat.icon]}
                            <strong>${cat.titulo}</strong>
                        </div>
                        <ul class="comentario-display-list">
                            ${itemsHTML}
                        </ul>
                    </div>
                `;
            }
        });
        
        return html;
    }

    showNoCdusMessage(tbody) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.style.textAlign = 'center';
        td.style.padding = '3rem';
        td.style.color = 'var(--text-secondary)';
        td.innerHTML = `
            <svg style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 0.5rem;">
                Esta versión no tiene CDUs
            </div>
            <div style="font-size: 0.875rem;">
                Usa el botón "Nuevo CDU" para agregar
            </div>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        if (this.currentView === 'cards') {
            this.renderCardsView();
        }
    }

    clearFilters() {
        this.filters = {
            search: '',
            estado: '',
            responsable: '',
            fechaDesde: '',
            fechaHasta: ''
        };
        
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-estado').value = '';
        document.getElementById('filter-responsable').value = '';
        document.getElementById('filter-fecha-desde').value = '';
        document.getElementById('filter-fecha-hasta').value = '';
        
        if (this.currentView === 'cards') {
            this.renderCardsView();
        }
    }

    setDetailFilters(filters) {
        this.detailFilters = { ...this.detailFilters, ...filters };
        if (this.currentView === 'detail' && this.currentVersionId) {
            this.applyDetailFilters();
        }
    }

    clearDetailFilters() {
        this.detailFilters = {
            search: '',
            estado: '',
            responsable: ''
        };
        
        document.getElementById('detail-filter-search').value = '';
        document.getElementById('detail-filter-estado').value = '';
        document.getElementById('detail-filter-responsable').value = '';
        
        if (this.currentView === 'detail' && this.currentVersionId) {
            this.applyDetailFilters();
        }
    }

// Reemplaza esta función en: src/core/renderer.js

    applyDetailFilters() {
        const version = this.dataStore.getAll().find(v => v.id === this.currentVersionId);
        if (!version) return;
        
        const totalCount = version.cdus.length;
        const hasActiveFilters = this.detailFilters.search || 
                                 this.detailFilters.estado || 
                                 this.detailFilters.responsable;
        
        let filteredCdus;

        if (!hasActiveFilters) {
            // Si no hay filtros, usa la lista completa
            filteredCdus = version.cdus;
        } else {
            // Si hay filtros, filtra el arreglo de datos
            const searchLower = this.detailFilters.search.toLowerCase();
            const estadoFilter = this.detailFilters.estado;
            const responsableLower = this.detailFilters.responsable.toLowerCase();

            filteredCdus = version.cdus.filter(cdu => {
                let matches = true;
            
                // 1. Filtro de búsqueda general (Texto)
                if (this.detailFilters.search) {
                    const matchesSearch = 
                        cdu.nombreCDU.toLowerCase().includes(searchLower) ||
                        cdu.descripcionCDU.toLowerCase().includes(searchLower) ||
                        this.getResponsablesText(cdu).toLowerCase().includes(searchLower) ||
                        (cdu.observaciones && Array.isArray(cdu.observaciones) && cdu.observaciones.some(obs => 
                            typeof obs === 'string' && obs.toLowerCase().includes(searchLower)
                        ));
                    
                    if (!matchesSearch) {
                        matches = false;
                    }
                }
                
                // 2. Filtro de estado (Usa 'matches' para ser acumulativo)
                if (matches && estadoFilter && cdu.estado !== estadoFilter) {
                    matches = false;
                }
                
                // 3. Filtro de responsable (Usa 'matches' para ser acumulativo)
                if (matches && this.detailFilters.responsable) {
                    const responsablesText = this.getResponsablesText(cdu).toLowerCase();
                    if (!responsablesText.includes(responsableLower)) {
                        matches = false;
                    }
                }
                
                return matches;
            });
        }
        
        // 4. Pasa los datos filtrados al VirtualScroll para que se re-dibuje
        if (this.virtualScroll) {
            this.virtualScroll.updateData(filteredCdus);
        }
        
        // 5. Actualizar estadísticas
        document.getElementById('detail-filter-showing').textContent = filteredCdus.length;
        document.getElementById('detail-filter-total').textContent = totalCount;
    }

    updateStats() {
        const stats = this.dataStore.getUniqueStats();
        DOMBuilder.actualizarEstadisticas(stats);
    }

init() {
    this.showCardsView();
    this.updateStats();
    
    this.dataStore.subscribe((versiones, options = {}) => {
        this.updateStats();
        
        // Solo hacer fullRender si se solicita explícitamente
        if (options.fullRender) {
            console.log('🔄 fullRender solicitado por dataStore');
            this.fullRender();
        } else {
            console.log('📊 Solo actualizando stats, sin fullRender');
        }
    });
}

fullRender() {
    console.log('🎨 fullRender iniciado');
    this.isRendering = true;
    
    if (this.currentView === 'cards') {
        this.renderCardsView();
    } else if (this.currentView === 'detail' && this.currentVersionId) {
        // CAMBIO: No re-renderizar la tabla completa, solo actualizar stats
        // El virtual scroll ya está funcionando, no lo rompamos
        console.log('⚠️ Vista detalle: Manteniendo virtual scroll sin re-render');
        
        // Solo actualizar los metadatos de la versión si cambiaron
        const version = this.dataStore.getAll().find(v => v.id === this.currentVersionId);
        if (version) {
            const titleElement = document.getElementById('detail-version-title');
            const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
            
            if (version.id === versionEnProduccionId) {
                titleElement.innerHTML = `Versión ${version.numero} <span class="badge-produccion-inline">EN PRODUCCIÓN</span>`;
            } else {
                titleElement.textContent = `Versión ${version.numero}`;
            }
        }
    }
    this.updateStats();
    
    setTimeout(() => {
        this.isRendering = false;
        console.log('🎨 fullRender completado');
    }, 100);
}}