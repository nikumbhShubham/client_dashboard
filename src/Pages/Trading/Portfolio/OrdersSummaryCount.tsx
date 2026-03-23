import React from 'react';
import { Row, Col, Card, Statistic, Tooltip } from 'antd';
import { OrderedListOutlined, HourglassOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface Props {
  total: number;
  open: number;
  completed: number;
}

const OrdersSummaryCount: React.FC<Props> = ({ total, open, completed }) => {
  return (
    <Row gutter={16} style={{ marginTop: 16 }}>
      <Col span={8}>
        <Card size="small" bordered={false} style={{ background: '#f0f2f5' }}>
          <Statistic 
            title={<Tooltip title="Total orders placed today across all accounts">Total Orders</Tooltip>} 
            value={total} 
            prefix={<OrderedListOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card size="small" bordered={false} style={{ background: '#e6f7ff' }}>
          <Statistic 
            title={<Tooltip title="Orders currently pending or partially executed">Open/Pending</Tooltip>} 
            value={open} 
            valueStyle={{ color: '#1890ff' }}
            prefix={<HourglassOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card size="small" bordered={false} style={{ background: '#f6ffed' }}>
          <Statistic 
            title={<Tooltip title="Successfully executed orders">Completed</Tooltip>} 
            value={completed} 
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default OrdersSummaryCount;
