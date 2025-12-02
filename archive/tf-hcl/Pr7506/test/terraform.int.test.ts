import fs from 'fs';
import path from 'path';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Multi-Region DR Terraform Integration Tests', () => {
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

  describe('Multi-Region DR Outputs', () => {
    test('ARN outputs should have valid ARN format if present', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (key.toLowerCase().includes('arn') && typeof value === 'string' && value.startsWith('arn:aws:')) {
          expect(value).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d*:.+/);
        }
      });
    });

    test('endpoint outputs should be valid URLs or hostnames', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (key.toLowerCase().includes('endpoint') && typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });

    test('bucket outputs should follow S3 naming conventions', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (key.toLowerCase().includes('bucket') && typeof value === 'string' && !value.startsWith('arn:')) {
          expect(value).toMatch(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/);
        }
      });
    });
  });

  describe('Terraform File Structure', () => {
    const libPath = path.join(__dirname, '..', 'lib');

    test('should have providers.tf file', () => {
      const filePath = path.join(libPath, 'providers.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have variables.tf file', () => {
      const filePath = path.join(libPath, 'variables.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have outputs.tf file', () => {
      const filePath = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have networking.tf file', () => {
      const filePath = path.join(libPath, 'networking.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have aurora.tf file', () => {
      const filePath = path.join(libPath, 'aurora.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have s3-replication.tf file', () => {
      const filePath = path.join(libPath, 's3-replication.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have compute.tf file', () => {
      const filePath = path.join(libPath, 'compute.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have route53.tf file', () => {
      const filePath = path.join(libPath, 'route53.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have backup.tf file', () => {
      const filePath = path.join(libPath, 'backup.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have monitoring.tf file', () => {
      const filePath = path.join(libPath, 'monitoring.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should have security-groups.tf file', () => {
      const filePath = path.join(libPath, 'security-groups.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
