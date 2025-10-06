// eventHandlers.js - Manejo de eventos con versiones agrupadas

import { ExcelExporter } from './excelExporter.js';
import { ExcelImporter } from './excelImporter.js';
import { Modal } from './modal.js';
import { Validator } from './validator.js';

export class EventHandlers {
    constructor(dataStore, renderer) {
        this.dataStore = dataStore;
        this.renderer = renderer;
    }

    setupEventListeners() {
        this.setupThemeToggle();
        this.setupSearchToggle();
        this.setupAgregarButton();
        this.setupNuevaVersionLimpiaButton();
        this.setupDuplicarVersionButton();
        this.setupCargarButton();
        this.setupDescargarButton();
        this.setupTablaEvents();
        this.setupFilterEvents();
        
        console.log('✅ Event listeners configurados correctamente');
    }

    setupSearchToggle() {
        const btnToggle = document.getElementById('btn-toggle-search');
        const filtersSection = document.querySelector('.filters-section');
        
        btnToggle.addEventListener('click', () => {
            const isCollapsed = filtersSection.classList.contains('filters-collapsed');
            
            if (isCollapsed) {
                // Expandir
                filtersSection.classList.remove('filters-collapsed');
                btnToggle.classList.add('active');
            } else {
                // Colapsar
                filtersSection.classList.add('filters-collapsed');
                btnToggle.classList.remove('active');
            }
        });
        
        console.log('✅ Toggle de búsqueda configurado');
    }

    setupThemeToggle() {
        const btnTheme = document.getElementById('btn-theme-toggle');
        const sunIcon = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
        const moonIcon = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`;

        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        btnTheme.innerHTML = savedTheme === 'dark' ? sunIcon : moonIcon;

        btnTheme.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            btnTheme.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
        });
    }

    setupAgregarButton() {
        const btn = document.getElementById('btn-agregar');
        if (!btn) {
            console.error('❌ No se encontró el botón btn-agregar');
            return;
        }
        
        btn.addEventListener('click', () => {
            console.log('🔘 Click en Nuevo CDU');
            this.dataStore.addCduToLatestVersion();
            this.renderer.fullRender();
        });
        
        console.log('✅ Botón "Nuevo CDU" configurado');
    }

    setupNuevaVersionLimpiaButton() {
        const btn = document.getElementById('btn-nueva-version-limpia');
        if (!btn) {
            console.error('❌ No se encontró el botón btn-nueva-version-limpia');
            return;
        }
        
        btn.addEventListener('click', async () => {
            console.log('🔘 Click en Nueva Versión Limpia');
            const version = this.dataStore.addNewEmptyVersion();
            await Modal.success(
                `Versión ${version.numero} creada. Ahora puedes agregar CDUs con el botón "Nuevo CDU".`,
                'Versión Creada'
            );
            this.renderer.fullRender();
        });
        
        console.log('✅ Botón "Nueva Versión Limpia" configurado');
    }

    setupDuplicarVersionButton() {
        const btn = document.getElementById('btn-duplicar-version');
        if (!btn) {
            console.error('❌ No se encontró el botón btn-duplicar-version');
            return;
        }
        
        btn.addEventListener('click', async () => {
            console.log('🔘 Click en Duplicar Última Versión');
            const versiones = this.dataStore.getAll();
            
            if (versiones.length === 0) {
                await Modal.warning(
                    'No hay versiones para duplicar. Crea una nueva versión primero.',
                    'Sin Versiones'
                );
                return;
            }
            
            // Duplicar la última versión
            const ultimaVersion = versiones[versiones.length - 1];
            const nuevaVersion = this.dataStore.duplicateVersion(ultimaVersion.id);
            
            await Modal.success(
                `Versión ${nuevaVersion.numero} creada como copia de la versión ${ultimaVersion.numero} con ${nuevaVersion.cdus.length} CDUs.`,
                'Versión Duplicada'
            );
            this.renderer.fullRender();
        });
        
        console.log('✅ Botón "Duplicar Última Versión" configurado');
    }

    setupCargarButton() {
        const btnCargar = document.getElementById('btn-cargar');
        const fileInput = document.getElementById('file-input');

        btnCargar.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const versiones = await ExcelImporter.importar(file);
                
                if (versiones.length === 0) {
                    await Modal.error('No se encontraron datos válidos en el archivo', 'Error de Importación');
                    return;
                }

                let totalCdus = 0;
                versiones.forEach(v => totalCdus += v.cdus.length);

                const confirmacion = await Modal.confirm(
                    `Se encontraron ${versiones.length} versiones con ${totalCdus} CDUs.\n¿Desea reemplazar los datos actuales?`,
                    'Confirmar Importación'
                );

                if (confirmacion) {
                    this.dataStore.replaceAll(versiones);
                    this.renderer.fullRender();
                    await Modal.success('Datos cargados exitosamente', 'Importación Exitosa');
                }
            } catch (error) {
                await Modal.error('Error al cargar el archivo: ' + error.message, 'Error');
                console.error(error);
            } finally {
                fileInput.value = '';
            }
        });
    }

    setupDescargarButton() {
        document.getElementById('btn-descargar').addEventListener('click', async () => {
            // Validar antes de descargar
            const versiones = this.dataStore.getAll();
            const validation = Validator.validateAllVersions(versiones);
            
            if (!validation.isValid) {
                const report = Validator.generateValidationReport(validation);
                const confirmacion = await Modal.confirm(
                    `${report}\n¿Desea descargar de todos modos?`,
                    'Advertencia de Validación'
                );
                
                if (!confirmacion) {
                    return;
                }
            }
            
            ExcelExporter.exportar(versiones);
        });
    }

    setupTablaEvents() {
        const tbody = document.getElementById('tabla-body');
        
        // Evento para actualizar datos cuando se editan campos
        tbody.addEventListener('input', (e) => {
            const campo = e.target.dataset.campo;
            if (!campo) return;
            
            const valor = e.target.value;
            
            // Verificar si es un campo de versión, CDU u observación
            if (e.target.dataset.versionId) {
                const versionId = parseInt(e.target.dataset.versionId);
                this.dataStore.updateVersion(versionId, campo, valor);
            } else if (campo === 'observacion') {
                const cduId = parseInt(e.target.dataset.cduId);
                const obsIndex = parseInt(e.target.dataset.obsIndex);
                this.dataStore.updateObservacion(cduId, obsIndex, valor);
            } else if (e.target.dataset.cduId) {
                const cduId = parseInt(e.target.dataset.cduId);
                this.dataStore.updateCdu(cduId, campo, valor);
            }
        });

        // Evento para eliminar versiones o CDUs, y gestionar observaciones
        tbody.addEventListener('click', async (e) => {
            // Eliminar CDU o versión
            const btnEliminar = e.target.closest('.btn-eliminar');
            if (btnEliminar) {
                const versionId = btnEliminar.dataset.versionId;
                const cduId = btnEliminar.dataset.cduId;
                
                if (versionId) {
                    // Eliminar versión completa
                    const confirmacion = await Modal.confirm(
                        '¿Está seguro de eliminar esta versión completa con todos sus CDUs?',
                        'Confirmar Eliminación'
                    );
                    if (confirmacion) {
                        this.dataStore.deleteVersion(parseInt(versionId));
                        this.renderer.fullRender();
                    }
                } else if (cduId) {
                    // Eliminar solo el CDU
                    const confirmacion = await Modal.confirm(
                        '¿Está seguro de eliminar este CDU?',
                        'Confirmar Eliminación'
                    );
                    if (confirmacion) {
                        this.dataStore.deleteCdu(parseInt(cduId));
                        this.renderer.fullRender();
                    }
                }
                return;
            }
            
            // Agregar observación
            const btnAdd = e.target.closest('[data-action="add-observacion"]');
            if (btnAdd) {
                const cduId = parseInt(btnAdd.dataset.cduId);
                this.dataStore.addObservacion(cduId, '');
                this.renderer.fullRender();
                
                // Enfocar el nuevo campo
                setTimeout(() => {
                    const container = document.querySelector(`[data-cdu-id="${cduId}"].observaciones-container`);
                    if (container) {
                        const inputs = container.querySelectorAll('input[data-campo="observacion"]');
                        const lastInput = inputs[inputs.length - 1];
                        if (lastInput) lastInput.focus();
                    }
                }, 100);
                return;
            }
            
            // Eliminar observación
            const btnRemove = e.target.closest('[data-action="remove-observacion"]');
            if (btnRemove) {
                const cduId = parseInt(btnRemove.dataset.cduId);
                const obsIndex = parseInt(btnRemove.dataset.obsIndex);
                
                const confirmacion = await Modal.confirm(
                    '¿Eliminar esta observación?',
                    'Confirmar'
                );
                if (confirmacion) {
                    this.dataStore.deleteObservacion(cduId, obsIndex);
                    this.renderer.fullRender();
                }
                return;
            }
        });
    }

    setupFilterEvents() {
        // Búsqueda general
        const filterSearch = document.getElementById('filter-search');
        filterSearch.addEventListener('input', (e) => {
            this.renderer.setFilters({ search: e.target.value });
        });

        // Filtro de estado
        const filterEstado = document.getElementById('filter-estado');
        filterEstado.addEventListener('change', (e) => {
            this.renderer.setFilters({ estado: e.target.value });
        });

        // Filtro de responsable
        const filterResponsable = document.getElementById('filter-responsable');
        filterResponsable.addEventListener('input', (e) => {
            this.renderer.setFilters({ responsable: e.target.value });
        });

        // Filtro de fecha desde
        const filterFechaDesde = document.getElementById('filter-fecha-desde');
        filterFechaDesde.addEventListener('change', (e) => {
            this.renderer.setFilters({ fechaDesde: e.target.value });
        });

        // Filtro de fecha hasta
        const filterFechaHasta = document.getElementById('filter-fecha-hasta');
        filterFechaHasta.addEventListener('change', (e) => {
            this.renderer.setFilters({ fechaHasta: e.target.value });
        });

        // Botón de limpiar filtros
        const btnClearFilters = document.getElementById('btn-clear-filters');
        btnClearFilters.addEventListener('click', () => {
            this.renderer.clearFilters();
        });

        console.log('✅ Event listeners de filtros configurados');
    }
}