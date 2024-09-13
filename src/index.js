import "antd/dist/reset.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import NetworkProvider from "./NetWorkCheck";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AppProvider>
    <NetworkProvider>
      <App />
    </NetworkProvider>
  </AppProvider>
);
