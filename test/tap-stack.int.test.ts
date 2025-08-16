import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TAP Stack Integration Tests', () => {
  // Helper function to create test stack
  const createTestStack = () => {
    const app = Testing.app();
    return new TapStack(app, 'test-stack', {
      region: 'us-east-1',
      environmentSuffix: 'test',
      crossAccountId: '123456789012',
    });
  };

  it('should create all required resources', () => {
    const stack = createTestStack();
    const synthResult = JSON.parse(Testing.synth(stack));

    // Verify VPC exists
    expect(synthResult.resource.aws_vpc).toBeDefined();
    const vpcKey = Object.keys(synthResult.resource.aws_vpc)[0];
    expect(synthResult.resource.aws_vpc[vpcKey].cidr_block).toBe('10.0.0.0/16');
    expect(synthResult.resource.aws_vpc[vpcKey].tags.Name).toBe('prod-test-vpc-us-east-1');

    // Verify S3 bucket exists
    expect(synthResult.resource.aws_s3_bucket).toBeDefined();
    const s3BucketKey = Object.keys(synthResult.resource.aws_s3_bucket)[0];
    expect(synthResult.resource.aws_s3_bucket[s3BucketKey].tags.Name).toContain('prod-test-storage-us-east-1');

    // Verify S3 lifecycle configuration
    expect(synthResult.resource.aws_s3_bucket_lifecycle_configuration).toBeDefined();

    // Verify cross-account IAM role
    expect(synthResult.resource.aws_iam_role).toBeDefined();
    const roleNames = Object.values(synthResult.resource.aws_iam_role).map((role: any) => role.name);
    expect(roleNames).toContain('prod-test-cross-account-role-us-east-1');

    // Verify NACLs exist
    expect(synthResult.resource.aws_network_acl).toBeDefined();
    const naclNames = Object.values(synthResult.resource.aws_network_acl).map((nacl: any) => nacl.tags.Name);
    expect(naclNames).toContain('prod-test-public-nacl-us-east-1');
  });

  it('should have correct region configuration', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'test-region', {
      region: 'eu-west-1',
      environmentSuffix: 'test',
    });

    const synthResult = JSON.parse(Testing.synth(stack));
    
    // Check provider configuration
    expect(synthResult.provider.aws[0].region).toBe('eu-west-1');
    
    // Check VPC exists with correct region-specific naming
    expect(synthResult.resource.aws_vpc).toBeDefined();
    const vpcKey = Object.keys(synthResult.resource.aws_vpc)[0];
    expect(synthResult.resource.aws_vpc[vpcKey].tags.Name).toBe('prod-test-vpc-eu-west-1');
  });
});