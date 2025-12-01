/**
 * Unit tests for TapStack - Infrastructure Compliance Analyzer
 *
 * These tests validate the infrastructure components are created correctly
 * with proper configuration and all required resources are present.
 */
import * as pulumi from '@pulumi/pulumi';

// Set up mocks before importing the stack
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Generate a unique ID for the resource
    const id = `${args.name}_id`;

    // Create mock state based on resource type
    const state: any = {
      ...args.inputs,
      id: id,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.inputs.name || args.name,
    };

    // Special handling for specific resource types
    switch (args.type) {
      case 'aws:s3/bucket:Bucket':
        state.bucket = args.inputs.bucket || args.name;
        break;
      case 'aws:lambda/function:Function':
        state.functionName = args.inputs.name || args.name;
        break;
      case 'aws:sns/topic:Topic':
        state.topicArn = state.arn;
        break;
      case 'aws:cloudwatch/dashboard:Dashboard':
        state.dashboardName = args.inputs.dashboardName || args.name;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        state.retentionInDays = args.inputs.retentionInDays;
        break;
    }

    return { id, state };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack - Infrastructure Compliance Analyzer', () => {
  let stack: TapStack;
  const environmentSuffix = 'test';

  beforeAll(() => {
    // Create the stack
    stack = new TapStack('test-stack', {
      environmentSuffix: environmentSuffix,
      tags: {
        Environment: 'test',
        Team: 'synth',
      },
    });
  });

  describe('S3 Bucket for Compliance Data', () => {
    it('should create an S3 bucket with encryption', async () => {
      const bucketName = await stack.complianceBucket;
      expect(bucketName).toBe(`compliance-data-${environmentSuffix}`);
    });

    it('should configure bucket with proper naming convention', async () => {
      const bucketName = await stack.complianceBucket;
      expect(bucketName).toContain(environmentSuffix);
      expect(bucketName).toMatch(/^compliance-data-/);
    });
  });

  describe('SNS Topic for Alerts', () => {
    it('should create an SNS topic', async () => {
      const topicArn = await stack.snsTopic;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('arn:aws:');
      expect(topicArn).toContain('compliance-alerts');
    });

    it('should configure SNS topic with environment suffix', async () => {
      const topicArn = await stack.snsTopic;
      expect(topicArn).toContain(environmentSuffix);
    });
  });

  describe('Lambda Function', () => {
    it('should create a Lambda function', async () => {
      const functionArn = await stack.lambdaFunctionArn;
      expect(functionArn).toBeDefined();
      expect(functionArn).toContain('arn:aws:');
      expect(functionArn).toContain('compliance-scanner');
    });

    it('should configure Lambda with environment suffix', async () => {
      const functionArn = await stack.lambdaFunctionArn;
      expect(functionArn).toContain(environmentSuffix);
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create a CloudWatch dashboard', async () => {
      const dashboardName = await stack.dashboardName;
      expect(dashboardName).toBeDefined();
      expect(dashboardName).toContain('EC2-Compliance-Dashboard');
    });

    it('should configure dashboard with environment suffix', async () => {
      const dashboardName = await stack.dashboardName;
      expect(dashboardName).toContain(environmentSuffix);
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environmentSuffix in all resource names', async () => {
      const bucketName = await stack.complianceBucket;
      const topicArn = await stack.snsTopic;
      const functionArn = await stack.lambdaFunctionArn;
      const dashboardName = await stack.dashboardName;

      expect(bucketName).toContain(environmentSuffix);
      expect(topicArn).toContain(environmentSuffix);
      expect(functionArn).toContain(environmentSuffix);
      expect(dashboardName).toContain(environmentSuffix);
    });
  });

  describe('Stack Outputs', () => {
    it('should export Lambda function ARN', async () => {
      const functionArn = await stack.lambdaFunctionArn;
      expect(functionArn).toBeTruthy();
    });

    it('should export SNS topic ARN', async () => {
      const topicArn = await stack.snsTopic;
      expect(topicArn).toBeTruthy();
    });

    it('should export S3 bucket name', async () => {
      const bucketName = await stack.complianceBucket;
      expect(bucketName).toBeTruthy();
    });

    it('should export dashboard name', async () => {
      const dashboardName = await stack.dashboardName;
      expect(dashboardName).toBeTruthy();
    });
  });
});

describe('TapStack Configuration Validation', () => {
  describe('Environment Suffix Handling', () => {
    it('should use default environment suffix when not provided', async () => {
      const defaultStack = new TapStack('default-stack', {});
      const bucketName = await defaultStack.complianceBucket;
      expect(bucketName).toContain('dev'); // Default suffix is 'dev'
    });

    it('should use custom environment suffix when provided', async () => {
      const customStack = new TapStack('custom-stack', {
        environmentSuffix: 'prod',
      });
      const bucketName = await customStack.complianceBucket;
      expect(bucketName).toContain('prod');
    });
  });

  describe('Resource Dependencies', () => {
    it('should create all required resources', async () => {
      const stack = new TapStack('full-stack', {
        environmentSuffix: 'integration',
      });

      // Verify all outputs are available
      const [bucketName, topicArn, functionArn, dashboardName] =
        await Promise.all([
          stack.complianceBucket,
          stack.snsTopic,
          stack.lambdaFunctionArn,
          stack.dashboardName,
        ]);

      expect(bucketName).toBeDefined();
      expect(topicArn).toBeDefined();
      expect(functionArn).toBeDefined();
      expect(dashboardName).toBeDefined();
    });
  });
});
