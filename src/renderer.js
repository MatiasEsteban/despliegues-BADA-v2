// renderer.js - Sistema dual de renderizado: Vista Tarjetas + Vista Detalle

import { DOMBuilder } from './domBuilder.js';

window.DOMBuilder = DOMBuilder;

export class Renderer {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.currentView = 'cards'; // 'cards' o 'detail'
        this.currentVersionId = null;
        this.filters = {
            search: '',
            estado: '',
            responsable: '',
            fechaDesde: '',
            fechaHasta: ''
        };
    }

    // Navegación entre vistas
    showCardsView() {
        document.getElementById('view-cards').classList.add('active');
        document.getElementById('view-detail').classList.remove('active');
        this.currentView = 'cards';
        this.currentVersionId = null;
        this.renderCardsView();
    }

    showDetailView(versionId) {
        document.getElementById('view-cards').classList.remove('active');
        document.getElementById('view-detail').classList.add('active');
        this.currentView = 'detail';
        this.currentVersionId = versionId;
        this.renderDetailView(versionId);
    }

    // Aplicar filtros
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
                        cdu.responsable.toLowerCase().includes(searchLower);
                    
                    if (!matchesSearch) return false;
                }
                
                if (this.filters.estado && cdu.estado !== this.filters.estado) {
                    return false;
                }
                
                if (this.filters.responsable) {
                    const responsableLower = this.filters.responsable.toLowerCase();
                    if (!cdu.responsable.toLowerCase().includes(responsableLower)) {
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

    updateFilterStats(filteredVersions, totalVersions) {
        const totalCdus = totalVersions.reduce((sum, v) => sum + v.cdus.length, 0);
        const showingCdus = filteredVersions.reduce((sum, v) => sum + v.cdus.length, 0);
        
        document.getElementById('filter-showing').textContent = showingCdus;
        document.getElementById('filter-total').textContent = totalCdus;
        document.getElementById('filter-versions').textContent = filteredVersions.length;
    }

    // Renderizar vista de tarjetas
    renderCardsView() {
        const allVersions = this.dataStore.getAll();
        const filteredVersions = this.applyFilters(allVersions);
        
        this.updateFilterStats(filteredVersions, allVersions);
        
        const grid = document.getElementById('versions-grid');
        grid.innerHTML = '';
        
        if (filteredVersions.length === 0) {
            this.showNoVersionsMessage(grid);
            return;
        }
        
        // Ordenar de más reciente a más antigua
        const sortedVersions = [...filteredVersions].sort((a, b) => {
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numB - numA;
        });
        
        sortedVersions.forEach(version => {
            const card = DOMBuilder.crearTarjetaVersion(version, (vId) => {
                this.showDetailView(vId);
            });
            grid.appendChild(card);
        });
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
                Crea una nueva versión para comenzar
            </div>
        `;
        message.style.gridColumn = '1 / -1';
        message.style.textAlign = 'center';
        message.style.padding = '4rem 2rem';
        container.appendChild(message);
    }

    // Renderizar vista de detalle
    renderDetailView(versionId) {
        const version = this.dataStore.getAll().find(v => v.id === versionId);
        if (!version) {
            this.showCardsView();
            return;
        }
        
        // Actualizar header de la versión
        document.getElementById('detail-version-title').textContent = `Versión ${version.numero}`;
        document.getElementById('detail-version-date').textContent = this.formatDate(version.fechaDespliegue);
        document.getElementById('detail-version-time').textContent = version.horaDespliegue || 'Sin hora';
        
        // Mostrar/ocultar comentarios
        const commentsDisplay = document.getElementById('version-comments-display');
        const commentsText = document.getElementById('version-comments-text');
        
        if (version.comentarios && version.comentarios.trim()) {
            commentsText.textContent = version.comentarios;
            commentsDisplay.style.display = 'block';
        } else {
            commentsDisplay.style.display = 'none';
        }
        
        // Renderizar tabla de CDUs
        const tbody = document.getElementById('tabla-body');
        tbody.innerHTML = '';
        
        if (version.cdus.length === 0) {
            this.showNoCdusMessage(tbody);
            return;
        }
        
        version.cdus.forEach(cdu => {
            const fila = DOMBuilder.crearFilaCDU(cdu);
            tbody.appendChild(fila);
        });
        
        // Auto-resize de textareas
        setTimeout(() => {
            tbody.querySelectorAll('.campo-descripcion').forEach(textarea => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        }, 50);
    }

    showNoCdusMessage(tbody) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
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
        // En vista detalle no aplicamos filtros
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

    updateStats() {
        const stats = this.dataStore.getUniqueStats();
        DOMBuilder.actualizarEstadisticas(stats);
    }

    init() {
        this.showCardsView();
        this.updateStats();
        
        this.dataStore.subscribe(() => {
            this.updateStats();
        });
    }

    fullRender() {
        if (this.currentView === 'cards') {
            this.renderCardsView();
        } else if (this.currentView === 'detail' && this.currentVersionId) {
            this.renderDetailView(this.currentVersionId);
        }
        this.updateStats();
    }
}