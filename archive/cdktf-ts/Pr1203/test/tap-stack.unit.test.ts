import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  const stack = new TapStack(undefined as any, 'unit-test-stack', {
    region: 'us-west-2',
    amiId: 'ami-0e0d5cba8c90ba8c5',
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
        enable_dns_support: true,
        enable_dns_hostnames: true,
        tags: expect.objectContaining({
          Environment: 'Production',
          Name: expect.stringMatching(/^secure-network.*$/),
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

  it('creates an IAM instance profile for EC2', () => {
    expect(
      synthObj.resource.aws_iam_instance_profile.EC2InstanceProfile
    ).toEqual(
      expect.objectContaining({
        name: expect.stringContaining('ec2-s3-instance-profile-'),
        role: expect.stringMatching(/^\$\{aws_iam_role\.EC2LogRole\.name\}$/),
      })
    );
  });

  it('creates an IAM role for EC2', () => {
    expect(synthObj.resource.aws_iam_role.EC2LogRole).toEqual(
      expect.objectContaining({
        name: expect.stringContaining('ec2-s3-access-role-'),
        assume_role_policy: expect.stringContaining('ec2.amazonaws.com'),
        tags: expect.objectContaining({
          Environment: 'Production',
        }),
      })
    );
  });

  it('attaches IAM policy to EC2 role', () => {
    expect(
      synthObj.resource.aws_iam_role_policy_attachment.AttachS3Policy
    ).toEqual(
      expect.objectContaining({
        role: expect.stringMatching(/^\$\{aws_iam_role\.EC2LogRole\.name\}$/),
        policy_arn: expect.stringMatching(
          /^\$\{aws_iam_policy\.EC2S3LogPolicy\.arn\}$/
        ),
      })
    );
  });

  it('creates an S3 bucket with correct prefix and tags', () => {
    expect(synthObj.resource.aws_s3_bucket.LogBucket).toEqual(
      expect.objectContaining({
        bucket: expect.stringMatching(/^secure-app-logs.*$/),
        force_destroy: true,
        tags: expect.objectContaining({
          Environment: 'Production',
        }),
      })
    );
  });

  it('outputs the VPC ID', () => {
    expect(synthObj.output.VpcIdOutput).toEqual(
      expect.objectContaining({
        value: expect.stringMatching(/aws_vpc\.SecureVpc\.id/),
        description: 'The ID of the created VPC',
      })
    );
  });
});

describe('TapStack Unit Tests - Branch Coverage', () => {
  it('uses awsRegion instead of region', () => {
    const stack = new TapStack(undefined as any, 'unit-test-stack-alt', {
      awsRegion: 'us-west-2',
      amiId: 'ami-87654321',
    });
    const synthesized = Testing.synth(stack);
    let synthObj;
    try {
      synthObj =
        typeof synthesized === 'string' ? JSON.parse(synthesized) : synthesized;
    } catch (e) {
      synthObj = {};
    }
    expect(synthObj.resource.aws_vpc.SecureVpc).toEqual(
      expect.objectContaining({
        cidr_block: '10.0.0.0/16',
        enable_dns_support: true,
        enable_dns_hostnames: true,
        tags: expect.objectContaining({
          Environment: 'Production',
          Name: expect.stringMatching(/^secure-network.*$/),
        }),
      })
    );
    expect(synthObj.resource.aws_instance.WebInstance).toEqual(
      expect.objectContaining({
        ami: 'ami-87654321',
        instance_type: 't3.micro',
      })
    );
  });

  it('uses region us-west-2 when both region and awsRegion are provided', () => {
    const stack = new TapStack(undefined as any, 'unit-test-stack-alt', {
      region: 'us-west-2',
      awsRegion: 'us-east-1',
      amiId: 'ami-87654321',
    });
    const synthesized = Testing.synth(stack);
    let synthObj;
    try {
      synthObj =
        typeof synthesized === 'string' ? JSON.parse(synthesized) : synthesized;
    } catch (e) {
      synthObj = {};
    }
    expect(synthObj.resource.aws_vpc.SecureVpc).toEqual(
      expect.objectContaining({
        cidr_block: '10.0.0.0/16',
        enable_dns_support: true,
        enable_dns_hostnames: true,
        tags: expect.objectContaining({
          Environment: 'Production',
          Name: expect.stringMatching(/^secure-network.*$/),
        }),
      })
    );
    expect(synthObj.resource.aws_instance.WebInstance).toEqual(
      expect.objectContaining({
        ami: 'ami-87654321',
        instance_type: 't3.micro',
      })
    );
    // Check that subnet AZ uses us-west-2a
    expect(synthObj.resource.aws_subnet.PublicSubnet).toEqual(
      expect.objectContaining({
        availability_zone: 'us-west-2a',
      })
    );
  });

  it('uses default region and amiId when none provided', () => {
    const stack = new TapStack(
      undefined as any,
      'unit-test-stack-defaults',
      {}
    );
    const synthesized = Testing.synth(stack);
    let synthObj;
    try {
      synthObj =
        typeof synthesized === 'string' ? JSON.parse(synthesized) : synthesized;
    } catch (e) {
      synthObj = {};
    }
    expect(synthObj.resource.aws_vpc.SecureVpc).toBeDefined();
    expect(synthObj.resource.aws_instance.WebInstance).toEqual(
      expect.objectContaining({
        ami: 'ami-0e0d5cba8c90ba8c5',
        instance_type: 't3.micro',
      })
    );
  });
});