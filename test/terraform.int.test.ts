import { describe, expect, test } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Configuration Integration Tests', () => {
  test('should initialize Terraform successfully', () => {
    const command = 'terraform init';
    const options = { cwd: LIB_DIR, stdio: 'pipe' as const };
    let output: Buffer | string = '';
    try {
      output = execSync(command, options);
    } catch (error: any) {
      console.error(`Error executing command: ${command}`);
      console.error(error.stdout.toString());
      console.error(error.stderr.toString());
      throw error;
    }
    expect(output.toString()).toContain(
      'Terraform has been successfully initialized!'
    );
  });

  test('should validate Terraform configuration successfully', () => {
    const command = 'terraform validate';
    const options = { cwd: LIB_DIR, stdio: 'pipe' as const };
    let output: Buffer | string = '';
    try {
      output = execSync(command, options);
    } catch (error: any) {
      console.error(`Error executing command: ${command}`);
      console.error(error.stdout.toString());
      console.error(error.stderr.toString());
      throw error;
    }
    expect(output.toString()).toContain('Success! The configuration is valid.');
  });

  test('should create a Terraform plan successfully', () => {
    const command = 'terraform plan -out=tfplan';
    const options = { cwd: LIB_DIR, stdio: 'pipe' as const };
    let output: Buffer | string = '';
    try {
      output = execSync(command, options);
    } catch (error: any) {
      console.error(`Error executing command: ${command}`);
      console.error(error.stdout.toString());
      console.error(error.stderr.toString());
      throw error;
    }
    expect(output.toString()).toContain('Plan:');
  });
});
