#!/usr/bin/env node
// Agentic Arena — CLI entry point
// The graveyard floor. All commands stack here.

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '../..');

const RED    = '\x1b[31m';
const BLUE   = '\x1b[34m';
const PURPLE = '\x1b[35m';
const YELLOW = '\x1b[33m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

const BANNER = `
${PURPLE}${BOLD}  ░█████╗░░██████╗░███████╗███╗░░██╗████████╗██╗░█████╗░
  ██╔══██╗██╔════╝░██╔════╝████╗░██║╚══██╔══╝██║██╔══██╗
  ███████║██║░░██╗░█████╗░░██╔██╗██║░░░██║░░░██║██║░░╚═╝
  ██╔══██║██║░░╚██╗██╔══╝░░██║╚████║░░░██║░░░██║██║░░██╗
  ██║░░██║╚██████╔╝███████╗██║░╚███║░░░██║░░░██║╚█████╔╝
  ╚═╝░░╚═╝░╚═════╝░╚══════╝╚═╝░░╚══╝░░░╚═╝░░░╚═╝░╚════╝${RESET}
  ${RED}AHMAD-BOT [red]${RESET}  +  ${BLUE}EDUALC [blue]${RESET}  =  ${PURPLE}PURPLE DAEMON${RESET}
  the graveyard crawlers — they work when no one watches
`;

const HELP = `
${YELLOW}COMMANDS:${RESET}
  crawl          run both daemons in split-terminal mode (red + blue)
  crawl --red    run AHMAD-BOT only
  crawl --blue   run EDUALC only
  worm           release the benevolent worm — audits, maps, verifies, repairs both chains
  report         show latest WORM-sealed crawl results
  status         show scoreboard from worm/scoreboard.json
  seal           trigger BOB to seal latest crawl to WORM chain
  help           show this message
`;

const cmd = process.argv[2];
const flag = process.argv[3];

console.log(BANNER);

switch (cmd) {
  case 'crawl':
    if (flag === '--red')  runDaemon('red');
    else if (flag === '--blue') runDaemon('blue');
    else runBoth();
    break;
  case 'worm':
    runWorm();
    break;
  case 'report':
    showReport();
    break;
  case 'status':
    showStatus();
    break;
  case 'seal':
    runSeal();
    break;
  default:
    console.log(HELP);
}

function runDaemon(hat) {
  const script = hat === 'red'
    ? join(__dir, '../crawlers/ahmad-bot.mjs')
    : join(__dir, '../crawlers/edualc.mjs');
  const p = spawn(process.execPath, [script], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  p.on('exit', code => process.exit(code ?? 0));
}

function runBoth() {
  // Two daemons, interleaved output — red left, blue right, reasoning visible.
  // LISP handshake: each daemon writes .sexp, BOB reads both and reasons.
  console.log(`${PURPLE}${BOLD}releasing both daemons into the graveyard...${RESET}\n`);

  const red  = spawn(process.execPath,
    [join(__dir, '../crawlers/ahmad-bot.mjs')],
    { env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const blue = spawn(process.execPath,
    [join(__dir, '../crawlers/edualc.mjs')],
    { env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] }
  );

  red.stdout.on('data',  d => process.stdout.write(d));
  red.stderr.on('data',  d => process.stderr.write(d));
  blue.stdout.on('data', d => process.stdout.write(d));
  blue.stderr.on('data', d => process.stderr.write(d));

  let done = 0;
  const onExit = () => { if (++done === 2) runBobBridge(); };
  red.on('exit', onExit);
  blue.on('exit', onExit);
}

function runBobBridge() {
  console.log(`\n${PURPLE}${BOLD}both daemons returned — BOB reasoning...${RESET}`);
  const bridge = join(__dir, '../bob-bridge/index.mjs');
  if (!existsSync(bridge)) {
    console.log(`${YELLOW}BOB bridge not wired yet — run: node runtime/bob-bridge/index.mjs${RESET}`);
    return;
  }
  const p = spawn(process.execPath, [bridge], { stdio: 'inherit', env: { ...process.env } });
  p.on('exit', () => console.log(`\n${PURPLE}BOB sealed the night's work.${RESET}`));
}

function showReport() {
  const redPath  = join(ROOT, 'worm/ahmad-bot-crawl.sexp');
  const bluePath = join(ROOT, 'worm/edualc-crawl.sexp');
  if (existsSync(redPath)) {
    console.log(`${RED}── AHMAD-BOT last crawl ──${RESET}`);
    console.log(readFileSync(redPath, 'utf8').slice(0, 2000));
  }
  if (existsSync(bluePath)) {
    console.log(`${BLUE}── EDUALC last crawl ──${RESET}`);
    console.log(readFileSync(bluePath, 'utf8').slice(0, 2000));
  }
  if (!existsSync(redPath) && !existsSync(bluePath)) {
    console.log('No crawl results yet. Run: arena crawl');
  }
}

function showStatus() {
  const p = join(ROOT, 'worm/scoreboard.json');
  if (!existsSync(p)) { console.log('No scoreboard yet.'); return; }
  const board = JSON.parse(readFileSync(p, 'utf8'));
  console.log(`${PURPLE}${BOLD}── SCOREBOARD ──${RESET}`);
  console.log(JSON.stringify(board, null, 2));
}

function runWorm() {
  console.log(`${PURPLE}${BOLD}releasing the benevolent worm...${RESET}\n`);
  const worm = join(__dir, '../benevolent-worm/index.mjs');
  const p = spawn(process.execPath, [worm], { stdio: 'inherit', env: { ...process.env } });
  p.on('exit', code => process.exit(code ?? 0));
}

function runSeal() {
  const bridge = join(__dir, '../bob-bridge/index.mjs');
  const p = spawn(process.execPath, [bridge, '--seal'], { stdio: 'inherit', env: { ...process.env } });
  p.on('exit', code => process.exit(code ?? 0));
}
