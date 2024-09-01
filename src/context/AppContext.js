import React, { createContext, useContext, useEffect, useState } from "react";
import { db, messaging } from "../firebaseConfig";
import { Timestamp, updateDoc } from "firebase/firestore";
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

      if (currentHours === 0 && currentMinutes === 0 && currentSeconds === 0) {
        console.log("It's past 23:59:59. Doing the action...");
        await sendRequest();
      }
    };

    const intervalId = setInterval(dailyTask, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const sendRequest = async () => {
    try {
      const now = new Date();
      now.setHours(0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(now);

      const itemDoc = doc(db, "check", todayDocId);
      await updateDoc(itemDoc, {
        day: todayTimestamp,
        checked: false,
        title: "",
      });
    } catch (error) {
      console.error("Error adding document:", error);
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
