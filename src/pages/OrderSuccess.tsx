import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOrders } from '../lib/cartService';

export default function OrderSuccess() {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string>('');
  
  // 从路由状态中获取订单ID
  useEffect(() => {
    if (location.state && location.state.orderId) {
      setOrderId(location.state.orderId);
    } else {
      // 如果没有订单ID，尝试获取最新的订单ID
      const orders = getOrders();
      if (orders.length > 0) {
        setOrderId(orders[0].id);
      }
    }
  }, [location.state]);
  
  // 查看订单详情
  const handleViewOrder = () => {
    navigate('/orders');
  };
  
  // 返回首页
  const handleGoHome = () => {
    navigate('/');
  };
  
  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-b from-amber-50 to-red-50 text-gray-900'}`}>
      <header className="w-full py-4 px-5 shadow-md backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <motion.h1 
            className="text-xl font-bold font-serif text-red-800 dark:text-red-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <i className="fa-solid fa-check-circle mr-2"></i>支付成功
          </motion.h1>
        </div>
      </header>
      
      <main className="flex-1 py-6 px-4 flex flex-col items-center justify-center">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="text-8xl text-green-500 mb-6">
              <i className="fa-solid fa-check-circle"></i>
            </div>
            <h2 className="text-2xl font-bold mb-2">订单支付成功！</h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              感谢您的购买，我们将尽快为您制作并发货
            </p>
            
            {/* 订单信息卡片 */}
            <motion.div 
              className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} shadow-md mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">订单编号</span>
                  <span className="text-sm font-mono font-medium">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">订单状态</span>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">已支付，处理中</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">预计发货时间</span>
                  <span className="text-sm">1-3个工作日</span>
                </div>
              </div>
            </motion.div>
            
            {/* 温馨提示 */}
            <motion.div 
              className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'} border mb-8`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h3 className="text-lg font-medium mb-2 flex items-center text-blue-700 dark:text-blue-400">
                <i className="fa-solid fa-circle-info mr-2"></i>
                温馨提示
              </h3>
              <ul className={`text-sm space-y-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-green-500 mr-2 mt-1"></i>
                  <span>您可以在"我的订单"中查看订单状态</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-green-500 mr-2 mt-1"></i>
                  <span>对联制作完成后，我们会通过短信通知您</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-check text-green-500 mr-2 mt-1"></i>
                  <span>如有问题，请联系客服：400-123-4567</span>
                </li>
              </ul>
            </motion.div>
            
            {/* 操作按钮 */}
            <div className="space-y-3">
              <motion.button
                onClick={handleViewOrder}
                className={`w-full py-3 rounded-lg ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} text-blue-800 dark:text-blue-200 font-medium transition-colors flex items-center justify-center`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <i className="fa-solid fa-file-lines mr-2"></i>
                查看订单
              </motion.button>
              
              <motion.button
                onClick={handleGoHome}
                className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <i className="fa-solid fa-home mr-2"></i>
                返回首页
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>
      
      <footer className={`w-full py-5 px-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} mt-8`}>
        <div className="text-center opacity-70">
          <p className="text-sm mb-1">个性对联定制商城 - 让传统文化焕发新生机</p>
          <p className="text-xs">&copy; {new Date().getFullYear()} 版权所有</p>
        </div>
      </footer>
    </div>
  );
}