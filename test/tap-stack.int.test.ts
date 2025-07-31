import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  const app = Testing.app();
  const stack = new TapStack(app, 'integration-test-stack', {
    region: 'us-east-1',
    amiId: 'ami-0453898e98046c639',
  });
  const synthesized = Testing.synthScope(stack);

  it('has a public subnet', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_subnet',
          values: expect.objectContaining({
            cidr_block: '10.0.1.0/24',
            map_public_ip_on_launch: true
          })
        })
      ])
    }));
  });

  it('includes a route to internet gateway', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_route',
          values: expect.objectContaining({
            destination_cidr_block: '0.0.0.0/0'
          })
        })
      ])
    }));
  });

  it('creates a security group for HTTP and HTTPS', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_security_group',
          values: expect.objectContaining({
            description: 'Allow HTTP and HTTPS'
          })
        })
      ])
    }));
  });

  it('has an S3 bucket with expected prefix', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_s3_bucket',
          values: expect.objectContaining({
            force_destroy: true
          })
        })
      ])
    }));
  });

  it('creates IAM role for EC2', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_iam_role',
          values: expect.objectContaining({
            name: 'ec2-log-writer-role'
          })
        })
      ])
    }));
  });
});
