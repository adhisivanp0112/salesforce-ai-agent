# Provider Dropdown Implementation

## Overview
Added a dynamic AI provider selection dropdown inside the prompt input box (Cursor-style) that allows users to choose between different AI providers without needing to manually configure API keys.

## What Was Changed

### 1. Frontend (AIAssistant.js)
- **Added state**: `quickProvider` - Stores the selected provider (default: 'groq')
- **Added UI element**: Provider dropdown inside the input box on the left side
- **Dropdown options**:
  - Groq (default)
  - OpenAI
  - Grok (xAI)
  - Claude (Anthropic)
  - Cohere
- **Persists selection**: Saves to localStorage as `quick_provider`
- **Shows current provider**: Displays in the input hint below the box

### 2. Backend (server-improved.js)
- **Modified endpoint**: `/api/salesforce/ai-prompt` now accepts `provider` parameter
- **Dynamic API key mapping**: Maps provider names to environment variables:
  ```
  groq     → GROQ_API_KEY
  openai   → OPENAI_API_KEY
  xai      → XAI_API_KEY
  anthropic → ANTHROPIC_API_KEY
  cohere   → COHERE_API_KEY
  ```
- **Error handling**: Returns clear error if provider's API key is not set
- **Backward compatible**: Still supports legacy `aiProvider` and `apiKey` params

### 3. Service Layer (salesforceService.js)
- **Updated method**: `processAIPrompt()` now accepts `provider` parameter
- **Passes provider**: Sends selected provider to backend with each request

### 4. CSS Styling (AIAssistant.css)
- **Cursor-style dropdown**: Styled to match modern UI patterns
- **Visual design**:
  - Purple gradient background matching theme
  - Hover and focus states
  - Custom dropdown arrow
  - Responsive design
- **Light/Dark theme support**: Different styles for both themes

### 5. Environment Configuration (env.example)
- **Updated format**: Clear documentation for provider API keys
- **Provider keys**:
  ```env
  GROQ_API_KEY=gsk_your_groq_key_here
  OPENAI_API_KEY=sk-your_openai_key_here
  ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
  XAI_API_KEY=xai-your_xai_key_here
  COHERE_API_KEY=your_cohere_key_here
  ```
- **Added instructions**: How to get API keys for each provider

## How It Works

### User Flow:
1. User selects a provider from the dropdown (e.g., "Groq")
2. User types their prompt
3. User presses Enter
4. Frontend sends: `{ prompt, provider: 'groq' }`
5. Backend looks up `GROQ_API_KEY` from environment
6. Backend creates handler with that API key
7. Backend processes request and returns response

### Configuration Steps:
1. Copy `env.example` to `.env`
2. Add API keys for providers you want to use:
   ```env
   GROQ_API_KEY=gsk_abc123...
   OPENAI_API_KEY=sk-xyz789...
   ```
3. Start backend: `npm start` (in backend folder)
4. Start frontend: `npm start` (in frontend folder)
5. Users can now select providers from the dropdown!

## Benefits

### For End Users:
- ✅ **Easy switching**: Change providers with one click
- ✅ **No configuration**: Don't need to manage API keys in UI
- ✅ **Visual feedback**: Current provider shown in input hint
- ✅ **Persistent choice**: Selection saved across sessions

### For Administrators:
- ✅ **Centralized config**: All API keys in one `.env` file
- ✅ **Secure**: API keys never exposed to frontend
- ✅ **Flexible**: Enable/disable providers by adding/removing keys
- ✅ **Cost control**: Choose between free (Groq) and paid providers

### For Developers:
- ✅ **Clean architecture**: Separation of concerns
- ✅ **Backward compatible**: Existing code still works
- ✅ **Extensible**: Easy to add new providers
- ✅ **Type-safe**: Clear parameter contracts

## Supported Providers

| Provider | Free | Speed | Quality | API Key Prefix |
|----------|------|-------|---------|----------------|
| **Groq** | ✅ Yes | ⚡ Very Fast | ⭐⭐⭐⭐ | `gsk_...` |
| **OpenAI** | ❌ Paid | 🔵 Fast | ⭐⭐⭐⭐⭐ | `sk-...` |
| **Claude** | ❌ Paid | 🔵 Fast | ⭐⭐⭐⭐⭐ | `sk-ant-...` |
| **Grok (xAI)** | ❌ Paid | 🔵 Fast | ⭐⭐⭐⭐ | `xai-...` |
| **Cohere** | ❌ Paid | 🔵 Fast | ⭐⭐⭐⭐ | varies |

## Example Usage

### In .env file:
```env
# Add your provider API keys
GROQ_API_KEY=gsk_abc123xyz789...
OPENAI_API_KEY=sk-proj-xyz789abc123...
ANTHROPIC_API_KEY=sk-ant-abc123xyz789...
```

### In UI:
1. Select "Groq" from dropdown
2. Type: "Create a case with high priority"
3. Press Enter
4. Backend uses Groq API

Change to OpenAI:
1. Select "OpenAI" from dropdown
2. Type next prompt
3. Backend now uses OpenAI API

## Error Handling

If a provider's API key is missing:
```
Error: API key for provider 'openai' not found in environment variables. 
Please add OPENAI_API_KEY to your .env file.
```

## Testing

To test the implementation:
1. Set only `GROQ_API_KEY` in `.env`
2. Try selecting "Groq" - should work ✅
3. Try selecting "OpenAI" - should show error message ❌
4. Add `OPENAI_API_KEY` to `.env`
5. Restart backend
6. Try selecting "OpenAI" - should work ✅

## Future Enhancements

Potential improvements:
- [ ] Show availability indicator next to provider names (green dot if API key exists)
- [ ] Display provider status/health in settings
- [ ] Add model selection per provider
- [ ] Show token usage per provider
- [ ] Provider performance metrics

## Screenshots

The dropdown appears inside the input box on the left side (Cursor-style):
```
┌─────────────────────────────────────────────────────┐
│ [Groq ▼] | Ask me anything about Salesforce...  [→]│
└─────────────────────────────────────────────────────┘
        Press Enter to send • Provider: GROQ
```

## Files Changed

1. ✅ `frontend/src/components/AIAssistant.js` - Added dropdown UI
2. ✅ `frontend/src/services/salesforceService.js` - Added provider param
3. ✅ `frontend/src/styles/AIAssistant.css` - Added dropdown styling
4. ✅ `backend/server-improved.js` - Added dynamic provider handling
5. ✅ `backend/env.example` - Added provider key documentation

## Notes

- Default provider is **Groq** (free and fast)
- Provider selection is **persistent** across browser sessions
- Backend **validates** API keys before making requests
- System is **backward compatible** with existing AI settings modal
- Only providers with **valid API keys** will work
