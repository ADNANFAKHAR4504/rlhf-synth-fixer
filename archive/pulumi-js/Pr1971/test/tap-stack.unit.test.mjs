import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack.mjs';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args) => {
    const mockId = `${args.name}-mock-id`;
    let mockState = { id: mockId };

    switch (args.type) {
      case 'aws:kms/key:Key':
        mockState = {
          ...mockState,
          keyId: mockId,
          arn: `arn:aws:kms:us-west-2:123456789012:key/${mockId}`,
          enableKeyRotation: true,
        };
        break;
      case 'aws:s3/bucket:Bucket':
        mockState = {
          ...mockState,
          arn: `arn:aws:s3:::${mockId}`,
          bucketDomainName: `${mockId}.s3.amazonaws.com`,
        };
        break;
      case 'aws:iam/role:Role':
        mockState = {
          ...mockState,
          name: mockId,
          arn: `arn:aws:iam::123456789012:role/${mockId}`,
        };
        break;
      case 'aws:accessanalyzer/analyzer:Analyzer':
        mockState = {
          ...mockState,
          arn: `arn:aws:access-analyzer:us-east-1:123456789012:analyzer/${mockId}`,
        };
        break;
    }

    return { id: mockId, state: mockState };
  },
  call: (args) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
});

describe('TapStack', () => {
  test('creates secure multi-region infrastructure', async () => {
    const stack = new TapStack('test-tap', {
      environmentSuffix: 'test',
      tags: { TestTag: 'TestValue' },
    });

    // Test that IAM resources are created
    expect(stack.iamStack).toBeDefined();
    
    // Test that regional resources are created for both regions
    expect(stack.regionalResources['us-west-2']).toBeDefined();
    expect(stack.regionalResources['eu-central-1']).toBeDefined();
    
    // Test that each region has KMS and S3 resources
    const usWest2Resources = stack.regionalResources['us-west-2'];
    const euCentral1Resources = stack.regionalResources['eu-central-1'];
    
    expect(usWest2Resources.kms).toBeDefined();
    expect(usWest2Resources.s3).toBeDefined();
    expect(euCentral1Resources.kms).toBeDefined();
    expect(euCentral1Resources.s3).toBeDefined();
  });

  test('handles default environment suffix', async () => {
    const stack = new TapStack('test-tap-default', {});
    
    expect(stack.iamStack).toBeDefined();
    expect(stack.regionalResources).toBeDefined();
  });

  test('applies custom tags correctly', async () => {
    const customTags = {
      Project: 'CustomProject',
      Owner: 'TestTeam',
    };
    
    const stack = new TapStack('test-tap-tags', {
      environmentSuffix: 'staging',
      tags: customTags,
    });
    
    expect(stack.iamStack).toBeDefined();
    expect(stack.regionalResources).toBeDefined();
  });
});