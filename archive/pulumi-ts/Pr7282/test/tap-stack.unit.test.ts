import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';
import { handler } from '../lib/lambda/index';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}_id`,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI123456789012345',
      };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      region: 'us-east-1',
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR', done => {
      pulumi.all([stack.vpc.cidrBlock]).apply(([cidr]) => {
        expect(cidr).toBe('10.0.0.0/16');
        done();
      });
    });

    it('should enable DNS hostnames and support', done => {
      pulumi
        .all([stack.vpc.enableDnsHostnames, stack.vpc.enableDnsSupport])
        .apply(([hostnames, support]) => {
          expect(hostnames).toBe(true);
          expect(support).toBe(true);
          done();
        });
    });

    it('should have proper tags with environmentSuffix', done => {
      pulumi.all([stack.vpc.tags]).apply(([tags]) => {
        expect(tags).toBeDefined();
        expect(tags.Environment).toBe('test123-aj');
        expect(tags.DataClassification).toBe('PCI-DSS');
        expect(tags.Owner).toBe('SecurityTeam');
        done();
      });
    });
  });

  describe('KMS Configuration', () => {
    it('should create KMS key with rotation enabled', done => {
      pulumi.all([stack.kmsKey.enableKeyRotation]).apply(([rotation]) => {
        expect(rotation).toBe(true);
        done();
      });
    });

    it('should have proper tags', done => {
      pulumi.all([stack.kmsKey.tags]).apply(([tags]) => {
        expect(tags).toBeDefined();
        expect(tags.Environment).toBe('test123-aj');
        expect(tags.DataClassification).toBe('PCI-DSS');
        done();
      });
    });

    it('should have description', done => {
      pulumi.all([stack.kmsKey.description]).apply(([desc]) => {
        expect(desc).toBe('KMS key for financial data encryption');
        done();
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create bucket with environmentSuffix in name', done => {
      pulumi.all([stack.bucket.bucket]).apply(([bucketName]) => {
        expect(bucketName).toContain('test123');
        expect(bucketName).toBe('financial-data-test123-aj');
        done();
      });
    });

    it('should enable versioning', done => {
      pulumi.all([stack.bucket.versioning]).apply(([versioning]) => {
        expect(versioning).toBeDefined();
        expect(versioning.enabled).toBe(true);
        done();
      });
    });

    it('should have KMS encryption configured', done => {
      pulumi
        .all([stack.bucket.serverSideEncryptionConfiguration])
        .apply(([encryption]) => {
          expect(encryption).toBeDefined();
          expect(encryption.rule).toBeDefined();
          expect(
            encryption.rule.applyServerSideEncryptionByDefault
          ).toBeDefined();
          expect(
            encryption.rule.applyServerSideEncryptionByDefault.sseAlgorithm
          ).toBe('aws:kms');
          done();
        });
    });

    it('should have proper tags', done => {
      pulumi.all([stack.bucket.tags]).apply(([tags]) => {
        expect(tags).toBeDefined();
        expect(tags.Environment).toBe('test123-aj');
        expect(tags.DataClassification).toBe('PCI-DSS');
        expect(tags.Owner).toBe('SecurityTeam');
        done();
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should create table with environmentSuffix in name', done => {
      pulumi.all([stack.auditTable.name]).apply(([tableName]) => {
        expect(tableName).toContain('test123');
        expect(tableName).toBe('audit-logs-test123-aj');
        done();
      });
    });

    it('should use on-demand billing', done => {
      pulumi.all([stack.auditTable.billingMode]).apply(([billing]) => {
        expect(billing).toBe('PAY_PER_REQUEST');
        done();
      });
    });

    it('should have KMS encryption enabled', done => {
      pulumi
        .all([stack.auditTable.serverSideEncryption])
        .apply(([encryption]) => {
          expect(encryption).toBeDefined();
          expect(encryption.enabled).toBe(true);
          done();
        });
    });

    it('should have point-in-time recovery enabled', done => {
      pulumi.all([stack.auditTable.pointInTimeRecovery]).apply(([pitr]) => {
        expect(pitr).toBeDefined();
        expect(pitr.enabled).toBe(true);
        done();
      });
    });

    it('should have correct hash key', done => {
      pulumi.all([stack.auditTable.hashKey]).apply(([hashKey]) => {
        expect(hashKey).toBe('id');
        done();
      });
    });
  });

  describe('Lambda Configuration', () => {
    it('should create function with environmentSuffix in name', done => {
      pulumi.all([stack.lambdaFunction.name]).apply(([functionName]) => {
        expect(functionName).toContain('test123');
        expect(functionName).toBe('data-processor-test123-aj');
        done();
      });
    });

    it('should use Node.js 18.x runtime', done => {
      pulumi.all([stack.lambdaFunction.runtime]).apply(([runtime]) => {
        expect(runtime).toBe(aws.lambda.Runtime.NodeJS18dX);
        done();
      });
    });

    it('should have 1024MB memory', done => {
      pulumi.all([stack.lambdaFunction.memorySize]).apply(([memory]) => {
        expect(memory).toBe(1024);
        done();
      });
    });

    it('should have 300 second timeout', done => {
      pulumi.all([stack.lambdaFunction.timeout]).apply(([timeout]) => {
        expect(timeout).toBe(300);
        done();
      });
    });

    it('should have VPC configuration', done => {
      pulumi.all([stack.lambdaFunction.vpcConfig]).apply(([vpcConfig]) => {
        expect(vpcConfig).toBeDefined();
        expect(vpcConfig.subnetIds).toBeDefined();
        expect(vpcConfig.securityGroupIds).toBeDefined();
        done();
      });
    });

    it('should have proper tags', done => {
      pulumi.all([stack.lambdaFunction.tags]).apply(([tags]) => {
        expect(tags).toBeDefined();
        expect(tags.Environment).toBe('test123-aj');
        expect(tags.DataClassification).toBe('PCI-DSS');
        expect(tags.Owner).toBe('SecurityTeam');
        done();
      });
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    it('should create log group with environmentSuffix in name', done => {
      pulumi.all([stack.logGroup.name]).apply(([logName]) => {
        expect(logName).toContain('test123');
        expect(logName).toBe('/aws/lambda/data-processor-test123-aj');
        done();
      });
    });

    it('should have 90 day retention', done => {
      pulumi.all([stack.logGroup.retentionInDays]).apply(([retention]) => {
        expect(retention).toBe(90);
        done();
      });
    });

    it('should have KMS encryption', done => {
      pulumi.all([stack.logGroup.kmsKeyId]).apply(([kmsKeyId]) => {
        expect(kmsKeyId).toBeDefined();
        done();
      });
    });
  });

  describe('Resource Naming Validation', () => {
    it('should include environmentSuffix in all named resources', done => {
      const suffix = 'test123';
      pulumi
        .all([
          stack.bucket.bucket,
          stack.auditTable.name,
          stack.lambdaFunction.name,
          stack.logGroup.name,
        ])
        .apply(([bucketName, tableName, functionName, logName]) => {
          expect(bucketName).toContain(suffix);
          expect(tableName).toContain(suffix);
          expect(functionName).toContain(suffix);
          expect(logName).toContain(suffix);
          done();
        });
    });
  });

  describe('Security Configuration', () => {
    it('should not allow deletion protection', done => {
      // Verify no deletion protection on DynamoDB
      pulumi
        .all([stack.auditTable.deletionProtectionEnabled])
        .apply(([protection]) => {
          expect(protection).toBeUndefined();
          done();
        });
    });

    it('should have all resources with required tags', done => {
      const checkTags = (tags: any) => {
        expect(tags).toBeDefined();
        expect(tags.Environment).toBeDefined();
        expect(tags.DataClassification).toBeDefined();
        expect(tags.Owner).toBeDefined();
      };

      pulumi
        .all([
          stack.vpc.tags,
          stack.kmsKey.tags,
          stack.bucket.tags,
          stack.auditTable.tags,
          stack.lambdaFunction.tags,
          stack.logGroup.tags,
        ])
        .apply(
          ([
            vpcTags,
            kmsTags,
            bucketTags,
            tableTags,
            functionTags,
            logTags,
          ]) => {
            checkTags(vpcTags);
            checkTags(kmsTags);
            checkTags(bucketTags);
            checkTags(tableTags);
            checkTags(functionTags);
            checkTags(logTags);
            done();
          }
        );
    });
  });

  describe('Outputs', () => {
    it('should export KMS key ARN', done => {
      pulumi.all([stack.kmsKey.arn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should export bucket name', done => {
      pulumi.all([stack.bucket.bucket]).apply(([bucket]) => {
        expect(bucket).toBeDefined();
        expect(typeof bucket).toBe('string');
        done();
      });
    });

    it('should export Lambda ARN', done => {
      pulumi.all([stack.lambdaFunction.arn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should export VPC ID', done => {
      pulumi.all([stack.vpc.id]).apply(([id]) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export audit table name', done => {
      pulumi.all([stack.auditTable.name]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });
});

// Lambda Function Tests
const s3Mock = mockClient(S3Client);
const dynamoMock = mockClient(DynamoDBClient);

describe('Lambda Function Unit Tests', () => {
  beforeAll(() => {
    process.env.BUCKET_NAME = 'test-bucket';
    process.env.AUDIT_TABLE = 'test-audit-table';
    process.env.KMS_KEY_ID = 'test-kms-key-id';
  });

  beforeEach(() => {
    s3Mock.reset();
    dynamoMock.reset();
  });

  describe('Successful Processing', () => {
    it('should process S3 event and create audit log', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).message).toBe('Processing complete');
      expect(s3Mock.calls().length).toBe(1);
      expect(dynamoMock.calls().length).toBe(1);
    });

    it('should process multiple S3 records', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file1.txt' },
            },
          },
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file2.txt' },
            },
          },
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file3.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(3);
      expect(dynamoMock.calls().length).toBe(3);
    });

    it('should create audit log with correct structure', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      let auditLogItem: any;
      dynamoMock.on(PutItemCommand).callsFake(input => {
        auditLogItem = input.Item;
        return {};
      });

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      await handler(event);

      expect(auditLogItem).toBeDefined();
      expect(auditLogItem.id).toBeDefined();
      expect(auditLogItem.timestamp).toBeDefined();
      expect(auditLogItem.action.S).toBe('FILE_PROCESSED');
      expect(auditLogItem.fileName.S).toBe('test-file.txt');
      expect(auditLogItem.status.S).toBe('SUCCESS');
    });
  });

  describe('Error Handling', () => {
    it('should handle S3 GetObject errors gracefully', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('S3 access denied'));
      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      // Should still return 200 as individual file errors are logged
      expect(result.statusCode).toBe(200);
      expect(dynamoMock.calls().length).toBe(1);

      // Check that error was logged
      const dynamoCalls = dynamoMock.calls();
      const errorLog = dynamoCalls[0].args[0].input as any;
      expect(errorLog.Item.status.S).toBe('FAILED');
      expect(errorLog.Item.action.S).toBe('FILE_PROCESSING_ERROR');
    });

    it('should handle missing key in S3 event', async () => {
      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: {}, // Missing key
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(0);
      expect(dynamoMock.calls().length).toBe(0);
    });

    it('should handle empty Records array', async () => {
      const event = {
        Records: [],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(0);
      expect(dynamoMock.calls().length).toBe(0);
    });

    it('should handle missing Records property', async () => {
      const event = {};

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(0);
      expect(dynamoMock.calls().length).toBe(0);
    });

    it('should continue processing after individual file error', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      // First call fails, second succeeds
      s3Mock
        .on(GetObjectCommand)
        .rejectsOnce(new Error('S3 error'))
        .resolves({
          Body: mockStream as any,
        });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file1.txt' },
            },
          },
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'file2.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(2);
      // One error log + one success log
      expect(dynamoMock.calls().length).toBe(2);
    });

    it('should log critical errors to DynamoDB when possible', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('Critical S3 error'));
      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(dynamoMock.calls().length).toBeGreaterThan(0);
    });

    it('should handle DynamoDB PutItem errors', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).rejects(new Error('DynamoDB error'));

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      // Should still process without throwing
      const result = await handler(event);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Environment Variables', () => {
    it('should use environment variables for configuration', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      let dynamoTableName: string | undefined;
      dynamoMock.on(PutItemCommand).callsFake(input => {
        dynamoTableName = input.TableName;
        return {};
      });

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      await handler(event);

      expect(dynamoTableName).toBe('test-audit-table');
    });
  });

  describe('Data Validation', () => {
    it('should handle empty file content', async () => {
      const mockStream = Readable.from(['']);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'empty-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(dynamoMock.calls().length).toBe(1);
    });

    it('should handle large file content', async () => {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB
      const mockStream = Readable.from([largeData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'large-file.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(dynamoMock.calls().length).toBe(1);
    });

    it('should handle special characters in file names', async () => {
      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'special/file-name_123.txt' },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(1);

      const s3Call = s3Mock.calls()[0].args[0].input as any;
      expect(s3Call.Key).toBe('special/file-name_123.txt');
    });
  });

  describe('Logging', () => {
    it('should log event details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const testData = 'test file content';
      const mockStream = Readable.from([testData]);

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      await handler(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Event received:',
        expect.any(String)
      );
      expect(consoleSpy).toHaveBeenCalledWith('Processing file: test-file.txt');

      consoleSpy.mockRestore();
    });

    it('should log errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      s3Mock.on(GetObjectCommand).rejects(new Error('Test error'));
      dynamoMock.on(PutItemCommand).resolves({});

      const event = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-file.txt' },
            },
          },
        ],
      };

      await handler(event);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

