// 扣子大模型API调用封装
import { toast } from 'sonner';

// 扣子大模型的响应接口
export interface KouZiResponse {
  code: number;
  data: {
    content: string;
  };
  message: string;
}

// 扣子大模型配置
export interface KouZiConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

// 扣子大模型API调用类
export class KouZiModel {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: KouZiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'moonshot-v1-8k';
    this.baseUrl = config.baseUrl || 'https://api.kouzi.ai/v1';
  }

  // 生成对联的Prompt模板
  private generateCoupletPrompt(
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

    prompt += `\n\n请以JSON格式输出，包含 top (上联), bottom (下联), center (横批), explanation (寓意解释)。\n输出示例：{"top": "...", "bottom": "...", "center": "...", "explanation": "..."}`;

    return prompt;
  }

  // 调用扣子大模型API生成对联
  public async generateCouplet(
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
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: "user",
            content: this.generateCoupletPrompt(name1, name2, occasion, length, otherRequirements)
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      };

      // 发送请求
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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

      const data: KouZiResponse = await response.json();

      // 解析返回的JSON格式内容
      try {
        const coupletResult = JSON.parse(data.data.content);
        return coupletResult;
      } catch (jsonError) {
        // 如果返回的不是标准JSON格式，尝试从文本中提取
        toast.warning('AI返回格式不规范，正在尝试提取内容...');
        return this.extractCoupletFromText(data.data.content);
      }
    } catch (error) {
      console.error('调用扣子大模型失败:', error);
      toast.error('调用AI服务失败，请检查API密钥或网络连接');
      return null;
    }
  }

  // 从文本中提取对联内容（备用方法）
  private extractCoupletFromText(text: string): {
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

// 默认的扣子大模型实例（使用mock密钥）
export const defaultKouZiModel = new KouZiModel({
  apiKey: 'YOUR_API_KEY_HERE' // 用户需要替换为实际的API密钥
});