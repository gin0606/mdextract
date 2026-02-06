# mdrun

A CLI tool that executes code blocks from Markdown files. Makes development setup easier and keeps README maintained.

## Install

```bash
npm install -g @gin0606/mdrun
```

## Usage

```bash
# Execute all code blocks
mdrun README.md

# Execute code blocks in a specific section
mdrun README.md --section "Setup"
mdrun README.md -s "Project/Setup/Database"

# List sections
mdrun README.md --list

# Preview code blocks without executing
mdrun README.md --dry-run
mdrun README.md -s "Setup" --dry-run
```

### Options

| Option          | Description                                    |
| --------------- | ---------------------------------------------- |
| `-s, --section` | Section path to execute                        |
| `-l, --list`    | List sections (no execution)                   |
| `-n, --dry-run` | Show code blocks to be executed (no execution) |
| `-h, --help`    | Show help                                      |
| `-v, --version` | Show version                                   |

## Shell Completion

### Bash

```bash
mdrun completion >> ~/.bashrc
```

### Zsh

```bash
mdrun completion >> ~/.zshrc
```

### Fish

```fish
mdrun completion --fish > ~/.config/fish/completions/mdrun.fish
```

## Development

### Setup

You can also run `mdrun README.md -s mdrun/Development/Setup` to install dependencies and build in one go.

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

You can also run `mdrun README.md -s mdrun/Development` to execute all the development tasks above in order.
