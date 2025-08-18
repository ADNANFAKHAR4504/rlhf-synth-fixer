import { execSync } from 'child_process';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 180000; // 3 minutes per test

describe('Terraform HCL Integration Smoke Tests', () => {
  beforeAll(() => {
    process.chdir(LIB_DIR);
  }, TEST_TIMEOUT);

  test('terraform init succeeds', () => {
    expect(() => {
      execSync('terraform init -reconfigure -lock=false', { stdio: 'pipe', timeout: 60000 });
    }).not.toThrow();
  }, TEST_TIMEOUT);

  test('terraform validate passes', () => {
    expect(() => {
      execSync('terraform validate', { stdio: 'pipe', timeout: 30000 });
    }).not.toThrow();
  }, TEST_TIMEOUT);

  test('terraform fmt check passes', () => {
    expect(() => {
      execSync('terraform fmt -check -recursive', { stdio: 'pipe', timeout: 30000 });
    }).not.toThrow();
  }, TEST_TIMEOUT);
});
