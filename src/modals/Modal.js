// Modal.js - Facade unificado para todos los modals

import { ConfirmModal } from './ConfirmModal.js';
import { HistorialModal } from './HistorialModal.js';
import { ComentariosModal } from './ComentariosModal.js';
import { ChangesModal } from './ChangesModal.js';
import { ModalBase } from './ModalBase.js';

/**
 * Clase Facade que expone todos los modals con la misma interfaz que antes
 * Esto mantiene compatibilidad con el código existente
 */
export class Modal {
    // Métodos de confirmación simple
    static show(options) {
        return ModalBase.show(options);
    }

    static confirm(message, title) {
        return ConfirmModal.confirm(message, title);
    }

    static alert(message, title) {
        return ConfirmModal.alert(message, title);
    }

    static success(message, title) {
        return ConfirmModal.success(message, title);
    }

    static error(message, title) {
        return ConfirmModal.error(message, title);
    }

    static warning(message, title) {
        return ConfirmModal.warning(message, title);
    }

    // Modal de historial
    static showHistorial(cduNombre, historial) {
        return HistorialModal.show(cduNombre, historial);
    }

    // Modal de comentarios
    static showComentariosVersion(versionNumero, comentariosActuales) {
        return ComentariosModal.show(versionNumero, comentariosActuales);
    }

    // Modal de resumen de cambios
    static showChangesSummary(changes) {
        return ChangesModal.show(changes);
    }
}