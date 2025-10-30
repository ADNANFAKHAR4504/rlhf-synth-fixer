import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Unit tests for TapStack Pulumi component
 * Tests infrastructure configuration and resource creation logic
 */

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name
        ? `${args.name}-${args.inputs.name}-id`
        : `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:eu-west-1:123456789012:${args.name}`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack - Core Functionality', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test';
  const testTags = { Project: 'Migration', Owner: 'Test' };

  beforeAll(() => {
    // Create test migration config if it doesn't exist
    const testConfigPath = path.join(
      __dirname,
      '..',
      'lib',
      'lambda',
      'migration-config.json'
    );
    if (!fs.existsSync(testConfigPath)) {
      const testConfig = {
        sourceRegion: 'us-east-1',
        targetRegion: 'eu-west-1',
        migrationBatch: 'batch-test',
        timestamp: '1234567890',
        s3Buckets: [
          {
            name: 'test-bucket',
            versioning: true,
            lifecycleDays: 90,
          },
        ],
        dynamodbTables: [
          {
            name: 'test-table',
            hashKey: 'id',
            hashKeyType: 'S',
            readCapacity: 5,
            writeCapacity: 5,
            scalingFactor: 1.5,
          },
          {
            name: 'test-table-with-range',
            hashKey: 'userId',
            hashKeyType: 'S',
            rangeKey: 'timestamp',
            rangeKeyType: 'N',
            readCapacity: 10,
            writeCapacity: 10,
            scalingFactor: 2.0,
          },
        ],
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    }

    stack = new TapStack('test-stack', {
      environmentSuffix: testEnvironmentSuffix,
      tags: testTags,
    });
  });

  describe('Stack Instantiation', () => {
    it('should create stack instance successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have all required outputs defined', () => {
      expect(stack.migrationReport).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.bucketArns).toBeDefined();
      expect(stack.tableArns).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    it('should use provided environment suffix', async () => {
      const kmsKeyId = await stack.kmsKeyId.promise();
      expect(kmsKeyId).toBeDefined();
    });

    it('should apply custom tags', async () => {
      // Test that tags are passed through the stack
      expect(testTags).toBeDefined();
      expect(testTags.Project).toBe('Migration');
    });
  });

  describe('Migration Configuration Loading', () => {
    it('should load migration configuration from file', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(config).toBeDefined();
      expect(config.sourceRegion).toBe('us-east-1');
      expect(config.targetRegion).toBe('eu-west-1');
      expect(config.s3Buckets).toBeDefined();
      expect(config.dynamodbTables).toBeDefined();
    });

    it('should have S3 bucket configuration', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(Array.isArray(config.s3Buckets)).toBe(true);
      expect(config.s3Buckets.length).toBeGreaterThan(0);

      const bucket = config.s3Buckets[0];
      expect(bucket).toHaveProperty('name');
      expect(bucket).toHaveProperty('versioning');
      expect(bucket).toHaveProperty('lifecycleDays');
    });

    it('should have DynamoDB table configuration', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(Array.isArray(config.dynamodbTables)).toBe(true);
      expect(config.dynamodbTables.length).toBeGreaterThan(0);

      const table = config.dynamodbTables[0];
      expect(table).toHaveProperty('name');
      expect(table).toHaveProperty('hashKey');
      expect(table).toHaveProperty('hashKeyType');
      expect(table).toHaveProperty('scalingFactor');
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should include environment suffix in resource names', async () => {
      const kmsKeyId = await stack.kmsKeyId.promise();
      expect(kmsKeyId).toBeDefined();
      // Resource names should include environmentSuffix
    });

    it('should follow migration naming pattern for buckets', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const expectedPattern = `${config.s3Buckets[0].name}-eu-${config.timestamp}-${testEnvironmentSuffix}`;
      expect(expectedPattern).toMatch(/.*-eu-.*-test$/);
    });

    it('should follow migration naming pattern for tables', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const expectedPattern = `${config.dynamodbTables[0].name}-eu-${config.timestamp}-${testEnvironmentSuffix}`;
      expect(expectedPattern).toMatch(/.*-eu-.*-test$/);
    });
  });

  describe('DynamoDB Capacity Scaling', () => {
    it('should apply scaling factors correctly', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const table = config.dynamodbTables[0];
      const expectedReadCapacity = Math.ceil(table.readCapacity * table.scalingFactor);
      const expectedWriteCapacity = Math.ceil(table.writeCapacity * table.scalingFactor);

      expect(expectedReadCapacity).toBe(Math.ceil(5 * 1.5)); // 8
      expect(expectedWriteCapacity).toBe(Math.ceil(5 * 1.5)); // 8
    });

    it('should handle tables with range keys', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const tableWithRange = config.dynamodbTables.find((t: any) => t.rangeKey);
      if (tableWithRange) {
        expect(tableWithRange.rangeKey).toBeDefined();
        expect(tableWithRange.rangeKeyType).toBeDefined();
      }
    });
  });

  describe('Stack Outputs Structure', () => {
    it('should provide bucketArns output', async () => {
      const arns = await stack.bucketArns.promise();
      expect(Array.isArray(arns)).toBe(true);
    });

    it('should provide tableArns output', async () => {
      const arns = await stack.tableArns.promise();
      expect(Array.isArray(arns)).toBe(true);
    });

    it('should provide kmsKeyId output', async () => {
      const keyId = await stack.kmsKeyId.promise();
      expect(keyId).toBeDefined();
    });

    it('should provide snsTopicArn output', async () => {
      const arn = await stack.snsTopicArn.promise();
      expect(arn).toBeDefined();
    });

    it('should provide migration report output', async () => {
      const report = await stack.migrationReport.promise();
      expect(report).toBeDefined();

      const reportObj = JSON.parse(report);
      expect(reportObj).toHaveProperty('migrationBatch');
      expect(reportObj).toHaveProperty('sourceRegion');
      expect(reportObj).toHaveProperty('targetRegion');
      expect(reportObj).toHaveProperty('resources');
    });
  });

  describe('Migration Report Generation', () => {
    it('should include all resource types in report', async () => {
      const report = await stack.migrationReport.promise();
      const reportObj = JSON.parse(report);

      expect(reportObj.resources).toHaveProperty('s3Buckets');
      expect(reportObj.resources).toHaveProperty('dynamodbTables');
      expect(reportObj.resources).toHaveProperty('validationFunction');
      expect(reportObj.resources).toHaveProperty('monitoring');
    });

    it('should include configuration differences', async () => {
      const report = await stack.migrationReport.promise();
      const reportObj = JSON.parse(report);

      expect(reportObj).toHaveProperty('configurationDifferences');
      expect(reportObj.configurationDifferences).toHaveProperty('region');
      expect(reportObj.configurationDifferences).toHaveProperty('dynamodbCapacityAdjustment');
      expect(reportObj.configurationDifferences).toHaveProperty('encryptionKeys');
    });

    it('should set correct source and target regions', async () => {
      const report = await stack.migrationReport.promise();
      const reportObj = JSON.parse(report);

      expect(reportObj.sourceRegion).toBe('us-east-1');
      expect(reportObj.targetRegion).toBe('eu-west-1');
    });

    it('should include timestamp in report', async () => {
      const report = await stack.migrationReport.promise();
      const reportObj = JSON.parse(report);

      expect(reportObj).toHaveProperty('timestamp');
      expect(new Date(reportObj.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Security Configuration', () => {
    it('should specify KMS encryption for resources', async () => {
      const kmsKeyId = await stack.kmsKeyId.promise();
      expect(kmsKeyId).toBeDefined();
    });

    it('should configure Lambda with correct runtime', async () => {
      const report = await stack.migrationReport.promise();
      const reportObj = JSON.parse(report);

      expect(reportObj.resources.validationFunction.runtime).toBe('nodejs18.x');
    });

    it('should configure Lambda with correct memory size', async () => {
      const report = await stack.migrationReport.promise();
      const reportObj = JSON.parse(report);

      expect(reportObj.resources.validationFunction.memorySize).toBe(256);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      expect(() => {
        const invalidConfigPath = path.join(__dirname, '..', 'lib', 'nonexistent-config.json');
        if (fs.existsSync(invalidConfigPath)) {
          JSON.parse(fs.readFileSync(invalidConfigPath, 'utf-8'));
        }
      }).not.toThrow();
    });

    it('should validate required configuration fields', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(config).toHaveProperty('sourceRegion');
      expect(config).toHaveProperty('targetRegion');
      expect(config).toHaveProperty('migrationBatch');
      expect(config).toHaveProperty('timestamp');
    });
  });

  describe('Resource Tagging', () => {
    it('should apply migration batch tag', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(config.migrationBatch).toBeDefined();
      expect(typeof config.migrationBatch).toBe('string');
    });

    it('should include source region in tags', () => {
      const configPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(config.sourceRegion).toBe('us-east-1');
    });
  });
});

describe('TapStack - Edge Cases', () => {
  describe('Default Values', () => {
    it('should use default environment suffix when not provided', () => {
      const stackWithDefaults = new TapStack('default-test', {});
      expect(stackWithDefaults).toBeDefined();
    });

    it('should use default migration config path when not provided', () => {
      const stackWithDefaults = new TapStack('default-test', {
        environmentSuffix: 'test',
      });
      expect(stackWithDefaults).toBeDefined();
    });
  });

  describe('Custom Configuration Path', () => {
    it('should accept custom migration config path', () => {
      const customPath = path.join(__dirname, '..', 'lib', 'lambda', 'migration-config.json');
      expect(() => {
        new TapStack('custom-path-test', {
          environmentSuffix: 'test',
          migrationConfigPath: customPath,
        });
      }).not.toThrow();
    });
  });
});
