import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('S3 Compliance Analysis Stack', () => {
  let stack: any;

  beforeAll(async () => {
    // Set config - Pulumi looks for project:key format
    pulumi.runtime.setConfig('project:environmentSuffix', 'test');
    pulumi.runtime.setConfig('project:region', 'us-east-1');

    // Import the stack using require instead of dynamic import
    stack = require('../index');
  });

  describe('Exports', () => {
    test('should export SNS topic ARN', done => {
      pulumi.all([stack.snsTopicArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('test');
        done();
      });
    });

    test('should export SQS queue URL', done => {
      pulumi.all([stack.sqsQueueUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        expect(url).toContain('test');
        done();
      });
    });

    test('should export Lambda function name', done => {
      pulumi.all([stack.lambdaFunctionName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('test');
        done();
      });
    });

    test('should export Step Functions ARN', done => {
      pulumi.all([stack.stateMachineArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('test');
        done();
      });
    });

    test('should export CloudWatch alarm ARN', done => {
      pulumi.all([stack.complianceAlarmArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('test');
        done();
      });
    });

    test('should export environment suffix', done => {
      pulumi.all([stack.environment_suffix]).apply(([suffix]) => {
        expect(suffix).toBe('test');
        done();
      });
    });

    test('should export region', done => {
      pulumi.all([stack.region_deployed]).apply(([region]) => {
        expect(region).toBe('us-east-1');
        done();
      });
    });
  });
});
