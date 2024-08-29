import { getToken } from "firebase/messaging";
import { useEffect, useState } from "react";
import { messaging } from "../firebaseConfig";

export const isToday = (timestamp) => {
  const { seconds, nanoseconds } = timestamp;

  const millis = seconds * 1000 + nanoseconds / 1000000;

  const dateFromTimestamp = new Date(millis);

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  return dateFromTimestamp >= startOfToday && dateFromTimestamp < endOfToday;
};

export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

export const useNetworkStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
};

export const generateToken = async () => {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey:
        "BIhIVUsJsEnBBjCaaJ2E0JwnHPiMGd8terI452sc-E74vBEhcXT9r6J7A6IkB8k6mLY72lZE5cJGuMenNQtM58U",
    });
    return { token, permission };
  }
};
