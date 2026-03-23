import React, { useState } from "react";
import {
  Form,
  Input,
  Radio,
  Button,
  Card,
  Select,
  Switch,
  Row,
  Col,
} from "antd";

export default function OrderForm() {
  const [qty, setQty] = useState(20);
  const [side, setSide] = useState("buy");
  const increment = () => setQty(qty + 20);
  const decrement = () => qty > 20 && setQty(qty - 20);
  
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "2rem", marginBottom: "2rem"}}>
      <Card title="Order Form" style={{ width: "90%", padding: 20, borderRadius: 12, border: `0.25rem solid ${side === "buy" ? "#4ec362ff" : "#f03e3e"}`, transition: "0.3s ease"}}>
        <Form layout="vertical">

          <Form.Item>
            <Radio.Group defaultValue="buy" onChange={(e) => setSide(e.target.value)} value={side}>
              <Radio value="buy">BUY</Radio>
              <Radio value="sell">SELL</Radio>
            </Radio.Group>
          </Form.Item>

          <Row gutter={20}>
            <Col span={12}>
              <Form.Item label="Qty">
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Button onClick={decrement}>−</Button>
                  <Input value={qty} readOnly style={{ width: 60, textAlign: "center" }} />
                  <Button onClick={increment}>+</Button>
                </div>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Price">
                <Input placeholder="₹0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Accounts">
            <Select mode="multiple" defaultValue={["All-accounts"]} style={{ width: "100%"}}>
              <Select.Option value="All-accounts">All-accounts</Select.Option>
            </Select>
          </Form.Item>

          <Row style={{ display: "flex", gap: 15 }}>
            <Button type="primary" style={{ width: 120 }}>ACTION</Button>
            <Button danger style={{ width: 120 }}>Reset</Button>
          </Row>

        </Form>
      </Card>
    </div>
  );
}
