# 🤗 Hugging Face Inference API Setup Guide

## Use ANY Hugging Face Model - For FREE!

This app uses **Hugging Face's Inference API** to run AI models completely free. You can switch between thousands of models by simply changing one line in your config!

### Recommended Models:

**🎯 For Salesforce (Best Results):**
- **Salesforce/xLAM-2-1b-fc-r** - Function calling model (RECOMMENDED)
- **Salesforce/xLAM-1b-fc-r** - Smaller, faster version

**💬 For General Chat:**
- **mistralai/Mistral-7B-Instruct-v0.1** - Versatile, good quality
- **meta-llama/Meta-Llama-3-8B-Instruct** - High quality (needs access)

### Why This is Great:

- 🆓 **100% FREE** - No AWS, no servers, no costs!
- 🔄 **Switch Models Anytime** - Just change one line in `.env`
- ⚡ **Fast** - Models run on Hugging Face's infrastructure
- 🌐 **Thousands of Models** - Choose from any public model

---

## 🎉 Setup Instructions

### Step 1: Get Your Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up or log in
3. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
4. Click **"New token"**
5. Name it (e.g., "Salesforce Admin App")
6. Select **"Read"** permission
7. Click **"Generate token"**
8. Copy your token (starts with `hf_...`)

### Step 2: Configure Your Backend

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Copy the example .env file** (if you haven't already):
   ```bash
   cp env.example .env
   ```

3. **Edit `.env` file** and add your Hugging Face API key:
   ```bash
   # Open with your favorite editor
   nano .env
   # or
   code .env
   ```

4. **Update these settings**:
   ```env
   # Use Hugging Face Inference API
   AI_PROVIDER=inference

   # Add your Hugging Face API key
   HUGGINGFACE_API_KEY=hf_your_actual_token_here

   # Choose any model (change anytime!)
   HUGGINGFACE_MODEL=Salesforce/xLAM-2-1b-fc-r
   ```

### Want to Try a Different Model?

Just change the `HUGGINGFACE_MODEL` line:

```env
# Try xLAM 1B (faster, smaller)
HUGGINGFACE_MODEL=Salesforce/xLAM-1b-fc-r

# Or try Mistral (general purpose)
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.1

# Or any other model from Hugging Face!
HUGGINGFACE_MODEL=your-chosen-model
```

### Step 3: Start Your Application

1. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

3. **Open your browser**: Navigate to `http://localhost:3000`

---

## 🧪 Testing xLAM

Try these prompts in your app:

### Create Operations
- "Create a new lead with name John Doe and email john@test.com"
- "Create a case with subject 'Website Issue' and high priority"

### Query Operations
- "Show me all cases"
- "Get the first 5 accounts"

### Object Description
- "Fetch all custom fields in the Case object"
- "Show me all fields in Account"
- "List all custom objects"

### Update/Delete Operations
- "Update case [CASE_ID] to status Closed"
- "Delete lead [LEAD_ID]"

---

## 🆚 Model Comparison

| Model | Cost | Speed | Salesforce Tasks | General Chat |
|-------|------|-------|-----------------|--------------|
| **xLAM-2-1b** | 🆓 FREE | ⚡⚡⚡ Fast | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐ Good |
| **xLAM-1b** | 🆓 FREE | ⚡⚡⚡⚡ Fastest | ⭐⭐⭐⭐ Great | ⭐⭐ OK |
| **Mistral-7B** | 🆓 FREE | ⚡⚡ Slower | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Very Good |
| **Gemini** | 🆓 FREE* | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Best |

*Gemini has rate limits (15 req/min)

**Recommendation**: Use **Salesforce/xLAM-2-1b-fc-r** for Salesforce operations!

---

## 🔧 How It Works

### Architecture

```
User Input
    ↓
xLAM Model (via Hugging Face API)
    ↓
Function Call Detection
    ↓
Execute Salesforce Operation
    ↓
Return Results
```

### API Call Example

```bash
curl -X POST https://api-inference.huggingface.co/models/Salesforce/xLAM-2-1b-fc-r \
  -H "Authorization: Bearer hf_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": "Create a new lead with name John and email john@test.com"
  }'
```

### Supported Functions

The xLAM handler supports these Salesforce operations:

1. **create_case** - Create new cases
2. **create_lead** - Create new leads
3. **execute_query** - Run SOQL queries
4. **update_record** - Update existing records
5. **delete_record** - Delete records
6. **describe_object** - Get object metadata
7. **list_objects** - List all Salesforce objects

---

## 🐛 Troubleshooting

### Error: "HUGGINGFACE_API_KEY not found"
- Make sure you created a `.env` file in the `backend` folder
- Check that your API key starts with `hf_`
- Don't use quotes around the API key in the `.env` file

### Error: "Model loading"
- The model might be loading for the first time
- Wait 30-60 seconds and try again
- Hugging Face automatically loads models on first request

### Error: "Rate limit exceeded"
- Hugging Face free tier has rate limits
- Wait a few seconds between requests
- Consider getting a Pro account for higher limits

### Poor Results
- xLAM is trained for function calling, not general chat
- Use specific action-oriented prompts
- Example: ✅ "Create a case" vs ❌ "How do I create a case?"

---

## 💡 Tips for Best Results

1. **Be Specific**: Use clear action verbs (create, update, delete, show, list)
2. **Include Details**: Provide all necessary information in one prompt
3. **Use Proper Names**: Use correct Salesforce object names (Case, Lead, Account)
4. **Test First**: Try simple operations before complex ones

### Good Prompts ✅
- "Create a lead named Sarah with email sarah@example.com and company Acme Corp"
- "Show me all cases with status New"
- "Describe the Contact object"

### Bad Prompts ❌
- "Can you help me with something?" (too vague)
- "I need to do stuff" (no action specified)
- "What is a case?" (general question, not an action)

---

## 📚 Additional Resources

- [xLAM Model on Hugging Face](https://huggingface.co/Salesforce/xLAM-2-1b-fc-r)
- [Hugging Face Inference API Docs](https://huggingface.co/docs/api-inference/index)
- [Salesforce API Documentation](https://developer.salesforce.com/docs/apis)

---

## 🎯 Next Steps

1. ✅ Get your Hugging Face API key
2. ✅ Configure your `.env` file
3. ✅ Start your application
4. ✅ Test with simple prompts
5. 🚀 Build amazing Salesforce automation!

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the backend logs in your terminal
2. Verify your `.env` configuration
3. Test your API key: https://huggingface.co/settings/tokens
4. Review the troubleshooting section above

Happy building! 🎉
