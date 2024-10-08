import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Button, Modal } from "antd";

const ListenGame = ({ onAcpGame }) => {
  const { userState } = useAppContext();

  const [gameData, setGameData] = useState(null);
  const [openModalAcpGame, setOpenModalAcpGame] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "game"), (querySnapshot) => {
      try {
        let hasDocuments = false;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            const isCurrentUserInArray = data.user.some(
              (u) => u.uid === userState.user.uid
            );

            if (isCurrentUserInArray) {
              if (
                data.user.find((u) => u.uid === userState.user.uid)?.inGame ===
                  false &&
                data.isComplete === false &&
                data.quit === false
              ) {
                hasDocuments = true;

                setGameData({ id: doc.id, ...data });
                setOpenModalAcpGame(true);
              }
            }
          }
        });

        if (!hasDocuments) {
          setGameData(null);
          setOpenModalAcpGame(false);
        }
      } catch (error) {
        console.error("Error processing snapshot:", error);
      } finally {
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAcpGame = async () => {
    const itemDoc = doc(db, "game", gameData.id);
    const updatedUserArray = gameData.user.map((user) =>
      user.uid === userState.user.uid
        ? { ...user, inGame: true, isOnline: true }
        : user
    );
    await updateDoc(itemDoc, { user: updatedUserArray, pending: false });
    setOpenModalAcpGame(false);
    onAcpGame && onAcpGame();
  };

  const handleCancelGame = async () => {
    const itemDoc = doc(db, "game", gameData.id);
    await updateDoc(itemDoc, { quit: true, pending: false });
    setOpenModalAcpGame(false);
  };

  return (
    <>
      <Modal
        zIndex={2100}
        open={openModalAcpGame}
        closable={false}
        footer={null}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
          }}
        >
          <p style={{ textAlign: "center" }}>{`Bạn có 1 lời mời X O Game từ "${
            gameData?.user?.find((u) => u.uid !== userState?.user?.uid)?.email
          }"`}</p>

          <Button onClick={() => handleCancelGame()}>Từ chối</Button>
          <Button onClick={() => handleAcpGame()}>Chấp nhận</Button>
        </div>
      </Modal>
    </>
  );
};

export default ListenGame;
