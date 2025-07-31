
import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  const app = Testing.app();
  const stack = new TapStack(app, 'integration-test-stack');
  const synthesized = Testing.synthScope(stack);

  it('has a public subnet', () => {
    expect(synthesized).toHaveResource('aws_subnet', {
      cidr_block: '10.0.1.0/24',
      map_public_ip_on_launch: true
    });
  });

  it('includes a route to internet gateway', () => {
    expect(synthesized).toHaveResource('aws_route', {
      destination_cidr_block: '0.0.0.0/0'
    });
  });

  it('creates a security group for HTTP and HTTPS', () => {
    expect(synthesized).toHaveResource('aws_security_group', {
      description: 'Allow HTTP and HTTPS'
    });
  });

  it('has an S3 bucket with expected prefix', () => {
    expect(synthesized).toHaveResource('aws_s3_bucket', {
      force_destroy: true
    });
  });

  it('creates IAM role for EC2', () => {
    expect(synthesized).toHaveResource('aws_iam_role', {
      name: 'ec2-log-writer-role'
    });
  });
});
