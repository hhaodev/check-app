import { Button, FloatButton, Input, Layout, Modal } from "antd";
import "./App.css";
import { Content } from "antd/es/layout/layout";
import { db } from "./firebaseConfig";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import HeaderApp from "./component/Header";
import { MessageOutlined } from "@ant-design/icons";
import { useAppContext } from "./context/AppContext";
import image from "./assets/pn.png";
import image2 from "./assets/146defa1-583e-467a-a7d2-29f7e3dc9cb5.png";
import image1 from "./assets/e7afd37c-b941-4942-bff0-f8b19e7cd45c.png";
import { formatTime } from "./ultis";

function AppAdmin() {
  const { TextArea } = Input;
  const { userState, todayDocId, setTodayDocId } = useAppContext();
  const [todayChecked, setTodayChecked] = useState(false);
  const [content, setContent] = useState("");
  const [modalType, setModalType] = useState();

  //msg region
  const [contentReply, setContentReply] = useState("");
  const [msgId, setMsgId] = useState([]);
  const [msgContent, setMsgContent] = useState([]);
  const [openModalMsg, setOpenModalMsg] = useState(false);

  //loading region
  const [loading, setLoading] = useState(true);
  const [isHandleReply, setIsHandlingReply] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "check"), (querySnapshot) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const itemDate = new Date(data.day.seconds * 1000);
          itemDate.setHours(0, 0, 0, 0);

          if (itemDate.getTime() === today.getTime()) {
            setTodayDocId(doc.id);
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

  useEffect(() => {
    if (!isHandleReply) {
      const unsubscribe = onSnapshot(collection(db, "msg"), (querySnapshot) => {
        try {
          const msgId = [];
          const msgContent = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.author !== userState.user.uid && data.isSeen === false) {
              msgId.push(doc.id);
              msgContent.push(data);
              setOpenModalMsg(true);
            }
          });

          msgContent.sort((a, b) => {
            return b.sendAt.seconds - a.sendAt.seconds;
          });

          setMsgId(msgId);
          setMsgContent(msgContent);
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
    <div className="app">
      <Layout className="layout">
        <HeaderApp />
        <Content className="content">
          {!loading && !error && (
            <>
              {todayChecked ? (
                <>
                  <div>{`hôm nay em đã uống thuốc rồi :)))`}</div>
                  <img
                    alt=""
                    src={image}
                    style={{
                      width: "80%",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </>
              ) : (
                <>
                  <div>{`hôm nay em chưa uống thuốc !!!!`}</div>
                  <img
                    alt=""
                    src={image2}
                    style={{
                      width: "80%",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </>
              )}
            </>
          )}
          {error && (
            <>
              <div>{`có gì đó sai sai, check DB mau!!`}</div>
              <img
                alt=""
                src={image1}
                style={{
                  width: "80%",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            </>
          )}
        </Content>
      </Layout>
      {!todayChecked && !loading && !error && (
        <FloatButton
          style={{
            insetInlineEnd: 120,
          }}
          onClick={() => {
            setModalType("editTitle");
          }}
        />
      )}
      <FloatButton
        style={{
          insetInlineEnd: 40,
        }}
        icon={<MessageOutlined />}
        onClick={() => {
          setModalType("sendMsg");
        }}
      />
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
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                key={index}
              >
                {`"${i?.text}" `}
                <div
                  style={{
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignContent: "flex-end",
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
    </div>
  );
}

export default AppAdmin;
