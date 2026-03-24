# Quick Setup Guide - Provider Dropdown

## 🚀 Quick Start (3 Steps)

### Step 1: Configure API Keys

Copy the example environment file:
```bash
cd backend
cp env.example .env
```

Edit `.env` and add your API keys:
```env
# At minimum, add ONE provider:
GROQ_API_KEY=gsk_your_actual_groq_key_here

# Optional: Add more providers
OPENAI_API_KEY=sk-your_actual_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_actual_anthropic_key_here
XAI_API_KEY=xai-your_actual_xai_key_here
COHERE_API_KEY=your_actual_cohere_key_here
```

### Step 2: Start Backend
```bash
cd backend
npm start
```

### Step 3: Start Frontend
```bash
cd frontend
npm start
```

## ✅ That's It!

Now open your browser and you'll see a dropdown in the input box:

```
[Groq ▼] | Type your prompt here... [→]
```

Select any provider from the dropdown and start chatting!

---

## 🔑 Where to Get API Keys

### Groq (FREE & RECOMMENDED) ⚡
1. Visit: https://console.groq.com/keys
2. Sign up with your email
3. Click "Create API Key"
4. Copy the key (starts with `gsk_`)
5. Paste in `.env` as `GROQ_API_KEY=gsk_...`

### OpenAI (Paid)
1. Visit: https://platform.openai.com/api-keys
2. Create account
3. Add payment method
4. Create API key
5. Copy key (starts with `sk-`)
6. Paste in `.env` as `OPENAI_API_KEY=sk-...`

### Claude/Anthropic (Paid)
1. Visit: https://console.anthropic.com/
2. Sign up
3. Add credits
4. Generate API key
5. Copy key (starts with `sk-ant-`)
6. Paste in `.env` as `ANTHROPIC_API_KEY=sk-ant-...`

### Grok/xAI (Paid)
1. Visit: https://x.ai/
2. Request access
3. Get API credentials
4. Paste in `.env` as `XAI_API_KEY=xai-...`

### Cohere (Paid)
1. Visit: https://dashboard.cohere.com/api-keys
2. Sign up
3. Generate API key
4. Paste in `.env` as `COHERE_API_KEY=...`

---

## 📖 Example .env File

Here's a complete example with all providers:

```env
# ============================================
# PROVIDER API KEYS
# ============================================

# Groq (FREE - Recommended for testing)
GROQ_API_KEY=gsk_abc123xyz789def456ghi012jkl345mno

# OpenAI (Paid)
OPENAI_API_KEY=sk-proj-abc123xyz789def456ghi012jkl345mno678pqr

# Anthropic/Claude (Paid)
ANTHROPIC_API_KEY=sk-ant-abc123xyz789def456ghi012jkl345mno

# xAI/Grok (Paid)
XAI_API_KEY=xai-abc123xyz789def456

# Cohere (Paid)
COHERE_API_KEY=abc123xyz789def456ghi012

# ============================================
# SALESFORCE CONFIG (Keep your existing values)
# ============================================
SF_ORG_ALIAS=myverbis
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## 🎯 Usage Examples

### Example 1: Using Groq (Free)
1. Select **"Groq"** from dropdown
2. Type: `"Create a case with high priority"`
3. Press Enter
4. ✅ Response in ~2 seconds!

### Example 2: Using OpenAI
1. Select **"OpenAI"** from dropdown
2. Type: `"Show me all accounts"`
3. Press Enter
4. ✅ Response using GPT-4!

### Example 3: Using Claude
1. Select **"Claude"** from dropdown
2. Type: `"List custom fields in Case object"`
3. Press Enter
4. ✅ Response from Claude!

---

## ⚠️ Troubleshooting

### Problem: "API key not found" error
**Solution**: Make sure you've added the provider's API key to `.env` and restarted the backend.

```bash
# Stop backend (Ctrl+C)
# Edit .env file
# Start backend again
npm start
```

### Problem: Dropdown not showing
**Solution**: Clear browser cache and refresh:
```bash
# In browser: Ctrl+Shift+R (hard refresh)
# Or clear cache: Ctrl+Shift+Delete
```

### Problem: Provider not working
**Solution**: Check your API key is valid:
1. Go to the provider's website
2. Generate a new API key
3. Update `.env` file
4. Restart backend

---

## 💡 Pro Tips

### Tip 1: Start with Groq (Free)
Groq is free and super fast - perfect for testing!

### Tip 2: Save Money
Use Groq for simple queries, OpenAI for complex ones:
- Simple query? → Use Groq (free)
- Complex query? → Use OpenAI (better quality)

### Tip 3: Multiple Keys
You can have multiple providers configured. Switch between them as needed!

### Tip 4: Default Provider
The app remembers your last selected provider, so you don't have to change it every time.

---

## 🆘 Need Help?

1. Check the `.env.example` file for reference
2. Make sure backend is running (check console)
3. Make sure frontend is running (check browser)
4. Check browser console for errors (F12)
5. Check backend logs for errors

---

## 🎉 You're All Set!

Enjoy your new AI-powered Salesforce assistant with multiple provider options!
