// tests/unit/terraform.unit.test.ts
import { describe, expect, test } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const TERRAFORM_DIR = path.resolve(
  __dirname,
  '../../terraform-aws-secure-infrastructure'
);
const LIB_DIR = path.resolve(__dirname, '../../lib');

describe('Terraform Configuration Unit Tests', () => {
  const requiredFilesInTerraformDir = [
    'main.tf',
    'vars.tf',
    'outputs.tf',
    'user_data.sh',
  ];

  const requiredFilesInLibDir = [
    'modules/data/main.tf',
    'modules/data/variables.tf',
    'modules/data/outputs.tf',
    'modules/security/main.tf',
    'modules/security/variables.tf',
    'modules/security/outputs.tf',
    'modules/monitoring/main.tf',
    'modules/monitoring/variables.tf',
    'modules/monitoring/outputs.tf',
  ];

  requiredFilesInTerraformDir.forEach(file => {
    test(`${file} should exist in terraform-aws-secure-infrastructure`, () => {
      const filePath = path.join(TERRAFORM_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  requiredFilesInLibDir.forEach(file => {
    test(`${file} should exist in lib`, () => {
      const filePath = path.join(LIB_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('main.tf should contain a provider block', () => {
    const mainTfPath = path.join(TERRAFORM_DIR, 'main.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');
    expect(content).toMatch(/provider "aws" {/);
  });

  test('main.tf should contain module blocks with correct source', () => {
    const mainTfPath = path.join(TERRAFORM_DIR, 'main.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');
    expect(content).toMatch(/source = "..\/..\/lib\/modules\/data"/);
    expect(content).toMatch(/source = "..\/..\/lib\/modules\/security"/);
    expect(content).toMatch(/source = "..\/..\/lib\/modules\/monitoring"/);
  });

  test('vars.tf should define the "region" variable', () => {
    const varsTfPath = path.join(TERRAFORM_DIR, 'vars.tf');
    const content = fs.readFileSync(varsTfPath, 'utf8');
    expect(content).toMatch(/variable "region" {/);
  });

  test('outputs.tf should define the "vpc_id" output', () => {
    const outputsTfPath = path.join(TERRAFORM_DIR, 'outputs.tf');
    const content = fs.readFileSync(outputsTfPath, 'utf8');
    expect(content).toMatch(/output "vpc_id" {/);
  });
});
