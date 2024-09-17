import {
  CarryOutOutlined,
  LoadingOutlined,
  MacCommandOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Badge, Button, Input, Layout, Modal, Spin } from "antd";
import { Content } from "antd/es/layout/layout";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import "./App.css";
import image from "./assets/05293ae8-0358-40d5-8e77-6ffa74f2775a.png";
import image2 from "./assets/20b98398-62fd-4cef-91a7-6004aa5b23d4.png";
import image1 from "./assets/a1cfc369-1fcc-4bfe-b566-962ecec25168.png";
import image3 from "./assets/e7afd37c-b941-4942-bff0-f8b19e7cd45c.png";
import HeaderApp from "./component/Header";
import NotePanel from "./component/Panel/NotePanel";
import TicTacToePanel from "./component/Panel/TicTacToePanel";
import { useAppContext, useCustomTheme } from "./context/AppContext";
import { db } from "./firebaseConfig";
import { formatTime, usePageVisibility } from "./ultis";
import ListenGame from "./component/ListenGame";

const styleImage = {
  width: "80%",
  maxWidth: "450px",
  objectFit: "contain",
  borderRadius: "8px",
};

function AppStandard() {
  const theme = useCustomTheme();
  const isVisible = usePageVisibility();

  const { TextArea } = Input;
  const { userState } = useAppContext();

  const [todayDocId, setTodayDocId] = useState();
  const [todayChecked, setTodayChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [data, setData] = useState();
  const [result, setResult] = useState(false);

  //msg region
  const [contentReply, setContentReply] = useState("");
  const [msgId, setMsgId] = useState([]);
  const [msgContent, setMsgContent] = useState([]);
  const [msgContentNotSeen, setMsgContentNotSeen] = useState([]);
  const [openModalMsg, setOpenModalMsg] = useState(false);
  const [openModalSendMsg, setOpenModalSendMsg] = useState(false);
  const [msgSendContent, setMsgSendContent] = useState();

  //loading region
  const [isHandleReply, setIsHandlingReply] = useState(false);
  const [isHandleOk, setIsHandleOk] = useState(false);
  const [isCheckLater, setIsCheckLater] = useState(false);
  const [isHandleSendMsg, setIsHandleSendMsg] = useState(false);
  const [loadingGetNote, setLoadingGetNote] = useState(false);

  //error region
  const [error, setError] = useState(false);

  //panel region
  const [openPanel, setOpenPanel] = useState(false);
  const [openGamePanel, setOpenGamePanel] = useState(false);

  //notes region
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "check"), (querySnapshot) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const itemDate = new Date(data.day.seconds * 1000);
          itemDate.setHours(0, 0, 0, 0);
          setTodayDocId(doc.id);

          if (itemDate.getTime() === today.getTime()) {
            setData(data);
            setTodayChecked(data.checked);
            setOpenModal(!data.checked);
            setError(false);
          } else {
            setOpenModal(false);
            setError(true);
          }
        });
      } catch (error) {
        console.error("Error processing snapshot:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setIsCheckLater(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isHandleReply) {
      const unsubscribe = onSnapshot(collection(db, "msg"), (querySnapshot) => {
        try {
          const msgId = [];
          const msgContent = [];
          const msgContentNotSeen = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.author !== userState.user.uid && data.isSeen === false) {
              msgId.push(doc.id);
              msgContent.push(data);
              setOpenModalMsg(true);
            }

            if (data.author === userState.user.uid && data.isSeen === false) {
              msgContentNotSeen.push(data);
            }
          });

          msgContent.sort((a, b) => {
            return b.sendAt.seconds - a.sendAt.seconds;
          });
          msgContentNotSeen.sort((a, b) => {
            return b.sendAt.seconds - a.sendAt.seconds;
          });

          setMsgId(msgId);
          setMsgContent(msgContent);
          setMsgContentNotSeen(msgContentNotSeen);
        } catch (error) {
          console.error("Error processing snapshot:", error);
        }
      });

      return () => unsubscribe();
    }
  }, [isHandleReply]);

  const handleOk = async () => {
    setIsHandleOk(true);
    if (!todayDocId) return;

    try {
      const itemDoc = doc(db, "check", todayDocId);
      await updateDoc(itemDoc, { checked: true });
      if (Boolean(contentReply)) {
        await addDoc(collection(db, "msg"), {
          author: userState.user.uid,
          text: contentReply,
          isSeen: false,
          sendAt: Timestamp.fromDate(new Date()),
        });
        setContentReply("");
      }
      setResult(true);
      setOpenModal(false);
    } catch (error) {
      console.error("Error updating document:", error);
    } finally {
      setIsHandleOk(false);
    }
  };

  const handleReplyMsg = async () => {
    setIsHandlingReply(true);

    try {
      for (const i of msgId) {
        await deleteDoc(doc(db, "msg", i));
      }

      if (Boolean(contentReply)) {
        await addDoc(collection(db, "msg"), {
          author: userState.user.uid,
          text: contentReply,
          isSeen: false,
          sendAt: Timestamp.fromDate(new Date()),
        });
        setContentReply("");
      }
    } catch (error) {
      console.error("Error handling reply message:", error);
    } finally {
      setMsgId([]);
      setMsgContent([]);
      setOpenModalMsg(false);
      setIsHandlingReply(false);
    }
  };

  const handleSendMsg = async () => {
    setIsHandleSendMsg(true);
    if (!todayDocId) return;

    await addDoc(collection(db, "msg"), {
      author: userState.user.uid,
      text: msgSendContent,
      isSeen: false,
      sendAt: Timestamp.fromDate(new Date()),
    });
    setMsgSendContent("");
    setOpenModalSendMsg(false);
    setIsHandleSendMsg(false);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "notes"), (querySnapshot) => {
      setLoadingGetNote(true);

      try {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotes(data);
        setLoadingGetNote(false);
      } catch (error) {
        console.error("Error processing snapshot:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="app">
        <Layout className="layout">
          <HeaderApp />
          <Content className="content">
            {loading && (
              <div
                style={{
                  width: "100%",
                  height: "calc(100vh - 100px - 64px)",
                  backgroundColor: theme.colorBackgroundBase,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}
                />
              </div>
            )}
            {!loading && todayChecked && !isHandleOk && !error && (
              <>
                {result ? (
                  <>
                    <div>{`uống òi hả, giỏi !! thưởng 1 nháy :)))`}</div>
                    <img alt="" src={image} style={styleImage} />
                  </>
                ) : (
                  <>
                    <div>{`hôm ni em ún thuốc roàii !!`}</div>
                    <img alt="" src={image2} style={styleImage} />
                  </>
                )}
              </>
            )}
            {isCheckLater && !error && (
              <>
                <div>{`nhớ 7h uống thuốc đó nghen :))`}</div>
                <img alt="" src={image1} style={styleImage} />
              </>
            )}
            {error && (
              <>
                <div>{`có gì đó sai sai, tải lại trang xem !!`}</div>
                <img alt="" src={image3} style={styleImage} />
              </>
            )}
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
            onClick={() => {
              setOpenGamePanel(true);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 50,
            }}
            icon={<MacCommandOutlined />}
          />
          <Badge
            count={
              notes?.filter(
                (note) =>
                  note.done === false && note.noteTo.uid === userState.user.uid
              )?.length
            }
          >
            <Button
              disabled={loadingGetNote}
              style={{
                width: 40,
                height: 40,
                borderRadius: 50,
              }}
              icon={
                !loadingGetNote ? (
                  <CarryOutOutlined />
                ) : (
                  <Spin
                    indicator={
                      <LoadingOutlined style={{ fontSize: 20 }} spin />
                    }
                  />
                )
              }
              onClick={() => {
                setOpenPanel(true);
              }}
            />
          </Badge>
          <Badge count={msgContentNotSeen?.length}>
            <Button
              onClick={() => {
                setOpenModalSendMsg(true);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 50,
              }}
              icon={<MessageOutlined />}
            />
          </Badge>
        </div>
      </div>
      <Modal
        style={{ top: "25%" }}
        closable={false}
        width={320}
        open={openModal}
        footer={null}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            width: "100%",
          }}
        >
          <div
            style={{
              width: "100%",
              textAlign: "center",
            }}
          >
            {Boolean(data?.title) ? data?.title : `uống thuốc nèeee!!`}
          </div>

          <TextArea
            autoFocus
            autoSize={{ minRows: 3 }}
            value={contentReply}
            onChange={(e) => setContentReply(e.target.value)}
            placeholder="có gì nói hong, viết ở đây :))"
          />
          <Button loading={isHandleOk} onClick={() => handleOk()}>
            Ún òiiii !!
          </Button>
          <Button
            onClick={() => {
              setOpenModal(false);
              setIsCheckLater(true);
            }}
          >
            Chưa tới giờ, uống sau đê !!
          </Button>
        </div>
      </Modal>
      <Modal
        style={{ top: "25%" }}
        closable={false}
        width={320}
        open={openModalMsg}
        footer={null}
        onCancel={() => handleReplyMsg()}
        title={
          <div
            style={{ textAlign: "center" }}
          >{`tin nhắn từ người ấy :))`}</div>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            width: "100%",
          }}
        >
          {msgContent?.map((i, index) => {
            return (
              <div
                style={{
                  backgroundColor: theme.colorBackgroundDiv,
                  borderRadius: "8px",
                  padding: "8px",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
                key={index}
              >
                {`"${i?.text}"`}
                <div
                  style={{
                    fontSize: 10,
                    whiteSpace: "nowrap",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  {`${formatTime(i?.sendAt)}`}
                </div>
              </div>
            );
          })}

          <TextArea
            autoFocus
            autoSize={{ minRows: 3 }}
            value={contentReply}
            onChange={(e) => setContentReply(e.target.value)}
            placeholder="reply???"
          />
          <Button loading={isHandleReply} onClick={() => handleReplyMsg()}>
            Oske nhoo !!
          </Button>
        </div>
      </Modal>
      <Modal
        style={{ top: "25%" }}
        closable={false}
        width={320}
        open={openModalSendMsg}
        footer={null}
        onCancel={() => setOpenModalSendMsg(false)}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {msgContentNotSeen.length > 0 && (
            <>
              <>tin nhắn người ấy chưa xem</>
              {msgContentNotSeen?.map((i, index) => {
                return (
                  <div
                    style={{
                      backgroundColor: theme.colorBackgroundDiv,
                      borderRadius: "8px",
                      padding: "8px",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                    key={index}
                  >
                    {`"${i?.text}" `}
                    <div
                      style={{
                        fontSize: 10,
                        whiteSpace: "nowrap",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {`${formatTime(i?.sendAt)}`}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <TextArea
            autoFocus
            autoSize={{ minRows: 3 }}
            value={msgSendContent}
            onChange={(e) => setMsgSendContent(e.target.value)}
            placeholder={"gửi tin nhắn cho người ấy :))"}
          />
          <Button
            loading={isHandleSendMsg}
            disabled={!Boolean(msgSendContent)}
            onClick={() => handleSendMsg()}
          >
            Oske nhoo !!
          </Button>
        </div>
      </Modal>

      <NotePanel
        open={openPanel}
        onClosePanel={() => setOpenPanel(false)}
        notes={notes}
      />
      <TicTacToePanel
        open={openGamePanel}
        onClosePanel={() => setOpenGamePanel(false)}
      />
      <ListenGame onAcpGame={() => setOpenGamePanel(true)} />
    </>
  );
}

export default AppStandard;
