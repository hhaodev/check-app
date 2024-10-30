import {
  CarryOutOutlined,
  CommentOutlined,
  FormOutlined,
  LoadingOutlined,
  MacCommandOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Badge, Button, Input, Layout, Modal, Spin, Tooltip } from "antd";
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
import image2 from "./assets/146defa1-583e-467a-a7d2-29f7e3dc9cb5.png";
import image1 from "./assets/e7afd37c-b941-4942-bff0-f8b19e7cd45c.png";
import image from "./assets/pn.png";
import HeaderApp from "./component/Header";
import ListenGame from "./component/ListenGame";
import NotePanel from "./component/Panel/NotePanel";
import TicTacToePanel from "./component/Panel/TicTacToePanel";
import { useAppContext, useCustomTheme } from "./context/AppContext";
import { db } from "./firebaseConfig";
import { formatTime } from "./ultis";
import MessagePanel from "./component/Panel/MessagePanel";
import CalendarHistoryCheck from "./component/Calendar";

const styleImage = {
  width: "80%",
  maxWidth: "450px",
  objectFit: "contain",
  borderRadius: "8px",
};

function AppAdmin() {
  const theme = useCustomTheme();
  const { TextArea } = Input;
  const { userState } = useAppContext();

  const [todayDocId, setTodayDocId] = useState();
  const [todayChecked, setTodayChecked] = useState(false);
  const [content, setContent] = useState("");
  const [modalType, setModalType] = useState();

  const [openHistoryCheck, setOpenHistoryCheck] = useState(false);
  const [openTooltip, setOpenTooltip] = useState(false);

  //msg region
  const [contentReply, setContentReply] = useState("");
  const [msgId, setMsgId] = useState([]);
  const [msgContent, setMsgContent] = useState([]);
  const [msgContentNotSeen, setMsgContentNotSeen] = useState([]);
  const [openModalMsg, setOpenModalMsg] = useState(false);

  //loading region
  const [loading, setLoading] = useState(true);
  const [isHandleReply, setIsHandlingReply] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [loadingGetNote, setLoadingGetNote] = useState(false);

  //error region
  const [error, setError] = useState(false);

  //panel region
  const [openPanel, setOpenPanel] = useState(false);
  const [openGamePanel, setOpenGamePanel] = useState(false);
  const [openMessagePanel, setOpenMessagePanel] = useState(false);

  //notes region
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!openHistoryCheck) {
      const showTooltipTimeout = setTimeout(() => {
        setOpenTooltip(true);
      }, 1000);

      const hideTooltipTimeout = setTimeout(() => {
        setOpenTooltip(false);
      }, 5000);

      return () => {
        clearTimeout(showTooltipTimeout);
        clearTimeout(hideTooltipTimeout);
      };
    }
  }, [openHistoryCheck]);

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
            setTodayChecked(data.checked);
            setError(false);
          } else {
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
  }, []);

  //get notebook
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

  const handleSendMsgOrTitle = async () => {
    setIsButtonLoading(true);
    if (!todayDocId) return;

    if (modalType === "editTitle") {
      const itemDoc = doc(db, "check", todayDocId);
      await updateDoc(itemDoc, { title: content });
    } else if (modalType === "sendMsg") {
      await addDoc(collection(db, "msg"), {
        author: userState.user.uid,
        text: content,
        isSeen: false,
        sendAt: Timestamp.fromDate(new Date()),
      });
    }
    setModalType("");
    setContent("");
    setIsButtonLoading(false);
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

  return (
    <>
      <div className="app">
        <Layout className="layout">
          <HeaderApp />
          {loading && (
            <div
              style={{
                width: "100%",
                height: "calc(100vh - 100px - 64px)",
                backgroundColor: theme.backgroundColorBase,
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
          {!loading && (
            <Content className="content">
              {!loading && !error && (
                <>
                  {todayChecked ? (
                    <>
                      <div>{`hôm nay em đã uống thuốc rồi :)))`}</div>
                      <Tooltip
                        placement="bottom"
                        title={"Bấm để xem lịch sử uống thuốc!"}
                        arrow={true}
                        open={openTooltip}
                        zIndex={0}
                      >
                        <img
                          onClick={() => setOpenHistoryCheck(true)}
                          alt=""
                          src={image}
                          style={styleImage}
                        />
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <div>{`hôm nay em chưa uống thuốc !!!!`}</div>
                      <Tooltip
                        placement="bottom"
                        title={"Bấm để xem lịch sử uống thuốc!"}
                        arrow={true}
                        open={openTooltip}
                        zIndex={0}
                      >
                        <img
                          onClick={() => setOpenHistoryCheck(true)}
                          alt=""
                          src={image2}
                          style={styleImage}
                        />
                      </Tooltip>
                    </>
                  )}
                </>
              )}
              {error && (
                <>
                  <div>{`có gì đó sai sai, tải lại trang xem !!`}</div>
                  <img alt="" src={image1} style={styleImage} />
                </>
              )}
            </Content>
          )}
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
              setOpenMessagePanel(true);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 50,
            }}
            icon={<CommentOutlined />}
          />
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
          <Button
            disabled={!(!todayChecked && !loading && !error)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 50,
            }}
            icon={
              !loading ? (
                <FormOutlined />
              ) : (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />}
                />
              )
            }
            onClick={() => {
              setModalType("editTitle");
            }}
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
                setModalType("sendMsg");
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
        open={modalType === "sendMsg" || modalType === "editTitle"}
        footer={null}
        onCancel={() => {
          setContent("");
          setModalType("");
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {msgContentNotSeen.length > 0 && modalType === "sendMsg" && (
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`${
              modalType === "editTitle"
                ? "lời nhắc nhở uống thuốc :))"
                : "gửi tin nhắn cho người ấy :))"
            }`}
          />
          <Button
            loading={isButtonLoading}
            disabled={!Boolean(content)}
            onClick={() => handleSendMsgOrTitle()}
          >
            Oske nhoo !!
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
      <MessagePanel
        open={openMessagePanel}
        onClosePanel={() => setOpenMessagePanel(false)}
      />
      <CalendarHistoryCheck
        isOpen={openHistoryCheck}
        onClose={() => setOpenHistoryCheck(false)}
      />
    </>
  );
}

export default AppAdmin;
