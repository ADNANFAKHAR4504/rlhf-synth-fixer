// Unit tests for ../lib/tap_stack.tf
// - Pure static checks (no terraform init/plan/apply)
// - Validates variables, data sources, guards, resources, policies, and outputs

import fs from 'fs';
import path from 'path';

const stackPath = path.resolve(__dirname, '../lib/tap_stack.tf');

describe('tap_stack.tf (static unit checks)', () => {
  let tf: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    tf = fs.readFileSync(stackPath, 'utf8');
  });

  test('no provider block in tap_stack.tf (provider.tf owns providers)', () => {
    expect(tf).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('declares all expected variables', () => {
    const vars = [
      'vpc_id',
      'subnet_id',
      'allowed_cidr',
      's3_kms_key_arn',
      'data_bucket_name',
      'trail_bucket_name',
      'instance_ami',
      'instance_type',
      'aws_region',
      'enable_ec2',
      'enable_cloudtrail',
      'reuse_existing_cloudtrail',
      'existing_cloudtrail_arn',
      'existing_cloudtrail_bucket_name',
      'enable_guardduty',
    ];
    for (const v of vars) {
      expect(tf).toMatch(new RegExp(`variable\\s+"${v}"\\s*{`));
    }
  });

  test('data sources and region guard present', () => {
    expect(tf).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    expect(tf).toMatch(/data\s+"aws_region"\s+"current"/);
    expect(tf).toMatch(
      /data\s+"aws_ami"\s+"al2023"[\s\S]*filter[\s\S]*name[\s=]+"name"[\s\S]*al2023-ami/
    );
    expect(tf).toMatch(/data\s+"aws_vpc"\s+"default"[\s\S]*default\s*=\s*true/);
    expect(tf).toMatch(
      /data\s+"aws_subnets"\s+"default"[\s\S]*name\s*=\s*"vpc-id"[\s\S]*name\s*=\s*"default-for-az"/
    );
    expect(tf).toMatch(
      /data\s+"aws_kms_alias"\s+"s3_managed"[\s\S]*alias\/aws\/s3/
    );
    expect(tf).toMatch(
      /null_resource"\s+"region_guard"[\s\S]*precondition[\s\S]*data\.aws_region\.current\.id\s*==\s*var\.aws_region/
    );
  });

  test('locals compute effective values', () => {
    expect(tf).toMatch(/locals[\s\S]*effective_kms_key[\s\S]*coalesce/);
    expect(tf).toMatch(
      /locals[\s\S]*effective_vpc_id[\s\S]*try\(data\.aws_vpc\.default\.id/
    );
    expect(tf).toMatch(
      /locals[\s\S]*effective_subnet[\s\S]*data\.aws_subnets\.default\.ids\[0\]/
    );
    expect(tf).toMatch(/locals[\s\S]*effective_ami[\s\S]*al2023/);
  });

  test('logs bucket exists and is hardened', () => {
    expect(tf).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    expect(tf).toMatch(
      /aws_s3_bucket_versioning"\s+"logs"[\s\S]*status\s*=\s*"Enabled"/
    );
    expect(tf).toMatch(
      /aws_s3_bucket_ownership_controls"\s+"logs"[\s\S]*BucketOwnerPreferred/
    );
    expect(tf).toMatch(/aws_s3_bucket_acl"\s+"logs"[\s\S]*log-delivery-write/);
    expect(tf).toMatch(/aws_s3_bucket_public_access_block"\s+"logs"/);
  });

  test('data bucket: versioning, ownership, SSE-KMS, PAB, logging, TLS deny, KMS-enforced put', () => {
    expect(tf).toMatch(/resource\s+"aws_s3_bucket"\s+"data"/);
    expect(tf).toMatch(
      /aws_s3_bucket_versioning"\s+"data"[\s\S]*status\s*=\s*"Enabled"/
    );
    expect(tf).toMatch(
      /aws_s3_bucket_ownership_controls"\s+"data"[\s\S]*BucketOwnerPreferred/
    );
    expect(tf).toMatch(
      /aws_s3_bucket_server_side_encryption_configuration"\s+"data"[\s\S]*kms_master_key_id\s*=\s*local\.effective_kms_key/
    );
    expect(tf).toMatch(/aws_s3_bucket_public_access_block"\s+"data"/);
    expect(tf).toMatch(
      /aws_s3_bucket_logging"\s+"data"[\s\S]*target_bucket\s*=\s*aws_s3_bucket\.logs\.id/
    );
    expect(tf).toMatch(/data_bucket_policy[\s\S]*DenyInsecureTransport/);
    expect(tf).toMatch(/data_bucket_policy[\s\S]*RequireKmsForPut/);
  });

  test('IAM role policy uses tag-based conditions and TLS deny', () => {
    expect(tf).toMatch(/resource\s+"aws_iam_role"\s+"s3_tag_access"/);
    expect(tf).toMatch(/aws:ResourceTag\/data:classification/);
    expect(tf).toMatch(/s3:ExistingObjectTag\/data:classification/);
    expect(tf).toMatch(/DenyNonTLS/);
  });

  test('MFA enforcement policy exists and is attached to group; user is in group', () => {
    expect(tf).toMatch(/resource\s+"aws_iam_policy"\s+"require_mfa"/);
    expect(tf).toMatch(/aws:MultiFactorAuthPresent/);
    expect(tf).toMatch(/aws_iam_group_policy_attachment"\s+"mfa_enforce"/);
    expect(tf).toMatch(/aws_iam_user_group_membership"\s+"deploy_member"/);
  });

  test('security group allows only 22 and 443 from allowed CIDR; egress all', () => {
    expect(tf).toMatch(
      /resource\s+"aws_security_group"\s+"secure_sg"[\s\S]*count\s*=\s*var\.enable_ec2/
    );
    expect(tf).toMatch(
      /ingress[\s\S]*from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*\[var\.allowed_cidr\]/
    );
    expect(tf).toMatch(
      /ingress[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*\[var\.allowed_cidr\]/
    );
    expect(tf).not.toMatch(/from_port\s*=\s*80/);
    expect(tf).toMatch(/egress[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
  });

  test('instance enforces IMDSv2 and encrypted root volume', () => {
    expect(tf).toMatch(/resource\s+"aws_instance"\s+"secure"/);
    expect(tf).toMatch(/metadata_options[\s\S]*http_tokens\s*=\s*"required"/);
    expect(tf).toMatch(/root_block_device[\s\S]*encrypted\s*=\s*true/);
  });

  test('CloudTrail stack is conditional and hardened', () => {
    expect(tf).toMatch(
      /resource\s+"aws_s3_bucket"\s+"trail"[\s\S]*count\s*=\s*var\.enable_cloudtrail/
    );
    expect(tf).toMatch(/aws_s3_bucket_versioning"\s+"trail"/);
    expect(tf).toMatch(/aws_s3_bucket_public_access_block"\s+"trail"/);
    expect(tf).toMatch(
      /aws_s3_bucket_server_side_encryption_configuration"\s+"trail"/
    );
    expect(tf).toMatch(
      /aws_s3_bucket_policy"\s+"trail_delivery"[\s\S]*s3:x-amz-acl"\s*=\s*"bucket-owner-full-control"/
    );
    expect(tf).toMatch(/aws_cloudtrail"\s+"audit"[\s\S]*event_selector/);
  });

  test('AWS Config recorder, delivery, and rules (with proper source blocks)', () => {
    expect(tf).toMatch(
      /resource\s+"aws_config_configuration_recorder"\s+"main"/
    );
    expect(tf).toMatch(
      /recording_group[\s\S]*include_global_resource_types\s*=\s*true/
    );
    expect(tf).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    expect(tf).toMatch(
      /resource\s+"aws_config_config_rule"\s+"s3_bucket_public_access_prohibited"[\s\S]*source[\s\S]*S3_BUCKET_PUBLIC_ACCESS_PROHIBITED/
    );
    expect(tf).toMatch(
      /resource\s+"aws_config_config_rule"\s+"encrypted_volumes"[\s\S]*source[\s\S]*ENCRYPTED_VOLUMES/
    );
    expect(tf).toMatch(
      /resource\s+"aws_config_config_rule"\s+"cloudtrail_enabled"[\s\S]*source[\s\S]*CLOUD_TRAIL_ENABLED/
    );
  });

  test('GuardDuty detector is toggleable', () => {
    expect(tf).toMatch(
      /resource\s+"aws_guardduty_detector"\s+"main"[\s\S]*count\s*=\s*var\.enable_guardduty/
    );
  });

  test('expected outputs are present', () => {
    [
      'data_bucket_name',
      'trail_bucket_name',
      'cloudtrail_arn',
      'ec2_instance_id',
      'security_group_id',
      'iam_role_name',
      'iam_user_name',
    ].forEach(o => expect(tf).toMatch(new RegExp(`output\\s+"${o}"`)));
  });
});
