import { LogoutOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Avatar, Badge, Dropdown } from "antd";
import { Header } from "antd/es/layout/layout";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
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
      await updateDoc(doc(db, "users", userState.user.uid), {
        isOnline: false,
      });
      setUserState((prevState) => ({
        ...prevState,
        user: null,
        role: null,
      }));
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
      <div style={{ display: "flex", gap: 10 }}>
        <span style={{ lineHeight: "20px", textAlign: "end" }}>
          Xin chào, {userState.user.email.split("@")[0]}
        </span>
        <Dropdown placement="bottomRight" menu={{ items }} trigger={["click"]}>
          <Badge
            dot
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: "green",
              borderRadius: "50%",
            }}
            offset={[0, 27]}
          >
            <Avatar
              style={{
                minWidth: 32,
                minHeight: 32,
                backgroundColor: "#fde3cf",
                color: "#f56a00",
              }}
            >
              {userState.user.email.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderApp;
