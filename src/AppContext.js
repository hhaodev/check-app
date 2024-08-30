import React, { createContext, useEffect, useRef, useState } from "react";
import { db, messaging } from "./firebaseConfig";
import { query, Timestamp, where } from "firebase/firestore";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { onMessage } from "firebase/messaging";
import { message } from "antd";
import { generateToken } from "./ultis";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userState, setUserState] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [tokenDevice, setTokenDevice] = useState();

  useEffect(() => {
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date();

      nextRun.setHours(0, 1, 0);

      if (now > nextRun) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const timeUntilNextRun = nextRun - now;

      const timerId = setTimeout(() => {
        sendRequest();
        scheduleNextRun();
      }, timeUntilNextRun);

      return () => clearTimeout(timerId);
    };

    scheduleNextRun();
  }, []);

  const sendRequest = async () => {
    try {
      const now = new Date();
      now.setHours(0, 0, 0);
      const dayTimestamp = Timestamp.fromDate(now);

      await addDoc(collection(db, "check"), {
        day: dayTimestamp,
        checked: false,
        body: "",
        msg: "",
        isSeen: "true",
      });

      const querySnapshot = await getDocs(collection(db, "check"));

      querySnapshot.forEach(async (docSnapshot) => {
        const data = docSnapshot.data();

        if (data.day.seconds < dayTimestamp.seconds) {
          await deleteDoc(doc(db, "check", docSnapshot.id));
        }
      });
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  useEffect(() => {
    (async () => {
      const token = await generateToken();
      if (token) {
        setTokenDevice(token);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (tokenDevice && userState?.user) {
        const q = query(
          collection(db, "tokenDevice"),
          where("uid", "==", userState.user.uid),
          where("token", "==", tokenDevice)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(collection(db, "tokenDevice"), {
            uid: userState.user.uid,
            token: tokenDevice,
          });
        }
      }
    })();
  }, [tokenDevice, userState?.user]);

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
        tokenDevice,
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
