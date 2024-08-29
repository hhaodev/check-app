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

function AppStandard() {
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

        setLoading(false);
      } catch (error) {
        console.error("Error processing snapshot:", error);
        setLoading(false);
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
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.author !== userState.user.uid && data.isSeen === false) {
              setMsgId((pre) => [...pre, doc.id]);
              setMsgContent((pre) => [...pre, data]);
              setOpenModalMsg(true);
            }
          });
        } catch (error) {
          console.error("Error processing snapshot:", error);
        }
      });

      return () => unsubscribe();
    }
  }, [isHandleReply]);

  const handleOk = async () => {
    if (!todayDocId) return;

    try {
      const itemDoc = doc(db, "check", todayDocId);
      await updateDoc(itemDoc, { checked: true, msg: text, isSeen: false });

      setTodayChecked(true);
      setResult(true);
      setOpenModal(false);
      setText("");
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const handleReplyMsg = async () => {
    setIsHandlingReply(true); // Bắt đầu xử lý

    try {
      for (const i of msgId) {
        // const itemDoc = doc(db, "msg", i);
        // await updateDoc(itemDoc, { isSeen: true });
        await deleteDoc(doc(db, "msg", i)); // Nếu cần xóa
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
    if (!todayDocId) return;

    await addDoc(collection(db, "msg"), {
      author: userState.user.uid,
      text: msgSendContent,
      isSeen: false,
    });
    setMsgSendContent("");
    setOpenModalSendMsg(false);
  };

  return (
    <div className="app">
      <Layout className="layout">
        <HeaderApp />
        <Content className="content">
          {!loading && todayChecked && (
            <>
              {result ? (
                <div>{`uống òi hả, giỏi :))) thưởng 1 nháy !!`}</div>
              ) : (
                <div>hôm nay em đã uống thuốc rồi</div>
              )}
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
          }}
        >
          <div>{Boolean(data?.body) ? data?.body : `uống thuốc nèeee!!`}</div>

          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="có gì nói hong, viết ở đây :))"
          ></Input>
          <Button onClick={() => handleOk()}>Oske nhoo !!</Button>
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
          }}
        >
          {msgContent?.map((i, index) => {
            return <div key={index}>{`"${i?.text}"`}</div>;
          })}

          <Input
            value={contentReply}
            onChange={(e) => setContentReply(e.target.value)}
            placeholder="reply???"
          ></Input>
          <Button onClick={() => handleReplyMsg()}>Oske nhoo !!</Button>
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
          <Input
            value={msgSendContent}
            onChange={(e) => setMsgSendContent(e.target.value)}
            placeholder={"gửi tin nhắn cho người ấy :))"}
          ></Input>
          <Button
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
