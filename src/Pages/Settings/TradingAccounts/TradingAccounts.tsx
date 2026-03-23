import React, { useState } from "react";
import { Button, Input, Row, Col, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import TradingAccountsTable from "./TradingAccountsTable";
import ValidateAll from "./ValidateAll";

const greyBtn = { background: "#7f8c8d", color: "#fff" };
const tealBtn = { background: "#0bb", color: "#fff" };

const TradingAccounts: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState("LIST");
  const navigate = useNavigate();

  return (
    <div style={{ padding: 16 }}>
      <h2>Trading Accounts</h2>

      <p style={{ color: "#c45a00", marginBottom: 12 }}>
        A list of all your trading accounts configured with AutoTrader.
      </p>

      <Row gutter={8} style={{ marginBottom: 12 }}>
        <Col>
          <Tooltip title="Create a Trading Account.">
            <Button
              style={tealBtn}
              onClick={() =>
                navigate("/settings/tradingaccounts/createtradingaccount")
              }
            >
              Create
            </Button>
          </Tooltip>
        </Col>
        
        <Col>
          <Tooltip title="Validate all live accounts.">
            <Button
              style={tealBtn}
              onClick={() => setViewMode("VALIDATE")}
              >
              Validate All
            </Button>
          </Tooltip>
        </Col>

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

      {viewMode === "LIST" && (
        <TradingAccountsTable searchText={searchText} />
      )}

      {viewMode === "VALIDATE" && <ValidateAll />}
      
    </div>
  );
};

export default TradingAccounts;
