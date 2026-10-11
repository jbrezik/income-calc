import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// Follow the OS light/dark preference.
const dark = matchMedia("(prefers-color-scheme: dark)");
const applyTheme = () => document.documentElement.setAttribute("data-bs-theme", dark.matches ? "dark" : "light");
applyTheme();
dark.addEventListener("change", applyTheme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
