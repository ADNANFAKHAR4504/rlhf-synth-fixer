import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  const app = Testing.app();
  const stack = new TapStack(app, 'unit-test-stack', {
    region: 'us-west-2',
    amiId: 'ami-12345678'
  });
  const synthesized = Testing.synthScope(stack);

  it('creates a VPC with correct CIDR and tags', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_vpc',
          values: expect.objectContaining({
            cidr_block: '10.0.0.0/16',
            tags: expect.objectContaining({
              Environment: 'Production',
              Name: 'secure-network'
            })
          })
        })
      ])
    }));
  });

  it('creates an EC2 instance with t3.micro type and tag', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_instance',
          values: expect.objectContaining({
            instance_type: 't3.micro',
            tags: expect.objectContaining({
              Environment: 'Production'
            })
          })
        })
      ])
    }));
  });

  it('configures S3 bucket encryption with AES256', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_s3_bucket_server_side_encryption_configuration',
          values: expect.objectContaining({
            rule: expect.arrayContaining([
              expect.objectContaining({
                apply_server_side_encryption_by_default: expect.objectContaining({
                  sse_algorithm: 'AES256'
                })
              })
            ])
          })
        })
      ])
    }));
  });

  it('attaches IAM policy allowing s3:PutObject', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_iam_policy',
          values: expect.objectContaining({
            policy: expect.stringContaining('s3:PutObject')
          })
        })
      ])
    }));
  });

  it('creates a network ACL with HTTP and HTTPS rules', () => {
    expect(synthesized).toMatchInlineSnapshot(expect.objectContaining({
      resource: expect.arrayContaining([
        expect.objectContaining({
          type: 'aws_network_acl',
          values: expect.objectContaining({
            tags: expect.objectContaining({
              Environment: 'Production'
            })
          })
        })
      ])
    }));
  });
});
