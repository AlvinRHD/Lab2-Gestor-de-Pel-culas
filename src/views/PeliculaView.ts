import { Genero, GENEROS_DISPONIBLES, Pelicula } from "../models/Pelicula";
import { CriterioOrden, EstadisticasColeccion, FiltroEstado } from "../models/PeliculaModel";

export interface DatosFormulario {
  titulo: string;
  anio: number;
  genero: Genero;
  calificacion: number;
  comentario: string;
  posterUrl: string;
}

export type Pestana = "coleccion" | "resumen";

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
  private readonly inputComentario: HTMLTextAreaElement;
  private readonly inputPoster: HTMLInputElement;
  private readonly inputCalificacion: HTMLInputElement; // hidden, guarda 1-5
  private readonly contenedorEstrellasForm: HTMLElement;
  private readonly btnSubmit: HTMLButtonElement;
  private readonly btnCancelar: HTMLButtonElement;

  private readonly inputBusqueda: HTMLInputElement;
  private readonly selectFiltroGenero: HTMLSelectElement;
  private readonly selectFiltroAnio: HTMLSelectElement;
  private readonly selectOrdenar: HTMLSelectElement;
  private readonly botonesEstado: NodeListOf<HTMLButtonElement>;

  private readonly contenedorTarjetas: HTMLElement;
  private readonly mensajeVacio: HTMLElement;
  private readonly contadorResultados: HTMLElement;
  private readonly toast: HTMLElement;

  private readonly botonesPestana: NodeListOf<HTMLButtonElement>;
  private readonly panelColeccion: HTMLElement;
  private readonly panelResumen: HTMLElement;
  private readonly statTotal: HTMLElement;
  private readonly statVistas: HTMLElement;
  private readonly statPendientes: HTMLElement;
  private readonly statPromedio: HTMLElement;
  private readonly listaTop5: HTMLElement;
  private readonly listaRecomendaciones: HTMLElement;
  private readonly mensajeRecomendaciones: HTMLElement;

  constructor() {
    this.form = this.el<HTMLFormElement>("#form-pelicula");
    this.inputTitulo = this.el<HTMLInputElement>("#campo-titulo");
    this.inputAnio = this.el<HTMLInputElement>("#campo-anio");
    this.selectGenero = this.el<HTMLSelectElement>("#campo-genero");
    this.inputId = this.el<HTMLInputElement>("#campo-id");
    this.inputComentario = this.el<HTMLTextAreaElement>("#campo-comentario");
    this.inputPoster = this.el<HTMLInputElement>("#campo-poster");
    this.inputCalificacion = this.el<HTMLInputElement>("#campo-calificacion");
    this.contenedorEstrellasForm = this.el<HTMLElement>("#estrellas-form");
    this.btnSubmit = this.el<HTMLButtonElement>("#btn-submit");
    this.btnCancelar = this.el<HTMLButtonElement>("#btn-cancelar");

    this.inputBusqueda = this.el<HTMLInputElement>("#campo-busqueda");
    this.selectFiltroGenero = this.el<HTMLSelectElement>("#filtro-genero");
    this.selectFiltroAnio = this.el<HTMLSelectElement>("#filtro-anio");
    this.selectOrdenar = this.el<HTMLSelectElement>("#ordenar-por");
    this.botonesEstado = document.querySelectorAll<HTMLButtonElement>(
      "[data-filtro-estado]"
    );

    this.contenedorTarjetas = this.el<HTMLElement>("#contenedor-tarjetas");
    this.mensajeVacio = this.el<HTMLElement>("#mensaje-vacio");
    this.contadorResultados = this.el<HTMLElement>("#contador-resultados");
    this.toast = this.el<HTMLElement>("#toast");

    this.botonesPestana = document.querySelectorAll<HTMLButtonElement>("[data-pestana]");
    this.panelColeccion = this.el<HTMLElement>("#panel-coleccion");
    this.panelResumen = this.el<HTMLElement>("#panel-resumen");
    this.statTotal = this.el<HTMLElement>("#stat-total");
    this.statVistas = this.el<HTMLElement>("#stat-vistas");
    this.statPendientes = this.el<HTMLElement>("#stat-pendientes");
    this.statPromedio = this.el<HTMLElement>("#stat-promedio");
    this.listaTop5 = this.el<HTMLElement>("#lista-top5");
    this.listaRecomendaciones = this.el<HTMLElement>("#lista-recomendaciones");
    this.mensajeRecomendaciones = this.el<HTMLElement>("#mensaje-recomendaciones");

    this.poblarSelect(this.selectGenero, true);
    this.poblarSelect(this.selectFiltroGenero, false);
    this.inicializarEstrellasFormulario();
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

  /** RF-04: el filtro de año se recalcula según los años realmente registrados. */
  actualizarFiltroAnio(aniosDisponibles: number[]): void {
    const valorActual = this.selectFiltroAnio.value;
    this.selectFiltroAnio.innerHTML = "";

    const opcionTodos = document.createElement("option");
    opcionTodos.value = "";
    opcionTodos.textContent = "Todos los años";
    this.selectFiltroAnio.appendChild(opcionTodos);

    for (const anio of aniosDisponibles) {
      const opcion = document.createElement("option");
      opcion.value = String(anio);
      opcion.textContent = String(anio);
      this.selectFiltroAnio.appendChild(opcion);
    }

    if (aniosDisponibles.some((a) => String(a) === valorActual)) {
      this.selectFiltroAnio.value = valorActual;
    }
  }

  // ----- Estrellas interactivas del formulario -----

  private inicializarEstrellasFormulario(): void {
    for (let valor = 1; valor <= 5; valor++) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "estrella";
      boton.dataset.valor = String(valor);
      boton.setAttribute("aria-label", `${valor} estrella${valor > 1 ? "s" : ""}`);
      boton.textContent = "★";
      boton.addEventListener("click", () => {
        this.inputCalificacion.value = String(valor);
        this.pintarEstrellasFormulario(valor);
      });
      this.contenedorEstrellasForm.appendChild(boton);
    }
    this.pintarEstrellasFormulario(0);
  }

  private pintarEstrellasFormulario(valor: number): void {
    const botones = this.contenedorEstrellasForm.querySelectorAll<HTMLButtonElement>(".estrella");
    botones.forEach((boton) => {
      const esta = Number(boton.dataset.valor) <= valor;
      boton.classList.toggle("estrella--activa", esta);
    });
  }

  private renderEstrellas(valor: number): string {
    return Array.from({ length: 5 }, (_, i) =>
      i < valor ? "★" : "☆"
    ).join("");
  }

  // ----- Eventos: el Controller se suscribe a través de estos métodos -----

  onSubmitFormulario(callback: (datos: DatosFormulario, idEdicion: string | null) => void): void {
    this.form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const datos: DatosFormulario = {
        titulo: this.inputTitulo.value,
        anio: Number(this.inputAnio.value),
        genero: this.selectGenero.value as Genero,
        calificacion: Number(this.inputCalificacion.value || 0),
        comentario: this.inputComentario.value,
        posterUrl: this.inputPoster.value,
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

  onFiltroAnio(callback: (anio: string) => void): void {
    this.selectFiltroAnio.addEventListener("change", () => {
      callback(this.selectFiltroAnio.value);
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

  onOrdenar(callback: (criterio: CriterioOrden) => void): void {
    this.selectOrdenar.addEventListener("change", () => {
      callback(this.selectOrdenar.value as CriterioOrden);
    });
  }

  onCambioPestana(callback: (pestana: Pestana) => void): void {
    this.botonesPestana.forEach((boton) => {
      boton.addEventListener("click", () => {
        const pestana = boton.dataset.pestana as Pestana;
        this.botonesPestana.forEach((b) => b.classList.remove("activo"));
        boton.classList.add("activo");
        this.panelColeccion.hidden = pestana !== "coleccion";
        this.panelResumen.hidden = pestana !== "resumen";
        callback(pestana);
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

  // ----- Renderizado: colección -----

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
      <div class="tarjeta__poster">
        ${
          pelicula.posterUrl
            ? `<img src="${this.escapar(pelicula.posterUrl)}" alt="Póster de ${this.escapar(pelicula.titulo)}" loading="lazy" onerror="this.closest('.tarjeta__poster').classList.add('tarjeta__poster--error')" />`
            : `<span class="tarjeta__poster-letra">${this.escapar(pelicula.titulo.charAt(0).toUpperCase())}</span>`
        }
        <span class="etiqueta ${pelicula.vista ? "etiqueta--vista" : "etiqueta--pendiente"}">
          ${pelicula.vista ? "Vista" : "Pendiente"}
        </span>
      </div>
      <h3 class="tarjeta__titulo">${this.escapar(pelicula.titulo)}</h3>
      <p class="tarjeta__meta">${pelicula.anio} -${this.escapar(pelicula.genero)}</p>
      <p class="tarjeta__estrellas" aria-label="Calificación: ${pelicula.calificacion} de 5">
        ${this.renderEstrellas(pelicula.calificacion)}
      </p>
      ${
        pelicula.comentario
          ? `<p class="tarjeta__comentario">${this.escapar(pelicula.comentario)}</p>`
          : ""
      }
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

  // ----- Renderizado: resumen (estadísticas, top 5, recomendaciones) -----

  renderEstadisticas(stats: EstadisticasColeccion): void {
    this.statTotal.textContent = String(stats.total);
    this.statVistas.textContent = String(stats.vistas);
    this.statPendientes.textContent = String(stats.pendientes);
    this.statPromedio.textContent = stats.total === 0 ? "-" : `${stats.promedioCalificacion} ★`;
  }

  renderTop5(peliculas: Pelicula[]): void {
    this.listaTop5.innerHTML = "";
    if (peliculas.length === 0) {
      this.listaTop5.innerHTML = `<li class="lista-vacia">Registra películas para ver tu top 5.</li>`;
      return;
    }
    peliculas.forEach((pelicula, indice) => {
      const item = document.createElement("li");
      item.className = "fila-ranking";
      item.innerHTML = `
        <span class="fila-ranking__puesto">${indice + 1}</span>
        <span class="fila-ranking__titulo">${this.escapar(pelicula.titulo)} <span class="fila-ranking__meta">(${pelicula.anio})</span></span>
        <span class="fila-ranking__estrellas">${this.renderEstrellas(pelicula.calificacion)}</span>
      `;
      this.listaTop5.appendChild(item);
    });
  }

  renderRecomendaciones(peliculas: Pelicula[]): void {
    this.listaRecomendaciones.innerHTML = "";
    const hay = peliculas.length > 0;
    this.mensajeRecomendaciones.hidden = hay;
    peliculas.forEach((pelicula) => {
      const item = document.createElement("li");
      item.className = "fila-ranking";
      item.innerHTML = `
        <span class="fila-ranking__titulo">${this.escapar(pelicula.titulo)} <span class="fila-ranking__meta">-${this.escapar(pelicula.genero)}</span></span>
        <span class="fila-ranking__estrellas">${this.renderEstrellas(pelicula.calificacion)}</span>
      `;
      this.listaRecomendaciones.appendChild(item);
    });
  }

  // ----- Formulario: estados y errores -----

  cargarEnFormulario(pelicula: Pelicula): void {
    this.inputId.value = pelicula.id;
    this.inputTitulo.value = pelicula.titulo;
    this.inputAnio.value = String(pelicula.anio);
    this.selectGenero.value = pelicula.genero;
    this.inputComentario.value = pelicula.comentario;
    this.inputPoster.value = pelicula.posterUrl;
    this.inputCalificacion.value = String(pelicula.calificacion);
    this.pintarEstrellasFormulario(pelicula.calificacion);
    this.btnSubmit.textContent = "Actualizar película";
    this.btnCancelar.hidden = false;
    this.inputTitulo.focus();
  }

  limpiarFormulario(): void {
    this.form.reset();
    this.inputId.value = "";
    this.inputCalificacion.value = "";
    this.pintarEstrellasFormulario(0);
    this.btnSubmit.textContent = "Registrar película";
    this.btnCancelar.hidden = true;
    this.limpiarErrores();
  }

  mostrarErrorCampo(
    campo: "titulo" | "anio" | "genero" | "calificacion" | "comentario" | "posterUrl",
    mensaje: string
  ): void {
    const contenedorError = document.querySelector(`[data-error-para="${campo}"]`);
    if (contenedorError) contenedorError.textContent = mensaje;
    if (campo === "calificacion") {
      this.contenedorEstrellasForm.classList.add("campo--invalido");
      return;
    }
    const input = {
      titulo: this.inputTitulo,
      anio: this.inputAnio,
      genero: this.selectGenero,
      comentario: this.inputComentario,
      posterUrl: this.inputPoster,
    }[campo];
    input.classList.add("campo--invalido");
  }

  limpiarErrores(): void {
    document.querySelectorAll("[data-error-para]").forEach((nodo) => (nodo.textContent = ""));
    [this.inputTitulo, this.inputAnio, this.selectGenero, this.inputComentario, this.inputPoster].forEach(
      (input) => input.classList.remove("campo--invalido")
    );
    this.contenedorEstrellasForm.classList.remove("campo--invalido");
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
