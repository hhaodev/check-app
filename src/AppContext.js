import React, { createContext, useEffect, useState } from "react";
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
        } else {
          console.log("Token and UID already exist in the database.");
        }
      }
    })();
  }, [tokenDevice, userState?.user]);

  onMessage(messaging, (payload) => {
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
