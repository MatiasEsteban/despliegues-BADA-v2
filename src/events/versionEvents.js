// versionEvents.js - Eventos relacionados con versiones

import { ExcelExporter } from '../io/excelExporter.js';
import { ExcelImporter } from '../io/excelImporter.js';
import { Modal } from '../modals/Modal.js';
import { Validator } from '../utils/validator.js';
import { NotificationSystem } from '../utils/notifications.js';

export class VersionEvents {
    constructor(dataStore, renderer) {
        this.dataStore = dataStore;
        this.renderer = renderer;
    }

    setup() {
        this.setupVersionMetaInputs();
        this.setupVersionButtons();
        this.setupCargarButton();
        this.setupDescargarButton();
        console.log('✅ Eventos de versión configurados');
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
    }

    setupVersionButtons() {
const btnAgregar = document.getElementById('btn-agregar');
btnAgregar.addEventListener('click', () => {
    if (!this.renderer.currentVersionId) return;
    
    const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
    if (!version) return;
    
    // 1. Agregar CDU al dataStore
    const nuevoCdu = this.dataStore.addCduToVersion(this.renderer.currentVersionId);
    
    if (!nuevoCdu) return;
    
    // 2. Expandir el rango del Virtual Scroll para incluir el nuevo CDU
    if (this.renderer.virtualScroll) {
        const newTotalCdus = version.cdus.length;
        
        // CRÍTICO: Expandir endIndex para incluir el nuevo CDU
        this.renderer.virtualScroll.state.endIndex = newTotalCdus;
        
        // Actualizar datos y re-renderizar con el nuevo rango
        this.renderer.virtualScroll.currentCdus = version.cdus;
        
        // Remover filas antiguas
        const tbody = document.getElementById('tabla-body');
        const existingRows = Array.from(tbody.querySelectorAll('tr:not(.virtual-scroll-spacer)'));
        existingRows.forEach(row => row.remove());
        
        // Renderizar con el rango expandido
        this.renderer.virtualScroll.renderVisibleRows();
        this.renderer.virtualScroll.updateSpacers();
        
        // 3. Hacer scroll hasta el final para mostrar el nuevo CDU
        setTimeout(() => {
            const tableWrapper = document.querySelector('.table-wrapper');
            if (tableWrapper) {
                tableWrapper.scrollTo({
                    top: tableWrapper.scrollHeight,
                    behavior: 'smooth'
                });
            }
            
            // 4. Focus en el primer input del nuevo CDU
            setTimeout(() => {
                const newRow = tbody.querySelector(`tr[data-cdu-id="${nuevoCdu.id}"]`);
                if (newRow) {
                    const firstInput = newRow.querySelector('.campo-cdu');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }
            }, 400);
        }, 100);
    }
    
    NotificationSystem.success('CDU creado exitosamente', 2000);
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
                e.stopPropagation();
                const versionId = parseInt(btnMarcar.dataset.versionId);
                
                const version = this.dataStore.getAll().find(v => v.id === versionId);
                const versionEnProduccionIdAnterior = this.dataStore.getVersionEnProduccionId();
                
                let versionAnteriorNombre = 'Ninguna';
                if (versionEnProduccionIdAnterior) {
                    const versionAnterior = this.dataStore.getAll().find(v => v.id === versionEnProduccionIdAnterior);
                    if (versionAnterior) {
                        versionAnteriorNombre = versionAnterior.numero;
                    }
                }
                
                const valorAnterior = this.dataStore.setVersionEnProduccionTemporal(versionId);
                
                const nuevaVersionEnProduccionId = this.dataStore.getVersionEnProduccionId();
                let nuevaVersionNombre = 'Ninguna';
                if (nuevaVersionEnProduccionId) {
                    const nuevaVersion = this.dataStore.getAll().find(v => v.id === nuevaVersionEnProduccionId);
                    if (nuevaVersion) {
                        nuevaVersionNombre = nuevaVersion.numero;
                    }
                }
                
                this.dataStore.addPendingChange({
                    tipo: 'version-produccion',
                    campo: 'version-en-produccion',
                    versionId: versionId,
                    valorAnterior: versionAnteriorNombre,
                    valorNuevo: nuevaVersionNombre,
                    timestamp: new Date().toISOString()
                });
                
                if (versionId === versionEnProduccionIdAnterior) {
                    NotificationSystem.info(`Versión ${version.numero} desmarcada de producción (cambio pendiente).`, 2500);
                } else {
                    NotificationSystem.success(`Versión ${version.numero} marcada como EN PRODUCCIÓN (cambio pendiente).`, 3000);
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

                const confirmacion = await Modal.show({
                    title: 'Confirmar Importación',
                    message: `Se encontraron:\n• ${versiones.length} versiones\n• ${totalCdusUnicos} CDUs únicos\n\n¿Desea reemplazar los datos actuales?`,
                    type: 'warning',
                    confirmText: 'Sí, reemplazar',
                    cancelText: 'Cancelar'
                });

                if (confirmacion) {
                    this.dataStore.replaceAll(versiones);
                    
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
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
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

    async handleSaveChanges() {
        const pendingChanges = this.dataStore.getPendingChanges();
        
        if (pendingChanges.length === 0) {
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

        try {
            const confirmed = await Modal.showChangesSummary(changesInfo);

            if (confirmed) {
                const appliedChanges = this.dataStore.applyPendingChanges();
                
                NotificationSystem.success(
                    `Se guardaron ${appliedChanges.length} cambio${appliedChanges.length !== 1 ? 's' : ''} exitosamente.`,
                    3000
                );

                this.renderer.fullRender();
            } else {
                this.dataStore.discardPendingChanges();
                NotificationSystem.info('Cambios cancelados.', 2000);
                this.renderer.fullRender();
            }
        } catch (error) {
            console.error('❌ Error en handleSaveChanges:', error);
            NotificationSystem.error('Ocurrió un error al guardar los cambios: ' + error.message);
        }
    }
}