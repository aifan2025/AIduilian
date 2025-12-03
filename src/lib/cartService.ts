// 购物车服务
import { CartItem, Order, ShippingInfo } from './types';

// 本地存储键名
const CART_STORAGE_KEY = 'couplet_cart';
const ORDERS_STORAGE_KEY = 'couplet_orders';

// 获取购物车
export const getCart = (): CartItem[] => {
  try {
    const cartStr = localStorage.getItem(CART_STORAGE_KEY);
    return cartStr ? JSON.parse(cartStr) : [];
  } catch (error) {
    console.error('获取购物车失败:', error);
    return [];
  }
};

// 添加到购物车
export const addToCart = (item: Omit<CartItem, 'id' | 'timestamp'>): void => {
  try {
    const cart = getCart();
    const newItem: CartItem = {
      ...item,
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    cart.push(newItem);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('添加到购物车失败:', error);
    throw new Error('添加到购物车失败');
  }
};

// 从购物车移除
export const removeFromCart = (id: string): void => {
  try {
    const cart = getCart();
    const filteredCart = cart.filter(item => item.id !== id);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filteredCart));
  } catch (error) {
    console.error('从购物车移除失败:', error);
    throw new Error('从购物车移除失败');
  }
};

// 清空购物车
export const clearCart = (): void => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('清空购物车失败:', error);
    throw new Error('清空购物车失败');
  }
};

// 获取订单列表
export const getOrders = (): Order[] => {
  try {
    const ordersStr = localStorage.getItem(ORDERS_STORAGE_KEY);
    return ordersStr ? JSON.parse(ordersStr) : [];
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return [];
  }
};

// 创建订单
export const createOrder = (items: CartItem[], shippingInfo: ShippingInfo, totalPrice: number): Order => {
  try {
    const orders = getOrders();
       // 生成包含日期时间的订单编号
       const now = new Date();
       const dateStr = now.toISOString().replace(/[-:.]/g, '').slice(0, 14); // 格式: YYYYMMDDHHmmss
       const order: Order = {
        id: `order_${dateStr}_${Math.random().toString(36).substr(2, 6)}`,
        items,
        shippingInfo,
        totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'pending'
    };
    orders.unshift(order);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return order;
  } catch (error) {
    console.error('创建订单失败:', error);
    throw new Error('创建订单失败');
  }
};

// 更新订单状态
export const updateOrderStatus = (orderId: string, status: Order['status']): void => {
  try {
    const orders = getOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      orders[orderIndex].updatedAt = new Date().toISOString();
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  } catch (error) {
    console.error('更新订单状态失败:', error);
    throw new Error('更新订单状态失败');
  }
};

  // 模拟支付
  export const simulatePayment = (orderId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // 模拟支付过程，2秒后返回成功
      setTimeout(() => {
        try {
          const orders = getOrders();
          const orderIndex = orders.findIndex(order => order.id === orderId);
          if (orderIndex !== -1) {
            orders[orderIndex].paymentStatus = 'paid';
            orders[orderIndex].status = 'processing';
            orders[orderIndex].paymentTime = new Date().toISOString();
            orders[orderIndex].transactionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            orders[orderIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (error) {
          console.error('支付模拟失败:', error);
          resolve(false);
        }
      }, 2000);
    });
  };