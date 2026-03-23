import React, { useEffect, useState } from 'react';
import {
  Form,
  Radio,
  Select,
  Input,
  InputNumber,
  Tooltip,
  Checkbox,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Divider,
  Modal,
  Table,
} from 'antd';
import { useWatch } from 'antd/es/form/Form';
import { InfoCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import tradeService from '../../../Services/tradeService';
import { accountService, Account } from '../../../Services/accountService';
import { notification } from 'antd';

const { Option } = Select;

const Trade: React.FC = () => {
  const [form] = Form.useForm();
  const side = useWatch('side', form);
  const orderType = useWatch('orderType', form);
  const product = useWatch('product', form);
  const priceType = useWatch('priceType', form);
  const splitType = useWatch('split', form);

  const [disablePrice, setDisablePrice] = useState(false);
  const [disableTrigPrice, setDisableTrigPrice] = useState(false);
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const [recentSymbols] = useState<
    { key: string; symbol: string; exch: string }[]
  >([]); 

  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const response = await accountService.getAll(true);
        if (response && response.accounts) {
          setAccounts(response.accounts);
        } else if (Array.isArray(response)) {
          setAccounts(response);
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const cleanNumber = (val: any) => {
        const num = Number(val);
        return (isNaN(num) || num === 0) ? undefined : num;
      };

      const requestData = {
        symbol: values.symbol,
        exchange: values.exchange,
        side: values.side,
        quantity: Number(values.quantity),
        order_type: values.priceType === 'MARKET' ? 'MARKET' : (values.priceType === 'LIMIT' ? 'LIMIT' : (values.priceType === 'STOP_LOSS' ? 'SL' : 'SL_M')),
        price: values.priceType !== 'MARKET' && values.priceType !== 'SL_MARKET' ? cleanNumber(values.price) : undefined,
        trigger_price: values.priceType === 'STOP_LOSS' || values.priceType === 'SL_MARKET' ? cleanNumber(values.triggerPrice) : undefined,
        product: values.product,
        disclosed_quantity: cleanNumber(values.disclosedQty),
        account_ids: values.account_ids,
        variety: (values.orderType || 'REGULAR').toLowerCase(),
        validity: values.timeInForce || 'DAY',
        amo: !!values.amo
      };

      await tradeService.placeTrade(requestData as any);
      
      notification.success({
        message: 'Trade Executed',
        description: `Successfully initiated trade for ${values.symbol}.`,
        placement: 'topRight'
      });
      
      form.resetFields(['symbol', 'quantity', 'price', 'triggerPrice']);
    } catch (error: any) {
      notification.error({
        message: 'Trade Failed',
        description: error.response?.data?.detail || error.message || 'An error occurred.',
        placement: 'topRight'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  useEffect(() => {
    let priceDisabled = false;
    let trigDisabled = false;

    if (priceType === 'MARKET') {
      priceDisabled = true;
      trigDisabled = true;
    } else if (priceType === 'LIMIT') {
      trigDisabled = true;
    }

    setDisablePrice(priceDisabled);
    setDisableTrigPrice(trigDisabled);
  }, [priceType]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Trade</h1>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          side: 'BUY',
          orderType: 'REGULAR',
          product: 'INTRADAY',
          priceType: 'LIMIT',
          exchange: 'NSE',
          quantity: 1,
        }}
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="side" label="Side">
              <Radio.Group>
                <Radio.Button value="BUY">BUY</Radio.Button>
                <Radio.Button value="SELL">SELL</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="exchange" label="Exchange">
              <Select>
                <Option value="NSE">NSE</Option>
                <Option value="BSE">BSE</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
              <Input placeholder="Enter Symbol" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="quantity" label="Quantity">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="priceType" label="Price Type">
              <Select>
                <Option value="LIMIT">LIMIT</Option>
                <Option value="MARKET">MARKET</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="price" label="Price">
              <InputNumber disabled={disablePrice} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
           <Col span={12}>
            <Form.Item name="account_ids" label="Select Accounts" rules={[{ required: true }]}>
              <Select mode="multiple" placeholder="Select Accounts">
                {accounts.map(acc => (
                  <Option key={acc.account_id} value={acc.account_id}>{acc.nickname || acc.trading_login_id}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit" loading={submitting}>Place Order</Button>
      </Form>
    </div>
  );
};

export default Trade;
