// server/benchmarks/import-bench.js
// Synthetic benchmark for 20,000-row LIS CSV parse & validation
import { parseCSV, validateRow } from '../src/services/import.js';

console.log('Generating 20,000 synthetic LIS CSV rows in memory...');
const header = 'Order ID,Patient Name,Mobile,Sex,DOB,Referring Doctor,Parameter,Result,Unit,Reference Range,Status,Signed At\n';
const lines = [header];

const tests = [
  { param: 'Haemoglobin', result: '13.5', unit: 'g/dL', range: '12.0-15.5' },
  { param: 'Total Cholesterol', result: '185', unit: 'mg/dL', range: '<200' },
  { param: 'Fasting Blood Glucose', result: '95', unit: 'mg/dL', range: '70-99' },
  { param: 'Potassium', result: '4.2', unit: 'mmol/L', range: '3.5-5.1' },
  { param: 'LDL Cholesterol', result: '115', unit: 'mg/dL', range: '<100' }
];

for (let i = 1; i <= 20000; i++) {
  const t = tests[i % tests.length];
  const orderId = `ORD-${String(100000 + (i % 4000)).padStart(6, '0')}`;
  const mobile = `98480${String(10000 + (i % 2000)).padStart(5, '0')}`;
  const line = `${orderId},Patient_${i % 2000},${mobile},M,1980-05-12,Dr. Ramesh,${t.param},${t.result},${t.unit},${t.range},Ready,2026-11-02T10:00:00Z\n`;
  lines.push(line);
}

const csvData = lines.join('');
console.log(`CSV buffer size: ${(Buffer.byteLength(csvData) / 1024 / 1024).toFixed(2)} MB`);

// Force garbage collection if exposed, otherwise measure baseline
if (global.gc) global.gc();
const initialMemory = process.memoryUsage();
const startTime = performance.now();

console.log('Starting parse & validation of 20,000 rows...');
const rows = parseCSV(csvData);
let validCount = 0;
let invalidCount = 0;

for (let i = 0; i < rows.length; i++) {
  const res = validateRow(rows[i]);
  if (res.valid) {
    validCount++;
  } else {
    invalidCount++;
  }
}

const endTime = performance.now();
const finalMemory = process.memoryUsage();

const durationMs = endTime - startTime;
const durationSec = durationMs / 1000;
const rssDeltaMB = (finalMemory.rss - initialMemory.rss) / (1024 * 1024);
const heapDeltaMB = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);

console.log('====================================');
console.log('BENCHMARK RESULTS (20,000 ROWS)');
console.log('====================================');
console.log(`Total rows processed: ${rows.length}`);
console.log(`Valid: ${validCount}, Invalid: ${invalidCount}`);
console.log(`Duration: ${durationMs.toFixed(2)} ms (${durationSec.toFixed(3)} s)`);
console.log(`Throughput: ${(rows.length / durationSec).toFixed(0)} rows/second`);
console.log(`Initial RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`Final RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`RSS Delta: ${rssDeltaMB.toFixed(2)} MB`);
console.log(`Heap Delta: ${heapDeltaMB.toFixed(2)} MB`);
console.log('====================================');

if (durationSec > 5.0) {
  console.error(`FAIL: Execution took ${durationSec.toFixed(2)}s, exceeds 5.0s budget.`);
  process.exit(1);
} else {
  console.log(`PASS: Duration ${durationSec.toFixed(3)}s < 5.0s budget.`);
}

if (rssDeltaMB > 200.0) {
  console.error(`FAIL: RSS Delta ${rssDeltaMB.toFixed(2)}MB exceeds 200MB budget.`);
  process.exit(1);
} else {
  console.log(`PASS: RSS Delta ${rssDeltaMB.toFixed(2)}MB < 200MB budget.`);
}

console.log('Benchmark completed successfully with all assertions passing.');
