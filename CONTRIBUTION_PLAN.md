# What to Contribute to PR #1157

## �� Current State of PR #1157

**What they have:**
- Built-in `anthropic-vertex` provider using Google Auth ADC
- 4 models: Opus 4.5, Sonnet 4, 3.5 Sonnet v2, 3.5 Haiku
- Uses `google-auth-library` for authentication
- Requires env vars: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`
- Shared utilities extracted to `anthropic-shared.ts`
- Comprehensive test suite

**What they're missing:**
- Interactive setup (relies on manual env var configuration)
- Global region support
- Additional models (3.5 Sonnet original, 3 Opus, 3 Sonnet, 3 Haiku)
- User-friendly error messages
- OAuth/login integration

## ✅ What We Should Contribute

### 1. **OAuth Provider for Interactive Setup** (HIGHEST VALUE)

Add an OAuth provider that does the interactive setup:

```typescript
// In packages/ai/src/utils/oauth/anthropic-vertex.ts
export async function loginAnthropicVertex(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
    // Check for gcloud
    // Run gcloud auth login if needed
    // Help select project
    // Select region
    // Enable Vertex AI API
    // Test authentication
    // Return credentials
}
```

**Why this matters:**
- Makes Vertex AI accessible to non-technical users
- No manual env var setup
- Guides users through the entire process
- Integrates with Pi's `/login` command

**Files to add:**
- `packages/ai/src/utils/oauth/anthropic-vertex.ts`
- Update `packages/ai/src/providers/anthropic-vertex.ts` to add `oauth` config

### 2. **Global Region Support** (MEDIUM VALUE)

Fix the endpoint to support `global` region:

```typescript
// Current in PR:
const endpoint = `https://${location}-aiplatform.googleapis.com`;

// Should be:
const endpoint = location === "global" 
    ? "https://aiplatform.googleapis.com"
    : `https://${location}-aiplatform.googleapis.com`;
```

**Why this matters:**
- `global` is recommended by Google for latest models
- Their current code will fail with `global` region

**Files to modify:**
- `packages/ai/src/providers/anthropic-vertex.ts` - Fix endpoint construction

### 3. **Additional Models** (LOW VALUE - Easy Win)

Add the 3 missing Claude models:

```typescript
{
    id: "claude-3-5-sonnet@20240620",
    name: "Claude 3.5 Sonnet (Vertex)",
    // ... (they already have the pattern)
},
{
    id: "claude-3-opus@20240229",
    name: "Claude 3 Opus (Vertex)",
    // ...
},
{
    id: "claude-3-sonnet@20240229",
    name: "Claude 3 Sonnet (Vertex)",
    // ...
},
{
    id: "claude-3-haiku@20240307",
    name: "Claude 3 Haiku (Vertex)",
    // ...
}
```

**Why this matters:**
- Users want access to all available models
- Opus and older Sonnet are still valuable for certain tasks
- Trivial to add, high user value

**Files to modify:**
- `packages/ai/scripts/generate-models.ts`

### 4. **Better Error Messages** (LOW VALUE)

Improve error messages with actionable remediation:

```typescript
// When project not set:
throw new Error(
    "GCP project not configured.\n\n" +
    "Set one of:\n" +
    "  - GOOGLE_CLOUD_PROJECT environment variable\n" +
    "  - ANTHROPIC_VERTEX_PROJECT_ID environment variable\n" +
    "Or use: pi /login anthropic-vertex"
);

// When ADC not configured:
throw new Error(
    "Google Cloud credentials not found.\n\n" +
    "Run: gcloud auth application-default login\n" +
    "Or use: pi /login anthropic-vertex"
);
```

**Files to modify:**
- `packages/ai/src/providers/anthropic-vertex.ts` - Error messages

### 5. **Alternative: `gcloud auth` Support** (OPTIONAL)

Add support for both ADC and regular `gcloud auth`:

```typescript
// Try ADC first, fall back to gcloud auth print-access-token
async function getAuthToken(): Promise<string> {
    try {
        // Try ADC (existing code)
        const auth = new GoogleAuth({ scopes: [...] });
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        if (token.token) return token.token;
    } catch {
        // Fall back to gcloud CLI auth
        try {
            const { execSync } = require('child_process');
            const token = execSync('gcloud auth print-access-token', {
                encoding: 'utf-8',
                timeout: 5000,
            }).trim();
            if (token && token.length > 20) return token;
        } catch {}
    }
    throw new Error("No valid credentials found");
}
```

**Why this matters:**
- ADC is better for service accounts / production
- gcloud auth is better for personal use
- Supporting both gives users flexibility

## �� Recommended Contribution Priority

### Must-Have (Would Significantly Improve PR):

1. ✅ **OAuth interactive setup** - This is our killer feature
2. ✅ **Global region support** - Fixes a bug in their implementation

### Nice-to-Have (Easy wins):

3. ✅ **Additional models** - 5 minute change
4. ✅ **Better error messages** - 10 minute change

### Optional (Adds complexity):

5. ❓ **Dual auth support** - Only if there's demand

## �� Implementation Plan

### Step 1: Fork and Branch
```bash
git clone https://github.com/badlogic/pi-mono.git
cd pi-mono
git checkout -b feat/anthropic-vertex-oauth
git fetch origin pull/1157/head:pr-1157
git merge pr-1157
```

### Step 2: Add OAuth Provider
```bash
# Create OAuth implementation
touch packages/ai/src/utils/oauth/anthropic-vertex.ts

# Modify provider to add oauth config
# Edit packages/ai/src/providers/anthropic-vertex.ts
```

### Step 3: Fix Global Region
```bash
# Edit packages/ai/src/providers/anthropic-vertex.ts
# Update endpoint construction
```

### Step 4: Add Models
```bash
# Edit packages/ai/scripts/generate-models.ts
# Add 4 missing models
```

### Step 5: Test
```bash
npm run build
npm test
# Test with real Vertex AI account
```

### Step 6: Create PR
- Either comment on PR #1157 suggesting these improvements
- Or create a separate PR that builds on #1157
- Or offer to collaborate directly with @michaelpersonal

## �� Sample Comment for PR #1157

```markdown
Great work on the Vertex AI provider! I've been working on a similar implementation and have a few suggestions that might improve the user experience:

**1. Interactive OAuth Setup**
Instead of requiring users to manually set env vars, we could add an OAuth provider that:
- Guides users through `gcloud auth login`
- Helps select/configure the GCP project
- Selects the region interactively
- Enables the Vertex AI API if needed

I have a working implementation that integrates with Pi's `/login` command. Would you be interested in incorporating this?

**2. Global Region Support**
The current endpoint construction doesn't handle the `global` region correctly. It should be:
\`\`\`typescript
const endpoint = location === "global" 
    ? "https://aiplatform.googleapis.com"
    : `https://${location}-aiplatform.googleapis.com`;
\`\`\`

**3. Additional Models**
You could also add:
- Claude 3.5 Sonnet (original - `claude-3-5-sonnet@20240620`)
- Claude 3 Opus (`claude-3-opus@20240229`)
- Claude 3 Sonnet (`claude-3-sonnet@20240229`)
- Claude 3 Haiku (`claude-3-haiku@20240307`)

Happy to submit these changes if you'd like! Let me know if you want to collaborate.
```

## �� Our Extension vs Contributing

### Keep Extension As-Is If:
- You want to ship now (PR might take weeks to merge)
- You prefer the `gcloud auth` approach over ADC
- You want to iterate quickly
- You like being independent of Pi release cycles

### Contribute to PR If:
- You want maximum reach (all Pi users)
- You're okay with waiting for review/merge
- You want Pi team to maintain it
- You prefer the "official" approach

### Best of Both Worlds:
- Keep our extension for users who want it now
- Contribute OAuth setup to PR #1157
- Once merged, our extension can optionally be deprecated
- Users get to choose their preferred approach

## My Recommendation

**Comment on PR #1157 with offer to help**, focusing on:
1. OAuth interactive setup (our unique value)
2. Global region fix (bug fix)
3. Additional models (easy win)

Then see if @michaelpersonal wants to collaborate. If yes, contribute the code. If no or slow response, keep shipping our extension.

Our extension remains valuable either way as a "batteries included" alternative.
