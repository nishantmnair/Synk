#!/usr/bin/env node

import { spawn } from 'child_process'
import process from 'process'

// Run vitest with coverage, all tests now optimized with reduced waitFor timeouts
// Previously excluded tests (CouplingOnboarding, SettingsView, Sidebar) have been optimized
// and can now run within the 5-minute timeout window
const args = [
  'run',
  '--coverage',
  '--coverage.provider=v8',
  '--coverage.reporter=text',
  '--coverage.enabled=true',
]

const child = spawn('vitest', args, {
  stdio: 'inherit',
  cwd: process.cwd(),
})

// Set timeout to force exit if it hangs
const timeout = 300000 // 5 minutes - coverage instrumentation adds 30-40% overhead

const timer = setTimeout(() => {
  console.error('\n⚠️  Test coverage process exceeded 5 minute timeout, forcing exit...')
  process.exit(1)
}, timeout)

child.on('exit', (code) => {
  clearTimeout(timer)
  process.exit(code || 0)
})

child.on('error', (err) => {
  clearTimeout(timer)
  console.error('Error running tests:', err)
  process.exit(1)
})

// Handle signals
process.on('SIGINT', () => {
  clearTimeout(timer)
  child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  clearTimeout(timer)
  child.kill('SIGTERM')
})

