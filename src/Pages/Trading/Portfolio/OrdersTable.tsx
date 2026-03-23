import React from 'react';
import { Table, Tag } from 'antd';
import type { Order } from '../../../Services/orderService';
import type { ColumnsType } from 'antd/es/table';

interface Props {
  orders: Order[];
  loading?: boolean;
}

const sideColors: Record<string, string> = {
  B: '#52c41a',
  S: '#f5222d',
};

const statusColors: Record<string, string> = {
  Complete: 'green',
  Rejected: 'red',
  Cancelled: 'default',
  Pending: 'blue',
  'All Executed': 'green',
};

const formatTime = (val: string) => {
  if (!val || val === 'null' || val === '--:--:--') return '--:--:--';
  
  // 1. Handle 5paisa /Date(123456789+0530)/ format
  if (typeof val === 'string' && val.includes('/Date')) {
    const match = val.match(/\/Date\((\d+)([+-]\d+)?\)\//);
    if (match) {
      const ms = parseInt(match[1]);
      return new Date(ms).toLocaleTimeString();
    }
  }

  // 2. Handle raw numeric string (timestamp)
  if (/^\d+$/.test(val.toString())) {
    const num = parseInt(val);
    const date = new Date(num > 10000000000 ? num : num * 1000);
    if (date.toString() !== 'Invalid Date') {
      return date.toLocaleTimeString();
    }
  }

  // 3. Try standard parsing
  try {
    if (val.includes(':')) {
       // If it's already HH:MM:SS, just return it
       const parts = val.split(' ');
       return parts.length > 1 ? parts[1] : val;
    }
    const date = new Date(val);
    if (date.toString() !== 'Invalid Date') {
      return date.toLocaleTimeString();
    }
  } catch (e) {}

  return val;
};

const columns: ColumnsType<Order> = [
  {
    title: 'Time',
    dataIndex: 'time',
    key: 'time',
    width: 100,
    render: (val: string) => (
      <span style={{ fontSize: '13px', color: '#595959', fontWeight: 500 }}>
        {formatTime(val)}
      </span>
    ),
  },
  {
    title: 'Account',
    dataIndex: 'account',
    key: 'account',
    render: (val: string, record) => (
      <div>
        <strong>{val}</strong>
        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{record.client_code}</div>
      </div>
    ),
  },
  {
    title: 'Order ID',
    dataIndex: 'order_id',
    key: 'order_id',
    render: (val: string) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{val}</span>,
  },
  {
    title: 'Symbol',
    dataIndex: 'symbol',
    key: 'symbol',
    render: (val: string) => <strong style={{ color: '#262626' }}>{val}</strong>,
  },
  {
    title: 'Side',
    dataIndex: 'side',
    key: 'side',
    render: (side: string) => (
      <span style={{ color: sideColors[side] || '#000', fontWeight: 'bold' }}>
        {side === 'B' ? 'BUY' : 'SELL'}
      </span>
    ),
  },
  {
    title: 'Qty',
    dataIndex: 'qty',
    key: 'qty',
    align: 'right',
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    align: 'right',
    render: (val: number | null) => (val !== null && val !== undefined) ? `₹${val.toFixed(2)}` : '₹0.00',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const s = (status || '').toUpperCase();
      let color = 'default';
      if (s.includes('COMPLETE') || s.includes('EXECUTED')) color = 'green';
      if (s.includes('REJECTED')) color = 'red';
      if (s.includes('CANCEL')) color = 'orange';
      if (s.includes('PENDING')) color = 'blue';
      
      return (
        <Tag color={color} style={{ fontSize: '11px' }}>
          {s}
        </Tag>
      );
    },
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (val: string) => <span style={{ fontSize: '12px' }}>{(val || '').toUpperCase()}</span>,
  },
];

const OrdersTable: React.FC<Props> = ({ orders, loading }) => {
  return (
    <Table
      bordered
      loading={loading}
      dataSource={orders}
      columns={columns}
      rowKey={(record) => record.order_id || `${record.client_code}-${record.scripCode}`}
      locale={{ emptyText: 'No orders found' }}
      style={{ marginTop: 16 }}
      pagination={{ pageSize: 15 }}
      size="small"
    />
  );
};

export default OrdersTable;
