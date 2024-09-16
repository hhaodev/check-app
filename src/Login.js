import { Button, Form, Input, message } from "antd";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { useCustomTheme } from "./context/AppContext";
import { auth, db, provider } from "./firebaseConfig";
import { signInWithPopup } from "firebase/auth";

const Login = () => {
  const theme = useCustomTheme();
  const [loading, setLoading] = useState(false);
  const [typePage, setTypePage] = useState("login");
  const onFinish = async (values) => {
    setLoading(true);

    if (typePage === "register") {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          uid: user.uid,
          role: "normal",
        });
      } catch (error) {
        if (error.message === "Firebase: Error (auth/email-already-in-use).") {
          message.error("Email đã tồn tại trong hệ thống!");
        }
      }
    } else if (typePage === "login") {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
      } catch (error) {
        message.error("Người dùng không tồn tại!");
      }
    }

    setLoading(false);
  };

  const hanleWithGG = async () => {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      uid: user.uid,
      role: "normal",
    });
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

        {typePage !== "login" && (
          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Xác nhận không được để trống!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu không giống nhau!")
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        )}

        <Form.Item
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <Button type="primary" htmlType="submit" loading={loading}>
              {typePage === "login" ? "Đăng nhập" : "Đăng ký"}
            </Button>
            {typePage === "register" ? (
              <Button onClick={() => setTypePage("login")}>Huỷ đăng ký</Button>
            ) : (
              <Button onClick={() => setTypePage("register")}>Đăng ký</Button>
            )}

            <Button
              onClick={hanleWithGG}
              style={{
                backgroundColor: "blue",
                padding: "20px 10px",
              }}
            >
              Đăng nhập bằng Google
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
