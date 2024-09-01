import React from "react";
import { useNetworkStatus } from "./ultis";

const NetworkProvider = ({ children }) => {
  const online = useNetworkStatus();

  if (!online) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: "#000",
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
