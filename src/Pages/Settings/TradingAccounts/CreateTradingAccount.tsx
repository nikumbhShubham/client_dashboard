import React, { useState } from "react";
import { Input, Button, Row, Col, Card, message } from "antd";
import { CheckOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { accountService } from "../../../Services/accountService";
import { useAccountStore } from "../../../store/accountStore";

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#555",
  marginBottom: 4,
};

const CreateTradingAccount: React.FC = () => {
  const navigate = useNavigate();
  const addAccount = useAccountStore((state) => state.addAccount);

  // Fields matching MongoDB schema exactly
  const [name, setName] = useState("");
  const [appName, setAppName] = useState("");
  const [appSource, setAppSource] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [userKey, setUserKey] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [mpin, setMpin] = useState("");
  const [clientCode, setClientCode] = useState("");

  const [validating, setValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [saving, setSaving] = useState(false);

  const buildPayload = () => ({
    NAME: name,
    APP_NAME: appName,
    APP_SOURCE: appSource,
    USER_ID: userId,
    PASSWORD: password,
    USER_KEY: userKey,
    ENCRYPTION_KEY: encryptionKey,
    totp_secret: totpSecret,
    mpin: mpin,
    client_code: clientCode,
  });

  const handleValidate = async () => {
    // Basic frontend validation
    const payload = buildPayload();
    const missing = Object.entries(payload)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      message.error(`Missing fields: ${missing.join(", ")}`);
      return;
    }

    setValidating(true);
    try {
      const result = await accountService.validate(payload as any);
      if (result.valid) {
        message.success("✅ Login validated successfully!");
        setIsValidated(true);
      } else {
        message.error(`❌ Validation failed: ${result.message}`);
      }
    } catch (e: any) {
      message.error(`Validation error: ${e.message || 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      const newAccount = await accountService.create(payload as any);
      addAccount(newAccount);
      message.success("✅ Account saved and logged in!");
      navigate("/settings/tradingaccounts");
    } catch (e: any) {
      message.error(`Failed to save: ${e.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Add 5paisa Trading Account</h1>
      <Card title="5paisa Credentials" style={{ maxWidth: 600 }}>
        <div style={labelStyle}>Account Name</div>
        <Input
          placeholder="e.g. Shubham Trading"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <div style={labelStyle}>Client Code</div>
        <Input
          placeholder="e.g. 54140910"
          value={clientCode}
          onChange={(e) => setClientCode(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16}>
          <Col span={12}>
            <div style={labelStyle}>App Name</div>
            <Input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col span={12}>
            <div style={labelStyle}>App Source</div>
            <Input
              placeholder="e.g. 33441"
              value={appSource}
              onChange={(e) => setAppSource(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div style={labelStyle}>User ID</div>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col span={12}>
            <div style={labelStyle}>Password</div>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div style={labelStyle}>User Key</div>
            <Input
              value={userKey}
              onChange={(e) => setUserKey(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col span={12}>
            <div style={labelStyle}>Encryption Key</div>
            <Input.Password
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div style={labelStyle}>TOTP Secret</div>
            <Input.Password
              value={totpSecret}
              onChange={(e) => setTotpSecret(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col span={12}>
            <div style={labelStyle}>MPIN</div>
            <Input.Password
              value={mpin}
              onChange={(e) => setMpin(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleValidate}
              loading={validating}
            >
              Validate Login
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!isValidated}
              style={{ background: isValidated ? '#52c41a' : undefined }}
            >
              Save Account
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CreateTradingAccount;
