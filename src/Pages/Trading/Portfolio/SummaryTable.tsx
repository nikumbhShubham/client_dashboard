import React, { useEffect, useState } from 'react';
import SmartTable from '../../../Components/Table.tsx';
import type { ColumnsType } from 'antd/es/table';

const columns: ColumnsType<any> = [
    {
        title: 'Account',
        dataIndex: 'tradingAcc',
        key: 'tradingAcc',
    },
    {
        title: 'M2M',
        dataIndex: 'm2m',
        key: 'm2m',
    },
    {
        title: 'PnL',
        dataIndex: 'pnl',
        key: 'pnl',
    },
    {
        title: 'Total Pos',
        dataIndex: 'totalPos',
        key: 'totalPos',
    },
    {
        title: 'Open Pos',
        dataIndex: 'openPos',
        key: 'openPos',
    }
];

const data = [
    {
        key: '1',
        tradingAcc: 'AB1234 (Zerodha)',
        m2m: '₹1500.50',
        pnl: '₹1200.00',
        totalPos: 1,
        openPos: 1
    },
];

const SummaryTable: React.FC = () => {
    return (
        <SmartTable
            exportButtons
            title="Account Level Summary"
            columns={columns}
            dataSource={data}
        />
    );
};

export default SummaryTable;
