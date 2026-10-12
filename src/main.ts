import "./styles/styles.css";
import { PeliculaView } from "./views/PeliculaView";
import { PeliculaController } from "./controllers/PeliculaController";
import { StorageService } from "./services/StorageService";

document.addEventListener("DOMContentLoaded", () => {
  const view = new PeliculaView();
  const storage = new StorageService();
  new PeliculaController(view, storage);
});
