import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./css/modals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  //<React.StrictMode>
    <>
      <div className="glow-background">
        <div className="glow-orb glow-blue"></div>
        <div className="glow-orb glow-green"></div>
      </div>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </>
  //</React.StrictMode>
);
