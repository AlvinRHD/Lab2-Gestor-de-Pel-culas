import { Pelicula, PeliculaValidationError } from "../models/Pelicula";
import { FiltroEstado, PeliculaView } from "../views/PeliculaView";
import { StorageService } from "../services/StorageService";

export class PeliculaController {
  private peliculas: Pelicula[] = [];

  private textoBusqueda = "";
  private generoFiltro = "";
  private estadoFiltro: FiltroEstado = "todas";

  constructor(private readonly view: PeliculaView, private readonly storage: StorageService) {
    this.peliculas = this.storage.cargar();
    this.registrarEventos();
    this.renderizar();
  }

  private registrarEventos(): void {
    this.view.onSubmitFormulario((datos, idEdicion) => {
      if (idEdicion) {
        this.editarPelicula(idEdicion, datos);
      } else {
        this.registrarPelicula(datos);
      }
    });

    this.view.onCancelarEdicion(() => this.view.limpiarFormulario());

    this.view.onBusqueda((texto) => {
      this.textoBusqueda = texto.trim().toLowerCase();
      this.renderizar();
    });

    this.view.onFiltroGenero((genero) => {
      this.generoFiltro = genero;
      this.renderizar();
    });

    this.view.onFiltroEstado((estado) => {
      this.estadoFiltro = estado;
      this.renderizar();
    });

    this.view.onAccionTarjeta((accion, id) => {
      if (accion === "editar") this.iniciarEdicion(id);
      if (accion === "eliminar") this.eliminarPelicula(id);
      if (accion === "alternar-vista") this.alternarVista(id);
    });
  }

  // ----- CRUD -----

  private registrarPelicula(datos: { titulo: string; anio: number; genero: any }): void {
    this.view.limpiarErrores();
    try {
      const nueva = new Pelicula(datos);
      this.peliculas.push(nueva);
      this.persistirYRenderizar();
      this.view.limpiarFormulario();
      this.view.mostrarMensaje(`"${nueva.titulo}" fue agregada a tu colección.`, "exito");
    } catch (error) {
      this.manejarErrorValidacion(error);
    }
  }

  private iniciarEdicion(id: string): void {
    const pelicula = this.buscarPorId(id);
    if (pelicula) this.view.cargarEnFormulario(pelicula);
  }

  private editarPelicula(id: string, datos: { titulo: string; anio: number; genero: any }): void {
    this.view.limpiarErrores();
    const pelicula = this.buscarPorId(id);
    if (!pelicula) return;
    try {
      pelicula.actualizar(datos);
      this.persistirYRenderizar();
      this.view.limpiarFormulario();
      this.view.mostrarMensaje(`"${pelicula.titulo}" fue actualizada.`, "exito");
    } catch (error) {
      this.manejarErrorValidacion(error);
    }
  }

  private eliminarPelicula(id: string): void {
    const pelicula = this.buscarPorId(id);
    if (!pelicula) return;
    if (!this.view.confirmarEliminacion(pelicula.titulo)) return;
    this.peliculas = this.peliculas.filter((p) => p.id !== id);
    this.persistirYRenderizar();
    this.view.mostrarMensaje(`"${pelicula.titulo}" fue eliminada.`, "exito");
  }

  private alternarVista(id: string): void {
    const pelicula = this.buscarPorId(id);
    if (!pelicula) return;
    pelicula.alternarVista();
    this.persistirYRenderizar();
  }

  private buscarPorId(id: string): Pelicula | undefined {
    return this.peliculas.find((p) => p.id === id);
  }

  // ----- Filtros / búsqueda -----

  private obtenerPeliculasFiltradas(): Pelicula[] {
    return this.peliculas.filter((p) => {
      const coincideTexto =
        this.textoBusqueda === "" ||
        p.titulo.toLowerCase().includes(this.textoBusqueda) ||
        p.genero.toLowerCase().includes(this.textoBusqueda);

      const coincideGenero = this.generoFiltro === "" || p.genero === this.generoFiltro;

      const coincideEstado =
        this.estadoFiltro === "todas" ||
        (this.estadoFiltro === "vistas" && p.vista) ||
        (this.estadoFiltro === "pendientes" && !p.vista);

      return coincideTexto && coincideGenero && coincideEstado;
    });
  }

  // ----- Utilidades internas -----

  private persistirYRenderizar(): void {
    this.storage.guardar(this.peliculas);
    this.renderizar();
  }

  private renderizar(): void {
    const filtradas = this.obtenerPeliculasFiltradas();
    this.view.renderizarLista(filtradas, this.peliculas.length);
  }

  private manejarErrorValidacion(error: unknown): void {
    if (error instanceof PeliculaValidationError) {
      const campo = error.message.toLowerCase().includes("título")
        ? "titulo"
        : error.message.toLowerCase().includes("año")
        ? "anio"
        : "genero";
      this.view.mostrarErrorCampo(campo as "titulo" | "anio" | "genero", error.message);
      this.view.mostrarMensaje(error.message, "error");
    } else {
      console.error(error);
      this.view.mostrarMensaje("Ocurrió un error inesperado.", "error");
    }
  }
}
