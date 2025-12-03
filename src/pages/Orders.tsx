import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { getOrders } from '../lib/cartService';
import { Order, OrderStatus } from '../lib/types';
import { useNavigate } from 'react-router-dom';

// 获取订单状态中文名称
const getStatusText = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending: '待支付',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

// 获取订单状态对应的样式
const getStatusStyle = (status: OrderStatus, theme: 'light' | 'dark'): string => {
  const baseStyle = 'px-2 py-1 rounded-full text-xs font-medium';
  
  switch (status) {
    case 'pending':
      return `${baseStyle} ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'}`;
    case 'processing':
      return `${baseStyle} ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`;
    case 'shipped':
      return `${baseStyle} ${theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800'}`;
    case 'delivered':
      return `${baseStyle} ${theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`;
    case 'cancelled':
      return `${baseStyle} ${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'}`;
    default:
      return `${baseStyle} ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`;
  }
};

export default function Orders() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const navigate = useNavigate();
  
  // 加载订单数据
  useEffect(() => {
    const loadOrders = () => {
      const orderList = getOrders();
      // 如果没有订单，生成一些模拟订单数据
      if (orderList.length === 0) {
        const mockOrders = generateMockOrders();
        localStorage.setItem('couplet_orders', JSON.stringify(mockOrders));
        setOrders(mockOrders);
      } else {
        setOrders(orderList);
      }
    };
    
    loadOrders();
  }, []);
  
  // 根据选择的标签筛选订单
  useEffect(() => {
    if (selectedTab === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === selectedTab));
    }
  }, [selectedTab, orders]);
  
  // 生成模拟订单数据
  const generateMockOrders = (): Order[] => {
    const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const mockOrders: Order[] = [];
    
    for (let i = 0; i < 5; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const itemCount = Math.floor(Math.random() * 2) + 1; // 1-2个商品
      const items = [];
      let totalPrice = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const price = Math.floor(Math.random() * 80) + 29; // 29-109元
        totalPrice += price;
        
        items.push({
          id: `item_${Date.now()}_${i}_${j}`,
          couplet: {
            top: `${['张', '李', '王', '赵', '刘'][Math.floor(Math.random() * 5)]}${['灯结彩', '门焕彩', '家欢乐'][Math.floor(Math.random() * 3)]}${['迎新岁', '贺新春', '添祥瑞'][Math.floor(Math.random() * 3)]}`,
            bottom: `${['李', '张', '赵', '王', '陈'][Math.floor(Math.random() * 5)]}${['语欢歌', '宅生辉', '业兴隆'][Math.floor(Math.random() * 3)]}${['贺吉年', '庆团圆', '步步高'][Math.floor(Math.random() * 3)]}`,
            center: ['新春快乐', '吉祥如意', '恭喜发财', '富贵吉祥', '万事如意'][Math.floor(Math.random() * 5)],
            explanation: '这是一副寓意吉祥的对联，对仗工整，适合节日使用。'
          },
          options: {
            size: {
              id: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)],
              name: ['小号', '中号', '大号'][Math.floor(Math.random() * 3)],
              price: price,
              description: '对联标准尺寸'
            },
            style: {
              id: ['classic', 'golden', 'calligraphy', 'antique'][Math.floor(Math.random() * 4)],
              name: ['经典红底', '金边装饰', '名家书法', '古风卷轴'][Math.floor(Math.random() * 4)],
              price: 0,
              previewUrl: ''
            },
            quantity: 1
          },
          totalPrice: price,
          timestamp: new Date(Date.now() - i * 86400000).toISOString()
        });
      }
      
      mockOrders.push({
        id: `order_${Date.now()}_${i}`,
        items,
        shippingInfo: {
          name: `${['张', '李', '王', '赵', '刘', '陈'][Math.floor(Math.random() * 6)]}${['伟', '芳', '娜', '秀英', '敏'][Math.floor(Math.random() * 5)]}`,
          phone: `13${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
          address: `测试地址${i}号`,
          city: `${['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)]}市`,
          province: `${['北京市', '上海市', '广东省', '江苏省', '浙江省'][Math.floor(Math.random() * 5)]}`,
          zipCode: `${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
        },
        totalPrice,
        status,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
        paymentStatus: status === 'pending' ? 'pending' : 'paid'
      });
    }
    
    // 按时间排序，最新的在前
    mockOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return mockOrders;
  };
  
  // 查看订单详情
  const handleViewOrder = (orderId: string) => {
    // 这里简化处理，实际应用中可以跳转到订单详情页面
    alert(`查看订单 ${orderId} 的详情`);
  };
  
  // 返回首页
  const handleGoHome = () => {
    navigate('/');
  };
  
  // 重新生成对联
  const handleRegenerate = () => {
    navigate('/');
  };
  
  // 继续购物
  const handleContinueShopping = () => {
    navigate('/cart');
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
            <i className="fa-solid fa-file-invoice mr-2"></i>我的订单
          </motion.h1>
          
          <motion.button
            onClick={handleGoHome}
            className="text-sm px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="fa-solid fa-home mr-1"></i>返回首页
          </motion.button>
        </div>
      </header>
      
      <main className="flex-1 py-6 px-4">
        <div className="max-w-lg mx-auto">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-[60vh]"
            >
              <div className="text-6xl text-gray-400 mb-4">
                <i className="fa-solid fa-file-circle-exclamation"></i>
              </div>
              <h2 className="text-xl font-bold mb-2">暂无订单记录</h2>
              <p className="text-center mb-6 max-w-md opacity-70">
                快去生成并购买您喜欢的对联吧！
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <motion.button
                  onClick={handleRegenerate}
                  className="py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <i className="fa-solid fa-magic mr-2"></i>
                  生成对联
                </motion.button>
                <motion.button
                  onClick={handleContinueShopping}
                  className={`py-3 rounded-lg ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} text-blue-800 dark:text-blue-200 font-medium transition-colors flex items-center justify-center`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <i className="fa-solid fa-cart-shopping mr-2"></i>
                  购物车
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* 订单状态标签 */}
              <motion.div 
                className="flex overflow-x-auto py-2 mb-6 gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {[
                  { id: 'all', label: '全部订单', icon: 'fa-list' },
                  { id: 'pending', label: '待支付', icon: 'fa-clock' },
                  { id: 'processing', label: '处理中', icon: 'fa-spinner' },
                  { id: 'shipped', label: '已发货', icon: 'fa-truck' },
                  { id: 'delivered', label: '已完成', icon: 'fa-check-circle' },
                  { id: 'cancelled', label: '已取消', icon: 'fa-x-circle' }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex-none px-4 py-2 rounded-full whitespace-nowrap flex items-center ${
                      selectedTab === tab.id
                        ? `${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'} font-medium`
                        : `${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-700'} hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`
                    } transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className={`fa-solid ${tab.icon} mr-1 text-sm`}></i>
                    {tab.label}
                    {tab.id !== 'all' && (
                      <span className="ml-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        {orders.filter(order => order.status === tab.id).length}
                      </span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
              
              {/* 订单列表 */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} shadow-md border border-gray-200 dark:border-gray-700`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    {/* 订单头部信息 */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-sm opacity-70">订单编号</div>
                        <div className="text-sm font-mono">{order.id}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={getStatusStyle(order.status, theme)}>
                          {getStatusText(order.status)}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                     {/* 订单商品列表 */}
                     <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                       {order.items.map((item) => (
                         <div key={item.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                           <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className={`inline-block px-2 py-1 rounded mb-1 ${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-800'} font-bold`}>
                                  {item.couplet.center}
                                </div>
                                <div className="text-xs opacity-70 mt-1">
                                  {item.options.size.name} · {item.options.style.name} · 数量：{item.options.quantity}
                                </div>
                                <div className="text-xs opacity-70 mt-1 font-serif line-clamp-1">
                                  上联：{item.couplet.top}
                                </div>
                                <div className="text-xs opacity-70 font-serif line-clamp-1">
                                  下联：{item.couplet.bottom}
                                </div>
                              </div>
                             <div className="text-sm font-medium ml-4">
                               ¥{item.totalPrice.toFixed(2)}
                             </div>
                           </div>
                         </div>
                       ))}
                    </div>
                    
                    {/* 订单底部 */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="text-sm opacity-70">共 {order.items.length} 件商品</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-4">
                          <div className="text-sm opacity-70">合计</div>
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            ¥{order.totalPrice.toFixed(2)}
                          </div>
                        </div>
                        <motion.button
                          onClick={() => handleViewOrder(order.id)}
                          className={`px-4 py-2 rounded-lg text-sm ${
                            theme === 'dark' 
                              ? 'bg-blue-700/80 hover:bg-blue-600 text-blue-200' 
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                          } transition-colors`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          查看详情
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* 空状态 */}
              {filteredOrders.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center h-[30vh]"
                >
                  <div className="text-4xl text-gray-400 mb-2">
                    <i className="fa-solid fa-box-open"></i>
                  </div>
                  <p className="opacity-70">
                    暂无{getStatusText(selectedTab as OrderStatus)}的订单
                  </p>
                  <motion.button
                    onClick={() => setSelectedTab('all')}
                    className={`mt-4 px-4 py-2 rounded-lg text-sm ${
                      theme === 'dark' 
                        ? 'bg-blue-700/80 hover:bg-blue-600 text-blue-200' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                    } transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    查看全部订单
                  </motion.button>
                </motion.div>
              )}
              
              {/* 底部操作按钮 */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <motion.button
                  onClick={handleRegenerate}
                  className="py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i className="fa-solid fa-magic mr-2"></i>
                  生成新对联
                </motion.button>
                <motion.button
                  onClick={handleContinueShopping}
                  className={`py-3 rounded-lg ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} text-blue-800 dark:text-blue-200 font-medium transition-colors flex items-center justify-center`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i className="fa-solid fa-cart-shopping mr-2"></i>
                  继续购物
                </motion.button>
              </div>
            </>
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