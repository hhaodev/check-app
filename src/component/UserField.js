import { Avatar, Badge } from "antd";
import React from "react";

const UserField = ({ email, status }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
      }}
    >
      <Badge
        dot
        style={{
          width: "10px",
          height: "10px",
          backgroundColor: status ? "green" : "red",
          borderRadius: "50%",
        }}
        offset={[1, 18]}
      >
        <Avatar
          style={{
            width: 20,
            height: 20,
            backgroundColor: "#fde3cf",
            color: "#f56a00",
          }}
        >
          {email.charAt(0).toUpperCase()}
        </Avatar>
      </Badge>
      <span
        style={{
          maxWidth: "calc(100% - 10px - 10px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {email}
      </span>
    </div>
  );
};

export default UserField;
