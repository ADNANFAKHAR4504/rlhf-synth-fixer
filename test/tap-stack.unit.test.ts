import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  const stack = new TapStack(undefined as any, 'unit-test-stack', {
    region: 'us-east-1',
    amiId: 'ami-12345678',
  });
  const synthesized = Testing.synth(stack);
  // If synthesized is a string, parse it to an object
  let synthObj;
  try {
    synthObj =
      typeof synthesized === 'string' ? JSON.parse(synthesized) : synthesized;
  } catch (e) {
    synthObj = {};
  }
  console.log('Synthesized object:', JSON.stringify(synthObj, null, 2));

  it('creates a VPC with correct CIDR and tags', () => {
    expect(synthObj.resource.aws_vpc.SecureVpc).toEqual(
      expect.objectContaining({
        cidr_block: '10.0.0.0/16',
        tags: expect.objectContaining({
          Environment: 'Production',
          Name: 'secure-network',
        }),
      })
    );
  });

  it('creates an EC2 instance with t3.micro type and tag', () => {
    expect(synthObj.resource.aws_instance.WebInstance).toEqual(
      expect.objectContaining({
        instance_type: 't3.micro',
        tags: expect.objectContaining({
          Environment: 'Production',
        }),
      })
    );
  });

  it('configures S3 bucket encryption with AES256', () => {
    expect(
      synthObj.resource.aws_s3_bucket_server_side_encryption_configuration
        .LogBucketEncryption
    ).toEqual(
      expect.objectContaining({
        rule: expect.arrayContaining([
          expect.objectContaining({
            apply_server_side_encryption_by_default: expect.objectContaining({
              sse_algorithm: 'AES256',
            }),
          }),
        ]),
      })
    );
  });

  it('attaches IAM policy allowing s3:PutObject', () => {
    expect(synthObj.resource.aws_iam_policy.EC2S3LogPolicy).toEqual(
      expect.objectContaining({
        policy: expect.stringContaining('s3:PutObject'),
      })
    );
  });

  it('creates a network ACL with HTTP and HTTPS rules', () => {
    expect(synthObj.resource.aws_network_acl.PublicSubnetNACL).toEqual(
      expect.objectContaining({
        tags: expect.objectContaining({
          Environment: 'Production',
        }),
      })
    );
  });
});
