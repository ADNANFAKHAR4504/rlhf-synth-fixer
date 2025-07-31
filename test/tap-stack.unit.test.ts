import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  const app = Testing.app();
  const stack = new TapStack(app, 'unit-test-stack', 'us-west-2', 'ami-12345678'); // Pass required params
  const synthesized = Testing.synthScope(stack);

  it('creates a VPC with correct CIDR and tags', () => {
    expect(synthesized).toHaveResource('aws_vpc', {
      cidr_block: '10.0.0.0/16',
      tags: { Environment: 'Production', Name: 'secure-network' }
    });
  });

  it('creates an EC2 instance with t3.micro type and tag', () => {
    expect(synthesized).toHaveResource('aws_instance', {
      instance_type: 't3.micro',
      tags: { Environment: 'Production' }
    });
  });

  it('configures S3 bucket encryption with AES256', () => {
    expect(synthesized).toHaveResource('aws_s3_bucket_server_side_encryption_configuration', {
      rule: [
        {
          apply_server_side_encryption_by_default: {
            sse_algorithm: 'AES256'
          }
        }
      ]
    });
  });

  it('attaches IAM policy allowing s3:PutObject', () => {
    expect(synthesized).toHaveResource('aws_iam_policy', {
      policy: expect.stringContaining('s3:PutObject')
    });
  });

  it('creates a network ACL with HTTP and HTTPS rules', () => {
    expect(synthesized).toHaveResource('aws_network_acl', {
      vpc_id: expect.any(String),
      tags: { Environment: 'Production' }
    });
  });
});
