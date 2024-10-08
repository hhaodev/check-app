import { MacCommandOutlined } from "@ant-design/icons";
import { Button, Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import React, { useState } from "react";
import image from "./assets/pn.png";
import HeaderApp from "./component/Header";
import ListenGame from "./component/ListenGame";
import TicTacToePanel from "./component/Panel/TicTacToePanel";
import { useCustomTheme } from "./context/AppContext";

const styleImage = {
  width: "80%",
  maxWidth: "450px",
  objectFit: "contain",
  borderRadius: "8px",
};

const AppNormal = () => {
  const theme = useCustomTheme();
  const [openGamePanel, setOpenGamePanel] = useState(false);

  return (
    <>
      <div className="app">
        <Layout className="layout">
          <HeaderApp />
          <Content className="content">
            <div>{`Chào mừng bạn đến với Check App :)))`}</div>
            <img alt="" src={image} style={styleImage} />
          </Content>
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
            onClick={() => setOpenGamePanel(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 50,
            }}
            icon={<MacCommandOutlined />}
          />
        </div>
      </div>
      <TicTacToePanel
        open={openGamePanel}
        onClosePanel={() => setOpenGamePanel(false)}
      />
      <ListenGame onAcpGame={() => setOpenGamePanel(true)} />
    </>
  );
};

export default AppNormal;
