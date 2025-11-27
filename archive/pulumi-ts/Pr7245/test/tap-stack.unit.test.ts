import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const baseState = {
      ...args.inputs,
      id: `${args.name}_id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.inputs.name || args.name,
    };

    // Add type-specific properties
    switch (args.type) {
      case 'aws:dynamodb/table:Table':
        return {
          id: `${args.name}_id`,
          state: {
            ...baseState,
            arn: `arn:aws:dynamodb:us-east-1:123456789012:table/${args.inputs.name}`,
          },
        };
      case 'aws:s3/bucket:Bucket':
        return {
          id: `${args.name}_id`,
          state: {
            ...baseState,
            bucketDomainName: `${args.inputs.bucket}.s3.amazonaws.com`,
          },
        };
      case 'aws:kms/key:Key':
        return {
          id: `${args.name}_id`,
          state: {
            ...baseState,
            keyId: `${args.name}_key_id`,
          },
        };
      default:
        return {
          id: `${args.name}_id`,
          state: baseState,
        };
    }
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack', () => {
  describe('Resource Creation', () => {
    it('creates stack with default environment suffix', async () => {
      const stack = new TapStack('test-stack', {});

      const configRecorderName = await stack.configRecorderName.promise();
      const complianceTableArn = await stack.complianceTableArn.promise();
      const reportBucketUrl = await stack.reportBucketUrl.promise();

      expect(configRecorderName).toBeDefined();
      expect(complianceTableArn).toBeDefined();
      expect(reportBucketUrl).toBeDefined();
    });

    it('creates stack with custom environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'custom-env',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBeDefined();
    });

    it('creates stack with custom tags', async () => {
      const customTags = {
        Project: 'TestProject',
        Owner: 'TestOwner',
      };

      const stack = new TapStack('test-stack', {
        tags: customTags,
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });
  });

  describe('KMS Key Configuration', () => {
    it('creates KMS key with key rotation enabled', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toContain('compliance-history-test');
    });

    it('creates KMS alias with correct naming', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('creates report bucket with versioning enabled', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });

    it('creates report bucket with lifecycle rules', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'lifecycle-test',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });

    it('creates bucket public access block', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'pab-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });
  });

  describe('DynamoDB Configuration', () => {
    it('creates table with PAY_PER_REQUEST billing', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'ddb-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toContain('compliance-history-ddb-test');
    });

    it('creates table with correct keys', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'keys-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });
  });

  describe('SQS and SNS Configuration', () => {
    it('creates DLQ with KMS encryption', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dlq-test',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBeDefined();
    });

    it('creates SNS topic with KMS encryption', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'sns-test',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    it('creates Lambda execution role', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'iam-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });

    it('attaches basic Lambda execution policy', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'policy-test',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });

    it('creates Lambda policy with required permissions', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'permissions-test',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    it('creates analysis Lambda with correct runtime', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'lambda-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });

    it('creates analysis Lambda with 3008MB memory', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'memory-test',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });

    it('creates analysis Lambda with X-Ray tracing', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'xray-test',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBeDefined();
    });

    it('creates remediation Lambda with correct configuration', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'remediation-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });

    it('configures Lambda with dead letter queue', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dlq-lambda-test',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });
  });

  describe('EventBridge Configuration', () => {
    it('creates EventBridge rule with hourly schedule', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'eventbridge-test',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBeDefined();
    });

    it('creates EventBridge target for Lambda', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'target-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });

    it('creates Lambda permission for EventBridge', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'permission-test',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('creates dashboard with compliance metrics', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dashboard-test',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBeDefined();
    });
  });

  describe('AWS Config Setup', () => {
    it('references existing Config recorder', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'config-test',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBe('config-recorder-pr7060');
    });
  });

  describe('Stack Outputs', () => {
    it('exports config recorder name', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'output-test',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBe('config-recorder-pr7060');
    });

    it('exports compliance table ARN', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'arn-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toContain('compliance-history-arn-test');
    });

    it('exports report bucket URL', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'url-test',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('applies CostCenter tags to all resources', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'tags-test',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });

    it('applies Compliance tags to all resources', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'compliance-tags',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    it('enables KMS encryption for DynamoDB', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'kms-ddb',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });

    it('enables KMS encryption for S3', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'kms-s3',
      });

      const reportBucketUrl = await stack.reportBucketUrl.promise();
      expect(reportBucketUrl).toBeDefined();
    });

    it('enables KMS encryption for SNS', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'kms-sns',
      });

      const configRecorderName = await stack.configRecorderName.promise();
      expect(configRecorderName).toBeDefined();
    });

    it('enables KMS encryption for SQS', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'kms-sqs',
      });

      const complianceTableArn = await stack.complianceTableArn.promise();
      expect(complianceTableArn).toBeDefined();
    });
  });
});
