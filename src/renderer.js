// renderer.js - Renderizado de la interfaz con versiones agrupadas y filtros

import { DOMBuilder } from './domBuilder.js';

// Exportar DOMBuilder globalmente para uso en eventHandlers
window.DOMBuilder = DOMBuilder;

export class Renderer {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.tbody = document.getElementById('tabla-body');
        this.isInitialRender = true;
        this.showingOldVersions = false;
        this.expandedVersions = new Set();
        this.filters = {
            search: '',
            estado: '',
            responsable: '',
            fechaDesde: '',
            fechaHasta: ''
        };
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

    renderTable(showAll = false) {
        const allVersions = this.dataStore.getAll();
        const filteredVersions = this.applyFilters(allVersions);
        
        this.updateFilterStats(filteredVersions, allVersions);
        
        this.tbody.innerHTML = '';
        
        if (filteredVersions.length === 0) {
            this.showNoResultsMessage();
            return;
        }
        
        let versionesToRender;
        const hasOldVersions = filteredVersions.length > 2;
        
        if (showAll || !hasOldVersions) {
            versionesToRender = filteredVersions;
        } else {
            versionesToRender = filteredVersions.slice(-2);
        }
        
        versionesToRender.forEach(version => {
            const isExpanded = this.expandedVersions.has(version.id);
            const filas = DOMBuilder.crearFilasVersion(version, isExpanded);
            filas.forEach(fila => this.tbody.appendChild(fila));
        });
        
        if (hasOldVersions && !showAll) {
            this.addToggleOldVersionsButton(filteredVersions.length - 2);
        }
    }

    showNoResultsMessage() {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 9;
        td.style.textAlign = 'center';
        td.style.padding = '3rem';
        td.style.color = 'var(--text-secondary)';
        td.innerHTML = `
            <svg style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 0.5rem;">No se encontraron resultados</div>
            <div style="font-size: 0.875rem;">Intenta ajustar los filtros de búsqueda</div>
        `;
        tr.appendChild(td);
        this.tbody.appendChild(tr);
    }

    addToggleOldVersionsButton(numOldVersions) {
        const tr = document.createElement('tr');
        tr.className = 'versiones-anteriores-row';
        
        const td = document.createElement('td');
        td.colSpan = 9;
        td.className = 'versiones-anteriores-section';
        
        const button = document.createElement('button');
        button.className = 'btn-toggle-versiones';
        button.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span>Mostrar ${numOldVersions} versión${numOldVersions !== 1 ? 'es' : ''} anterior${numOldVersions !== 1 ? 'es' : ''}</span>
        `;
        
        button.addEventListener('click', () => {
            this.showingOldVersions = !this.showingOldVersions;
            if (this.showingOldVersions) {
                button.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    <span>Ocultar versiones anteriores</span>
                `;
                this.renderOldVersions();
            } else {
                this.fullRender();
            }
        });
        
        td.appendChild(button);
        tr.appendChild(td);
        
        this.tbody.insertBefore(tr, this.tbody.firstChild);
    }

    renderOldVersions() {
        const allVersions = this.dataStore.getAll();
        const filteredVersions = this.applyFilters(allVersions);
        
        this.updateFilterStats(filteredVersions, allVersions);
        
        if (filteredVersions.length === 0) {
            this.tbody.innerHTML = '';
            this.showNoResultsMessage();
            return;
        }
        
        const oldVersions = filteredVersions.slice(0, -2);
        
        this.tbody.innerHTML = '';
        
        const tr = document.createElement('tr');
        tr.className = 'versiones-anteriores-row';
        
        const td = document.createElement('td');
        td.colSpan = 9;
        td.className = 'versiones-anteriores-section';
        
        const button = document.createElement('button');
        button.className = 'btn-toggle-versiones expanded';
        button.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            <span>Ocultar versiones anteriores</span>
        `;
        
        button.addEventListener('click', () => {
            this.showingOldVersions = false;
            this.fullRender();
        });
        
        td.appendChild(button);
        tr.appendChild(td);
        this.tbody.appendChild(tr);
        
        oldVersions.forEach(version => {
            const isExpanded = this.expandedVersions.has(version.id);
            const filas = DOMBuilder.crearFilasVersion(version, isExpanded);
            filas.forEach(fila => this.tbody.appendChild(fila));
        });
        
        const recentVersions = filteredVersions.slice(-2);
        recentVersions.forEach(version => {
            const isExpanded = this.expandedVersions.has(version.id);
            const filas = DOMBuilder.crearFilasVersion(version, isExpanded);
            filas.forEach(fila => this.tbody.appendChild(fila));
        });
    }

    toggleVersionCdus(versionId) {
        if (this.expandedVersions.has(versionId)) {
            this.expandedVersions.delete(versionId);
        } else {
            this.expandedVersions.add(versionId);
        }
        this.fullRender();
    }

    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        this.fullRender();
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
        
        this.fullRender();
    }

    updateStats() {
        const stats = this.dataStore.getUniqueStats();
        DOMBuilder.actualizarEstadisticas(stats);
    }

    init() {
        this.renderTable();
        this.updateStats();
        
        this.dataStore.subscribe(() => {
            if (this.isInitialRender) {
                this.isInitialRender = false;
                return;
            }
            this.updateStats();
        });
    }

    fullRender() {
        this.renderTable(this.showingOldVersions);
        this.updateStats();
        
        setTimeout(() => {
            this.tbody.querySelectorAll('.campo-descripcion').forEach(textarea => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        }, 50);
    }
}