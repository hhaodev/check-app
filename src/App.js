import React, { useEffect } from "react";
import { useAppContext } from "./context/AppContext";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import Login from "./Login";
import { doc, getDoc } from "firebase/firestore";
import AppStandard from "./AppStandard";
import AppAdmin from "./AppAdmin";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const App = () => {
  const {
    userState,
    setUserState,
    needLogin,
    setNeedLogin,
    isAuthenticated,
    setIsAuthenticated,
  } = useAppContext();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const userRole = userData.role; //admin or standard

            setUserState((prevState) => ({
              ...prevState,
              user: user,
              role: userRole,
            }));
            setIsAuthenticated(true);
            setNeedLogin(false);
          } else {
            setUserState((prevState) => ({
              ...prevState,
              user: null,
              role: null,
            }));
            setIsAuthenticated(false);
            setNeedLogin(true);
          }
        } catch (error) {
          setUserState((prevState) => ({
            ...prevState,
            user: null,
            role: null,
          }));
          setIsAuthenticated(false);
          setNeedLogin(true);
        }
      } else {
        setUserState((prevState) => ({
          ...prevState,
          user: null,
          role: null,
        }));
        setIsAuthenticated(false);
        setNeedLogin(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (userState.role === "admin" && isAuthenticated && !needLogin) {
    return <AppAdmin />;
  } else if (userState.role === "standard" && isAuthenticated && !needLogin) {
    return <AppStandard />;
  } else if (needLogin) {
    return <Login />;
  } else {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }
};

export default App;