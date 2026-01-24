Motivation
We need a way to standardize and share context and permissions accross all you Claude Code sessions. 
What this solves
* There's no way to keep the same Claude Code home dir (~/.claude) across computers
* Sharing and git tracking user-level scoped Claude Code configurations
* The current Anthropic solution to standardizing is heavy-handed. It overrides, rather
 than provides a baseline

How it solves this problem
* Create a GitHub repo for the files you want to share
* The key files are settings.json, CLAUDE.md, .gitignore

To allow people to update their Claude Code home dir, you can run these commands.
Note: RUNNING THE FOLLOWING COMMAND WILL REPLACE SPECIFIC FILES IN ~/.claude WITH THE FILES IN THIS REPO. It copies the duplicate files in ~/.claude into \~/.claude/old_files/ so it's non-destructive.

Run these commands to clone this repo.

```bash
cd ~/.claude  # this assumes you've already installed Claude Code
# suffix old_files with a timestamp
ts="$(date +%Y%m%d_%H%M%S)"
backup_dir="old_files_$ts"
mkdir -p "$backup_dir"

git init
git remote add origin {claude-home-repo}
git fetch origin

# move local files with the same name as those in the remote repo to $backup_dir/
git checkout main 2>&1 | grep "^[[:space:]]" | xargs -r -I {} mv "{}" "$backup_dir/"

git reset --hard origin/main
git branch --set-upstream-to=origin/main main
```
The files in this repo are merged with files in a specific project repo's .claude/.

Key points about the Claude Code configuration system
Memory files (CLAUDE.md): Contain instructions and context that Claude loads at startup
Settings files (JSON): Configure permissions, environment variables, and tool behavior
Inheritance: Settings are merged. If the same settings are in both the home dir and project dir, the project dir's settings override the home dir's
Slash commands: Custom commands that can be invoked during a session with /command-name
MCP servers: Extend Claude Code with additional tools and integrations


This .gitignore is unusual --- we ignore everything and then add back the files we want to commit.
```
# ignore everything in this dir
*

# track these files
!.gitignore
!README.md
!AGENTS.md
!CLAUDE.md
!settings.json

# track commands directory and specific files within it
!commands/
commands/*
!commands/linear-create.md
```

The README
