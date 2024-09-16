import { ConfigProvider, message, theme } from "antd";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { onMessage } from "firebase/messaging";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import logo from "../assets/logo.png";
import { db, messaging } from "../firebaseConfig";
import { getBrowserId } from "../ultis";

const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const useCustomTheme = () => {
  return theme.useToken().token?.customTheme;
};

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  return !!savedTheme && savedTheme !== "undefined" ? savedTheme : "dark";
};

export const AppProvider = ({ children }) => {
  const [userState, setUserState] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  const [appLoading, setAppLoading] = useState(true);

  const [appTheme, setAppTheme] = useState(getInitialTheme); // default dark mode

  const [isLoggedAnother, setIsLoggedAnother] = useState(false);

  const toggleAppTheme = () => {
    const targetTheme = appTheme === "light" ? "dark" : "light";
    setAppTheme(targetTheme);
    localStorage.setItem("theme", targetTheme);
  };

  const isDarkMode = useMemo(() => {
    return appTheme === "dark";
  }, [appTheme]);

  const browserId = useMemo(() => {
    return getBrowserId();
  }, []);

  useEffect(() => {
    const lastActivity = localStorage.getItem("lastActivity");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!lastActivity || new Date(lastActivity).getTime() !== today.getTime()) {
      (async () => {
        try {
          const todayTimestamp = Timestamp.fromDate(today);

          const checksCollection = collection(db, "check");
          const snapshot = await getDocs(checksCollection);

          snapshot.forEach(async (docSnapshot) => {
            const data = docSnapshot.data();
            const docId = docSnapshot.id;

            if (data.day?.seconds !== todayTimestamp.seconds) {
              const docRef = doc(db, "check", docId);
              await updateDoc(docRef, {
                day: todayTimestamp,
                checked: false,
                title: "",
              });
            }
          });

          setAppLoading(false);
          localStorage.setItem("lastActivity", today.toISOString());
        } catch (error) {
          console.error("Error updating documents:", error);
        }
      })();
    } else {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userState && userState.user) {
      (async () => {
        await setDoc(doc(db, "session", userState.user.uid), {
          browserId: browserId,
          uid: userState.user.uid,
        });
      })();
    }
  }, [userState]);

  useEffect(() => {
    if (userState && userState.user) {
      const unsubscribe = onSnapshot(
        collection(db, "session"),
        (querySnapshot) => {
          try {
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (
                data.uid === userState?.user?.uid &&
                data.browserId !== browserId
              ) {
                setIsLoggedAnother(true);
              }
            });
          } catch (error) {
            console.error("Error processing snapshot:", error);
          }
        }
      );

      return () => unsubscribe();
    }
  }, [userState]);

  onMessage(messaging, (payload) => {
    console.log("🚀 ~ onMessage ~ messaging:", payload);
    if (payload) {
      message.info(
        <>
          <div>{payload.notification.body}</div>
        </>
      );
    }
  });

  return (
    <AppContext.Provider
      value={{
        appLoading,
        setAppLoading,
        userState,
        setUserState,
        isAuthenticated,
        setIsAuthenticated,
        needLogin,
        setNeedLogin,
        toggleAppTheme,
        isLoggedAnother,
      }}
    >
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            fontSize: 16,
            colorPrimary: isDarkMode ? "#6c6c6c" : "#1677ff",
            customTheme: {
              logoApp: logo,
              isDarkMode: isDarkMode,
              colorBackgroundBase: isDarkMode ? "#000000" : "#F5F5F5",
              colorBackgroundDiv: isDarkMode ? "#373737" : "#cccccc",
              colorTextBase: isDarkMode ? "#ffffff" : "#000000",
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AppContext.Provider>
  );
};
