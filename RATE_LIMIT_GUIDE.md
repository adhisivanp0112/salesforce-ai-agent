# Google Gemini API Rate Limit Guide

## Understanding the Error

If you're seeing this error:
```
❌ AI Error after 3 attempts: [GoogleGenerativeAI Error]: Error fetching from 
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent: 
[429 Too Many Requests] Resource exhausted.
```

This means you've exceeded the **rate limits** or **quota limits** for the Google Gemini API free tier.

## Free Tier Limits

The Google Gemini API free tier has the following limits:

| Limit Type | Free Tier |
|------------|-----------|
| **Requests per minute (RPM)** | 15 |
| **Tokens per minute (TPM)** | 1,000,000 |
| **Requests per day (RPD)** | 1,500 |

## Why This Happens

1. **Too many requests too quickly** - Making more than 15 requests per minute
2. **Daily quota exhausted** - Made more than 1,500 requests today
3. **Multiple retries** - The app retries failed requests, which can compound the problem
4. **Shared API key** - If multiple people are using the same API key

## Immediate Solutions

### Option 1: Wait It Out ⏳
The simplest solution is to wait:
- **For RPM limits**: Wait 1 minute
- **For daily limits**: Wait until midnight Pacific Time (API quota resets daily)

### Option 2: Check Your API Key Quota 🔑
1. Visit: https://aistudio.google.com/app/apikey
2. View your current usage and remaining quota
3. If you've hit daily limits, you'll need to wait or upgrade

### Option 3: Get a New API Key 🆕
If you have multiple Google accounts:
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key with a different Google account
3. Update your `.env` file with the new key:
   ```bash
   GOOGLE_API_KEY=your_new_api_key_here
   ```
4. Restart the backend server

### Option 4: Upgrade to Paid Tier 💳
Get significantly higher limits:
1. Visit: https://ai.google.dev/pricing
2. Upgrade to the paid tier
3. New limits:
   - **1,000 RPM** (vs 15 free)
   - **4 million TPM** (vs 1M free)
   - **Unlimited daily requests** (vs 1,500 free)

## Long-Term Solutions

### 1. Implement Request Throttling
The app now includes:
- ✅ Exponential backoff for rate limit errors
- ✅ Better error messages explaining the issue
- ✅ No automatic retries for rate limit errors (prevents making it worse)

### 2. Cache AI Responses
Consider implementing caching for common queries to reduce API calls.

### 3. Use the Pattern-Matching Fallback
The app includes a non-AI pattern matcher (`aiHandler.js`) that doesn't require API calls:

To switch to it, edit `backend/server-improved.js`:
```javascript
// Change this:
const GeminiAIHandler = require('./geminiAIHandler');

// To this:
const AIHandler = require('./aiHandler');

// And change the initialization:
aiHandler = new AIHandler(sfConnection);
```

The pattern matcher is less intelligent but has no rate limits.

## Monitoring Your Usage

### Check Usage in Real-Time
Monitor your Google API dashboard:
```
https://aistudio.google.com/app/apikey
```

### Backend Logs
The backend now logs rate limit information:
```
⏳ Rate limit hit. Waiting 2s before retry...
🚫 Rate limit exceeded on Google Gemini API
```

## Best Practices

1. **Avoid rapid-fire requests** - Space out your queries
2. **Test with simple queries first** - Don't start with complex operations
3. **Use one API key per project** - Don't share across multiple apps
4. **Monitor your daily usage** - Keep an eye on the dashboard
5. **Consider upgrading early** - If you're building seriously, the paid tier is worth it

## Configuration

Make sure your `.env` file is properly configured:

```bash
# Copy the example
cp backend/env.example backend/.env

# Edit and add your API key
nano backend/.env

# Add this line:
GOOGLE_API_KEY=your_actual_api_key_here
```

Then restart the backend:
```bash
cd backend
npm start
```

## Still Having Issues?

1. **Check your internet connection** - API calls require stable internet
2. **Verify your API key** - Make sure it's copied correctly without extra spaces
3. **Check Google's status** - Visit https://status.cloud.google.com/
4. **Try a different model** - Consider using `gemini-1.5-flash` instead of `gemini-2.0-flash`

## Related Links

- 📚 [Google AI Studio](https://aistudio.google.com/)
- 💰 [Pricing Information](https://ai.google.dev/pricing)
- 📖 [Rate Limit Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429)
- 🔧 [API Key Management](https://aistudio.google.com/app/apikey)

## Need More Help?

If you continue experiencing issues:
1. Check the backend console logs for detailed error messages
2. Verify your API key is valid and has remaining quota
3. Consider switching to the pattern-matching AI handler temporarily
4. Upgrade to the paid tier for production use

