import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { AuthContext } from '../contexts/authContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AdminUser } from '../lib/types';

export default function Login() {
  const { theme } = useTheme();
  const { setIsAuthenticated, setCurrentUser } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 检查是否已登录，如果已登录则直接跳转到管理页面
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentAdminUser');
    
    if (adminLoggedIn && currentUser) {
      try {
        setCurrentUser(JSON.parse(currentUser));
        setIsAuthenticated(true);
        navigate('/admin');
      } catch (error) {
        console.error('解析当前用户信息失败:', error);
      }
    }
  }, [navigate, setIsAuthenticated, setCurrentUser]);

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 从本地存储获取管理员用户列表
      const usersStr = localStorage.getItem('adminUsers');
      let adminUsers: AdminUser[] = [];
      
      if (usersStr) {
        adminUsers = JSON.parse(usersStr);
      } else {
        // 如果没有管理员用户，创建一个默认管理员
        adminUsers = [
          {
            id: 'admin_1',
            username: 'admin',
            passwordHash: 'admin123', // 实际项目中应该使用bcrypt等进行加密
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
      }
      
      // 验证用户名和密码
      const user = adminUsers.find(u => 
        u.username === username && u.passwordHash === password
      );
      
      if (user) {
        // 登录成功
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('currentAdminUser', JSON.stringify(user));
        
        // 更新用户最后登录时间
        const updatedUsers = adminUsers.map(u => 
          u.id === user.id 
            ? { ...u, lastLogin: new Date().toISOString(), updatedAt: new Date().toISOString() } 
            : u
        );
        localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
        
        toast.success('登录成功，正在跳转到管理页面...');
        navigate('/admin');
      } else {
        // 登录失败
        setError('用户名或密码错误');
      }
    } catch (error) {
      console.error('登录过程中发生错误:', error);
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gradient-to-b from-amber-50 to-red-50 text-gray-900'}`}>
      <motion.div
        className={`w-full max-w-md p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90 border border-gray-200'} backdrop-blur-sm`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <motion.div
            className="text-4xl mb-3 text-red-600 dark:text-red-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <i className="fa-solid fa-user-gear"></i>
          </motion.div>
          <motion.h1 
            className="text-2xl font-bold font-serif"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            管理员登录
          </motion.h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            请输入您的账号和密码以访问管理系统
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 用户名输入 */}
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium mb-1"
            >
              用户名
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500`}>
                <i className="fa-solid fa-user"></i>
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>
          </div>
          
          {/* 密码输入 */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-1"
            >
              密码
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500`}>
                <i className="fa-solid fa-lock"></i>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <motion.div 
              className={`p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-800'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <i className="fa-solid fa-circle-exclamation mr-1"></i>
              {error}
            </motion.div>
          )}
          
          {/* 登录按钮 */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-md"
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                登录中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket mr-2"></i>
                登录
              </>
            )}
          </motion.button>
        </form>
        
        {/* 默认登录信息提示 */}
        <div className={`mt-4 text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>默认账号: admin</p>
          <p>默认密码: admin123</p>
        </div>
      </motion.div>
      
      {/* 页脚 */}
      <footer className={`mt-8 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
        <p>© {new Date().getFullYear()} 个性对联定制商城 - 管理系统</p>
      </footer>
    </div>
  );
}