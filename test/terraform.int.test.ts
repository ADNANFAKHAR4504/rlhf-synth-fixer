import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

// Load outputs from flat-outputs.json
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('FAILED to load outputs:', error);
  outputs = {};
}

describe('TapStack Integration Tests - Exact flat-outputs.json and tap_stack.tf', () => {
});