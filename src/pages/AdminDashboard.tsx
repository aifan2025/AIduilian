import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import { AuthContext } from '../contexts/authContext';
import { getHistory } from '../lib/coupletGenerator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getOrders, updateOrderStatus, simulatePayment } from '../lib/cartService';
import { Order, OrderStatus, AdminUser, PaymentMethodConfig } from '../lib/types';
import { paymentMethods } from '../lib/mockData';

// 定义历史记录项接口
interface HistoryItem {
  id: string;
  timestamp: string;
  couplet: {
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  };
}

// 场景使用统计数据接口
interface SceneStat {
  name: string;
  count: number;
  color: string;
}

// 商品状态类型
type ProductStatus = 'active' | 'inactive';

// 商品接口
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  status: ProductStatus;
  styleId?: string; // 新增样式ID字段
  createdAt: string;
  updatedAt: string;
}

// 样式图片接口
interface StyleImage {
  id: string;
  name: string;
  price: number;
  previewUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 新样式表单状态
interface NewStyle {
  name: string;
  price: number;
  imagePreview: string | null;
}

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

// 获取商品状态中文名称
const getProductStatusText = (status: ProductStatus): string => {
  const statusMap: Record<ProductStatus, string> = {
    active: '已上架',
    inactive: '已下架'
  };
  return statusMap[status] || status;
};

// 获取商品状态对应的样式
const getProductStatusStyle = (status: ProductStatus, theme: 'light' | 'dark'): string => {
  const baseStyle = 'px-2 py-1 rounded-full text-xs font-medium';
  
  switch (status) {
    case 'active':
      return `${baseStyle} ${theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`;
    case 'inactive':
      return `${baseStyle} ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`;
    default:
      return `${baseStyle} ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`;
  }
};

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout, currentUser } = useContext(AuthContext);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<HistoryItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedTab, setSelectedTab] = useState('orders');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('all');
  const navigate = useNavigate();

  // 商品相关状态
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProductStatus, setSelectedProductStatus] = useState<string>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    status: 'active',
    styleId: '' // 初始化样式ID
  });
  
  // 样式图片相关状态
  const [styleImages, setStyleImages] = useState<StyleImage[]>([]);
  const [newStyle, setNewStyle] = useState<NewStyle>({
    name: '',
    price: 0,
    imagePreview: null
  });
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<StyleImage | null>(null);
  const [editingStyleFile, setEditingStyleFile] = useState<File | null>(null);

  // 用户管理相关状态
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState<Partial<AdminUser>>({
    username: '',
    password: '',
    role: 'editor'
  });
  
  // 支付方式相关状态
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentMethodConfig[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethodConfig | null>(null);
  const [newPaymentConfig, setNewPaymentConfig] = useState<Partial<PaymentMethodConfig>>({
    name: '',
    enabled: true,
    type: 'alipay',
    config: {},
    description: ''
  });

  // 修改密码相关状态
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 场景使用统计数据
  const sceneStats: SceneStat[] = [
    { name: '春节', count: 45, color: '#FF6B6B' },
    { name: '结婚', count: 30, color: '#4ECDC4' },
    { name: '祝寿', count: 15, color: '#FFD166' },
    { name: '乔迁', count: 25, color: '#06D6A0' },
    { name: '开业', count: 20, color: '#118AB2' },
    { name: '搞笑', count: 10, color: '#073B4C' },
  ];

  // 月度生成量数据
  const monthlyData = [
    { name: '1月', count: 35 },
    { name: '2月', count: 52 },
    { name: '3月', count: 48 },
    { name: '4月', count: 36 },
    { name: '5月', count: 42 },
    { name: '6月', count: 33 },
    { name: '7月', count: 28 },
    { name: '8月', count: 31 },
    { name: '9月', count: 43 },
    { name: '10月', count: 38 },
    { name: '11月', count: 47 },
    { name: '12月', count: 50 },
  ];

  // 月度销售额数据
  const monthlySalesData = [
    { name: '1月', sales: 2500 },
    { name: '2月', sales: 4800 },
    { name: '3月', sales: 3200 },
    { name: '4月', sales: 2800 },
    { name: '5月', sales: 3500 },
    { name: '6月', sales: 3100 },
    { name: '7月', sales: 2900 },
    { name: '8月', sales: 3300 },
    { name: '9月', sales: 3700 },
    { name: '10月', sales: 3400 },
    { name: '11月', sales: 4000 },
    { name: '12月', sales: 4500 },
  ];

  // 用户增长数据
  const userGrowthData = [
    { name: '1月', users: 150 },
    { name: '2月', users: 180 },
    { name: '3月', users: 210 },
    { name: '4月', users: 220 },
    { name: '5月', users: 240 },
    { name: '6月', users: 254 },
    { name: '7月', users: 260 },
    { name: '8月', users: 270 },
    { name: '9月', users: 285 },
    { name: '10月', users: 300 },
    { name: '11月', users: 310 },
    { name: '12月', users: 320 },
  ];

  // 验证是否已登录
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!adminLoggedIn || !isAuthenticated) {
      // 确保即使在未登录状态下也能正确导航到登录页面
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // 加载历史记录和订单数据
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      loadAdminUsers();
      loadPaymentConfigs();
    }
  }, [isAuthenticated]);

  // 搜索过滤
  useEffect(() => {
    if (selectedTab === 'records') {
      if (searchQuery.trim() === '') {
        setFilteredData(historyData);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = historyData.filter(item => 
          item.couplet.top.toLowerCase().includes(query) ||
          item.couplet.bottom.toLowerCase().includes(query) ||
          item.couplet.center.toLowerCase().includes(query) ||
          item.couplet.explanation.toLowerCase().includes(query)
        );
        setFilteredData(filtered);
      }
    } else if (selectedTab === 'orders') {
      if (selectedOrderStatus === 'all') {
        setFilteredOrders(orders);
      } else {
        setFilteredOrders(orders.filter(order => order.status === selectedOrderStatus));
      }
    } else if (selectedTab === 'products') {
      let filtered = products;
      if (selectedProductStatus !== 'all') {
        filtered = filtered.filter(product => product.status === selectedProductStatus);
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
        );
        setFilteredProducts(filtered);
      }
    } else if (selectedTab === 'users') {
      // 用户管理的过滤逻辑可以在这里添加
    } else if (selectedTab === 'payment') {
      // 支付方式管理的过滤逻辑可以在这里添加
    }
  }, [searchQuery, historyData, selectedTab, orders, selectedOrderStatus, products, selectedProductStatus]);

  // 加载主要数据
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 加载生成记录
      const history = getHistory();
      
      // 转换格式以符合我们的HistoryItem接口
      const formattedHistory: HistoryItem[] = history.map((item: any, index: number) => ({
        id: `record-${Date.now()}-${index}`,
        timestamp: item.timestamp,
        couplet: {
          top: item.top,
          bottom: item.bottom,
          center: item.center,
          explanation: item.explanation || '暂无解释'
        }
      }));
      
      // 模拟更多数据用于展示
      const mockHistory: HistoryItem[] = [];
      for (let i = 0; i < 10; i++) {
        mockHistory.push({
          id: `mock-${i}`,
          timestamp: new Date(Date.now() - i * 86400000).toISOString(), // 每天一条
          couplet: {
            top: `${i % 10 === 0 ? '张' : i % 10 === 1 ? '李' : i % 10 === 2 ? '王' : i % 10 === 3 ? '赵' : i % 10 === 4 ? '刘' : i % 10 === 5 ? '陈' : i % 10 === 6 ? '杨' : i % 10 === 7 ? '黄' : i % 10 === 8 ? '周' : '吴'}${i % 3 === 0 ? '灯结彩' : i % 3 === 1 ? '门焕彩' : '家欢乐'}${i % 5 === 0 ? '迎新岁' : i % 5 === 1 ? '贺新春' : i % 5 === 2 ? '添祥瑞' : i % 5 === 3 ? '纳福康' : '万事兴'}`,
            bottom: `${i % 10 === 0 ? '李' : i % 10 === 1 ? '张' : i % 10 === 2 ? '赵' : i % 10 === 3 ? '王' : i % 10 === 4 ? '陈' : i % 10 === 5 ? '刘' : i % 10 === 6 ? '杨' : i % 10 === 7 ? '周' : i % 10 === 8 ? '黄' : '吴'}${i % 3 === 0 ? '语欢歌' : i % 3 === 1 ? '宅生辉' : '业兴隆'}${i % 5 === 0 ? '贺吉年' : i % 5 === 1 ? '庆团圆' : i % 5 === 2 ? '步步高' : i % 5 === 3 ? '财源广' : '福满堂'}`,
            center: i % 6 === 0 ? '新春快乐' : i % 6 === 1 ? '吉祥如意' : i % 6 === 2 ? '恭喜发财' : i % 6 === 3 ? '富贵吉祥' : i % 6 === 4 ? '万事如意' : '财源广进',
            explanation: `这是一条${i % 6 === 0 ? '春节' : i % 6 === 1 ? '结婚' : i % 6 === 2 ? '祝寿' : i % 6 === 3 ? '乔迁' : i % 6 === 4 ? '开业' : '搞笑'}场景的对联，对仗工整，寓意吉祥。`
          }
        });
      }
      
      // 合并真实历史和模拟数据
      const combinedData = [...formattedHistory, ...mockHistory];
      
      // 按时间排序，最新的在前
      combinedData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setHistoryData(combinedData);
      setFilteredData(combinedData);
      
      // 加载订单数据
      const orderList = getOrders();
      
      // 模拟一些订单数据
      if (orderList.length === 0) {
        const mockOrders: Order[] = generateMockOrders();
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
      } else {
        setOrders(orderList);
        setFilteredOrders(orderList);
      }

      // 初始化商品数据
      initializeProducts();
    } catch (error) {
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载管理员用户列表
  const loadAdminUsers = () => {
    try {
      const usersStr = localStorage.getItem('adminUsers');
      if (usersStr) {
        setAdminUsers(JSON.parse(usersStr));
      } else {
        // 创建默认管理员用户
        const defaultAdmin: AdminUser = {
          id: 'admin_1',
          username: 'admin',
          passwordHash: 'admin123', // 实际项目中应该使用bcrypt等进行加密
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAdminUsers([defaultAdmin]);
        localStorage.setItem('adminUsers', JSON.stringify([defaultAdmin]));
      }
    } catch (error) {
      console.error('加载管理员用户失败:', error);
      toast.error('加载用户列表失败');
    }
  };

  // 加载支付方式配置
  const loadPaymentConfigs = () => {
    try {
      const configsStr = localStorage.getItem('paymentConfigs');
      if (configsStr) {
        setPaymentConfigs(JSON.parse(configsStr));
      } else {
        // 使用默认支付方式配置
        setPaymentConfigs(paymentMethods);
        localStorage.setItem('paymentConfigs', JSON.stringify(paymentMethods));
      }
    } catch (error) {
      console.error('加载支付配置失败:', error);
      toast.error('加载支付配置失败');
    }
  };

  // 初始化商品数据
  const initializeProducts = () => {
    // 模拟商品数据
    const mockProducts: Product[] = [
      {
        id: 'product_1',
        name: '小号春联',
        price: 29.9,
        description: '适合室内小门框的精美春联，尺寸约40x120cm',
        status: 'active',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: 'product_2',
        name: '中号春联',
        price: 49.9,
        description: '适合标准门框的春联，尺寸约50x150cm',
        status: 'active',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'product_3',
        name: '大号春联',
        price: 79.9,
        description: '适合大门框的春联，尺寸约60x180cm',
        status: 'active',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: 'product_4',
        name: '定制尺寸春联',
        price: 99.9,
        description: '联系客服定制特殊尺寸的春联',
        status: 'active',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: 'product_5',
        name: '金边装饰春联',
        price: 69.8,
        description: '带有金色边框装饰的春联',
        status: 'inactive',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 86400000).toISOString()
      }
    ];
    
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
    
    // 初始化样式图片数据
    initializeStyleImages();
  };
  
  // 初始化样式图片数据
  const initializeStyleImages = () => {
    try {
      // 从本地存储获取样式图片数据
      const storedStyles = localStorage.getItem('couplet_style_images');
      if (storedStyles) {
        setStyleImages(JSON.parse(storedStyles));
        return;
      }
      
      // 如果没有存储的数据，使用默认数据
      const defaultStyles: StyleImage[] = [
        {
          id: 'classic',
          name: '经典红底',
          price: 0,
          previewUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=traditional%20chinese%20couplet%20red%20background%20gold%20characters&sign=5514e5d4e7b15dad9352f04b75f55fbf',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'golden',
          name: '金边装饰',
          price: 19.9,
          previewUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=chinese%20couplet%20with%20golden%20border%20decoration&sign=1ebd71c343f286d9cb16ce82a38ba9e6',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'calligraphy',
          name: '名家书法',
          price: 29.9,
          previewUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=chinese%20calligraphy%20couplet%20art%20style&sign=3e7699a419bd3cf4e7eceebb86c4b692',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'antique',
          name: '古风卷轴',
          price: 39.9,
          previewUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=ancient%20chinese%20scroll%20style%20couplet&sign=b175041775eec3a68c4649534e5f1e29',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setStyleImages(defaultStyles);
      // 保存到本地存储
      localStorage.setItem('couplet_style_images', JSON.stringify(defaultStyles));
    } catch (error) {
      console.error('初始化样式图片失败:', error);
      toast.error('加载样式图片失败');
    }
  };
  
  // 保存样式图片数据到本地存储
  const saveStyleImagesToStorage = (styles: StyleImage[]) => {
    try {
      localStorage.setItem('couplet_style_images', JSON.stringify(styles));
    } catch (error) {
      console.error('保存样式图片失败:', error);
      toast.error('保存失败，请重试');
    }
  };
  
  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setNewStyle(prev => ({ ...prev, imagePreview: previewUrl }));
    }
  };
  
  // 保存新样式
  const saveStyle = async () => {
    if (!newStyle.name.trim() || !newStyle.imagePreview) {
      toast.error('请填写样式名称并上传图片');
      return;
    }
    
    try {
       // 实际应用中应该上传图片到服务器并获取URL
      // 这里使用blob URL作为临时预览，在保存时转换为data URL确保数据持久化
      
       // 转换blob URL为data URL确保能正确保存到localStorage
      const imagePreview = newStyle.imagePreview;
      let finalPreviewUrl = imagePreview;
      
      // 如果是blob URL，转换为data URL
      if (imagePreview && imagePreview.startsWith('blob:')) {
        try {
          // 创建一个canvas来转换图片
          const canvas = document.createElement('canvas');
          const img = new Image();
          
          // 使用Promise确保图片加载完成
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                // 获取data URL
                finalPreviewUrl = canvas.toDataURL('image/png');
                resolve();
              } else {
                reject(new Error('无法获取canvas上下文'));
              }
            };
            img.onerror = reject;
            img.src = imagePreview;
          });
        } catch (error) {
          console.error('转换图片URL失败:', error);
          // 如果转换失败，使用默认图片
          finalPreviewUrl = 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=traditional%20chinese%20couplet%20red%20background%20gold%20characters&sign=5514e5d4e7b15dad9352f04b75f55fbf';
        }
      }
      
      const newStyleImage: StyleImage = {
        id: `style_${Date.now()}`,
        name: newStyle.name,
        price: newStyle.price,
        previewUrl: finalPreviewUrl,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedStyles = [newStyleImage, ...styleImages];
      setStyleImages(updatedStyles);
      saveStyleImagesToStorage(updatedStyles);
      
      // 重置表单
      setNewStyle({
        name: '',
        price: 0,
        imagePreview: null
      });
      
      toast.success('样式添加成功');
    } catch (error) {
      console.error('保存样式失败:', error);
      toast.error('保存失败，请重试');
    }
  };
  
  // 编辑样式
   const editStyle = (style: StyleImage) => {
    // 确保预览URL是可用的格式
    let safePreviewUrl = style.previewUrl;
    if (!safePreviewUrl || safePreviewUrl.startsWith('blob:')) {
      safePreviewUrl = 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=traditional%20chinese%20couplet%20red%20background%20gold%20characters&sign=5514e5d4e7b15dad9352f04b75f55fbf';
    }
    
    setEditingStyle({ ...style, previewUrl: safePreviewUrl });
    setEditingStyleFile(null);
    setIsStyleModalOpen(true);
  };
  
  // 更新样式
  const updateStyle = async () => {
    if (!editingStyle) return;
    
    try {
       // 如果有新文件，处理图片上传
      let finalPreviewUrl = editingStyle.previewUrl;
      
      if (editingStyleFile) {
        try {
          // 创建一个canvas来转换图片
          const canvas = document.createElement('canvas');
          const img = new Image();
          
          // 使用FileReader读取文件
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  // 获取data URL
                  finalPreviewUrl = canvas.toDataURL('image/png');
                  resolve();
                } else {
                  reject(new Error('无法获取canvas上下文'));
                }
              };
              img.onerror = reject;
              img.src = dataUrl;
            };
            reader.onerror = reject;
            reader.readAsDataURL(editingStyleFile);
          });
        } catch (error) {
          console.error('处理图片文件失败:', error);
          toast.warning('图片更新失败，保留原图片');
        }
      }
      
      const updatedStyle: StyleImage = {
        ...editingStyle,
        previewUrl: finalPreviewUrl,
        updatedAt: new Date().toISOString()
      };
      
      const updatedStyles = styleImages.map(style => 
        style.id === editingStyle.id ? updatedStyle : style
      );
      
      setStyleImages(updatedStyles);
      saveStyleImagesToStorage(updatedStyles);
      closeStyleModal();
      
      toast.success('样式更新成功');
    } catch (error) {
      console.error('更新样式失败:', error);
      toast.error('更新失败，请重试');
    }
  };
  
  // 删除样式
  const deleteStyle = (styleId: string) => {
    if (window.confirm('确定要删除这个样式吗？')) {
      try {
        const updatedStyles = styleImages.filter(style => style.id !== styleId);
        setStyleImages(updatedStyles);
        saveStyleImagesToStorage(updatedStyles);
        toast.success('样式已删除');
      } catch (error) {
        console.error('删除样式失败:', error);
        toast.error('删除失败，请重试');
      }
    }
  };
  
  // 切换样式启用状态
  const toggleStyleStatus = (styleId: string) => {
    try {
      const updatedStyles = styleImages.map(style => 
        style.id === styleId 
          ? { ...style, isActive: !style.isActive, updatedAt: new Date().toISOString() } 
          : style
      );
      
      setStyleImages(updatedStyles);
      saveStyleImagesToStorage(updatedStyles);
    } catch (error) {
      console.error('更新样式状态失败:', error);
      toast.error('操作失败，请重试');
    }
  };
  
  // 关闭样式编辑模态框
  const closeStyleModal = () => {
    setIsStyleModalOpen(false);
    setEditingStyle(null);
    setEditingStyleFile(null);
  };
  
  // 导出样式配置
  const exportStyles = () => {
    try {
      const dataStr = JSON.stringify(styleImages, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `couplet_styles_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('样式配置已导出');
    } catch (error) {
      console.error('导出样式配置失败:', error);
      toast.error('导出失败，请重试');
    }
  };

  // 生成模拟订单数据
  const generateMockOrders = (): Order[] => {
    const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const mockOrders: Order[] = [];
    
    for (let i = 0; i < 15; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3个商品
      const items = [];
      let totalPrice = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const price = Math.floor(Math.random() * 100) + 30; // 30-130元
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

  // 处理删除记录
  const handleDeleteRecord = (id: string) => {
    setHistoryData(prev => prev.filter(item => item.id !== id));
    setFilteredData(prev => prev.filter(item => item.id !== id));
    toast.success('记录已删除');
  };

  // 处理批量删除
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  
  const handleSelectRecord = (id: string) => {
    setSelectedRecords(prev => 
      prev.includes(id) 
        ? prev.filter(recordId => recordId !== id) 
        : [...prev, id]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedRecords.length === filteredData.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredData.map(item => item.id));
    }
  };
  
  const handleBatchDelete = () => {
    if (selectedRecords.length === 0) {
      toast.warning('请先选择要删除的记录');
      return;
    }
    
    setHistoryData(prev => prev.filter(item => !selectedRecords.includes(item.id)));
    setFilteredData(prev => prev.filter(item => !selectedRecords.includes(item.id)));
    setSelectedRecords([]);
    toast.success(`已删除 ${selectedRecords.length} 条记录`);
  };

  // 处理订单状态更新
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } 
        : order
    ));
    toast.success(`订单状态已更新为${getStatusText(newStatus)}`);
  };

  // 处理订单支付状态更新
  const handleOrderPayment = async (orderId: string, paymentMethod: 'alipay' | 'wechat') => {
    try {
      const success = await simulatePayment(orderId);
      if (success) {
        // 更新订单状态
        updateOrderStatus(orderId, 'processing');
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: 'processing', 
                paymentStatus: 'paid',
                paymentMethod: paymentMethod,
                paymentTime: new Date().toISOString(),
                transactionId: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                updatedAt: new Date().toISOString() 
              } 
            : order
        ));
        toast.success(`订单支付成功，已更新为处理中状态`);
      } else {
        toast.error('支付失败，请重试');
      }
    } catch (error) {
      console.error('处理订单支付失败:', error);
      toast.error('处理支付失败，请重试');
    }
  };

  // 处理商品状态更新
  const handleUpdateProductStatus = (productId: string, newStatus: ProductStatus) => {
    try {
      // 确保状态更新逻辑正确执行
      console.log(`处理商品状态更新: productId=${productId}, newStatus=${newStatus}`);
      
      // 更新状态
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, status: newStatus, updatedAt: new Date().toISOString() } 
          : product
      ));
      
      // 更新筛选后的商品列表
      const updatedProducts = [...products].map(product => 
        product.id === productId 
          ? { ...product, status: newStatus, updatedAt: new Date().toISOString() } 
          : product
      );
      
      // 应用相同的筛选条件
      let filtered = updatedProducts;
      if (selectedProductStatus !== 'all') {
        filtered = filtered.filter(product => product.status === selectedProductStatus);
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
        );
      }
      setFilteredProducts(filtered);
      
      toast.success(`商品状态已更新为${getProductStatusText(newStatus)}`);
    } catch (error) {
      console.error('更新商品状态时出错:', error);
      toast.error('操作失败，请重试');
    }
  };

  // 打开商品编辑模态框
   const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setNewProduct({ ...product });
    } else {
      setEditingProduct(null);
      setNewProduct({
        name: '',
        price: 0,
        description: '',
        status: 'active',
        styleId: ''
      });
    }
    setIsProductModalOpen(true);
  };

  // 关闭商品编辑模态框
  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      price: 0,
      description: '',
      status: 'active'
    });
  };

  // 保存商品
  const saveProduct = () => {
    if (!newProduct.name || newProduct.price === undefined) {
      toast.error('请填写商品名称和价格');
      return;
    }

    if (editingProduct) {
      // 编辑商品
      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id 
          ? { 
              ...product, 
              ...newProduct,
              updatedAt: new Date().toISOString()
            } 
          : product
      ));
      toast.success('商品已更新');
    } else {
      // 添加新商品
       const product: Product = {
        id: `product_${Date.now()}`,
        name: newProduct.name,
        price: newProduct.price,
        description: newProduct.description || '',
        status: (newProduct.status as ProductStatus) || 'active',
        styleId: newProduct.styleId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProducts(prev => [product, ...prev]);
      toast.success('商品已添加');
    }

    closeProductModal();
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // 处理登出
  const handleLogout = () => {
    logout();
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('currentAdminUser');
    navigate('/login');
    toast.success('已成功登出');
  };

  // 处理修改密码
  const handleChangePassword = async () => {
    if (!currentUser) return;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('请填写所有密码字段');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    
    // 验证当前密码
    if (currentPassword !== 'admin123' && currentPassword !== currentUser.passwordHash) {
      toast.error('当前密码不正确');
      return;
    }
    
    try {
      // 更新密码
      const updatedUsers = adminUsers.map(user => 
        user.id === currentUser.id 
          ? { 
              ...user, 
              passwordHash: newPassword, // 实际项目中应该使用bcrypt等进行加密
              updatedAt: new Date().toISOString() 
            } 
          : user
      );
      
      setAdminUsers(updatedUsers);
      
      // 确保本地存储操作正确执行
      try {
        localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
      } catch (storageError) {
        console.error('保存用户数据到本地存储失败:', storageError);
      }
      
      // 更新当前用户信息
      const updatedCurrentUser = { 
        ...currentUser, 
        passwordHash: newPassword,
        updatedAt: new Date().toISOString() 
      };
      
      // 确保当前用户信息正确保存
      try {
        localStorage.setItem('currentAdminUser', JSON.stringify(updatedCurrentUser));
      } catch (storageError) {
        console.error('保存当前用户信息失败:', storageError);
      }
      
      // 重置表单
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
      
      toast.success('密码修改成功，请重新登录');
      
      // 强制用户重新登录
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1000);
      
    } catch (error) {
      console.error('修改密码失败:', error);
      toast.error('修改密码失败，请重试');
    }
  };

  // 处理添加/编辑用户
  const handleSaveUser = () => {
    if (!newUser.username) {
      toast.error('请填写用户名');
      return;
    }
    
    try {
      if (editingUser) {
        // 编辑用户
        const updatedUsers = adminUsers.map(user => 
          user.id === editingUser.id 
            ? { 
                ...user, 
                username: newUser.username || user.username,
                role: newUser.role || user.role,
                // 只有在提供了新密码时才更新密码
                passwordHash: newUser.password ? newUser.password : user.passwordHash,
                updatedAt: new Date().toISOString() 
              } 
            : user
        );
        
        setAdminUsers(updatedUsers);
        localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
        toast.success('用户已更新');
      } else {
        // 添加新用户 - 新增用户必须提供密码
        if (!newUser.password) {
          toast.error('新增用户必须设置密码');
          return;
        }
        
        // 添加新用户
        const newAdminUser: AdminUser = {
          id: `admin_${Date.now()}`,
          username: newUser.username,
          passwordHash: newUser.password, // 实际项目中应该使用bcrypt等进行加密
          role: newUser.role || 'editor',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updatedUsers = [...adminUsers, newAdminUser];
        setAdminUsers(updatedUsers);
        localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
        toast.success('用户已添加');
      }
      
      // 关闭模态框并重置表单
      closeUserModal();
    } catch (error) {
      console.error('保存用户失败:', error);
      toast.error('保存用户失败，请重试');
    }
  };

  // 处理删除用户
  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('不能删除当前登录的用户');
      return;
    }
    
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        const updatedUsers = adminUsers.filter(user => user.id !== userId);
        setAdminUsers(updatedUsers);
        localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
        toast.success('用户已删除');
      } catch (error) {
        console.error('删除用户失败:', error);
        toast.error('删除用户失败，请重试');
      }
    }
  };

  // 处理保存支付方式配置
  const handleSavePaymentConfig = () => {
    if (!newPaymentConfig.name || !newPaymentConfig.type) {
      toast.error('请填写支付方式名称和类型');
      return;
    }
    
    try {
      if (editingPayment) {
        // 编辑支付配置
        const updatedConfigs = paymentConfigs.map(config => 
          config.id === editingPayment.id 
            ? { 
                ...config, 
                name: newPaymentConfig.name || config.name,
                enabled: newPaymentConfig.enabled !== undefined ? newPaymentConfig.enabled : config.enabled,
                type: newPaymentConfig.type || config.type,
                config: newPaymentConfig.config || config.config,
                description: newPaymentConfig.description || config.description
              } 
            : config
        );
        
        setPaymentConfigs(updatedConfigs);
        localStorage.setItem('paymentConfigs', JSON.stringify(updatedConfigs));
        toast.success('支付配置已更新');
      } else {
        // 添加新支付配置
        const newConfig: PaymentMethodConfig = {
          id: `payment_${Date.now()}`,
          name: newPaymentConfig.name,
          enabled: newPaymentConfig.enabled !== undefined ? newPaymentConfig.enabled : true,
          type: newPaymentConfig.type as 'alipay' | 'wechat' | 'online',
          config: newPaymentConfig.config || {},
          description: newPaymentConfig.description || ''
        };
        
        const updatedConfigs = [...paymentConfigs, newConfig];
        setPaymentConfigs(updatedConfigs);
        localStorage.setItem('paymentConfigs', JSON.stringify(updatedConfigs));
        toast.success('支付配置已添加');
      }
      
      // 关闭模态框并重置表单
      closePaymentModal();
    } catch (error) {
      console.error('保存支付配置失败:', error);
      toast.error('保存支付配置失败，请重试');
    }
  };

  // 打开用户管理模态框
  const openUserModal = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setNewUser({
        username: user.username,
        role: user.role,
        password: '' // 编辑用户时清空密码字段
      });
    } else {
      setEditingUser(null);
      setNewUser({
        username: '',
        password: '',
        role: 'editor'
      });
    }
    setIsUserModalOpen(true);
  };

  // 关闭用户管理模态框
  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
    setNewUser({
      username: '',
      password: '',
      role: 'editor'
    });
  };

  // 打开支付配置模态框
  const openPaymentModal = (payment?: PaymentMethodConfig) => {
    if (payment) {
      setEditingPayment(payment);
      setNewPaymentConfig({
        name: payment.name,
        enabled: payment.enabled,
        type: payment.type,
        config: { ...payment.config }, // 创建深拷贝避免引用问题
        description: payment.description
      });
    } else {
      setEditingPayment(null);
      setNewPaymentConfig({
        name: '',
        enabled: true,
        type: 'alipay',
        config: {},
        description: ''
      });
    }
    setIsPaymentModalOpen(true);
  };

  // 关闭支付配置模态框
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setEditingPayment(null);
    setNewPaymentConfig({
      name: '',
      enabled: true,
      type: 'alipay',
      config: {},
      description: ''
    });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 顶部导航栏 */}
      <header className={`sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <motion.div 
                className="text-xl font-bold font-serif text-red-600 dark:text-red-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <i className="fa-solid fa-user-gear mr-2"></i>
                后台管理系统
              </motion.div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-800'} transition-colors`}
                aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
              >
                {theme === 'dark' ? (
                  <i className="fa-solid fa-sun"></i>
                ) : (
                  <i className="fa-solid fa-moon"></i>
                )}
              </button>
              
              <motion.button
                onClick={handleLogout}
                className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white flex items-center transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fa-solid fa-right-from-bracket mr-2"></i>
                退出登录
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎信息 */}
        <motion.div 
          className={`mb-8 p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold">欢迎回来，管理员</h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            今天是 {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </motion.div>

        {/* 管理选项卡 */}
        <div className="mb-6 flex overflow-x-auto pb-2 gap-2">
           <motion.button
            onClick={() => setSelectedTab('orders')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedTab === 'orders' 
                ? 'bg-red-600 text-white shadow-md' 
                : `${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-box mr-2"></i>订单管理
          </motion.button>
          
          <motion.button
            onClick={() => setSelectedTab('products')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedTab === 'products' 
                ? 'bg-red-600 text-white shadow-md' 
                : `${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-tags mr-2"></i>商品管理
          </motion.button>
          
          <motion.button
            onClick={() => setSelectedTab('records')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedTab === 'records' 
                ? 'bg-red-600 text-white shadow-md' 
                : `${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-clipboard-list mr-2"></i>生成记录
          </motion.button>
          
          <motion.button
            onClick={() => setSelectedTab('statistics')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedTab === 'statistics' 
                ? 'bg-red-600 text-white shadow-md' 
                : `${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-chart-simple mr-2"></i>数据统计
          </motion.button>
          
          <motion.button
            onClick={() => setSelectedTab('users')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedTab === 'users' 
                ? 'bg-red-600 text-white shadow-md' 
                : `${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-users mr-2"></i>用户管理
          </motion.button>
          
          <motion.button
            onClick={() => setSelectedTab('payment')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedTab === 'payment' 
                ? 'bg-red-600 text-white shadow-md' 
                : `${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-credit-card mr-2"></i>支付管理
          </motion.button>
          
          <motion.button
            onClick={() => setSelectedTab('settings')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedTab === 'settings' 
                ? 'bg-red-600 text-white shadow-md' 
                : `${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-gear mr-2"></i>系统设置
          </motion.button>
          
          <motion.button
            onClick={() => setSelectedTab('styleImages')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedTab === 'styleImages' 
                ? 'bg-red-600 text-white shadow-md' 
                : `${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-images mr-2"></i>样式图片管理
          </motion.button>
        </div>

        {/* 选项卡内容 */}
        <div className="mt-8">
          {/* 订单管理选项卡 */}
          {selectedTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold">订单管理</h2>
                  
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'all', label: '全部订单' },
                      { id: 'pending', label: '待支付' },
                      { id: 'processing', label: '处理中' },
                      { id: 'shipped', label: '已发货' },
                      { id: 'delivered', label: '已完成' },
                      { id: 'cancelled', label: '已取消' }
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        onClick={() => setSelectedOrderStatus(tab.id)}
                        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                          selectedOrderStatus === tab.id
                            ? `${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'} font-medium`
                            : `${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
                        } transition-colors`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {tab.label}
                        {tab.id !== 'all' && (
                          <span className="ml-1.5 text-xs bg-gray-600 dark:bg-gray-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center">
                            {orders.filter(order => order.status === tab.id).length}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl text-gray-400 mb-4">
                      <i className="fa-solid fa-box-open"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">暂无订单记录</h3>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedOrderStatus !== 'all' ? `没有${getStatusText(selectedOrderStatus as OrderStatus)}的订单` : '还没有生成任何订单'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            订单编号
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            下单时间
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            商品数量
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            订单金额
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            订单状态
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                        {filteredOrders.map((order) => (
                          <motion.tr 
                            key={order.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {order.items.length}
                            </td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                              ¥{order.totalPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getStatusStyle(order.status, theme)}>
                                {getStatusText(order.status)}
                              </span>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                               <div className="flex space-x-2">
                                 <motion.button
                                   onClick={() => {
                                     // 查看订单详情
                                     toast.info(`查看订单 ${order.id} 的详情`);
                                     // 这里可以实现订单详情页面的逻辑，目前简化为显示信息
                                     const orderDetails = JSON.stringify(order, null, 2);
                                     console.log('订单详情:', orderDetails);
                                     // 在实际应用中，这里可以导航到订单详情页面
                                   }}
                                   className={`px-3 py-1 rounded ${
                                     theme === 'dark' 
                                       ? 'bg-blue-700/80 hover:bg-blue-600 text-blue-200' 
                                       : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                   } transition-colors`}
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                                 >
                                   详情
                                 </motion.button>
                                
                                {order.status === 'pending' && order.paymentStatus === 'pending' && (
                                  <>
                                    <motion.button
                                      onClick={() => handleOrderPayment(order.id, 'alipay')}
                                      className={`px-3 py-1 rounded ${
                                        theme === 'dark' 
                                          ? 'bg-blue-700/80 hover:bg-blue-600 text-blue-200' 
                                          : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                      } transition-colors flex items-center`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <i className="fa-brands fa-alipay mr-1"></i> 支付宝
                                  </motion.button>
                                  
                                   <motion.button
                                     onClick={() => handleOrderPayment(order.id, 'wechat')}
                                     className={`px-3 py-1 rounded ${
                                       theme === 'dark' 
                                         ? 'bg-green-700/80 hover:bg-green-600 text-green-200' 
                                         : 'bg-green-100 hover:bg-green-200 text-green-800'
                                     } transition-colors flex items-center`}
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                                 >
                                   <i className="fa-brands fa-weixin mr-1"></i> 微信
                                 </motion.button>
                                 
                                  <motion.button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                    className={`px-3 py-1 rounded ${
                                      theme === 'dark' 
                                        ? 'bg-red-700/80 hover:bg-red-600 text-red-200' 
                                        : 'bg-red-100 hover:bg-red-200 text-red-800'
                                    } transition-colors`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  取消
                                </motion.button>
                              </>
                                )}
                                
                                {order.status === 'processing' && (
                                  <motion.button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                    className={`px-3 py-1 rounded ${
                                      theme === 'dark' 
                                        ? 'bg-green-700/80 hover:bg-green-600 text-green-200' 
                                        : 'bg-green-100 hover:bg-green-200 text-green-800'
                                    } transition-colors`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  发货
                                </motion.button>
                                )}
                                
                                {order.status === 'shipped' && (
                                  <motion.button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                    className={`px-3 py-1 rounded ${
                                      theme === 'dark' 
                                        ? 'bg-green-700/80 hover:bg-green-600 text-green-200' 
                                        : 'bg-green-100 hover:bg-green-200 text-green-800'
                                    } transition-colors`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  完成
                                </motion.button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {filteredOrders.length > 0 && (
                  <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    显示 {filteredOrders.length} 条订单（共 {orders.length} 条）
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 生成记录选项卡 */}
          {selectedTab === 'records' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold">对联生成记录</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="搜索对联内容..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                      />
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <i className="fa-solid fa-search"></i>
                      </span>
                    </div>
                    
                    {selectedRecords.length > 0 && (
                      <motion.button
                        onClick={handleBatchDelete}
                        className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white flex items-center transition-colors whitespace-nowrap`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fa-solid fa-trash-can mr-2"></i>
                        批量删除 ({selectedRecords.length})
                      </motion.button>
                    )}
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl text-gray-400 mb-4">
                      <i className="fa-solid fa-folder-open"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">暂无记录</h3>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {searchQuery ? '没有找到匹配的记录' : '还没有生成任何对联'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedRecords.length > 0 && selectedRecords.length === filteredData.length}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            生成时间
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            上联
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            下联
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            横批
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                       <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                        {filteredData.map((record) => (
                          <motion.tr 
                            key={record.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedRecords.includes(record.id)}
                                onChange={() => handleSelectRecord(record.id)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatDate(record.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-serif max-w-[150px] truncate" title={record.couplet.top}>
                              {record.couplet.top}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-serif max-w-[150px] truncate" title={record.couplet.bottom}>
                              {record.couplet.bottom}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-serif">
                              <span className={`inline-block px-2 py-1 rounded ${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-800'}`}>
                                {record.couplet.center}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className={`text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors`}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {filteredData.length > 0 && (
                  <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    显示 {filteredData.length} 条记录（共 {historyData.length} 条）
                  </div>
                )}
              </div>
            </motion.div>
          )}

        {/* 商品管理选项卡 */}
        {selectedTab === 'products' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold">商品管理</h2>
                
                <div className="flex flex-wrap gap-3">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="搜索商品..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                    />
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <i className="fa-solid fa-search"></i>
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'all', label: '全部商品' },
                      { id: 'active', label: '已上架' },
                      { id: 'inactive', label: '已下架' }
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        onClick={() => setSelectedProductStatus(tab.id)}
                        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                          selectedProductStatus === tab.id
                            ? `${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'} font-medium`
                            : `${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
                        } transition-colors`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {tab.label}
                        {tab.id !== 'all' && (
                          <span className="ml-1.5 text-xs bg-gray-600 dark:bg-gray-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center">
                            {products.filter(product => product.status === tab.id).length}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  
                  <motion.button
                    onClick={() => openProductModal()}
                    className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-100 hover:bg-green-200'} text-green-800 dark:text-green-200 transition-colors flex items-center whitespace-nowrap`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className="fa-solid fa-plus mr-2"></i>
                    添加商品
                  </motion.button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl text-gray-400 mb-4">
                    <i className="fa-solid fa-tag"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-2">暂无商品</h3>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedProductStatus !== 'all' ? `没有${getProductStatusText(selectedProductStatus as ProductStatus)}的商品` : '还没有添加任何商品'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          商品名称
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          价格
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          描述
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          状态
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          创建时间
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          更新时间
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead><tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                      {filteredProducts.map((product) => (
                        <motion.tr 
                          key={product.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ¥{product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm max-w-xs truncate">
                            {product.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getProductStatusStyle(product.status, theme)}>
                              {getProductStatusText(product.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {formatDate(product.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {formatDate(product.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <motion.button
                                onClick={() => openProductModal(product)}
                                className={`px-3 py-1 rounded ${
                                  theme === 'dark' 
                                    ? 'bg-blue-700/80 hover:bg-blue-600 text-blue-200' 
                                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                } transition-colors`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                编辑
                              </motion.button>
                              
                               <motion.button
                                onClick={() => {
                                  // 确保函数被正确调用并打印日志以便调试
                                  console.log(`更新商品 ${product.id} 状态: ${product.status} -> ${product.status === 'active' ? 'inactive' : 'active'}`);
                                  handleUpdateProductStatus(product.id, product.status === 'active' ? 'inactive' : 'active');
                                }}
                                className={`px-3 py-1 rounded ${
                                  theme === 'dark' 
                                    ? product.status === 'active' 
                                      ? 'bg-yellow-700/80 hover:bg-yellow-600 text-yellow-200' 
                                      : 'bg-green-700/80 hover:bg-green-600 text-green-200' 
                                    : product.status === 'active' 
                                      ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' 
                                      : 'bg-green-100 hover:bg-green-200 text-green-800'
                                } transition-colors`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {product.status === 'active' ? '下架' : '上架'}
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {filteredProducts.length > 0 && (
                <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  显示 {filteredProducts.length} 件商品（共 {products.length} 件）
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 数据统计选项卡 */}
        {selectedTab === 'statistics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 场景使用统计 */}
              <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                <h2 className="text-xl font-bold mb-6">场景使用统计</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sceneStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {sceneStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [`${value}次`, props.payload.name]}
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                            borderRadius: '0.5rem'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* 月度销售额统计 */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                  <h2 className="text-xl font-bold mb-6">月度销售额统计</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlySalesData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <Tooltip 
                          formatter={(value) => [`¥${value}`, '销售额']}
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Bar dataKey="sales" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* 系统概览统计 */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md lg:col-span-2`}>
                  <h2 className="text-xl font-bold mb-6">系统概览</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <motion.div
                      className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-red-50'}`}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center">
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'} mr-4`}>
                          <i className="fa-solid fa-scroll text-xl text-red-600 dark:text-red-400"></i>
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>总生成数量</p>
                          <h3 className="text-3xl font-bold mt-1">1880</h3>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-green-600 dark:text-green-400">
                        <i className="fa-solid fa-arrow-up mr-1 text-xs"></i>
                        <span className="text-sm font-medium">12.5%</span>
                        <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>较上月</span>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center">
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'} mr-4`}>
                          <i className="fa-solid fa-users text-xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>活跃用户</p>
                          <h3 className="text-3xl font-bold mt-1">254</h3>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-green-600 dark:text-green-400">
                        <i className="fa-solid fa-arrow-up mr-1 text-xs"></i>
                        <span className="text-sm font-medium">8.3%</span>
                        <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>较上月</span>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center">
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'} mr-4`}>
                          <i className="fa-solid fa-shopping-cart text-xl text-green-600 dark:text-green-400"></i>
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>订单数量</p>
                          <h3 className="text-3xl font-bold mt-1">156</h3>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-green-600 dark:text-green-400">
                        <i className="fa-solid fa-arrow-up mr-1 text-xs"></i>
                        <span className="text-sm font-medium">15.2%</span>
                        <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>较上月</span>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'}`}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center">
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'} mr-4`}>
                          <i className="fa-solid fa-wallet text-xl text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>总销售额</p>
                          <h3 className="text-3xl font-bold mt-1">¥32,580</h3>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-green-600 dark:text-green-400">
                        <i className="fa-solid fa-arrow-up mr-1 text-xs"></i>
                        <span className="text-sm font-medium">22.8%</span>
                        <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>较上月</span>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-yellow-50'}`}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center">
                        <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'} mr-4`}>
                          <i className="fa-solid fa-chart-line text-xl text-yellow-600 dark:text-yellow-400"></i>
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>转化率</p>
                          <h3 className="text-3xl font-bold mt-1">12.3%</h3>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-green-600 dark:text-green-400">
                        <i className="fa-solid fa-arrow-up mr-1 text-xs"></i>
                        <span className="text-sm font-medium">3.1%</span>
                        <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>较上月</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

             {/* 用户管理选项卡 */}
          {selectedTab === 'users' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">用户管理</h2>
                <motion.button
                  onClick={openUserModal}
                  className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-100 hover:bg-green-200'} text-green-800 dark:text-green-200 font-medium transition-colors flex items-center`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fa-solid fa-plus mr-2"></i>
                  添加用户
                </motion.button>
              </div>
              
              {/* 密码修改按钮 */}
              <div className="mb-6">
                <motion.button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} text-blue-800 dark:text-blue-200 font-medium transition-colors flex items-center`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <i className="fa-solid fa-key mr-2"></i>
                  修改我的密码
                </motion.button>
              </div>
              
              {/* 用户列表 */}
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        用户名
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        角色
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        创建时间
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        最后登录
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                    {adminUsers.map((user) => (
                      <motion.tr 
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.username}
                          {user.id === currentUser?.id && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                              当前用户
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' 
                              ? theme === 'dark' 
                                ? 'bg-red-900/30 text-red-400' 
                                : 'bg-red-100 text-red-800' 
                              : theme === 'dark' 
                                ? 'bg-blue-900/30 text-blue-400' 
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? '超级管理员' : '编辑'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.lastLogin ? formatDate(user.lastLogin) : '从未登录'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => openUserModal(user)}
                              className={`px-3 py-1 rounded ${
                                theme === 'dark' 
                                  ? 'bg-blue-700/80 hover:bg-blue-600 text-blue-200' 
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                              } transition-colors`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={user.id === currentUser?.id}
                            >
                              编辑
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteUser(user.id)}
                              className={`px-3 py-1 rounded ${
                                theme === 'dark' 
                                  ? 'bg-red-700/80 hover:bg-red-600 text-red-200' 
                                  : 'bg-red-100 hover:bg-red-200 text-red-800'
                              } transition-colors`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={user.id === currentUser?.id}
                            >
                              删除
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          
          {/* 支付管理选项卡 */}
          {selectedTab === 'payment' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">支付方式管理</h2>
                <motion.button
                  onClick={openPaymentModal}
                  className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-100 hover:bg-green-200'} text-green-800 dark:text-green-200 font-medium transition-colors flex items-center`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fa-solid fa-plus mr-2"></i>
                  添加支付方式
                </motion.button>
              </div>
              
              {/* 支付方式列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentConfigs.map((payment) => (
                  <motion.div
                    key={payment.id}
                    className={`p-4 rounded-xl border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    } shadow-md hover:shadow-lg transition-all relative`}
                    whileHover={{ scale: 1.02 }}
                  >
                    {!payment.enabled && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        已禁用
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full ${
                          payment.type === 'alipay' 
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                            : payment.type === 'wechat' 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                        } flex items-center justify-center text-xl mr-3`}>
                          {payment.type === 'alipay' ? (
                            <i className="fa-brands fa-alipay"></i>
                          ) : payment.type === 'wechat' ? (
                            <i className="fa-brands fa-weixin"></i>
                          ) : (
                            <i className="fa-solid fa-credit-card"></i>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{payment.name}</h4>
                          <div className="text-xs opacity-70 mt-1">
                            {payment.type === 'alipay' ? '支付宝支付' : payment.type === 'wechat' ? '微信支付' : '在线支付'}
                          </div>
                        </div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={payment.enabled} 
                          className="sr-only peer"
                          onChange={(e) => {
                            const updatedConfigs = paymentConfigs.map(config => 
                              config.id === payment.id 
                                ? { ...config, enabled: e.target.checked } 
                                : config
                            );
                            setPaymentConfigs(updatedConfigs);
                            localStorage.setItem('paymentConfigs', JSON.stringify(updatedConfigs));
                          }}
                        />
                        <div className={`w-9 h-5 ${payment.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 relative`}></div>
                      </label>
                    </div>
                    
                    <div className="text-sm opacity-70 mb-3 line-clamp-1">
                      {payment.description}
                    </div>
                    
                    <div className="flex justify-end">
                      <motion.button
                        onClick={() => openPaymentModal(payment)}
                        className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-900/50 hover:bg-blue-900 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'} transition-colors`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* 系统设置选项卡 */}
          {selectedTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            >
              <h2 className="text-xl font-bold mb-6">系统设置</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI模型设置 */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="text-lg font-bold mb-4">AI模型设置</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">扣子大模型 API 密钥</label>
                      <input
                        type="password"
                        placeholder="请输入API密钥"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                      />
                      <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        设置扣子大模型的API密钥，用于生成高质量对联
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">百度文心一言 API 密钥</label>
                      <input
                        type="password"
                        placeholder="请输入API密钥"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                      />
                      <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        设置百度文心一言的API密钥，可作为免费备选模型
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">阿里通义千问 API 密钥</label>
                      <input
                        type="password"
                        placeholder="请输入API密钥"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                      />
                      <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        设置阿里通义千问的API密钥，可作为免费备选模型
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 系统配置 */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="text-lg font-bold mb-4">系统配置</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">默认对联长度</label>
                      <select className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}>
                        <option value="5">五言</option>
                        <option value="7" selected>七言</option>
                        <option value="9">九言</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">默认生成模型</label>
                      <select className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}>
                        <option value="mock">本地模板</option>
                        <option value="ernie">百度文心一言</option>
                        <option value="tongyi">阿里通义千问</option>
                        <option value="doubao">豆包</option>
                        <option value="spark">讯飞星火</option>
                        <option value="kouzi" selected>扣子大模型</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">历史记录保存数量</label>
                      <input
                        type="number"
                        defaultValue="10"
                        min="1"
                        max="100"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 保存按钮 */}
                <div className="lg:col-span-2 flex justify-end mt-4">
                  <motion.button
                    className={`px-6 py-3 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white font-medium flex items-center transition-colors`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <i className="fa-solid fa-save mr-2"></i>
                    保存设置
                  </motion.button>
                </div>

               {/* 用户增长统计 */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md lg:col-span-2`}>
                  <h2 className="text-xl font-bold mb-6">用户增长趋势</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={userGrowthData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <Tooltip 
                          formatter={(value) => [`${value}人`, '用户数']}
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Line type="monotone" dataKey="users" stroke="#4ECDC4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* 第三方平台配置 */}
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md lg:col-span-2`}>
                  <h2 className="text-xl font-bold mb-6">第三方平台配置</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 淘宝配置 */}
                    <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-red-50'}`}>
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <i className="fa-brands fa-alipay text-red-500 mr-2"></i>
                        淘宝小店配置
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="taobaoEnabled"
                            defaultChecked={true}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="taobaoEnabled" className="ml-2">启用淘宝小店下单</label>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">店铺ID</label>
                          <input
                            type="text"
                            placeholder="请输入淘宝店铺ID"
                            defaultValue="shop12345678"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">商品ID</label>
                          <input
                            type="text"
                            placeholder="请输入淘宝商品ID"
                            defaultValue="item87654321"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">二维码图片URL</label>
                          <input
                            type="text"
                            placeholder="请输入淘宝店铺二维码图片URL"
                            defaultValue="https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=taobao%20qr%20code%20for%20shopping&sign=fdd4ae1d505ac8248d6aeace7145af87"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* 抖音配置 */}
                    <div className={`p-5 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <i className="fa-brands fa-tiktok text-black dark:text-white mr-2"></i>
                        抖音小店配置
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="douyinEnabled"
                            defaultChecked={true}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="douyinEnabled" className="ml-2">启用抖音小店下单</label>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">店铺ID</label>
                          <input
                            type="text"
                            placeholder="请输入抖音店铺ID"
                            defaultValue="dy12345678"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">商品ID</label>
                          <input
                            type="text"
                            placeholder="请输入抖音商品ID"
                            defaultValue="prod87654321"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">二维码图片URL</label>
                          <input
                            type="text"
                            placeholder="请输入抖音店铺二维码图片URL"
                            defaultValue="https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=douyin%20qr%20code%20for%20shopping&sign=a9186a32790ec8dbcbefbc5ade686e9c"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <motion.button
                      className={`px-6 py-3 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white font-medium flex items-center transition-colors`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <i className="fa-solid fa-save mr-2"></i>
                      保存平台配置
                    </motion.button>
                  </div>
                </div>
               </div>
             </motion.div>
           )}
           
            {/* 样式图片管理选项卡 */}
            {selectedTab === 'styleImages' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}
              >
                <h2 className="text-xl font-bold mb-6">样式图片管理</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 左侧：上传和预览 */}
                  <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} lg:col-span-1`}>
                    <h3 className="text-lg font-bold mb-4">上传新样式</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">样式名称</label>
                        <input
                          type="text"
                          placeholder="请输入样式名称"
                          value={newStyle.name}
                          onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">额外价格</label>
                        <input
                          type="number"
                          placeholder="请输入额外价格（元）"
                          value={newStyle.price}
                          onChange={(e) => setNewStyle({ ...newStyle, price: parseFloat(e.target.value) || 0 })}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">上传图片</label>
                        <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                          theme === 'dark' 
                            ? 'border-gray-600 hover:border-red-500' 
                            : 'border-gray-300 hover:border-red-500'
                        }`}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            id="image-upload" 
                            onChange={handleImageUpload}
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            {newStyle.imagePreview ? (
                              <div className="mb-2">
                                <img 
                                  src={newStyle.imagePreview} 
                                  alt="预览" 
                                  className="max-h-40 object-contain mx-auto rounded"
                                />
                              </div>
                            ) : (
                              <div className="text-3xl mb-2 text-gray-400">
                                <i className="fa-solid fa-cloud-arrow-up"></i>
                              </div>
                            )}
                            <p className="text-sm">点击上传或拖拽图片到此处</p>
                            <p className="text-xs mt-1 opacity-70">支持 JPG, PNG, WebP 格式，建议尺寸 300x300px</p>
                          </label>
                        </div>
                      </div>
                      
                      <motion.button
                        className={`w-full px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'} text-white font-medium transition-colors flex items-center justify-center`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={saveStyle}
                      >
                        <i className="fa-solid fa-check mr-2"></i>
                        保存样式
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* 右侧：样式列表 */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-bold mb-4">现有样式</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {styleImages.map((style) => (
                        <motion.div
                          key={style.id}
                          className={`p-4 rounded-xl border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          } shadow-md hover:shadow-lg transition-all relative`}
                          whileHover={{ scale: 1.02 }}
                        >
                          {!style.isActive && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              已禁用
                            </div>
                          )}
                          
                          <div className="aspect-square mb-3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                            <img 
                              src={style.previewUrl} 
                              alt={style.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{style.name}</h4>
                            <span className={`text-sm font-bold ${style.price > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              {style.price > 0 ? `+¥${style.price.toFixed(2)}` : '默认'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={style.isActive} 
                                className="sr-only peer"
                                onChange={() => toggleStyleStatus(style.id)}
                              />
                              <div className={`w-9 h-5 ${style.isActive ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 relative`}></div>
                              <span className="ml-2 text-sm">{style.isActive ? '启用' : '禁用'}</span>
                            </label>
                            
                            <div className="flex space-x-2">
                              <button 
                                className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-900/50 hover:bg-blue-900 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'} transition-colors`}
                                onClick={() => editStyle(style)}
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>
                              <button 
                                className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-red-900/50 hover:bg-red-900 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-800'} transition-colors`}
                                onClick={() => deleteStyle(style.id)}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="mt-6 text-center">
                      <motion.button
                        className={`px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                            : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                        } font-medium transition-colors`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={exportStyles}
                      >
                        <i className="fa-solid fa-download mr-2"></i>
                        导出样式配置
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </main>

        {/* 页脚 */}
        {/* 商品编辑模态框 */}
        <AnimatePresence>
          {isProductModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4"
              onClick={closeProductModal}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className={`w-full max-w-md rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-2xl overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 border-b border-gray-700 dark:border-gray-700">
                  <h3 className="text-lg font-bold">{editingProduct ? '编辑商品' : '添加新商品'}</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">商品名称 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={newProduct.name || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                        placeholder="请输入商品名称"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">价格 <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProduct.price || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                        placeholder="请输入商品价格"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">描述</label>
                      <textarea
                        value={newProduct.description || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none min-h-[100px]`}
                        placeholder="请输入商品描述"
                      />
                    </div>
                    
                   <div>
                     <label className="block text-sm font-medium mb-1">状态</label>
                     <select
                       value={newProduct.status || 'active'}
                       onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as ProductStatus })}
                       className={`w-full px-4 py-2 rounded-lg border ${
                         theme === 'dark' 
                           ? 'bg-gray-700 border-gray-600 text-white' 
                           : 'bg-white border-gray-300 text-gray-900'
                       } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                     >
                       <option value="active">上架</option>
                       <option value="inactive">下架</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium mb-1">商品样式</label>
                     <select
                       value={newProduct.styleId || ''}
                       onChange={(e) => setNewProduct({ ...newProduct, styleId: e.target.value })}
                       className={`w-full px-4 py-2 rounded-lg border ${
                         theme === 'dark' 
                           ? 'bg-gray-700 border-gray-600 text-white' 
                           : 'bg-white border-gray-300 text-gray-900'
                       } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                     >
                       <option value="">无特定样式</option>
                       {styleImages.map(style => (
                         <option key={style.id} value={style.id}>
                           {style.name} {style.price > 0 ? `(+¥${style.price.toFixed(2)})` : ''}
                         </option>
                       ))}
                     </select>
                   </div>
                  </div>
                </div>
                <div className="p-5 border-t border-gray-700 dark:border-gray-700 flex justify-end space-x-3">
                  <motion.button
                    onClick={closeProductModal}
                    className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    onClick={saveProduct}
                    className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    保存
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 样式图片编辑模态框 */}
        <AnimatePresence>
          {isStyleModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4"
              onClick={closeStyleModal}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className={`w-full max-w-md rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-2xl overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 border-b border-gray-700 dark:border-gray-700">
                  <h3 className="text-lg font-bold">编辑样式</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">样式名称 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={editingStyle?.name || ''}
                        onChange={(e) => {
                          if (editingStyle) {
                            setEditingStyle({ ...editingStyle, name: e.target.value });
                          }
                        }}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                        placeholder="请输入样式名称"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">额外价格</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingStyle?.price || 0}
                        onChange={(e) => {
                          if (editingStyle) {
                            setEditingStyle({ ...editingStyle, price: parseFloat(e.target.value) || 0 });
                          }
                        }}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                        placeholder="请输入额外价格"
                      />
             </div>
            
            {/* 修改密码模态框 */}
            <AnimatePresence>
              {isPasswordModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className={`w-full max-w-md rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-2xl overflow-hidden`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5 border-b border-gray-700 dark:border-gray-700">
                      <h3 className="text-lg font-bold">修改密码</h3>
                    </div>
                    <div className="p-5">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">当前密码 <span className="text-red-500">*</span></label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                            placeholder="请输入当前密码"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">新密码 <span className="text-red-500">*</span></label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                            placeholder="请输入新密码"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">确认新密码 <span className="text-red-500">*</span></label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                            placeholder="请再次输入新密码"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-5 border-t border-gray-700 dark:border-gray-700 flex justify-end space-x-3">
                      <motion.button
                        onClick={() => setIsPasswordModalOpen(false)}
                        className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        取消
                      </motion.button>
                      <motion.button
                        onClick={handleChangePassword}
                        className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        确认修改
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* 用户管理模态框 */}
            <AnimatePresence>
              {isUserModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4"
                  onClick={closeUserModal}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className={`w-full max-w-md rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-2xl overflow-hidden`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5 border-b border-gray-700 dark:border-gray-700">
                      <h3 className="text-lg font-bold">{editingUser ? '编辑用户' : '添加新用户'}</h3>
                    </div>
                    <div className="p-5">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">用户名 <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                            placeholder="请输入用户名"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {editingUser ? '新密码（留空不修改）' : '密码 <span className="text-red-500">*</span>'}
                          </label>
                          <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                            placeholder="请输入密码"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">角色</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'editor' })}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none`}
                          >
                            <option value="editor">编辑</option>
                            <option value="admin">超级管理员</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 border-t border-gray-700 dark:border-gray-700 flex justify-end space-x-3">
                      <motion.button
                        onClick={closeUserModal}
                        className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        取消
                      </motion.button>
                      <motion.button
                        onClick={handleSaveUser}
                        className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        保存
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
              {/* 支付配置模态框 */}
             <AnimatePresence>
               {isPaymentModalOpen && (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4"
                   onClick={closePaymentModal}
                 >
                   <motion.div
                     initial={{ scale: 0.9, y: 20 }}
                     animate={{ scale: 1, y: 0 }}
                     exit={{ scale: 0.9, y: 20 }}
                     className={`w-full max-w-lg rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-2xl overflow-hidden`}
                     onClick={(e) => e.stopPropagation()}
                   >
                     <div className="p-5 border-b border-gray-700 dark:border-gray-700">
                       <h3 className="text-lg font-bold">{editingPayment ? '编辑支付配置' : '添加支付方式'}</h3>
                     </div>
                     <div className="p-5 max-h-[70vh] overflow-y-auto">
                       <div className="space-y-4">
                         <div>
                           <label className="block text-sm font-medium mb-1">支付方式名称 <span className="text-red-500">*</span></label>
                           <input
                             type="text"
                             value={newPaymentConfig.name || ''}
                             onChange={(e) => setNewPaymentConfig({ ...newPaymentConfig, name: e.target.value })}
                             className={`w-full px-4 py-2 rounded-lg border ${
                               theme === 'dark' 
                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                             } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none`}
                             placeholder="请输入支付方式名称"
                           />
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium mb-1">支付类型 <span className="text-red-500">*</span></label>
                           <select
                             value={newPaymentConfig.type || 'alipay'}
                             onChange={(e) => setNewPaymentConfig({ ...newPaymentConfig, type: e.target.value as 'alipay' | 'wechat' | 'online' })}
                             className={`w-full px-4 py-2 rounded-lg border ${
                               theme === 'dark' 
                                 ? 'bg-gray-700 border-gray-600 text-white' 
                                 : 'bg-white border-gray-300 text-gray-900'
                             } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none`}
                           >
                             <option value="alipay">支付宝支付</option>
                             <option value="wechat">微信支付</option>
                             <option value="online">在线支付</option>
                           </select>
                         </div>
                        
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={newPaymentConfig.enabled} 
                            className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            onChange={(e) => setNewPaymentConfig({ ...newPaymentConfig, enabled: e.target.checked })}
                          />
                          <label className="ml-2">启用此支付方式</label>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">描述</label>
                          <textarea
                            value={newPaymentConfig.description}
                            onChange={(e) => setNewPaymentConfig({ ...newPaymentConfig, description: e.target.value })}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none min-h-[80px]`}
                            placeholder="请输入支付方式描述"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">配置参数</label>
                          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm font-mono">
                            <pre>{JSON.stringify(newPaymentConfig.config, null, 2)}</pre>
                          </div>
                          <p className="text-xs opacity-70 mt-2">在实际项目中，这里应该提供更友好的配置表单</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 border-t border-gray-700 dark:border-gray-700 flex justify-end space-x-3">
                      <motion.button
                        onClick={closePaymentModal}
                        className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        取消
                      </motion.button>
                      <motion.button
                        onClick={handleSavePaymentConfig}
                        className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        保存
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">上传新图片</label>
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'border-gray-600 hover:border-red-500' 
                          : 'border-gray-300 hover:border-red-500'
                      }`}>
                       <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          id="edit-image-upload"
                          onChange={(e) => {
                            if (editingStyle && e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const previewUrl = URL.createObjectURL(file);
                              setEditingStyle({ ...editingStyle, previewUrl });
                              setEditingStyleFile(file);
                            }
                          }}
                        />
                        <label htmlFor="edit-image-upload" className="cursor-pointer">
                          {editingStyle?.imagePreview ? (
                            <div className="mb-2">
                              <img 
                                src={editingStyle.imagePreview} 
                                alt="预览" 
                                className="max-h-40 object-contain mx-auto rounded"
                              />
                            </div>
                          ) : editingStyle?.previewUrl ? (
                            <div className="mb-2">
                              <img 
                                src={editingStyle.previewUrl} 
                                alt="当前图片" 
                                className="max-h-40 object-contain mx-auto rounded"
                              />
                            </div>
                          ) : (
                            <div className="text-3xl mb-2 text-gray-400">
                              <i className="fa-solid fa-cloud-arrow-up"></i>
                            </div>
                          )}
                          <p className="text-sm">点击上传新图片</p>
                          <p className="text-xs mt-1 opacity-70">支持 JPG, PNG, WebP 格式</p>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editingStyle?.isActive || false}
                          onChange={(e) => {
                            if (editingStyle) {
                              setEditingStyle({ ...editingStyle, isActive: e.target.checked });
                            }
                          }}
                          className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm">启用此样式</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-gray-700 dark:border-gray-700 flex justify-end space-x-3">
                  <motion.button
                    onClick={closeStyleModal}
                    className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    onClick={updateStyle}
                    className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    保存
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      <footer className={`mt-12 py-6 border-t ${theme === 'dark' ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} 个性对联定制商城 - 后台管理系统</p>
        </div>
      </footer>
    </div>
  );
}