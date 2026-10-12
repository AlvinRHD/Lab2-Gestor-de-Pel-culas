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

/** Forma en la que se persiste/transporta una película (datos planos). */
export interface PeliculaDTO {
  id: string;
  titulo: string;
  anio: number;
  genero: Genero;
  vista: boolean;
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

/**
 * Entidad Pelicula: encapsula los datos y las reglas de validación.
 */
export class Pelicula {
  readonly id: string;
  private _titulo: string;
  private _anio: number;
  private _genero: Genero;
  private _vista: boolean;

  constructor(datos: {
    id?: string;
    titulo: string;
    anio: number;
    genero: Genero;
    vista?: boolean;
  }) {
    Pelicula.validarTitulo(datos.titulo);
    Pelicula.validarAnio(datos.anio);
    Pelicula.validarGenero(datos.genero);

    this.id = datos.id ?? Pelicula.generarId();
    this._titulo = datos.titulo.trim();
    this._anio = datos.anio;
    this._genero = datos.genero;
    this._vista = datos.vista ?? false;
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

  // ----- Mutaciones controladas -----

  actualizar(datos: { titulo: string; anio: number; genero: Genero }): void {
    Pelicula.validarTitulo(datos.titulo);
    Pelicula.validarAnio(datos.anio);
    Pelicula.validarGenero(datos.genero);
    this._titulo = datos.titulo.trim();
    this._anio = datos.anio;
    this._genero = datos.genero;
  }

  alternarVista(): void {
    this._vista = !this._vista;
  }

  toDTO(): PeliculaDTO {
    return {
      id: this.id,
      titulo: this._titulo,
      anio: this._anio,
      genero: this._genero,
      vista: this._vista,
    };
  }

  static fromDTO(dto: PeliculaDTO): Pelicula {
    return new Pelicula({
      id: dto.id,
      titulo: dto.titulo,
      anio: dto.anio,
      genero: dto.genero,
      vista: dto.vista,
    });
  }
}
