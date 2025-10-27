// versionEvents.js - Eventos relacionados con versiones

import { ExcelExporter } from '../io/excelExporter.js';
import { ExcelImporter } from '../io/excelImporter.js';
import { Modal } from '../modals/Modal.js';
import { Validator } from '../utils/validator.js';
import { ChangesModal } from '../modals/ChangesModal.js';
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
        this.setupListActionButtons();
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
        btnAgregar.addEventListener('click', async () => {
            if (!this.renderer.currentVersionId) return;
            
            const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
            if (!version) return;
            
            // 1. Agregar CDU al dataStore
            const nuevoCdu = this.dataStore.addCduToVersion(this.renderer.currentVersionId);
            if (!nuevoCdu) return;
            
            // 2. Actualizar Virtual Scroll con los nuevos datos
            if (this.renderer.virtualScroll) {
                // Expandir el rango para incluir todos los CDUs
                const newTotalCdus = version.cdus.length;
                this.renderer.virtualScroll.state.endIndex = Math.min(
                    newTotalCdus,
                    this.renderer.virtualScroll.state.startIndex + 
                    this.renderer.virtualScroll.config.visibleRows + 
                    (this.renderer.virtualScroll.config.bufferRows * 2)
                );
                
                // Actualizar datos
                this.renderer.virtualScroll.updateData(version.cdus);
                
                // 3. Scroll suave al final
                const tableWrapper = document.querySelector('.table-wrapper');
                if (tableWrapper) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    tableWrapper.scrollTo({
                        top: tableWrapper.scrollHeight,
                        behavior: 'smooth'
                    });
                    
                    // 4. Focus en el nuevo CDU después del scroll
                    setTimeout(() => {
                        const newRow = document.querySelector(`tr[data-cdu-id="${nuevoCdu.id}"]`);
                        if (newRow) {
                            newRow.classList.add('adding');
                            const firstInput = newRow.querySelector('.campo-cdu');
                            if (firstInput) firstInput.focus();
                        }
                    }, 400);
                }
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

        // Event listener para botón de información de despliegue
        document.addEventListener('click', async (e) => {
            const btnInfo = e.target.closest('.btn-version-info');
            if (btnInfo) {
                e.stopPropagation();
                e.preventDefault();
                
                const versionId = parseInt(btnInfo.dataset.versionId);
                console.log('🔍 Botón info clickeado, versionId:', versionId);
                
                const version = this.dataStore.getAll().find(v => v.id === versionId);
                if (!version) {
                    console.error('❌ Versión no encontrada');
                    return;
                }
                
                const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
                const isEnProduccion = version.id === versionEnProduccionId;
                
                console.log('✅ Abriendo modal para versión:', version.numero);
                
                try {
                    // Importar dinámicamente el modal
                    const { DeploymentReportModal } = await import('../modals/DeploymentReportModal.js');
                    await DeploymentReportModal.show(version, isEnProduccion);
                } catch (error) {
                    console.error('❌ Error al abrir modal:', error);
                    NotificationSystem.error('Error al abrir el reporte de despliegue');
                }
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
                
                // Esta línea fallaba porque ExcelImporter.importExcel no existía o era incorrecto
                // Ahora la vamos a arreglar en el Paso 3
                const resultado = await ExcelImporter.importExcel(file);
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

                // Este es el modal correcto, que usa \n (texto plano)
// Este es el bloque CORREGIDO que usa Modal.confirm
const message = `Se encontraron:\n• ${versiones.length} versiones\n• ${totalCdusUnicos} CDUs únicos\n\n¿Desea reemplazar los datos actuales?`;
const confirmText = 'Sí, reemplazar';
const cancelText = 'Cancelar';
const title = 'Confirmar Importación';
const type = 'warning'; // 'warning' es el tipo correcto para el estilo

const confirmacion = await Modal.confirm(
    message,
    confirmText,
    cancelText,
    title,
    type
);

                if (confirmacion) {
                    // Esta es la lógica de actualización correcta
                    this.dataStore.replaceAll(versiones, versionEnProduccionId);
                    
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
    /**
     * ¡NUEVO! Configura listeners para los botones de acción en la vista de lista
     * Se usa delegación de eventos en el contenedor de la lista.
     */
setupListActionButtons() {
        const listContainer = document.getElementById('versions-list-container');
        if (!listContainer) {
            console.error("Error: No se encontró #versions-list-container para adjuntar listeners de botones de lista.");
            return;
        }

        listContainer.addEventListener('click', async (e) => {
            const duplicateBtn = e.target.closest('[data-action="duplicate-version-list"]');
            const deleteBtn = e.target.closest('[data-action="delete-version-list"]');
            const infoBtn = e.target.closest('.btn-version-info');
            const markProdBtn = e.target.closest('.btn-marcar-produccion');

            // --- Lógica para Duplicar ---
            if (duplicateBtn) {
                e.stopPropagation();
                const versionId = parseInt(duplicateBtn.dataset.versionId);
                if (isNaN(versionId)) return;
                console.log(`Duplicando versión ${versionId} desde lista`);
                const versionOriginal = this.dataStore.getAll().find(v => v.id === versionId);
                if (!versionOriginal) return;

                try { // Añadir try...catch por si falla la duplicación o el renderizado
                    const nuevaVersion = this.dataStore.duplicateVersion(versionId);
                    if (nuevaVersion) {
                        NotificationSystem.success(
                            `Versión ${nuevaVersion.numero} creada como copia de ${versionOriginal.numero}.`,
                            4000
                        );
                        this.renderer.renderCardsView(); // Re-renderizar
                    } else {
                         NotificationSystem.error('No se pudo duplicar la versión.');
                    }
                } catch (error) {
                     console.error("Error al duplicar versión o renderizar:", error);
                     NotificationSystem.error('Error al duplicar la versión.');
                }
            }
            // --- Lógica para Eliminar ---
            else if (deleteBtn) {
                e.stopPropagation();
                const versionId = parseInt(deleteBtn.dataset.versionId);
                if (isNaN(versionId)) return;
                console.log(`Intentando eliminar versión ${versionId} desde lista`);
                const versionAEliminar = this.dataStore.getAll().find(v => v.id === versionId);
                if (!versionAEliminar) return;

                const confirmacion = await Modal.confirm(
                    `¿Está seguro de eliminar la Versión ${versionAEliminar.numero}? Esta acción no se puede deshacer.`,
                    'Confirmar Eliminación', 'Cancelar', 'Eliminar Versión', 'error'
                );

                if (confirmacion) {
                    // ¡CAMBIO! Envolver eliminación y renderizado en try...catch
                    try {
                        console.log("-> Intentando eliminar datos...");
                        const deleted = this.dataStore.deleteVersion(versionId); // Intenta eliminar

                        if (deleted) {
                            console.log("-> Datos eliminados. Intentando re-renderizar...");
                            // Forzar reseteo de página por si acaso, ANTES de renderizar
                            this.renderer.listCurrentPage = 1;
                            this.renderer.renderCardsView(); // Intenta re-renderizar
                            console.log("-> Renderizado post-eliminación completado.");
                            // Notificación de éxito SOLO si todo funcionó
                            NotificationSystem.success(`Versión ${versionAEliminar.numero} eliminada correctamente.`);
                        } else {
                            // Esto no debería pasar si la confirmación fue positiva y la versión existía
                            console.warn("deleteVersion devolvió false inesperadamente.");
                            NotificationSystem.error('No se pudo eliminar la versión (error inesperado en datos).');
                        }
                    } catch (renderError) {
                        // Si falla la eliminación O el renderizado posterior
                        console.error("Error durante eliminación o re-renderizado:", renderError);
                        NotificationSystem.error('Error al actualizar la vista después de eliminar.');
                        // Opcional: intentar un fullRender más forzado si el render normal falla
                        // try { this.renderer.fullRender(); } catch(e){}
                    }
                } else {
                    NotificationSystem.info('Eliminación cancelada.');
                }
            }
            // --- Lógica para Info ---
            else if (infoBtn) {
                 e.stopPropagation();
                 const versionId = parseInt(infoBtn.dataset.versionId);
                 if (!isNaN(versionId)) {
                     console.log(`Click en Info para versión ${versionId} desde lista`);
                     this.handleInfoClick(versionId); // Llamar manejador
                 }
            }
            // --- Lógica para Marcar Producción ---
            else if (markProdBtn) {
                  e.stopPropagation();
                  const versionId = parseInt(markProdBtn.dataset.versionId);
                  if (!isNaN(versionId)) {
                      console.log(`Click en MarcarProd para versión ${versionId} desde lista`);
                      this.handleMarkProdClick(versionId); // Llamar manejador
                  }
            }
        });
    }

     // --- Funciones auxiliares opcionales para Info y MarcarProd (si quieres centralizar) ---
     async handleInfoClick(versionId) {
         console.log('🔍 Botón info clickeado (manejador auxiliar), versionId:', versionId);
         const version = this.dataStore.getAll().find(v => v.id === versionId);
         if (!version) {
             console.error('❌ Versión no encontrada');
             NotificationSystem.error('No se encontró la información de la versión.');
             return;
         }
         const versionEnProduccionId = this.dataStore.getVersionEnProduccionId();
         const isEnProduccion = version.id === versionEnProduccionId;
         try {
             const { DeploymentReportModal } = await import('../modals/DeploymentReportModal.js');
             await DeploymentReportModal.show(version, isEnProduccion);
         } catch (error) {
             console.error('❌ Error al abrir modal de reporte:', error);
             NotificationSystem.error('Error al abrir el reporte de despliegue');
         }
     }

      handleMarkProdClick(versionId) {
          const version = this.dataStore.getAll().find(v => v.id === versionId);
          if(!version) return;

          const versionEnProduccionIdAnterior = this.dataStore.getVersionEnProduccionId();
          let versionAnteriorNombre = 'Ninguna';
          if (versionEnProduccionIdAnterior) {
              const versionAnterior = this.dataStore.getAll().find(v => v.id === versionEnProduccionIdAnterior);
              if (versionAnterior) versionAnteriorNombre = versionAnterior.numero;
          }

          // Aplicar temporalmente y obtener valor anterior real
          const valorAnteriorRealId = this.dataStore.setVersionEnProduccionTemporal(versionId);

          const nuevaVersionEnProduccionId = this.dataStore.getVersionEnProduccionId();
          let nuevaVersionNombre = 'Ninguna';
          if (nuevaVersionEnProduccionId) {
              const nuevaVersion = this.dataStore.getAll().find(v => v.id === nuevaVersionEnProduccionId);
              if (nuevaVersion) nuevaVersionNombre = nuevaVersion.numero;
          }

          // Usar nombre de la versión anterior real para el registro del cambio
           let valorAnteriorNombreParaRegistro = 'Ninguna';
           if(valorAnteriorRealId) {
                const va = this.dataStore.getAll().find(v => v.id === valorAnteriorRealId);
                if(va) valorAnteriorNombreParaRegistro = va.numero;
           }


          this.dataStore.addPendingChange({
              tipo: 'version-produccion',
              campo: 'version-en-produccion',
              versionId: versionId, // Podría ser null si se desmarca
              valorAnterior: valorAnteriorNombreParaRegistro, // Nombre de la versión que ESTABA en prod
              valorNuevo: nuevaVersionNombre, // Nombre de la versión que AHORA está en prod (o ninguna)
              timestamp: new Date().toISOString()
          });

          if (versionId === versionEnProduccionIdAnterior) { // Se está desmarcando
              NotificationSystem.info(`Versión ${version.numero} desmarcada de producción (cambio pendiente).`, 2500);
          } else { // Se está marcando
              NotificationSystem.success(`Versión ${version.numero} marcada como EN PRODUCCIÓN (cambio pendiente).`, 3000);
          }

          // Re-renderizar la vista actual (grid o list) para reflejar el cambio pendiente visualmente
          this.renderer.renderCardsView();
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
            const confirmed = await ChangesModal.show(changesInfo);

            if (confirmed) {
                // CONFIRMAR: Aplicar cambios
                const appliedChanges = this.dataStore.applyPendingChanges();
                
                NotificationSystem.success(
                    `Se guardaron ${appliedChanges.length} cambio${appliedChanges.length !== 1 ? 's' : ''} exitosamente.`,
                    3000
                );

                this.renderer.fullRender();
            } else {
                // CANCELAR: Descartar cambios y actualizar UI
                this.dataStore.discardPendingChanges();
                
                NotificationSystem.info('Cambios cancelados.', 2000);
                
                // NUEVO: Actualizar UI según la vista actual
                if (this.renderer.currentView === 'detail' && this.renderer.currentVersionId) {
                    // Si estamos en vista detalle, actualizar comentarios y tabla
                    this.renderer.updateVersionComments();
                    
                    // También re-renderizar la tabla por si había cambios de CDUs
                    const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
                    if (version && this.renderer.virtualScroll) {
                        this.renderer.virtualScroll.updateData(version.cdus);
                    }
                } else {
                    // Si estamos en vista de tarjetas, hacer fullRender
                    this.renderer.fullRender();
                }
            }
        } catch (error) {
            console.error('❌ Error en handleSaveChanges:', error);
            NotificationSystem.error('Ocurrió un error al guardar los cambios: ' + error.message);
        }
    }
}