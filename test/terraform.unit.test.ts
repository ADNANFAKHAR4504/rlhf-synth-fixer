import { describe, expect, test } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Terraform Modules', () => {
  const modulesDir = path.resolve(__dirname, '../lib/modules');

  test('all modules should have main.tf, variables.tf, and outputs.tf', () => {
    const modules = fs.readdirSync(modulesDir);
    modules.forEach(module => {
      if (module === 'main.tf' || module === 'outputs.tf') {
        return;
      }
      const moduleDir = path.resolve(modulesDir, module);
      if (!fs.statSync(moduleDir).isDirectory()) {
        return;
      }
      expect(fs.existsSync(path.resolve(moduleDir, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.resolve(moduleDir, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.resolve(moduleDir, 'outputs.tf'))).toBe(true);
    });
  });
});
