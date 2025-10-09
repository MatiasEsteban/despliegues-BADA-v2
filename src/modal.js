// modal.js - Sistema de modals con comentarios categorizados

export class Modal {
    static show(options) {
        return new Promise((resolve) => {
            const {
                title = 'Aviso',
                message = '',
                type = 'info',
                confirmText = 'Aceptar',
                cancelText = 'Cancelar'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = `modal modal-${type}`;
            
            const icon = this.getIcon(type);
            
            modal.innerHTML = `
                <div class="modal-icon">
                    ${icon}
                </div>
                <div class="modal-content">
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                </div>
                <div class="modal-actions">
                    ${type === 'confirm' ? `<button class="btn btn-secondary modal-cancel">${cancelText}</button>` : ''}
                    <button class="btn btn-primary modal-confirm">${confirmText}</button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            requestAnimationFrame(() => {
                overlay.classList.add('modal-show');
            });
            
            const confirmBtn = modal.querySelector('.modal-confirm');
            const cancelBtn = modal.querySelector('.modal-cancel');
            
            const close = (result) => {
                overlay.classList.remove('modal-show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(result);
                }, 300);
            };
            
            confirmBtn.addEventListener('click', () => close(true));
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => close(false));
            }
            
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    close(type === 'confirm' ? false : true);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }
    
    // Modal de historial de cambios
    static showHistorial(cduNombre, historial) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'modal modal-historial';
            
            const historialHTML = this.renderHistorial(historial);
            
            modal.innerHTML = `
                <div class="modal-historial-header">
                    <h3 class="modal-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Historial de Cambios
                    </h3>
                    <button class="modal-close-btn" title="Cerrar">×</button>
                </div>
                <div class="modal-historial-cdu">
                    <strong>CDU:</strong> ${cduNombre || 'Sin nombre'}
                </div>
                <div class="modal-historial-content">
                    ${historialHTML}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary modal-confirm">Cerrar</button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            requestAnimationFrame(() => {
                overlay.classList.add('modal-show');
            });
            
            const confirmBtn = modal.querySelector('.modal-confirm');
            const closeBtn = modal.querySelector('.modal-close-btn');
            
            const close = () => {
                overlay.classList.remove('modal-show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(true);
                }, 300);
            };
            
            confirmBtn.addEventListener('click', close);
            closeBtn.addEventListener('click', close);
            
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    close();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }
    
    // Modal para comentarios categorizados de versión
    static showComentariosVersion(versionNumero, comentariosActuales) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'modal modal-comentarios-categorized';
            
            // Migrar formato antiguo si es necesario
            let comentarios = comentariosActuales;
            if (typeof comentariosActuales === 'string') {
                comentarios = {
                    mejoras: [],
                    salidas: [],
                    cambiosCaliente: [],
                    observaciones: comentariosActuales ? [comentariosActuales] : []
                };
            } else if (!comentariosActuales) {
                comentarios = {
                    mejoras: [],
                    salidas: [],
                    cambiosCaliente: [],
                    observaciones: []
                };
            }
            
            modal.innerHTML = `
                <div class="modal-historial-header">
                    <h3 class="modal-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Comentarios de Versión ${versionNumero}
                    </h3>
                    <button class="modal-close-btn" title="Cerrar">×</button>
                </div>
                <div class="modal-comentarios-categorized-content">
                    ${this.renderCategoriaComentarios('mejoras', 'Mejoras y Bugfixes', comentarios.mejoras || [])}
                    ${this.renderCategoriaComentarios('salidas', 'Salidas a Producción', comentarios.salidas || [])}
                    ${this.renderCategoriaComentarios('cambiosCaliente', 'Cambios en Caliente (CeC)', comentarios.cambiosCaliente || [])}
                    ${this.renderCategoriaComentarios('observaciones', 'Observaciones', comentarios.observaciones || [])}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary modal-cancel">Cancelar</button>
                    <button class="btn btn-primary modal-confirm">Guardar</button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            requestAnimationFrame(() => {
                overlay.classList.add('modal-show');
            });
            
            // Event listeners para botones de agregar/eliminar
            this.setupComentariosEventListeners(modal);
            
            const confirmBtn = modal.querySelector('.modal-confirm');
            const cancelBtn = modal.querySelector('.modal-cancel');
            const closeBtn = modal.querySelector('.modal-close-btn');
            
            const extractComentarios = () => {
                const result = {
                    mejoras: [],
                    salidas: [],
                    cambiosCaliente: [],
                    observaciones: []
                };
                
                ['mejoras', 'salidas', 'cambiosCaliente', 'observaciones'].forEach(categoria => {
                    const container = modal.querySelector(`[data-categoria="${categoria}"]`);
                    const inputs = container.querySelectorAll('.comentario-cat-item input');
                    inputs.forEach(input => {
                        if (input.value.trim()) {
                            result[categoria].push(input.value.trim());
                        }
                    });
                });
                
                return result;
            };
            
            const close = (result, saveData = false) => {
                overlay.classList.remove('modal-show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(saveData ? extractComentarios() : null);
                }, 300);
            };
            
            confirmBtn.addEventListener('click', () => close(true, true));
            cancelBtn.addEventListener('click', () => close(false, false));
            closeBtn.addEventListener('click', () => close(false, false));
            
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    close(false, false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }
    
    static renderCategoriaComentarios(categoria, titulo, items) {
        const iconos = {
            'mejoras': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"></path>
                <path d="M8.5 2h7"></path>
                <path d="M7 16h10"></path>
            </svg>`,
            'salidas': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>`,
            'cambiosCaliente': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>`,
            'observaciones': `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>`
        };
        
        const itemsHTML = items.map((item, index) => `
            <div class="comentario-cat-item" data-index="${index}">
                <input type="text" value="${item}" placeholder="Escribe aquí...">
                <button class="btn-comentario-cat btn-remove" data-action="remove">×</button>
            </div>
        `).join('');
        
        return `
            <div class="comentario-categoria" data-categoria="${categoria}">
                <div class="comentario-categoria-header">
                    ${iconos[categoria]}
                    <span class="comentario-categoria-titulo">${titulo}</span>
                    <button class="btn-comentario-cat btn-add" data-action="add">+</button>
                </div>
                <div class="comentario-categoria-items">
                    ${itemsHTML || '<div class="comentario-empty">Sin elementos</div>'}
                </div>
            </div>
        `;
    }
    
    static setupComentariosEventListeners(modal) {
        modal.addEventListener('click', (e) => {
            const btnAdd = e.target.closest('[data-action="add"]');
            if (btnAdd) {
                const categoria = btnAdd.closest('.comentario-categoria');
                const itemsContainer = categoria.querySelector('.comentario-categoria-items');
                
                // Eliminar mensaje de vacío si existe
                const emptyMsg = itemsContainer.querySelector('.comentario-empty');
                if (emptyMsg) emptyMsg.remove();
                
                // Agregar nuevo item
                const newIndex = itemsContainer.querySelectorAll('.comentario-cat-item').length;
                const newItem = document.createElement('div');
                newItem.className = 'comentario-cat-item';
                newItem.dataset.index = newIndex;
                newItem.innerHTML = `
                    <input type="text" value="" placeholder="Escribe aquí...">
                    <button class="btn-comentario-cat btn-remove" data-action="remove">×</button>
                `;
                itemsContainer.appendChild(newItem);
                
                // Focus en el nuevo input
                setTimeout(() => newItem.querySelector('input').focus(), 50);
                return;
            }
            
            const btnRemove = e.target.closest('[data-action="remove"]');
            if (btnRemove) {
                const item = btnRemove.closest('.comentario-cat-item');
                const categoria = btnRemove.closest('.comentario-categoria');
                const itemsContainer = categoria.querySelector('.comentario-categoria-items');
                
                item.remove();
                
                // Si no quedan items, mostrar mensaje
                if (itemsContainer.querySelectorAll('.comentario-cat-item').length === 0) {
                    itemsContainer.innerHTML = '<div class="comentario-empty">Sin elementos</div>';
                }
                return;
            }
        });
    }
    
    static renderHistorial(historial) {
        if (!historial || historial.length === 0) {
            return '<div class="historial-empty">No hay cambios registrados</div>';
        }
        
        const sorted = [...historial].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        return sorted.map(entry => {
            const fecha = new Date(entry.timestamp);
            const fechaFormateada = fecha.toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const icon = this.getHistorialIcon(entry.tipo);
            const mensaje = this.getHistorialMensaje(entry);
            
            return `
                <div class="historial-entry historial-tipo-${entry.tipo}">
                    <div class="historial-icon">${icon}</div>
                    <div class="historial-details">
                        <div class="historial-timestamp">${fechaFormateada}</div>
                        <div class="historial-message">${mensaje}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    static getHistorialIcon(tipo) {
        const icons = {
            creacion: '✨',
            estado: '🔄',
            responsable: '👤',
            nombre: '✏️',
            descripcion: '📝',
            observacion: '💬'
        };
        return icons[tipo] || '📌';
    }
    
    static getHistorialMensaje(entry) {
        switch(entry.tipo) {
            case 'creacion':
                return '<strong>CDU creado</strong>';
            case 'estado':
                return `Estado cambiado: <span class="historial-old">${entry.valorAnterior || 'Sin estado'}</span> → <span class="historial-new">${entry.valorNuevo}</span>`;
            case 'responsable':
                return `Responsable: <span class="historial-old">${entry.valorAnterior || 'Sin asignar'}</span> → <span class="historial-new">${entry.valorNuevo}</span>`;
            case 'nombre':
                return `Nombre: <span class="historial-old">${entry.valorAnterior || 'Sin nombre'}</span> → <span class="historial-new">${entry.valorNuevo}</span>`;
            case 'descripcion':
                return `Descripción actualizada`;
            case 'observacion':
                return `${entry.valorNuevo}`;
            default:
                return `Cambio en ${entry.tipo}`;
        }
    }
    
    static getIcon(type) {
        const icons = {
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>`,
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>`,
            confirm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>`
        };
        return icons[type] || icons.info;
    }
    
    static alert(message, title = 'Aviso') {
        return this.show({ message, title, type: 'info' });
    }
    
    static success(message, title = 'Éxito') {
        return this.show({ message, title, type: 'success' });
    }
    
    static error(message, title = 'Error') {
        return this.show({ message, title, type: 'error' });
    }
    
    static warning(message, title = 'Advertencia') {
        return this.show({ message, title, type: 'warning' });
    }
    
    static confirm(message, title = 'Confirmación') {
        return this.show({ message, title, type: 'confirm' });
    }
    
    // Modal de resumen de cambios pendientes
    static showChangesSummary(changes) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'modal modal-changes-summary';
            
            // Generar HTML de cambios
            const changesHTML = changes.map((change, index) => {
                // Diferenciar entre creación y modificación
                if (change.tipo === 'creacion') {
                    return `
                        <div class="change-item change-item-creation">
                            <div class="change-header">
                                <span class="change-number">#${index + 1}</span>
                                <span class="change-version">Versión ${change.versionNumero}</span>
                                <span class="change-type-badge">NUEVO</span>
                            </div>
                            <div class="change-details">
                                <div class="change-cdu-name">
                                    <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="12" y1="8" x2="12" y2="16"></line>
                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                    </svg>
                                    <strong>CDU Nuevo Creado</strong>
                                </div>
                                <div class="change-creation-note">
                                    Se creó un nuevo CDU con estado inicial: 
                                    <span class="estado-new">✨ En Desarrollo</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // Para cambios de estado
                const estadoIcon = this.getEstadoIconForSummary(change.valorNuevo);
                return `
                    <div class="change-item">
                        <div class="change-header">
                            <span class="change-number">#${index + 1}</span>
                            <span class="change-version">Versión ${change.versionNumero}</span>
                        </div>
                        <div class="change-details">
                            <div class="change-cdu-name">
                                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <strong>${change.cduNombre}</strong>
                            </div>
                            <div class="change-estado">
                                <span class="estado-old">${change.valorAnterior || 'Sin estado'}</span>
                                <svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                                <span class="estado-new">${estadoIcon} ${change.valorNuevo}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            modal.innerHTML = `
                <div class="modal-historial-header">
                    <h3 class="modal-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Confirmar Cambios
                    </h3>
                    <button class="modal-close-btn" title="Cerrar">×</button>
                </div>
                <div class="modal-changes-summary-info">
                    Se guardarán <strong>${changes.length}</strong> cambio${changes.length !== 1 ? 's' : ''} en total
                </div>
                <div class="modal-changes-summary-content">
                    ${changesHTML}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary modal-cancel">Cancelar</button>
                    <button class="btn btn-success modal-confirm">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Guardar Todo
                    </button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            requestAnimationFrame(() => {
                overlay.classList.add('modal-show');
            });
            
            const confirmBtn = modal.querySelector('.modal-confirm');
            const cancelBtn = modal.querySelector('.modal-cancel');
            const closeBtn = modal.querySelector('.modal-close-btn');
            
            const close = (result) => {
                overlay.classList.remove('modal-show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(result);
                }, 300);
            };
            
            confirmBtn.addEventListener('click', () => close(true));
            cancelBtn.addEventListener('click', () => close(false));
            closeBtn.addEventListener('click', () => close(false));
            
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    static getEstadoIconForSummary(estado) {
        const icons = {
            'En Desarrollo': '🔧',
            'Pendiente de Certificacion': '⏱️',
            'Certificado OK': '✅',
            'En Produccion': '⚡'
        };
        return icons[estado] || '📌';
    }
}