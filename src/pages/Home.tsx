import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import { CoupletCard } from '../components/CoupletCard';
import { CoupletForm } from '../components/CoupletForm';
import { EmptyState } from '../components/Empty';
import { generateCouplet, saveToHistory } from '../lib/coupletGenerator';
import { useNavigate } from 'react-router-dom';

// 定义对联类型接口
interface CoupletResult {
  top: string;
  bottom: string;
  center: string;
  explanation: string;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [coupletResult, setCoupletResult] = useState<CoupletResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // 处理对联生成
  // 存储最后一次使用的表单数据，用于重新生成
  const [lastFormData, setLastFormData] = useState<{
    name1: string;
    name2: string;
    occasion: string;
    length: number;
    otherRequirements: string;
  } | null>(null);

  const handleGenerateCouplet = async (formData: {
    name1: string;
    name2: string;
    occasion: string;
    length: number;
    otherRequirements: string;
  }) => {
    // 保存表单数据，用于重新生成
    setLastFormData(formData);
    if (!formData.name1.trim()) {
      toast.error('请输入姓名');
      return;
    }

    setIsGenerating(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 调用生成对联的函数（使用默认模型，模型选择统一在后台管理）
      const result = await generateCouplet(
        formData.name1,
        formData.name2,
        formData.occasion,
        formData.length,
        formData.otherRequirements
      );
      
      // 直接使用AI生成的结果，如需繁体字可在"其它要求"中指定
      setCoupletResult(result);
      setHasHistory(true);
      toast.success('对联生成成功！');
      
      // 保存到历史记录
      saveToHistory(result);
      
      // 生成对联图片
      generateCoupletImage(result);
      
      // 自动滚动到结果区域
      setTimeout(() => {
        const resultElement = document.querySelector('.min-h-\\[400px\\]');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } catch (error) {
      toast.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成对联图片（使用提供的模板样式）
  const generateCoupletImage = (result: CoupletResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 调整画布尺寸，为解释部分留出空间
    canvas.width = 1000;
    canvas.height = 1400; // 增加高度，为寓意解释留出空间
    
    // 填充背景色（米色背景，与模板一致）
    ctx.fillStyle = '#f7f3e3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 定义高质量的红色背景（与模板一致的红色）
    const createRedBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, '#c41e3a'); // 鲜艳的红色
      gradient.addColorStop(1, '#9e1c2f'); // 稍暗的红色
      return gradient;
    };
    
    // 定义书法字体样式
    const setCalligraphyStyle = (size = 60) => {
      ctx.font = `bold ${size}px "ZCOOL XiaoWei", serif`;
      ctx.fillStyle = '#000000'; // 黑色文字，符合传统书法
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 添加轻微阴影增强立体感
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    };
     
    // 绘制横批 - 调整字体大小并统一颜色
  const drawHorizontalScroll = () => {
    // 增加字体大小使横批更大
    setCalligraphyStyle(90);
    
    // 测量文字宽度，添加适当的边距
    const textWidth = ctx.measureText(result.center).width;
    const padding = 80; // 增加左右边距
    const scrollWidth = Math.min(textWidth + padding, 700); // 增加最大宽度
    const scrollHeight = 120; // 增加高度使横批更协调
    const x = (canvas.width - scrollWidth) / 2;
    const y = 120;  // 调整位置
    
    // 绘制红色背景，不添加金色边框
    const gradient = createRedBackground();
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, scrollWidth, scrollHeight);
    
    // 绘制横批文字（使用书法字体，确保颜色统一为黑色）
    ctx.fillStyle = '#000000';
    ctx.fillText(result.center, canvas.width / 2, y + scrollHeight / 2);
  };
     
     // 绘制上联 - 右侧对联，简化版本，只保留红底
  const drawTopScroll = () => {
    const scrollWidth = 180;   // 根据模板调整宽度
    const scrollHeight = 800;  // 根据模板调整高度
    const x = canvas.width - scrollWidth - 100; // 根据模板调整位置
    const y = 280;  // 根据模板调整位置
    
    // 绘制红色背景，不添加金色边框
    const gradient = createRedBackground();
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, scrollWidth, scrollHeight);
    
     // 绘制上联文字（使用书法字体，确保颜色统一为黑色）
    setCalligraphyStyle(70); // 调整字体大小以匹配模板
    const bottomChars = result.bottom.split(''); // 修复上下联颠倒问题，使用下联文字
    const charSpacing = scrollHeight / (bottomChars.length + 1);
    
    // 按照模板样式排列文字
    ctx.fillStyle = '#000000';
    bottomChars.forEach((char, index) => {
      ctx.fillText(char, x + scrollWidth / 2, y + charSpacing * (index + 1));
    });
  };
     
     // 绘制下联 - 左侧对联，简化版本，只保留红底
  const drawBottomScroll = () => {
    const scrollWidth = 180;   // 根据模板调整宽度
    const scrollHeight = 800;  // 根据模板调整高度
    const x = 100;  // 根据模板调整位置
    const y = 280;  // 根据模板调整位置
    
    // 绘制红色背景，不添加金色边框
    const gradient = createRedBackground();
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, scrollWidth, scrollHeight);
    
     // 绘制下联文字（使用书法字体，确保颜色统一为黑色）
    setCalligraphyStyle(70); // 调整字体大小以匹配模板
    const topChars = result.top.split(''); // 修复上下联颠倒问题，使用上联文字
    const charSpacing = scrollHeight / (topChars.length + 1);
    
    // 按照模板样式排列文字
    ctx.fillStyle = '#000000';
    topChars.forEach((char, index) => {
      ctx.fillText(char, x + scrollWidth / 2, y + charSpacing * (index + 1));
    });
  };
  
  // 绘制寓意解释
  const drawExplanation = () => {
    // 设置文字样式
    ctx.font = 'bold 24px "ZCOOL XiaoWei", serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // 定义解释区域
    const explanationY = 1100; // 解释区域的起始Y坐标
    const explanationWidth = 900; // 解释区域宽度
    const explanationHeight = 250; // 解释区域高度
    const explanationX = (canvas.width - explanationWidth) / 2; // 居中显示
    
    // 绘制白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(explanationX, explanationY, explanationWidth, explanationHeight);
    
    // 添加边框
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(explanationX, explanationY, explanationWidth, explanationHeight);
    
    // 绘制标题
    ctx.fillStyle = '#c41e3a'; // 红色标题
    ctx.font = 'bold 28px "ZCOOL XiaoWei", serif';
    ctx.fillText('【寓意解释】', canvas.width / 2, explanationY + 20);
    
    // 绘制解释文字
    ctx.fillStyle = '#000000';
    ctx.font = '22px "ZCOOL XiaoWei", serif';
    ctx.textAlign = 'left';
    
    // 文字换行处理
    const lineHeight = 35; // 行高
    const maxWidth = explanationWidth - 40; // 最大宽度，留出边距
    const text = result.explanation;
    let currentY = explanationY + 60; // 起始Y坐标
    
    // 分割文本并绘制
    const words = text.split('');
    let line = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, explanationX + 20, currentY);
        line = words[i];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    // 绘制最后一行
    ctx.fillText(line, explanationX + 20, currentY);
  };
     
     // 按顺序绘制各个部分，严格按照模板布局
    drawHorizontalScroll(); // 横批
    drawBottomScroll();     // 下联（左侧）
    drawTopScroll();        // 上联（右侧）
    drawExplanation();      // 寓意解释
    
    // 重置阴影和其他样式
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  // 保存对联图片
  const saveCoupletImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !coupletResult) return;
    
    try {
      // 创建图片链接
      const imageLink = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `couplet_${coupletResult.center}.png`;
      link.href = imageLink;
      link.click();
      toast.success('对联图片已保存');
    } catch (error) {
      toast.error('保存图片失败，请重试');
    }
  };

  // 重新生成对联
  const handleRegenerateCouplet = async () => {
    if (!lastFormData) {
      toast.error('没有可用的历史数据，请重新填写表单');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 使用上次的表单数据重新生成对联
      const result = await generateCouplet(
        lastFormData.name1,
        lastFormData.name2,
        lastFormData.occasion,
        lastFormData.length,
        lastFormData.otherRequirements
      );
      
      setCoupletResult(result);
      toast.success('对联重新生成成功！');
      
      // 更新历史记录
      saveToHistory(result);
      
      // 重新生成图片
      generateCoupletImage(result);
    } catch (error) {
      toast.error('重新生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 分享功能
  const shareCouplet = async () => {
    if (!coupletResult) return;
    
    try {
      // 尝试复制对联文本到剪贴板
      await navigator.clipboard.writeText(
        `上联：${coupletResult.top}\n下联：${coupletResult.bottom}\n横批：${coupletResult.center}\n\n—— 由个性对联生成小程序创作`
      );
      
      // 如果有生成的图片，可以提供下载图片再分享的选项
      if (canvasRef.current) {
        toast.success('对联内容已复制到剪贴板！您可以先保存图片，然后一起分享~');
      } else {
        toast.success('对联内容已复制到剪贴板！');
      }
      
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      toast.error('复制失败，请手动复制对联内容');
      
      // 提供手动复制的提示
      const textToCopy = `上联：${coupletResult.top}\n下联：${coupletResult.bottom}\n横批：${coupletResult.center}`;
      if (window.prompt('请手动复制以下对联内容:', textToCopy)) {
        toast.success('复制成功！您可以先保存图片，然后一起分享~');
      }
    }
  };

  // 清除历史
  const clearHistory = () => {
    setCoupletResult(null);
    setHasHistory(false);
    toast.success('已清除历史记录');
  };

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-b from-amber-50 to-red-50 text-gray-900'}`}>
      {/* 隐藏的Canvas用于生成图片 */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <header className="w-full py-4 px-5 shadow-md backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <motion.h1 
            className="text-xl md:text-2xl font-bold font-serif text-red-800 dark:text-red-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <i className="fa-solid fa-brush mr-2"></i>个性对联生成
          </motion.h1>
          
              <div className="flex items-center gap-3">
                {hasHistory && (
                  <motion.button
                    onClick={clearHistory}
                    className="text-sm px-3 py-1.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className="fa-solid fa-trash-can mr-1"></i>清除历史
                  </motion.button>
                )}
                
                {/* 订单记录按钮 */}
                <motion.button
                  onClick={() => navigate('/orders')}
                  className="text-sm px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fa-solid fa-file-invoice mr-1"></i>我的订单
                </motion.button>
                
                <button
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'} shadow-md hover:shadow-lg transition-all`}
                  aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
                >
                  {theme === 'dark' ? (
                    <i className="fa-solid fa-sun"></i>
                  ) : (
                    <i className="fa-solid fa-moon"></i>
                  )}
                </button>
              </div>
        </div>
      </header>

       <main className="flex-1 py-6 px-4">
        <div className="max-w-lg mx-auto">
          {/* 欢迎区域 */}
          <motion.section 
            className="text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3 font-serif">传统文化与现代科技的完美结合</h2>
            <p className="text-base max-w-md mx-auto opacity-80 mb-4">
              输入关键词和场景，AI将为您生成对仗工整、意境优美的个性化对联，还能生成书法效果图片，方便分享到朋友圈！
            </p>
            
            {/* 统计数据 - 简化显示 */}
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">10000+</div>
                <div className="text-xs opacity-70">用户使用</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">50000+</div>
                <div className="text-xs opacity-70">对联生成</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">98%</div>
                <div className="text-xs opacity-70">用户满意度</div>
              </div>
            </div>
          </motion.section>

          {/* 主内容区 - 先显示表单区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-6"
          >
            <CoupletForm 
              onSubmit={handleGenerateCouplet}
              isGenerating={isGenerating}
            />
          </motion.div>

          {/* 结果展示区域 - 放在下方 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="h-full min-h-[400px]"
          >
            <AnimatePresence mode="wait">
              {coupletResult ? (
                 <CoupletCard 
                  couplet={coupletResult}
                  onSaveImage={saveCoupletImage}
                  onShare={shareCouplet}
                  onRegenerate={handleRegenerateCouplet}
                />
              ) : (
                <EmptyState />
              )}
            </AnimatePresence>
          </motion.div>

          {/* 使用场景 - 简化为更适合移动端的显示 */}
          <motion.section 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <h3 className="text-xl font-bold mb-4 text-center font-serif">适用场景</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: '春节', icon: 'fa-house-chimney' },
                { name: '结婚', icon: 'fa-heart' },
                { name: '祝寿', icon: 'fa-cake-candles' },
                { name: '乔迁', icon: 'fa-key' },
                { name: '开业', icon: 'fa-store' },
                { name: '搞笑', icon: 'fa-face-laugh-beam' }
              ].map((scene, index) => (
                <motion.div
                  key={scene.name}
                  className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md hover:shadow-lg transition-all cursor-pointer`}
                  whileHover={{ scale: 1.05, backgroundColor: theme === 'dark' ? '#4b5563' : '#f9fafb' }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="text-xl mb-1 text-red-600 dark:text-red-400">
                    <i className={`fa-solid ${scene.icon}`}></i>
                  </div>
                  <div className="text-sm font-medium">{scene.name}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>

      <footer className={`w-full py-5 px-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} mt-8`}>
        <div className="text-center opacity-70">
          <p className="text-sm mb-1">个性对联生成小程序 - 让传统文化焕发新生机</p>
          <p className="text-xs">&copy; {new Date().getFullYear()} 版权所有</p>
        </div>
      </footer>
    </div>
  );
}