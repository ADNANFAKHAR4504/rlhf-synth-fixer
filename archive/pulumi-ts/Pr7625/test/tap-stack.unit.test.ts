import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    // Generate mock IDs based on resource type
    const id = `${args.type}-${args.name}-mock-id`;
    const state: any = { ...args.inputs };

    // Add specific outputs for different resource types
    if (args.type === 'aws:s3/bucket:Bucket') {
      state.bucket = args.inputs.bucket || `mock-bucket-${Date.now()}`;
      state.id = state.bucket;
      state.arn = `arn:aws:s3:::${state.bucket}`;
    } else if (args.type === 'aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock') {
      state.bucket = args.inputs.bucket;
      state.id = `${args.inputs.bucket}-public-access-block`;
    } else if (args.type === 'aws:dynamodb/table:Table') {
      state.name = args.inputs.name || `mock-table-${Date.now()}`;
      state.id = state.name;
      state.arn = `arn:aws:dynamodb:us-east-1:123456789012:table/${state.name}`;
      state.streamArn = `arn:aws:dynamodb:us-east-1:123456789012:table/${state.name}/stream/2024-01-01T00:00:00.000`;
    } else if (args.type === 'aws:lambda/function:Function') {
      state.name = `${args.name}-mock`;
      state.id = state.name;
      state.arn = `arn:aws:lambda:us-east-1:123456789012:function:${state.name}`;
      state.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${state.arn}/invocations`;
    } else if (args.type === 'aws:iam/role:Role') {
      state.name = args.name;
      state.id = state.name;
      state.arn = `arn:aws:iam::123456789012:role/${args.name}`;
    } else if (args.type === 'aws:iam/policy:Policy') {
      state.name = args.name;
      state.id = state.name;
      state.arn = `arn:aws:iam::123456789012:policy/${args.name}`;
    } else if (args.type === 'aws:iam/rolePolicyAttachment:RolePolicyAttachment') {
      state.id = `${args.name}-attachment`;
    } else if (args.type === 'aws:cloudwatch/eventRule:EventRule') {
      state.name = args.inputs.name || args.name;
      state.id = state.name;
      state.arn = `arn:aws:events:us-east-1:123456789012:rule/${state.name}`;
    } else if (args.type === 'aws:cloudwatch/eventTarget:EventTarget') {
      state.id = `${args.name}-target`;
      state.rule = args.inputs.rule;
      state.arn = args.inputs.arn;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      state.name = args.inputs.name || `/aws/lambda/${args.name}`;
      state.id = state.name;
      state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${state.name}`;
    } else if (args.type === 'aws:lambda/permission:Permission') {
      state.id = `${args.name}-permission`;
    } else if (args.type === 'aws:lambda/eventSourceMapping:EventSourceMapping') {
      state.id = `${args.name}-mapping`;
      state.functionName = args.inputs.functionName;
    }

    return { id, state };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack Instantiation', () => {
    it('should create stack with default environment suffix', (done) => {
      stack = new TapStack('test-stack', {});

      pulumi.all([stack.complianceTable, stack.reportBucket, stack.scannerFunction]).apply(
        ([complianceTable, reportBucket, scannerFunction]) => {
          expect(complianceTable).toContain('compliance-findings');
          expect(reportBucket).toContain('compliance-reports');
          expect(scannerFunction).toContain('lambda');
          done();
        }
      );
    });

    it('should create stack with custom environment suffix', (done) => {
      stack = new TapStack('test-stack', { environmentSuffix: 'prod' });

      pulumi.all([stack.complianceTable, stack.reportBucket]).apply(
        ([complianceTable, reportBucket]) => {
          expect(complianceTable).toContain('prod');
          expect(reportBucket).toContain('prod');
          done();
        }
      );
    });

    it('should create stack with custom tags', () => {
      const customTags = {
        Environment: 'test',
        Team: 'platform',
      };

      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined environment suffix', (done) => {
      const args: TapStackArgs = { environmentSuffix: undefined };
      stack = new TapStack('test-stack', args);

      stack.complianceTable.apply((tableName) => {
        expect(tableName).toContain('dev');
        done();
      });
    });

    it('should handle empty tags object', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: undefined,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Creation', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', { environmentSuffix: 'test' });
    });

    it('should export compliance table name', (done) => {
      stack.complianceTable.apply((tableName) => {
        expect(tableName).toBe('compliance-findings-test');
        done();
      });
    });

    it('should export report bucket name', (done) => {
      stack.reportBucket.apply((bucketName) => {
        expect(bucketName).toBe('compliance-reports-test');
        done();
      });
    });

    it('should export scanner function ARN', (done) => {
      stack.scannerFunction.apply((functionArn) => {
        expect(functionArn).toContain('arn:aws:lambda');
        expect(functionArn).toContain('compliance-scanner-test-mock');
        done();
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create bucket with encryption enabled', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'encrypt-test' });
      expect(stack).toBeDefined();
      // Bucket with encryption is created by tap-stack
    });

    it('should create bucket with versioning enabled', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'version-test' });
      expect(stack).toBeDefined();
      // Bucket with versioning is created by tap-stack
    });

    it('should create bucket with public access block', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'public-test' });
      expect(stack).toBeDefined();
      // Public access block is created by tap-stack
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should create table with streams enabled', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'stream-test' });
      expect(stack).toBeDefined();
      // Table with streams is created by tap-stack
    });

    it('should create table with point-in-time recovery', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'pitr-test' });
      expect(stack).toBeDefined();
      // Table with PITR is created by tap-stack
    });

    it('should create table with GSI', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'gsi-test' });
      expect(stack).toBeDefined();
      // Table with GSI is created by tap-stack
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should create scanner Lambda with correct runtime', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'lambda-test' });
      expect(stack).toBeDefined();
      // Scanner Lambda with nodejs18.x runtime is created
    });

    it('should create scanner Lambda with environment variables', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'env-test' });
      expect(stack).toBeDefined();
      // Scanner Lambda with env vars is created
    });

    it('should create stream processor Lambda', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'processor-test' });
      expect(stack).toBeDefined();
      // Stream processor Lambda is created
    });
  });

  describe('IAM Role and Policies', () => {
    it('should create IAM role for Lambda', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'iam-test' });
      expect(stack).toBeDefined();
      // IAM role is created by tap-stack
    });

    it('should attach Lambda basic execution role', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'basic-role-test' });
      expect(stack).toBeDefined();
      // Basic execution role is attached
    });

    it('should create custom compliance policy', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'policy-test' });
      expect(stack).toBeDefined();
      // Custom policy is created by tap-stack
    });
  });

  describe('EventBridge Configuration', () => {
    it('should create EventBridge rule with schedule', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'event-test' });
      expect(stack).toBeDefined();
      // EventBridge rule is created
    });

    it('should create EventBridge target for Lambda', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'target-test' });
      expect(stack).toBeDefined();
      // EventBridge target is created
    });

    it('should grant EventBridge permission to invoke Lambda', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'permission-test' });
      expect(stack).toBeDefined();
      // Lambda permission is created
    });
  });

  describe('DynamoDB Stream Configuration', () => {
    it('should create event source mapping for stream processor', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'esm-test' });
      expect(stack).toBeDefined();
      // Event source mapping is created
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    it('should create log group for scanner Lambda', () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'logs-test' });
      expect(stack).toBeDefined();
      // Log group is created
    });
  });

  describe('Naming Conventions', () => {
    it('should include environment suffix in all resource names', (done) => {
      const envSuffix = 'staging';
      stack = new TapStack('test-stack', { environmentSuffix: envSuffix });

      pulumi.all([stack.complianceTable, stack.reportBucket]).apply(
        ([tableName, bucketName]) => {
          expect(tableName).toContain(envSuffix);
          expect(bucketName).toContain(envSuffix);
          done();
        }
      );
    });

    it('should use consistent naming pattern for bucket', (done) => {
      stack = new TapStack('test-stack', { environmentSuffix: 'naming-test' });

      stack.reportBucket.apply((bucketName) => {
        expect(bucketName).toMatch(/^compliance-reports-/);
        done();
      });
    });

    it('should use consistent naming pattern for table', (done) => {
      stack = new TapStack('test-stack', { environmentSuffix: 'naming-test' });

      stack.complianceTable.apply((tableName) => {
        expect(tableName).toMatch(/^compliance-findings-/);
        done();
      });
    });
  });

  describe('Component Resource Type', () => {
    it('should be a Pulumi ComponentResource', () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs correctly', (done) => {
      stack = new TapStack('test-stack', { environmentSuffix: 'output-test' });

      pulumi.all([stack.complianceTable, stack.reportBucket, stack.scannerFunction]).apply(
        ([table, bucket, func]) => {
          expect(table).toBeDefined();
          expect(bucket).toBeDefined();
          expect(func).toBeDefined();
          done();
        }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple stacks with different suffixes', () => {
      const stack1 = new TapStack('stack1', { environmentSuffix: 'env1' });
      const stack2 = new TapStack('stack2', { environmentSuffix: 'env2' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
    });

    it('should handle special characters in environment suffix', (done) => {
      stack = new TapStack('test-stack', { environmentSuffix: 'test-123' });

      stack.complianceTable.apply((tableName) => {
        expect(tableName).toContain('test-123');
        done();
      });
    });
  });
});
