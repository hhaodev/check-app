import { LogoutOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Avatar, Dropdown } from "antd";
import { Header } from "antd/es/layout/layout";
import { signOut } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import React from "react";
import { useAppContext, useCustomTheme } from "../context/AppContext";
import { auth, db } from "../firebaseConfig";
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
      await deleteDoc(doc(db, "session", userState.user.uid));
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
          maxWidth: "150px",
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
        <span style={{ lineHeight: "20px", textAlign: "end" }}>
          Xin chào, {userState.user.email.split("@")[0]}
        </span>
        <Dropdown placement="bottomRight" menu={{ items }} trigger={["click"]}>
          <Avatar
            style={{
              minWidth: 32,
              minHeight: 32,
              backgroundColor: "#fde3cf",
              color: "#f56a00",
            }}
          >
            {userState.user.email.split("@")[0].charAt(0).toUpperCase()}
          </Avatar>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderApp;
