import React from 'react'
import { Menu } from 'antd'
import { Link } from 'react-router-dom'
import {
    SettingOutlined,
    UserOutlined,
    StockOutlined
} from '@ant-design/icons'

const Navbar: React.FC = () => {
    const items = [
        {
            key: 'trading',
            icon: <StockOutlined />,
            label: 'Trading',
            children: [
                {
                    key: 'portfolio',
                    label: <Link to="/trading/positions">Portfolio</Link>,
                },
            ],
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
            children: [
                {
                    key: 'tradingaccounts',
                    label: <Link to="/settings/tradingaccounts">Trading Accounts</Link>,
                },
            ],
        },
        // Simple User menu for demo
        {
            key: 'user-menu',
            icon: <UserOutlined />,
            label: 'User',
            children: [
                {
                    key: 'logout',
                    label: <Link to="/">Logout</Link>,
                },
            ],
        },
    ];

    return (
        <Menu
            mode="horizontal"
            theme="dark"
            style={{ display: 'flex', justifyContent: 'flex-start' }}
            items={items}
        />
    );
}

export default Navbar
