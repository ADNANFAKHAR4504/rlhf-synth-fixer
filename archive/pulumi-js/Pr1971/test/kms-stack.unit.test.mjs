import * as pulumi from '@pulumi/pulumi';
import { KMSStack } from '../lib/kms-stack.mjs';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args) => {
    switch (args.type) {
      case 'aws:kms/key:Key':
        return {
          id: 'mock-kms-key-id',
          state: {
            keyId: 'mock-kms-key-id',
            arn: `arn:aws:kms:us-west-2:123456789012:key/mock-kms-key-id`,
            enableKeyRotation: true,
          },
        };
      case 'aws:kms/alias:Alias':
        return {
          id: 'mock-alias-id',
          state: {
            name: args.inputs.name || 'alias/tap-s3-us-west-2-dev',
          },
        };
      default:
        return {
          id: `${args.name}-id`,
          state: {},
        };
    }
  },
  call: (args) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
});

describe('KMSStack', () => {
  test('creates KMS key with proper configuration', async () => {
    const stack = new KMSStack('test-kms', {
      region: 'us-west-2',
      environmentSuffix: 'test',
      tags: { TestTag: 'TestValue' },
    });

    // Use pulumi.output to handle Output values properly
    const keyId = await pulumi.output(stack.s3Key.keyId).promise();
    const keyArn = await pulumi.output(stack.s3Key.arn).promise();
    const enableKeyRotation = await pulumi.output(stack.s3Key.enableKeyRotation).promise();

    expect(keyId).toBe('mock-kms-key-id');
    expect(keyArn).toBe('arn:aws:kms:us-west-2:123456789012:key/mock-kms-key-id');
    expect(enableKeyRotation).toBe(true);
  });

  test('creates KMS alias with correct name', async () => {
    const stack = new KMSStack('test-kms', {
      region: 'us-west-2',
      environmentSuffix: 'test',
    });

    const aliasName = await pulumi.output(stack.s3KeyAlias.name).promise();
    expect(aliasName).toBe('alias/tap-s3-us-west-2-test');
  });
});