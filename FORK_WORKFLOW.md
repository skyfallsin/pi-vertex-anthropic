# How to Fork PR #1157 and Add Features

## Option 1: Collaborate Directly (Best)

1. **Comment on PR #1157 first:**
   ```markdown
   Hey @michaelpersonal! Great work on this PR. I've been working on a similar 
   extension and have some improvements:
   
   1. Interactive OAuth setup (full /login wizard)
   2. Global region support fix
   3. Claude Sonnet 4.5 (latest model - you have Sonnet 4)
   4. Additional Claude 3.x models
   
   Would you like me to:
   - Add these to your PR branch?
   - Create a separate PR that builds on yours?
   - Share code for you to integrate?
   
   Let me know what works best!
   ```

2. **If they say yes to collaboration:**
   - Fork their branch
   - Add your changes
   - Create PR to their fork
   - They merge your changes
   - Their PR gets all the improvements

## Option 2: Fork Pi-Mono and Extend Their PR

```bash
# 1. Fork badlogic/pi-mono on GitHub (click Fork button)
#    Creates: yourusername/pi-mono

# 2. Clone your fork
git clone https://github.com/yourusername/pi-mono.git
cd pi-mono

# 3. Add upstream remote
git remote add upstream https://github.com/badlogic/pi-mono.git

# 4. Fetch PR #1157
git fetch upstream pull/1157/head:pr-1157

# 5. Create your branch based on their PR
git checkout -b feat/anthropic-vertex-enhanced pr-1157

# 6. Add your improvements
# - Copy OAuth code from our extension
# - Fix global region
# - Add Sonnet 4.5
# - Add Claude 3.x models

# 7. Commit your changes
git add -A
git commit -m "feat: add OAuth setup, global region, Sonnet 4.5, more models"

# 8. Push to your fork
git push origin feat/anthropic-vertex-enhanced

# 9. Create PR on GitHub
# - Go to https://github.com/badlogic/pi-mono
# - Click "Compare & pull request"
# - Title: "feat(ai): extend Vertex AI provider with OAuth and more models"
# - Reference PR #1157 in description
```

## Option 3: Independent PR (Alternative)

If PR #1157 is slow or you want full control:

```bash
# 1. Fork and clone as above

# 2. Create branch from main
git checkout main
git checkout -b feat/anthropic-vertex-complete

# 3. Take the best from both:
#    - Their provider implementation (ADC support)
#    - Your OAuth setup (interactive login)
#    - All models (Opus 4.5, Sonnet 4.5, 3.5, 3.x)
#    - Global region support

# 4. Create standalone PR
```

## What to Contribute

### Priority 1: OAuth Interactive Setup

Create `packages/ai/src/providers/anthropic-vertex.ts` OAuth config:

```typescript
export const anthropicVertexProvider = {
    // ... existing provider code ...
    
    oauth: {
        async login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
            // Your interactive setup flow from our extension
            // 1. Check/install gcloud
            // 2. gcloud auth login
            // 3. Select project
            // 4. Select region
            // 5. Enable API
            // 6. Test connection
            
            return {
                refresh: "gcloud",
                access: "gcloud",
                expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
            };
        },
        
        async refreshToken(creds) {
            return creds; // gcloud handles refresh
        },
        
        getApiKey(_creds) {
            // Get token from gcloud
            const token = execSync('gcloud auth print-access-token', {
                encoding: 'utf-8',
                timeout: 5000,
            }).trim();
            return token;
        },
    },
};
```

### Priority 2: Fix Global Region

```typescript
// In packages/ai/src/providers/anthropic-vertex.ts
function getEndpoint(location: string): string {
    return location === "global"
        ? "https://aiplatform.googleapis.com"
        : `https://${location}-aiplatform.googleapis.com`;
}
```

### Priority 3: Update Models

```typescript
// In packages/ai/scripts/generate-models.ts
const anthropicVertexModels: Model<"anthropic-vertex">[] = [
    // Update Sonnet 4 → Sonnet 4.5
    {
        id: "claude-sonnet-4-5@20250929",  // NOT @20250514
        name: "Claude Sonnet 4.5 (Vertex)", // NOT "4"
        // ... rest same
    },
    
    // Add Claude 3.5 Sonnet original
    {
        id: "claude-3-5-sonnet@20240620",
        name: "Claude 3.5 Sonnet (Vertex)",
        // ...
    },
    
    // Add Claude 3 family
    // ... Opus, Sonnet, Haiku
];
```

## Recommended Workflow

### Step 1: Comment First (Always)
Leave a friendly comment on PR #1157 offering to help. Include:
- What you want to add (OAuth, global region, models)
- That you have working code already
- Ask if they want collaboration

### Step 2: Wait for Response (24-48 hours)
- If **yes**: Collaborate on their PR
- If **no response**: Create your own PR after 48h
- If **no**: Create independent PR

### Step 3: Create PR
Either:
- **PR to their fork** (if collaborating)
- **PR to badlogic/pi-mono** (if independent)

### Step 4: Reference PR #1157
In your PR description:
```markdown
## Summary

This PR extends #1157 with additional features:

1. **Interactive OAuth setup** - Full /login wizard
2. **Global region support** - Fixes endpoint for global region
3. **Claude Sonnet 4.5** - Latest model (not just Sonnet 4)
4. **Additional models** - All Claude 3.5 and 3.x models

Builds on @michaelpersonal's excellent work in #1157.

## Testing
- [ ] OAuth login flow works
- [ ] Global region connects properly
- [ ] All 8 models accessible
- [ ] Existing tests still pass
```

## Testing Your PR Locally

```bash
# In your pi-mono fork
cd packages/ai
npm install
npm run build

# Test with pi coding agent
cd ../coding-agent
npm install
npm run build

# Link locally
npm link

# Test in a separate terminal
pi --provider anthropic-vertex --model claude-sonnet-4-5@20250929
/login  # Test your OAuth flow
```

## PR Checklist

Before submitting:
- [ ] All tests pass: `npm test`
- [ ] Code builds: `npm run build`
- [ ] Updated CHANGELOG.md
- [ ] Added/updated tests for new features
- [ ] Tested with real Vertex AI account
- [ ] Documentation updated (docs/providers.md)
- [ ] No breaking changes (or clearly documented)

## If PR #1157 Merges First

If their PR merges before yours:
```bash
# Update your branch
git fetch upstream
git rebase upstream/main

# Resolve conflicts
# - Their code is now in main
# - Your OAuth additions are on top
# - Models update is easy merge

# Force push (after rebase)
git push --force-with-lease
```

## Summary

**Best approach:**
1. ✅ Comment on PR #1157 offering to help
2. ✅ If they want collaboration, work together
3. ✅ If not, create your own PR after 48h
4. ✅ Either way, reference their work
5. ✅ Both PRs make Pi better!

Your OAuth setup is the unique value - that alone is worth contributing!
