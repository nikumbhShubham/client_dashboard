import React, { useEffect, useState } from "react";
import "./Nifty.css";
import { Modal, Select, Input } from "antd";
import Positions from "./Positions.tsx";
import OrderForm from "./Bs.tsx";

const { Option } = Select;

export default function NiftyB() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState("NIFTY");
  const [strike] = useState(26000);
  const [price, setPrice] = useState("₹0");

  return (
    <div>
      <div id="mainNB">
        <div id="tab_box">
          <div className="title">
            <h3>Nifty Breakout</h3>
          </div>

          <div className="col">
            <div style={{ width: 350 }}>
              <Select
                value={index}
                onChange={(v) => setIndex(v)}
                style={{ width: "100%", height: "3rem" }}
              >
                <Option value="NIFTY">Nifty</Option>
                <Option value="BANKNIFTY">Bank Nifty</Option>
              </Select>
            </div>

            <div style={{ width: 350 }}>
              <Select
                value="ce"
                style={{ width: "100%", height: "3rem" }}
                options={[
                  { label: `Nifty ${strike} CE`, value: "ce" },
                  { label: `Nifty ${strike} PE`, value: "pe" },
                ]}
              />
            </div>

            <div className="price" style={{ width: 350 }}>
              <Input
                value={price}
                readOnly
                style={{
                  width: "80%",
                  height: "3rem",
                  fontSize: "1.1rem",
                  border: "1px solid black",
                  textAlign: "center",
                }}
              />
            </div>

            <div className="btns">
              <div className="buy">
                <button onClick={() => setOpen(true)}>Buy</button>
              </div>
              <div className="sell">
                <button onClick={() => setOpen(true)}>Sell</button>
              </div>
            </div>
          </div>

          <div className="options">
            <Positions />
          </div>
        </div>
      </div>

      <Modal
        open={open}
        footer={null}
        width={1000}
        onCancel={() => setOpen(false)}
      >
        <OrderForm />
      </Modal>
    </div>
  );
}
