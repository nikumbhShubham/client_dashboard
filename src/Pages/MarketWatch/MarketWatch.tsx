import React from 'react';
import SmartTable from '../../Components/Table.tsx';
import { Button } from 'antd';

const columns = [
    {
        title: 'Symbol',
        dataIndex: 'symbol',
        key: 'symbol',
        fixed: 'left' as const,
        width: 220,
    },
    {
        title: 'Ltp',
        dataIndex: 'ltp',
        key: 'ltp',
        width: 100,
        render: (value: string) => (
            <div style={{ background: '#fffbe6', textAlign: 'center' }}>{value}</div>
        ),
    },
    {
        title: 'Buy',
        key: 'buy',
        width: 80,
        render: () => (
            <Button type="primary" size="small" style={{ background: '#52c41a' }}>
                Buy
            </Button>
        ),
    },
    {
        title: 'Sell',
        key: 'sell',
        width: 80,
        render: () => (
            <Button type="primary" danger size="small">
                Sell
            </Button>
        ),
    },
    {
        title: '% Chg',
        dataIndex: 'percentChange',
        key: 'percentChange',
        width: 100,
        render: (value: number) => (
            <span style={{ color: value >= 0 ? 'green' : 'red' }}>{value}%</span>
        ),
    },
];

const data = [
    {
        key: '1',
        symbol: 'NIFTY_10-JUL-2025_CE_22300',
        ltp: '102.45',
        percentChange: 1.25,
    },
];

const MarketWatch: React.FC = () => {
    return (
        <SmartTable
            title="Market Watch"
            columns={columns}
            dataSource={data}
            rowKey="key"
            searchable
        />
    );
};

export default MarketWatch;
