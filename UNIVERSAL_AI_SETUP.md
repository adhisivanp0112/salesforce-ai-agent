# 🚀 Universal AI Setup - Works with ANY API!

## ✨ Super Simple Setup

Your app now works with **ANY AI provider** - just change 2 lines in `.env`!

---

## 🎯 Quick Start (Groq - FREE & FAST!)

### Step 1: Get Groq API Key (30 seconds)

1. Go to: **https://console.groq.com/keys**
2. Sign up (free)
3. Click "Create API Key"
4. Copy your key (starts with `gsk_...`)

### Step 2: Update `.env`

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_your_groq_api_key_here
```

### Step 3: Start Backend

```bash
cd backend
npm start
```

**That's it!** 🎉

---

## 🔄 Switch to Different AI Providers

### Use ChatGPT (OpenAI)

```env
AI_PROVIDER=openai
AI_API_KEY=sk-your_openai_key
```

Get key: https://platform.openai.com/api-keys

---

### Use Claude (Anthropic)

```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-your_anthropic_key
```

Get key: https://console.anthropic.com/

---

### Use Gemini (Google)

```env
AI_PROVIDER=gemini
GOOGLE_API_KEY=AIza_your_google_key
```

Get key: https://aistudio.google.com/app/apikey

---

### Use Mistral AI

```env
AI_PROVIDER=mistral
AI_API_KEY=your_mistral_key
```

Get key: https://console.mistral.ai/

---

### Use Perplexity AI

```env
AI_PROVIDER=perplexity
AI_API_KEY=pplx-your_key
```

Get key: https://www.perplexity.ai/settings/api

---

## 💰 Cost Comparison

| Provider | Free Tier | Cost (after free) | Speed | Best For |
|----------|-----------|-------------------|-------|----------|
| **Groq** | ✅ Generous | Free | ⚡⚡⚡⚡⚡ Fastest | **Development** |
| **Gemini** | ✅ Limited | Free | ⚡⚡⚡ Fast | Testing |
| **OpenAI** | ❌ $5 credit | $0.15-$15/1M tokens | ⚡⚡⚡ Fast | Production |
| **Anthropic** | ❌ No free tier | $3-$15/1M tokens | ⚡⚡⚡⚡ Very Fast | Production |
| **Mistral** | ❌ Trial only | $0.25-$2/1M tokens | ⚡⚡⚡ Fast | Budget |
| **Perplexity** | ✅ Limited | $0.20-$1/1M tokens | ⚡⚡⚡⚡ Very Fast | Search tasks |

---

## 🏆 Recommendation

**For Development/Testing:**
- 🥇 **Groq** (Free, fastest)
- 🥈 **Gemini** (Free, good quality)

**For Production:**
- 🥇 **Groq** (Still free, very fast)
- 🥈 **OpenAI** (Best quality, reliable)
- 🥉 **Anthropic** (Excellent for complex tasks)

---

## 🔧 Advanced: Custom Models

Override the default model:

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_your_key
AI_MODEL=llama-3.3-70b-versatile  # Custom model
```

### Available Models by Provider:

**Groq:**
- `llama-3.1-70b-versatile` (default - best)
- `llama-3.3-70b-versatile` (newest)
- `mixtral-8x7b-32768`
- `gemma2-9b-it`

**OpenAI:**
- `gpt-4o-mini` (default - cheap)
- `gpt-4o` (best quality)
- `gpt-3.5-turbo` (fastest)

**Anthropic:**
- `claude-3-5-sonnet-20241022` (default - best)
- `claude-3-5-haiku-20241022` (fastest)

---

## 📝 Your Current `.env` File

After setup, your `.env` should look like:

```env
# Salesforce
SF_USE_PASSWORD_AUTH=false
SF_ORG_ALIAS=workwithverbis

# Backend
PORT=3001
FRONTEND_URL=http://localhost:3000

# AI - JUST 2 LINES!
AI_PROVIDER=groq
AI_API_KEY=gsk_your_groq_api_key_here

# Database (optional)
USE_DATABASE=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salesforce_chat
DB_USER=home
DB_PASSWORD=
```

---

## 🧪 Test It!

After setup, test with these prompts:

1. "Create a case with subject Test"
2. "Create a lead with name John Doe"
3. "Show me all cases"
4. "List all custom objects"

---

## 🐛 Troubleshooting

### "API Key not found"
- Check `.env` file has `AI_API_KEY=...`
- No quotes around the key
- Restart backend after changing `.env`

### "Provider not supported"
- Check spelling of `AI_PROVIDER`
- Must be one of: `groq`, `openai`, `anthropic`, `gemini`, `mistral`, `perplexity`

### "Rate limit exceeded"
- Groq free tier: Wait a minute
- Switch to different provider temporarily
- Or upgrade to paid tier

---

## 🎉 That's It!

Now you can:
- ✅ Use **ANY AI provider**
- ✅ Switch providers **anytime**
- ✅ Just change **2 lines** in `.env`
- ✅ No code changes needed!

**Enjoy your universal AI-powered Salesforce app!** 🚀
