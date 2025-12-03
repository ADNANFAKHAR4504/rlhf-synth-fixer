/**
 * Unit tests for the AWS Config compliance system TapStack.
 *
 * These tests verify that the infrastructure is correctly defined
 * and that all required resources are created with proper configuration.
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      id: `${args.name}-id`,
      name: args.name,
    };

    // Add resource-specific outputs
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || args.name;
      outputs.arn = `arn:aws:s3:::${outputs.bucket}`;
    } else if (args.type === 'aws:sns/topic:Topic') {
      outputs.arn = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`;
      outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${outputs.arn}/invocations`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
    } else if (args.type === 'aws:cfg/recorder:Recorder') {
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:cloudwatch/dashboard:Dashboard') {
      outputs.dashboardName = args.inputs.dashboardName || args.name;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI1234567890',
      };
    }
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  let stack: any;

  beforeAll(async () => {
    // Import after mocks are set up
    const { TapStack } = await import('../lib/tap-stack');

    // Create the stack for testing
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
    });
  });

  describe('Stack Outputs', () => {
    it('should export configRecorderName', (done) => {
      pulumi.all([stack.configRecorderName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        expect(name).toContain('config-recorder');
        expect(name).toContain('test');
        done();
      });
    });

    it('should export bucketArn', (done) => {
      pulumi.all([stack.bucketArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        expect(arn).toContain('arn:aws:s3:::');
        expect(arn).toContain('config-bucket');
        done();
      });
    });

    it('should export snsTopicArn', (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        expect(arn).toContain('arn:aws:sns:');
        expect(arn).toContain('compliance');
        done();
      });
    });

    it('should export lambdaFunctionName', (done) => {
      pulumi.all([stack.lambdaFunctionName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        expect(name).toContain('compliance-reporter');
        expect(name).toContain('test');
        done();
      });
    });

    it('should export dashboardName', (done) => {
      pulumi.all([stack.dashboardName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        expect(name).toContain('compliance-metrics');
        done();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environmentSuffix in all resource names', (done) => {
      const outputs = [
        stack.configRecorderName,
        stack.lambdaFunctionName,
        stack.dashboardName,
      ];

      pulumi.all(outputs).apply((values) => {
        values.forEach((value) => {
          expect(value).toContain('test');
        });
        done();
      });
    });

    it('should use correct naming pattern for resources', (done) => {
      pulumi.all([stack.configRecorderName]).apply(([recorderName]) => {
        // Should follow pattern: {resource-type}-{environmentSuffix}
        expect(recorderName).toMatch(/^config-recorder-[a-z0-9]+$/);
        done();
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create S3 bucket with correct naming', (done) => {
      pulumi.all([stack.bucketArn]).apply(([arn]) => {
        expect(arn).toMatch(/config-bucket-test/);
        done();
      });
    });

    it('should have ARN format for S3 bucket', (done) => {
      pulumi.all([stack.bucketArn]).apply(([arn]) => {
        expect(arn).toMatch(/^arn:aws:s3:::/);
        done();
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should create SNS topic with correct ARN format', (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([arn]) => {
        expect(arn).toMatch(
          /^arn:aws:sns:us-east-1:\d{12}:compliance-/
        );
        done();
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should create Lambda function with compliance-reporter name', (done) => {
      pulumi.all([stack.lambdaFunctionName]).apply(([name]) => {
        expect(name).toContain('compliance-reporter');
        expect(name).toContain('test');
        done();
      });
    });
  });

  describe('Config Recorder', () => {
    it('should create Config recorder with correct name', (done) => {
      pulumi.all([stack.configRecorderName]).apply(([name]) => {
        expect(name).toContain('config-recorder');
        expect(name).toContain('test');
        done();
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create dashboard with compliance-metrics name', (done) => {
      pulumi.all([stack.dashboardName]).apply(([name]) => {
        expect(name).toContain('compliance-metrics');
        done();
      });
    });
  });

  describe('Integration Points', () => {
    it('should have all required outputs defined', () => {
      expect(stack.configRecorderName).toBeDefined();
      expect(stack.bucketArn).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.lambdaFunctionName).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should use Pulumi Outputs for all exported values', () => {
      expect(stack.configRecorderName).toBeInstanceOf(pulumi.Output);
      expect(stack.bucketArn).toBeInstanceOf(pulumi.Output);
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
      expect(stack.lambdaFunctionName).toBeInstanceOf(pulumi.Output);
      expect(stack.dashboardName).toBeInstanceOf(pulumi.Output);
    });
  });
});

describe('Configuration Module Tests', () => {
  it('should use correct default values', async () => {
    const { DEFAULT_CONFIG } = await import('../lib/config');

    expect(DEFAULT_CONFIG.region).toBe('us-east-1');
    expect(DEFAULT_CONFIG.requiredTags).toEqual([
      'Environment',
      'Owner',
      'CostCenter',
    ]);
    expect(DEFAULT_CONFIG.s3LifecycleTransitionDays).toBe(90);
    expect(DEFAULT_CONFIG.reportSchedule).toBe('rate(1 day)');
    expect(DEFAULT_CONFIG.lambdaTimeout).toBe(300);
  });

  it('should merge user config with defaults', async () => {
    const { getConfig } = await import('../lib/config');

    const config = getConfig({
      environmentSuffix: 'prod',
      region: 'us-west-2',
    });

    expect(config.environmentSuffix).toBe('prod');
    expect(config.region).toBe('us-west-2');
    expect(config.requiredTags).toEqual([
      'Environment',
      'Owner',
      'CostCenter',
    ]);
  });
});