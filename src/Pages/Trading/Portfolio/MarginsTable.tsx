import React, { useEffect, useState } from 'react';
import { Table, Badge } from 'antd';
import { marginService, AccountMargin } from '../../../Services/marginService';

const columns = [
  {
    title: 'Account',
    dataIndex: 'nickname',
    key: 'nickname',
    render: (val: string, record: AccountMargin) => (
      <strong>{val} ({record.trading_login_id})</strong>
    ),
  },
  {
    title: 'Available Cash',
    key: 'cash',
    render: (_: any, record: AccountMargin) => (
      <span style={{ color: '#52c41a', fontWeight: 600 }}>
        ₹{(record.equity?.available?.cash || 0).toFixed(2)}
      </span>
    ),
  },
  {
    title: 'Net Margin',
    key: 'net',
    render: (_: any, record: AccountMargin) => (
      <span style={{ color: (record.equity?.net || 0) >= 0 ? '#52c41a' : '#f5222d', fontWeight: 600 }}>
        ₹{(record.equity?.net || 0).toFixed(2)}
      </span>
    ),
  },
  {
    title: 'Utilized',
    key: 'utilized',
    render: (_: any, record: AccountMargin) => (
      <span style={{ color: '#fa8c16', fontWeight: 600 }}>
        ₹{(record.equity?.utilised?.debits || 0).toFixed(2)}
      </span>
    ),
  },
  {
    title: 'Collateral',
    key: 'collateral',
    render: (_: any, record: AccountMargin) => (
      <span>₹{(record.equity?.available?.collateral || 0).toFixed(2)}</span>
    ),
  },
  {
    title: 'Exposure',
    key: 'exposure',
    render: (_: any, record: AccountMargin) => (
      <span>₹{(record.equity?.utilised?.exposure || 0).toFixed(2)}</span>
    ),
  },
  {
    title: 'SPAN',
    key: 'span',
    render: (_: any, record: AccountMargin) => (
      <span>₹{(record.equity?.utilised?.span || 0).toFixed(2)}</span>
    ),
  },
  {
    title: 'Broker',
    dataIndex: 'broker_name',
    key: 'broker_name',
    render: (val: string) => <Badge status="processing" text={val} />,
  },
];

const MarginsTable: React.FC = () => {
  const [data, setData] = useState<AccountMargin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMargins = async () => {
      try {
        const result = await marginService.getAll();
        if (result.margins && result.margins.length > 0) {
          setData(result.margins);
        }
      } catch (error) {
        console.warn('Failed to fetch margin data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMargins();
    const interval = setInterval(fetchMargins, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Table
      bordered
      loading={loading}
      dataSource={data}
      columns={columns}
      rowKey={(record) => record.trading_login_id || String(record.account_id)}
      locale={{ emptyText: 'No margin data — backend may be offline' }}
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default MarginsTable;
