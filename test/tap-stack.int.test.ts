import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Define an interface for the synthesized output structure
interface SynthResult {
  resource?: {
    aws_vpc?: Record<string, any>;
    aws_s3_bucket?: Record<string, any>;
    aws_s3_bucket_lifecycle_configuration?: Record<string, any>;
    aws_iam_role?: Record<string, any>;
    aws_network_acl?: Record<string, any>;
  };
  provider?: {
    aws?: Array<{ region?: string }>;
  };
}

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
    const synthResult = Testing.synth(stack) as unknown as SynthResult;

    // Verify VPC exists
    expect(synthResult.resource?.aws_vpc).toBeDefined();
    const vpc = synthResult.resource?.aws_vpc;
    const vpcKey = vpc ? Object.keys(vpc)[0] : '';
    expect(vpc?.[vpcKey]?.cidr_block).toBe('10.0.0.0/16');
    expect(vpc?.[vpcKey]?.tags?.Name).toBe('prod-test-vpc-us-east-1');

    // Verify S3 bucket exists
    expect(synthResult.resource?.aws_s3_bucket).toBeDefined();
    const s3Bucket = synthResult.resource?.aws_s3_bucket;
    const s3BucketKey = s3Bucket ? Object.keys(s3Bucket)[0] : '';
    expect(s3Bucket?.[s3BucketKey]?.tags?.Name).toContain('prod-test-storage-us-east-1');

    // Verify S3 lifecycle configuration
    expect(synthResult.resource?.aws_s3_bucket_lifecycle_configuration).toBeDefined();

    // Verify cross-account IAM role
    expect(synthResult.resource?.aws_iam_role).toBeDefined();
    const iamRoles = synthResult.resource?.aws_iam_role;
    const roleNames = iamRoles ? Object.values(iamRoles).map((role: any) => role.name) : [];
    expect(roleNames).toContain('prod-test-cross-account-role-us-east-1');

    // Verify NACLs exist
    expect(synthResult.resource?.aws_network_acl).toBeDefined();
    const nacls = synthResult.resource?.aws_network_acl;
    const naclNames = nacls ? Object.values(nacls).map((nacl: any) => nacl.tags?.Name) : [];
    expect(naclNames).toContain('prod-test-public-nacl-us-east-1');
  });

  it('should have correct region configuration', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'test-region', {
      region: 'eu-west-1',
      environmentSuffix: 'test',
    });

    const synthResult = Testing.synth(stack) as unknown as SynthResult;
    
    // Check provider configuration
    expect(synthResult.provider?.aws?.[0]?.region).toBe('eu-west-1');
    
    // Check VPC exists with correct region-specific naming
    expect(synthResult.resource?.aws_vpc).toBeDefined();
    const vpc = synthResult.resource?.aws_vpc;
    const vpcKey = vpc ? Object.keys(vpc)[0] : '';
    expect(vpc?.[vpcKey]?.tags?.Name).toBe('prod-test-vpc-eu-west-1');
  });
});