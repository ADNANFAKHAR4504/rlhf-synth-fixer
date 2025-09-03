// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform execution - only static analysis and syntax validation

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);

describe('Terraform Stack Unit Tests', () => {
  let stackContent: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  describe('File Structure and Basic Requirements', () => {
    test('tap_stack.tf exists and is readable', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test('does NOT declare provider blocks (delegated to provider.tf)', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(stackContent).not.toMatch(/\bterraform\s*{[\s\S]*backend\s*"/);
    });

    test('contains single file structure as required', () => {
      expect(stackContent).toMatch(/# Variables/i);
      expect(stackContent).toMatch(/# Locals/i);
      expect(stackContent).toMatch(/# Data sources/i);
      expect(stackContent).toMatch(/resource\s+"aws_/);
      expect(stackContent).toMatch(/# Outputs/i);
    });
  });

  describe('Required Variables Declaration', () => {
    const requiredVariables = [
      'aws_region',
      'kms_key_arn',
      'allowed_cidr',
      'app_bucket_name',
      'trail_bucket_name',
      'ec2_ami_id',
      'ec2_instance_type',
      'iam_user_name',
      'vpc_id',
      'subnet_id',
    ];

    requiredVariables.forEach(varName => {
      test(`declares variable "${varName}" with proper structure`, () => {
        const variableRegex = new RegExp(
          `variable\\s+"${varName}"\\s*{[\\s\\S]*?}`,
          'm'
        );
        expect(stackContent).toMatch(variableRegex);
      });

      test(`variable "${varName}" has description`, () => {
        const variableBlock = stackContent.match(
          new RegExp(`variable\\s+"${varName}"\\s*{[\\s\\S]*?}`, 'm')
        )?.[0];
        expect(variableBlock).toMatch(/description\s*=/);
      });

      test(`variable "${varName}" has type specification`, () => {
        const variableBlock = stackContent.match(
          new RegExp(`variable\\s+"${varName}"\\s*{[\\s\\S]*?}`, 'm')
        )?.[0];
        expect(variableBlock).toMatch(/type\s*=/);
      });
    });

    test('aws_region variable has default eu-west-3', () => {
      const awsRegionBlock = stackContent.match(
        /variable\s+"aws_region"\s*{[\s\S]*?}/m
      )?.[0];
      expect(awsRegionBlock).toMatch(/default\s*=\s*"eu-west-3"/);
    });

    test('variables have validation blocks where appropriate', () => {
      expect(stackContent).toMatch(
        /validation\s*{[\s\S]*?condition[\s\S]*?error_message/
      );
    });

    test('sensitive variables are properly marked', () => {
      // KMS key ARN should have validation but not be marked sensitive as it's not secret
      const kmsKeyBlock = stackContent.match(
        /variable\s+"kms_key_arn"\s*{[\s\S]*?}/m
      )?.[0];
      expect(kmsKeyBlock).toMatch(/validation\s*{/);
    });
  });

  describe('Locals and Data Sources', () => {
    test('defines common_tags locals with Environment = Production', () => {
      expect(stackContent).toMatch(
        /locals\s*{[\s\S]*?common_tags\s*=[\s\S]*?Environment\s*=\s*"Production"/
      );
    });

    test('defines account_id local from data source', () => {
      expect(stackContent).toMatch(
        /account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/
      );
    });

    test('defines bucket ARN locals', () => {
      expect(stackContent).toMatch(/app_bucket_arn\s*=/);
      expect(stackContent).toMatch(/trail_bucket_arn\s*=/);
    });

    test('includes aws_caller_identity data source', () => {
      expect(stackContent).toMatch(
        /data\s+"aws_caller_identity"\s+"current"\s*{/
      );
    });
  });

  describe('S3 Application Bucket Resources', () => {
    test('declares aws_s3_bucket.app resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app"\s*{/);
    });

    test('app bucket uses variable for name', () => {
      const appBucketBlock = stackContent.match(
        /resource\s+"aws_s3_bucket"\s+"app"\s*{[\s\S]*?}/m
      )?.[0];
      expect(appBucketBlock).toMatch(/bucket\s*=\s*local\.app_bucket_name/);
    });

    test('app bucket has common tags', () => {
      const appBucketBlock = stackContent.match(
        /resource\s+"aws_s3_bucket"\s+"app"\s*{[\s\S]*?}/m
      )?.[0];
      expect(appBucketBlock).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test('declares app bucket versioning', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"app"/
      );
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('declares app bucket server-side encryption with KMS', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app"/
      );
      expect(stackContent).toMatch(
        /kms_master_key_id\s*=\s*local\.kms_key_arn/
      );
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('declares app bucket public access block', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"app"/
      );
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('declares app bucket ownership controls', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_ownership_controls"\s+"app"/
      );
      expect(stackContent).toMatch(
        /object_ownership\s*=\s*"BucketOwnerEnforced"/
      );
    });

    test('app bucket policy denies insecure transport', () => {
      // Search for the policy content within the whole file
      expect(stackContent).toMatch(/"aws:SecureTransport"\s*=\s*"false"/);
      expect(stackContent).toMatch(/DenyInsecureTransport/);
    });

    test('app bucket policy implements tag-based access control', () => {
      // Search for the policy content within the whole file
      expect(stackContent).toMatch(
        /"aws:PrincipalTag\/Environment"\s*=\s*"Production"/
      );
      expect(stackContent).toMatch(/AllowTagBasedAccess/);
      expect(stackContent).toMatch(/DenyInsecureTransport/);
    });
  });

  describe('CloudTrail S3 Bucket Resources', () => {
    test('declares aws_s3_bucket.trail resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"trail"\s*{/);
    });

    test('trail bucket has proper CloudTrail service access policy', () => {
      // Search for CloudTrail service access within the whole file
      expect(stackContent).toMatch(/Service.*=.*"cloudtrail\.amazonaws\.com"/);
      expect(stackContent).toMatch(/s3:GetBucketAcl/);
      expect(stackContent).toMatch(/s3:PutObject/);
    });

    test('trail bucket policy includes source ARN conditions', () => {
      // Search for source ARN conditions within the whole file
      expect(stackContent).toMatch(/AWS:SourceArn/);
      expect(stackContent).toMatch(/arn:aws:cloudtrail/);
    });
  });

  describe('IAM Resources', () => {
    test('declares app access IAM role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"app_access"/);
    });

    test('app access role has EC2 assume role policy', () => {
      const roleBlock = stackContent.match(
        /resource\s+"aws_iam_role"\s+"app_access"\s*{[\s\S]*?}/m
      )?.[0];
      expect(roleBlock).toMatch(/Service.*=.*"ec2\.amazonaws\.com"/);
    });

    test('app access role has separate policy for S3 access', () => {
      // Check for the separate aws_iam_role_policy resource instead of inline_policy
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_role_policy"\s+"app_access"/
      );
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/s3:ListBucket/);
    });

    test('declares deployer IAM user', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_user"\s+"deployer"/);
    });

    test('deployer user has minimal privilege policy', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_user_policy"\s+"deployer"/
      );
      const deployerPolicyBlock = stackContent.match(
        /resource\s+"aws_iam_user_policy"\s+"deployer"\s*{[\s\S]*?}/m
      )?.[0];
      expect(deployerPolicyBlock).toMatch(/ec2:Describe\*/);
      expect(deployerPolicyBlock).toMatch(/s3:ListBucket/);
      expect(deployerPolicyBlock).toMatch(/iam:Get\*/);
      expect(deployerPolicyBlock).toMatch(/iam:List\*/);
    });
  });

  describe('Compute Resources', () => {
    test('declares security group with proper configuration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"main"/);
    });

    test('security group allows SSH (22) and HTTPS (443) from allowed CIDR', () => {
      // Search for port configurations within the whole file
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_cidr\]/);
    });

    test('security group has controlled egress', () => {
      // Search for egress configuration within the whole file
      expect(stackContent).toMatch(/egress\s*{/);
    });

    test('declares EC2 instance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"main"/);
    });

    test('EC2 instance uses variables for configuration', () => {
      const instanceBlock = stackContent.match(
        /resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?}/m
      )?.[0];
      expect(instanceBlock).toMatch(
        /ami\s*=\s*(var\.ec2_ami_id|local\.ami_id)/
      );
      expect(instanceBlock).toMatch(
        /instance_type\s*=\s*var\.ec2_instance_type/
      );
      expect(instanceBlock).toMatch(/subnet_id\s*=\s*local\.subnet_id/);
    });

    test('EC2 instance has no public IP for security', () => {
      const instanceBlock = stackContent.match(
        /resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?}/m
      )?.[0];
      expect(instanceBlock).toMatch(/associate_public_ip_address\s*=\s*false/);
    });

    test('EC2 instance has encrypted root block device', () => {
      // Search for root block device encryption within the whole file
      expect(stackContent).toMatch(/root_block_device\s*{/);
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('declares CloudTrail resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test('CloudTrail has required security configurations', () => {
      const trailBlock = stackContent.match(
        /resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?^}/m
      )?.[0];
      expect(trailBlock).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(trailBlock).toMatch(/include_global_service_events\s*=\s*true/);
      expect(trailBlock).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test('CloudTrail uses KMS encryption', () => {
      const trailBlock = stackContent.match(
        /resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?^}/m
      )?.[0];
      expect(trailBlock).toMatch(/kms_key_id\s*=\s*local\.kms_key_arn/);
    });

    test('CloudTrail depends on trail bucket policy', () => {
      const trailBlock = stackContent.match(
        /resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?^}/m
      )?.[0];
      expect(trailBlock).toMatch(
        /depends_on\s*=\s*\[aws_s3_bucket_policy\.trail\]/
      );
    });
  });

  describe('Tagging Compliance', () => {
    test('all major resources use common_tags', () => {
      const resourcesWithTags = [
        'aws_s3_bucket.app',
        'aws_s3_bucket.trail',
        'aws_iam_role.app_access',
        'aws_iam_user.deployer',
        'aws_security_group.main',
        'aws_instance.main',
        'aws_cloudtrail.main',
      ];

      resourcesWithTags.forEach(resource => {
        const resourceType = resource.split('.')[0];
        const resourceName = resource.split('.')[1];
        const resourceRegex = new RegExp(
          `resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{[\\s\\S]*?^}`,
          'm'
        );
        const resourceBlock = stackContent.match(resourceRegex)?.[0];

        // Should have tags reference to local.common_tags or merge with it
        expect(resourceBlock).toMatch(
          /tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/
        );
      });
    });
  });

  describe('Required Outputs', () => {
    const requiredOutputs = [
      'app_bucket_name',
      'app_bucket_arn',
      'app_bucket_policy_id',
      'trail_bucket_name',
      'cloudtrail_trail_arn',
      'security_group_id',
      'ec2_instance_id',
      'iam_deployer_user_arn',
      'kms_key_arn_passthrough',
    ];

    requiredOutputs.forEach(outputName => {
      test(`declares output "${outputName}"`, () => {
        const outputRegex = new RegExp(
          `output\\s+"${outputName}"\\s*{[\\s\\S]*?}`,
          'm'
        );
        expect(stackContent).toMatch(outputRegex);
      });

      test(`output "${outputName}" has description`, () => {
        const outputBlock = stackContent.match(
          new RegExp(`output\\s+"${outputName}"\\s*{[\\s\\S]*?}`, 'm')
        )?.[0];
        expect(outputBlock).toMatch(/description\s*=/);
      });

      test(`output "${outputName}" has value`, () => {
        const outputBlock = stackContent.match(
          new RegExp(`output\\s+"${outputName}"\\s*{[\\s\\S]*?}`, 'm')
        )?.[0];
        expect(outputBlock).toMatch(/value\s*=/);
      });
    });

    test('outputs do not expose sensitive information', () => {
      // Ensure no access keys, secrets, or other sensitive data in outputs
      expect(stackContent).not.toMatch(/output.*access_key/i);
      expect(stackContent).not.toMatch(/output.*secret/i);
      expect(stackContent).not.toMatch(/output.*password/i);
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded secrets or credentials', () => {
      expect(stackContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]+"/i);
    });

    test('no overly permissive IAM policies', () => {
      // Should not contain "*" as action without proper conditions
      const iamPolicyMatches = stackContent.match(/"Action"\s*:\s*"\*"/g);
      expect(iamPolicyMatches).toBeNull();
    });

    test('S3 buckets have encryption enabled', () => {
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(stackContent).toMatch(
        /kms_master_key_id\s*=\s*local\.kms_key_arn/
      );
    });

    test('security groups follow least privilege', () => {
      // Should only allow specific ports (22, 443) from defined CIDR
      expect(stackContent).toMatch(/from_port\s*=\s*(22|443)/);
      expect(stackContent).not.toMatch(
        /from_port\s*=\s*0[\s\S]*?to_port\s*=\s*65535/
      );
    });
  });
});
