import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveResourceWithProperties(type: string, props: any): R;
      toHaveResource(type: string): R;
    }
  }
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
    const synthResult = Testing.synth(stack);

    // Verify VPC exists
    expect(JSON.stringify(synthResult)).toContain('"aws_vpc"');
    expect(JSON.stringify(synthResult)).toContain('"cidr_block":"10.0.0.0/16"');
    expect(JSON.stringify(synthResult)).toContain(
      '"Name":"prod-test-vpc-us-east-1"'
    );

    // Verify S3 bucket exists
    expect(JSON.stringify(synthResult)).toContain('"aws_s3_bucket"');
    expect(JSON.stringify(synthResult)).toContain(
      '"Name":"prod-test-storage-us-east-1"'
    );

    // Verify S3 lifecycle configuration
    expect(JSON.stringify(synthResult)).toContain(
      '"aws_s3_bucket_lifecycle_configuration"'
    );

    // Verify cross-account IAM role
    expect(JSON.stringify(synthResult)).toContain('"aws_iam_role"');
    expect(JSON.stringify(synthResult)).toContain(
      '"name":"prod-test-cross-account-role-us-east-1"'
    );

    // Verify NACLs exist
    expect(JSON.stringify(synthResult)).toContain('"aws_network_acl"');
    expect(JSON.stringify(synthResult)).toContain(
      '"Name":"prod-test-public-nacl-us-east-1"'
    );

    // Verify multi-region capability
    expect(stack).toBeInstanceOf(TapStack);
  });

  it('should have correct region configuration', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'test-region', {
      region: 'eu-west-1',
      environmentSuffix: 'test',
    });

    expect(stack).toBeDefined();
    const synthResult = Testing.synth(stack);

    expect(JSON.stringify(synthResult)).toContain('"aws_vpc"');
    expect(JSON.stringify(synthResult)).toContain(
      '"Name":"prod-test-vpc-eu-west-1"'
    );
  });
});
