import Link from "antd/es/typography/Link";
import React from "react";
import { useCustomTheme } from "../context/AppContext";

const LoggedAnotherPage = () => {
  const theme = useCustomTheme();
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
          lineHeight: 1.5,
        }}
      >
        <h1>Bạn đã truy cập ở 1 nơi khác</h1>
        <p>Bạn không thể truy cập trang web này vì đã truy cập ở 1 nơi khác.</p>
        <Link onClick={() => window.location.reload()}>
          Truy cập bằng thiết bị này?
        </Link>
      </div>
    </div>
  );
};

export default LoggedAnotherPage;
