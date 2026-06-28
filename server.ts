import express from 'express';
import path from 'path';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini-2.5-flash', systemInstruction, temperature = 1, thinking = false } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Convert internal message format to GenAI format
    const history = messages.slice(0, -1).map((msg: any) => {
      const parts: any[] = [];
      if (msg.content) parts.push({ text: msg.content });
      
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          if (att.type === 'image' && att.data.includes(',')) {
            parts.push({
              inlineData: {
                data: att.data.split(',')[1],
                mimeType: att.mimeType
              }
            });
          } else if (att.type === 'file') {
            parts.push({
              text: `\n\n--- File: ${att.name} ---\n${att.data}\n--- End File ---\n`
            });
          }
        }
      }
      
      if (parts.length === 0) parts.push({ text: ' ' });

      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts,
      };
    });
    
    const lastMessage = messages[messages.length - 1];
    
    const lastParts: any[] = [];
    if (lastMessage.content) lastParts.push({ text: lastMessage.content });
    
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      for (const att of lastMessage.attachments) {
        if (att.type === 'image' && att.data.includes(',')) {
          lastParts.push({
            inlineData: {
              data: att.data.split(',')[1],
              mimeType: att.mimeType
            }
          });
        } else if (att.type === 'file') {
          lastParts.push({
            text: `\n\n--- File: ${att.name} ---\n${att.data}\n--- End File ---\n`
          });
        }
      }
    }
    
    if (lastParts.length === 0) lastParts.push({ text: ' ' });

    const config: any = {
      systemInstruction,
      temperature,
    };
    
    // Add thinking level if requested
    if (thinking) {
       config.thinkingConfig = { thinkingBudgetTokens: 1024 }; 
    }

    // Set headers for SSE stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create a chat session with history
    const chat = ai.chats.create({
      model,
      config,
      history,
    });

    const responseStream = await chat.sendMessageStream({ message: lastParts });

    for await (const chunk of responseStream) {
      if (chunk.text) {
         // Escape newlines for SSE
         const data = JSON.stringify({ text: chunk.text });
         res.write(`data: ${data}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('API Chat Error:', error);
    let errorMsg = error.message || 'An error occurred';
    try {
      if (typeof errorMsg === 'string' && errorMsg.includes('"status":"UNAVAILABLE"')) {
        errorMsg = 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.';
      } else if (typeof errorMsg === 'string' && errorMsg.startsWith('{')) {
        const parsed = JSON.parse(errorMsg);
        if (parsed.error && parsed.error.message) {
          if (typeof parsed.error.message === 'string' && parsed.error.message.startsWith('{')) {
             const inner = JSON.parse(parsed.error.message);
             if (inner.error && inner.error.message) errorMsg = inner.error.message;
          } else {
             errorMsg = parsed.error.message;
          }
        }
      }
    } catch(e) {}
    
    // If headers already sent, we just end the stream. Otherwise send a JSON error.
    if (!res.headersSent) {
      res.status(500).json({ error: errorMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.end();
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
