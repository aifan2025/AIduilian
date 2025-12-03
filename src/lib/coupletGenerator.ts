// 定义对联结果接口
export interface CoupletResult {
  top: string;
  bottom: string;
  center: string;
  explanation: string;
}

// 导入扣子大模型和免费大模型
import { defaultKouZiModel, KouZiModel } from './kouziModel';
import { defaultFreeLLMManager } from './freeLLMModels';
import { toast } from 'sonner';

// 模拟AI生成对联的函数（使用mock数据）
function generateMockCouplet(
  name1: string, 
  name2: string = "", 
  occasion: string, 
  length: number = 7,
  otherRequirements: string = ""
): CoupletResult {
  // 这里使用模拟数据，当AI调用失败时使用
  const mockCouplets: Record<string, CoupletResult[]> = {
    "春节": [
      {
        top: `${name1}灯结彩迎新岁`,
        bottom: name2 ? `${name2}语欢歌贺吉年` : "喜气盈门贺吉年",
        center: "新春快乐",
        explanation: "上联以姓名开头，表达节日喜庆氛围；下联呼应上联，共同传递新春祝福。"
      },
      {
        top: `${name1}门焕彩添祥瑞`,
        bottom: name2 ? `${name2}宅生辉纳福康` : "福宅生辉纳福康",
        center: "吉祥如意",
        explanation: "上下联对仗工整，描绘了春节期间家家户户焕然一新、迎接福气的景象。"
      }
    ],
    "结婚": [
      {
        top: `${name1}府呈祥鸾凤舞`,
        bottom: name2 ? `${name2}门集庆燕莺歌` : "喜门集庆燕莺歌",
        center: "百年好合",
        explanation: "此联以喜庆的语言祝福新人，鸾凤和燕莺象征夫妻和谐美满。"
      },
      {
        top: `${name1}家有喜结连理`,
        bottom: name2 ? `${name2}宅添福成佳偶` : "福宅添福成佳偶",
        center: "永结同心",
        explanation: "对联表达了对新人喜结良缘的美好祝福，寓意婚姻长久美满。"
      }
    ],
    "祝寿": [
      {
        top: `${name1}松永翠春常在`,
        bottom: name2 ? `${name2}鹤长鸣福无疆` : "福鹤长鸣福无疆",
        center: "寿比南山",
        explanation: "对联以松柏和仙鹤为喻，祝福寿星健康长寿，福气绵绵。"
      },
      {
        top: `${name1}岁高龄添百福`,
        bottom: name2 ? `${name2}年益寿纳千祥` : "寿年益寿纳千祥",
        center: "福禄寿喜",
        explanation: "上下联对仗工整，表达了对寿星健康长寿、多福多寿的美好祝愿。"
      }
    ],
    "乔迁": [
      {
        top: `${name1}居焕彩财源广`,
        bottom: name2 ? `${name2}宅生辉福运长` : "福宅生辉福运长",
        center: "乔迁之喜",
        explanation: "对联祝贺乔迁新居，同时祝福新居带来财运和好运。"
      },
      {
        top: `${name1}门旭日临吉宅`,
        bottom: name2 ? `${name2}院春风入华堂` : "福院春风入华堂",
        center: "吉祥如意",
        explanation: "此联描绘了新居在阳光和春风中的生机景象，寓意吉祥如意。"
      }
    ],
    "开业": [
      {
        top: `${name1}开伟业财源广`,
        bottom: name2 ? `${name2}启宏图生意隆` : "喜启宏图生意隆",
        center: "开业大吉",
        explanation: "对联祝贺开业之喜，同时祝愿生意兴隆，财源广进。"
      },
      {
        top: `${name1}门旭日财源广`,
        bottom: name2 ? `${name2}店春风顾客多` : "福店春风顾客多",
        center: "财源广进",
        explanation: "此联以旭日和春风为喻，祝愿店铺生意红火，顾客盈门。"
      }
    ],
    "搞笑": [
      {
        top: `${name1}氏有才长得帅`,
        bottom: name2 ? `${name2}家多金还可爱` : "全家多金还可爱",
        center: "人生赢家",
        explanation: "幽默风趣的对联，调侃中带有赞美，增添欢乐气氛。"
      },
      {
        top: `${name1}吃海喝不长胖`,
        bottom: name2 ? `${name2}玩大闹没烦恼` : "玩闹没烦恼",
        center: "快乐至上",
        explanation: "轻松幽默的对联，表达了一种洒脱、快乐的生活态度。"
      }
    ]
  };
  
  // 获取对应场景的对联，如果没有则使用通用对联
  const couplets = mockCouplets[occasion] || mockCouplets["春节"];
  
  // 随机选择一副对联
  const randomIndex = Math.floor(Math.random() * couplets.length);
  const selectedCouplet = { ...couplets[randomIndex] };
  
  // 处理其它要求
  let finalCouplet = { ...selectedCouplet };
  
  // 如果有其它要求，可以在这里根据要求调整对联
  if (otherRequirements) {
    finalCouplet = {
      ...finalCouplet,
      explanation: `${finalCouplet.explanation} 根据您的特殊要求，对联特别融入了您的个性化期望。`
    };
  }
  
  return finalCouplet;
}

// 模型类型枚举
export type ModelType = 'kouzi' | 'ernie' | 'tongyi' | 'doubao' | 'spark' | 'deepseek' | 'mock';

// 生成对联的主函数（支持多种大模型）
export async function generateCouplet(
  name1: string, 
  name2: string = "", 
  occasion: string, 
  length: number = 7,
  otherRequirements: string = "",
  modelType: ModelType = 'mock', // 默认使用mock数据
  apiKey?: string,
  modelConfig?: any
): Promise<CoupletResult> {
  // 模型选择现在统一在后台管理，这里使用默认模型策略
  // 1. 尝试使用DeepSeek模型（默认首选）
  try {
    const aiResult = await generateCoupletWithFreeModel(name1, name2, occasion, length, otherRequirements);
    return aiResult;
  } catch (error) {
    console.warn('免费大模型调用失败，将使用模拟数据:', error);
    toast.warning('AI模型暂时不可用，使用本地模板生成对联');
    // 回退到mock数据
    return generateMockCouplet(name1, name2, occasion, length, otherRequirements);
  }
}

// 尝试使用所有免费大模型的函数（作为备选方案）
async function generateCoupletWithFreeModel(
  name1: string, 
  name2: string = "", 
  occasion: string, 
  length: number = 7,
  otherRequirements: string = ""
): Promise<CoupletResult> {
  // 尝试的免费模型列表（包括DeepSeek）
  const freeModels: ModelType[] = ['deepseek', 'ernie', 'tongyi', 'doubao', 'spark'];
  
  for (const modelType of freeModels) {
    try {
      const modelName = modelType === 'ernie' ? '百度文心一言' : 
                        modelType === 'tongyi' ? '阿里通义千问' : 
                        modelType === 'doubao' ? '豆包' : '讯飞星火';
      
      // 尝试调用当前免费模型
      const aiResult = await defaultFreeLLMManager.generateCouplet(
        modelType, 
        name1, 
        name2, 
        occasion, 
        length, 
        otherRequirements
      );
      
      // 如果AI返回了有效结果，则使用AI结果
      if (aiResult) {
        toast.success(`使用${modelName}生成对联成功！`);
        return aiResult;
      }
    } catch (error) {
      console.warn(`尝试${modelType}模型失败，继续尝试下一个模型:`, error);
      // 继续尝试下一个模型
      continue;
    }
  }
  
  // 所有免费模型都失败时，使用模拟数据
  toast.warning('所有AI模型暂时不可用，使用本地模板生成对联');
  return generateMockCouplet(name1, name2, occasion, length, otherRequirements);
}

// 获取可用的模型列表
export function getAvailableModels() {
  return [
    { id: 'mock', name: '本地模板', description: '不使用AI，直接使用本地模板生成对联' },
    ...defaultFreeLLMManager.getAvailableModels(),
    { id: 'kouzi', name: '扣子大模型', description: '扣子AI提供的大语言模型，需要API密钥' }
  ];
}

// 存储历史记录
export function saveToHistory(couplet: CoupletResult): void {
  try {
    const history = getHistory();
    history.unshift({
      id: `couplet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...couplet,
      timestamp: new Date().toISOString()
    });
    
    // 只保留最近10条记录
    if (history.length > 10) {
      history.pop();
    }
    
    localStorage.setItem('couplet_history', JSON.stringify(history));
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
}

// 获取历史记录
export function getHistory(): (CoupletResult & { timestamp: string; id: string })[] {
  try {
    const historyStr = localStorage.getItem('couplet_history');
    if (!historyStr) return [];
    
    const history = JSON.parse(historyStr);
    
    // 确保每条记录都有id
    return history.map((item: any, index: number) => ({
      id: item.id || `couplet_migrated_${index}`,
      ...item
    }));
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return [];
  }
}