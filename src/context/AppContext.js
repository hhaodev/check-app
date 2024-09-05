import React, { createContext, useContext, useEffect, useState } from "react";
import { db, messaging } from "../firebaseConfig";
import { collection, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import { onMessage } from "firebase/messaging";
import { message } from "antd";

const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  const [userState, setUserState] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  const [appLoading, setAppLoading] = useState(true);

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
        userState,
        setUserState,
        isAuthenticated,
        setIsAuthenticated,
        needLogin,
        setNeedLogin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
