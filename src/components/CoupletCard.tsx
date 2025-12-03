import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { toast } from 'sonner';
import { sizeOptions, styleOptions as defaultStyleOptions } from '../lib/mockData';
import { addToCart } from '../lib/cartService';
import { useNavigate } from 'react-router-dom';
import { CoupletResult, ProductOptions, StyleOption } from '../lib/types';

interface CoupletCardProps {
  couplet: CoupletResult;
  onSaveImage: () => void;
  onShare: () => void;
  onRegenerate: () => void;
}

export const CoupletCard: React.FC<CoupletCardProps> = ({ 
  couplet, 
  onSaveImage, 
  onShare,
  onRegenerate
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showCustomization, setShowCustomization] = useState(false);
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>(defaultStyleOptions);
  const [selectedOptions, setSelectedOptions] = useState<ProductOptions>({
    size: sizeOptions[1], // 默认选中中号
    style: defaultStyleOptions[0], // 默认选中经典红底
    quantity: 1
  });

  // 从localStorage加载样式选项
  useEffect(() => {
    try {
      const storedStyles = localStorage.getItem('couplet_style_images');
      if (storedStyles) {
        const parsedStyles = JSON.parse(storedStyles);
        // 过滤出启用的样式
        const activeStyles = parsedStyles.filter((style: StyleOption) => style.isActive);
        if (activeStyles.length > 0) {
          setStyleOptions(activeStyles);
          // 如果当前选中的样式不在新列表中，则选择第一个
          if (!activeStyles.find(style => style.id === selectedOptions.style.id)) {
            setSelectedOptions(prev => ({
              ...prev,
              style: activeStyles[0]
            }));
          }
        }
      }
    } catch (error) {
      console.error('加载样式选项失败:', error);
      // 如果出错，使用默认样式
      setStyleOptions(defaultStyleOptions);
    }
  }, []);
  
  // 解析对联文字，每个字单独处理以便渲染
  const topChars = couplet.top.split('');
  const bottomChars = couplet.bottom.split('');
  const centerChars = couplet.center.split('');
  
  // 计算总价
  const calculateTotalPrice = () => {
    return (selectedOptions.size.price + selectedOptions.style.price) * selectedOptions.quantity;
  };
  
  // 处理添加到购物车
  const handleAddToCart = () => {
    try {
      addToCart({
        couplet,
        options: selectedOptions,
        totalPrice: calculateTotalPrice()
      });
      toast.success('已添加到购物车！');
      navigate('/cart');
    } catch (error) {
      toast.error('添加到购物车失败，请重试');
    }
  };
  
  // 处理立即购买
  const handleBuyNow = () => {
    try {
      addToCart({
        couplet,
        options: selectedOptions,
        totalPrice: calculateTotalPrice()
      });
      navigate('/checkout');
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };
  
  // 切换到定制选项
  const handleToggleCustomization = () => {
    setShowCustomization(!showCustomization);
  };
  
  return (
    <motion.div 
      className="h-full flex flex-col bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* 对联展示区域 - 优化移动端显示 */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
         {/* 横批 - 优化显示效果，使其更紧凑协调 */}
        <div className="mb-6 text-center">
          <motion.div 
            className={`inline-block px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'} border border-red-200 dark:border-red-800`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex justify-center space-x-1 sm:space-x-2">
              {centerChars.map((char, index) => (
                <motion.span
                  key={index}
                     className="text-2xl sm:text-3xl md:text-3xl font-bold font-serif text-black dark:text-gray-300"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                    >
                      {char}
                    </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* 上下联 - 优化布局为垂直堆叠 */}
        <div className="flex flex-col items-center w-full gap-4">
          {/* 对联容器 */}
          <div className="flex justify-between items-center w-full max-w-md">
             {/* 上联（右侧） */}
             <motion.div
               className={`flex flex-col items-center justify-center min-h-[150px] px-3 py-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} border border-red-200 dark:border-red-800`}
               initial={{ x: 50, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 0.3, duration: 0.6 }}
             >
               {topChars.map((char, index) => (
                 <motion.span
                   key={index}
                     className="text-xl font-bold font-serif text-black dark:text-gray-300 my-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                    >
                      {char}
                    </motion.span>
               ))}
            </motion.div>
            
             {/* 下联（左侧） */}
             <motion.div
               className={`flex flex-col items-center justify-center min-h-[150px] px-3 py-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} border border-red-200 dark:border-red-800`}
               initial={{ x: -50, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 0.3, duration: 0.6 }}
             >
               {bottomChars.map((char, index) => (
                 <motion.span
                   key={index}
                     className="text-xl font-bold font-serif text-black dark:text-gray-300 my-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                    >
                      {char}
                    </motion.span>
               ))}
            </motion.div>
          </div>
        </div>
        
        {/* 寓意解释 - 优化显示 */}
        <motion.div 
          className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
            <i className="fa-solid fa-circle-info text-blue-500 mr-2"></i>
            寓意解释
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{couplet.explanation}</p>
        </motion.div>
      </div>
      
      {/* 定制选项区域 */}
      <AnimatePresence>
        {showCustomization && (
          <motion.div 
            className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800/90' : 'border-gray-200 bg-white/90'}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <i className="fa-solid fa-sliders text-blue-500 mr-2"></i>
              定制选项
            </h3>
            
            {/* 尺寸选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">选择尺寸</label>
              <div className="grid grid-cols-2 gap-2">
                {sizeOptions.map(option => (
                  <motion.button
                    key={option.id}
                    onClick={() => setSelectedOptions(prev => ({ ...prev, size: option }))}
                    className={`p-3 rounded-lg text-left text-sm border ${
                      selectedOptions.size.id === option.id 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-500 dark:border-blue-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-transparent'
                    } transition-all`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="font-medium">{option.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{option.description}</div>
                    <div className="mt-1 text-red-600 dark:text-red-400 font-medium">¥{option.price.toFixed(2)}</div>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* 样式选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">选择样式</label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map(option => (
                  <motion.button
                    key={option.id}
                    onClick={() => setSelectedOptions(prev => ({ ...prev, style: option }))}
                    className={`flex flex-col items-center p-3 rounded-lg ${
                      selectedOptions.style.id === option.id 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-transparent'
                    } transition-all`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-full h-16 mb-2 bg-gray-200 dark:bg-gray-600 rounded-md overflow-hidden">
                      <img 
                        src={option.previewUrl} 
                        alt={option.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-medium">{option.name}</div>
                    {option.price > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400">+¥{option.price.toFixed(2)}</div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* 数量选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">数量</label>
              <div className="flex items-center">
                <motion.button
                  onClick={() => setSelectedOptions(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                  className={`p-2 rounded-l-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fa-solid fa-minus"></i>
                </motion.button>
                <div className={`px-4 py-2 border-t border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} min-w-[60px] text-center`}>
                  {selectedOptions.quantity}
                </div>
                <motion.button
                  onClick={() => setSelectedOptions(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                  className={`p-2 rounded-r-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fa-solid fa-plus"></i>
                </motion.button>
              </div>
            </div>
            
            {/* 价格汇总 */}
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">基础价格</span>
                <span>¥{selectedOptions.size.price.toFixed(2)}</span>
              </div>
              {selectedOptions.style.price > 0 && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">{selectedOptions.style.name}</span>
                  <span>+¥{selectedOptions.style.price.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">数量 ×{selectedOptions.quantity}</span>
                <span>×{selectedOptions.quantity}</span>
              </div>
              <div className="border-t border-dashed my-2 pt-2 flex justify-between items-center font-bold">
                <span>总计</span>
                <span className="text-lg text-red-600 dark:text-red-400">¥{calculateTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
               {/* 购买按钮 */}
               <div className="flex gap-3 flex-wrap">
                 <motion.button
                   onClick={handleAddToCart}
                   className={`flex-1 py-3 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} text-blue-800 dark:text-blue-200 transition-colors min-w-[120px]`}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                 >
                   <i className="fa-solid fa-cart-shopping mr-2"></i>
                   添加到购物车
                 </motion.button>
                 
                 <motion.button
                   onClick={handleBuyNow}
                   className="flex-1 py-3 rounded-lg flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-colors min-w-[120px]"
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                 >
                   <i className="fa-solid fa-credit-card mr-2"></i>
                   立即购买
                 </motion.button>
                 
                 {/* 淘宝购买按钮 */}
                 <motion.button
                   onClick={() => {
                     const taobaoUrl = `https://s.taobao.com/search?q=${encodeURIComponent(`定制对联 ${couplet.center}`)}`;
                     window.open(taobaoUrl, '_blank');
                     toast.success('正在跳转到淘宝...');
                   }}
                   className={`flex-1 py-3 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-orange-700/80 hover:bg-orange-600' : 'bg-orange-100 hover:bg-orange-200'} text-orange-800 dark:text-orange-200 transition-colors min-w-[120px]`}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                 >
                   <i className="fa-brands fa-alipay mr-2"></i>
                   淘宝购买
                 </motion.button>
               </div>
          </motion.div>
        )}
      </AnimatePresence>
      
       {/* 操作按钮 - 增大尺寸，放在底部方便单手操作 */}
      <motion.div 
        className={`px-4 py-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-wrap gap-3`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <motion.button
          onClick={onRegenerate}
          className={`flex-1 min-w-[120px] py-3 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-blue-700/80 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} text-blue-800 dark:text-blue-200 transition-colors`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          aria-label="重新生成对联"
        >
          <i className="fa-solid fa-rotate-right mr-2"></i>
          重新生成
        </motion.button>
        
        <motion.button
          onClick={onSaveImage}
          className={`flex-1 min-w-[120px] py-3 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-gray-800 dark:text-gray-200 transition-colors`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <i className="fa-solid fa-download mr-2"></i>
          保存图片
        </motion.button>
        
        <motion.button
          onClick={handleToggleCustomization}
          className="flex-1 min-w-[120px] py-3 rounded-lg flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {showCustomization ? (
            <>
              <i className="fa-solid fa-chevron-up mr-2"></i>
              收起选项
            </>
          ) : (
            <>
              <i className="fa-solid fa-shopping-bag mr-2"></i>
              定制购买
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};