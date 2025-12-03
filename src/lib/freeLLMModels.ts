// 免费大模型API调用封装
import { toast } from 'sonner';

// 定义通用的大模型响应接口
export interface LLMResponse {
  code: number;
  data?: {
    content?: string;
    result?: string;
    text?: string;
  };
  message?: string;
  error?: string;
}

// 大模型配置接口
export interface LLMConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  appId?: string;
  secretKey?: string;
}

// 免费大模型基类
export abstract class FreeLLMModel {
  protected apiKey: string;
  protected model: string;
  protected baseUrl: string;
  
  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || '';
    this.baseUrl = config.baseUrl || '';
  }
  
  // 生成对联的抽象方法
  abstract generateCouplet(
    name1: string,
    name2: string,
    occasion: string,
    length: number,
    otherRequirements: string
  ): Promise<{
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  } | null>;
  
  // 生成Prompt模板的通用方法
  protected generateCoupletPrompt(
    name1: string,
    name2: string,
    occasion: string,
    length: number,
    otherRequirements: string
  ): string {
    let prompt = `角色设定：你是一位精通中国传统文化的国学大师，擅长撰写对联，讲究对仗工整、平仄合律、意境优美。
    
任务：请根据用户提供的【关键词】和【场景】，创作一副${length}字对联。

输入信息：
类型：藏头联
关键词：${name1}${name2 ? '、' + name2 : ''}
场景：${occasion}
要求：
1. 上联必须以第一个关键词开头，${name2 ? '下联以第二个关键词开头' : ''}。
2. 字数要求：${length}字。
3. 请确保对联对仗工整，平仄协调。
4. 结合指定场景，让对联更贴合情境。`;

    if (otherRequirements) {
      prompt += `\n5. 其他要求：${otherRequirements}`;
    }

    prompt += `\n\n请以JSON格式输出，不要包含任何额外的解释或文字，只需要JSON对象，包含 top (上联), bottom (下联), center (横批), explanation (寓意解释)。\n输出示例：{"top": "...", "bottom": "...", "center": "...", "explanation": "..."}`;

    return prompt;
  }
  
  // 从文本中提取对联内容（备用方法）
  protected extractCoupletFromText(text: string): {
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  } | null {
    try {
      // 简单的正则表达式提取
      const topMatch = text.match(/上联[:：]\s*["']?([^"'\n]+)["']?/);
      const bottomMatch = text.match(/下联[:：]\s*["']?([^"'\n]+)["']?/);
      const centerMatch = text.match(/横批[:：]\s*["']?([^"'\n]+)["']?/);
      const explanationMatch = text.match(/寓意[:：]?\s*["']?([^"'\n]+)["']?/);

      if (topMatch && bottomMatch && centerMatch) {
        return {
          top: topMatch[1].trim(),
          bottom: bottomMatch[1].trim(),
          center: centerMatch[1].trim(),
          explanation: explanationMatch ? explanationMatch[1].trim() : '此对联对仗工整，寓意深远。'
        };
      }

      return null;
    } catch (error) {
      console.error('提取对联内容失败:', error);
      return null;
    }
  }
}

// 百度文心一言模型
export class ERNIEBotModel extends FreeLLMModel {
  constructor(config: LLMConfig) {
    super({
      ...config,
      model: config.model || 'ERNIE-Bot',
      baseUrl: config.baseUrl || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat'
    });
  }
  
  override async generateCouplet(
    name1: string,
    name2: string = "",
    occasion: string,
    length: number = 7,
    otherRequirements: string = ""
  ): Promise<{
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  } | null> {
    try {
      // 构建请求体
      const prompt = this.generateCoupletPrompt(name1, name2, occasion, length, otherRequirements);
      
      const requestBody = {
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      };
      
      // 先获取access_token
      const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error('获取百度API访问令牌失败');
      }
      
      // 发送请求
      const response = await fetch(`${this.baseUrl}/${this.model}?access_token=${tokenData.access_token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // 处理响应
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 解析返回的JSON格式内容
      try {
        const coupletResult = JSON.parse(data.result);
        return coupletResult;
      } catch (jsonError) {
        // 如果返回的不是标准JSON格式，尝试从文本中提取
        toast.warning('文心一言返回格式不规范，正在尝试提取内容...');
        return this.extractCoupletFromText(data.result);
      }
    } catch (error) {
      console.error('调用百度文心一言失败:', error);
      toast.error('调用文心一言失败，请检查API密钥或网络连接');
      return null;
    }
  }
}

// 阿里通义千问模型
export class TongyiQianwenModel extends FreeLLMModel {
  constructor(config: LLMConfig) {
    super({
      ...config,
      model: config.model || 'qwen-turbo',
      baseUrl: config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    });
  }
  
  override async generateCouplet(
    name1: string,
    name2: string = "",
    occasion: string,
    length: number = 7,
    otherRequirements: string = ""
  ): Promise<{
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  } | null> {
    try {
      // 构建请求体
      const prompt = this.generateCoupletPrompt(name1, name2, occasion, length, otherRequirements);
      
      const requestBody = {
        model: this.model,
        input: {
          prompt: prompt
        },
        parameters: {
          temperature: 0.7,
          top_p: 0.95
        }
      };
      
      // 发送请求
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // 处理响应
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 解析返回的JSON格式内容
      try {
        const coupletResult = JSON.parse(data.output.text);
        return coupletResult;
      } catch (jsonError) {
        // 如果返回的不是标准JSON格式，尝试从文本中提取
        toast.warning('通义千问返回格式不规范，正在尝试提取内容...');
        return this.extractCoupletFromText(data.output.text);
      }
    } catch (error) {
      console.error('调用阿里通义千问失败:', error);
      toast.error('调用通义千问失败，请检查API密钥或网络连接');
      return null;
    }
  }
}

// 豆包模型
export class DoubaoModel extends FreeLLMModel {
  constructor(config: LLMConfig) {
    super({
      ...config,
      model: config.model || 'doubao-pro',
      baseUrl: config.baseUrl || 'https://api.doubao.com/chat/completions'
    });
  }
  
  override async generateCouplet(
    name1: string,
    name2: string = "",
    occasion: string,
    length: number = 7,
    otherRequirements: string = ""
  ): Promise<{
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  } | null> {
    try {
      // 构建请求体
      const prompt = this.generateCoupletPrompt(name1, name2, occasion, length, otherRequirements);
      
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      };
      
      // 发送请求
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // 处理响应
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 解析返回的JSON格式内容
      try {
        const coupletResult = JSON.parse(data.choices[0].message.content);
        return coupletResult;
      } catch (jsonError) {
        // 如果返回的不是标准JSON格式，尝试从文本中提取
        toast.warning('豆包返回格式不规范，正在尝试提取内容...');
        return this.extractCoupletFromText(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('调用豆包失败:', error);
      toast.error('调用豆包失败，请检查API密钥或网络连接');
      return null;
    }
  }
}

// 讯飞星火认知大模型
export class SparkModel extends FreeLLMModel {
  private appId: string;
  private apiSecret: string;
  
  constructor(config: LLMConfig) {
    super({
      ...config,
      model: config.model || 'general',
      baseUrl: config.baseUrl || 'https://spark-api.xf-yun.com/v3.5/chat/completions'
    });
    this.appId = config.appId || '';
    this.apiSecret = config.secretKey || '';
  }
  
  // 生成Authorization的方法（讯飞API需要特殊的认证）
  private async generateAuthorization(): Promise<string> {
    // 这里简化处理，实际项目中需要按照讯飞的文档生成正确的Authorization
    // 通常需要使用appId、apiKey和apiSecret生成签名
    return `Bearer ${this.apiKey}`;
  }
  
  override async generateCouplet(
    name1: string,
    name2: string = "",
    occasion: string,
    length: number = 7,
    otherRequirements: string = ""
  ): Promise<{
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  } | null> {
    try {
      // 构建请求体
      const prompt = this.generateCoupletPrompt(name1, name2, occasion, length, otherRequirements);
      
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      };
      
      // 获取授权
      const authorization = await this.generateAuthorization();
      
      // 发送请求
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
          'X-Appid': this.appId
        },
        body: JSON.stringify(requestBody)
      });
      
      // 处理响应
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 解析返回的JSON格式内容
      try {
        const coupletResult = JSON.parse(data.choices[0].message.content);
        return coupletResult;
      } catch (jsonError) {
        // 如果返回的不是标准JSON格式，尝试从文本中提取
        toast.warning('讯飞星火返回格式不规范，正在尝试提取内容...');
        return this.extractCoupletFromText(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('调用讯飞星火失败:', error);
      toast.error('调用讯飞星火失败，请检查API密钥或网络连接');
      return null;
    }
  }
}

// DeepSeek模型
export class DeepSeekModel extends FreeLLMModel {
  constructor(config: LLMConfig) {
    super({
      ...config,
      model: config.model || 'deepseek-chat',
      baseUrl: config.baseUrl || 'https://api.deepseek.com/v1/chat/completions'
    });
  }
  
  override async generateCouplet(
    name1: string,
    name2: string = "",
    occasion: string,
    length: number = 7,
    otherRequirements: string = ""
  ): Promise<{
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  } | null> {
    try {
      // 验证API密钥
      if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error('DeepSeek API密钥无效，请配置有效的API密钥');
      }
      
      // 构建请求体
      const prompt = this.generateCoupletPrompt(name1, name2, occasion, length, otherRequirements);
      
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" } // 明确要求JSON格式响应
      };
      
      // 发送请求 - 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // 清除超时
        
        // 处理响应
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `API请求失败: ${response.status}`;
          throw new Error(`DeepSeek API错误: ${errorMessage}`);
        }
        
        const data = await response.json();
        
        // 检查响应结构
        if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
          throw new Error('DeepSeek返回的数据结构不完整');
        }
        
        console.log('DeepSeek原始响应:', data.choices[0].message.content);
        
        // 清理响应内容，移除可能的JSON标记
        let content = data.choices[0].message.content;
        // 移除前后的 ```json 和 ``` 标记
        if (content.startsWith('```json')) {
          content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        // 移除前后的引号
        content = content.trim().replace(/^"(.+)"$/, '$1');
        
        // 解析返回的JSON格式内容
        try {
          const coupletResult = JSON.parse(content);
          // 验证解析结果是否包含必要字段
          if (coupletResult.top && coupletResult.bottom && coupletResult.center) {
            return coupletResult;
          } else {
            throw new Error('解析结果缺少必要字段');
          }
        } catch (jsonError) {
          // 如果返回的不是标准JSON格式，尝试从文本中提取
          toast.warning('DeepSeek返回格式不规范，正在尝试提取内容...');
          const extractedResult = this.extractCoupletFromText(content);
          if (extractedResult) {
            return extractedResult;
          } else {
            // 如果提取也失败，生成一个基于模板的应急响应
            console.warn('无法从响应中提取对联内容，使用模板应急响应');
            return {
              top: `${name1}家喜庆迎新春`,
              bottom: name2 ? `${name2}宅祥和纳福瑞` : '宅第祥和纳福瑞',
              center: occasion === '春节' ? '新春快乐' : 
                      occasion === '结婚' ? '百年好合' :
                      occasion === '祝寿' ? '寿比南山' :
                      occasion === '乔迁' ? '乔迁之喜' :
                      occasion === '开业' ? '开业大吉' : '吉祥如意',
              explanation: `这是一副${occasion}场景的对联，由DeepSeek AI生成。`
            };
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId); // 清除超时
        if (fetchError.name === 'AbortError') {
          throw new Error('DeepSeek API请求超时，请检查网络连接');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('调用DeepSeek失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error(`DeepSeek模型错误: ${errorMessage}`);
      return null;
    }
  }
}

// 免费大模型管理器
export class FreeLLMManager {
  private models: Record<string, FreeLLMModel> = {};
  
  constructor() {
    // 初始化各个免费模型
    this.models = {
      // 百度文心一言
      'ernie': new ERNIEBotModel({ 
        apiKey: 'YOUR_API_KEY_HERE', // 需要替换为实际的API Key
        model: 'YOUR_SECRET_KEY_HERE' // 文心一言的secret key
      }),
      // 阿里通义千问
      'tongyi': new TongyiQianwenModel({ 
        apiKey: 'YOUR_API_KEY_HERE' // 需要替换为实际的API Key
      }),
   // 豆包
  'doubao': new DoubaoModel({ 
    apiKey: 'YOUR_API_KEY_HERE' // 需要替换为实际的API Key
  }),
  // DeepSeek模型
  'deepseek': new DeepSeekModel({
    apiKey: 'sk-2e3e8f2bff244b15ae07ed6f487430be' // 用户提供的API密钥
  }),
      // 讯飞星火
      'spark': new SparkModel({ 
        apiKey: 'YOUR_API_KEY_HERE', // 需要替换为实际的API Key
        appId: 'YOUR_APP_ID_HERE', // 需要替换为实际的App ID
        secretKey: 'YOUR_SECRET_KEY_HERE' // 需要替换为实际的Secret Key
      })
    };
  }
  
  // 获取可用的模型列表
  getAvailableModels(): Array<{id: string, name: string, description: string}> {
    return [
    { id: 'ernie', name: '百度文心一言', description: '百度AI开发的大语言模型，提供免费调用额度' },
    { id: 'tongyi', name: '阿里通义千问', description: '阿里云开发的大语言模型，提供免费调用额度' },
    { id: 'doubao', name: '豆包', description: '字节跳动开发的大语言模型，提供免费调用额度' },
    { id: 'spark', name: '讯飞星火', description: '科大讯飞开发的大语言模型，提供免费调用额度' },
    { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek AI开发的大语言模型，用于生成对联' }
    ];
  }
  
  // 使用指定模型生成对联
  async generateCouplet(
    modelId: string,
    name1: string,
    name2: string = "",
    occasion: string,
    length: number = 7,
    otherRequirements: string = ""
  ): Promise<{
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  } | null> {
    const model = this.models[modelId];
    if (!model) {
      throw new Error(`不支持的模型: ${modelId}`);
    }
    
    return await model.generateCouplet(name1, name2, occasion, length, otherRequirements);
  }
}

// 默认的免费大模型管理器实例
export const defaultFreeLLMManager = new FreeLLMManager();