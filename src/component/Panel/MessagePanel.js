import { Button, Drawer, Space } from "antd";
import React, { useState } from "react";

const MessagePanel = ({ open, onClosePanel }) => {
  const [panelType, setPanelType] = useState("none");
  return (
    <Drawer
      title="Hộp thư"
      open={open}
      onClose={onClosePanel}
      closable={false}
      extra={
        <Space>
          <Button onClick={onClosePanel}>X</Button>
        </Space>
      }
    ></Drawer>
  );
};

export default MessagePanel;
