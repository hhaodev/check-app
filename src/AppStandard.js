import { Button, FloatButton, Input, Layout, Modal } from "antd";
import "./App.css";
import { Content } from "antd/es/layout/layout";
import { db } from "./firebaseConfig";
import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import HeaderApp from "./component/Header";

function AppStandard() {
  const [todayChecked, setTodayChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [todayDocId, setTodayDocId] = useState();
  const [text, setText] = useState("");
  const [data, setData] = useState();
  const [result, setResult] = useState(false);

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
            if (!data.checked) {
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
      await updateDoc(itemDoc, { checked: true, msg: text, isSeen: false });

      setTodayChecked(true);
      setResult(true);
      setOpenModal(false);
    } catch (error) {
      console.error("Error updating document:", error);
    }
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
            onChange={(e) => setText(e.target.value)}
            placeholder="có gì nói hong, viết ở đây :))"
          ></Input>
          <Button onClick={() => handleOk()}>Oske nhoo !!</Button>
        </div>
      </Modal>
    </div>
  );
}

export default AppStandard;
