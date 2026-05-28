import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

import App from "./App";
import { LoadingProvider } from "./components/LoadingContext";
import AxiosLoadingHandler from "./components/AxiosLoadingHandler";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoadingProvider>
      <AxiosLoadingHandler />
      <App />
    </LoadingProvider>
  </StrictMode>
);