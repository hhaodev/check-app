import { Button, FloatButton, Input, Layout, Modal } from "antd";
import "./App.css";
import { Content } from "antd/es/layout/layout";
import { db } from "./firebaseConfig";
import { useContext, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import HeaderApp from "./component/Header";
import { AppContext } from "./AppContext";
import { MessageOutlined } from "@ant-design/icons";
import { usePageVisibility } from "./ultis";
import image from "./assets/05293ae8-0358-40d5-8e77-6ffa74f2775a.png";
import image1 from "./assets/a1cfc369-1fcc-4bfe-b566-962ecec25168.png";
import image2 from "./assets/20b98398-62fd-4cef-91a7-6004aa5b23d4.png";

function AppStandard() {
  const { TextArea } = Input;
  const { userState } = useContext(AppContext);
  const [todayChecked, setTodayChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [todayDocId, setTodayDocId] = useState();
  const [text, setText] = useState("");
  const [data, setData] = useState();
  const [result, setResult] = useState(false);

  //msg region
  const [contentReply, setContentReply] = useState("");
  const [msgId, setMsgId] = useState([]);
  const [msgContent, setMsgContent] = useState([]);
  const [openModalMsg, setOpenModalMsg] = useState(false);
  const [openModalSendMsg, setOpenModalSendMsg] = useState(false);
  const [msgSendContent, setMsgSendContent] = useState();

  const [isHandleReply, setIsHandlingReply] = useState(false);
  const [isHandleOk, setIsHandleOk] = useState(false);
  const [isCheckLater, setIsCheckLater] = useState(false);

  const [isHandleSendMsg, setIsHandleSendMsg] = useState(false);

  const isVisible = usePageVisibility();

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
            setData(data);
            setTodayDocId(doc.id);
            setTodayChecked(data.checked);
            setOpenModal(!data.checked);
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
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.author !== userState.user.uid && data.isSeen === false) {
              msgId.push(doc.id);
              msgContent.push(data);
              setOpenModalMsg(true);
            }
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

  const handleOk = async () => {
    setIsHandleOk(true);
    if (!todayDocId) return;

    try {
      const itemDoc = doc(db, "check", todayDocId);
      await updateDoc(itemDoc, { checked: true, msg: text, isSeen: false });

      setResult(true);
      setOpenModal(false);
      setText("");
    } catch (error) {
      console.error("Error updating document:", error);
    } finally {
      setIsHandleOk(false);
    }
  };

  const handleReplyMsg = async () => {
    setIsHandlingReply(true); // Bắt đầu xử lý

    try {
      for (const i of msgId) {
        await deleteDoc(doc(db, "msg", i));
      }

      if (Boolean(contentReply)) {
        await addDoc(collection(db, "msg"), {
          author: userState.user.uid,
          text: contentReply,
          isSeen: false,
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
    });
    setMsgSendContent("");
    setOpenModalSendMsg(false);
    setIsHandleSendMsg(false);
  };

  return (
    <div className="app">
      <Layout className="layout">
        <HeaderApp />
        <Content className="content">
          {!loading && todayChecked && !isHandleOk && (
            <>
              {result ? (
                <>
                  <div>{`uống òi hả, giỏi !! thưởng 1 nháy :)))`}</div>
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
                  <div>{`hôm ni em ún thuốc roàii !!`}</div>
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
          {isCheckLater && (
            <>
              <div>{`nhớ 7h uống thuốc đó nghen :))`}</div>
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
      <FloatButton
        style={{
          insetInlineEnd: 40,
        }}
        icon={<MessageOutlined />}
        onClick={() => {
          setOpenModalSendMsg(true);
        }}
      />
      <Modal closable={false} width={250} open={openModal} footer={null}>
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
            }}
          >
            {Boolean(data?.body) ? data?.body : `uống thuốc nèeee!!`}
          </div>

          <TextArea
            autoSize={{ minRows: 3 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
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
        closable={false}
        width={250}
        open={openModalMsg}
        footer={null}
        onCancel={() => handleReplyMsg()}
        title="tin nhắn đến từ người ấy :))"
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
                }}
                key={index}
              >{`"${i?.text}"`}</div>
            );
          })}

          <TextArea
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
        closable={false}
        width={250}
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
          <TextArea
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
    </div>
  );
}

export default AppStandard;
