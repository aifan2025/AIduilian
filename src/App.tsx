import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderSuccess from './pages/OrderSuccess';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import { AuthContext } from './contexts/authContext';

const App: React.FC = () => {
  // 完整的认证上下文值
  const authContextValue = {
    isAuthenticated: localStorage.getItem('adminLoggedIn') === 'true',
    setIsAuthenticated: (value: boolean) => {
      if (value) {
        localStorage.setItem('adminLoggedIn', 'true');
      } else {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('currentAdminUser');
      }
    },
    logout: () => {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('currentAdminUser');
    },
    currentUser: JSON.parse(localStorage.getItem('currentAdminUser') || 'null'),
    setCurrentUser: (user: any) => {
      if (user) {
        localStorage.setItem('currentAdminUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentAdminUser');
      }
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </AuthContext.Provider>
  );
};

export default App;