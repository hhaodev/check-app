import React from "react";
import { Button, Form, Input } from "antd";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useCustomTheme } from "./context/AppContext";

const Login = () => {
  const theme = useCustomTheme();

  const onFinish = (values) => {
    try {
      signInWithEmailAndPassword(auth, values.email, values.password);
    } catch (error) {
      console.error("Error logging in:", error);
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
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700 }}>Login</div>
      <Form
        style={{
          color: "white !important",
          width: "70%",
        }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Please input your email!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: "Please input your password!",
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
          <Button type="primary" htmlType="submit">
            Sign In
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
