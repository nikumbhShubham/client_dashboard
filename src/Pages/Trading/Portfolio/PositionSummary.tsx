import React from 'react';
import { Row, Col } from 'antd';
import StatCard from '../../../Components/StatsCards';

interface PositionSummaryProps {
  m2m: number;
  pnl: number;
}

const PositionSummary: React.FC<PositionSummaryProps> = ({ m2m, pnl }) => {
  return (
    <Row gutter={16} style={{ marginTop: 24 }}>
      <Col span={6}>
        <StatCard 
          label="Total M2M (Live)" 
          value={m2m.toFixed(2)} 
          color={m2m >= 0 ? "#52c41a" : "#f5222d"} 
        />
      </Col>
      <Col span={6}>
        <StatCard 
          label="Total PnL (Booked)" 
          value={pnl.toFixed(2)} 
          color="#1890ff" 
        />
      </Col>
    </Row>
  );
};

export default PositionSummary;
