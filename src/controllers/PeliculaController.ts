import { Pelicula, PeliculaValidationError } from "../models/Pelicula";
import { CriterioOrden, FiltroEstado, FiltrosActivos, PeliculaModel } from "../models/PeliculaModel";
import { PeliculaView } from "../views/PeliculaView";
import { StorageService } from "../services/StorageService";

export class PeliculaController {
  private readonly model: PeliculaModel;

  private filtros: FiltrosActivos = {
    texto: "",
    genero: "",
    anio: "",
    estado: "todas",
  };
  private criterioOrden: CriterioOrden = "ninguno";

  constructor(private readonly view: PeliculaView, private readonly storage: StorageService) {
    this.model = new PeliculaModel(this.storage.cargar());
    this.registrarEventos();
    this.renderizarColeccion();
    this.renderizarResumen();
  }

  private registrarEventos(): void {
    this.view.onSubmitFormulario((datos, idEdicion) => {
      if (idEdicion) {
        this.handleUpdate(idEdicion, datos);
      } else {
        this.handleCreate(datos);
      }
    });

    this.view.onCancelarEdicion(() => this.view.limpiarFormulario());

    this.view.onBusqueda((texto) => {
      this.filtros = { ...this.filtros, texto };
      this.renderizarColeccion();
    });

    this.view.onFiltroGenero((genero) => {
      this.filtros = { ...this.filtros, genero };
      this.renderizarColeccion();
    });

    this.view.onFiltroAnio((anio) => {
      this.filtros = { ...this.filtros, anio };
      this.renderizarColeccion();
    });

    this.view.onFiltroEstado((estado: FiltroEstado) => {
      this.filtros = { ...this.filtros, estado };
      this.renderizarColeccion();
    });

    this.view.onOrdenar((criterio) => {
      this.criterioOrden = criterio;
      this.renderizarColeccion();
    });

    this.view.onCambioPestana((pestana) => {
      if (pestana === "resumen") this.renderizarResumen();
    });

    this.view.onAccionTarjeta((accion, id) => {
      if (accion === "editar") this.iniciarEdicion(id);
      if (accion === "eliminar") this.handleDelete(id);
      if (accion === "alternar-vista") this.alternarVista(id);
    });
  }

  // ----- CRUD -----

  private handleCreate(datos: {
    titulo: string;
    anio: number;
    genero: any;
    calificacion: number;
    comentario: string; posterUrl: string;
  }): void {
    this.view.limpiarErrores();
    try {
      const nueva = new Pelicula(datos);
      this.model.addPelicula(nueva);
      this.persistirYRenderizar();
      this.view.limpiarFormulario();
      this.view.mostrarMensaje(`"${nueva.titulo}" fue agregada a tu colección.`, "exito");
    } catch (error) {
      this.manejarErrorValidacion(error);
    }
  }

  private iniciarEdicion(id: string): void {
    const pelicula = this.model.buscarPorId(id);
    if (pelicula) this.view.cargarEnFormulario(pelicula);
  }

  private handleUpdate(
    id: string,
    datos: { titulo: string; anio: number; genero: any; calificacion: number; comentario: string; posterUrl: string }
  ): void {
    this.view.limpiarErrores();
    try {
      const actualizada = this.model.updatePelicula(id, datos);
      this.persistirYRenderizar();
      this.view.limpiarFormulario();
      this.view.mostrarMensaje(`"${actualizada.titulo}" fue actualizada.`, "exito");
    } catch (error) {
      this.manejarErrorValidacion(error);
    }
  }

  private handleDelete(id: string): void {
    const pelicula = this.model.buscarPorId(id);
    if (!pelicula) return;
    if (!this.view.confirmarEliminacion(pelicula.titulo)) return;
    this.model.deletePelicula(id);
    this.persistirYRenderizar();
    this.view.mostrarMensaje(`"${pelicula.titulo}" fue eliminada.`, "exito");
  }

  private alternarVista(id: string): void {
    this.model.alternarVista(id);
    this.persistirYRenderizar();
  }

  // ----- Orden + filtros combinados -----

  private handleSort(lista: Pelicula[]): Pelicula[] {
    return this.model.ordenarPor(lista, this.criterioOrden);
  }

  // ----- Render -----

  private persistirYRenderizar(): void {
    this.storage.guardar(this.model.getTodas());
    this.renderizarColeccion();
    this.renderizarResumen();
  }

  private renderizarColeccion(): void {
    const filtradas = this.model.aplicarFiltros(this.filtros);
    const ordenadas = this.handleSort(filtradas);
    this.view.actualizarFiltroAnio(this.model.getAniosDisponibles());
    this.view.renderizarLista(ordenadas, this.model.getTodas().length);
  }

  private renderizarResumen(): void {
    this.view.renderEstadisticas(this.model.getEstadisticas());
    this.view.renderTop5(this.model.getTop5());
    this.view.renderRecomendaciones(this.model.getRecomendaciones());
  }

  private manejarErrorValidacion(error: unknown): void {
    if (error instanceof PeliculaValidationError) {
      const texto = error.message.toLowerCase();
      const campo = texto.includes("título") && texto.includes("duplicad")
        ? "titulo"
        : texto.includes("título")
        ? "titulo"
        : texto.includes("año")
        ? "anio"
        : texto.includes("calificación")
        ? "calificacion"
        : texto.includes("imagen")
        ? "posterUrl"
        : texto.includes("comentario")
        ? "comentario"
        : "genero";
      this.view.mostrarErrorCampo(campo as any, error.message);
      this.view.mostrarMensaje(error.message, "error");
    } else {
      console.error(error);
      this.view.mostrarMensaje("Ocurrió un error inesperado.", "error");
    }
  }
}
