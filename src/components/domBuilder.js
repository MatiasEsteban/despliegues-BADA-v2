// domBuilder.js - Coordinador de componentes DOM (refactorizado)

import { VersionCard } from './cards/VersionCard.js';
import { CduRow } from './table/CduRow.js';
import { EstadoSelect } from './estados/EstadoSelect.js';

export class DOMBuilder {
    // Delegar a VersionCard
    static crearTarjetaVersion(version, onClickCallback, isEnProduccion = false) {
        return VersionCard.create(version, onClickCallback, isEnProduccion);
    }

    // Delegar a CduRow
    static crearFilaCDU(cdu) {
        return CduRow.create(cdu);
    }

    // Delegar a EstadoSelect
    static getEstadoIcon(estado) {
        return EstadoSelect.getEstadoIcon(estado);
    }

    static getEstadoClass(estado) {
        return EstadoSelect.getEstadoClass(estado);
    }

    // Mantener getRolIcon aquí por compatibilidad (usado en tableEvents)
    static getRolIcon(rol) {
        return CduRow.getRolIcon(rol);
    }

    // Método de actualización de estadísticas (sin cambios)
    static actualizarEstadisticas(stats) {
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-desarrollo').textContent = stats.desarrollo;
        document.getElementById('stat-pendiente').textContent = stats.pendiente;
        document.getElementById('stat-certificado').textContent = stats.certificado;
        document.getElementById('stat-produccion').textContent = stats.produccion;
    }
}