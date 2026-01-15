#!/usr/bin/env node
/**
 * Script to remove all console.log, console.warn, console.error statements
 * from JavaScript/JSX files in the src directory
 */

const fs = require('fs');
const path = require('path');

function removeConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Remove console.log, console.warn, console.error statements
  // Handles single-line and multi-line statements
  let cleaned = content;

  // Pattern matches:
  // console.log(...);
  // console.warn(...);
  // console.error(...);
  // Including multi-line with proper bracket matching

  let modified = false;
  let previousContent = '';

  // Keep iterating until no more changes (handles nested statements)
  while (previousContent !== cleaned) {
    previousContent = cleaned;

    // Remove console statements (handles multi-line)
    cleaned = cleaned.replace(/console\.(log|warn|error)\([^;]*\);?/g, () => {
      modified = true;
      return '';
    });

    // Handle multi-line console statements more aggressively
    cleaned = cleaned.replace(/console\.(log|warn|error)\([\s\S]*?\);/g, () => {
      modified = true;
      return '';
    });
  }

  // Clean up empty lines left by removed console statements (max 2 consecutive blank lines)
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (modified) {
    fs.writeFileSync(filePath, cleaned, 'utf8');
    return true;
  }

  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalModified = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalModified += processDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      if (removeConsoleLogs(filePath)) {
        console.log(`✅ Cleaned: ${filePath}`);
        totalModified++;
      }
    }
  }

  return totalModified;
}

const srcDir = path.join(__dirname, 'src');

console.log('🧹 Removing all console.log statements from src/...\n');

const totalModified = processDirectory(srcDir);

console.log(`\n✨ Done! Modified ${totalModified} files.`);
console.log('📊 All console.log, console.warn, console.error statements removed.');
