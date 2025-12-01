import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

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
    } else if (args.type === 'aws:cloudwatch/eventRule:EventRule') {
      state.name = args.inputs.name || args.name;
      state.id = state.name;
      state.arn = `arn:aws:events:us-east-1:123456789012:rule/${state.name}`;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      state.name = args.inputs.name || `/aws/lambda/${args.name}`;
      state.id = state.name;
      state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${state.name}`;
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
  });

  describe('Component Resource Type', () => {
    it('should be a Pulumi ComponentResource', () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });
});
