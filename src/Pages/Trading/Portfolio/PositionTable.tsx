import React, { useEffect, useState } from "react";
import { Table } from "antd";

const columns = [
    {
      key: "symbol",
      title: "Symbol",
      dataIndex: "symbol",
      width: 140,
      render: (val: string) => <strong>{val}</strong>
    },
    {
      key: "m2m",
      title: "M2M",
      dataIndex: "m2m",
      width: 110,
      render: (val: number) => <span style={{ color: val >= 0 ? '#52c41a' : '#f5222d', fontWeight: 600 }}>₹{(val || 0).toFixed(2)}</span>
    },
    {
      key: "pnl",
      title: "Booked PnL",
      dataIndex: "pnl",
      width: 110,
      render: (val: number) => <span style={{ color: val >= 0 ? '#52c41a' : '#f5222d' }}>₹{(val || 0).toFixed(2)}</span>
    },
    {
      key: "netqty",
      title: "Net Qty",
      dataIndex: "netqty",
      width: 80,
    },
    {
      key: "ltp",
      title: "LTP",
      dataIndex: "ltp",
      width: 100,
      render: (val: number) => `₹${(val || 0).toFixed(2)}`
    },
    {
      key: "buyavg",
      title: "Buy Avg",
      dataIndex: "buyavg",
      width: 100,
      render: (val: number) => `₹${(val || 0).toFixed(2)}`
    },
    {
      key: "sellavg",
      title: "Sell Avg",
      dataIndex: "sellavg",
      width: 100,
      render: (val: number) => `₹${(val || 0).toFixed(2)}`
    },
    {
      key: "direction",
      title: "Direction",
      dataIndex: "direction",
      width: 90,
      render: (val: string) => (
        <span style={{ 
          color: val === 'LONG' ? '#52c41a' : val === 'SHORT' ? '#f5222d' : '#999',
          fontWeight: 600 
        }}>
          {val}
        </span>
      )
    },
    {
      key: "exchange",
      title: "Exchange",
      dataIndex: "exchange",
      width: 80,
    },
    {
      key: "account",
      title: "Account",
      dataIndex: "account",
      width: 140,
      render: (val: string) => <span style={{ color: '#1890ff' }}>{val}</span>
    }
];

interface PositionTableProps {
  positions: any[];
  searchText: string;
  openOnly: boolean;
}

const PositionTable: React.FC<PositionTableProps> = ({ positions, searchText, openOnly }) => {
  const [filteredData, setFilteredData] = useState<any[]>([]);

  useEffect(() => {
    let tempData = positions;
    
    if (openOnly) {
        tempData = tempData.filter(p => p.netqty !== 0);
    }

    if (searchText) {
      tempData = tempData.filter((row: any) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    setFilteredData(tempData);
  }, [searchText, positions, openOnly]);

  return (
    <Table
      bordered
      columns={columns}
      dataSource={filteredData}
      rowKey={(record: any) => record.scripCode || record.symbol || Math.random()}
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default PositionTable;

