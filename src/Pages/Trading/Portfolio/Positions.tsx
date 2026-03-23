import React, { useEffect, useState } from "react";
import { Row, Col, Input, Button, Select, Tooltip, Badge } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import PositionSummary from "./PositionSummary";
import PositionTable from "./PositionTable";
import { positionService } from "../../../Services/positionService";

const { Option } = Select;

const greyBtn = { background: "#6e6e6e", color: "#fff" };
const orangeBtn = { background: "#ff8c5a", color: "#fff" };

const Positions: React.FC = () => {
  const [positions, setPositions] = useState<any[]>([]);
  const [realtimeTotals, setRealtimeTotals] = useState({ m2m: 0, pnl: 0, status: 'Initializing' });
  const [searchText, setSearchText] = useState("");
  const [openType, setOpenType] = useState("ALL");

  useEffect(() => {
    const fetchLive = async () => {
      const data = await positionService.getRealtimePnL();
      setRealtimeTotals({
        m2m: data.total_m2m,
        pnl: data.total_pnl,
        status: data.status
      });
      if (data.positions) {
        setPositions(data.positions);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Row gutter={10} align="middle" style={{ marginBottom: 10 }}>
        <Col flex="auto">
          <h2>Positions <Badge status={realtimeTotals.status === 'Live' ? 'processing' : 'warning'} text={`5paisa: ${realtimeTotals.status}`} /></h2>
        </Col>
        <Col>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        </Col>
      </Row>

      <PositionSummary m2m={realtimeTotals.m2m} pnl={realtimeTotals.pnl} />

      <PositionTable 
        positions={positions} 
        searchText={searchText} 
        openOnly={openType === "OPEN"} 
      />
    </div>
  );
};

export default Positions;
