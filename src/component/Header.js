import { Avatar, Dropdown } from "antd";
import React from "react";
import { useAppContext, useCustomTheme } from "../context/AppContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Header } from "antd/es/layout/layout";
import { BulbOutlined, LogoutOutlined, MoonOutlined } from "@ant-design/icons";

const HeaderApp = () => {
  const theme = useCustomTheme();
  const { toggleAppTheme } = useAppContext();

  const { userState, setUserState } = useAppContext();
  const items = [
    {
      label: (
        <div onClick={() => toggleAppTheme()}>
          {theme.isDarkMode ? (
            <BulbOutlined style={{ fontSize: 13 }} />
          ) : (
            <MoonOutlined style={{ fontSize: 13 }} />
          )}
          {` | `}
          {theme.isDarkMode ? "Light Mode" : "Dark Mode"}
        </div>
      ),
      key: "1",
    },
    {
      label: (
        <div onClick={() => handleSignOut()}>
          <LogoutOutlined style={{ fontSize: 13 }} /> {` | `}Sign Out
        </div>
      ),
      key: "0",
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
        <span>Hi, {userState.user.email.split("@")[0]}</span>
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
