import React, { useState } from "react";
import { Input, Row, Col } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import NotificationsTable from "./NotificationsTable.tsx";

const Notifications: React.FC = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col flex="auto" />
        <Col>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search"
            style={{ width: 220 }}
            value={searchText}
            onChange={(e)=>setSearchText(e.target.value)}
          />
        </Col>
      </Row>
      <NotificationsTable searchText={searchText}/>
    </div>
  );
};

export default Notifications;
