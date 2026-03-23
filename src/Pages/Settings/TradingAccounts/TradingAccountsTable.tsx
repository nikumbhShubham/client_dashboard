import React, { useEffect, useState } from 'react';
import { Table, Button, message, Popconfirm, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { accountService, Account } from '../../../Services/accountService';
import type { ColumnsType } from 'antd/es/table';

interface AccountTableData {
  key: string;
  client_code: string;
  nickname: string;
  broker: string;
  is_enabled: boolean;
}

const TradingAccountsTable: React.FC<{ searchText: string }> = ({ searchText }) => {
  const [accounts, setAccounts] = useState<AccountTableData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await accountService.getAll();
      const rows = (response.accounts || []).map((acc) => ({
        key: acc.trading_login_id || acc.account_id?.toString() || '',
        client_code: acc.trading_login_id || '',
        nickname: acc.nickname || 'N/A',
        broker: acc.broker_name || 'FIVEPAISA',
        is_enabled: acc.is_enabled,
      }));
      setAccounts(rows);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      message.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (clientCode: string) => {
    try {
      await accountService.delete(clientCode);
      setAccounts((prev) => prev.filter((a) => a.client_code !== clientCode));
      message.success('Account deleted');
    } catch (error: any) {
      message.error('Failed to delete account');
    }
  };

  const columns: ColumnsType<AccountTableData> = [
    {
      title: 'Client Code',
      dataIndex: 'client_code',
      key: 'client_code',
      render: (val: string) => <strong>{val}</strong>,
    },
    {
      title: 'Name',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: 'Broker',
      dataIndex: 'broker',
      key: 'broker',
    },
    {
      title: 'Status',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'orange'}>
          {enabled ? 'Logged In' : 'Offline'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete this account?"
          description="This will remove the account from MongoDB."
          onConfirm={() => handleDelete(record.client_code)}
        >
          <Button icon={<DeleteOutlined />} size="small" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Filter by search text
  const filtered = searchText
    ? accounts.filter((a) =>
        Object.values(a).some((val) =>
          String(val).toLowerCase().includes(searchText.toLowerCase())
        )
      )
    : accounts;

  return (
    <Table
      bordered
      columns={columns}
      dataSource={filtered}
      loading={loading}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: 'No accounts — add one using Create button' }}
    />
  );
};

export default TradingAccountsTable;
