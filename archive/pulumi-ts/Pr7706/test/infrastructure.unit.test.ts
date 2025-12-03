import * as pulumi from '@pulumi/pulumi';
import { createInfrastructure } from '../lib/infrastructure';

// Mock Pulumi runtime before importing the infrastructure code
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    return args.inputs;
  },
});

describe('Infrastructure Creation Unit Tests', () => {
  let outputs: ReturnType<typeof createInfrastructure>;

  beforeAll(() => {
    outputs = createInfrastructure('test');
  });

  describe('S3 Bucket Outputs', () => {
    it('should return reportBucketName', () => {
      expect(outputs.reportBucketName).toBeDefined();
    });

    it('should return reportBucketArn', () => {
      expect(outputs.reportBucketArn).toBeDefined();
    });
  });

  describe('Lambda Function Outputs', () => {
    it('should return auditLambdaArn', () => {
      expect(outputs.auditLambdaArn).toBeDefined();
    });

    it('should return auditLambdaName', () => {
      expect(outputs.auditLambdaName).toBeDefined();
    });
  });

  describe('EventBridge Rule Outputs', () => {
    it('should return weeklyRuleName', () => {
      expect(outputs.weeklyRuleName).toBeDefined();
    });
  });

  describe('CloudWatch Log Group Outputs', () => {
    it('should return logGroupName', () => {
      expect(outputs.logGroupName).toBeDefined();
    });
  });

  describe('All Outputs', () => {
    it('should return all required outputs', () => {
      expect(outputs.reportBucketName).toBeDefined();
      expect(outputs.reportBucketArn).toBeDefined();
      expect(outputs.auditLambdaArn).toBeDefined();
      expect(outputs.auditLambdaName).toBeDefined();
      expect(outputs.weeklyRuleName).toBeDefined();
      expect(outputs.logGroupName).toBeDefined();
    });
  });
});
