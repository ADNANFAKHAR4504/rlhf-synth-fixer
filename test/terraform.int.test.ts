import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  describe('Terraform State Validation', () => {
    test('terraform.tfstate exists after deployment', () => {
      const statePath = path.resolve(__dirname, '../lib/terraform.tfstate');
      expect(fs.existsSync(statePath)).toBe(true);
    });

    test('terraform state contains deployed resources', () => {
      const statePath = path.resolve(__dirname, '../lib/terraform.tfstate');
      const stateContent = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      expect(stateContent.resources).toBeDefined();
      expect(stateContent.resources.length).toBeGreaterThan(0);
    });
  });
});
