import { getToken } from "firebase/messaging";
import { useEffect, useState } from "react";
import { messaging } from "../firebaseConfig";

export const formatTime = (timestamp) => {
  const date = new Date(timestamp?.seconds * 1000);

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  return `${day}/${month}/${year} ${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
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
    return token;
  }
};

export const filterNotes = (notes, paramsFilter) => {
  return notes.filter((note) => {
    // Lọc theo level
    if (paramsFilter.level !== "all" && note.level !== paramsFilter.level) {
      return false;
    }

    // Lọc theo noteTo
    if (
      paramsFilter.noteTo !== "all" &&
      note.noteTo.uid !== paramsFilter.noteTo
    ) {
      return false;
    }

    // Lọc theo owner
    if (paramsFilter.owner !== "all" && note.owner.uid !== paramsFilter.owner) {
      return false;
    }

    // Lọc theo done
    if (paramsFilter.done !== "all" && note.done !== paramsFilter.done) {
      return false;
    }

    return true;
  });
};
