// modal.js - Sistema de modals personalizado

export class Modal {
    static show(options) {
        return new Promise((resolve) => {
            const {
                title = 'Aviso',
                message = '',
                type = 'info', // info, success, warning, error, confirm
                confirmText = 'Aceptar',
                cancelText = 'Cancelar'
            } = options;

            // Crear overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            // Crear modal
            const modal = document.createElement('div');
            modal.className = `modal modal-${type}`;
            
            // Icono según tipo
            const icon = this.getIcon(type);
            
            // Contenido del modal
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
            
            // Animación de entrada
            requestAnimationFrame(() => {
                overlay.classList.add('modal-show');
            });
            
            // Event listeners
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
            
            // Cerrar con ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    close(type === 'confirm' ? false : true);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
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
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <path d="M12 16v-4"></path>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>`
        };
        return icons[type] || icons.info;
    }
    
    // Métodos de conveniencia
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