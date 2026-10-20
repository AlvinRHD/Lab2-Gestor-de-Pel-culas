import { Pelicula, PeliculaValidationError } from "./Pelicula";
import type { Genero } from "./Pelicula";

export type CriterioOrden = "titulo" | "anio" | "calificacion" | "ninguno";
export type FiltroEstado = "todas" | "vistas" | "pendientes";

export interface FiltrosActivos {
  texto: string;
  genero: string;
  anio: string;
  estado: FiltroEstado;
}

export interface EstadisticasColeccion {
  total: number;
  vistas: number;
  pendientes: number;
  promedioCalificacion: number;
}

/**
 * PeliculaModel: responsable de la COLECCIÓN de películas (no de una película
 * individual, eso lo resuelve la clase Pelicula). Agrupa el CRUD a nivel de
 * lista, las reglas de duplicados, filtros, ordenamiento y estadísticas.
 * El Controller nunca manipula el arreglo de películas directamente.
 */
export class PeliculaModel {
  private peliculas: Pelicula[];

  constructor(peliculasIniciales: Pelicula[] = []) {
    this.peliculas = peliculasIniciales;
  }

  getTodas(): Pelicula[] {
    return [...this.peliculas];
  }

  buscarPorId(id: string): Pelicula | undefined {
    return this.peliculas.find((p) => p.id === id);
  }

  /** RF: impedir registros duplicados (mismo título + mismo año). */
  existeDuplicado(titulo: string, anio: number, idExcluir?: string): boolean {
    return this.peliculas.some(
      (p) => p.id !== idExcluir && p.esDuplicadaDe(titulo, anio)
    );
  }

  addPelicula(pelicula: Pelicula): void {
    if (this.existeDuplicado(pelicula.titulo, pelicula.anio)) {
      throw new PeliculaValidationError(
        "Ya existe una película registrada con ese título y año."
      );
    }
    this.peliculas.push(pelicula);
  }

  updatePelicula(
    id: string,
    datos: { titulo: string; anio: number; genero: Genero; calificacion: number; comentario?: string; posterUrl?: string }
  ): Pelicula {
    const pelicula = this.buscarPorId(id);
    if (!pelicula) {
      throw new PeliculaValidationError("La película que intentas editar ya no existe.");
    }
    if (this.existeDuplicado(datos.titulo, datos.anio, id)) {
      throw new PeliculaValidationError(
        "Ya existe otra película registrada con ese título y año."
      );
    }
    pelicula.actualizar(datos);
    return pelicula;
  }

  deletePelicula(id: string): Pelicula | undefined {
    const pelicula = this.buscarPorId(id);
    if (!pelicula) return undefined;
    this.peliculas = this.peliculas.filter((p) => p.id !== id);
    return pelicula;
  }

  alternarVista(id: string): Pelicula | undefined {
    const pelicula = this.buscarPorId(id);
    pelicula?.alternarVista();
    return pelicula;
  }

  // ----- Filtros (se combinan entre sí) -----

  filterByGenero(lista: Pelicula[], genero: string): Pelicula[] {
    if (!genero) return lista;
    return lista.filter((p) => p.genero === genero);
  }

  filterByAnio(lista: Pelicula[], anio: string): Pelicula[] {
    if (!anio) return lista;
    return lista.filter((p) => String(p.anio) === anio);
  }

  filterByEstado(lista: Pelicula[], estado: FiltroEstado): Pelicula[] {
    if (estado === "todas") return lista;
    return lista.filter((p) => (estado === "vistas" ? p.vista : !p.vista));
  }

  filterByTexto(lista: Pelicula[], texto: string): Pelicula[] {
    const termino = texto.trim().toLowerCase();
    if (!termino) return lista;
    return lista.filter(
      (p) =>
        p.titulo.toLowerCase().includes(termino) ||
        p.genero.toLowerCase().includes(termino)
    );
  }

  /** Aplica búsqueda de texto + los tres filtros de forma combinada. */
  aplicarFiltros(filtros: FiltrosActivos): Pelicula[] {
    let resultado = this.getTodas();
    resultado = this.filterByTexto(resultado, filtros.texto);
    resultado = this.filterByGenero(resultado, filtros.genero);
    resultado = this.filterByAnio(resultado, filtros.anio);
    resultado = this.filterByEstado(resultado, filtros.estado);
    return resultado;
  }

  // ----- Orden -----

  sortByTitulo(lista: Pelicula[]): Pelicula[] {
    return [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  }

  sortByAnio(lista: Pelicula[]): Pelicula[] {
    return [...lista].sort((a, b) => b.anio - a.anio);
  }

  sortByCalificacion(lista: Pelicula[]): Pelicula[] {
    return [...lista].sort((a, b) => b.calificacion - a.calificacion);
  }

  ordenarPor(lista: Pelicula[], criterio: CriterioOrden): Pelicula[] {
    switch (criterio) {
      case "titulo":
        return this.sortByTitulo(lista);
      case "anio":
        return this.sortByAnio(lista);
      case "calificacion":
        return this.sortByCalificacion(lista);
      default:
        return lista;
    }
  }

  // ----- Datos derivados -----

  getAniosDisponibles(): number[] {
    const anios = new Set(this.peliculas.map((p) => p.anio));
    return [...anios].sort((a, b) => b - a);
  }

  getEstadisticas(): EstadisticasColeccion {
    const total = this.peliculas.length;
    const vistas = this.peliculas.filter((p) => p.vista).length;
    const sumaCalificaciones = this.peliculas.reduce((acc, p) => acc + p.calificacion, 0);
    return {
      total,
      vistas,
      pendientes: total - vistas,
      promedioCalificacion: total === 0 ? 0 : Number((sumaCalificaciones / total).toFixed(1)),
    };
  }

  /** Reto adicional: Top 5 de mejores películas según calificación. */
  getTop5(): Pelicula[] {
    return this.sortByCalificacion(this.getTodas()).slice(0, 5);
  }

  /** RF-08: recomienda, de lo pendiente, lo mejor calificado (4 o 5 estrellas). */
  getRecomendaciones(): Pelicula[] {
    return this.sortByCalificacion(
      this.peliculas.filter((p) => !p.vista && p.calificacion >= 4)
    ).slice(0, 5);
  }
}
