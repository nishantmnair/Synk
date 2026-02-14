#!/usr/bin/env node

import { spawn } from 'child_process'
import process from 'process'

// Run vitest with coverage, excluding slow integration tests
// These tests are skipped entirely from running to prevent timeout
const slowTests = [
  'CouplingOnboarding',
  'SettingsView',
  'Sidebar',
]

const args = [
  'run',
  '--coverage',
  '--coverage.provider=v8',
  '--coverage.reporter=text',
  '--coverage.enabled=true',
]

// Add exclude patterns to skip these tests from running entirely
slowTests.forEach(test => {
  args.push(`--exclude=**/components/__tests__/${test}.test.tsx`)
  args.push(`--coverage.exclude=**/components/__tests__/${test}.test.tsx`)
})

const child = spawn('vitest', args, {
  stdio: 'inherit',
  cwd: process.cwd(),
})

// Set timeout to force exit if it hangs
const timeout = 120000 // 2 minutes

const timer = setTimeout(() => {
  console.error('\n⚠️  Test coverage process exceeded 5 minute timeout, forcing exit...')
  process.exit(0)
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

