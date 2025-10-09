// eventHandlers.js - Con debugging completo

import { ExcelExporter } from './excelExporter.js';
import { ExcelImporter } from './excelImporter.js';
import { Modal } from './modal.js';
import { Validator } from './validator.js';
import { DOMBuilder } from './domBuilder.js';

export class EventHandlers {
    constructor(dataStore, renderer) {
        this.dataStore = dataStore;
        this.renderer = renderer;
        this.saveButton = null;
         ('🎯 EventHandlers constructor iniciado');
    }

    setupEventListeners() {
        this.setupThemeToggle();
        this.setupSearchToggle();
        this.setupNavigationButtons();
        this.setupVersionButtons();
        this.setupVersionMetaInputs();
        this.setupCargarButton();
        this.setupDescargarButton();
        this.setupTablaEvents();
        this.setupFilterEvents();
        this.setupSaveChangesButton();
        
         ('✅ Event listeners configurados correctamente');
    }

    setupSaveChangesButton() {
        this.saveButton = document.createElement('button');
        this.saveButton.id = 'btn-save-changes';
        this.saveButton.className = 'btn-save-changes hidden';
        this.saveButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Guardar Cambios</span>
            <span class="changes-count">0</span>
        `;
        document.body.appendChild(this.saveButton);

        this.dataStore.subscribeToChanges((changes) => {
            const count = changes.length;
             ('🔔 Notificación de cambios:', count);
            if (count > 0) {
                this.saveButton.classList.remove('hidden');
                this.saveButton.querySelector('.changes-count').textContent = count;
            } else {
                this.saveButton.classList.add('hidden');
            }
        });

        this.saveButton.addEventListener('click', async () => {
             ('🖱️ Click en botón Guardar Cambios');
            await this.handleSaveChanges();
        });

         ('✅ Botón de guardar cambios configurado');
    }

    async handleSaveChanges() {
         ('💾 === INICIO handleSaveChanges ===');
        
        const pendingChanges = this.dataStore.getPendingChanges();
         ('📦 Cambios pendientes obtenidos:', JSON.stringify(pendingChanges, null, 2));
        
        if (pendingChanges.length === 0) {
             ('⚠️ No hay cambios pendientes');
            await Modal.warning('No hay cambios pendientes para guardar.', 'Sin Cambios');
            return;
        }

        const changesInfo = [...pendingChanges];
         ('📊 changesInfo preparado:', changesInfo);

        const confirmed = await Modal.showChangesSummary(changesInfo);
         ('🤔 Usuario confirmó?', confirmed);

        if (confirmed) {
             ('✅ Aplicando cambios...');
            const appliedChanges = this.dataStore.applyPendingChanges();
             ('✅ Cambios aplicados:', appliedChanges);
            
            await Modal.success(
                `Se guardaron ${appliedChanges.length} cambio${appliedChanges.length !== 1 ? 's' : ''} exitosamente.`,
                'Cambios Guardados'
            );

            this.renderer.fullRender();
        } else {
             ('❌ Cambios cancelados');
            this.dataStore.discardPendingChanges();
            this.renderer.fullRender();
        }
        
         ('💾 === FIN handleSaveChanges ===');
    }

    setupNavigationButtons() {
        const btnBack = document.getElementById('btn-back-to-cards');
        btnBack.addEventListener('click', () => {
            this.renderer.showCardsView();
        });
        
        const btnEditComments = document.getElementById('btn-edit-version-comments');
        btnEditComments.addEventListener('click', async () => {
            if (!this.renderer.currentVersionId) return;
            
            const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
            if (!version) return;
            
            const nuevosComentarios = await Modal.showComentariosVersion(
                version.numero,
                version.comentarios
            );
            
            if (nuevosComentarios !== null) {
                this.dataStore.updateVersion(this.renderer.currentVersionId, 'comentarios', nuevosComentarios);
                this.renderer.fullRender();
            }
        });
        
         ('✅ Botones de navegación configurados');
    }

    setupVersionMetaInputs() {
        const dateInput = document.getElementById('detail-version-date');
        dateInput.addEventListener('change', (e) => {
            if (!this.renderer.currentVersionId) return;
            this.dataStore.updateVersion(this.renderer.currentVersionId, 'fechaDespliegue', e.target.value);
        });

        const timeInput = document.getElementById('detail-version-time');
        timeInput.addEventListener('change', (e) => {
            if (!this.renderer.currentVersionId) return;
            this.dataStore.updateVersion(this.renderer.currentVersionId, 'horaDespliegue', e.target.value);
        });

         ('✅ Inputs de fecha/hora de versión configurados');
    }

    setupVersionButtons() {
        const btnAgregar = document.getElementById('btn-agregar');
        btnAgregar.addEventListener('click', () => {
            if (!this.renderer.currentVersionId) return;
            
            const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
            if (!version) return;
            
            const nuevoCdu = this.dataStore.addCduToVersion(this.renderer.currentVersionId);
            this.renderer.fullRender();
        });
        
        const btnNuevaVersionLimpia = document.getElementById('btn-nueva-version-limpia');
        btnNuevaVersionLimpia.addEventListener('click', async () => {
            const version = this.dataStore.addNewEmptyVersion();
            await Modal.success(
                `Versión ${version.numero} creada exitosamente.`,
                'Versión Creada'
            );
            this.renderer.fullRender();
        });
        
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
        
         ('✅ Botones de versión configurados');
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
        
         ('✅ Toggle de búsqueda configurado');
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

                const uuidsUnicos = new Set();
                versiones.forEach(v => {
                    v.cdus.forEach(cdu => {
                        if (cdu.uuid) {
                            uuidsUnicos.add(cdu.uuid);
                        }
                    });
                });

                const totalCdusUnicos = uuidsUnicos.size;
                let totalRegistros = 0;
                versiones.forEach(v => totalRegistros += v.cdus.length);

                const confirmacion = await Modal.show({
                    title: 'Confirmar Importación',
                    message: `Se encontraron:\n• ${versiones.length} versiones\n• ${totalCdusUnicos} CDUs únicos\n• ${totalRegistros} registros totales\n\n¿Desea reemplazar los datos actuales?`,
                    type: 'warning',
                    confirmText: 'Sí, reemplazar',
                    cancelText: 'Cancelar'
                });

                if (confirmacion) {
                    this.dataStore.replaceAll(versiones);
                    this.renderer.showCardsView();
                    await Modal.success(`Importación exitosa:\n• ${totalCdusUnicos} CDUs únicos\n• ${totalRegistros} registros totales`, 'Importación Exitosa');
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
         ('🎯 Configurando eventos de tabla...');
        const tbody = document.getElementById('tabla-body');
        
        const autoResizeTextarea = (textarea) => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
        
        tbody.addEventListener('input', (e) => {
            if (e.target.tagName === 'TEXTAREA') {
                autoResizeTextarea(e.target);
            }
        });

        tbody.addEventListener('blur', (e) => {
            const campo = e.target.dataset.campo;
            if (!campo) return;

            const valor = e.target.value;
            
            if (campo === 'observacion') {
                const cduId = parseInt(e.target.dataset.cduId);
                const obsIndex = parseInt(e.target.dataset.obsIndex);
                this.dataStore.updateObservacion(cduId, obsIndex, valor);
            } 
            else if (campo === 'responsable-nombre') {
                const cduId = parseInt(e.target.dataset.cduId);
                const respIndex = parseInt(e.target.dataset.respIndex);
                this.dataStore.updateResponsable(cduId, respIndex, 'nombre', valor);
            }
            else if (e.target.dataset.cduId && (campo === 'nombreCDU' || campo === 'descripcionCDU')) {
                const cduId = parseInt(e.target.dataset.cduId);
                this.dataStore.updateCdu(cduId, campo, valor);
            }
        }, true);
        
        // EVENTO CHANGE - EL MÁS IMPORTANTE
        tbody.addEventListener('change', (e) => {
             ('🔔 === EVENTO CHANGE DISPARADO ===');
             ('Target:', e.target);
             ('Target classes:', e.target.className);
             ('isRendering?', this.renderer.isRendering);
            
            if (this.renderer.isRendering) {
                 ('⚠️ Ignorando evento change durante render');
                return;
            }
            
            if (e.target.classList.contains('campo-estado')) {
                 ('✅ Es un campo-estado');
                
                const cduId = parseInt(e.target.dataset.cduId);
                const valorNuevo = e.target.value;
                
                 ('📊 cduId:', cduId, 'valorNuevo:', valorNuevo);
                
                let valorAnterior = null;
                let cduNombre = '';
                let versionNumero = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        valorAnterior = cdu.estado;
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                         ('🔍 CDU encontrado:', { valorAnterior, cduNombre, versionNumero });
                        break;
                    }
                }
                
                if (valorAnterior !== valorNuevo) {

                    
                    this.dataStore.addPendingChange({
                        cduId,
                        campo: 'estado',
                        valorAnterior,
                        valorNuevo,
                        cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString()
                    });
                    
                    const container = e.target.closest('.estado-select-container');
                    if (container) {
                        container.classList.remove('estado-desarrollo', 'estado-pendiente', 'estado-certificado', 'estado-produccion');
                        container.classList.add(DOMBuilder.getEstadoClass(valorNuevo));
                        
                        const display = container.querySelector('.estado-display');
                        display.innerHTML = `
                            ${DOMBuilder.getEstadoIcon(valorNuevo)}
                            <span>${valorNuevo}</span>
                        `;
                    }
                } else {

                }
            }
            else if (e.target.dataset.campo === 'responsable-rol') {
                const cduId = parseInt(e.target.dataset.cduId);
                const respIndex = parseInt(e.target.dataset.respIndex);
                const valor = e.target.value;
                
                const container = e.target.closest('.rol-select-container');
                if (container) {
                    const display = container.querySelector('.rol-display');
                    display.innerHTML = `${DOMBuilder.getRolIcon(valor)}<span>${valor}</span>`;
                }
                
                this.dataStore.updateResponsable(cduId, respIndex, 'rol', valor);
            }
            

        });

        tbody.addEventListener('click', async (e) => {
            const estadoDisplay = e.target.closest('.estado-display');
            if (estadoDisplay) {
                const container = estadoDisplay.closest('.estado-select-container');
                if (container) {
                    const select = container.querySelector('.campo-estado');
                    if (select) {
                        select.style.pointerEvents = 'auto';
                        select.focus();
                        select.click();
                        setTimeout(() => {
                            select.style.pointerEvents = 'none';
                        }, 100);
                    }
                }
                return;
            }

            const rolDisplay = e.target.closest('.rol-display');
            if (rolDisplay) {
                const container = rolDisplay.closest('.rol-select-container');
                if (container) {
                    const select = container.querySelector('.responsable-rol-select');
                    if (select) {
                        select.style.pointerEvents = 'auto';
                        select.focus();
                        select.click();
                        setTimeout(() => {
                            select.style.pointerEvents = 'none';
                        }, 100);
                    }
                }
                return;
            }
            
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
            
            const btnAddResp = e.target.closest('[data-action="add-responsable"]');
            if (btnAddResp) {
                const cduId = parseInt(btnAddResp.dataset.cduId);
                this.dataStore.addResponsable(cduId, '', 'DEV');
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


    }
}