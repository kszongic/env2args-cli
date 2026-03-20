#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const help = `
env2args - Convert .env files or stdin into command-line arguments

Usage:
  env2args [options] [file]
  cat .env | env2args

Options:
  -p, --prefix <str>    Only include vars starting with prefix (stripped from key)
  -s, --separator <ch>  Key-value separator (default: =)
  -f, --format <fmt>    Output format: double (--KEY value), single (-KEY value),
                         export (KEY=value), docker (-e KEY=value) (default: double)
  -l, --lowercase       Lowercase the keys
  -u, --underscore      Replace underscores with hyphens in keys
  -0, --null            Separate arguments with NUL instead of newline
  --kebab               Convert UPPER_SNAKE to kebab-case (implies lowercase)
  --no-empty            Skip variables with empty values
  --quote               Wrap values in double quotes
  -h, --help            Show this help
  -v, --version         Show version

Examples:
  env2args .env
  env2args --kebab --prefix APP_ .env
  echo "PORT=3000" | env2args --format docker
  env2args --format export .env.local
`.trim();

const pkg = require('./package.json');

function parseArgs(argv) {
  const opts = {
    prefix: '',
    separator: '=',
    format: 'double',
    lowercase: false,
    underscore: false,
    kebab: false,
    nullSep: false,
    noEmpty: false,
    quote: false,
    file: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') { process.stdout.write(help + '\n'); process.exit(0); }
    if (a === '-v' || a === '--version') { process.stdout.write(pkg.version + '\n'); process.exit(0); }
    if ((a === '-p' || a === '--prefix') && argv[i + 1]) { opts.prefix = argv[++i]; continue; }
    if ((a === '-s' || a === '--separator') && argv[i + 1]) { opts.separator = argv[++i]; continue; }
    if ((a === '-f' || a === '--format') && argv[i + 1]) { opts.format = argv[++i]; continue; }
    if (a === '-l' || a === '--lowercase') { opts.lowercase = true; continue; }
    if (a === '-u' || a === '--underscore') { opts.underscore = true; continue; }
    if (a === '--kebab') { opts.kebab = true; opts.lowercase = true; continue; }
    if (a === '-0' || a === '--null') { opts.nullSep = true; continue; }
    if (a === '--no-empty') { opts.noEmpty = true; continue; }
    if (a === '--quote') { opts.quote = true; continue; }
    if (!a.startsWith('-')) { opts.file = a; continue; }
  }
  return opts;
}

function parseLine(line, sep) {
  line = line.trim();
  if (!line || line.startsWith('#')) return null;
  if (line.startsWith('export ')) line = line.slice(7).trim();
  const idx = line.indexOf(sep);
  if (idx < 1) return null;
  const key = line.slice(0, idx).trim();
  let val = line.slice(idx + sep.length).trim();
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return { key, val };
}

function formatKey(key, opts) {
  if (opts.prefix && key.startsWith(opts.prefix)) {
    key = key.slice(opts.prefix.length);
  }
  if (opts.kebab) {
    key = key.replace(/_/g, '-').toLowerCase();
  } else {
    if (opts.underscore) key = key.replace(/_/g, '-');
    if (opts.lowercase) key = key.toLowerCase();
  }
  return key;
}

function formatPair(key, val, opts) {
  const v = opts.quote ? `"${val}"` : val;
  switch (opts.format) {
    case 'single': return `-${key} ${v}`;
    case 'export': return `${key}=${v}`;
    case 'docker': return `-e ${key}=${v}`;
    default: return `--${key} ${v}`;
  }
}

function run(input, opts) {
  const lines = input.split(/\r?\n/);
  const results = [];

  for (const line of lines) {
    const parsed = parseLine(line, opts.separator);
    if (!parsed) continue;
    if (opts.prefix && !parsed.key.startsWith(opts.prefix)) continue;
    if (opts.noEmpty && !parsed.val) continue;
    const key = formatKey(parsed.key, opts);
    results.push(formatPair(key, parsed.val, opts));
  }

  const sep = opts.nullSep ? '\0' : '\n';
  if (results.length) process.stdout.write(results.join(sep) + '\n');
}

const opts = parseArgs(process.argv.slice(2));

if (opts.file) {
  const filepath = path.resolve(opts.file);
  if (!fs.existsSync(filepath)) {
    process.stderr.write(`Error: file not found: ${opts.file}\n`);
    process.exit(1);
  }
  run(fs.readFileSync(filepath, 'utf8'), opts);
} else if (!process.stdin.isTTY) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { data += chunk; });
  process.stdin.on('end', () => run(data, opts));
} else {
  process.stdout.write(help + '\n');
}
