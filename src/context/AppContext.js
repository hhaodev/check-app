import React, { createContext, useContext, useEffect, useState } from "react";
import { db, messaging } from "../firebaseConfig";
import { getDoc, Timestamp, updateDoc } from "firebase/firestore";
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

  useEffect(() => {
    const dailyTask = async () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();

      if (currentHours === 0 && currentMinutes === 0 && currentSeconds === 1) {
        sendRequest();
      }
    };

    const intervalId = setInterval(dailyTask, 1000);

    return () => clearInterval(intervalId);
  }, [todayDocId]);

  const sendRequest = async () => {
    if (!todayDocId) return;

    try {
      const itemDoc = doc(db, "check", todayDocId);

      const todayTimestamp = Timestamp.fromDate(new Date().setHours(0, 0, 0));

      await updateDoc(itemDoc, {
        day: todayTimestamp,
        checked: false,
        title: "",
      });
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

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
