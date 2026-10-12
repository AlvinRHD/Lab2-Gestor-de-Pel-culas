import { Genero, GENEROS_DISPONIBLES, Pelicula } from "../models/Pelicula";

export type FiltroEstado = "todas" | "vistas" | "pendientes";

export interface DatosFormulario {
  titulo: string;
  anio: number;
  genero: Genero;
}

/**
 * PeliculaView: todo lo relacionado a DOM vive aquí.
 * El Controller nunca toca el DOM directamente, siempre pasa por esta clase.
 */
export class PeliculaView {
  private readonly form: HTMLFormElement;
  private readonly inputTitulo: HTMLInputElement;
  private readonly inputAnio: HTMLInputElement;
  private readonly selectGenero: HTMLSelectElement;
  private readonly inputId: HTMLInputElement; // id oculto para modo edición
  private readonly btnSubmit: HTMLButtonElement;
  private readonly btnCancelar: HTMLButtonElement;

  private readonly inputBusqueda: HTMLInputElement;
  private readonly selectFiltroGenero: HTMLSelectElement;
  private readonly botonesEstado: NodeListOf<HTMLButtonElement>;

  private readonly contenedorTarjetas: HTMLElement;
  private readonly mensajeVacio: HTMLElement;
  private readonly contadorResultados: HTMLElement;
  private readonly toast: HTMLElement;

  constructor() {
    this.form = this.el<HTMLFormElement>("#form-pelicula");
    this.inputTitulo = this.el<HTMLInputElement>("#campo-titulo");
    this.inputAnio = this.el<HTMLInputElement>("#campo-anio");
    this.selectGenero = this.el<HTMLSelectElement>("#campo-genero");
    this.inputId = this.el<HTMLInputElement>("#campo-id");
    this.btnSubmit = this.el<HTMLButtonElement>("#btn-submit");
    this.btnCancelar = this.el<HTMLButtonElement>("#btn-cancelar");

    this.inputBusqueda = this.el<HTMLInputElement>("#campo-busqueda");
    this.selectFiltroGenero = this.el<HTMLSelectElement>("#filtro-genero");
    this.botonesEstado = document.querySelectorAll<HTMLButtonElement>(
      "[data-filtro-estado]"
    );

    this.contenedorTarjetas = this.el<HTMLElement>("#contenedor-tarjetas");
    this.mensajeVacio = this.el<HTMLElement>("#mensaje-vacio");
    this.contadorResultados = this.el<HTMLElement>("#contador-resultados");
    this.toast = this.el<HTMLElement>("#toast");

    this.poblarSelect(this.selectGenero, true);
    this.poblarSelect(this.selectFiltroGenero, false);
  }

  private el<T extends HTMLElement>(selector: string): T {
    const encontrado = document.querySelector<T>(selector);
    if (!encontrado) {
      throw new Error(`No se encontró el elemento "${selector}" en el DOM.`);
    }
    return encontrado;
  }

  private poblarSelect(select: HTMLSelectElement, esFormulario: boolean): void {
    if (!esFormulario) {
      const opcionTodas = document.createElement("option");
      opcionTodas.value = "";
      opcionTodas.textContent = "Todos los géneros";
      select.appendChild(opcionTodas);
    }
    for (const genero of GENEROS_DISPONIBLES) {
      const opcion = document.createElement("option");
      opcion.value = genero;
      opcion.textContent = genero;
      select.appendChild(opcion);
    }
  }

  // ----- Eventos: el Controller se suscribe a través de estos métodos -----

  onSubmitFormulario(callback: (datos: DatosFormulario, idEdicion: string | null) => void): void {
    this.form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const datos: DatosFormulario = {
        titulo: this.inputTitulo.value,
        anio: Number(this.inputAnio.value),
        genero: this.selectGenero.value as Genero,
      };
      const idEdicion = this.inputId.value || null;
      callback(datos, idEdicion);
    });
  }

  onCancelarEdicion(callback: () => void): void {
    this.btnCancelar.addEventListener("click", () => callback());
  }

  onBusqueda(callback: (texto: string) => void): void {
    this.inputBusqueda.addEventListener("input", () => {
      callback(this.inputBusqueda.value);
    });
  }

  onFiltroGenero(callback: (genero: string) => void): void {
    this.selectFiltroGenero.addEventListener("change", () => {
      callback(this.selectFiltroGenero.value);
    });
  }

  onFiltroEstado(callback: (estado: FiltroEstado) => void): void {
    this.botonesEstado.forEach((boton) => {
      boton.addEventListener("click", () => {
        this.botonesEstado.forEach((b) => b.classList.remove("activo"));
        boton.classList.add("activo");
        callback(boton.dataset.filtroEstado as FiltroEstado);
      });
    });
  }

  // Delegación de eventos sobre el contenedor para editar/eliminar/alternar vista
  onAccionTarjeta(
    callback: (accion: "editar" | "eliminar" | "alternar-vista", id: string) => void
  ): void {
    this.contenedorTarjetas.addEventListener("click", (evento) => {
      const objetivo = evento.target as HTMLElement;
      const boton = objetivo.closest<HTMLElement>("[data-accion]");
      if (!boton) return;
      const accion = boton.dataset.accion as "editar" | "eliminar" | "alternar-vista";
      const id = boton.closest<HTMLElement>("[data-id]")?.dataset.id;
      if (accion && id) callback(accion, id);
    });
  }

  // ----- Renderizado -----

  renderizarLista(peliculas: Pelicula[], totalSinFiltrar: number): void {
    this.contenedorTarjetas.innerHTML = "";

    const hayResultados = peliculas.length > 0;
    this.mensajeVacio.hidden = hayResultados;
    this.mensajeVacio.textContent =
      totalSinFiltrar === 0
        ? "Aún no has registrado películas. Agrega la primera con el formulario."
        : "Ninguna película coincide con la búsqueda o los filtros aplicados.";

    this.contadorResultados.textContent =
      totalSinFiltrar === 0
        ? ""
        : `${peliculas.length} de ${totalSinFiltrar} película${totalSinFiltrar === 1 ? "" : "s"}`;

    const fragmento = document.createDocumentFragment();
    for (const pelicula of peliculas) {
      fragmento.appendChild(this.crearTarjeta(pelicula));
    }
    this.contenedorTarjetas.appendChild(fragmento);
  }

  private crearTarjeta(pelicula: Pelicula): HTMLElement {
    const tarjeta = document.createElement("article");
    tarjeta.className = `tarjeta ${pelicula.vista ? "tarjeta--vista" : ""}`;
    tarjeta.dataset.id = pelicula.id;

    tarjeta.innerHTML = `
      <div class="tarjeta__estado">
        <span class="etiqueta ${pelicula.vista ? "etiqueta--vista" : "etiqueta--pendiente"}">
          ${pelicula.vista ? "Vista" : "Pendiente"}
        </span>
      </div>
      <h3 class="tarjeta__titulo">${this.escapar(pelicula.titulo)}</h3>
      <p class="tarjeta__meta">${pelicula.anio} · ${this.escapar(pelicula.genero)}</p>
      <div class="tarjeta__acciones">
        <button type="button" data-accion="alternar-vista" class="btn btn--texto">
          ${pelicula.vista ? "Marcar pendiente" : "Marcar vista"}
        </button>
        <button type="button" data-accion="editar" class="btn btn--icono" aria-label="Editar película">Editar</button>
        <button type="button" data-accion="eliminar" class="btn btn--icono btn--peligro" aria-label="Eliminar película">Eliminar</button>
      </div>
    `;
    return tarjeta;
  }

  private escapar(texto: string): string {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  // ----- Formulario: estados y errores -----

  cargarEnFormulario(pelicula: Pelicula): void {
    this.inputId.value = pelicula.id;
    this.inputTitulo.value = pelicula.titulo;
    this.inputAnio.value = String(pelicula.anio);
    this.selectGenero.value = pelicula.genero;
    this.btnSubmit.textContent = "Guardar cambios";
    this.btnCancelar.hidden = false;
    this.inputTitulo.focus();
  }

  limpiarFormulario(): void {
    this.form.reset();
    this.inputId.value = "";
    this.btnSubmit.textContent = "Registrar película";
    this.btnCancelar.hidden = true;
    this.limpiarErrores();
  }

  mostrarErrorCampo(campo: "titulo" | "anio" | "genero", mensaje: string): void {
    const contenedorError = document.querySelector(`[data-error-para="${campo}"]`);
    if (contenedorError) contenedorError.textContent = mensaje;
    const input = { titulo: this.inputTitulo, anio: this.inputAnio, genero: this.selectGenero }[campo];
    input.classList.add("campo--invalido");
  }

  limpiarErrores(): void {
    document.querySelectorAll("[data-error-para]").forEach((nodo) => (nodo.textContent = ""));
    [this.inputTitulo, this.inputAnio, this.selectGenero].forEach((input) =>
      input.classList.remove("campo--invalido")
    );
  }

  mostrarMensaje(texto: string, tipo: "exito" | "error" = "exito"): void {
    this.toast.textContent = texto;
    this.toast.className = `toast toast--visible toast--${tipo}`;
    window.clearTimeout(Number(this.toast.dataset.timeoutId));
    const idTimeout = window.setTimeout(() => {
      this.toast.classList.remove("toast--visible");
    }, 2800);
    this.toast.dataset.timeoutId = String(idTimeout);
  }

  confirmarEliminacion(tituloPelicula: string): boolean {
    return window.confirm(`¿Eliminar "${tituloPelicula}" de tu colección?`);
  }
}
