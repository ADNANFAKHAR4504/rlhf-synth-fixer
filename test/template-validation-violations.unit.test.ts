import { TemplateLoader } from '../lib/template-loader';

describe('Template Validation Violations Tests', () => {
  describe('Invalid Template Tests', () => {
    test('should detect missing environment suffix', () => {
      const loader = new TemplateLoader('InvalidTemplate.json');
      const result = loader.validateEnvironmentSuffix();

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('should detect missing exports on outputs', () => {
      const loader = new TemplateLoader('InvalidTemplate.json');
      const result = loader.validateOutputs();

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Coverage for conditional branches', () => {
    test('should detect violations in validateOutputs when export exists without Fn::Sub', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Resources: {},
        Outputs: {
          TestOutput: {
            Description: 'Test',
            Value: 'test',
            Export: {
              Name: 'PlainName', // Missing Fn::Sub
            },
          },
        },
      };

      // Create a temporary test file
      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestOutputViolation.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestOutputViolation.json');
        const result = loader.validateOutputs();

        expect(result.valid).toBe(false);
        expect(result.violations.some(v => v.includes('missing Fn::Sub'))).toBe(
          true
        );
      } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should detect deletion policy violations', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Resources: {
          TestCluster: {
            Type: 'AWS::RDS::DBCluster',
            Properties: {
              Engine: 'aurora-postgresql',
            },
            // Missing DeletionPolicy and UpdateReplacePolicy
          },
        },
        Outputs: {},
      };

      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestDeletionViolation.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestDeletionViolation.json');
        const result = loader.validateDeletionPolicies();

        expect(result.valid).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should detect security violations - missing NoEcho', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {
          SourceDbPassword: {
            Type: 'String',
            // Missing NoEcho
          },
          TargetDbPassword: {
            Type: 'String',
            // Missing NoEcho
          },
        },
        Resources: {},
        Outputs: {},
      };

      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestSecurityViolation1.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestSecurityViolation1.json');
        const result = loader.validateSecurity();

        expect(result.valid).toBe(false);
        expect(result.violations.some(v => v.includes('NoEcho'))).toBe(true);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should detect security violations - missing encryption', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Resources: {
          TestCluster: {
            Type: 'AWS::RDS::DBCluster',
            Properties: {
              Engine: 'aurora-postgresql',
              // Missing StorageEncrypted
            },
          },
        },
        Outputs: {},
      };

      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestSecurityViolation2.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestSecurityViolation2.json');
        const result = loader.validateSecurity();

        expect(result.valid).toBe(false);
        expect(result.violations.some(v => v.includes('encryption'))).toBe(
          true
        );
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should detect security violations - SSL not required', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Resources: {
          TestEndpoint: {
            Type: 'AWS::DMS::Endpoint',
            Properties: {
              EndpointType: 'source',
              EngineName: 'postgres',
              SslMode: 'none', // Should be 'require'
            },
          },
        },
        Outputs: {},
      };

      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestSecurityViolation3.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestSecurityViolation3.json');
        const result = loader.validateSecurity();

        expect(result.valid).toBe(false);
        expect(result.violations.some(v => v.includes('SSL'))).toBe(true);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should detect security violations - publicly accessible instances', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Resources: {
          TestInstance: {
            Type: 'AWS::RDS::DBInstance',
            Properties: {
              DBInstanceClass: 'db.t3.micro',
              Engine: 'postgres',
              PubliclyAccessible: true, // Should be false
            },
          },
          TestDMSInstance: {
            Type: 'AWS::DMS::ReplicationInstance',
            Properties: {
              ReplicationInstanceClass: 'dms.t3.micro',
              PubliclyAccessible: true, // Should be false
            },
          },
        },
        Outputs: {},
      };

      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestSecurityViolation4.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestSecurityViolation4.json');
        const result = loader.validateSecurity();

        expect(result.valid).toBe(false);
        expect(
          result.violations.some(v => v.includes('Publicly accessible'))
        ).toBe(true);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should detect structure violations - missing AWSTemplateFormatVersion', () => {
      const template = {
        // Missing AWSTemplateFormatVersion
        Description: 'Test',
        Parameters: {},
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            Properties: {},
          },
        },
        Outputs: {},
      };

      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestMissingVersion.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestMissingVersion.json');
        const result = loader.validateStructure();

        expect(result.valid).toBe(false);
        expect(
          result.errors.some(e => e.includes('AWSTemplateFormatVersion'))
        ).toBe(true);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should detect structure violations - missing sections', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        // Missing Description, Parameters, Resources, Outputs
      };

      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestStructureViolation.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestStructureViolation.json');
        const result = loader.validateStructure();

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should detect structure violations - empty resources', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Resources: {}, // Empty resources
        Outputs: {},
      };

      const fs = require('fs');
      const path = require('path');
      const testFilePath = path.join(
        __dirname,
        '..',
        'lib',
        'TestEmptyResources.json'
      );
      fs.writeFileSync(testFilePath, JSON.stringify(template));

      try {
        const loader = new TemplateLoader('TestEmptyResources.json');
        const result = loader.validateStructure();

        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('No resources'))).toBe(true);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should handle validateStructure error path', () => {
      const loader = new TemplateLoader('nonexistent-for-structure-test.json');

      const result = loader.validateStructure();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Failed to validate'))).toBe(
        true
      );
    });
  });

  describe('Complete branch coverage', () => {
    test('should cover all branches in validateEnvironmentSuffix', () => {
      const loader = new TemplateLoader('TapStack.json');
      const result = loader.validateEnvironmentSuffix();

      // Valid template should have no violations
      expect(result.valid).toBe(true);

      // Invalid template should have violations
      const invalidLoader = new TemplateLoader('InvalidTemplate.json');
      const invalidResult = invalidLoader.validateEnvironmentSuffix();
      expect(invalidResult.valid).toBe(false);
    });

    test('should cover all branches in validateDeletionPolicies', () => {
      const loader = new TemplateLoader('TapStack.json');
      const result = loader.validateDeletionPolicies();

      // Valid template should have no violations
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('should cover all branches in validateSecurity', () => {
      const loader = new TemplateLoader('TapStack.json');
      const result = loader.validateSecurity();

      // Valid template should have no violations
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });
  });
});
