# API Providers Configuration Guide

## Overview
You can now configure AI provider credentials in **TWO WAYS**:

1. **JSON Array Format** (Option A) - All in one place
2. **Individual Variables** (Option B) - Traditional approach

## Option A: JSON Array Format (Centralized)

### In your `.env` file:
```env
API_PROVIDERS=[{"provider":"groq","key":"gsk_abc123xyz"},{"provider":"openai","key":"sk-xyz789abc"},{"provider":"anthropic","key":"sk-ant-def456ghi"}]
```

### Advantages:
✅ **All credentials in one place**
✅ **Easy to see all providers at a glance**
✅ **Simple copy/paste**
✅ **Easy to backup**

### Format:
```json
[
  {"provider":"groq","key":"gsk_your_groq_key"},
  {"provider":"openai","key":"sk-your_openai_key"},
  {"provider":"anthropic","key":"sk-ant-your_anthropic_key"},
  {"provider":"xai","key":"xai-your_xai_key"},
  {"provider":"cohere","key":"your_cohere_key"}
]
```

**Important:** Must be on **ONE LINE** in `.env` file (no line breaks!)

### Example with Real Keys:
```env
API_PROVIDERS=[{"provider":"groq","key":"gsk_abc123xyz789def456ghi012jkl345mno"},{"provider":"openai","key":"sk-proj-xyz789abc123def456ghi"}]
```

---

## Option B: Individual Variables (Traditional)

### In your `.env` file:
```env
GROQ_API_KEY=gsk_your_groq_key_here
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
XAI_API_KEY=xai-your_xai_key_here
COHERE_API_KEY=your_cohere_key_here
```

### Advantages:
✅ **Easier to read**
✅ **Standard .env practice**
✅ **Easy to comment out individual providers**

---

## Priority / Precedence

If **BOTH** are set, the system uses this priority:

1. **API_PROVIDERS array** (checked first) ⭐ **Higher Priority**
2. **Individual variables** (fallback)

### Example:
```env
# This will be used (higher priority)
API_PROVIDERS=[{"provider":"groq","key":"gsk_new_key_123"}]

# This will be ignored if above exists
GROQ_API_KEY=gsk_old_key_456
```

---

## Provider Names

Use these exact names in the JSON array:

| Provider | Name in JSON | Example Key Prefix |
|----------|-------------|-------------------|
| Groq | `"groq"` | `gsk_...` |
| OpenAI | `"openai"` | `sk-...` or `sk-proj-...` |
| Claude (Anthropic) | `"anthropic"` | `sk-ant-...` |
| Grok (xAI) | `"xai"` | `xai-...` |
| Cohere | `"cohere"` | varies |

---

## Complete Examples

### Example 1: Only Groq (Free)
```env
API_PROVIDERS=[{"provider":"groq","key":"gsk_abc123xyz789def456"}]
```

### Example 2: Groq + OpenAI
```env
API_PROVIDERS=[{"provider":"groq","key":"gsk_abc123xyz789"},{"provider":"openai","key":"sk-proj-xyz789abc123"}]
```

### Example 3: All Providers
```env
API_PROVIDERS=[{"provider":"groq","key":"gsk_abc123"},{"provider":"openai","key":"sk-xyz789"},{"provider":"anthropic","key":"sk-ant-def456"},{"provider":"xai","key":"xai-ghi012"},{"provider":"cohere","key":"jkl345"}]
```

### Example 4: Mixed Approach (Array + Individual)
```env
# Primary providers in array
API_PROVIDERS=[{"provider":"groq","key":"gsk_abc123"},{"provider":"openai","key":"sk-xyz789"}]

# Additional providers as individual variables
ANTHROPIC_API_KEY=sk-ant-def456ghi
COHERE_API_KEY=jkl345mno678
```

---

## How It Works

### Backend Logic:
1. User selects provider from dropdown (e.g., "Groq")
2. Backend receives: `{ provider: "groq" }`
3. Backend checks:
   - First: `API_PROVIDERS` array for `provider: "groq"`
   - Then: `GROQ_API_KEY` individual variable
4. Uses the key found and calls that provider's API

### Code Flow:
```javascript
// Backend function
getProviderApiKey('groq') 
  → Checks API_PROVIDERS array first
  → Falls back to GROQ_API_KEY
  → Returns key or null
```

---

## Error Messages

### If no key found:
```
Error: API key for provider 'openai' not found. 
Please add it to API_PROVIDERS array or OPENAI_API_KEY in your .env file.
```

### If JSON is invalid:
```
⚠️  Failed to parse API_PROVIDERS JSON: Unexpected token...
(Falls back to individual variables)
```

---

## Testing Your Setup

### Step 1: Set your credentials
```env
API_PROVIDERS=[{"provider":"groq","key":"YOUR_ACTUAL_KEY"}]
```

### Step 2: Restart backend
```bash
cd backend
npm start
```

### Step 3: Check logs
You should see:
```
✅ Found API key for groq in API_PROVIDERS array
🔄 Using dynamic AI provider: groq
```

### Step 4: Test in UI
1. Select "Groq" from dropdown
2. Send a prompt
3. Should work! ✅

---

## Best Practices

### ✅ DO:
- Keep your `.env` file secure (never commit to Git!)
- Use meaningful key names
- Test with one provider first
- Backup your `.env` file

### ❌ DON'T:
- Share your API keys
- Commit `.env` to version control
- Use spaces in JSON array
- Break JSON array across multiple lines in `.env`

---

## Troubleshooting

### Problem: "API key not found"
**Solution**: 
1. Check spelling of provider name in JSON
2. Ensure JSON is valid (no trailing commas)
3. Restart backend after changing `.env`

### Problem: "Failed to parse API_PROVIDERS"
**Solution**:
1. Validate JSON syntax: https://jsonlint.com/
2. Ensure it's on ONE line in `.env`
3. Check for escaped quotes if needed

### Problem: Wrong provider being used
**Solution**:
1. Check console logs for which key is being used
2. Verify API_PROVIDERS has correct provider name
3. Clear any cached environment variables

---

## Migration Guide

### From Individual Variables to JSON Array:

**Before:**
```env
GROQ_API_KEY=gsk_abc123
OPENAI_API_KEY=sk-xyz789
```

**After:**
```env
API_PROVIDERS=[{"provider":"groq","key":"gsk_abc123"},{"provider":"openai","key":"sk-xyz789"}]
```

**Steps:**
1. Copy your keys
2. Format as JSON array
3. Add to `.env` as `API_PROVIDERS=`
4. Test one provider
5. Add remaining providers
6. (Optional) Remove old individual variables

---

## Quick Reference

```env
# Format (one line, no spaces):
API_PROVIDERS=[{"provider":"NAME","key":"KEY"},{"provider":"NAME","key":"KEY"}]

# Providers:
# groq, openai, anthropic, xai, cohere

# Get keys from:
# Groq: https://console.groq.com/keys
# OpenAI: https://platform.openai.com/api-keys
# Anthropic: https://console.anthropic.com/
# xAI: https://x.ai/
# Cohere: https://dashboard.cohere.com/api-keys
```

---

## Support

Need help? Check:
1. `env.example` file for examples
2. Backend logs for error messages
3. This guide for configuration help
