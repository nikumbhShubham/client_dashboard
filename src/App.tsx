import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './Components/Navbar.tsx'
import ProtectedRoute from './Components/ProtectedRoute.tsx'
import Positions from "./Pages/Trading/Portfolio/Positions.tsx";
import Orders from "./Pages/Trading/Portfolio/Orders.tsx";
import Margins from "./Pages/Trading/Portfolio/Margins.tsx";
import Holdings from "./Pages/Trading/Portfolio/Holdings.tsx";
import Notifications from "./Pages/Trading/Portfolio/Notifications.tsx";
import TradingAccounts from "./Pages/Settings/TradingAccounts/TradingAccounts.tsx";
import CreateTradingAccount from "./Pages/Settings/TradingAccounts/CreateTradingAccount.tsx";
import ValidateAll from './Pages/Settings/TradingAccounts/ValidateAll.tsx';
import MainTabs from "./Pages/Trading/Tabs/Tabs.tsx";

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/trading" replace />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div style={{ padding: 24 }}>
                <Routes>
                  <Route path="/trading/*" element={<MainTabs />} />
                  <Route path="/settings/tradingaccounts" element={<TradingAccounts />} />
                  <Route path="/settings/tradingaccounts/createtradingaccount" element={<CreateTradingAccount />} />
                  <Route path="/settings/tradingaccounts/validateall" element={<ValidateAll />} />
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/trading/positions" replace />} />
                </Routes>
              </div>
            </>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}
export default App
