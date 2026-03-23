import React, { useState } from "react";
import { Input, Row, Col, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import MarginsTable from "./MarginsTable";

const Margins: React.FC = () => {
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
            style={{ width: 250 }}
          />
        </Col>
      </Row>
      <MarginsTable />
    </div>
  );
};

export default Margins;
