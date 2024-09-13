import React from "react";
import { useNetworkStatus } from "./ultis";
import { useCustomTheme } from "./context/AppContext";

const NetworkProvider = ({ children }) => {
  const online = useNetworkStatus();
  const theme = useCustomTheme();

  if (!online) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: theme.colorBackgroundBase,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80%",
            textAlign: "center",
            color: theme.colorTextBase,
          }}
        >
          <h1>Network Error</h1>
          <p>
            You are currently offline. Please check your network connection and
            try again.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default NetworkProvider;
