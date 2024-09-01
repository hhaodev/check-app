import { Avatar, Dropdown } from "antd";
import React from "react";
import { useAppContext } from "../context/AppContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Header } from "antd/es/layout/layout";

const HeaderApp = () => {
  const { userState, setUserState } = useAppContext();
  const items = [
    {
      label: <div onClick={() => handleSignOut()}>Sign Out</div>,
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
    <Header className="header">
      <span>hi, {userState.user.email.split("@")[0]}</span>
      <Dropdown placement="bottomRight" menu={{ items }} trigger={["click"]}>
        <Avatar style={{ backgroundColor: "#fde3cf", color: "#f56a00" }}>
          {userState.user.email.split("@")[0].charAt(0).toUpperCase()}
        </Avatar>
      </Dropdown>
    </Header>
  );
};

export default HeaderApp;
