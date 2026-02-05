# 🦀 ScuttleBox

**A starter workspace for OpenClaw agents.**

ScuttleBox gives your AI agent a place to live — with personality files, memory, and workspace conventions that make your assistant feel like *someone* rather than just *something*.

## What's Inside

```
scuttlebox/
├── AGENTS.md      # How your agent should behave
├── SOUL.md        # Personality and tone
├── IDENTITY.md    # Name, emoji, vibe
├── USER.md        # About you (the human)
├── TOOLS.md       # Local tool notes
├── HEARTBEAT.md   # Periodic check-in tasks
├── MEMORY.md      # Long-term curated memory
└── memory/        # Daily session logs
```

## Quick Start

1. **Copy to your OpenClaw workspace:**
   ```bash
   cp -r scuttlebox/* ~/.openclaw/workspace/
   ```

2. **Edit `IDENTITY.md`** — give your agent a name and emoji

3. **Edit `USER.md`** — tell it about yourself

4. **Start chatting** — your agent will fill in the rest

## The Files

### `IDENTITY.md`
Your agent's self-concept. Name, creature type, vibe, signature emoji.

### `SOUL.md`  
Personality guidelines. How to behave, what to avoid, the overall tone.

### `AGENTS.md`
Operational instructions. Memory conventions, safety rules, when to speak vs stay quiet.

### `USER.md`
Info about you. Name, timezone, preferences. Helps your agent personalize.

### `TOOLS.md`
Local notes for tools — camera names, SSH hosts, voice preferences. Your agent's cheat sheet.

### `HEARTBEAT.md`
Tasks to check periodically. Leave empty to skip heartbeat processing.

### `MEMORY.md`
Curated long-term memory. Your agent reviews daily logs and distills what matters here.

## Philosophy

ScuttleBox embraces a simple idea: **AI assistants work better when they have context about who they are and who they're helping.**

These aren't just config files — they're the foundation of a relationship.

## License

MIT — do whatever you want with it.

---

*Named after the way crabs move: quick, lateral, always finding a way.* 🦀
