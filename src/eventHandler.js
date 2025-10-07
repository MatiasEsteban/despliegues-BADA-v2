// eventHandlers.js - Manejo de eventos con historial y comentarios

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
                filtersSection.classList.remove('filters-collapsed');
                btnToggle.classList.add('active');
            } else {
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

                const confirmacion = await Modal.show({
                    title: 'Confirmar Importación',
                    message: `Se encontraron ${versiones.length} versiones con ${totalCdus} CDUs.\n¿Desea reemplazar los datos actuales?`,
                    type: 'warning',
                    confirmText: 'Sí, reemplazar',
                    cancelText: 'Cancelar'
                });

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
        
        const autoResizeTextarea = (textarea) => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
        
        // Evento para actualizar datos
        tbody.addEventListener('input', (e) => {
            const campo = e.target.dataset.campo;
            if (!campo) return;
            
            if (campo === 'descripcionCDU' && e.target.tagName === 'TEXTAREA') {
                autoResizeTextarea(e.target);
            }
            
            const valor = e.target.value;
            
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
        
        // Evento especial para cambio de estado (con historial)
        tbody.addEventListener('change', (e) => {
            if (e.target.classList.contains('campo-estado')) {
                const cduId = parseInt(e.target.dataset.cduId);
                const valor = e.target.value;
                
                // Actualizar el display del estado con icono
                const container = e.target.closest('.estado-select-container');
                if (container) {
                    const display = container.querySelector('.estado-display');
                    const DOMBuilder = window.DOMBuilder || this.renderer.constructor;
                    display.innerHTML = `
                        ${DOMBuilder.getEstadoIcon(valor)}
                        <span>${valor}</span>
                    `;
                }
                
                this.dataStore.updateCdu(cduId, 'estado', valor);
            }
        });
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const textareas = node.querySelectorAll 
                            ? node.querySelectorAll('.campo-descripcion')
                            : [];
                        textareas.forEach(autoResizeTextarea);
                        
                        if (node.classList && node.classList.contains('campo-descripcion')) {
                            autoResizeTextarea(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(tbody, { childList: true, subtree: true });
        
        setTimeout(() => {
            tbody.querySelectorAll('.campo-descripcion').forEach(autoResizeTextarea);
        }, 100);

        // Evento para acciones (eliminar, historial, comentarios, etc.)
        tbody.addEventListener('click', async (e) => {
            // Mostrar historial
            const btnHistorial = e.target.closest('[data-action="show-historial"]');
            if (btnHistorial) {
                const cduId = parseInt(btnHistorial.dataset.cduId);
                const versiones = this.dataStore.getAll();
                let cdu = null;
                
                for (const version of versiones) {
                    cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) break;
                }
                
                if (cdu) {
                    await Modal.showHistorial(cdu.nombreCDU, cdu.historial || []);
                }
                return;
            }
            
            // Mostrar/editar comentarios de versión
            const btnComentarios = e.target.closest('[data-action="toggle-comments"]');
            if (btnComentarios) {
                const versionId = parseInt(btnComentarios.dataset.versionId);
                const versiones = this.dataStore.getAll();
                const version = versiones.find(v => v.id === versionId);
                
                if (version) {
                    const nuevoComentario = await Modal.showComentariosVersion(
                        version.numero,
                        version.comentarios || ''
                    );
                    
                    if (nuevoComentario !== null) {
                        this.dataStore.updateVersion(versionId, 'comentarios', nuevoComentario);
                        this.renderer.fullRender();
                    }
                }
                return;
            }
            
            // Eliminar CDU o versión
            const btnEliminar = e.target.closest('.btn-eliminar');
            if (btnEliminar) {
                const versionId = btnEliminar.dataset.versionId;
                const cduId = btnEliminar.dataset.cduId;
                
                if (versionId) {
                    const confirmacion = await Modal.confirm(
                        '¿Está seguro de eliminar esta versión completa con todos sus CDUs?',
                        'Confirmar Eliminación'
                    );
                    if (confirmacion) {
                        this.dataStore.deleteVersion(parseInt(versionId));
                        this.renderer.fullRender();
                    }
                } else if (cduId) {
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
            
            // Expandir/colapsar CDUs
            const btnExpandCdus = e.target.closest('[data-action="expand-cdus"], [data-action="collapse-cdus"]');
            if (btnExpandCdus) {
                const versionId = parseInt(btnExpandCdus.dataset.versionId);
                this.renderer.toggleVersionCdus(versionId);
                return;
            }
            
            // Agregar observación
            const btnAdd = e.target.closest('[data-action="add-observacion"]');
            if (btnAdd) {
                const cduId = parseInt(btnAdd.dataset.cduId);
                this.dataStore.addObservacion(cduId, '');
                this.renderer.fullRender();
                
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
        const filterSearch = document.getElementById('filter-search');
        filterSearch.addEventListener('input', (e) => {
            this.renderer.setFilters({ search: e.target.value });
        });

        const filterEstado = document.getElementById('filter-estado');
        filterEstado.addEventListener('change', (e) => {
            this.renderer.setFilters({ estado: e.target.value });
        });

        const filterResponsable = document.getElementById('filter-responsable');
        filterResponsable.addEventListener('input', (e) => {
            this.renderer.setFilters({ responsable: e.target.value });
        });

        const filterFechaDesde = document.getElementById('filter-fecha-desde');
        filterFechaDesde.addEventListener('change', (e) => {
            this.renderer.setFilters({ fechaDesde: e.target.value });
        });

        const filterFechaHasta = document.getElementById('filter-fecha-hasta');
        filterFechaHasta.addEventListener('change', (e) => {
            this.renderer.setFilters({ fechaHasta: e.target.value });
        });

        const btnClearFilters = document.getElementById('btn-clear-filters');
        btnClearFilters.addEventListener('click', () => {
            this.renderer.clearFilters();
        });

        console.log('✅ Event listeners de filtros configurados');
    }
}