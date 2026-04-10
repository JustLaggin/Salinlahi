import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./css/modals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  //<React.StrictMode>
  <>
    <div className="app-backdrop" aria-hidden="true" />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </>
  //</React.StrictMode>
);
