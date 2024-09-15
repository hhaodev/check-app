import React, { useEffect, useState } from "react";
import HeaderApp from "./component/Header";
import { Button, Layout, Modal } from "antd";
import { Content } from "antd/es/layout/layout";
import { useAppContext, useCustomTheme } from "./context/AppContext";
import image from "./assets/pn.png";
import { MacCommandOutlined } from "@ant-design/icons";
import TicTacToePanel from "./component/Panel/TicTacToePanel";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const styleImage = {
  width: "80%",
  maxWidth: "450px",
  objectFit: "contain",
  borderRadius: "8px",
};

const AppNormal = () => {
  const theme = useCustomTheme();
  const { userState } = useAppContext();
  const [openGamePanel, setOpenGamePanel] = useState(false);

  const [gameData, setGameData] = useState(null);
  const [openModalAcpGame, setOpenModalAcpGame] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "game"), (querySnapshot) => {
      try {
        let hasDocuments = false;

        querySnapshot.forEach((doc) => {
          hasDocuments = true;

          const data = doc.data();
          if (data) {
            setGameData({ id: doc.id, ...data });
            const isCurrentUserInArray = data.user.some(
              (u) => u.uid === userState.user.uid
            );

            if (isCurrentUserInArray) {
              if (
                data.user.find((u) => u.uid === userState.user.uid)?.inGame ===
                false
              ) {
                setOpenGamePanel(false);
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
      user.uid === userState.user.uid ? { ...user, inGame: true } : user
    );
    await updateDoc(itemDoc, { user: updatedUserArray, pending: false });
    setOpenModalAcpGame(false);
    setOpenGamePanel(true);
  };

  const handleCancelGame = async () => {
    const itemDoc = doc(db, "game", gameData.id);
    await updateDoc(itemDoc, { quit: true, pending: false });
    setOpenModalAcpGame(false);
  };

  return (
    <>
      <div className="app">
        <Layout className="layout">
          <HeaderApp />
          <Content className="content">
            <div>{`Chào mừng bạn đến với Check App :)))`}</div>
            <img alt="" src={image} style={styleImage} />
          </Content>
        </Layout>
        <div
          style={{
            padding: "15px 40px",
            display: "flex",
            justifyContent: "end",
            gap: 30,
            width: "100%",
            height: "100px",
            backgroundColor: theme.colorBackgroundBase,
          }}
        >
          <Button
            onClick={() => setOpenGamePanel(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 50,
            }}
            icon={<MacCommandOutlined />}
          />
        </div>
      </div>
      <TicTacToePanel
        open={openGamePanel}
        onClosePanel={() => setOpenGamePanel(false)}
      />
      <Modal open={openModalAcpGame} closable={false} footer={null}>
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

export default AppNormal;
