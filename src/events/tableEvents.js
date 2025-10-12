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
    
    // NUEVO: NO llamar fullRender, el dataStore ya notificó
    // El cambio ya está guardado, no necesitamos re-renderizar todo
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
        // NO fullRender aquí
    }
    else if (e.target.dataset.campo === 'responsable-rol') {
        this.handleRolChange(e.target);
        // NO fullRender aquí
    }
    else if (e.target.dataset.campo === 'versionBADA') {
        this.handleVersionBADAChange(e.target);
        // NO fullRender aquí
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
    // 1. ELIMINAR FILA DEL DOM INMEDIATAMENTE (optimista)
    const row = document.querySelector(`tr[data-cdu-id="${cduId}"]`);
    if (row) {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        setTimeout(() => row.remove(), 300);
    }
    
    // 2. Actualizar dataStore en segundo plano
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
    
    // 1. RENDERIZAR INMEDIATAMENTE (optimista)
    const container = document.querySelector(`[data-cdu-id="${cduId}"].responsables-container`);
    if (container) {
        // Remover mensaje "vacío" si existe
        const emptyMsg = container.querySelector('.responsables-empty');
        if (emptyMsg) emptyMsg.remove();
        
        // Calcular nuevo índice
        const existingItems = container.querySelectorAll('.responsable-item');
        const newIndex = existingItems.length;
        
        // Crear nuevo item inmediatamente
        const newItem = this.createResponsableItemQuick(cduId, '', 'DEV', newIndex);
        
        // Insertar ANTES del botón "+"
        const btnAdd = container.querySelector('.btn-add');
        container.insertBefore(newItem, btnAdd);
        
        // Focus inmediato en el input
        const input = newItem.querySelector('input[data-campo="responsable-nombre"]');
        if (input) {
            setTimeout(() => input.focus(), 50);
        }
    }
    
    // 2. Actualizar dataStore en segundo plano (sin esperar render)
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
    // NO llamar fullRender - el DOM ya está actualizado
}

/**
 * Crea un item de responsable rápidamente (para render inmediato)
 */
createResponsableItemQuick(cduId, nombre, rol, index) {
    const item = document.createElement('div');
    item.className = 'responsable-item';
    item.dataset.index = index;
    
    // Importar CduRow para usar su método
    const rolIcon = window.DOMBuilder.getRolIcon(rol);
    
    item.innerHTML = `
        <div class="rol-select-container">
            <div class="rol-display">
                ${rolIcon}<span>${rol}</span>
            </div>
            <select class="responsable-rol-select" data-cdu-id="${cduId}" data-resp-index="${index}" data-campo="responsable-rol">
                <option value="DEV" ${rol === 'DEV' ? 'selected' : ''}>DEV</option>
                <option value="AF" ${rol === 'AF' ? 'selected' : ''}>AF</option>
                <option value="UX" ${rol === 'UX' ? 'selected' : ''}>UX</option>
                <option value="AN" ${rol === 'AN' ? 'selected' : ''}>AN</option>
                <option value="QA" ${rol === 'QA' ? 'selected' : ''}>QA</option>
            </select>
        </div>
        <input type="text" value="${nombre}" placeholder="Nombre..." data-cdu-id="${cduId}" data-resp-index="${index}" data-campo="responsable-nombre">
        <button class="btn-responsable btn-remove" type="button" title="Eliminar responsable" data-cdu-id="${cduId}" data-resp-index="${index}" data-action="remove-responsable">×</button>
    `;
    
    return item;
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
    // 1. ELIMINAR DEL DOM INMEDIATAMENTE (optimista)
    const container = document.querySelector(`[data-cdu-id="${cduId}"].responsables-container`);
    if (container) {
        const item = container.querySelector(`[data-index="${respIndex}"]`);
        if (item) {
            item.remove();
            
            // Si no quedan más responsables, mostrar mensaje vacío
            const remainingItems = container.querySelectorAll('.responsable-item');
            if (remainingItems.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'responsables-empty';
                empty.textContent = 'Sin responsables';
                const btnAdd = container.querySelector('.btn-add');
                container.insertBefore(empty, btnAdd);
            }
        }
    }
    
    // 2. Actualizar dataStore en segundo plano
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
    
    // 1. RENDERIZAR INMEDIATAMENTE (optimista)
    const container = document.querySelector(`[data-cdu-id="${cduId}"].observaciones-container`);
    if (container) {
        // Remover mensaje "vacío" si existe
        const emptyMsg = container.querySelector('.observaciones-empty');
        if (emptyMsg) emptyMsg.remove();
        
        // Calcular nuevo índice
        const existingItems = container.querySelectorAll('.observacion-item');
        const newIndex = existingItems.length;
        
        // Crear nuevo item inmediatamente
        const newItem = this.createObservacionItemQuick(cduId, '', newIndex);
        
        // Insertar ANTES del botón "+"
        const btnAdd = container.querySelector('.btn-add');
        container.insertBefore(newItem, btnAdd);
        
        // Focus inmediato en el input
        const input = newItem.querySelector('input[data-campo="observacion"]');
        if (input) {
            setTimeout(() => input.focus(), 50);
        }
    }
    
    // 2. Actualizar dataStore en segundo plano
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
    // NO llamar fullRender - el DOM ya está actualizado
}

/**
 * Crea un item de observación rápidamente (para render inmediato)
 */
createObservacionItemQuick(cduId, texto, index) {
    const item = document.createElement('div');
    item.className = 'observacion-item';
    item.dataset.index = index;
    
    item.innerHTML = `
        <input type="text" value="${texto}" placeholder="Observación..." data-cdu-id="${cduId}" data-obs-index="${index}" data-campo="observacion">
        <button class="btn-observacion btn-remove" type="button" title="Eliminar observación" data-cdu-id="${cduId}" data-obs-index="${index}" data-action="remove-observacion">×</button>
    `;
    
    return item;
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
    // 1. ELIMINAR DEL DOM INMEDIATAMENTE (optimista)
    const container = document.querySelector(`[data-cdu-id="${cduId}"].observaciones-container`);
    if (container) {
        const item = container.querySelector(`[data-index="${obsIndex}"]`);
        if (item) {
            item.remove();
            
            // Si no quedan más observaciones, mostrar mensaje vacío
            const remainingItems = container.querySelectorAll('.observacion-item');
            if (remainingItems.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'observaciones-empty';
                empty.textContent = 'Sin observaciones';
                const btnAdd = container.querySelector('.btn-add');
                container.insertBefore(empty, btnAdd);
            }
        }
    }
    
    // 2. Actualizar dataStore en segundo plano
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
}
    }
}