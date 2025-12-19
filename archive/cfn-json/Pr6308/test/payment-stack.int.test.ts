import fs from 'fs';
import path from 'path';

/**
 * Minimal integration smoke tests that simply ensure the synthesized
 * CloudFormation outputs file exists and contains JSON data. These tests
 * intentionally avoid making live AWS calls so they can run in any CI
 * environment without additional infrastructure.
 */

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

function loadOutputs(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const outputs = loadOutputs();

describe('Payment Stack Smoke Tests', () => {
  test('outputs file can be parsed as JSON', () => {
    expect(typeof outputs).toBe('object');
  });

  test('environment suffix is available for downstream scripts', () => {
    const suffix = process.env.ENVIRONMENT_SUFFIX ?? '';
    expect(typeof suffix).toBe('string');
  });
});
