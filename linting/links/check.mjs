#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import {
  LINKS_BASE_ARGS,
  LINKS_DEFAULT_MODE,
  LINKS_DEFAULT_VARIANT,
  LINKS_ERROR_PREFIX,
  LINKS_EXTERNAL_SKIP_PATTERNS,
  LINKS_EXTERNAL_STATUS_OVERRIDES,
  LINKS_HOST,
  LINKS_LOCALHOST_SCHEME,
  LINKS_READY_MAX_STATUS,
  LINKS_READY_MIN_STATUS,
  LINKS_READY_POLL_INTERVAL_MS,
  LINKS_READY_REQUEST_TIMEOUT_MS,
  LINKS_READY_TIMEOUT_MS,
  LINKS_RUNNER_CMD,
  LINKS_SEED_ROUTES,
  LINKS_SERVER_ARGS,
  LINKS_SERVER_CMD,
  LINKS_SERVER_SHUTDOWN_WAIT_MS,
  LINKS_SUPPORTED_MODES,
  LINKS_TOOL,
  LINKS_USAGE,
  LINKS_VARIANT_ROOT,
} from '../config/links.js';

const require = createRequire(import.meta.url);
const { PORT } = require('../../config/server');

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '../..');
const BASE_URL = `${LINKS_LOCALHOST_SCHEME}://${LINKS_HOST}:${PORT}`;
const mode = process.argv[2] ?? LINKS_DEFAULT_MODE;

if (!LINKS_SUPPORTED_MODES.includes(mode)) {
  console.error(LINKS_USAGE);
  process.exit(1);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => resolve({ code, signal }));
  });
}

function listVariantRoutes() {
  const landingPath = path.join(ROOT, LINKS_VARIANT_ROOT);
  if (!fs.existsSync(landingPath)) {
    return [];
  }

  const variants = fs
    .readdirSync(landingPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== LINKS_DEFAULT_VARIANT)
    .map((entry) => `/${entry.name}`);

  variants.sort();
  return variants;
}

async function waitForServerReady(url, timeoutMs = LINKS_READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(LINKS_READY_REQUEST_TIMEOUT_MS),
      });
      if (response.status >= LINKS_READY_MIN_STATUS && response.status < LINKS_READY_MAX_STATUS) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }
    await delay(LINKS_READY_POLL_INTERVAL_MS);
  }

  throw new Error(`server did not become ready within ${timeoutMs}ms`);
}

async function main() {
  const seedRoutes = [...LINKS_SEED_ROUTES, ...listVariantRoutes()];
  const seedUrls = [...new Set(seedRoutes.map((route) => `${BASE_URL}${route}`))];

  const server = spawn(LINKS_SERVER_CMD, LINKS_SERVER_ARGS, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverError = '';
  server.stderr.on('data', (chunk) => {
    serverError += chunk.toString();
  });

  try {
    await waitForServerReady(BASE_URL);

    const args = [LINKS_TOOL, ...seedUrls, ...LINKS_BASE_ARGS];

    if (mode === 'internal') {
      args.push('--skip', `^https?://(?!${LINKS_HOST.replaceAll('.', '\\.')}:${PORT})`);
    } else {
      for (const statusOverride of LINKS_EXTERNAL_STATUS_OVERRIDES) {
        args.push('--status-code', statusOverride);
      }

      for (const skipPattern of LINKS_EXTERNAL_SKIP_PATTERNS) {
        args.push('--skip', skipPattern);
      }
    }

    const result = await runCommand(LINKS_RUNNER_CMD, args);
    if (result.code !== 0) {
      process.exit(result.code ?? 1);
    }
  } catch (error) {
    console.error(`${LINKS_ERROR_PREFIX} ${error.message}`);
    if (serverError.trim() !== '') {
      console.error(serverError.trim());
    }
    process.exitCode = 1;
  } finally {
    if (!server.killed) {
      server.kill('SIGTERM');
    }
    await new Promise((resolve) => {
      server.once('exit', () => resolve());
      setTimeout(resolve, LINKS_SERVER_SHUTDOWN_WAIT_MS);
    });
  }
}

main();
