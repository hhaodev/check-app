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
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import HeaderApp from "./component/Header";
import { MessageOutlined } from "@ant-design/icons";
import { AppContext } from "./AppContext";

function AppAdmin() {
  const { userState } = useContext(AppContext);
  const [todayChecked, setTodayChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openModalEdit, setOpenModalEdit] = useState(false);
  const [todayDocId, setTodayDocId] = useState();
  const [data, setData] = useState();
  const [content, setContent] = useState("");
  const [modalType, setModalType] = useState();

  //msg region
  const [contentReply, setContentReply] = useState("");
  const [msgId, setMsgId] = useState([]);
  const [msgContent, setMsgContent] = useState([]);
  const [openModalMsg, setOpenModalMsg] = useState(false);

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

            setOpenModal(data?.msg && !data.isSeen);
          }
        });

        setLoading(false);
      } catch (error) {
        console.error("Error processing snapshot:", error);
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
      await updateDoc(itemDoc, { isSeen: true });

      setOpenModal(false);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };
  const handleSendMsgOrBody = async () => {
    if (!todayDocId) return;

    if (modalType === "editBody") {
      const itemDoc = doc(db, "check", todayDocId);
      await updateDoc(itemDoc, { body: content });

      setOpenModalEdit(false);
    } else if (modalType === "sendMsg") {
      await addDoc(collection(db, "msg"), {
        author: userState.user.uid,
        text: content,
        isSeen: false,
      });
      setContent("");
      setOpenModalEdit(false);
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
      setOpenModalMsg(false);
      setIsHandlingReply(false);
    }
  };

  return (
    <div className="app">
      <Layout className="layout">
        <HeaderApp />
        <Content className="content">
          {!loading && (
            <>
              {todayChecked ? (
                <div>hôm nay em đã uống thuốc rồi</div>
              ) : (
                <div>hôm nay em chưa uống thuốc</div>
              )}
            </>
          )}
        </Content>
      </Layout>
      {!todayChecked && !loading && (
        <FloatButton
          style={{
            insetInlineEnd: 120,
          }}
          onClick={() => {
            setModalType("editBody");
            setOpenModalEdit(true);
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
          setOpenModalEdit(true);
        }}
      />
      <Modal
        closable={false}
        width={250}
        open={openModalEdit}
        footer={null}
        onCancel={() => setOpenModalEdit(false)}
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`${
              modalType === "editBody"
                ? "lời nhắc nhở uống thuốc :))"
                : "gửi tin nhắn cho người ấy :))"
            }`}
          ></Input>
          <Button
            disabled={!Boolean(content)}
            onClick={() => handleSendMsgOrBody()}
          >
            Oske nhoo !!
          </Button>
        </div>
      </Modal>
      <Modal
        title="tin nhắn đến từ người ấy :))"
        closable={false}
        width={250}
        open={openModal}
        footer={null}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div>{data?.msg}</div>

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
    </div>
  );
}

export default AppAdmin;
