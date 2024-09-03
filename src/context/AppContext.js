import React, { createContext, useContext, useEffect, useState } from "react";
import { db, messaging } from "../firebaseConfig";
import {
  collection,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
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

  const [todayDocId, setTodayDocId] = useState();

  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        now.setHours(0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(now);

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
          setAppLoading(false);
        });
      } catch (error) {
        console.error("Error updating documents:", error);
      }
    })();
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
        todayDocId,
        setTodayDocId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
