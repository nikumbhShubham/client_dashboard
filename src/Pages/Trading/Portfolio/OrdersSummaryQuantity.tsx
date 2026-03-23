import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { NumberOutlined } from '@ant-design/icons';

interface Props {
  totalQty: number;
}

const OrdersSummaryQuantity: React.FC<Props> = ({ totalQty }) => {
  return (
    <Row gutter={16} style={{ marginTop: 16 }}>
      <Col span={8}>
        <Card size="small" bordered={false} style={{ background: '#fff7e6' }}>
          <Statistic 
            title="Total Quantity" 
            value={totalQty} 
            prefix={<NumberOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default OrdersSummaryQuantity;
