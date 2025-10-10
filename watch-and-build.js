// watch-and-build.js
const fs = require('fs');
const { spawn } = require('child_process');

const projectPath = process.cwd();
const watchExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'];

console.log('Starting auto-build watcher...');
console.log('Watching:', projectPath);

let isBuilding = false;
let nextProcess = null;

function startNextApp() {
    console.log('Starting Next.js app...');
    nextProcess = spawn('npm', ['start'], {
        cwd: projectPath,
        stdio: 'inherit',
        shell: true
    });
    
    nextProcess.on('error', (err) => {
        console.error('Failed to start Next.js:', err);
    });
}

function buildAndRestart() {
    if (isBuilding) return;
    isBuilding = true;
    
    console.log('\n[' + new Date().toLocaleTimeString() + '] Changes detected! Building...');
    
    // Kill existing Next.js process
    if (nextProcess) {
        nextProcess.kill();
        nextProcess = null;
    }
    
    // Build
    const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: projectPath,
        stdio: 'inherit',
        shell: true
    });
    
    buildProcess.on('close', (code) => {
        if (code === 0) {
            console.log('Build successful! Starting app...');
            startNextApp();
        } else {
            console.log('Build failed!');
        }
        isBuilding = false;
    });
}

// Initial build and start
buildAndRestart();

// Watch for file changes
fs.watch(projectPath, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    const ext = require('path').extname(filename);
    if (watchExtensions.includes(ext)) {
        console.log(`File changed: ${filename}`);
        setTimeout(buildAndRestart, 1000); // Debounce
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    if (nextProcess) {
        nextProcess.kill();
    }
    process.exit(0);
});