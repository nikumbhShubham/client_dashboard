import React from 'react';
import { Table } from 'antd';

const NotificationsTable: React.FC<{ searchText: string }> = () => {
  return (
    <Table
      bordered
      dataSource={[]}
      columns={[
        { title: 'Time', dataIndex: 'time', key: 'time' },
        { title: 'Message', dataIndex: 'message', key: 'message' },
      ]}
      locale={{ emptyText: 'No notifications' }}
    />
  );
};

export default NotificationsTable;
