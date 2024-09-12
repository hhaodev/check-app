import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import React from "react";
import logo from "../assets/logo.png";

const LoadingPage = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "90%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <img
          src={logo}
          style={{
            width: "50%",
            objectFit: "contain",
          }}
          alt="logo"
        />
        <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />} />
      </div>
      <div
        style={{
          width: "100%",
          height: "10%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            color: "#0180FF",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          From Haodev
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;