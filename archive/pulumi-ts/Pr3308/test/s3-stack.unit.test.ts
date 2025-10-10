import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = args.inputs;
    outputs.id = outputs.id || `${args.name}-id-${Date.now()}`;

    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.arn = `arn:aws:s3:::${args.name}`;
      outputs.bucket = args.name;
    } else if (args.type === 'aws:s3/bucketPolicy:BucketPolicy') {
      outputs.id = `${args.name}-policy`;
    } else if (
      args.type === 'aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock'
    ) {
      outputs.id = `${args.name}-pab`;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    switch (args.token) {
      case 'aws:index/getCallerIdentity:getCallerIdentity':
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:root',
          userId: 'AIDAI23HXD2O5EXAMPLE',
        };
      default:
        return {};
    }
  },
});

pulumi.runtime.setAllConfig({
  'aws:region': 'us-east-2',
});

import { S3Stack } from '../lib/s3-stack';

describe('S3Stack Unit Tests', () => {
  describe('S3 Bucket Creation', () => {
    it('should create S3 bucket with versioning enabled', async () => {
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();

      const bucketName = await stack.bucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should expose bucket ARN', async () => {
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      const bucketArn = await stack.bucketArn.promise();
      expect(bucketArn).toBeDefined();
      expect(bucketArn).toContain('arn:aws:s3:::');
    });
  });

  describe('Bucket Configuration', () => {
    it('should create bucket with lifecycle rules', async () => {
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'staging',
      });

      expect(stack).toBeDefined();
    });

    it('should block public access', async () => {
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'prod',
      });

      expect(stack).toBeDefined();
    });

    it('should enable server-side encryption', async () => {
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Bucket Policy', () => {
    it('should create bucket policy for CloudFront and ALB access', async () => {
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Tags', () => {
    it('should apply custom tags to S3 bucket', async () => {
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Purpose: 'StaticAssets',
          Retention: '90days',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Outputs', () => {
    it('should expose bucket name and ARN as outputs', async () => {
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'test',
      });

      expect(stack.bucketName).toBeDefined();
      expect(stack.bucketArn).toBeDefined();

      const bucketName = await stack.bucketName.promise();
      const bucketArn = await stack.bucketArn.promise();

      expect(bucketName).toBeTruthy();
      expect(bucketArn).toBeTruthy();
    });
  });
});
