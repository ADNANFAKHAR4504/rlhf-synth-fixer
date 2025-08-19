import { describe, expect, test } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);

describe('Terraform Infrastructure Unit Tests', () => {
  test('tap_stack.tf exists', () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('declares aws_region variable in vars.tf', () => {
    const varsPath = path.resolve(__dirname, '../lib/vars.tf');
    const content = fs.readFileSync(varsPath, 'utf8');
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });
});

describe('Module Structure Validation', () => {
  const modulesDir = path.resolve(__dirname, '../lib/modules');
  const modules = fs
    .readdirSync(modulesDir)
    .filter(file => fs.statSync(path.join(modulesDir, file)).isDirectory());

  modules.forEach(module => {
    test(`${module} module exists and has required files`, () => {
      const moduleDir = path.resolve(modulesDir, module);
      expect(fs.existsSync(path.join(moduleDir, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(moduleDir, 'vars.tf'))).toBe(true);
      expect(fs.existsSync(path.join(moduleDir, 'outputs.tf'))).toBe(true);
    });
  });
});

describe('Module Integration Tests', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  const modules = fs
    .readdirSync(path.resolve(__dirname, '../lib/modules'))
    .filter(file =>
      fs
        .statSync(path.join(path.resolve(__dirname, '../lib/modules'), file))
        .isDirectory()
    );

  modules.forEach(module => {
    test(`main stack includes ${module} module`, () => {
      expect(stackContent).toMatch(new RegExp(`module\\s+"${module}"\\s*{`));
      expect(stackContent).toMatch(
        new RegExp(`source\\s*=\\s*"\\.\\/modules\\/${module}"`)
      );
    });
  });

  test('modules receive required variables', () => {
    expect(stackContent).toMatch(/project_name\s*=\s*var\.project_name/);
    expect(stackContent).toMatch(/environment\s*=\s*var\.environment/);
  });
});
