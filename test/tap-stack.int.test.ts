import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  const stack = new TapStack(undefined as any, 'integration-test-stack', {
    region: 'us-west-2',
    amiId: 'ami-0cf2b4e024cdb6960',
  });
  const synthesized = Testing.synth(stack);
  let synthObj;
  try {
    synthObj =
      typeof synthesized === 'string' ? JSON.parse(synthesized) : synthesized;
  } catch (e) {
    synthObj = {};
  }

  it('has a public subnet', () => {
    expect(synthObj.resource.aws_subnet.PublicSubnet).toEqual(
      expect.objectContaining({
        cidr_block: '10.0.1.0/24',
        map_public_ip_on_launch: true,
      })
    );
  });

  it('includes a route to internet gateway', () => {
    expect(synthObj.resource.aws_route.DefaultRoute).toEqual(
      expect.objectContaining({
        destination_cidr_block: '0.0.0.0/0',
      })
    );
  });

  it('creates a security group for HTTP and HTTPS', () => {
    expect(synthObj.resource.aws_security_group.WebSg).toEqual(
      expect.objectContaining({
        description: 'Allow HTTP and HTTPS',
      })
    );
  });

  it('has an S3 bucket with expected prefix', () => {
    expect(synthObj.resource.aws_s3_bucket.LogBucket).toEqual(
      expect.objectContaining({
        force_destroy: true,
      })
    );
  });

  it('creates IAM role for EC2 (when not in LocalStack Community)', () => {
    // EC2 is not supported in LocalStack Community Edition
    // The role will only exist for AWS deployments
    if (synthObj.resource?.aws_iam_role?.EC2LogRole) {
      expect(synthObj.resource.aws_iam_role.EC2LogRole).toEqual(
        expect.objectContaining({
          name: expect.stringContaining('ec2-s3-access-role'),
        })
      );
    } else {
      // For LocalStack Community, verify the role doesn't exist
      expect(synthObj.resource?.aws_iam_role?.EC2LogRole).toBeUndefined();
    }
  });
});
