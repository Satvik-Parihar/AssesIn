/**
 * Cross-platform dev server launcher.
 * Spawns backend (dotnet) and frontend (ng serve) without cmd.exe.
 */
const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

const BLUE   = '\x1b[34m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

function printBanner() {
  console.log('');
  console.log(`${BOLD}${CYAN}  ╔══════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}  ║     Online Examination System — Dev Mode     ║${RESET}`);
  console.log(`${BOLD}${CYAN}  ╚══════════════════════════════════════════════╝${RESET}`);
  console.log('');
  console.log(`  ${YELLOW}▶ Frontend${RESET}  ${BOLD}http://localhost:4200${RESET}`);
  console.log(`  ${YELLOW}▶ Backend API${RESET} ${BOLD}http://localhost:5000/api${RESET}`);
  console.log('');
  console.log(`  ${CYAN}Waiting for servers to start...${RESET}`);
  console.log('');
}

// Print once at startup, then again when Angular finishes compiling
let frontendReady = false;

function printReadyBanner() {
  console.log('');
  console.log(`${BOLD}${GREEN}  ✔ Application is ready!${RESET}`);
  console.log('');
  console.log(`  ${YELLOW}▶ Open in browser:${RESET}  ${BOLD}${GREEN}http://localhost:4200${RESET}`);
  console.log(`  ${YELLOW}▶ Backend API:     ${RESET}  ${BOLD}http://localhost:5000/api${RESET}`);
  console.log('');
}

function prefixLines(tag, color, data) {
  const text = data.toString();
  // Detect when Angular's dev server finishes compiling and is ready
  if (!frontendReady && (text.includes('Application bundle generation complete') || text.includes('Watch mode enabled'))) {
    frontendReady = true;
    printReadyBanner();
  }
  text.split('\n').filter(l => l.trim()).forEach(line =>
    process.stdout.write(`${color}[${tag}]${RESET} ${line}\n`)
  );
}

printBanner();

// ── Backend ───────────────────────────────────────────────────────
const backend = spawn('dotnet', [
  'run',
  '--project', path.join(root, 'backend', 'OnlineExamAPI', 'OnlineExamAPI.csproj'),
  '--urls', 'http://localhost:5000',
], { shell: false });

backend.stdout.on('data', d => prefixLines('backend ', BLUE, d));
backend.stderr.on('data', d => prefixLines('backend ', BLUE, d));

// ── Frontend ──────────────────────────────────────────────────────
const ngBin = path.join(root, 'frontend', 'online-exam', 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const frontend = spawn(process.execPath, [ngBin, 'serve', '--port', '4200'], {
  cwd: path.join(root, 'frontend', 'online-exam'),
  shell: false,
});

frontend.stdout.on('data', d => prefixLines('frontend', GREEN, d));
frontend.stderr.on('data', d => prefixLines('frontend', GREEN, d));

// ── Cleanup ───────────────────────────────────────────────────────
function cleanup() {
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
}

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });

backend.on('exit',  (code) => { console.log(`${BLUE}[backend ] exited (${code})${RESET}`);  frontend.kill(); });
frontend.on('exit', (code) => { console.log(`${GREEN}[frontend] exited (${code})${RESET}`); backend.kill(); });
