/**
 * Convert ZIP code CSV to JSON for the BOM distance calculator
 * 
 * Usage: node scripts/convert-zip-csv-to-json.js
 * 
 * Input: zip_code_database.csv (in project root)
 * Output: src/lib/design/zip-data.json
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'zip_code_database.csv');
const outputFile = path.join(__dirname, '..', 'src', 'lib', 'design', 'zip-data.json');

console.log('Reading CSV file...');
const csvContent = fs.readFileSync(inputFile, 'utf-8');
const lines = csvContent.split('\n');

// Skip header row
const header = lines[0].split(',');
console.log('Header columns:', header.slice(0, 6));

const zipData = {};
let count = 0;
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const parts = line.split(',');
  const zip = parts[0];
  const city = parts[1];
  const state = parts[2];
  const lat = parseFloat(parts[4]);
  const lng = parseFloat(parts[5]);
  
  // Skip if missing coordinates
  if (isNaN(lat) || isNaN(lng)) {
    skipped++;
    continue;
  }
  
  // Pad ZIP to 5 digits (e.g., "501" -> "00501")
  const paddedZip = zip.padStart(5, '0');
  
  const county = parts[3];
  
  zipData[paddedZip] = {
    lat: lat,
    lng: lng,
    city: city || undefined,
    state: state || undefined,
    county: county || undefined,
  };
  
  count++;
}

console.log(`Processed ${count} ZIP codes (skipped ${skipped} with missing coordinates)`);

// Write JSON file
console.log(`Writing to ${outputFile}...`);
fs.writeFileSync(outputFile, JSON.stringify(zipData, null, 0)); // Compact JSON

// Also create a TypeScript-friendly version that can be imported
const tsContent = `// Auto-generated from zip_code_database.csv
// Run: node scripts/convert-zip-csv-to-json.js to regenerate

import type { ZipCentroid } from "./zip-distance";

export const ZIP_DATA: Record<string, ZipCentroid> = ${JSON.stringify(zipData, null, 2)};
`;

const tsOutputFile = path.join(__dirname, '..', 'src', 'lib', 'design', 'zip-data.ts');
fs.writeFileSync(tsOutputFile, tsContent);

console.log(`\nGenerated:`);
console.log(`  - ${outputFile} (${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  - ${tsOutputFile}`);
console.log(`\nTotal ZIP codes: ${count}`);

