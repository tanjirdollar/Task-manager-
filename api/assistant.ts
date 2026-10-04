import { GoogleGenAI } from '@google/genai';
import { parseLocalAICommand } from '../src/utils/aiCommandParser';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, history } = req.body || {};
    const query = (message || '').trim();

    if (!query) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const todayStr = context?.todayStr || new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowStr = context?.tomorrowStr || tomorrow.toISOString().split('T')[0];

    const safeContext = {
      tasks: context?.tasks || [],
      events: context?.events || [],
      notes: context?.notes || [],
      todayStr,
      tomorrowStr,
      focusMinutes: context?.focusMinutes || 0,
    };

    // If Gemini key is available, attempt Gemini call
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const systemInstruction = `You are a high-performance productivity assistant in Kroma Productivity Studio for user "তানজির" (Tanjir).
Today is ${todayStr}. Tomorrow is ${tomorrowStr}.

When the user asks to add/create a task, schedule an event, save a note, or complete a task, ALWAYS output JSON:
{
  "reply": "Polite confirmation in Bengali",
  "actions": [
    {
      "type": "create_task",
      "data": {
        "title": "task title",
        "priority": "low" | "medium" | "high",
        "dueDate": "${todayStr}",
        "category": "কাজ" | "ব্যক্তিগত" | "ডিজাইন",
        "estimatedMinutes": 15
      }
    }
  ]
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: query,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const rawText = response.text?.trim() || '';
        try {
          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed.reply === 'string' && Array.isArray(parsed.actions) && parsed.actions.length > 0) {
            return res.status(200).json({
              reply: parsed.reply,
              actions: parsed.actions,
              source: 'gemini',
            });
          }
        } catch {
          // fallback to local parser
        }
      } catch (err: any) {
        console.warn('Gemini call failed in serverless function:', err?.message || err);
      }
    }

    // Local deterministic Bengali/English NLP parser
    const localResult = parseLocalAICommand(query, safeContext, history);
    return res.status(200).json(localResult);
  } catch (error: any) {
    console.error('Serverless assistant error:', error);
    return res.status(500).json({ error: 'Internal assistant error' });
  }
}
