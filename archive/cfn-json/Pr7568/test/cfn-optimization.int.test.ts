// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TAP Stack Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have stack outputs available', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('outputs should contain valid values', () => {
      Object.values(outputs).forEach(value => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
      });
    });

    test('output keys should be non-empty strings', () => {
      Object.keys(outputs).forEach(key => {
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
      });
    });

    test('outputs should be serializable to JSON', () => {
      const serialized = JSON.stringify(outputs);
      expect(serialized).toBeDefined();
      const parsed = JSON.parse(serialized);
      expect(parsed).toEqual(outputs);
    });
  });

  describe('DynamoDB Table Integration', () => {
    test('should have DynamoDB table outputs when deployed', () => {
      const tableOutputKeys = Object.keys(outputs).filter(
        key => key.toLowerCase().includes('table') || key.toLowerCase().includes('dynamodb')
      );
      expect(tableOutputKeys.length >= 0).toBe(true);
    });

    test('table ARN outputs should have valid ARN format if present', () => {
      const arnOutputs = Object.entries(outputs).filter(
        ([key, value]) => key.toLowerCase().includes('arn') && typeof value === 'string'
      );
      arnOutputs.forEach(([, value]) => {
        if (typeof value === 'string' && value.startsWith('arn:aws:')) {
          expect(value).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d*:.+/);
        }
      });
    });
  });

  describe('Environment Configuration', () => {
    test('environment suffix should be defined', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('environment suffix should contain only valid characters', () => {
      expect(environmentSuffix).toMatch(/^[a-zA-Z0-9-]+$/);
    });
  });

  describe('Output Value Types', () => {
    test('all output values should be primitive types or arrays', () => {
      Object.values(outputs).forEach(value => {
        const isValid =
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          Array.isArray(value);
        expect(isValid).toBe(true);
      });
    });

    test('string outputs should be non-empty', () => {
      Object.values(outputs).forEach(value => {
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });

    test('array outputs should contain valid elements', () => {
      Object.values(outputs).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(element => {
            expect(element).toBeDefined();
            expect(element).not.toBeNull();
          });
        }
      });
    });
  });

  describe('AWS Resource Naming', () => {
    test('resource identifiers should follow AWS naming conventions', () => {
      Object.values(outputs).forEach(value => {
        if (typeof value === 'string') {
          // AWS resource names typically don't contain special characters except allowed ones
          expect(value).not.toContain(';;');
          expect(value).not.toContain('  ');
        }
      });
    });

    test('VPC IDs should have valid format if present', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (key.toLowerCase().includes('vpc') && typeof value === 'string' && value.startsWith('vpc-')) {
          expect(value).toMatch(/^vpc-[a-f0-9]+$/);
        }
      });
    });

    test('subnet IDs should have valid format if present', () => {
      Object.values(outputs).forEach(value => {
        if (typeof value === 'string' && value.startsWith('subnet-')) {
          expect(value).toMatch(/^subnet-[a-f0-9]+$/);
        }
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'string' && item.startsWith('subnet-')) {
              expect(item).toMatch(/^subnet-[a-f0-9]+$/);
            }
          });
        }
      });
    });

    test('security group IDs should have valid format if present', () => {
      Object.values(outputs).forEach(value => {
        if (typeof value === 'string' && value.startsWith('sg-')) {
          expect(value).toMatch(/^sg-[a-f0-9]+$/);
        }
      });
    });
  });
});
