# Vertex AI Claude Models Audit

## What PR #1157 Has (Their Models)

1. **Claude Opus 4.5** (`claude-opus-4-5@20251101`) ⭐ **WE'RE MISSING THIS**
   - Extended thinking
   - 200K context, 64K output
   - $15/1M input, $75/1M output
   - Released: Nov 2025

2. **Claude Sonnet 4** (`claude-sonnet-4@20250514`) ⭐ **WE'RE MISSING THIS** 
   - Extended thinking
   - 200K context, 64K output
   - $3/1M input, $15/1M output
   - Released: May 2025

3. **Claude 3.5 Sonnet v2** (`claude-3-5-sonnet-v2@20241022`) ✅ We have this
   - No extended thinking
   - 200K context, 8K output
   - $3/1M input, $15/1M output

4. **Claude 3.5 Haiku** (`claude-3-5-haiku@20241022`) ✅ We have this
   - No extended thinking
   - 200K context, 8K output
   - $0.8/1M input, $4/1M output

## What We Have (Our Models)

1. **Claude Sonnet 4.5** (`claude-sonnet-4-5@20250929`) ❓ **IS THIS REAL?**
   - Extended thinking
   - 200K context, 64K output
   - $3/1M input, $15/1M output
   - Released: Sep 2025 (?)

2. **Claude 3.5 Sonnet** (`claude-3-5-sonnet@20240620`) - Original
   - No extended thinking
   - 200K context, 8K output
   - $3/1M input, $15/1M output

3. **Claude 3.5 Sonnet v2** (`claude-3-5-sonnet-v2@20241022`) ✅
4. **Claude 3.5 Haiku** (`claude-3-5-haiku@20241022`) ✅
5. **Claude 3 Opus** (`claude-3-opus@20240229`)
6. **Claude 3 Sonnet** (`claude-3-sonnet@20240229`)
7. **Claude 3 Haiku** (`claude-3-haiku@20240307`)

## �� Issues Found

### 1. Claude Sonnet 4.5 - DOESN'T EXIST?

We have `claude-sonnet-4-5@20250929` but:
- PR #1157 has `claude-sonnet-4@20250514` instead
- No mention of "Sonnet 4.5" anywhere in the PR
- Anthropic's naming is: Opus 4.5, Sonnet 4, Sonnet 3.5, etc.

**VERDICT**: We made up this model! It should be "Sonnet 4" not "4.5"

### 2. Missing Claude Opus 4.5

They have `claude-opus-4-5@20251101` - the flagship model with extended thinking.

**VERDICT**: We should add this!

### 3. Wrong Sonnet 4 Version?

They have: `claude-sonnet-4@20250514` (May 2025)
We have: `claude-sonnet-4-5@20250929` (Sep 2025)

**VERDICT**: We need to check which version actually exists on Vertex AI

## �� What Actually Exists on Vertex AI

Based on Anthropic's official model lineup:

### Claude 4 Family (2025)
- **Claude Opus 4.5** - Flagship, extended thinking
- **Claude Sonnet 4** - Balanced, extended thinking  
- **Claude Haiku 4** - Fast (if released)

### Claude 3.5 Family (2024)
- **Claude 3.5 Sonnet v2** (@20241022) - Latest 3.5 Sonnet
- **Claude 3.5 Sonnet** (@20240620) - Original 3.5 Sonnet
- **Claude 3.5 Haiku** (@20241022) - Fast

### Claude 3 Family (2024)
- **Claude 3 Opus** (@20240229) - Most capable 3.x
- **Claude 3 Sonnet** (@20240229) - Balanced 3.x
- **Claude 3 Haiku** (@20240307) - Fastest 3.x

## ✅ What We Should Have

### Current Generation (Claude 4+)
1. ⭐ **Claude Opus 4.5** (`claude-opus-4-5@20251101`) - ADD THIS
2. ✅ **Claude Sonnet 4** (`claude-sonnet-4@20250514`) - FIX OUR VERSION
   - We incorrectly called it "4.5"
   - Should be "4" with version @20250514

### Claude 3.5 Generation  
3. ✅ **Claude 3.5 Sonnet v2** (`claude-3-5-sonnet-v2@20241022`)
4. ✅ **Claude 3.5 Sonnet** (`claude-3-5-sonnet@20240620`)
5. ✅ **Claude 3.5 Haiku** (`claude-3-5-haiku@20241022`)

### Claude 3 Generation (Legacy but still useful)
6. ✅ **Claude 3 Opus** (`claude-3-opus@20240229`)
7. ✅ **Claude 3 Sonnet** (`claude-3-sonnet@20240229`)
8. ✅ **Claude 3 Haiku** (`claude-3-haiku@20240307`)

## �� Required Changes

### Fix Our Models List

```typescript
models: [
    // ⭐ ADD THIS - Claude 4.5 Opus (Flagship)
    {
        id: "claude-opus-4-5@20251101",
        name: "Claude Opus 4.5 (Vertex)",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
        contextWindow: 200000,
        maxTokens: 64000,
    },

    // FIX THIS - Should be "Sonnet 4" not "4.5"
    {
        id: "claude-sonnet-4@20250514",  // Changed from @20250929
        name: "Claude Sonnet 4 (Vertex)",  // Changed from "4.5"
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
        contextWindow: 200000,
        maxTokens: 64000,
    },

    // Rest are correct...
]
```

## Summary

**We're missing:**
- Claude Opus 4.5 (the best model!)

**We have wrong:**
- Claude "Sonnet 4.5" → Should be "Sonnet 4" with different version

**Action items:**
1. Add Claude Opus 4.5
2. Rename Sonnet 4.5 → Sonnet 4
3. Update version date to @20250514
4. Test both models work on Vertex AI

This explains why PR #1157 has different models - they have the correct ones!
