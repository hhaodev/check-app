import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AppAdmin from "./AppAdmin";
import AppNormal from "./AppNormal";
import AppStandard from "./AppStandard";
import LoadingPage from "./pages/LoadingPage";
import LoggedAnotherPage from "./pages/LoggedAnotherPage";
import PermissionPage from "./pages/PermissionPage";
import { useAppContext } from "./context/AppContext";
import { auth, db } from "./firebaseConfig";
import Login from "./pages/Login";

const App = () => {
  const {
    appLoading,
    userState,
    setUserState,
    needLogin,
    setNeedLogin,
    isAuthenticated,
    setIsAuthenticated,
    isLoggedAnother,
  } = useAppContext();

  const [refreshLogin, setRefreshLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), () => {
      setRefreshLogin((prev) => !prev);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const userRole = userData.role;
            const isOnline = userData.isOnline; //admin or standard

            setUserState((prevState) => ({
              ...prevState,
              user: user,
              role: userRole,
              isOnline: isOnline,
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
  }, [refreshLogin]);

  const renderApp = () => {
    if (isAuthenticated && !needLogin && !appLoading) {
      if (isLoggedAnother) {
        return <LoggedAnotherPage />;
      } else {
        switch (userState.role) {
          case "admin":
            return <AppAdmin />;
          case "standard":
            return <AppStandard />;
          case "normal":
            return <AppNormal />;
          case "none":
            return <PermissionPage />;
          default:
            return <LoadingPage />;
        }
      }
    } else if (needLogin && !appLoading) {
      return <Login />;
    } else {
      return <LoadingPage />;
    }
  };

  return <>{renderApp()}</>;
};

export default App;
