// src/core/renderer.js - Sistema dual de renderizado con comentarios categorizados y búsqueda robusta de elementos

import { DOMBuilder } from '../components/domBuilder.js';
import { VirtualScroll } from '../components/table/VirtualScroll.js';

window.DOMBuilder = DOMBuilder; // Asegura acceso global si es necesario en otros scripts

export class Renderer {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.currentView = 'cards'; // 'cards' o 'detail'
        this.currentVersionId = null;
        this.isRendering = false;

        // Estado de vista de tarjetas
        this.cardViewMode = 'grid'; // 'grid' o 'list'
        this.versionesVisibles = 5; // Para 'grid'

        // Estado de paginación de lista
        this.listCurrentPage = 1;
        this.listRowsPerPage = 10;

        // Instancia de VirtualScroll para la vista de detalle
        this.virtualScroll = new VirtualScroll({
            rowHeight: 120, // Ajusta según la altura promedio de tus filas de CDU
            visibleRows: 10,
            bufferRows: 5
        });

        // Filtros
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

        // Referencias a elementos principales (se buscarán dinámicamente)
        this.gridContainer = null;
        this.listContainer = null;
        this.loadMoreContainer = null;
        this.viewCardsContainer = null; // Contenedor padre de la vista de tarjetas
    }

    /**
     * Asegura que las referencias a los contenedores principales existan.
     * Busca los elementos en el DOM si las referencias son nulas o si el contenedor padre no coincide.
     * Devuelve true si todos los elementos necesarios existen, false si no.
     */
    _ensureContainers() {
        const currentViewCardsContainer = document.getElementById('view-cards');

        // Si el contenedor padre no existe, es un error crítico
        if (!currentViewCardsContainer) {
            console.error("Error Crítico: No se encontró el contenedor principal #view-cards.");
            this.viewCardsContainer = null; // Resetear referencias
            this.gridContainer = null;
            this.listContainer = null;
            this.loadMoreContainer = null;
            return false;
        }

        // Si el contenedor padre cambió o las referencias internas son nulas, rebuscar
        if (this.viewCardsContainer !== currentViewCardsContainer || !this.gridContainer || !this.listContainer || !this.loadMoreContainer) {
            this.viewCardsContainer = currentViewCardsContainer; // Actualizar referencia padre
            console.log("🔍 Buscando/Refrescando contenedores hijos...");

            this.gridContainer = this.viewCardsContainer.querySelector('#versions-grid');
            this.listContainer = this.viewCardsContainer.querySelector('#versions-list-container');
            this.loadMoreContainer = this.viewCardsContainer.querySelector('#load-more-container');

            // Comprobar si se encontraron todos los hijos necesarios
            if (!this.gridContainer || !this.listContainer || !this.loadMoreContainer) {
                console.error("Error Crítico: Faltan uno o más contenedores hijos (#versions-grid, #versions-list-container, #load-more-container) dentro de #view-cards.");
                // Resetear referencias hijas por seguridad
                this.gridContainer = null;
                this.listContainer = null;
                this.loadMoreContainer = null;
                return false;
            }
            console.log("✅ Contenedores hijos encontrados.");
        }
        // Si llegamos aquí, todos los contenedores necesarios existen
        return true;
    }


    showCardsView() {
        document.getElementById('view-cards')?.classList.add('active'); // Usar optional chaining por si acaso
        document.getElementById('view-detail')?.classList.remove('active');
        this.currentView = 'cards';
        this.currentVersionId = null;
        this.versionesVisibles = 5;
        this.listCurrentPage = 1;
        this.renderCardsView(); // Llama al router que ahora usa _ensureContainers
    }

    showDetailView(versionId) {
        document.getElementById('view-cards')?.classList.remove('active');
        document.getElementById('view-detail')?.classList.add('active');
        this.currentView = 'detail';
        this.currentVersionId = versionId;
        this.renderDetailView(versionId); // Esta función busca sus propios elementos
    }

    applyFilters(versiones) {
        // ... (sin cambios) ...
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
                        (cdu.nombreCDU && cdu.nombreCDU.toLowerCase().includes(searchLower)) || // Añadir comprobación
                        (cdu.descripcionCDU && cdu.descripcionCDU.toLowerCase().includes(searchLower)) || // Añadir comprobación
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

            // Solo incluir la versión si alguno de sus CDUs coincide O si la búsqueda coincide con el número de versión
            const versionNumberMatches = this.filters.search && version.numero.toLowerCase().includes(this.filters.search.toLowerCase());
            return {
                ...version,
                cdus: filteredCdus,
                // Añadir una bandera para saber si mantener la versión aunque no tenga CDUs filtrados
                _keepVersion: versionNumberMatches
            };
        }).filter(version => version.cdus.length > 0 || version._keepVersion); // Mantener si tiene CDUs o si el número de versión coincidió

        // Limpiar la bandera temporal
        filtered.forEach(v => delete v._keepVersion);

        return filtered;
    }


    getResponsablesText(cdu) {
        // ... (sin cambios) ...
        if (Array.isArray(cdu.responsables) && cdu.responsables.length > 0) {
            return cdu.responsables.map(r => `${r.nombre || ''} ${r.rol || ''}`).join(' ');
        } else if (cdu.responsable) { // Compatibilidad con formato antiguo
            return cdu.responsable;
        }
        return '';
    }

    updateFilterStats(filteredVersions, totalVersions) {
        // ... (sin cambios) ...
        const totalCdus = totalVersions.reduce((sum, v) => sum + (v.cdus?.length || 0), 0);
        const showingCdus = filteredVersions.reduce((sum, v) => sum + (v.cdus?.length || 0), 0);

        document.getElementById('filter-showing').textContent = showingCdus;
        document.getElementById('filter-total').textContent = totalCdus;
        document.getElementById('filter-versions').textContent = filteredVersions.length;
    }

    /**
     * Router para la vista de tarjetas.
     * Llama a _ensureContainers y luego a la función de renderizado apropiada.
     */
    renderCardsView() {
        if (!this._ensureContainers()) {
            console.error("Renderizado de vista de tarjetas abortado porque faltan contenedores esenciales.");
            // Opcional: Mostrar un mensaje de error en la UI
             if (this.viewCardsContainer) { // Si al menos el padre existe
                 this.viewCardsContainer.innerHTML = '<p style="color: red; padding: 20px;">Error: No se pudieron cargar los elementos de la interfaz. Por favor, recarga la página.</p>';
             }
            return;
        }

        // Ahora sabemos que this.gridContainer, etc., existen
        if (this.cardViewMode === 'grid') {
            this.renderCardsGrid();
        } else {
            this.renderCardsList();
        }
    }

    /**
     * Renderiza la vista de grid (tarjetas). Usa this.*Container.
     */
    renderCardsGrid() {
        this.gridContainer.style.display = 'grid';
        this.listContainer.style.display = 'none';

        const allVersions = this.dataStore.getAll();
        const filteredVersions = this.applyFilters(allVersions);
        this.updateFilterStats(filteredVersions, allVersions);

        this.gridContainer.innerHTML = ''; // Limpiar grid

        if (filteredVersions.length === 0) {
            this.showNoVersionsMessage(this.gridContainer);
            this.updateLoadMoreButton(0, 0);
            return;
        }

        const sortedVersions = [...filteredVersions].sort((a, b) => {
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numB - numA;
        });

        console.log('🎨 RENDER GRID - Versiones a renderizar:', sortedVersions.length);
        const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
        const versionesToShow = sortedVersions.slice(0, this.versionesVisibles);

        versionesToShow.forEach(version => {
            const isEnProduccion = version.id === versionEnProduccionId;
            const card = DOMBuilder.crearTarjetaVersion(version, (vId) => {
                this.showDetailView(vId);
            }, isEnProduccion);
            this.gridContainer.appendChild(card);
        });

        this.updateLoadMoreButton(versionesToShow.length, sortedVersions.length);
    }

    /**
     * Renderiza la vista de lista paginada. Usa this.*Container.
     */
    renderCardsList() {
if (!this._ensureContainers()) return; // Asegurar contenedores al inicio

        this.gridContainer.style.display = 'none';
        this.listContainer.style.display = 'block';
        this.loadMoreContainer.style.display = 'none';

        const allVersions = this.dataStore.getAll();
        const filteredVersions = this.applyFilters(allVersions);
        this.updateFilterStats(filteredVersions, allVersions);

        const listDiv = this.listContainer.querySelector('#versions-list');
        if (!listDiv) { /* ... manejo de error ... */ return; }
        listDiv.innerHTML = '';

        if (filteredVersions.length === 0) { /* ... mostrar mensaje vacío ... */ return; }

        const sortedVersions = [...filteredVersions].sort((a, b) => {
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numB - numA;
        });
        

        const totalVersions = sortedVersions.length;
        const totalPages = Math.ceil(totalVersions / this.listRowsPerPage);
        this.listCurrentPage = Math.max(1, Math.min(this.listCurrentPage, totalPages)); // Asegurar página válida

        const startIndex = (this.listCurrentPage - 1) * this.listRowsPerPage;
        const endIndex = Math.min(startIndex + this.listRowsPerPage, totalVersions);
        const versionsToShow = sortedVersions.slice(startIndex, endIndex);

        console.log(`🎨 RENDER LIST - Página ${this.listCurrentPage}/${totalPages}. Mostrando [${startIndex}-${endIndex}] de ${totalVersions}`);

const table = document.createElement('table');
        table.className = 'versions-list-table';
        // ¡CAMBIO! Actualizar encabezados de tabla
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Versión</th>
                    <th>CDUs (Estado)</th>
                    <th>Despliegue</th>
                    <th>Info</th>
                    <th>Producción / Acciones</th>
                </tr>
            </thead>
        `;
        const tbody = document.createElement('tbody');
        const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();

        versionsToShow.forEach(version => {
            const isEnProduccion = version.id === versionEnProduccionId;
            // Llamada a crearFilaVersionLista sin cambios aquí, los cambios están dentro de esa función
            const row = DOMBuilder.crearFilaVersionLista(version, isEnProduccion, (vId) => {
                this.showDetailView(vId);
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        listDiv.appendChild(table);

        this.renderListPagination(totalPages, this.listCurrentPage);
    }

    /**
     * Renderiza los botones de paginación. Usa this.listContainer.
     */
    renderListPagination(totalPages, currentPage) {
        // Asegurarse de que listContainer exista (aunque _ensureContainers ya lo hizo)
        if (!this.listContainer) return;

        const paginationContainer = this.listContainer.querySelector('#list-pagination');
        if (!paginationContainer) {
            console.error("Error: No se encontró #list-pagination");
            return;
        }
        paginationContainer.innerHTML = ''; // Limpiar

        if (totalPages <= 1) return; // No mostrar si hay 1 o 0 páginas

        // Botón "Anterior"
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '&laquo; Anterior';
        prevBtn.dataset.page = currentPage - 1;
        prevBtn.disabled = currentPage === 1;
        paginationContainer.appendChild(prevBtn);

        // Números de página (simplificado)
        // Podría mejorarse para mostrar "..." en rangos largos
        const maxPagesToShow = 5; // Máximo de botones numéricos
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        // Ajustar si el rango final es menor al máximo por estar cerca del final
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        // Añadir "..." al inicio si es necesario
        if (startPage > 1) {
             const firstBtn = document.createElement('button');
             firstBtn.className = 'pagination-btn';
             firstBtn.textContent = '1';
             firstBtn.dataset.page = 1;
             paginationContainer.appendChild(firstBtn);
             if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0.5rem';
                paginationContainer.appendChild(ellipsis);
             }
        }


        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'pagination-btn';
            pageBtn.textContent = i;
            pageBtn.dataset.page = i;
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            paginationContainer.appendChild(pageBtn);
        }
         // Añadir "..." al final si es necesario
         if (endPage < totalPages) {
             if (endPage < totalPages - 1) {
                 const ellipsis = document.createElement('span');
                 ellipsis.textContent = '...';
                 ellipsis.style.padding = '0.5rem';
                 paginationContainer.appendChild(ellipsis);
             }
              const lastBtn = document.createElement('button');
              lastBtn.className = 'pagination-btn';
              lastBtn.textContent = totalPages;
              lastBtn.dataset.page = totalPages;
              paginationContainer.appendChild(lastBtn);
         }


        // Botón "Siguiente"
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = 'Siguiente &raquo;';
        nextBtn.dataset.page = currentPage + 1;
        nextBtn.disabled = currentPage === totalPages;
        paginationContainer.appendChild(nextBtn);
    }

    /**
     * Cambia de página en la vista de lista.
     */
    changeListPage(newPage) {
        // Asegurarse de que los contenedores existan antes de calcular
        if (!this._ensureContainers()) return;

        const allVersions = this.dataStore.getAll();
        const filteredVersions = this.applyFilters(allVersions);
        const totalPages = Math.ceil(filteredVersions.length / this.listRowsPerPage);

        const targetPage = Math.max(1, Math.min(newPage, totalPages)); // Sanitizar página

        if (targetPage !== this.listCurrentPage) {
             this.listCurrentPage = targetPage;
             this.renderCardsList(); // Re-renderizar la lista
        }
    }


    /**
     * Actualiza el botón "Cargar Más". Usa this.loadMoreContainer.
     */
    updateLoadMoreButton(showing, total) {
        // Asegurarse de que loadMoreContainer exista
        if (!this.loadMoreContainer) return;

        const btnLoadMore = this.loadMoreContainer.querySelector('#btn-load-more-versions');
        const countSpan = this.loadMoreContainer.querySelector('#versions-remaining-count');

        if (!btnLoadMore || !countSpan) {
            this.loadMoreContainer.style.display = 'none'; // Ocultar si faltan elementos internos
            return;
        }

        const remaining = total - showing;

        if (remaining > 0) {
            this.loadMoreContainer.style.display = 'flex';
            countSpan.textContent = remaining;
        } else {
            this.loadMoreContainer.style.display = 'none';
        }
    }

    /**
     * Carga más versiones en la vista de grid.
     */
    cargarMasVersiones() {
        this.versionesVisibles += 10; // O el número que prefieras
        this.renderCardsView(); // Llama al router que re-evaluará contenedores y modo
    }

    /**
     * Muestra un mensaje cuando no hay versiones.
     */
    showNoVersionsMessage(container) {
        if (!container) return;
        const message = document.createElement('div');
        message.className = 'no-versions-message'; // Asegúrate de tener estilos para esto
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
                ${this.filters.search || this.filters.estado || this.filters.responsable || this.filters.fechaDesde || this.filters.fechaHasta
                    ? 'Ninguna versión coincide con los filtros aplicados.'
                    : 'Crea una nueva versión o sube un archivo para comenzar.'
                }
            </div>`;
        message.style.gridColumn = '1 / -1'; // Para grid
        message.style.textAlign = 'center';
        message.style.padding = '4rem 2rem';
        container.appendChild(message);
    }

    /**
     * Renderiza la vista de detalle de una versión.
     */
    renderDetailView(versionId) {
        // ... (resto de renderDetailView sin cambios significativos,
        //      ya que busca sus propios elementos por ID como #detail-version-title, etc.) ...
        const version = this.dataStore.getAll().find(v => v.id === versionId);

        if (!version) {
            console.warn(`Intento de renderizar detalle para versión ID ${versionId} no encontrada.`);
            this.showCardsView(); // Volver a la vista principal si la versión no existe
            return;
        }

        document.getElementById('detail-version-title').textContent = `Versión ${version.numero}`;
        document.getElementById('detail-version-date').value = version.fechaDespliegue || '';
        document.getElementById('detail-version-time').value = version.horaDespliegue || '';

        const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
        const titleElement = document.getElementById('detail-version-title');
        if (version.id === versionEnProduccionId) {
            titleElement.innerHTML = `Versión ${version.numero} <span class="badge-produccion-inline">EN PRODUCCIÓN</span>`;
        } // No necesita 'else' porque ya establecimos el texto base arriba

        // Mostrar comentarios categorizados
        this.updateVersionComments(version); // Usar función auxiliar

        console.log('🎨 RENDER DETAIL - Versión:', version.numero);
        console.log('  Total CDUs en version:', version.cdus?.length || 0); // Añadir optional chaining

        const tbody = document.getElementById('tabla-body');
        if (!tbody) {
             console.error("Error crítico: No se encontró tbody #tabla-body.");
             return;
        }

        if (!version.cdus || version.cdus.length === 0) {
            tbody.innerHTML = ''; // Limpiar por si acaso
            this.virtualScroll.cleanup(); // Limpiar virtual scroll si estaba activo
            this.showNoCdusMessage(tbody);
            // Actualizar stats de filtros de detalle a 0
            document.getElementById('detail-filter-showing').textContent = '0';
            document.getElementById('detail-filter-total').textContent = '0';
            return;
        }

        // Determinar qué CDUs mostrar (filtrados o todos)
        const cdusToRender = this.applyDetailFiltersInternal(version.cdus); // Usar función interna

        // Renderizar con VirtualScroll
        this.virtualScroll.render(cdusToRender); // Pasar los CDUs (filtrados o no)

        // Actualizar stats de filtros de detalle
        document.getElementById('detail-filter-showing').textContent = cdusToRender.length;
        document.getElementById('detail-filter-total').textContent = version.cdus.length;

        // Ajustar textareas después de un frame
        requestAnimationFrame(() => {
            this.adjustTextareasInTbody(tbody);
        });
    }

    /**
     * Función interna para aplicar filtros de detalle.
     * Devuelve el array de CDUs filtrados.
     */
     applyDetailFiltersInternal(cdus) {
        if (!cdus) return []; // Seguridad

        const hasActiveFilters = this.detailFilters.search ||
                                 this.detailFilters.estado ||
                                 this.detailFilters.responsable;

        if (!hasActiveFilters) {
            return cdus; // Devolver todos si no hay filtros activos
        }

        const searchLower = this.detailFilters.search.toLowerCase();
        const estadoFilter = this.detailFilters.estado;
        const responsableLower = this.detailFilters.responsable.toLowerCase();

        return cdus.filter(cdu => {
            let matches = true;

            // Filtro de búsqueda
            if (this.detailFilters.search) {
                const matchesSearch =
                    (cdu.nombreCDU && cdu.nombreCDU.toLowerCase().includes(searchLower)) ||
                    (cdu.descripcionCDU && cdu.descripcionCDU.toLowerCase().includes(searchLower)) ||
                    this.getResponsablesText(cdu).toLowerCase().includes(searchLower) ||
                    (cdu.observaciones && Array.isArray(cdu.observaciones) && cdu.observaciones.some(obs =>
                        typeof obs === 'string' && obs.toLowerCase().includes(searchLower)
                    ));
                if (!matchesSearch) matches = false;
            }

            // Filtro de estado
            if (matches && estadoFilter && cdu.estado !== estadoFilter) {
                matches = false;
            }

            // Filtro de responsable
            if (matches && this.detailFilters.responsable) {
                const responsablesText = this.getResponsablesText(cdu).toLowerCase();
                if (!responsablesText.includes(responsableLower)) {
                    matches = false;
                }
            }

            return matches;
        });
    }


    /**
    * Aplica los filtros de detalle y actualiza la tabla (llamado por eventos).
    */
   applyDetailFilters() {
       if (this.currentView !== 'detail' || !this.currentVersionId) return;

       const version = this.dataStore.getAll().find(v => v.id === this.currentVersionId);
       if (!version || !version.cdus) {
           // Si no hay versión o CDUs, limpiar tabla y stats
            const tbody = document.getElementById('tabla-body');
            if (tbody) tbody.innerHTML = '';
            this.virtualScroll.cleanup();
            document.getElementById('detail-filter-showing').textContent = '0';
            document.getElementById('detail-filter-total').textContent = '0';
           return;
       }

       const filteredCdus = this.applyDetailFiltersInternal(version.cdus);

       // Actualizar VirtualScroll con los datos filtrados
       this.virtualScroll.updateData(filteredCdus);

       // Actualizar estadísticas
       document.getElementById('detail-filter-showing').textContent = filteredCdus.length;
       document.getElementById('detail-filter-total').textContent = version.cdus.length;

       // Ajustar textareas después de un frame
        requestAnimationFrame(() => {
             const tbody = document.getElementById('tabla-body');
             if (tbody) this.adjustTextareasInTbody(tbody);
        });
   }


    /**
     * Ajusta la altura de los textareas dentro de un tbody.
     */
    adjustTextareasInTbody(tbody) {
        if (!tbody) return;
        tbody.querySelectorAll('.campo-descripcion').forEach(textarea => {
            textarea.style.height = 'auto'; // Resetear altura
            textarea.style.height = `${textarea.scrollHeight}px`; // Ajustar al contenido
        });
    }


    /**
     * Actualiza la sección de comentarios en la vista de detalle.
     * Acepta la versión como argumento opcional para evitar buscarla de nuevo.
     */
    updateVersionComments(version = null) {
        if (this.currentView !== 'detail' || !this.currentVersionId) return;

        const versionToUse = version || this.dataStore.getAll().find(v => v.id === this.currentVersionId);
        if (!versionToUse) return;

        const commentsDisplay = document.getElementById('version-comments-display');
        const commentsContainer = document.getElementById('version-comments-container');
        if (!commentsDisplay || !commentsContainer) return;

        const comentarios = versionToUse.comentarios;
        const hasComentarios = this.tieneComentarios(comentarios);

        if (hasComentarios) {
            commentsContainer.innerHTML = this.renderComentariosCategorizados(comentarios);
            commentsDisplay.style.display = 'block';
            // Animación suave (opcional)
            commentsContainer.style.opacity = '0';
             requestAnimationFrame(() => { // Asegura que el cambio de display ocurra antes de la opacidad
                 commentsContainer.style.transition = 'opacity 0.3s ease';
                 commentsContainer.style.opacity = '1';
             });
        } else {
            commentsDisplay.style.display = 'none';
        }
    }


    tieneComentarios(comentarios) {
        // ... (sin cambios) ...
        if (!comentarios) return false;
        if (typeof comentarios === 'string') {
            return comentarios.trim().length > 0;
        }
        return (comentarios.mejoras?.length > 0) ||
               (comentarios.salidas?.length > 0) ||
               (comentarios.cambiosCaliente?.length > 0) ||
               (comentarios.observaciones?.length > 0);
    }

    renderComentariosCategorizados(comentarios) {
        // ... (sin cambios) ...
         // Migrar formato antiguo si es necesario
         let comentariosObj = comentarios;
         if (typeof comentarios === 'string') {
             comentariosObj = { mejoras: [], salidas: [], cambiosCaliente: [], observaciones: [comentarios] };
         } else if (!comentarios) {
              comentariosObj = { mejoras: [], salidas: [], cambiosCaliente: [], observaciones: [] };
         }


        let html = '';
        const categorias = [
            { key: 'mejoras', titulo: 'Mejoras y Bugfixes', icon: 'bug' },
            { key: 'salidas', titulo: 'Salidas a Producción', icon: 'zap' },
            { key: 'cambiosCaliente', titulo: 'Cambios en Caliente (CeC)', icon: 'flame' },
            { key: 'observaciones', titulo: 'Observaciones', icon: 'file' }
        ];
        // ... (resto igual)
         const iconos = {
             'bug': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">...</svg>`, // Completa los SVGs
             'zap': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">...</svg>`,
             'flame': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">...</svg>`,
             'file': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">...</svg>`
         };

         categorias.forEach(cat => {
             const items = comentariosObj[cat.key]; // Usa comentariosObj
             if (items && items.length > 0) {
                 const itemsHTML = items.map(item => `<li>${item || ''}</li>`).join(''); // Manejar items nulos/undefined
                 html += `
                     <div class="comentario-display-categoria">
                         <div class="comentario-display-header">
                              ${iconos[cat.icon] || ''}
                             <strong>${cat.titulo}</strong>
                         </div>
                         <ul class="comentario-display-list">
                             ${itemsHTML}
                         </ul>
                     </div>
                 `;
             }
         });


        return html || '<p style="padding: 1rem; color: var(--text-secondary);">No hay comentarios para esta versión.</p>'; // Mensaje si está vacío
    }


    showNoCdusMessage(tbody) {
        // ... (sin cambios) ...
        if (!tbody) return;
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8; // Ajustar colspan si cambió el número de columnas
        td.style.textAlign = 'center';
        // ... (resto igual)
    }

    formatDate(dateString) {
        // ... (sin cambios) ...
        if (!dateString) return 'Sin fecha';
        // Usar try-catch por si el formato es inválido
        try {
            const date = new Date(dateString + 'T00:00:00Z'); // Añadir Z para UTC y evitar problemas de zona horaria
             if (isNaN(date)) return 'Fecha inválida'; // Comprobar si la fecha es válida
            // Formato DD/MM/YYYY
            const day = date.getUTCDate().toString().padStart(2, '0');
            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            const year = date.getUTCFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            console.error("Error formateando fecha:", dateString, e);
            return 'Fecha inválida';
        }

    }


    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        if (this.currentView === 'cards') {
            this.listCurrentPage = 1; // Resetear paginación al aplicar filtros
            this.renderCardsView(); // Llama al router
        }
    }

    clearFilters() {
        this.filters = { search: '', estado: '', responsable: '', fechaDesde: '', fechaHasta: '' };
        // Limpiar inputs del DOM
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-estado').value = '';
        document.getElementById('filter-responsable').value = '';
        document.getElementById('filter-fecha-desde').value = '';
        document.getElementById('filter-fecha-hasta').value = '';

        if (this.currentView === 'cards') {
            this.listCurrentPage = 1; // Resetear paginación
            this.renderCardsView(); // Llama al router
        }
    }

    setDetailFilters(filters) {
        this.detailFilters = { ...this.detailFilters, ...filters };
        if (this.currentView === 'detail' && this.currentVersionId) {
            this.applyDetailFilters(); // Llama a la función que actualiza el virtual scroll
        }
    }


    clearDetailFilters() {
        this.detailFilters = { search: '', estado: '', responsable: '' };
        // Limpiar inputs del DOM
        document.getElementById('detail-filter-search').value = '';
        document.getElementById('detail-filter-estado').value = '';
        document.getElementById('detail-filter-responsable').value = '';

        if (this.currentView === 'detail' && this.currentVersionId) {
            this.applyDetailFilters(); // Llama a la función que actualiza el virtual scroll
        }
    }

    updateStats() {
        // ... (sin cambios) ...
         try {
             const stats = this.dataStore.getUniqueStats();
             DOMBuilder.actualizarEstadisticas(stats);
         } catch (error) {
             console.error("Error al actualizar estadísticas:", error);
             // Podrías resetear los contadores a 0 en la UI si falla
             DOMBuilder.actualizarEstadisticas({ total: 0, desarrollo: 0, pendiente: 0, certificado: 0, produccion: 0 });
         }
    }

    init() {
        // La búsqueda inicial de elementos se hace ahora en _ensureContainers
        this.showCardsView();
        this.updateStats();

        this.dataStore.subscribe((versiones, options = {}) => {
            console.log('📬 DataStore notificado. Opciones:', options);
            this.updateStats(); // Siempre actualizar stats

             // Re-renderizar la vista de tarjetas si estamos en ella O si se pidió fullRender
            if (this.currentView === 'cards' || options.fullRender) {
                 console.log(`🔄 Re-renderizando vista de tarjetas... (fullRender: ${!!options.fullRender})`);
                 this.renderCardsView(); // Llama al router que usa _ensureContainers
            }
             // Si estamos en detalle y NO es fullRender, solo actualizar partes si es necesario
             else if (this.currentView === 'detail' && !options.fullRender) {
                console.log('📊 Actualizando vista de detalle (sin fullRender)');
                // Podrías añadir lógica aquí para actualizar solo partes si fuera necesario,
                // pero por ahora, la tabla se actualiza por VirtualScroll y los comentarios/metadata
                // se actualizan al guardar/descartar cambios.
                 this.updateVersionComments(); // Actualizar comentarios por si acaso
            }
             else {
                 console.log('📊 Actualización de DataStore sin re-renderizado de UI principal.');
             }
        });
    }

    /**
     * Re-renderiza la vista actual completamente.
     */
    fullRender() {
        console.log('🎨 Ejecutando fullRender...');
        this.isRendering = true; // Marcar inicio

        try {
            if (this.currentView === 'cards') {
                // Asegurar que cardViewMode sea válido, default a 'grid'
                this.cardViewMode = (this.cardViewMode === 'list') ? 'list' : 'grid';
                this.listCurrentPage = 1; // Resetear paginación en full render
                this.versionesVisibles = 5; // Resetear carga grid
                this.renderCardsView(); // Llama al router
            } else if (this.currentView === 'detail' && this.currentVersionId) {
                 console.log(`🎨 FullRender en vista detalle (ID: ${this.currentVersionId})`);
                 // Re-renderizar la vista de detalle completa
                 this.renderDetailView(this.currentVersionId);
            } else {
                 console.warn("FullRender llamado en estado inesperado:", this.currentView, this.currentVersionId);
                 this.showCardsView(); // Volver a tarjetas como fallback seguro
            }
            this.updateStats(); // Actualizar stats después de renderizar
        } catch (error) {
             console.error("❌ Error durante fullRender:", error);
             // Intentar mostrar un estado seguro
             try { this.showCardsView(); } catch (e) { console.error("Error al intentar volver a vista de tarjetas:", e); }
        } finally {
             // Usar requestAnimationFrame para desmarcar después de que el navegador haya renderizado
             requestAnimationFrame(() => {
                  this.isRendering = false;
                  console.log('🎨 fullRender completado.');
             });
        }
    }

} // Fin de la clase Renderer