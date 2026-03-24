# 🤗 Hugging Face AI Integration Setup

Your Salesforce AI Assistant now supports Hugging Face's Inference API! This gives you access to powerful open-source models with much better rate limits than Google Gemini.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Free Hugging Face API Key

1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Click **"New token"**
3. Give it a name like "Salesforce AI Assistant"
4. Select **"Read"** permissions (sufficient for inference)
5. Click **"Generate a token"**
6. **Copy the token** (starts with `hf_...`)

### Step 2: Configure Your Environment

1. Open your `backend/.env` file
2. Add these lines (replace with your actual token):

```bash
# Choose AI Provider: 'gemini' or 'huggingface'
AI_PROVIDER=huggingface

# Hugging Face Configuration
HUGGINGFACE_API_KEY=hf_your_actual_token_here
HUGGINGFACE_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
```

### Step 3: Restart Your Backend

```bash
# Stop the current backend (find the process ID)
lsof -i :3001
kill <PID_FROM_ABOVE>

# Start the backend again
cd /Users/home/Desktop/salesforce-admin-app
./start-backend.sh
```

## ✅ That's It!

Your AI assistant will now use Hugging Face instead of Google Gemini. You should see this message when the backend starts:

```
🤗 Initializing Hugging Face AI Handler...
🤗 Hugging Face AI Handler initialized with model: meta-llama/Meta-Llama-3-8B-Instruct
```

## 🎯 Benefits of Hugging Face

| Feature | Google Gemini Free | Hugging Face Free |
|---------|-------------------|-------------------|
| **Rate Limits** | 15 requests/minute | Much more generous |
| **Daily Limits** | 1,500 requests/day | No daily limits |
| **Model Choice** | Fixed (Gemini) | Thousands of models |
| **Privacy** | Google servers | Hugging Face servers |
| **Cost** | Free tier only | Free + paid options |

## 🔧 Advanced Configuration

### Switch Back to Gemini
Change `AI_PROVIDER=gemini` in your `.env` file and restart.

### Try Different Models
You can experiment with other models by changing `HUGGINGFACE_MODEL`:

- `meta-llama/Meta-Llama-3-8B-Instruct` (recommended)
- `microsoft/DialoGPT-medium`
- `facebook/blenderbot-400M-distill`
- `mistralai/Mistral-7B-Instruct-v0.1`

### Monitor Usage
Check your usage at: https://huggingface.co/settings/billing

## 🐛 Troubleshooting

**Error: "HUGGINGFACE_API_KEY not found"**
- Make sure you added the API key to your `.env` file
- Restart the backend after adding the key

**Error: "Model is loading"**
- Some models need a few seconds to "warm up" on first use
- Try again in 30 seconds

**Error: "Rate limit exceeded"**
- Even Hugging Face has limits, but they're much higher
- Wait a minute and try again, or upgrade to a paid plan

## 🎉 Test Your Setup

1. Open http://localhost:3000
2. Try: "Fetch all custom fields which exist in the case object"
3. You should get results without rate limit errors!

---

**Need Help?** 
- Hugging Face Docs: https://huggingface.co/docs/api-inference
- Model Hub: https://huggingface.co/models
