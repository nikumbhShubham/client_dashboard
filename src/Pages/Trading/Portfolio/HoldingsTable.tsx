import React from 'react';
import { Table } from 'antd';

const HoldingsTable: React.FC = () => {
  return (
    <Table
      bordered
      dataSource={[]}
      columns={[
        { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
        { title: 'Quantity', dataIndex: 'qty', key: 'qty' },
        { title: 'Avg Price', dataIndex: 'avgPrice', key: 'avgPrice' },
        { title: 'Current Value', dataIndex: 'value', key: 'value' },
      ]}
      locale={{ emptyText: 'No holdings' }}
    />
  );
};

export default HoldingsTable;
