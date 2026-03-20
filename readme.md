# env2args-cli

[![npm version](https://img.shields.io/npm/v/@kszongic/env2args-cli)](https://www.npmjs.com/package/@kszongic/env2args-cli)
[![license](https://img.shields.io/npm/l/@kszongic/env2args-cli)](./LICENSE)

Convert `.env` files or environment variable definitions into command-line arguments. Zero dependencies.

## Install

```bash
npm install -g @kszongic/env2args-cli
```

## Usage

```bash
# Basic: convert .env to --key value flags
env2args .env
# PORT=3000 → --PORT 3000
# HOST=localhost → --HOST localhost

# Pipe from stdin
echo "PORT=3000\nHOST=localhost" | env2args

# Kebab-case keys (UPPER_SNAKE → kebab)
env2args --kebab .env
# DATABASE_URL=... → --database-url ...

# Filter by prefix (prefix is stripped)
env2args --prefix APP_ .env
# APP_PORT=3000 → --PORT 3000

# Docker format
env2args --format docker .env
# -e PORT=3000

# Export format
env2args --format export .env
# PORT=3000
```

## Options

| Flag | Description |
|------|-------------|
| `-p, --prefix <str>` | Only include vars with prefix (stripped) |
| `-f, --format <fmt>` | `double` (default), `single`, `export`, `docker` |
| `-l, --lowercase` | Lowercase keys |
| `-u, --underscore` | Replace underscores with hyphens |
| `--kebab` | UPPER_SNAKE → kebab-case |
| `--no-empty` | Skip empty values |
| `--quote` | Wrap values in double quotes |
| `-0, --null` | NUL-separated output |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

## Examples

```bash
# Generate docker run flags from .env
docker run $(env2args --format docker .env | tr '\n' ' ') myimage

# Pass env vars as CLI args to another tool
mytool $(env2args --kebab --prefix MYTOOL_ .env | tr '\n' ' ')
```

## License

MIT © 2026 kszongic
