# 🤗 Hugging Face Inference API - Quick Setup

## 3-Step Setup (5 minutes)

### 1. Get API Key
- Go to: https://huggingface.co/settings/tokens
- Create new token (Read access)
- Copy your token (starts with `hf_...`)

### 2. Configure `.env`
```bash
cd backend
cp env.example .env
nano .env  # or use any text editor
```

Add these lines:
```env
AI_PROVIDER=inference
HUGGINGFACE_API_KEY=hf_your_token_here
HUGGINGFACE_MODEL=Salesforce/xLAM-2-1b-fc-r
```

### 3. Start App
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

Open: http://localhost:3000

---

## 🎯 Recommended Models

**For Salesforce Operations:**
```env
HUGGINGFACE_MODEL=Salesforce/xLAM-2-1b-fc-r  # Best
HUGGINGFACE_MODEL=Salesforce/xLAM-1b-fc-r    # Faster
```

**For General Chat:**
```env
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.1
```

---

## 🧪 Test Commands

Try these in your app:
- "Create a lead with name John Doe and email john@test.com"
- "Show me all cases"
- "List all custom objects"
- "Describe the Case object"

---

## 🔄 Switch Models Anytime

Just change one line in `.env`:
```env
HUGGINGFACE_MODEL=any-model-you-want
```

Restart backend. Done! ✅

---

## ❓ Troubleshooting

**"API Key not found"**
- Check `.env` file exists in `backend/` folder
- API key should NOT have quotes: `HUGGINGFACE_API_KEY=hf_abc123`

**"Model loading"**
- Wait 30 seconds - model is starting
- Try again

**Poor results**
- xLAM models work best for actions ("Create...", "Show...", "Update...")
- Use Mistral for conversational queries

---

## 📖 Full Documentation

See [XLAM_SETUP.md](./XLAM_SETUP.md) for detailed guide.

---

**That's it!** 🎉 You're using AI-powered Salesforce automation - completely free!
