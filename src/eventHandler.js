// eventHandlers.js - Con captura completa incluyendo comentarios de versión

import { ExcelExporter } from './excelExporter.js';
import { ExcelImporter } from './excelImporter.js';
import { Modal } from './modal.js';
import { Validator } from './validator.js';
import { Debouncer } from './debouncer.js';
import { NotificationSystem } from './notifications.js';
import { DOMBuilder } from './domBuilder.js';

export class EventHandlers {
    constructor(dataStore, renderer) {
        this.dataStore = dataStore;
        this.renderer = renderer;
        this.saveButton = null;
        console.log('🎯 EventHandlers constructor iniciado');
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
        this.setupDetailFilterEvents();
        this.setupSaveChangesButton();
        
        console.log('✅ Event listeners configurados correctamente');
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
            console.log('🔔 Notificación de cambios:', count);
            if (count > 0) {
                this.saveButton.classList.remove('hidden');
                this.saveButton.querySelector('.changes-count').textContent = count;
            } else {
                this.saveButton.classList.add('hidden');
            }
        });

        this.saveButton.addEventListener('click', async () => {
            console.log('🖱️ Click en botón Guardar Cambios');
            await this.handleSaveChanges();
        });

        console.log('✅ Botón de guardar cambios configurado');
    }

   async handleSaveChanges() {
    console.log('💾 === INICIO handleSaveChanges ===');
    
    const pendingChanges = this.dataStore.getPendingChanges();
    console.log('📦 Cambios pendientes:', pendingChanges.length);
    
    if (pendingChanges.length === 0) {
        console.log('⚠️ No hay cambios pendientes');
        NotificationSystem.warning('No hay cambios pendientes para guardar.');
        return;
    }

    const changesInfo = pendingChanges.map(change => {
        return {
            ...change,
            versionNumero: change.versionNumero || 'N/A',
            cduNombre: change.cduNombre || 'Sin nombre'
        };
    });
    
    console.log('📊 changesInfo preparado:', changesInfo);

    try {
        const confirmed = await Modal.showChangesSummary(changesInfo);
        console.log('🤔 Usuario confirmó?', confirmed);

        if (confirmed) {
            console.log('✅ Aplicando cambios...');
            const appliedChanges = this.dataStore.applyPendingChanges();
            console.log('✅ Cambios aplicados:', appliedChanges.length);
            
            NotificationSystem.success(
                `Se guardaron ${appliedChanges.length} cambio${appliedChanges.length !== 1 ? 's' : ''} exitosamente.`,
                3000
            );

            this.renderer.fullRender();
        } else {
            console.log('❌ Cambios cancelados, revirtiendo...');
            this.dataStore.discardPendingChanges();
            NotificationSystem.info('Cambios cancelados.', 2000);
            this.renderer.fullRender();
        }
    } catch (error) {
        console.error('❌ Error en handleSaveChanges:', error);
        NotificationSystem.error('Ocurrió un error al guardar los cambios: ' + error.message);
    }
    
    console.log('💾 === FIN handleSaveChanges ===');
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
            
            // Guardar estado anterior
            const comentariosAnteriores = JSON.parse(JSON.stringify(version.comentarios));
            
            const nuevosComentarios = await Modal.showComentariosVersion(
                version.numero,
                version.comentarios
            );
            
            if (nuevosComentarios !== null) {
                // Comparar y registrar cambios
                this.registrarCambiosComentarios(version.id, comentariosAnteriores, nuevosComentarios, version.numero);
                
                this.dataStore.updateVersion(this.renderer.currentVersionId, 'comentarios', nuevosComentarios);
                this.renderer.fullRender();
            }
        });
        
        console.log('✅ Botones de navegación configurados');
    }

    // NUEVO: Método para registrar cambios en comentarios de versión
    registrarCambiosComentarios(versionId, anteriores, nuevos, versionNumero) {
        const categorias = ['mejoras', 'salidas', 'cambiosCaliente', 'observaciones'];
        
        categorias.forEach(categoria => {
            const itemsAnteriores = anteriores[categoria] || [];
            const itemsNuevos = nuevos[categoria] || [];
            
            // Detectar agregados
            if (itemsNuevos.length > itemsAnteriores.length) {
                for (let i = itemsAnteriores.length; i < itemsNuevos.length; i++) {
                    this.dataStore.addPendingChange({
                        versionId,
                        campo: `${categoria}-agregado`,
                        index: i,
                        valorAnterior: null,
                        valorNuevo: itemsNuevos[i],
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'comentario-version'
                    });
                }
            }
            
            // Detectar eliminados
            if (itemsNuevos.length < itemsAnteriores.length) {
                for (let i = itemsNuevos.length; i < itemsAnteriores.length; i++) {
                    this.dataStore.addPendingChange({
                        versionId,
                        campo: `${categoria}-eliminado`,
                        index: i,
                        valorAnterior: itemsAnteriores[i],
                        valorNuevo: null,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'comentario-version'
                    });
                }
            }
            
            // Detectar modificados
            const minLength = Math.min(itemsAnteriores.length, itemsNuevos.length);
            for (let i = 0; i < minLength; i++) {
                if (itemsAnteriores[i] !== itemsNuevos[i]) {
                    this.dataStore.addPendingChange({
                        versionId,
                        campo: `${categoria}-modificado`,
                        index: i,
                        valorAnterior: itemsAnteriores[i],
                        valorNuevo: itemsNuevos[i],
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'comentario-version'
                    });
                }
            }
        });
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

        console.log('✅ Inputs de fecha/hora de versión configurados');
    }

  setupVersionButtons() {
    const btnAgregar = document.getElementById('btn-agregar');
    btnAgregar.addEventListener('click', () => {
        if (!this.renderer.currentVersionId) return;
        
        const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
        if (!version) return;
        
        const nuevoCdu = this.dataStore.addCduToVersion(this.renderer.currentVersionId);
        NotificationSystem.success('CDU creado exitosamente', 2000);
        this.renderer.fullRender();
    });
    
    const btnNuevaVersionLimpia = document.getElementById('btn-nueva-version-limpia');
    btnNuevaVersionLimpia.addEventListener('click', async () => {
        const version = this.dataStore.addNewEmptyVersion();
        NotificationSystem.success(`Versión ${version.numero} creada exitosamente.`, 3000);
        this.renderer.fullRender();
    });
    
    const btnDuplicarVersion = document.getElementById('btn-duplicar-version');
    btnDuplicarVersion.addEventListener('click', async () => {
        const versiones = this.dataStore.getAll();
        
        if (versiones.length === 0) {
            NotificationSystem.warning('No hay versiones para duplicar.', 3000);
            return;
        }
        
        const ultimaVersion = versiones[versiones.length - 1];
        const nuevaVersion = this.dataStore.duplicateVersion(ultimaVersion.id);
        
        NotificationSystem.success(
            `Versión ${nuevaVersion.numero} creada como copia de la versión ${ultimaVersion.numero} con ${nuevaVersion.cdus.length} CDUs.`,
            4000
        );
        this.renderer.fullRender();
    });
    document.addEventListener('click', (e) => {
    const btnMarcar = e.target.closest('.btn-marcar-produccion');
    if (btnMarcar) {
        e.stopPropagation(); // Evitar que se abra la versión
        const versionId = parseInt(btnMarcar.dataset.versionId);
        
        const version = this.dataStore.getAll().find(v => v.id === versionId);
        const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
        
        if (versionId === versionEnProduccionId) {
            // Desmarcar
            this.dataStore.setVersionEnProduccion(versionId);
            NotificationSystem.info(`Versión ${version.numero} desmarcada de producción.`, 2000);
        } else {
            // Marcar nueva
            this.dataStore.setVersionEnProduccion(versionId);
            NotificationSystem.success(`Versión ${version.numero} marcada como EN PRODUCCIÓN.`, 3000);
        }
        
        this.renderer.fullRender();
    }
});
const btnLoadMore = document.getElementById('btn-load-more-versions');
if (btnLoadMore) {
    btnLoadMore.addEventListener('click', () => {
        this.renderer.cargarMasVersiones();
        NotificationSystem.info('Cargando más versiones...', 1500);
    });
}
    
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
    const closeLoading = NotificationSystem.loading('Importando archivo Excel...');
    
    const resultado = await ExcelImporter.importar(file);
    const versiones = resultado.versiones;
    const versionEnProduccionId = resultado.versionEnProduccionId;
    
    closeLoading();
    
    if (versiones.length === 0) {
        NotificationSystem.error('No se encontraron datos válidos en el archivo', 4000);
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
        message: `Se encontraron:\n• ${versiones.length} versiones\n• ${totalCdusUnicos} CDUs únicos\n\n¿Desea reemplazar los datos actuales?`,
        type: 'warning',
        confirmText: 'Sí, reemplazar',
        cancelText: 'Cancelar'
    });

    if (confirmacion) {
        this.dataStore.replaceAll(versiones);
        
        // NUEVO: Restaurar versión en producción
        if (versionEnProduccionId) {
            this.dataStore.versionEnProduccionId = versionEnProduccionId;
        }
        
        this.renderer.showCardsView();
        NotificationSystem.success(
            `Importación exitosa: ${versiones.length} versiones y ${totalCdusUnicos} CDUs únicos`,
            4000
        );
    } else {
        NotificationSystem.info('Importación cancelada', 2000);
    }
} catch (error) {
    NotificationSystem.error('Error al cargar el archivo: ' + error.message, 5000);
    console.error(error);
} finally {
    fileInput.value = '';
}
        });
    }

setupDescargarButton() {
    document.getElementById('btn-descargar').addEventListener('click', async () => {
        const versiones = this.dataStore.getAll();
        
        if (versiones.length === 0) {
            NotificationSystem.warning('No hay datos para exportar.', 3000);
            return;
        }
        
        const validation = Validator.validateAllVersions(versiones);
        
        if (!validation.isValid) {
            const report = Validator.generateValidationReport(validation);
            const confirmacion = await Modal.confirm(
                `${report}\n¿Desea descargar de todos modos?`,
                'Advertencia de Validación'
            );
            
            if (!confirmacion) {
                NotificationSystem.info('Exportación cancelada', 2000);
                return;
            }
        }
        
        try {
            const closeLoading = NotificationSystem.loading('Generando archivo Excel...');
            
            // Pequeño delay para que se vea el loading
            await new Promise(resolve => setTimeout(resolve, 100));
            
            ExcelExporter.exportar(versiones);
            
    const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
    ExcelExporter.exportar(versiones, versionEnProduccionId);
    
    closeLoading();
    NotificationSystem.success('Archivo Excel descargado exitosamente', 3000);
} catch (error) {
    NotificationSystem.error('Error al exportar: ' + error.message, 4000);
    console.error(error);
}
    });
}

    setupTablaEvents() {
        console.log('🎯 Configurando eventos de tabla...');
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
            if (this.renderer.isRendering) return;

            const valor = e.target.value;
            
            if (campo === 'observacion') {
                const cduId = parseInt(e.target.dataset.cduId);
                const obsIndex = parseInt(e.target.dataset.obsIndex);
                
                let cduNombre = '';
                let versionNumero = '';
                let valorAnterior = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        valorAnterior = cdu.observaciones[obsIndex] || '';
                        break;
                    }
                }
                
                if (valorAnterior !== valor) {
                    this.dataStore.addPendingChange({
                        cduId,
                        campo: 'observacion',
                        index: obsIndex,
                        valorAnterior,
                        valorNuevo: valor,
                        cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'observacion'
                    });
                }
                
                this.dataStore.updateObservacion(cduId, obsIndex, valor);
            } 
            else if (campo === 'responsable-nombre') {
                const cduId = parseInt(e.target.dataset.cduId);
                const respIndex = parseInt(e.target.dataset.respIndex);
                
                let cduNombre = '';
                let versionNumero = '';
                let valorAnterior = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        if (cdu.responsables[respIndex]) {
                            valorAnterior = cdu.responsables[respIndex].nombre || '';
                        }
                        break;
                    }
                }
                
                if (valorAnterior !== valor) {
                    this.dataStore.addPendingChange({
                        cduId,
                        campo: 'responsable-nombre',
                        index: respIndex,
                        valorAnterior,
                        valorNuevo: valor,
                        cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'responsable'
                    });
                }
                
                this.dataStore.updateResponsable(cduId, respIndex, 'nombre', valor);
            }
            else if (campo === 'nombreCDU' || campo === 'descripcionCDU') {
                const cduId = parseInt(e.target.dataset.cduId);
                
                let cduNombre = '';
                let versionNumero = '';
                let valorAnterior = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        cduNombre = campo === 'nombreCDU' ? (cdu.nombreCDU || 'Sin nombre') : cdu.nombreCDU;
                        versionNumero = version.numero;
                        valorAnterior = cdu[campo] || '';
                        break;
                    }
                }
                
                if (valorAnterior !== valor) {
                    this.dataStore.addPendingChange({
                        cduId,
                        campo,
                        valorAnterior,
                        valorNuevo: valor,
                        cduNombre: campo === 'nombreCDU' ? valorAnterior : cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: campo === 'nombreCDU' ? 'nombre' : 'descripcion'
                    });
                }
                
                this.dataStore.updateCdu(cduId, campo, valor);
            }
        }, true);
        
        tbody.addEventListener('change', (e) => {
            if (this.renderer.isRendering) return;
            
            if (e.target.classList.contains('campo-estado')) {
                const cduId = parseInt(e.target.dataset.cduId);
                const valorNuevo = e.target.value;
                
                let valorAnterior = null;
                let cduNombre = '';
                let versionNumero = '';
                
                const existingChange = this.dataStore.pendingChanges.find(
                    c => c.cduId === cduId && c.campo === 'estado'
                );
                
                if (existingChange) {
                    valorAnterior = existingChange.valorAnterior;
                }
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        if (!existingChange) {
                            valorAnterior = cdu.estado || 'En Desarrollo';
                        }
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        break;
                    }
                }
                
                if (valorAnterior === null || valorAnterior === undefined) {
                    valorAnterior = 'En Desarrollo';
                }
                
                if (valorAnterior !== valorNuevo) {
                    this.dataStore.addPendingChange({
                        cduId,
                        campo: 'estado',
                        valorAnterior,
                        valorNuevo,
                        cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'estado'
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
                    
                    this.dataStore.updateCdu(cduId, 'estado', valorNuevo);
                }
            }
            else if (e.target.dataset.campo === 'responsable-rol') {
                const cduId = parseInt(e.target.dataset.cduId);
                const respIndex = parseInt(e.target.dataset.respIndex);
                const valor = e.target.value;
                
                let cduNombre = '';
                let versionNumero = '';
                let valorAnterior = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        if (cdu.responsables[respIndex]) {
                            valorAnterior = cdu.responsables[respIndex].rol || 'DEV';
                        }
                        break;
                    }
                }
                
                if (valorAnterior !== valor) {
                    this.dataStore.addPendingChange({
                        cduId,
                        campo: 'responsable-rol',
                        index: respIndex,
                        valorAnterior,
                        valorNuevo: valor,
                        cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'responsable'
                    });
                }
                
                const container = e.target.closest('.rol-select-container');
                if (container) {
                    const display = container.querySelector('.rol-display');
                    display.innerHTML = `${DOMBuilder.getRolIcon(valor)}<span>${valor}</span>`;
                }
                
                this.dataStore.updateResponsable(cduId, respIndex, 'rol', valor);
            }
            else if (e.target.dataset.campo === 'versionBADA') {
    const cduId = parseInt(e.target.dataset.cduId);
    const valor = e.target.value;
    
    let cduNombre = '';
    let versionNumero = '';
    let valorAnterior = '';
    
    for (const version of this.dataStore.getAll()) {
        const cdu = version.cdus.find(c => c.id === cduId);
        if (cdu) {
            cduNombre = cdu.nombreCDU || 'Sin nombre';
            versionNumero = version.numero;
            valorAnterior = cdu.versionBADA || 'V1';
            break;
        }
    }
    
    if (valorAnterior !== valor) {
        this.dataStore.addPendingChange({
            cduId,
            campo: 'versionBADA',
            valorAnterior,
            valorNuevo: valor,
            cduNombre,
            versionNumero,
            timestamp: new Date().toISOString(),
            tipo: 'versionBADA'
        });
    }
    
    this.dataStore.updateCdu(cduId, 'versionBADA', valor);
}
        });

        tbody.addEventListener('click', async (e) => {
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
                const cduId = parseInt(btnEliminar.dataset.cduId);
                
                // Obtener info ANTES de eliminar
                let cduNombre = '';
                let versionNumero = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        break;
                    }
                }
                
                const confirmacion = await Modal.confirm(
                    '¿Está seguro de eliminar este CDU?',
                    'Confirmar Eliminación'
                );
                if (confirmacion) {
                    // Registrar como cambio pendiente
                    this.dataStore.addPendingChange({
                        cduId,
                        campo: 'cdu-eliminado',
                        valorAnterior: `CDU: ${cduNombre}`,
                        valorNuevo: null,
                        cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'eliminacion'
                    });
                    
                    this.dataStore.deleteCdu(cduId);
                    this.renderer.fullRender();
                }
                return;
            }
            
            const btnAddResp = e.target.closest('[data-action="add-responsable"]');
            if (btnAddResp) {
                const cduId = parseInt(btnAddResp.dataset.cduId);
                
                let cduNombre = '';
                let versionNumero = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        break;
                    }
                }
                
                this.dataStore.addPendingChange({
                    cduId,
                    campo: 'responsable-agregado',
                    valorAnterior: null,
                    valorNuevo: 'Responsable agregado (DEV)',
                    cduNombre,
                    versionNumero,
                    timestamp: new Date().toISOString(),
                    tipo: 'responsable'
                });
                
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
                
                let cduNombre = '';
                let versionNumero = '';
                let respNombre = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu && cdu.responsables[respIndex]) {
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        respNombre = `${cdu.responsables[respIndex].nombre || 'Sin nombre'} (${cdu.responsables[respIndex].rol})`;
                        break;
                    }
                }
                
                const confirmacion = await Modal.confirm(
                    '¿Eliminar este responsable?',
                    'Confirmar'
                );
                if (confirmacion) {
                    this.dataStore.addPendingChange({
                        cduId,
                        campo: 'responsable-eliminado',
                        index: respIndex,
                        valorAnterior: respNombre,
                        valorNuevo: null,
                        cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'responsable'
                    });
                    
                    this.dataStore.deleteResponsable(cduId, respIndex);
                    this.renderer.fullRender();
                }
                return;
            }
            
            const btnAdd = e.target.closest('[data-action="add-observacion"]');
            if (btnAdd) {
                const cduId = parseInt(btnAdd.dataset.cduId);
                
                let cduNombre = '';
                let versionNumero = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu) {
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        break;
                    }
                }
                
                this.dataStore.addPendingChange({
                    cduId,
                    campo: 'observacion-agregada',
                    valorAnterior: null,
                    valorNuevo: 'Observación agregada',
                    cduNombre,
                    versionNumero,
                    timestamp: new Date().toISOString(),
                    tipo: 'observacion'
                });
                
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
                
                let cduNombre = '';
                let versionNumero = '';
                let obsTexto = '';
                
                for (const version of this.dataStore.getAll()) {
                    const cdu = version.cdus.find(c => c.id === cduId);
                    if (cdu && cdu.observaciones[obsIndex]) {
                        cduNombre = cdu.nombreCDU || 'Sin nombre';
                        versionNumero = version.numero;
                        obsTexto = cdu.observaciones[obsIndex] || 'Sin texto';
                        break;
                    }
                }
                
                const confirmacion = await Modal.confirm(
                    '¿Eliminar esta observación?',
                    'Confirmar'
                );
                if (confirmacion) {
                    this.dataStore.addPendingChange({
                        cduId,
                        campo: 'observacion-eliminada',
                        index: obsIndex,
                        valorAnterior: obsTexto,
                        valorNuevo: null,
                        cduNombre,
                        versionNumero,
                        timestamp: new Date().toISOString(),
                        tipo: 'observacion'
                    });
                    
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
        
        console.log('✅ Eventos de tabla configurados');
    }

setupFilterEvents() {
    // Crear versiones debounced de las funciones de filtrado
    const debouncedSearchFilter = Debouncer.debounce((value) => {
        this.renderer.setFilters({ search: value });
    }, 300);
    
    const debouncedResponsableFilter = Debouncer.debounce((value) => {
        this.renderer.setFilters({ responsable: value });
    }, 300);

    const filterSearch = document.getElementById('filter-search');
    filterSearch.addEventListener('input', (e) => {
        debouncedSearchFilter(e.target.value);
    });

    const filterEstado = document.getElementById('filter-estado');
    filterEstado.addEventListener('change', (e) => {
        // Los selects no necesitan debounce porque son cambios únicos
        this.renderer.setFilters({ estado: e.target.value });
    });

    const filterResponsable = document.getElementById('filter-responsable');
    filterResponsable.addEventListener('input', (e) => {
        debouncedResponsableFilter(e.target.value);
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

    console.log('✅ Eventos de filtros configurados con debounce');
}
setupDetailFilterEvents() {
    // Toggle para mostrar/ocultar filtros
    const btnToggle = document.getElementById('btn-toggle-detail-search');
    const filtersContent = document.querySelector('.detail-filters-content');
    
    btnToggle.addEventListener('click', () => {
        const isCollapsed = filtersContent.classList.contains('detail-filters-collapsed');
        
        if (isCollapsed) {
            filtersContent.classList.remove('detail-filters-collapsed');
            btnToggle.classList.add('active');
        } else {
            filtersContent.classList.add('detail-filters-collapsed');
            btnToggle.classList.remove('active');
        }
    });
    
    // Crear versiones debounced
    const debouncedDetailSearch = Debouncer.debounce((value) => {
        this.renderer.setDetailFilters({ search: value });
    }, 300);
    
    const debouncedDetailResponsable = Debouncer.debounce((value) => {
        this.renderer.setDetailFilters({ responsable: value });
    }, 300);
    
    // Event listeners
    const detailFilterSearch = document.getElementById('detail-filter-search');
    detailFilterSearch.addEventListener('input', (e) => {
        debouncedDetailSearch(e.target.value);
    });
    
    const detailFilterEstado = document.getElementById('detail-filter-estado');
    detailFilterEstado.addEventListener('change', (e) => {
        this.renderer.setDetailFilters({ estado: e.target.value });
    });
    
    const detailFilterResponsable = document.getElementById('detail-filter-responsable');
    detailFilterResponsable.addEventListener('input', (e) => {
        debouncedDetailResponsable(e.target.value);
    });
    
    const btnClearDetailFilters = document.getElementById('btn-clear-detail-filters');
    btnClearDetailFilters.addEventListener('click', () => {
        this.renderer.clearDetailFilters();
        NotificationSystem.info('Filtros limpiados', 2000);
    });
    
    console.log('✅ Filtros de detalle configurados');
}
}