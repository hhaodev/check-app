import React, { createContext, useEffect, useState } from "react";
import { db } from "./firebaseConfig";
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
    const getTimeUntilMidnight = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      return tomorrow.getTime() - now.getTime();
    };

    const sendRequest = async () => {
      try {
        const todayTimestamp = Math.floor(new Date().getTime() / 1000);

        await addDoc(collection(db, "check"), {
          day: {
            seconds: Math.floor(new Date().getTime() / 1000),
            nanoseconds: 0,
          },
          checked: false,
          body: "",
          msg: "",
          isSeen: "true",
        });
        const querySnapshot = await getDocs(collection(db, "check"));

        querySnapshot.forEach(async (docSnapshot) => {
          const data = docSnapshot.data();
          if (data.day.seconds < todayTimestamp) {
            await deleteDoc(doc(db, "check", docSnapshot.id));
            console.log(`Deleted old document with ID: ${docSnapshot.id}`);
          }
        });
      } catch (error) {
        console.error("Error adding document:", error);
      }
    };
    const intervalId = setInterval(() => {
      const timeUntilMidnight = getTimeUntilMidnight();
      if (timeUntilMidnight <= 1000) {
        sendRequest();
      }
    }, 1000);

    return () => clearInterval(intervalId);
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
