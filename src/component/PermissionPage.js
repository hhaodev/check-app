import Link from "antd/es/typography/Link";
import { signOut } from "firebase/auth";
import React from "react";
import { useAppContext, useCustomTheme } from "../context/AppContext";
import { auth } from "../firebaseConfig";

const PermissionPage = () => {
  const { setUserState } = useAppContext();
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
        }}
      >
        <h1>Không có quyền truy cập</h1>
        <p>
          Bạn không có quyền truy cập vào trang web này, vui lòng liên hệ admin
          để nhận sự giúp đỡ.
        </p>
        <Link
          onClick={async () => {
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
          }}
        >
          Đăng nhập bằng tài khoản khác?
        </Link>
      </div>
    </div>
  );
};

export default PermissionPage;
