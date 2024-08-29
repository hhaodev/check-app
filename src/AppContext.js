import React, { createContext, useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import { Timestamp } from "firebase/firestore";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userState, setUserState] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    const getTimeUntilTarget = () => {
      const now = new Date();
      const targetTime = new Date(now);

      targetTime.setHours(0, 0, 0, 0);

      if (now.getTime() > targetTime.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      return targetTime.getTime() - now.getTime();
    };

    const sendRequest = async () => {
      try {
        const todayTimestamp = Timestamp.now();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayTimestamp = Timestamp.fromDate(startOfToday);

        await addDoc(collection(db, "check"), {
          day: todayTimestamp,
          checked: false,
          body: "",
          msg: "",
          isSeen: "true",
        });

        const querySnapshot = await getDocs(collection(db, "check"));

        querySnapshot.forEach(async (docSnapshot) => {
          const data = docSnapshot.data();

          if (data.day.seconds < startOfTodayTimestamp.seconds) {
            await deleteDoc(doc(db, "check", docSnapshot.id));
            console.log(`Deleted old document with ID: ${docSnapshot.id}`);
          }
        });
      } catch (error) {
        console.error("Error adding document:", error);
      }
    };

    const scheduleTargetRequest = () => {
      const timeUntilTarget = getTimeUntilTarget();

      setTimeout(() => {
        sendRequest();
        scheduleTargetRequest();
      }, timeUntilTarget);
    };

    scheduleTargetRequest();

    return () => clearTimeout(scheduleTargetRequest);
  }, []);
  return (
    <AppContext.Provider
      value={{
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
