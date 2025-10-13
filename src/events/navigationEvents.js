// navigationEvents.js - Eventos de navegación entre vistas

import { Modal } from '../modals/Modal.js';

export class NavigationEvents {
    constructor(dataStore, renderer) {
        this.dataStore = dataStore;
        this.renderer = renderer;
    }

    setup() {
        this.setupBackButton();
        this.setupEditCommentsButton();
        this.setupSearchToggle();
        console.log('✅ Eventos de navegación configurados');
    }

    setupBackButton() {
        const btnBack = document.getElementById('btn-back-to-cards');
        btnBack.addEventListener('click', () => {
            this.renderer.showCardsView();
        });
    }

setupEditCommentsButton() {
    const btnEditComments = document.getElementById('btn-edit-version-comments');
    btnEditComments.addEventListener('click', async () => {
        if (!this.renderer.currentVersionId) return;
        
        const version = this.dataStore.getAll().find(v => v.id === this.renderer.currentVersionId);
        if (!version) return;
        
        const comentariosAnteriores = JSON.parse(JSON.stringify(version.comentarios));
        
        const nuevosComentarios = await Modal.showComentariosVersion(
            version.numero,
            version.comentarios
        );
        
        if (nuevosComentarios !== null) {
            // Registrar cambios pendientes
            this.registrarCambiosComentarios(version.id, comentariosAnteriores, nuevosComentarios, version.numero);
            
            // Actualizar en dataStore
            this.dataStore.updateVersion(this.renderer.currentVersionId, 'comentarios', nuevosComentarios);
            
            // CAMBIO: En lugar de fullRender(), actualizar solo comentarios
            this.renderer.updateVersionComments();
            
            // Actualizar stats globales
            this.renderer.updateStats();
        }
    });
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
    }

    registrarCambiosComentarios(versionId, anteriores, nuevos, versionNumero) {
        const categorias = ['mejoras', 'salidas', 'cambiosCaliente', 'observaciones'];
        
        categorias.forEach(categoria => {
            const itemsAnteriores = anteriores[categoria] || [];
            const itemsNuevos = nuevos[categoria] || [];
            
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
}