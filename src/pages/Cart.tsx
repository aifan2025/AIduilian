import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { getCart, removeFromCart, clearCart } from '../lib/cartService';
import { CartItem } from '../lib/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Empty } from '../components/Empty';

export default function Cart() {
  const { theme } = useTheme();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const navigate = useNavigate();
  
  // 加载购物车数据
  useEffect(() => {
    const items = getCart();
    setCartItems(items);
  }, []);
  
  // 计算总价
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };
  
  // 处理删除商品
  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast.success('已从购物车移除');
  };
  
  // 处理清空购物车
  const handleClearCart = () => {
    if (window.confirm('确定要清空购物车吗？')) {
      clearCart();
      setCartItems([]);
      toast.success('购物车已清空');
    }
  };
  
  // 处理去结算
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning('购物车为空，请先添加商品');
      return;
    }
    navigate('/checkout');
  };
  
  // 返回首页
  const handleGoHome = () => {
    navigate('/');
  };

  // 查看订单记录
  const handleViewOrders = () => {
    navigate('/orders');
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
            <i className="fa-solid fa-cart-shopping mr-2"></i>我的购物车
          </motion.h1>
          
          <div className="flex gap-3">
            {/* 查看订单记录按钮 */}
            <motion.button
              onClick={handleViewOrders}
              className="text-sm px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fa-solid fa-file-invoice mr-1"></i>订单记录
            </motion.button>

            {cartItems.length > 0 && (
              <motion.button
                onClick={handleClearCart}
                className="text-sm px-3 py-1.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fa-solid fa-trash-can mr-1"></i>清空购物车
              </motion.button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-6 px-4">
        <div className="max-w-lg mx-auto">
          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-[60vh]"
            >
              <div className="text-6xl text-gray-400 mb-4">
                <i className="fa-solid fa-cart-arrow-down"></i>
              </div>
              <h2 className="text-xl font-bold mb-2">购物车还是空的</h2>
              <p className="text-center mb-6 max-w-md opacity-70">
                快去生成您喜欢的对联，并添加到购物车吧！
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <motion.button
                  onClick={handleGoHome}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <i className="fa-solid fa-home mr-2"></i>返回首页
                </motion.button>
                <motion.button
                  onClick={handleViewOrders}
                  className={`px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} text-blue-800 dark:text-blue-200 transition-colors flex items-center justify-center`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <i className="fa-solid fa-file-invoice mr-2"></i>我的订单
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* 购物车商品列表 */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} shadow-md border border-gray-200 dark:border-gray-700`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center mb-3">
                          <div className={`px-3 py-2 rounded-lg mr-3 mb-2 sm:mb-0 ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'}`}>
                            <div className="text-lg font-bold font-serif text-red-800 dark:text-red-400">{item.couplet.center}</div>
                          </div>
                          <div>
                            <div className="text-sm opacity-70">{item.options.size.name} · {item.options.style.name}</div>
                            <div className="text-sm opacity-70">数量：{item.options.quantity}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
                            <div className="text-xs opacity-70 mb-1">上联</div>
                            <div className="text-sm font-serif">{item.couplet.top}</div>
                          </div>
                          <div className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
                            <div className="text-xs opacity-70 mb-1">下联</div>
                            <div className="text-sm font-serif">{item.couplet.bottom}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          <i className="fa-solid fa-circle-info text-blue-500 mr-1"></i>
                          {item.couplet.explanation}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end ml-4">
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          ¥{item.totalPrice.toFixed(2)}
                        </div>
                        <motion.button
                          onClick={() => handleRemoveItem(item.id)}
                          className="mt-2 p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* 结算区域 */}
              <motion.div
                className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} shadow-md sticky bottom-4`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-sm opacity-70">共 {cartItems.length} 件商品</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-70">合计</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ¥{calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
                
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   <motion.button
                     onClick={handleGoHome}
                     className={`py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-white dark:text-gray-200 transition-colors flex items-center justify-center`}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                   >
                     <i className="fa-solid fa-arrow-left mr-2"></i>
                     返回首页
                   </motion.button>
                   
                   <motion.button
                     onClick={handleCheckout}
                     className="py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center"
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                   >
                     <i className="fa-solid fa-arrow-right-to-bracket mr-2"></i>
                     在线结算
                   </motion.button>
                   
                   <motion.button
                     onClick={() => {
                       // 生成淘宝跳转链接
                       const firstCouplet = cartItems[0];
                       const taobaoUrl = `https://s.taobao.com/search?q=${encodeURIComponent(`定制对联 ${firstCouplet.couplet.center}`)}`;
                       window.open(taobaoUrl, '_blank');
                       toast.success('正在跳转到淘宝...');
                     }}
                     className={`py-3 rounded-lg ${theme === 'dark' ? 'bg-orange-700/80 hover:bg-orange-600' : 'bg-orange-100 hover:bg-orange-200'} text-orange-800 dark:text-orange-200 transition-colors flex items-center justify-center`}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                   >
                     <i className="fa-brands fa-alipay mr-2"></i>
                     淘宝购买
                   </motion.button>
                 </div>
              </motion.div>
            </motion.div>
          )}
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