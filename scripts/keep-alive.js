#!/usr/bin/env node

/**
 * 24/7 Keep-Alive Daemon Script
 * Periodically pings the application health endpoint to prevent free-tier
 * instances (such as Render, Koyeb, or idle VMs) from spinning down or sleeping.
 *
 * Usage:
 *   TARGET_URL=https://your-service.onrender.com node scripts/keep-alive.js
 *   INTERVAL_MINUTES=10 node scripts/keep-alive.js
 */

const targetUrl = process.env.TARGET_URL || process.env.APP_BASE_URL || 'http://localhost:3000/api/health';
const intervalMinutes = Math.max(1, Number(process.env.INTERVAL_MINUTES) || 10);
const intervalMs = intervalMinutes * 60 * 1000;

// Normalize endpoint to health check
const pingUrl = targetUrl.endsWith('/api/health') 
  ? targetUrl 
  : `${targetUrl.replace(/\/+$/, '')}/api/health`;

console.log(`[Keep-Alive] Daemon initialized.`);
console.log(`[Keep-Alive] Target Ping Endpoint: ${pingUrl}`);
console.log(`[Keep-Alive] Polling Frequency: Every ${intervalMinutes} minutes (${intervalMs / 1000}s)`);
console.log(`[Keep-Alive] Press Ctrl+C to terminate.\n`);

let pingCount = 0;

async function ping() {
  pingCount += 1;
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'LabPortal-KeepAlive/1.0 (+24/7-Heartbeat)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    if (res.ok) {
      console.log(`[${timestamp}] [#${pingCount}] Heartbeat OK — HTTP ${res.status} (${latency}ms)`);
    } else {
      console.warn(`[${timestamp}] [#${pingCount}] Heartbeat Warning — HTTP ${res.status} (${latency}ms)`);
    }
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`[${timestamp}] [#${pingCount}] Heartbeat Failed — ${err.message} (${latency}ms)`);
  }
}

// Initial ping on boot
ping();

// Periodic keep-alive interval
setInterval(ping, intervalMs);
