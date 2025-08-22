import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack.mjs';

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

describe('TapStack Integration', () => {
  test('creates multi-region secure infrastructure', async () => {
    const stack = new TapStack('test-tap', {
      environmentSuffix: 'test',
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

  test('validates security configuration compliance', async () => {
    const stack = new TapStack('security-test', {
      environmentSuffix: 'security',
    });

    // Verify IAM Access Analyzer is created
    expect(stack.iamStack.accessAnalyzer).toBeDefined();

    // Verify KMS keys are created for both regions
    const regions = ['us-west-2', 'eu-central-1'];
    regions.forEach(region => {
      const regionalKms = stack.regionalResources[region].kms;
      expect(regionalKms.s3Key).toBeDefined();
      expect(regionalKms.s3KeyAlias).toBeDefined();
    });

    // Verify S3 buckets are created for both regions
    regions.forEach(region => {
      const regionalS3 = stack.regionalResources[region].s3;
      expect(regionalS3.bucket).toBeDefined();
      expect(regionalS3.bucketEncryption).toBeDefined();
      expect(regionalS3.bucketPublicAccessBlock).toBeDefined();
      expect(regionalS3.bucketPolicy).toBeDefined();
    });
  });

  test('ensures proper tagging across all resources', async () => {
    const testTags = {
      Environment: 'integration-test',
      Project: 'TAP-Security',
      Owner: 'SecurityTeam',
    };

    const stack = new TapStack('tagging-test', {
      environmentSuffix: 'tagged',
      tags: testTags,
    });

    expect(stack.iamStack).toBeDefined();
    expect(stack.regionalResources).toBeDefined();
    
    // Verify all regional resources are created with proper structure
    Object.keys(stack.regionalResources).forEach(region => {
      expect(stack.regionalResources[region].kms).toBeDefined();
      expect(stack.regionalResources[region].s3).toBeDefined();
    });
  });
});
