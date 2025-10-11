// tableEvents.js - Eventos de la tabla de CDUs

import { Modal } from '../modals/Modal.js';
import { DOMBuilder } from '../components/domBuilder.js';

export class TableEvents {
    constructor(dataStore, renderer) {
        this.dataStore = dataStore;
        this.renderer = renderer;
    }

    setup() {
        this.setupTablaEvents();
        console.log('✅ Eventos de tabla configurados');
    }

    setupTablaEvents() {
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
            this.handleBlur(e);
        }, true);
        
        tbody.addEventListener('change', (e) => {
            this.handleChange(e);
        });

        tbody.addEventListener('click', async (e) => {
            await this.handleClick(e);
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

    handleBlur(e) {
        const campo = e.target.dataset.campo;
        if (!campo) return;
        if (this.renderer.isRendering) return;

        const valor = e.target.value;
        
        if (campo === 'observacion') {
            this.handleObservacionBlur(e.target, valor);
        } 
        else if (campo === 'responsable-nombre') {
            this.handleResponsableNombreBlur(e.target, valor);
        }
        else if (campo === 'nombreCDU' || campo === 'descripcionCDU') {
            this.handleCduFieldBlur(e.target, campo, valor);
        }
    }

    handleObservacionBlur(target, valor) {
        const cduId = parseInt(target.dataset.cduId);
        const obsIndex = parseInt(target.dataset.obsIndex);
        
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

    handleResponsableNombreBlur(target, valor) {
        const cduId = parseInt(target.dataset.cduId);
        const respIndex = parseInt(target.dataset.respIndex);
        
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

    handleCduFieldBlur(target, campo, valor) {
        const cduId = parseInt(target.dataset.cduId);
        
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

    handleChange(e) {
        if (this.renderer.isRendering) return;
        
        if (e.target.classList.contains('campo-estado')) {
            this.handleEstadoChange(e.target);
        }
        else if (e.target.dataset.campo === 'responsable-rol') {
            this.handleRolChange(e.target);
        }
        else if (e.target.dataset.campo === 'versionBADA') {
            this.handleVersionBADAChange(e.target);
        }
    }

    handleEstadoChange(target) {
        const cduId = parseInt(target.dataset.cduId);
        const valorNuevo = target.value;
        
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
            
            const container = target.closest('.estado-select-container');
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

    handleRolChange(target) {
        const cduId = parseInt(target.dataset.cduId);
        const respIndex = parseInt(target.dataset.respIndex);
        const valor = target.value;
        
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
        
        const container = target.closest('.rol-select-container');
        if (container) {
            const display = container.querySelector('.rol-display');
            display.innerHTML = `${DOMBuilder.getRolIcon(valor)}<span>${valor}</span>`;
        }
        
        this.dataStore.updateResponsable(cduId, respIndex, 'rol', valor);
    }

    handleVersionBADAChange(target) {
        const cduId = parseInt(target.dataset.cduId);
        const valor = target.value;
        
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

    async handleClick(e) {
        const btnHistorial = e.target.closest('[data-action="show-historial"]');
        if (btnHistorial) {
            await this.handleHistorialClick(btnHistorial);
            return;
        }
        
        const btnEliminar = e.target.closest('.btn-eliminar');
        if (btnEliminar) {
            await this.handleEliminarClick(btnEliminar);
            return;
        }
        
        const btnAddResp = e.target.closest('[data-action="add-responsable"]');
        if (btnAddResp) {
            this.handleAddResponsableClick(btnAddResp);
            return;
        }
        
        const btnRemoveResp = e.target.closest('[data-action="remove-responsable"]');
        if (btnRemoveResp) {
            await this.handleRemoveResponsableClick(btnRemoveResp);
            return;
        }
        
        const btnAdd = e.target.closest('[data-action="add-observacion"]');
        if (btnAdd) {
            this.handleAddObservacionClick(btnAdd);
            return;
        }
        
        const btnRemove = e.target.closest('[data-action="remove-observacion"]');
        if (btnRemove) {
            await this.handleRemoveObservacionClick(btnRemove);
            return;
        }
    }

    async handleHistorialClick(btn) {
        const cduId = parseInt(btn.dataset.cduId);
        const versiones = this.dataStore.getAll();
        let cdu = null;
        
        for (const version of versiones) {
            cdu = version.cdus.find(c => c.id === cduId);
            if (cdu) break;
        }
        
        if (cdu) {
            await Modal.showHistorial(cdu.nombreCDU, cdu.historial || []);
        }
    }

    async handleEliminarClick(btn) {
        const cduId = parseInt(btn.dataset.cduId);
        
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
    }

    handleAddResponsableClick(btn) {
        const cduId = parseInt(btn.dataset.cduId);
        
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
    }

    async handleRemoveResponsableClick(btn) {
        const cduId = parseInt(btn.dataset.cduId);
        const respIndex = parseInt(btn.dataset.respIndex);
        
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
    }

    handleAddObservacionClick(btn) {
        const cduId = parseInt(btn.dataset.cduId);
        
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
    }

    async handleRemoveObservacionClick(btn) {
        const cduId = parseInt(btn.dataset.cduId);
        const obsIndex = parseInt(btn.dataset.obsIndex);
        
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
    }
}