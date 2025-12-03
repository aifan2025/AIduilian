import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { getCart, createOrder, clearCart, simulatePayment } from '../lib/cartService';
import { CartItem, ShippingInfo, Order } from '../lib/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { provinces } from '../lib/mockData';

export default function Checkout() {
  const { theme } = useTheme();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zipCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [order, setOrder] = useState<Order | null>(null);
  const navigate = useNavigate();
  
  // 加载购物车数据
  useEffect(() => {
    const items = getCart();
    if (items.length === 0) {
      toast.warning('购物车为空，请先添加商品');
      navigate('/cart');
    } else {
      setCartItems(items);
    }
  }, []);
  
  // 计算总价
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 验证表单
  const validateForm = (): boolean => {
    const { name, phone, address, city, province, zipCode } = shippingInfo;
    
    if (!name.trim()) {
      toast.error('请输入收货人姓名');
      return false;
    }
    
    if (!phone.trim() || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号码');
      return false;
    }
    
    if (!province) {
      toast.error('请选择省份');
      return false;
    }
    
    if (!city.trim()) {
      toast.error('请输入城市');
      return false;
    }
    
    if (!address.trim()) {
      toast.error('请输入详细地址');
      return false;
    }
    
    if (!zipCode.trim() || !/^\d{6}$/.test(zipCode)) {
      toast.error('请输入正确的邮政编码');
      return false;
    }
    
    return true;
  };
  
  // 处理提交订单
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newOrder = createOrder(cartItems, shippingInfo, calculateTotal());
      setOrder(newOrder);
      setCurrentStep(2);
      toast.success('订单提交成功，请完成支付');
    } catch (error) {
      toast.error('订单提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
   // 处理支付
  const handlePayment = async () => {
    if (!order) return;
    
    setIsPaying(true);
    
    try {
      // 模拟支付过程
      const paymentSuccess = await simulatePayment(order.id);
      
      if (paymentSuccess) {
        // 支付成功，清空购物车
        clearCart();
        toast.success('支付成功！我们将尽快为您发货');
        
        // 延迟跳转到订单成功页面
        setTimeout(() => {
          navigate('/order-success', { state: { orderId: order.id } });
        }, 1500);
      } else {
        toast.error('支付失败，请重试');
      }
    } catch (error) {
      toast.error('支付过程中发生错误，请重试');
    } finally {
      setIsPaying(false);
    }
  };
  
  // 处理第三方支付
  const handleThirdPartyPayment = (paymentMethod: 'alipay' | 'wechat') => {
    if (!order) return;
    
    // 模拟跳转到第三方支付
    toast.info(`正在跳转到${paymentMethod === 'alipay' ? '支付宝' : '微信'}支付...`);
    
    // 延迟模拟支付成功
    setTimeout(() => {
      try {
        // 模拟支付成功
        simulatePayment(order.id);
        clearCart();
        toast.success('支付成功！我们将尽快为您发货');
        
        // 跳转到订单成功页面
        setTimeout(() => {
          navigate('/order-success', { state: { orderId: order.id } });
        }, 1000);
      } catch (error) {
        toast.error('支付失败，请重试');
      }
    }, 2000);
  };
  
  // 返回购物车
  const handleBackToCart = () => {
    navigate('/cart');
  };
  
  // 返回上一步
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/cart');
    }
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
            {currentStep === 1 ? '填写订单信息' : '订单支付'}
          </motion.h1>
          
          <div className="flex gap-3">
            {/* 返回首页按钮 */}
            <motion.button
              onClick={handleGoHome}
              className="text-sm px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fa-solid fa-home mr-1"></i>首页
            </motion.button>
            
            <motion.button
              onClick={handleBack}
              className="text-sm px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fa-solid fa-arrow-left mr-1"></i>返回
            </motion.button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-6 px-4">
        <div className="max-w-lg mx-auto">
          {/* 步骤指示器 */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                1
              </div>
              <div className={`w-20 h-1 ${currentStep >= 2 ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                2
              </div>
              <div className={`w-20 h-1 ${currentStep >= 3 ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                3
              </div>
            </div>
          </motion.div>
          
          {/* 步骤内容 */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 收货信息表单 */}
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} shadow-md mb-6`}>
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <i className="fa-solid fa-truck-fast text-blue-500 mr-2"></i>
                  收货信息
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">收货人姓名 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={shippingInfo.name}
                      onChange={handleInputChange}
                      placeholder="请输入收货人姓名"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">手机号码 <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      placeholder="请输入11位手机号码"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                      maxLength={11}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">所在省份 <span className="text-red-500">*</span></label>
                      <select
                        name="province"
                        value={shippingInfo.province}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none`}
                      >
                        <option value="">请选择省份</option>
                        {provinces.map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">城市 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        placeholder="请输入城市"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">详细地址 <span className="text-red-500">*</span></label>
                    <textarea
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      placeholder="请输入详细地址信息，如街道、门牌号等"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none min-h-[100px]`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">邮政编码 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={handleInputChange}
                      placeholder="请输入6位邮政编码"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
              
              {/* 订单摘要 */}
              <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} shadow-md mb-6`}>
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <i className="fa-solid fa-list-check text-blue-500 mr-2"></i>
                  订单摘要
                </h2>
                
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={item.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.couplet.center}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {item.options.size.name} · {item.options.style.name} · 数量：{item.options.quantity}
                          </div>
                        </div>
                        <div className="text-sm font-medium ml-4">
                          ¥{item.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t mt-4 pt-4 flex justify-between items-center font-bold">
                  <span>总计</span>
                  <span className="text-xl text-red-600 dark:text-red-400">
                    ¥{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* 操作按钮区域 */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={handleGoHome}
                  className={`py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-white dark:text-gray-200 transition-colors flex items-center justify-center`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i className="fa-solid fa-home mr-2"></i>
                  返回首页
                </motion.button>
                
                <motion.button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center"
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      提交订单中...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check mr-2"></i>
                      提交订单
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
          
           {/* 支付步骤 */}
           {currentStep === 2 && order && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
             >
               <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'} shadow-md mb-6`}>
                 <h2 className="text-lg font-bold mb-4 flex items-center">
                   <i className="fa-solid fa-credit-card text-blue-500 mr-2"></i>
                   选择支付方式
                 </h2>
                 
                 {/* 支付选项切换 */}
                   <div className="flex border rounded-lg overflow-hidden mb-6">
                    <button 
                      className={`flex-1 py-2 text-center ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-r border-gray-300 dark:border-gray-600`}
                    >
                      在线支付
                    </button>
                    <button 
                      className={`flex-1 py-2 text-center ${theme === 'dark' ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-800'} font-medium`}
                    >
                      第三方平台
                    </button>
                  </div>
                  
               {/* 支付方式选项 */}
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col space-y-3">
                      {/* 支付宝支付 */}
                      <motion.div
                        className={`p-4 rounded-xl border-2 border-blue-500 ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'} transition-all hover:shadow-lg cursor-pointer`}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleThirdPartyPayment('alipay')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full border border-blue-500 flex items-center justify-center bg-white dark:bg-gray-700">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">支付宝支付</div>
                              <div className="text-xs opacity-70 mt-1">使用支付宝扫码或跳转支付</div>
                            </div>
                          </div>
                          <div className="text-2xl text-blue-600">
                            <i className="fa-brands fa-alipay"></i>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* 微信支付 */}
                      <motion.div
                        className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} transition-all hover:shadow-lg cursor-pointer`}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleThirdPartyPayment('wechat')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-700">
                              {/* 未选中状态 */}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">微信支付</div>
                              <div className="text-xs opacity-70 mt-1">使用微信扫码支付</div>
                            </div>
                          </div>
                          <div className="text-2xl text-green-600">
                            <i className="fa-brands fa-weixin"></i>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* 淘宝购买选项 */}
                      <motion.div
                        className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} transition-all hover:shadow-lg cursor-pointer`}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => {
                          const taobaoUrl = `https://s.taobao.com/search?q=${encodeURIComponent(`定制对联 ${order.items[0].couplet.center}`)}&shop_id=shop12345678`;
                          window.open(taobaoUrl, '_blank');
                          toast.success('正在跳转到淘宝...');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-700">
                              {/* 未选中状态 */}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">淘宝小店</div>
                              <div className="text-xs opacity-70 mt-1">前往淘宝购买同款定制对联</div>
                            </div>
                          </div>
                          <div className="text-2xl text-orange-600">
                            <i className="fa-shopping-bag"></i>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* 订单信息卡片 */}
                  <motion.div 
                    className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} shadow-inner mb-6`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-base font-bold mb-3 flex items-center">
                      <i className="fa-solid fa-file-invoice text-blue-500 mr-2"></i>
                      订单详情
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-70">订单编号</span>
                        <span className="text-sm font-mono font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{order.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-70">下单时间</span>
                        <span className="text-sm">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-70">商品数量</span>
                        <span className="text-sm">{order.items.length} 件</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
                        <span className="font-medium">支付金额</span>
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                          ¥{order.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* 操作按钮区域 */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      onClick={handleGoHome}
                      className={`py-3 px-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-white dark:text-gray-200 transition-all flex items-center justify-center shadow-sm`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <i className="fa-solid fa-home mr-2"></i>
                      返回首页
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleThirdPartyPayment('alipay')}
                      className="py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all flex items-center justify-center shadow-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <i className="fa-brands fa-alipay mr-2"></i>
                      立即支付
                    </motion.button>
                  </div>
               </div></motion.div>
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