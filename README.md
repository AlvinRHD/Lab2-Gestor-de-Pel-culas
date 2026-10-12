## Arquitectura

El proyecto sigue estrictamente el patrón **MVC**

```
gestor-peliculas/
├── index.html
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── models/
│   │   └── Pelicula.ts
│   ├── views/
│   │   └── PeliculaView.ts
│   ├── controllers/
│   │   └── PeliculaController.ts
│   ├── services/
│   │   └── StorageService.ts
│   └── styles/
│       └── styles.css
└── README.md
```

## Cómo ejecutar el proyecto

Requiere [Node.js](https://nodejs.org/) 18 o superior.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm run dev
```

Luego abre la URL que indica la terminal (normalmente `http://localhost:5173`).

### Generar build de producción

```bash
npm run build   # compila TypeScript y genera /dist
npm run preview # sirve /dist localmente para probarlo
```