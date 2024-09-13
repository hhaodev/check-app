import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AppAdmin from "./AppAdmin";
import AppStandard from "./AppStandard";
import LoadingPage from "./component/LoadingPage";
import PermissionPage from "./component/PermissionPage";
import { useAppContext } from "./context/AppContext";
import { auth, db } from "./firebaseConfig";
import Login from "./Login";

const App = () => {
  const {
    appLoading,
    userState,
    setUserState,
    needLogin,
    setNeedLogin,
    isAuthenticated,
    setIsAuthenticated,
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
  }, [refreshLogin]);

  if (
    userState.role === "admin" &&
    isAuthenticated &&
    !needLogin &&
    !appLoading
  ) {
    return <AppAdmin />;
  } else if (
    userState.role === "standard" &&
    isAuthenticated &&
    !needLogin &&
    !appLoading
  ) {
    return <AppStandard />;
  } else if (
    userState.role === undefined &&
    isAuthenticated &&
    !needLogin &&
    !appLoading
  ) {
    return <PermissionPage />;
  } else if (needLogin && !appLoading) {
    return <Login />;
  } else {
    return <LoadingPage />;
  }
};

export default App;
