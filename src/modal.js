// modal.js - Sistema de modals personalizado con historial y comentarios

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
    
    // Modal para comentarios de versión
    static showComentariosVersion(versionNumero, comentariosActuales) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'modal modal-comentarios';
            
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
                <div class="modal-comentarios-content">
                    <label class="comentarios-label">Agrega notas generales sobre esta versión:</label>
                    <textarea class="comentarios-textarea" placeholder="Ej: Cambios de última hora por incidente en producción, issues conocidos, etc.">${comentariosActuales || ''}</textarea>
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
                modal.querySelector('.comentarios-textarea').focus();
            });
            
            const textarea = modal.querySelector('.comentarios-textarea');
            const confirmBtn = modal.querySelector('.modal-confirm');
            const cancelBtn = modal.querySelector('.modal-cancel');
            const closeBtn = modal.querySelector('.modal-close-btn');
            
            const close = (result, value = null) => {
                overlay.classList.remove('modal-show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(result ? value : null);
                }, 300);
            };
            
            confirmBtn.addEventListener('click', () => close(true, textarea.value));
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
    
    static renderHistorial(historial) {
        if (!historial || historial.length === 0) {
            return '<div class="historial-empty">No hay cambios registrados</div>';
        }
        
        // Ordenar de más reciente a más antiguo
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
                return `Responsable cambiado: <span class="historial-old">${entry.valorAnterior || 'Sin asignar'}</span> → <span class="historial-new">${entry.valorNuevo}</span>`;
            case 'nombre':
                return `Nombre cambiado: <span class="historial-old">${entry.valorAnterior || 'Sin nombre'}</span> → <span class="historial-new">${entry.valorNuevo}</span>`;
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
}