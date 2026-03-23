import React, { useState } from "react";
import { Table, Select, Tag } from "antd";

const { Option } = Select;

const columns = [
  { title: "Login ID", dataIndex: "loginId", sorter: true },
  { title: "Nickname", dataIndex: "nickname", sorter: true },
  { title: "Live", dataIndex: "live", sorter: true },
  { title: "Session", dataIndex: "session", sorter: true },
  { title: "Message", dataIndex: "message", sorter: true },
  {
    title: "Valid",
    dataIndex: "valid",
    sorter: true,
    render: (value: string) =>
      value === "YES" ? (
        <Tag color="green">YES</Tag>
      ) : (
        <Tag color="red">NO</Tag>
      ),
  },
];

const ValidateAll: React.FC = () => {
  return (
    <Table
      bordered
      pagination={false}
      columns={columns}
      dataSource={[]}
      rowKey="loginId"
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "No validation data" }}
    />
  );
};

export default ValidateAll;
