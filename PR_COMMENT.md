# Comment for PR #1157

Hey @michaelpersonal! Great work on the Vertex AI provider. I've been working on a similar extension and would love to collaborate.

## What I Built

**Repository:** https://github.com/skyfallsin/pi-vertex-anthropic

I created a Pi extension with several features that might enhance your PR:

### 1. Interactive OAuth `/login` Setup
Full wizard that handles everything:
- Checks for gcloud (offers install help)
- Runs `gcloud auth login` if needed
- Lists projects → helps user select
- Interactive region selection (including `global`)
- Enables Vertex AI API automatically
- Tests authentication

**UX:** Users just run `/login` instead of manually setting env vars.

### 2. Global Region Support
Your current endpoint construction will fail with `location="global"`:
```typescript
// Current (breaks):
const endpoint = `https://${location}-aiplatform.googleapis.com`;

// Should be:
const endpoint = location === "global"
    ? "https://aiplatform.googleapis.com"
    : `https://${location}-aiplatform.googleapis.com`;
```

### 3. Latest Model - Claude Sonnet 4.5
You have `claude-sonnet-4@20250514`, but the latest is actually:
- `claude-sonnet-4-5@20250929` (Sonnet **4.5**, not 4)

### 4. Additional Models
- Claude 3.5 Sonnet original (`@20240620`)
- Claude 3 Opus, Sonnet, Haiku

## Proposal

I'm happy to:
1. **Fork your PR branch** and add these features
2. **Submit for your review** before you merge to main
3. **Keep it modular** so you can pick what you want

Or if you prefer, I can:
- Create a follow-up PR after yours merges
- Share code snippets for you to integrate
- Keep it as a separate extension

Let me know what works best! Your ADC integration is solid, and combining it with the interactive setup would give users the best of both worlds.

---

**Live extension:** `curl -fsSL https://raw.githubusercontent.com/skyfallsin/pi-vertex-anthropic/main/install.sh | bash`

Looking forward to collaborating!
