  /**
   * Géneros permitidos para una película.
   */
  export type Genero =
    | "Acción"
    | "Comedia"
    | "Drama"
    | "Terror"
    | "Ciencia Ficción"
    | "Animación"
    | "Romance"
    | "Documental"
    | "Suspenso"
    | "Fantasía";

  export const GENEROS_DISPONIBLES: Genero[] = [
    "Acción",
    "Comedia",
    "Drama",
    "Terror",
    "Ciencia Ficción",
    "Animación",
    "Romance",
    "Documental",
    "Suspenso",
    "Fantasía",
  ];

  /** Calificación en estrellas, de 1 a 5. */
  export type Calificacion = 1 | 2 | 3 | 4 | 5;

  /** Forma en la que se persiste/transporta una película (datos planos). */
  export interface PeliculaDTO {
    id: string;
    titulo: string;
    anio: number;
    genero: Genero;
    vista: boolean;
    calificacion: Calificacion;
    comentario: string;
    posterUrl: string;
  }

  /**
   * Error de validación específico del dominio de Pelicula.
   * Se usa para poder distinguirlo de otros errores en la capa Controller/View.
   */
  export class PeliculaValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "PeliculaValidationError";
    }
  }

  const COMENTARIO_MAX = 240;

  /**
   * Entidad Pelicula: encapsula los datos y las reglas de validación.
   */
  export class Pelicula {
    readonly id: string;
    private _titulo: string;
    private _anio: number;
    private _genero: Genero;
    private _vista: boolean;
    private _calificacion: Calificacion;
    private _comentario: string;
    private _posterUrl: string;

    constructor(datos: {
      id?: string;
      titulo: string;
      anio: number;
      genero: Genero;
      vista?: boolean;
      calificacion: number;
      comentario?: string;
      posterUrl?: string;
    }) {
      Pelicula.validarTitulo(datos.titulo);
      Pelicula.validarAnio(datos.anio);
      Pelicula.validarGenero(datos.genero);
      Pelicula.validarCalificacion(datos.calificacion);
      Pelicula.validarComentario(datos.comentario ?? "");
      Pelicula.validarPosterUrl(datos.posterUrl ?? "");

      this.id = datos.id ?? Pelicula.generarId();
      this._titulo = datos.titulo.trim();
      this._anio = datos.anio;
      this._genero = datos.genero;
      this._vista = datos.vista ?? false;
      this._calificacion = datos.calificacion as Calificacion;
      this._comentario = (datos.comentario ?? "").trim();
      this._posterUrl = (datos.posterUrl ?? "").trim();
    }

    // ----- Validaciones estáticas (reutilizables desde la View para feedback en vivo) -----

    static validarTitulo(titulo: string): void {
      if (!titulo || titulo.trim().length < 1) {
        throw new PeliculaValidationError("El título es obligatorio.");
      }
      if (titulo.trim().length > 120) {
        throw new PeliculaValidationError(
          "El título no puede superar los 120 caracteres."
        );
      }
    }

    static validarAnio(anio: number): void {
      const anioActual = new Date().getFullYear();
      if (!Number.isInteger(anio)) {
        throw new PeliculaValidationError("El año debe ser un número entero.");
      }
      if (anio < 1888 || anio > anioActual + 1) {
        throw new PeliculaValidationError(
          `El año debe estar entre 1888 y ${anioActual + 1}.`
        );
      }
    }

    static validarGenero(genero: string): asserts genero is Genero {
      if (!GENEROS_DISPONIBLES.includes(genero as Genero)) {
        throw new PeliculaValidationError("Selecciona un género válido.");
      }
    }

    static validarCalificacion(calificacion: number): asserts calificacion is Calificacion {
      if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
        throw new PeliculaValidationError("La calificación debe ser un valor entero entre 1 y 5 estrellas.");
      }
    }

    static validarComentario(comentario: string): void {
      if (comentario.trim().length > COMENTARIO_MAX) {
        throw new PeliculaValidationError(
          `El comentario no puede superar los ${COMENTARIO_MAX} caracteres.`
        );
      }
    }

    /** La imagen es opcional: si se indica, debe ser una URL http(s) con pinta de imagen. */
    static validarPosterUrl(posterUrl: string): void {
      const valor = posterUrl.trim();
      if (!valor) return;
      const formatoValido = /^https?:\/\/.+\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(valor);
      if (!formatoValido) {
        throw new PeliculaValidationError(
          "La imagen debe ser una URL http(s) que termine en .jpg, .png, .webp, .gif o .avif."
        );
      }
    }

    private static generarId(): string {
      return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `pelicula-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    // ----- Getters -----

    get titulo(): string {
      return this._titulo;
    }

    get anio(): number {
      return this._anio;
    }

    get genero(): Genero {
      return this._genero;
    }

    get vista(): boolean {
      return this._vista;
    }

    get calificacion(): Calificacion {
      return this._calificacion;
    }

    get comentario(): string {
      return this._comentario;
    }

    get posterUrl(): string {
      return this._posterUrl;
    }

    // ----- Mutaciones controladas -----

    actualizar(datos: {
      titulo: string;
      anio: number;
      genero: Genero;
      calificacion: number;
      comentario?: string;
      posterUrl?: string;
    }): void {
      Pelicula.validarTitulo(datos.titulo);
      Pelicula.validarAnio(datos.anio);
      Pelicula.validarGenero(datos.genero);
      Pelicula.validarCalificacion(datos.calificacion);
      Pelicula.validarComentario(datos.comentario ?? "");
      Pelicula.validarPosterUrl(datos.posterUrl ?? "");

      this._titulo = datos.titulo.trim();
      this._anio = datos.anio;
      this._genero = datos.genero;
      this._calificacion = datos.calificacion as Calificacion;
      this._comentario = (datos.comentario ?? "").trim();
      this._posterUrl = (datos.posterUrl ?? "").trim();
    }

    alternarVista(): void {
      this._vista = !this._vista;
    }

    /** Coincide con otra película por título (sin distinguir mayúsculas/espacios) y año. */
    esDuplicadaDe(titulo: string, anio: number): boolean {
      return (
        this._titulo.trim().toLowerCase() === titulo.trim().toLowerCase() &&
        this._anio === anio
      );
    }

    toDTO(): PeliculaDTO {
      return {
        id: this.id,
        titulo: this._titulo,
        anio: this._anio,
        genero: this._genero,
        vista: this._vista,
        calificacion: this._calificacion,
        comentario: this._comentario,
        posterUrl: this._posterUrl,
      };
    }

    static fromDTO(dto: PeliculaDTO): Pelicula {
      return new Pelicula({
        id: dto.id,
        titulo: dto.titulo,
        anio: dto.anio,
        genero: dto.genero,
        vista: dto.vista,
        calificacion: dto.calificacion ?? 3,
        comentario: dto.comentario ?? "",
        posterUrl: dto.posterUrl ?? "",
      });
    }
  }
