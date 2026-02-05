# Pi Extension Review - Vertex Anthropic

## ✅ What We're Doing Right

### 1. OAuth Pattern
- ✅ Using `pi.registerProvider()` with `oauth` object
- ✅ Implementing `login()`, `refreshToken()`, `getApiKey()`
- ✅ Using `OAuthLoginCallbacks` properly (onAuth, onPrompt)
- ✅ Returning `OAuthCredentials` with refresh/access/expires
- ✅ Credentials persist in `~/.pi/agent/auth.json`

### 2. Provider Registration
- ✅ Custom `api` identifier ("vertex-anthropic-api")
- ✅ Custom `streamSimple` implementation
- ✅ Proper model definitions with all required fields
- ✅ Cost tracking configured

### 3. Streaming Implementation
- ✅ Using `createAssistantMessageEventStream()`
- ✅ Pushing all required events (start, text/thinking/toolcall, done/error)
- ✅ Handling `AssistantMessage` structure correctly
- ✅ Using `calculateCost()` for usage tracking
- ✅ Proper error handling with try/catch

### 4. Message Transformation
- ✅ Implementing `transformMessages()` to handle incomplete tool calls
- ✅ Removing errored/aborted assistant messages
- ✅ Inserting synthetic tool results for orphaned calls
- ✅ Normalizing tool call IDs

### 5. Content Conversion
- ✅ Handling text and image content
- ✅ Supporting thinking blocks with signatures
- ✅ Tool call conversion
- ✅ Prompt caching (cache_control)

## ⚠️ Potential Issues

### 1. **OAuth getApiKey() Returns Command**
```typescript
getApiKey(_credentials) {
    return `!${config.gcloudPath} auth print-access-token`;
}
```

**ISSUE**: The docs show returning the actual token, not a command.

**Example from docs:**
```typescript
getApiKey: (cred) => cred.access,
```

**Fix Needed**: We should get the token and return it:
```typescript
getApiKey(_credentials) {
    try {
        const token = execSync(`${config.gcloudPath} auth print-access-token`, {
            encoding: "utf-8",
            timeout: 5000,
        }).trim();
        return token;
    } catch (error) {
        throw new Error("Failed to get access token from gcloud");
    }
}
```

### 2. **Credentials Not Used in getApiKey()**

The `credentials` parameter contains our saved config (project, region, gcloudPath), but we're using the global config instead.

**Fix Needed**:
```typescript
getApiKey(credentials) {
    // Parse saved config from credentials.refresh
    let gcloudPath = config.gcloudPath;
    try {
        const saved = JSON.parse(credentials.refresh);
        if (saved.gcloudPath) gcloudPath = saved.gcloudPath;
        if (saved.project) process.env.VERTEX_PROJECT_ID = saved.project;
        if (saved.region) process.env.VERTEX_REGION = saved.region;
    } catch {}
    
    const token = execSync(`${gcloudPath} auth print-access-token`, {
        encoding: "utf-8",
        timeout: 5000,
    }).trim();
    return token;
}
```

### 3. **Storing Config in credentials.refresh**

We're storing `{ project, region, gcloudPath }` as JSON in `credentials.refresh`, which is meant for refresh tokens.

**Better Approach**: Use process.env consistently since Pi loads extensions fresh each time:
- Keep environment variables as the source of truth
- Only use credentials to verify auth works
- Don't try to persist config in auth.json

**Simpler Fix**:
```typescript
async login(callbacks) {
    // ... setup flow ...
    
    // Save for this session
    process.env.VERTEX_PROJECT_ID = project;
    process.env.VERTEX_REGION = region;
    
    // Return simple credentials (gcloud auth is persistent)
    return {
        refresh: "gcloud",
        access: "gcloud",  
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    };
}

getApiKey(_credentials) {
    const token = execSync(`${config.gcloudPath} auth print-access-token`, {
        encoding: "utf-8",
        timeout: 5000,
    }).trim();
    return token;
}
```

### 4. **Model-Level Config Override**

We support per-model config overrides:
```typescript
const project = (model as any).project || config.project;
```

This is good, but not documented for users. Should we remove this complexity?

### 5. **Missing transformMessages Import**

The `transformMessages` function is not exported from `@mariozechner/pi-ai`, so we implemented it ourselves. This is correct, but we should note it in comments.

## 🎯 Recommended Changes

### Priority 1: Fix getApiKey()

```typescript
getApiKey(_credentials) {
    try {
        const gcloudPath = findGcloud(); // or from config
        const token = execSync(`${gcloudPath} auth print-access-token`, {
            encoding: "utf-8",
            timeout: 5000,
            stdio: ["ignore", "pipe", "pipe"],
        }).trim();
        
        if (!token || token.length < 20) {
            throw new Error("Invalid token from gcloud");
        }
        
        return token;
    } catch (error) {
        throw new Error(`Failed to get gcloud token: ${error.message}`);
    }
}
```

### Priority 2: Simplify Credentials

Don't try to save project/region in credentials. Keep env vars as source of truth:

```typescript
// In login()
return {
    refresh: Date.now().toString(), // Just a timestamp
    access: "gcloud",
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
};

// In refreshToken()
return {
    ...credentials,
    refresh: Date.now().toString(),
};
```

### Priority 3: Add Error Context

When /login shows the final success message, include instructions for what to do if it doesn't work:

```typescript
callbacks.onAuth({
    type: "success",
    message: `✓ Configured successfully!\n\n` +
        `Project: ${project}\n` +
        `Region: ${region}\n\n` +
        `To persist these settings, add to your shell config:\n\n` +
        `  export VERTEX_PROJECT_ID="${project}"\n` +
        `  export VERTEX_REGION="${region}"\n\n` +
        `If authentication fails, run: gcloud auth login`,
});
```

## 📋 Best Practices We're Following

1. ✅ Extension in `~/.pi/agent/extensions/vertex-anthropic/`
2. ✅ Package structure with package.json and dependencies
3. ✅ Default export function receiving `ExtensionAPI`
4. ✅ TypeScript with proper imports from pi packages
5. ✅ Detailed OAuth flow with progress messages
6. ✅ Proper event stream implementation
7. ✅ Error handling throughout
8. ✅ Interactive setup instead of manual config
9. ✅ Install script for easy setup
10. ✅ Comprehensive documentation

## 🚀 User Experience Score

**Current**: 9/10
- Interactive /login that does everything ✅
- Clear progress messages ✅
- Helpful error messages ✅
- Auto-detection of gcloud ✅
- Region selection including global ✅
- API enablement ✅

**With Fixes**: 10/10
- Proper token handling
- Better credential management
- Simpler architecture

## Summary

The extension is **95% correct** and follows Pi's patterns well. The main issue is the `getApiKey()` implementation - it should return the actual token, not a command string. Once that's fixed, everything should work perfectly.

The interactive `/login` flow is excellent and goes beyond what most extensions do!
