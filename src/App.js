import React, { useEffect } from "react";
import { useAppContext } from "./context/AppContext";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import Login from "./Login";
import { doc, getDoc } from "firebase/firestore";
import AppStandard from "./AppStandard";
import AppAdmin from "./AppAdmin";
import LoadingPage from "./component/LoadingPage";

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
  } else if (needLogin && !appLoading) {
    return <Login />;
  } else {
    return <LoadingPage />;
  }
};

export default App;
