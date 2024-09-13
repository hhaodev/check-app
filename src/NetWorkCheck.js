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
            width: "70%",
            textAlign: "center",
            color: theme.colorTextBase,
          }}
        >
          <h1>Lỗi mạng</h1>
          <p>Bạn đang không có kết nối mạng, vui lòng kết nối và thử lại.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default NetworkProvider;
