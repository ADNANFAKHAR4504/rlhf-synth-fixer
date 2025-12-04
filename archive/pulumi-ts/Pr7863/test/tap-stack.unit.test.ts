import * as pulumi from '@pulumi/pulumi';
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
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack with environmentSuffix', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: { Environment: 'test', Team: 'qa' },
      });
    });

    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose lambdaFunctionArn output', async () => {
      const arnPromise = stack.lambdaFunctionArn.promise();
      await expect(arnPromise).resolves.toBeDefined();
    });

    it('should expose reportBucketName output', async () => {
      const bucketNamePromise = stack.reportBucketName.promise();
      await expect(bucketNamePromise).resolves.toContain('compliance-reports');
    });

    it('should expose snsTopicArn output', async () => {
      const topicArnPromise = stack.snsTopicArn.promise();
      await expect(topicArnPromise).resolves.toBeDefined();
    });
  });

  describe('Stack without environmentSuffix (defaults to dev)', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-default', {});
    });

    it('should create TapStack with default environmentSuffix', () => {
      expect(stack).toBeDefined();
    });

    it('should use dev as default environmentSuffix', async () => {
      const bucketNamePromise = stack.reportBucketName.promise();
      const bucketName = await bucketNamePromise;
      expect(bucketName).toContain('dev');
    });
  });

  describe('Stack with custom tags', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'prod',
        tags: {
          Project: 'ComplianceScanner',
          CostCenter: '12345',
          Owner: 'SecurityTeam',
        },
      });
    });

    it('should create stack with custom tags', () => {
      expect(stack).toBeDefined();
    });

    it('should expose all required outputs', async () => {
      const [lambdaArn, bucketName, topicArn] = await Promise.all([
        stack.lambdaFunctionArn.promise(),
        stack.reportBucketName.promise(),
        stack.snsTopicArn.promise(),
      ]);

      expect(lambdaArn).toBeDefined();
      expect(bucketName).toBeDefined();
      expect(topicArn).toBeDefined();
    });
  });
});
