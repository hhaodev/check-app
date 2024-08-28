import { Button, FloatButton, Input, Layout, Modal } from "antd";
import "./App.css";
import { Content } from "antd/es/layout/layout";
import { db } from "./firebaseConfig";
import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import HeaderApp from "./component/Header";

function AppAdmin() {
  const [todayChecked, setTodayChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openModalEdit, setOpenModalEdit] = useState(false);
  const [todayDocId, setTodayDocId] = useState();
  const [data, setData] = useState();
  const [body, setBody] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "check"));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let foundTodayItem = false;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const itemDate = new Date(data.day.seconds * 1000);
          itemDate.setHours(0, 0, 0, 0);

          if (itemDate.getTime() === today.getTime()) {
            setData(data);
            setTodayDocId(doc.id);
            setTodayChecked(data.checked);
            foundTodayItem = true;
            if (data?.msg && !data.isSeen) {
              setOpenModal(true);
            }
          }
        });

        if (!foundTodayItem) {
          setOpenModal(true);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
  const handleAddBody = async () => {
    if (!todayDocId) return;

    try {
      const itemDoc = doc(db, "check", todayDocId);
      await updateDoc(itemDoc, { body: body });

      setOpenModalEdit(false);
    } catch (error) {
      console.error("Error updating document:", error);
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
            insetInlineEnd: 40,
          }}
          onClick={() => setOpenModalEdit(true)}
        />
      )}
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
            onChange={(e) => setBody(e.target.value)}
            placeholder="lời nhắc nhở uống thuốc :))"
          ></Input>
          <Button onClick={() => handleAddBody()}>Oske nhoo !!</Button>
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
    </div>
  );
}

export default AppAdmin;
