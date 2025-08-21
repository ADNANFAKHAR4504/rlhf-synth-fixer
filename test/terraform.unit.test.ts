import { describe, expect, test } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Configuration Unit Tests', () => {
  const requiredFiles = [
    'tap_stack.tf',
    'vars.tf',
    'outputs.tf',
    'terraform.tfvars.example',
  ];

  const requiredModules = ['data', 'security', 'monitoring'];

  requiredFiles.forEach(file => {
    test(`${file} should exist`, () => {
      const filePath = path.join(LIB_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  requiredModules.forEach(module => {
    test(`module ${module} should exist`, () => {
      const modulePath = path.join(LIB_DIR, 'modules', module);
      expect(fs.existsSync(modulePath)).toBe(true);
    });
  });

  test('tap_stack.tf should contain a provider block', () => {
    const mainTfPath = path.join(LIB_DIR, 'tap_stack.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');
    expect(content).toMatch(/provider "aws" {/);
  });

  test('tap_stack.tf should contain module blocks with correct source', () => {
    const mainTfPath = path.join(LIB_DIR, 'tap_stack.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');
    expect(content).toMatch(/source = ".\/modules\/data"/);
    expect(content).toMatch(/source = ".\/modules\/security"/);
    expect(content).toMatch(/source = ".\/modules\/monitoring"/);
  });

  test('vars.tf should define the "region" variable', () => {
    const varsTfPath = path.join(LIB_DIR, 'vars.tf');
    const content = fs.readFileSync(varsTfPath, 'utf8');
    expect(content).toMatch(/variable "region" {/);
  });

  test('outputs.tf should define the "vpc_id" output', () => {
    const outputsTfPath = path.join(LIB_DIR, 'outputs.tf');
    const content = fs.readFileSync(outputsTfPath, 'utf8');
    expect(content).toMatch(/output "vpc_id" {/);
  });
});
