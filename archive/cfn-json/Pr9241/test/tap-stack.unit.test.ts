/**
 * tap-stack.unit.test.ts
 *
 * Unit tests for CloudFormation JSON template.
 * For CloudFormation JSON projects, template validation is performed through:
 * - CloudFormation linting (cfn-lint)
 * - Integration tests (test deployed resources)
 * 
 * This minimal test suite ensures the template file exists and is valid JSON.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');

  describe('Template File Validation', () => {
    test('template file should exist', () => {
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    test('template should be valid JSON', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(() => JSON.parse(templateContent)).not.toThrow();
    });

    test('template should have required CloudFormation structure', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const template = JSON.parse(templateContent);
      
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('template should have AWSTemplateFormatVersion', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const template = JSON.parse(templateContent);
      
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });
});

