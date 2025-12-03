// 定义系统中使用的各种类型和接口

// 对联结果接口
export interface CoupletResult {
  top: string;
  bottom: string;
  center: string;
  explanation: string;
}

// 对联大小选项
export interface SizeOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

// 对联样式选项
export interface StyleOption {
  id: string;
  name: string;
  price: number;
  previewUrl: string;
}

// 产品选项
export interface ProductOptions {
  size: SizeOption;
  style: StyleOption;
  quantity: number;
}

// 购物车项
export interface CartItem {
  id: string;
  couplet: CoupletResult;
  options: ProductOptions;
  totalPrice: number;
  timestamp: string;
}

// 收货信息
export interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
}

// 订单状态
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// 订单
export interface Order {
  id: string;
  items: CartItem[];
  shippingInfo: ShippingInfo;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod?: 'alipay' | 'wechat' | 'online'; // 新增支付方式字段
  paymentTime?: string; // 支付时间
  transactionId?: string; // 交易ID
}

// 第三方平台配置
export interface ThirdPartyPlatformConfig {
  id: string;
  name: string;
  enabled: boolean;
  baseUrl: string;
  params: Record<string, string>;
  qrCodeUrl?: string;
  description: string;
}

// 淘宝配置
export interface TaobaoConfig extends ThirdPartyPlatformConfig {
  shopId: string;
  itemId: string;
  alipayQrCodeUrl?: string;
}

// 抖音配置
export interface DouyinConfig extends ThirdPartyPlatformConfig {
  shopId: string;
  productId: string;
  douyinQrCodeUrl?: string;
}

// 管理员用户类型
export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'editor'; // 区分管理员权限
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// 支付方式配置
export interface PaymentMethodConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: 'alipay' | 'wechat' | 'online';
  config: Record<string, string>;
  description: string;
}

// 支付宝配置
export interface AlipayConfig extends PaymentMethodConfig {
  appId: string;
  merchantPrivateKey: string;
  alipayPublicKey: string;
  gatewayUrl: string;
}

// 微信支付配置
export interface WechatPayConfig extends PaymentMethodConfig {
  appId: string;
  mchId: string;
  apiKey: string;
  notifyUrl: string;
}