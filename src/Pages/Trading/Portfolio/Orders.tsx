import React, { useEffect, useState } from "react";
import { Input, Select, Row, Col, Tooltip, Badge, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import OrdersTable from "./OrdersTable";
import OrdersSummaryCount from "./OrdersSummaryCount";
import OrdersSummaryQuantity from "./OrdersSummaryQuantity";
import { orderService, Order } from "../../../Services/orderService";

const { Option } = Select;
const { Text } = Typography;

const Orders: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState("Connecting...");

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await orderService.getRealtimeOrders();
      setOrders(data.orders || []);
      setRealtimeStatus(data.status);
      setIsLoading(false);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders based on status and search text
  const filteredOrders = orders.filter((o) => {
    const statusLower = o.status.toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OPEN" && statusLower.includes("pending")) ||
      (statusFilter === "COMPLETE" && (statusLower.includes("complete") || statusLower.includes("executed"))) ||
      (statusFilter === "REJECTED" && statusLower.includes("rejected"));

    const matchesSearch =
      o.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
      o.account.toLowerCase().includes(searchText.toLowerCase()) ||
      o.client_code.toLowerCase().includes(searchText.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalCount = orders.length;
  const openCount = orders.filter(o => o.status.toLowerCase().includes('pending')).length;
  const completedCount = orders.filter(o => o.status.toLowerCase().includes('complete') || o.status.toLowerCase().includes('executed')).length;
  const totalQty = orders.reduce((sum, o) => sum + (o.qty || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Badge
            status={realtimeStatus === "Live" ? "processing" : "warning"}
            text={
              <Text strong style={{ fontSize: 14 }}>
                5paisa Orders: {realtimeStatus}
              </Text>
            }
          />
        </Col>
      </Row>

      <Row gutter={[8, 8]} align="middle">
        <Col>
          <Tooltip title="Order Status">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
            >
              <Option value="ALL">ALL STATUS</Option>
              <Option value="OPEN">OPEN/PENDING</Option>
              <Option value="COMPLETE">COMPLETE</Option>
              <Option value="REJECTED">REJECTED</Option>
            </Select>
          </Tooltip>
        </Col>
        <Col flex="auto" />
        <Col>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search Symbol/Account"
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
      </Row>

      <OrdersTable orders={filteredOrders} loading={isLoading} />
      <OrdersSummaryCount total={totalCount} open={openCount} completed={completedCount} />
      <OrdersSummaryQuantity totalQty={totalQty} />
    </div>
  );
};

export default Orders;
