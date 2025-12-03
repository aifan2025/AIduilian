// 模拟数据
import { SizeOption, StyleOption, PaymentMethodConfig } from './types';

// 对联大小选项
export const sizeOptions: SizeOption[] = [
  {
    id: 'small',
    name: '小号',
    price: 29.9,
    description: '适合室内小门框，尺寸约40x120cm'
  },
  {
    id: 'medium',
    name: '中号',
    price: 49.9,
    description: '适合标准门框，尺寸约50x150cm'
  },
  {
    id: 'large',
    name: '大号',
    price: 79.9,
    description: '适合大门框，尺寸约60x180cm'
  },
  {
    id: 'custom',
    name: '定制尺寸',
    price: 99.9,
    description: '联系客服定制特殊尺寸'
  }
];

// 对联样式选项
export const styleOptions: StyleOption[] = [
  {
    id: 'classic',
    name: '经典红底',
    price: 0,
    previewUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=traditional%20chinese%20couplet%20red%20background%20gold%20characters&sign=5514e5d4e7b15dad9352f04b75f55fbf'
  },
  {
    id: 'golden',
    name: '金边装饰',
    price: 19.9,
    previewUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=chinese%20couplet%20with%20golden%20border%20decoration&sign=1ebd71c343f286d9cb16ce82a38ba9e6'
  },
  {
    id: 'calligraphy',
    name: '名家书法',
    price: 29.9,
    previewUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=chinese%20calligraphy%20couplet%20art%20style&sign=3e7699a419bd3cf4e7eceebb86c4b692'
  },
  {
    id: 'antique',
    name: '古风卷轴',
    price: 39.9,
    previewUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=ancient%20chinese%20scroll%20style%20couplet&sign=b175041775eec3a68c4649534e5f1e29'
  }
];

// 省份数据
export const provinces = [
  '北京市', '上海市', '广东省', '江苏省', '浙江省', '四川省', '山东省', 
  '河南省', '湖北省', '湖南省', '福建省', '河北省', '安徽省', '陕西省', 
  '重庆市', '山西省', '云南省', '辽宁省', '江西省', '广西壮族自治区', 
  '黑龙江省', '吉林省', '贵州省', '内蒙古自治区', '天津市', '新疆维吾尔自治区', 
  '甘肃省', '海南省', '宁夏回族自治区', '青海省', '西藏自治区', '台湾省', 
  '香港特别行政区', '澳门特别行政区'
];

// 支付方式配置
export const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'alipay',
    name: '支付宝支付',
    enabled: true,
    type: 'alipay',
    config: {
      appId: '2021000116685919',
      gatewayUrl: 'https://openapi.alipaydev.com/gateway.do',
      merchantPrivateKey: '私钥示例',
      alipayPublicKey: '公钥示例'
    },
    description: '通过支付宝进行在线支付'
  },
  {
    id: 'wechat',
    name: '微信支付',
    enabled: true,
    type: 'wechat',
    config: {
      appId: 'wx8888888888888888',
      mchId: '1888888888',
      apiKey: '88888888888888888888888888888888',
      notifyUrl: 'https://your-server.com/api/pay/notify'
    },
    description: '通过微信进行在线支付'
  }
];