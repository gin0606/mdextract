# mdrun

A toolkit for extracting and executing code blocks from Markdown files. Makes development setup easier and keeps README maintained.

- **mdextract** — Extract sections from Markdown files to stdout
- **mdrun** — Read Markdown from stdin and execute code blocks via [zx](https://google.github.io/zx/)

## Install

```bash
npm install -g @gin0606/mdrun
```

## Usage

### mdextract

```bash
# Extract all code blocks as Markdown
mdextract README.md

# Extract a specific section
mdextract README.md -s "Development/Setup"

# List sections
mdextract README.md --list

# Preview code blocks without output
mdextract README.md --dry-run
mdextract README.md -s "Setup" --dry-run
```

#### Options

| Option          | Description                  |
| --------------- | ---------------------------- |
| `-s, --section` | Section path to extract      |
| `-l, --list`    | List sections                |
| `-n, --dry-run` | Show code blocks (no output) |
| `-h, --help`    | Show help                    |
| `-v, --version` | Show version                 |

### mdrun

`mdrun` reads Markdown from stdin and executes code blocks using zx.

```bash
# Pipe mdextract output to mdrun
mdextract README.md -s "Development/Setup" | mdrun

# Execute all code blocks
mdextract README.md | mdrun
```

### Supported Code Blocks

mdrun uses [zx](https://google.github.io/zx/) to execute Markdown files. The following code block languages are supported:

| Language tag                  | Execution          |
| ----------------------------- | ------------------ |
| `js`, `javascript`            | Runs as JavaScript |
| `ts`, `typescript`            | Runs as TypeScript |
| `bash`, `sh`, `shell`         | Runs as shell      |
| No language tag / other langs | Skipped            |

## Shell Completion

### Bash

```bash
mdextract completion >> ~/.bashrc
```

### Zsh

```bash
mdextract completion >> ~/.zshrc
```

### Fish

```fish
mdextract completion --fish > ~/.config/fish/completions/mdextract.fish
```

## Development

### Setup

You can also run `mdextract README.md -s mdrun/Development/Setup | mdrun` to install dependencies and build in one go.

#### Install Dependencies

```bash
pnpm install
```

#### Build

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Type Check

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

### Format

```bash
pnpm fmt:check
```

You can also run `mdextract README.md -s mdrun/Development | mdrun` to execute all the development tasks above in order.
