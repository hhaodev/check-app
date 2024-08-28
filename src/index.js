import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "./AppContext";
import AuthWrap from "./AuthWrap";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AppProvider>
    <AuthWrap />
  </AppProvider>
);
