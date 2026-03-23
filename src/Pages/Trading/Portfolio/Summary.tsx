import React, { useEffect, useState } from 'react';
import { Row, Col, Badge, Typography } from 'antd';
import {
    DollarOutlined,
    FundOutlined,
    RiseOutlined,
    StockOutlined,
} from '@ant-design/icons';
import StatCard from '../../../Components/StatsCards';
import SmartTable from '../../../Components/Table';
import { positionService } from '../../../Services/positionService';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const accountColumns: ColumnsType<any> = [
    {
        title: 'Account',
        dataIndex: 'name',
        key: 'name',
        render: (val: string, record: any) => <strong>{val} ({record.client_code})</strong>,
    },
    {
        title: 'M2M',
        dataIndex: 'm2m',
        key: 'm2m',
        render: (val: number) => (
            <span style={{ color: val >= 0 ? '#52c41a' : '#f5222d', fontWeight: 600 }}>
                ₹{(val || 0).toFixed(2)}
            </span>
        ),
    },
    {
        title: 'Booked PnL',
        dataIndex: 'pnl',
        key: 'pnl',
        render: (val: number) => (
            <span style={{ color: val >= 0 ? '#52c41a' : '#f5222d', fontWeight: 600 }}>
                ₹{(val || 0).toFixed(2)}
            </span>
        ),
    },
    {
        title: 'Positions',
        dataIndex: 'totalPos',
        key: 'totalPos',
    },
    {
        title: 'Open',
        dataIndex: 'openPos',
        key: 'openPos',
    },
    {
        title: 'Long',
        dataIndex: 'longCount',
        key: 'longCount',
        render: (val: number) => <span style={{ color: '#52c41a' }}>{val}</span>,
    },
    {
        title: 'Short',
        dataIndex: 'shortCount',
        key: 'shortCount',
        render: (val: number) => <span style={{ color: '#f5222d' }}>{val}</span>,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (val: string) => (
            <Badge
                status={val === 'Live' ? 'processing' : 'warning'}
                text={val}
            />
        ),
    },
];

const Summary: React.FC = () => {
    const [totalM2M, setTotalM2M] = useState(0);
    const [totalPnL, setTotalPnL] = useState(0);
    const [positions, setPositions] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [status, setStatus] = useState('Connecting...');
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        const fetchLive = async () => {
            const data = await positionService.getRealtimePnL();
            setTotalM2M(data.total_m2m);
            setTotalPnL(data.total_pnl);
            setStatus(data.status);
            setLastUpdated(data.last_updated || '');
            if (data.positions) {
                setPositions(data.positions);
            }
            // Build per-account rows from the accounts array
            if (data.accounts && data.accounts.length > 0) {
                const rows = data.accounts.map((acc: any, i: number) => {
                    const accPositions = acc.positions || [];
                    return {
                        key: acc.client_code || i,
                        client_code: acc.client_code,
                        name: acc.name,
                        m2m: acc.m2m || 0,
                        pnl: acc.pnl || 0,
                        totalPos: accPositions.length,
                        openPos: accPositions.filter((p: any) => p.netqty !== 0).length,
                        longCount: accPositions.filter((p: any) => (p.netqty || 0) > 0).length,
                        shortCount: accPositions.filter((p: any) => (p.netqty || 0) < 0).length,
                        status: acc.status || 'Unknown',
                    };
                });
                setAccounts(rows);
            }
        };

        fetchLive();
        const interval = setInterval(fetchLive, 2000);
        return () => clearInterval(interval);
    }, []);

    const openCount = positions.filter((p: any) => p.netqty !== 0).length;

    return (
        <div>
            {/* Status bar */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Badge
                        status={status === 'Live' ? 'processing' : 'warning'}
                        text={
                            <Text strong style={{ fontSize: 14 }}>
                                5paisa: {status} ({accounts.length} accounts)
                            </Text>
                        }
                    />
                </Col>
                {lastUpdated && (
                    <Col>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Last updated: {lastUpdated}
                        </Text>
                    </Col>
                )}
            </Row>

            {/* Stat Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <StatCard
                        label="Total M2M"
                        value={(totalM2M || 0).toFixed(2)}
                        icon={<FundOutlined style={{ fontSize: 28, opacity: 0.8 }} />}
                        color={
                            totalM2M >= 0
                                ? 'linear-gradient(135deg, #11998e, #38ef7d)'
                                : 'linear-gradient(135deg, #eb3349, #f45c43)'
                        }
                    />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard
                        label="Booked PnL"
                        value={(totalPnL || 0).toFixed(2)}
                        icon={<DollarOutlined style={{ fontSize: 28, opacity: 0.8 }} />}
                        color={
                            totalPnL >= 0
                                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                : 'linear-gradient(135deg, #cb2d3e, #ef473a)'
                        }
                    />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard
                        label="Open Positions"
                        value={openCount}
                        icon={<StockOutlined style={{ fontSize: 28, opacity: 0.8 }} />}
                        color="linear-gradient(135deg, #f093fb, #f5576c)"
                    />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard
                        label="Total Accounts"
                        value={accounts.length}
                        icon={<RiseOutlined style={{ fontSize: 28, opacity: 0.8 }} />}
                        color="linear-gradient(135deg, #4facfe, #00f2fe)"
                    />
                </Col>
            </Row>

            {/* Account-level Summary Table */}
            <SmartTable
                exportButtons
                title="Account Level Summary"
                columns={accountColumns}
                dataSource={accounts}
                searchable={false}
            />
        </div>
    );
};

export default Summary;
