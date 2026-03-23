import React, { useState } from "react";
import { Input, Row, Col } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import HoldingsTable from "./HoldingsTable";

const Holdings: React.FC = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col flex="auto" />
        <Col>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
          />
        </Col>
      </Row>
      <HoldingsTable />
    </div>
  );
};

export default Holdings;
