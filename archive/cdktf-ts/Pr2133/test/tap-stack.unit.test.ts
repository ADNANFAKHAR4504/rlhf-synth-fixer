import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest'; // Includes jest matchers
import { TapStack } from '../lib/tap-stack';

import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

describe('Secure WebApp Stack Pre-Deployment Checks', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;
  let synthesizedJson: any;

  beforeAll(() => {
    app = new App();
    stack = new TapStack(app, 'test-secure-stack');
    synthesized = Testing.synth(stack);
    synthesizedJson = JSON.parse(synthesized);
  });

  test('should enable S3 bucket encryption', () => {
    Testing.toHaveResourceWithProperties(synthesized, S3BucketServerSideEncryptionConfigurationA.tfResourceType, {
      rule: [{
        apply_server_side_encryption_by_default: {
          sse_algorithm: 'AES256',
        },
      }],
    });
  });

  test('should enable RDS storage encryption', () => {
    Testing.toHaveResourceWithProperties(synthesized, DbInstance.tfResourceType, {
      storage_encrypted: true,
      backup_retention_period: 7,
    });
  });

  test('should enable EBS volume encryption', () => {
    Testing.toHaveResourceWithProperties(synthesized, Instance.tfResourceType, {
      root_block_device: {
        encrypted: true,
      },
    });
  });

  test('should restrict SSH access', () => {
    const securityGroups = synthesizedJson.resource?.aws_security_group;
    let isSshOpen = false;

    for (const sgKey in securityGroups) {
      const sg = securityGroups[sgKey];
      if (sg.ingress) {
        for (const rule of sg.ingress) {
          if (
            rule.from_port === 22 &&
            rule.cidr_blocks?.includes('0.0.0.0/0')
          ) {
            isSshOpen = true;
            break;
          }
        }
      }
      if (isSshOpen) break;
    }

    expect(isSshOpen).toBe(false);
  });

  test('should attach an IAM instance profile to the EC2 instance', () => {
    // This test ensures the instance is not created without its required IAM role.
    const instance = synthesizedJson.resource.aws_instance.instance;
    expect(instance.iam_instance_profile).toBeDefined();
    expect(instance.iam_instance_profile).toContain('${aws_iam_instance_profile.instanceProfile.name}');
  });
});