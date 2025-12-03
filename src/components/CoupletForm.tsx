import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface CoupletFormProps {
  onSubmit: (formData: {
    name1: string;
    name2: string;
    occasion: string;
    length: number;
    otherRequirements: string;
  }) => void;
  isGenerating: boolean;
}

export const CoupletForm: React.FC<CoupletFormProps> = ({ onSubmit, isGenerating }) => {
  const [formData, setFormData] = useState({
    name1: '',
    name2: '',
    occasion: '春节',
    length: 7, // 默认七言
    otherRequirements: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 简单的表单验证
    if (!formData.name1.trim()) {
      toast.error('请输入姓名');
      return;
    }
    
    // 调用父组件的提交函数，固定长度为7
    onSubmit({
      ...formData,
      length: 7
    });
  }

  // 预设场景选项
  const occasionOptions = [
    { value: '春节', label: '春节', icon: 'fa-house-chimney' },
    { value: '结婚', label: '结婚', icon: 'fa-heart' },
    { value: '祝寿', label: '祝寿', icon: 'fa-cake-candles' },
    { value: '乔迁', label: '乔迁', icon: 'fa-key' },
    { value: '开业', label: '开业', icon: 'fa-store' },
    { value: '搞笑', label: '搞笑', icon: 'fa-face-laugh-beam' }
  ];

  // 当切换到结婚场景时，清空第二个名字以提示用户输入
  useEffect(() => {
    if (formData.occasion === '结婚') {
      setFormData(prev => ({ ...prev, name2: '' }));
    }
  }, [formData.occasion]);

  return (
    <motion.div 
      className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-5 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 姓名输入 */}
        <div className="space-y-4">
          <div>
            <label 
              htmlFor="name1" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {formData.occasion === '结婚' ? '新郎姓名' : '姓名'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name1"
              name="name1"
              value={formData.name1}
              onChange={handleInputChange}
              placeholder={formData.occasion === '结婚' ? '例如：张伟、李明' : '例如：张伟、李娜'}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white transition-all text-base"
              required
            />
          </div>
          
          <div>
            <label 
              htmlFor="name2" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {formData.occasion === '结婚' ? '新娘姓名' : '第二个姓名（选填）'}
            </label>
            <input
              type="text"
              id="name2"
              name="name2"
              value={formData.name2}
              onChange={handleInputChange}
              placeholder={formData.occasion === '结婚' ? '例如：王丽、赵敏' : '例如：王芳、赵琳'}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white transition-all text-base"
            />
            {formData.occasion === '结婚' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <i className="fa-solid fa-info-circle"></i> 输入两人姓名，生成包含双方名字的结婚对联
              </p>
            )}
          </div>
        </div>
        
        {/* 场景选择 - 调整为更适合移动端的布局 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            选择场景 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {occasionOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, occasion: option.value }))}
                className={`flex flex-col items-center p-3 rounded-lg ${
                  formData.occasion === option.value 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-2 border-red-500 dark:border-red-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent'
                } transition-all`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className={`fa-solid ${option.icon} text-xl mb-1`}></i>
                <span className="text-sm">{option.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* 其它要求输入框 - 增大触摸区域 */}
        <div>
          <label 
            htmlFor="otherRequirements" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            其它要求（选填）
          </label>
          <textarea
            id="otherRequirements"
            name="otherRequirements"
            value={formData.otherRequirements}
            onChange={handleInputChange}
            placeholder="请输入您的特殊要求，例如：希望包含'福'字、风格喜庆、使用典故、需要繁体字等"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white transition-all min-h-[120px] text-base"
            maxLength={200}
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formData.otherRequirements.length}/200
            </span>
          </div>
        </div>
        
        {/* 生成按钮 - 增大尺寸，放在底部方便单手操作 */}
        <motion.button
          type="submit"
          disabled={isGenerating}
          className="w-full py-5 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center mt-8"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              生成中...
            </>
          ) : (
            <>
              <i className="fa-solid fa-magic mr-2"></i>
              生成对联
            </>
          )}
        </motion.button>
        
          {/* 小贴士 - 突出新增对联制定购买 */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="mb-1"><i className="fa-solid fa-lightbulb text-yellow-500 mr-1"></i> 小贴士：</p>
          <ul className="list-disc list-inside space-y-1">
            <li className="text-red-600 dark:text-red-400 font-medium">✨ <span className="text-black dark:text-white">新增功能：生成后可直接定制购买实物对联，支持多种尺寸和样式选择</span></li>
            <li>结婚场景下，输入两人姓名可生成包含双方名字的对联</li>
            <li>在"其它要求"中可以说明您的特殊需求，如需要繁体字等</li>
            <li>生成后可以保存图片分享到朋友圈</li>
          </ul>
        </div>
      </form>
    </motion.div>
  );
}