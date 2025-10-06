// renderer.js - Renderizado de la interfaz con versiones agrupadas y filtros

import { DOMBuilder } from './domBuilder.js';

export class Renderer {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.tbody = document.getElementById('tabla-body');
        this.isInitialRender = true;
        this.showingOldVersions = false;
        this.expandedVersions = new Set(); // Mantener track de versiones expandidas
        this.filters = {
            search: '',
            estado: '',
            responsable: '',
            fechaDesde: '',
            fechaHasta: ''
        };
    }

    // Aplicar filtros a las versiones
    applyFilters(versiones) {
        // Si no hay filtros activos, devolver todo sin procesar
        const hasActiveFilters = this.filters.search || 
                                 this.filters.estado || 
                                 this.filters.responsable || 
                                 this.filters.fechaDesde || 
                                 this.filters.fechaHasta;
        
        if (!hasActiveFilters) {
            return versiones;
        }
        
        // Aplicar filtros solo cuando están activos
        let filtered = versiones.map(version => {
            // Filtrar CDUs dentro de la versión
            const filteredCdus = version.cdus.filter(cdu => {
                // Filtro de búsqueda general
                if (this.filters.search) {
                    const searchLower = this.filters.search.toLowerCase();
                    const matchesSearch = 
                        version.numero.toLowerCase().includes(searchLower) ||
                        cdu.nombreCDU.toLowerCase().includes(searchLower) ||
                        cdu.descripcionCDU.toLowerCase().includes(searchLower) ||
                        cdu.responsable.toLowerCase().includes(searchLower);
                    
                    if (!matchesSearch) return false;
                }
                
                // Filtro de estado
                if (this.filters.estado && cdu.estado !== this.filters.estado) {
                    return false;
                }
                
                // Filtro de responsable
                if (this.filters.responsable) {
                    const responsableLower = this.filters.responsable.toLowerCase();
                    if (!cdu.responsable.toLowerCase().includes(responsableLower)) {
                        return false;
                    }
                }
                
                // Filtro de fecha desde
                if (this.filters.fechaDesde && version.fechaDespliegue < this.filters.fechaDesde) {
                    return false;
                }
                
                // Filtro de fecha hasta
                if (this.filters.fechaHasta && version.fechaDespliegue > this.filters.fechaHasta) {
                    return false;
                }
                
                return true;
            });
            
            // Retornar versión con CDUs filtrados
            return {
                ...version,
                cdus: filteredCdus
            };
        }).filter(version => version.cdus.length > 0); // Solo versiones con CDUs visibles
        
        return filtered;
    }

    // Actualizar estadísticas de filtros
    updateFilterStats(filteredVersions, totalVersions) {
        const totalCdus = totalVersions.reduce((sum, v) => sum + v.cdus.length, 0);
        const showingCdus = filteredVersions.reduce((sum, v) => sum + v.cdus.length, 0);
        
        document.getElementById('filter-showing').textContent = showingCdus;
        document.getElementById('filter-total').textContent = totalCdus;
        document.getElementById('filter-versions').textContent = filteredVersions.length;
    }

    // Renderizar la tabla completa
    renderTable(showAll = false) {
        const allVersions = this.dataStore.getAll();
        const filteredVersions = this.applyFilters(allVersions);
        
        // Actualizar estadísticas de filtros
        this.updateFilterStats(filteredVersions, allVersions);
        
        // Limpiar tabla
        this.tbody.innerHTML = '';
        
        // Si no hay resultados después de filtrar
        if (filteredVersions.length === 0) {
            this.showNoResultsMessage();
            return;
        }
        
        // Determinar qué versiones mostrar
        let versionesToRender;
        const hasOldVersions = filteredVersions.length > 2;
        
        if (showAll || !hasOldVersions) {
            versionesToRender = filteredVersions;
        } else {
            // Mostrar solo las últimas 2 versiones
            versionesToRender = filteredVersions.slice(-2);
        }
        
        // Agregar filas por versión
        versionesToRender.forEach(version => {
            const isExpanded = this.expandedVersions.has(version.id);
            const filas = DOMBuilder.crearFilasVersion(version, isExpanded);
            filas.forEach(fila => this.tbody.appendChild(fila));
        });
        
        // Si hay versiones anteriores y no se están mostrando, agregar botón
        if (hasOldVersions && !showAll) {
            this.addToggleOldVersionsButton(filteredVersions.length - 2);
        }
    }

    // Mostrar mensaje cuando no hay resultados
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

    // Agregar botón para mostrar versiones anteriores
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
        
        // Insertar al principio de la tabla
        this.tbody.insertBefore(tr, this.tbody.firstChild);
    }

    // Renderizar versiones anteriores expandidas
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
        
        // Limpiar tabla
        this.tbody.innerHTML = '';
        
        // Agregar botón de colapsar
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
        
        // Renderizar versiones anteriores
        oldVersions.forEach(version => {
            const isExpanded = this.expandedVersions.has(version.id);
            const filas = DOMBuilder.crearFilasVersion(version, isExpanded);
            filas.forEach(fila => this.tbody.appendChild(fila));
        });
        
        // Renderizar últimas 2 versiones
        const recentVersions = filteredVersions.slice(-2);
        recentVersions.forEach(version => {
            const isExpanded = this.expandedVersions.has(version.id);
            const filas = DOMBuilder.crearFilasVersion(version, isExpanded);
            filas.forEach(fila => this.tbody.appendChild(fila));
        });
    }

    // Expandir o colapsar CDUs de una versión específica
    toggleVersionCdus(versionId) {
        if (this.expandedVersions.has(versionId)) {
            this.expandedVersions.delete(versionId);
        } else {
            this.expandedVersions.add(versionId);
        }
        this.fullRender();
    }

    // Actualizar filtros
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        this.fullRender();
    }

    // Limpiar filtros
    clearFilters() {
        this.filters = {
            search: '',
            estado: '',
            responsable: '',
            fechaDesde: '',
            fechaHasta: ''
        };
        
        // Limpiar inputs
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-estado').value = '';
        document.getElementById('filter-responsable').value = '';
        document.getElementById('filter-fecha-desde').value = '';
        document.getElementById('filter-fecha-hasta').value = '';
        
        this.fullRender();
    }

    // Actualizar solo las estadísticas (más eficiente)
    updateStats() {
        const stats = this.dataStore.getUniqueStats(); // Usar estadísticas únicas
        DOMBuilder.actualizarEstadisticas(stats);
    }

    init() {
        // Renderizar tabla inicial
        this.renderTable();
        this.updateStats();
        
        // Suscribirse a cambios en el dataStore
        this.dataStore.subscribe(() => {
            if (this.isInitialRender) {
                this.isInitialRender = false;
                return;
            }
            // Solo actualizar estadísticas, no re-renderizar toda la tabla
            this.updateStats();
        });
    }

    // Método público para forzar re-renderizado completo (usado al agregar/eliminar)
    fullRender() {
        this.renderTable(this.showingOldVersions);
        this.updateStats();
        
        // Auto-ajustar altura de textareas después del render
        setTimeout(() => {
            this.tbody.querySelectorAll('.campo-descripcion').forEach(textarea => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        }, 50);
    }
}