import { Pelicula, PeliculaDTO } from "../models/Pelicula";

/**
 * StorageService: única responsabilidad de leer/escribir en localStorage.
 * Nadie más en la app debe tocar localStorage directamente.
 */
export class StorageService {
  private readonly clave: string;

  constructor(clave = "gestor-peliculas:v1") {
    this.clave = clave;
  }

  guardar(peliculas: Pelicula[]): void {
    const dtos: PeliculaDTO[] = peliculas.map((p) => p.toDTO());
    try {
      localStorage.setItem(this.clave, JSON.stringify(dtos));
    } catch (error) {
      console.error("No se pudo guardar en localStorage:", error);
    }
  }

  cargar(): Pelicula[] {
    try {
      const crudo = localStorage.getItem(this.clave);
      if (!crudo) return [];
      const dtos: PeliculaDTO[] = JSON.parse(crudo);
      return dtos
        .map((dto) => {
          try {
            return Pelicula.fromDTO(dto);
          } catch {
            // Si un registro quedó corrupto, se omite en vez de romper la app.
            return null;
          }
        })
        .filter((p): p is Pelicula => p !== null);
    } catch (error) {
      console.error("No se pudo leer localStorage, se inicia vacío:", error);
      return [];
    }
  }

  limpiar(): void {
    localStorage.removeItem(this.clave);
  }
}
