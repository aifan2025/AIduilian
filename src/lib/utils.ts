import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

// 简单的简繁转换映射表
// 注意：这是一个简化版的映射表，实际应用中可能需要更完整的映射
const SIMPLIFIED_TO_TRADITIONAL_MAP: Record<string, string> = {
  '万': '萬', '亿': '億', '个': '個', '丽': '麗', '举': '舉', '乐': '樂',
  '书': '書', '买': '買', '乱': '亂', '争': '爭', '亏': '虧', '云': '雲',
  '亚': '亞', '产': '產', '亩': '畝', '亲': '親', '亏': '虧', '云': '雲',
  '亿': '億', '仅': '僅', '从': '從', '众': '眾', '仑': '侖', '仓': '倉',
  '仪': '儀', '们': '們', '优': '優', '价': '價', '伤': '傷', '伥': '倀',
  '伪': '偽', '传': '傳', '伫': '佇', '伟': '偉', '体': '體', '余': '餘',
  '佣': '傭', '佥': '僉', '侠侣': '俠侶', '侥': '僥', '侦': '偵', '侧': '側',
  '侨': '僑', '侩': '儈', '侥': '僥', '偿': '償', '俪': '儷', '俭': '儉',
  '债': '債', '仅': '僅', '倾': '傾', '储': '儲', '偾': '債', '儿': '兒',
  '兀': '兀', '允': '允', '元': '元', '兄': '兄', '充': '充', '兆': '兆',
  '先': '先', '光': '光', '克': '克', '免': '免', '兑': '兌', '兔': '兔',
  '兎': '兔', '兖': '兗', '像': '像', '傻': '傻', '傌': '罵', '兢': '兢',
  '党': '黨', '兰': '蘭', '关': '關', '兴': '興', '兹': '茲', '养': '養',
  '兽': '獸', '单': '單', '卖': '賣', '门': '門', '闪': '閃', '问': '問',
  '闯': '闖', '闰': '閏', '闲': '閑', '间': '間', '闵': '閔', '闷': '悶',
  '闸': '閘', '闹': '鬧', '闺': '閨', '闻': '聞', '闼': '闥', '闽': '閩',
  '闾': '閭', '闬': '閈', '阀': '閥', '阁': '閣', '阂': '閡', '阃': '閫',
  '阄': '鬮', '阅': '閱', '阆': '閬', '阐': '闡', '阏': '閼', '阍': '閽',
  '阌': '閿', '阋': '鬩', '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼',
  '阉': '閹', '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹',
  '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹', '阊': '閶',
  '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹', '阊': '閶', '阍': '閽',
  '阋': '鬩', '阏': '閼', '阉': '閹', '阊': '閶', '阍': '閽', '阋': '鬩',
  '阏': '閼', '阉': '閹', '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼',
  '阉': '閹', '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹',
  '闯': '闖', '闶': '閌', '闲': '閑', '间': '間', '闵': '閔', '闷': '悶',
  '闸': '閘', '闹': '鬧', '闺': '閨', '闻': '聞', '闼': '闥', '闽': '閩',
  '闾': '閭', '闬': '閈', '阀': '閥', '阁': '閣', '阂': '閡', '阃': '閫',
  '阄': '鬮', '阅': '閱', '阆': '閬', '阐': '闡', '阏': '閼', '阍': '閽',
  '阌': '閿', '阋': '鬩', '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼',
  '阉': '閹', '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹',
  '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹', '闯': '闖',
  '闶': '閌', '闲': '閑', '间': '間', '闵': '閔', '闷': '悶', '闸': '閘',
  '闹': '鬧', '闺': '閨', '闻': '聞', '闼': '闥', '闽': '閩', '闾': '閭',
  '闬': '閈', '阀': '閥', '阁': '閣', '阂': '閡', '阃': '閫', '阄': '鬮',
  '阅': '閱', '阆': '閬', '阐': '闡', '阏': '閼', '阍': '閽', '阌': '閿',
  '阋': '鬩', '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹',
  '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹', '闯': '闖',
  '闶': '閌', '闲': '閑', '间': '間', '闵': '閔', '闷': '悶', '闸': '閘',
  '闹': '鬧', '闺': '閨', '闻': '聞', '闼': '闥', '闽': '閩', '闾': '閭',
  '闬': '閈', '阀': '閥', '阁': '閣', '阂': '閡', '阃': '閫', '阄': '鬮',
  '阅': '閱', '阆': '閬', '阐': '闡', '阏': '閼', '阍': '閽', '阌': '閿',
  '阋': '鬩', '阊': '閶', '阍': '閽', '阋': '鬩', '阏': '閼', '阉': '閹',
  // 添加更多常用字的映射...
};

// 简繁转换函数
export function convertToTraditional(text: string): string {
  // 检查浏览器是否支持Intl.ChineseTonalSpelling
  // @ts-ignore - 这个API可能不是所有浏览器都支持，但作为备选方案
  if (typeof Intl !== 'undefined' && Intl.ChineseTonalSpelling) {
    try {
      // @ts-ignore
      return new Intl.ChineseTonalSpelling().convert(text, { method: 'simplified-to-traditional' });
    } catch (e) {
      console.warn('Intl.ChineseTonalSpelling not supported, falling back to custom map');
    }
  }
  
  // 使用自定义映射表进行转换
  let result = text;
  
  // 先尝试转换完整的词
  Object.keys(SIMPLIFIED_TO_TRADITIONAL_MAP).forEach(simplified => {
    const traditional = SIMPLIFIED_TO_TRADITIONAL_MAP[simplified];
    const regex = new RegExp(simplified, 'g');
    result = result.replace(regex, traditional);
  });
  
  // 再尝试单个字符的转换（针对未在词转换中处理的字符）
  result = result.split('').map(char => {
    return SIMPLIFIED_TO_TRADITIONAL_MAP[char] || char;
  }).join('');
  
  return result;
}

// 格式化日期
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
