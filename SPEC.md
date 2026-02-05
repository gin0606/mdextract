# mdrun Specification

A CLI tool that executes code blocks from README.md.
Makes development setup easier and keeps README maintained.

## Overview

- Parse Markdown files with `remark-parse`
- Execute code blocks under specified sections with `google/zx`
- Filter by heading structure using path notation

## CLI Interface

```bash
mdrun <file> [section-path] [options]
```

### Arguments

| Argument       | Required | Description                                       |
| -------------- | -------- | ------------------------------------------------- |
| `file`         | Yes      | Target Markdown file                              |
| `section-path` | No       | Section path to execute (all sections if omitted) |

### Options

| Option            | Description                                    |
| ----------------- | ---------------------------------------------- |
| `--list`, `-l`    | List sections (no execution)                   |
| `--dry-run`, `-n` | Show code blocks to be executed (no execution) |
| `--help`, `-h`    | Show help                                      |
| `--version`, `-v` | Show version                                   |

### Examples

```bash
# List sections
mdrun README.md --list

# Execute code blocks in "Setup" section
mdrun README.md "Setup"

# Specify nested section
mdrun README.md "Setup/Database"

# Preview with dry-run
mdrun README.md "Setup" --dry-run

# Execute all code blocks (no section specified)
mdrun README.md
```

## Section Path Specification

### Path Format

- Use `/` to separate nested headings
- Heading level (`#` count) does not matter
- Searches by exact match of heading text

### Example

```markdown
# Project

## Setup

### Database

`​``bash
createdb myapp
`​``

### Redis

`​``bash
redis-server
`​``

## Development

`​``bash
npm run dev
`​``
```

For the above Markdown:

| Command                                    | Code blocks executed                      |
| ------------------------------------------ | ----------------------------------------- |
| `mdrun README.md`                          | All (createdb, redis-server, npm run dev) |
| `mdrun README.md "Project/Setup"`          | createdb, redis-server                    |
| `mdrun README.md "Project/Setup/Database"` | createdb                                  |
| `mdrun README.md "Project/Development"`    | npm run dev                               |

**Note**: Section path requires exact match. `"Setup"` does not match `"Project/Setup"`.

### List Output

Output format with `--list` option:

```
$ mdrun README.md --list

Sections:
  Project
  Project/Setup
  Project/Setup/Database
  Project/Setup/Redis
  Project/Development
```

## Code Block Execution

### Supported Languages

Executes code blocks supported by `google/zx`:

- `bash`, `sh`, `zsh` - Shell scripts
- `javascript`, `js` - JavaScript (with zx API available)
- No language specified - Follows zx default behavior
- Other languages supported by zx

### Execution Order

Code blocks within a section are executed in order of appearance in Markdown.

### Error Handling

Follows `google/zx` default behavior (throws exception on command failure).

## Dry-run Output

Output format with `--dry-run` option:

```
$ mdrun README.md "Setup" --dry-run

Section: Setup/Database
Language: bash
---
createdb myapp
---

Section: Setup/Redis
Language: bash
---
redis-server
---
```

## Tech Stack

- **Language**: TypeScript
- **Markdown Parser**: remark-parse (unified)
- **Code Execution**: google/zx
- **CLI Framework**: yargs
