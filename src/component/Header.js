import { Avatar, Dropdown } from "antd";
import React from "react";
import { useAppContext, useCustomTheme } from "../context/AppContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Header } from "antd/es/layout/layout";
import { LogoutOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
const style = {
  padding: 5,
};

const HeaderApp = () => {
  const theme = useCustomTheme();
  const { toggleAppTheme } = useAppContext();

  const { userState, setUserState } = useAppContext();
  const items = [
    {
      label: (
        <div style={style} onClick={() => toggleAppTheme()}>
          {theme.isDarkMode ? (
            <SunOutlined style={{ fontSize: 13 }} />
          ) : (
            <MoonOutlined style={{ fontSize: 13 }} />
          )}
          {` | `}
          {theme.isDarkMode ? "Chế độ sáng" : "Chế độ tối"}
        </div>
      ),
      key: "1",
    },
    {
      label: (
        <div style={style} onClick={() => handleSignOut()}>
          <LogoutOutlined style={{ fontSize: 13 }} /> {` | `}Đăng xuất
        </div>
      ),
      key: "2",
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserState((prevState) => ({
        ...prevState,
        user: null,
        role: null,
      }));
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  return (
    <Header
      style={{
        backgroundColor: theme.colorBackgroundBase,
      }}
      className="header"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "30%",
        }}
      >
        <img
          src={theme.logoApp}
          style={{
            width: "100%",
            objectFit: "contain",
          }}
          alt="logo"
        />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span>Xin chào, {userState.user.email.split("@")[0]}</span>
        <Dropdown placement="bottomRight" menu={{ items }} trigger={["click"]}>
          <Avatar style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}>
            {userState.user.email.split("@")[0].charAt(0).toUpperCase()}
          </Avatar>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderApp;
