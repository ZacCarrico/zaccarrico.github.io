Claude Code stores user-level configuration in `~/.claude`, but there's no built-in way to sync this across machines or share a baseline config with your team. Anthropic's managed settings solution exists, but it overrides your preferences entirely rather than merging with them.

The fix is simple: turn `~/.claude` into a git repo.

## What You Can Share

- **CLAUDE.md** — Instructions and context Claude loads at startup
- **settings.json** — Permissions, environment variables, and tool behavior
- **commands/** — Custom slash commands (invoked with `/command-name`)
- **MCP server configs** — Additional tools and integrations

These files merge with any project-level `.claude/` directory, with project settings taking precedence.

## Setup

This script initializes `~/.claude` as a git repo and pulls your shared config. Existing files are backed up, not overwritten.

```bash
cd ~/.claude
ts="$(date +%Y%m%d_%H%M%S)"
backup_dir="old_files_$ts"
mkdir -p "$backup_dir"

git init
git remote add origin https://github.com/yourusername/claude-home.git
git fetch origin

# Back up any conflicting files
git checkout main 2>&1 | grep "^[[:space:]]" | xargs -r -I {} mv "{}" "$backup_dir/"

git reset --hard origin/main
git branch --set-upstream-to=origin/main main
```

## The .gitignore Trick

Since `~/.claude` contains session data and other generated files, the `.gitignore` uses an inverted pattern — ignore everything, then explicitly track only what you want:

```
# Ignore everything
*

# Track these files
!.gitignore
!README.md
!AGENTS.md
!CLAUDE.md
!settings.json

# Track specific commands
!commands/
commands/*
!commands/linear-create.md
```

This keeps your repo clean while letting you selectively version the files that matter.
