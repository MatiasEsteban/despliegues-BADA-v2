// eventHandlers.js - Manejo de eventos con versiones agrupadas

import { ExcelExporter } from './excelExporter.js';
import { ExcelImporter } from './excelImporter.js';

export class EventHandlers {
    constructor(dataStore, renderer) {
        this.dataStore = dataStore;
        this.renderer = renderer;
    }

    setupEventListeners() {
        this.setupThemeToggle();
        this.setupAgregarButton();
        this.setupNuevaVersionLimpiaButton();
        this.setupDuplicarVersionButton();
        this.setupCargarButton();
        this.setupDescargarButton();
        this.setupTablaEvents();
        
        console.log('✅ Event listeners configurados correctamente');
    }

    setupThemeToggle() {
        const btnTheme = document.getElementById('btn-theme-toggle');
        const sunIcon = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
        const moonIcon = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`;

        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        btnTheme.innerHTML = savedTheme === 'dark' ? sunIcon : moonIcon;

        btnTheme.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            btnTheme.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
        });
    }

    setupAgregarButton() {
        const btn = document.getElementById('btn-agregar');
        if (!btn) {
            console.error('❌ No se encontró el botón btn-agregar');
            return;
        }
        
        btn.addEventListener('click', () => {
            console.log('🔘 Click en Nuevo CDU');
            this.dataStore.addCduToLatestVersion();
            this.renderer.fullRender();
        });
        
        console.log('✅ Botón "Nuevo CDU" configurado');
    }

    setupNuevaVersionLimpiaButton() {
        const btn = document.getElementById('btn-nueva-version-limpia');
        if (!btn) {
            console.error('❌ No se encontró el botón btn-nueva-version-limpia');
            return;
        }
        
        btn.addEventListener('click', () => {
            console.log('🔘 Click en Nueva Versión Limpia');
            const version = this.dataStore.addNewEmptyVersion();
            alert(`Versión ${version.numero} creada. Ahora puedes agregar CDUs con el botón "Nuevo CDU".`);
            this.renderer.fullRender();
        });
        
        console.log('✅ Botón "Nueva Versión Limpia" configurado');
    }

    setupDuplicarVersionButton() {
        const btn = document.getElementById('btn-duplicar-version');
        if (!btn) {
            console.error('❌ No se encontró el botón btn-duplicar-version');
            return;
        }
        
        btn.addEventListener('click', () => {
            console.log('🔘 Click en Duplicar Última Versión');
            const versiones = this.dataStore.getAll();
            
            if (versiones.length === 0) {
                alert('No hay versiones para duplicar. Crea una nueva versión primero.');
                return;
            }
            
            // Duplicar la última versión
            const ultimaVersion = versiones[versiones.length - 1];
            const nuevaVersion = this.dataStore.duplicateVersion(ultimaVersion.id);
            
            alert(`Versión ${nuevaVersion.numero} creada como copia de la versión ${ultimaVersion.numero} con ${nuevaVersion.cdus.length} CDUs.`);
            this.renderer.fullRender();
        });
        
        console.log('✅ Botón "Duplicar Última Versión" configurado');
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
                const versiones = await ExcelImporter.importar(file);
                
                if (versiones.length === 0) {
                    alert('No se encontraron datos válidos en el archivo');
                    return;
                }

                let totalCdus = 0;
                versiones.forEach(v => totalCdus += v.cdus.length);

                const confirmacion = confirm(
                    `Se encontraron ${versiones.length} versiones con ${totalCdus} CDUs.\n¿Desea reemplazar los datos actuales?`
                );

                if (confirmacion) {
                    this.dataStore.replaceAll(versiones);
                    this.renderer.fullRender();
                    alert('Datos cargados exitosamente');
                }
            } catch (error) {
                alert('Error al cargar el archivo: ' + error.message);
                console.error(error);
            } finally {
                fileInput.value = '';
            }
        });
    }

    setupDescargarButton() {
        document.getElementById('btn-descargar').addEventListener('click', () => {
            ExcelExporter.exportar(this.dataStore.getAll());
        });
    }

    setupTablaEvents() {
        const tbody = document.getElementById('tabla-body');
        
        // Evento para actualizar datos cuando se editan campos
        tbody.addEventListener('input', (e) => {
            const campo = e.target.dataset.campo;
            if (!campo) return;
            
            const valor = e.target.value;
            
            // Verificar si es un campo de versión o de CDU
            if (e.target.dataset.versionId) {
                const versionId = parseInt(e.target.dataset.versionId);
                this.dataStore.updateVersion(versionId, campo, valor);
            } else if (e.target.dataset.cduId) {
                const cduId = parseInt(e.target.dataset.cduId);
                this.dataStore.updateCdu(cduId, campo, valor);
            }
        });

        // Evento para eliminar versiones o CDUs
        tbody.addEventListener('click', (e) => {
            const btnEliminar = e.target.closest('.btn-eliminar');
            if (!btnEliminar) return;
            
            const versionId = btnEliminar.dataset.versionId;
            const cduId = btnEliminar.dataset.cduId;
            
            if (versionId) {
                // Eliminar versión completa
                if (confirm('¿Está seguro de eliminar esta versión completa con todos sus CDUs?')) {
                    this.dataStore.deleteVersion(parseInt(versionId));
                    this.renderer.fullRender();
                }
            } else if (cduId) {
                // Eliminar solo el CDU
                if (confirm('¿Está seguro de eliminar este CDU?')) {
                    this.dataStore.deleteCdu(parseInt(cduId));
                    this.renderer.fullRender();
                }
            }
        });
    }
}