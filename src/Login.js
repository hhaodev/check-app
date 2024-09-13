import { Button, Form, Input, message } from "antd";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { useCustomTheme } from "./context/AppContext";
import { auth, db } from "./firebaseConfig";

const Login = () => {
  const theme = useCustomTheme();
  const [loading, setLoading] = useState(false);
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      if (user && user.uid) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (!docSnap.exists()) {
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            uid: user.uid,
          });
        }
      }
    } catch (error) {
      message.error("Người dùng không tồn tại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colorBackgroundBase,
        color: theme.colorTextBase,
        gap: 20,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700 }}>Đăng nhập</div>
      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Email không được để trống!",
            },
          ]}
        >
          <Input type="email" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[
            {
              required: true,
              message: "Mật khẩu không được để trống!",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button type="primary" htmlType="submit" loading={loading}>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
