import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ActiveAyudaProvider } from "./context/ActiveAyudaContext";
import "./index.css";
import "./css/modals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <div className="app-backdrop" aria-hidden="true" />
    <BrowserRouter>
      <AuthProvider>
        <ActiveAyudaProvider>
          <App />
        </ActiveAyudaProvider>
      </AuthProvider>
    </BrowserRouter>
  </>
);
