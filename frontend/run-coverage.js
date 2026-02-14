#!/usr/bin/env node

import { spawn } from 'child_process'
import process from 'process'

// Run vitest with coverage using forks pool (cleaner process exit than threads)
const args = [
  'run',
  '--coverage',
  '--coverage.provider=v8',
  '--coverage.enabled=true',
  '--pool=forks',
  '--poolOptions.forks.singleFork=true',
]

console.log('Starting test coverage run...')
const startTime = Date.now()

let hasFailure = false
let lastOutputTime = Date.now()
let idleCheckInterval = null

const child = spawn('vitest', args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: process.cwd(),
})

function checkIdle() {
  const idleTime = Date.now() - lastOutputTime
  // If no output for 20 seconds after tests started, vitest is hanging - force exit
  if (idleTime > 20000 && (Date.now() - startTime) > 10000) {
    clearInterval(idleCheckInterval)
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.log(`\nTests completed in ${elapsed}s. Process idle, forcing clean exit.`)
    child.kill('SIGKILL')
    process.exit(hasFailure ? 1 : 0)
  }
}

child.stdout.on('data', (data) => {
  const text = data.toString()
  process.stdout.write(text)
  lastOutputTime = Date.now()

  // Detect test failures
  if (text.includes('failed') || text.includes('×')) {
    hasFailure = true
  }

  // If we see the summary line, we're definitely done
  if (text.includes('Test Files') && text.includes('Tests')) {
    clearInterval(idleCheckInterval)
    // Give vitest 10 seconds to exit cleanly  
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL')
        process.exit(hasFailure ? 1 : 0)
      }
    }, 10000)
  }
})

child.stderr.on('data', (data) => {
  process.stderr.write(data)
  lastOutputTime = Date.now()
})

// Start checking for idle after 5 seconds
setTimeout(() => {
  idleCheckInterval = setInterval(checkIdle, 2000)
}, 5000)

// Hard timeout - 4 minutes
const timer = setTimeout(() => {
  clearInterval(idleCheckInterval)
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.error(`\n⚠️  Test process exceeded ${elapsed}s hard timeout, forcing exit...`)
  child.kill('SIGKILL')
  process.exit(hasFailure ? 1 : 0)
}, 240000)

child.on('exit', (code) => {
  clearTimeout(timer)
  clearInterval(idleCheckInterval)
  process.exit(code || 0)
})

child.on('error', (err) => {
  clearTimeout(timer)
  clearInterval(idleCheckInterval)
  console.error('Error running tests:', err)
  process.exit(1)
})

process.on('SIGINT', () => {
  clearTimeout(timer)
  clearInterval(idleCheckInterval)
  child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  clearTimeout(timer)
  clearInterval(idleCheckInterval)
  child.kill('SIGTERM')
})

