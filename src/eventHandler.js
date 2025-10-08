// eventHandlers.js - Manejo de eventos con navegación entre vistas y responsables con roles

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
        this.setupNavigationButtons();
        this.setupVersionButtons();
        this.setupCargarButton();
        this.setupDescargarButton();
        this.setupTablaEvents();
        this.setupFilterEvents();
        
        console.log('✅ Event listeners configurados correctamente');
    }

    setupNavigationButtons() {
        // Botón volver a tarjetas
        const btnBack = document.getElementById('btn-back-to-cards');
        btnBack.addEventListener('click', () => {
            this.renderer.showCardsView();
        });
        
        // Botón editar comentarios de versión
        const btnEditComments = document.getElementById('btn-edit-version-comments');
        btnEditComments.addEventListener('click', async () => {
            if (!this.renderer.currentVersionId) return;
            
            const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
            if (!version) return;
            
            const nuevoComentario = await Modal.showComentariosVersion(
                version.numero,
                version.comentarios || ''
            );
            
            if (nuevoComentario !== null) {
                this.dataStore.updateVersion(this.renderer.currentVersionId, 'comentarios', nuevoComentario);
                this.renderer.fullRender();
            }
        });
        
        console.log('✅ Botones de navegación configurados');
    }

    setupVersionButtons() {
        // Botón agregar CDU
        const btnAgregar = document.getElementById('btn-agregar');
        btnAgregar.addEventListener('click', () => {
            if (!this.renderer.currentVersionId) return;
            
            // Encontrar la versión actual
            const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
            if (!version) return;
            
            // Agregar CDU directamente a esta versión
            const nuevoCdu = this.dataStore.addCduToVersion(this.renderer.currentVersionId);
            this.renderer.fullRender();
        });
        
        // Botón nueva versión limpia
        const btnNuevaVersionLimpia = document.getElementById('btn-nueva-version-limpia');
        btnNuevaVersionLimpia.addEventListener('click', async () => {
            const version = this.dataStore.addNewEmptyVersion();
            await Modal.success(
                `Versión ${version.numero} creada exitosamente.`,
                'Versión Creada'
            );
            this.renderer.fullRender();
        });
        
        // Botón duplicar versión
        const btnDuplicarVersion = document.getElementById('btn-duplicar-version');
        btnDuplicarVersion.addEventListener('click', async () => {
            const versiones = this.dataStore.getAll();
            
            if (versiones.length === 0) {
                await Modal.warning(
                    'No hay versiones para duplicar.',
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
        
        console.log('✅ Botones de versión configurados');
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
                    this.renderer.showCardsView(); // Volver a vista de tarjetas
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
            
            // Manejar actualización de observaciones
            if (campo === 'observacion') {
                const cduId = parseInt(e.target.dataset.cduId);
                const obsIndex = parseInt(e.target.dataset.obsIndex);
                this.dataStore.updateObservacion(cduId, obsIndex, valor);
            } 
            // NUEVO: Manejar actualización de nombre de responsable
            else if (campo === 'responsable-nombre') {
                const cduId = parseInt(e.target.dataset.cduId);
                const respIndex = parseInt(e.target.dataset.respIndex);
                this.dataStore.updateResponsable(cduId, respIndex, 'nombre', valor);
            }
            // Otros campos
            else if (e.target.dataset.cduId) {
                const cduId = parseInt(e.target.dataset.cduId);
                this.dataStore.updateCdu(cduId, campo, valor);
            }
        });
        
        // Evento para cambio de estado y roles
        tbody.addEventListener('change', (e) => {
            if (e.target.classList.contains('campo-estado')) {
                const cduId = parseInt(e.target.dataset.cduId);
                const valor = e.target.value;
                
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
            // NUEVO: Manejar cambio de rol de responsable
            else if (e.target.dataset.campo === 'responsable-rol') {
                const cduId = parseInt(e.target.dataset.cduId);
                const respIndex = parseInt(e.target.dataset.respIndex);
                const valor = e.target.value;
                this.dataStore.updateResponsable(cduId, respIndex, 'rol', valor);
            }
        });
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const textareas = node.querySelectorAll ? node.querySelectorAll('.campo-descripcion') : [];
                        textareas.forEach(autoResizeTextarea);
                    }
                });
            });
        });
        
        observer.observe(tbody, { childList: true, subtree: true });

        // Evento para acciones
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
            
            // Eliminar CDU
            const btnEliminar = e.target.closest('.btn-eliminar');
            if (btnEliminar) {
                const cduId = btnEliminar.dataset.cduId;
                
                const confirmacion = await Modal.confirm(
                    '¿Está seguro de eliminar este CDU?',
                    'Confirmar Eliminación'
                );
                if (confirmacion) {
                    this.dataStore.deleteCdu(parseInt(cduId));
                    this.renderer.fullRender();
                }
                return;
            }
            
            // NUEVO: Agregar responsable
            const btnAddResp = e.target.closest('[data-action="add-responsable"]');
            if (btnAddResp) {
                const cduId = parseInt(btnAddResp.dataset.cduId);
                this.dataStore.addResponsable(cduId, '', 'Dev');
                this.renderer.fullRender();
                
                setTimeout(() => {
                    const container = document.querySelector(`[data-cdu-id="${cduId}"].responsables-container`);
                    if (container) {
                        const inputs = container.querySelectorAll('input[data-campo="responsable-nombre"]');
                        const lastInput = inputs[inputs.length - 1];
                        if (lastInput) lastInput.focus();
                    }
                }, 100);
                return;
            }
            
            // NUEVO: Eliminar responsable
            const btnRemoveResp = e.target.closest('[data-action="remove-responsable"]');
            if (btnRemoveResp) {
                const cduId = parseInt(btnRemoveResp.dataset.cduId);
                const respIndex = parseInt(btnRemoveResp.dataset.respIndex);
                
                const confirmacion = await Modal.confirm(
                    '¿Eliminar este responsable?',
                    'Confirmar'
                );
                if (confirmacion) {
                    this.dataStore.deleteResponsable(cduId, respIndex);
                    this.renderer.fullRender();
                }
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