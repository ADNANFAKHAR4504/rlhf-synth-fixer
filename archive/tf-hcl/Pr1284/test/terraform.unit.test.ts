// Unit tests for ../lib/tap_stack.tf using lightweight static assertions
// No Terraform commands executed; we assert structure and critical safeguards.

import fs from 'fs';
import path from 'path';

const stackPath = path.resolve(__dirname, '..', 'lib', 'tap_stack.tf');

describe('tap_stack.tf (static unit checks)', () => {
  let tf: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    tf = fs.readFileSync(stackPath, 'utf8');
  });

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    expect(tf).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('declares all required variables', () => {
    [
      'vpc_id',
      'subnet_id',
      'allowed_cidr',
      's3_kms_key_arn',
      'data_bucket_name',
      'trail_bucket_name',
      'instance_ami',
      'instance_type',
    ].forEach(v => expect(tf).toMatch(new RegExp(`variable\\s+"${v}"\\s*{`)));
  });

  test('has region guard enforcing us-east-2', () => {
    expect(tf).toMatch(/data\s+"aws_region"\s+"current"/);
    // Accept either deprecated .name or current .id accessor
    const guardMatches =
      /precondition[\s\S]*data\.aws_region\.current\.(name|id)\s*==\s*"us-east-2"/.test(
        tf
      );
    expect(guardMatches).toBe(true);
  });

  test('S3 data bucket policy enforces TLS and SSE-KMS', () => {
    // TLS deny
    expect(tf).toMatch(/DenyInsecureTransport/);
    expect(tf).toMatch(/"aws:SecureTransport"\s*=\s*false/);
    // KMS required on PutObject
    expect(tf).toMatch(/RequireKmsForPut/);
    expect(tf).toMatch(/"s3:x-amz-server-side-encryption"\s*=\s*"aws:kms"/);
    expect(tf).toMatch(/s3:x-amz-server-side-encryption-aws-kms-key-id/);
  });

  test('IAM role policy uses tag-based conditions correctly', () => {
    expect(tf).toMatch(/aws:ResourceTag\/data:classification/);
    expect(tf).toMatch(/s3:ExistingObjectTag\/data:classification/);
    expect(tf).toMatch(/DenyNonTLS/);
  });

  test('Security group only allows 22 and 443 inbound from allowed CIDR', () => {
    // Ensure 22 and 443 are present and no obvious extras like 80
    expect(tf).toMatch(
      /from_port\s*=\s*22[\s\S]*protocol\s*=\s*"tcp"[\s\S]*cidr_blocks\s*=\s*\[var\.allowed_cidr\]/
    );
    expect(tf).toMatch(
      /from_port\s*=\s*443[\s\S]*protocol\s*=\s*"tcp"[\s\S]*cidr_blocks\s*=\s*\[var\.allowed_cidr\]/
    );
    expect(tf).not.toMatch(/from_port\s*=\s*80/);
  });

  test('EC2 instance enforces IMDSv2 and encrypted root volume', () => {
    expect(tf).toMatch(/metadata_options[\s\S]*http_tokens\s*=\s*"required"/);
    expect(tf).toMatch(/root_block_device[\s\S]*encrypted\s*=\s*true/);
  });

  test('CloudTrail delivery bucket allows ACL check and PutObject with correct ACL', () => {
    expect(tf).toMatch(/s3:GetBucketAcl/);
    expect(tf).toMatch(/s3:PutObject/);
    expect(tf).toMatch(/"s3:x-amz-acl"\s*=\s*"bucket-owner-full-control"/);
  });

  test('All taggable resources include Environment = Production (spot-check)', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"data"[\s\S]*tags[\s\S]*Environment\s*=\s*"Production"/,
      /resource\s+"aws_security_group"\s+"secure_sg"[\s\S]*tags[\s\S]*Environment\s*=\s*"Production"/,
      /resource\s+"aws_instance"\s+"secure"[\s\S]*tags[\s\S]*Environment\s*=\s*"Production"/,
      /resource\s+"aws_s3_bucket"\s+"trail"[\s\S]*tags[\s\S]*Environment\s*=\s*"Production"/,
      /resource\s+"aws_iam_role"\s+"s3_tag_access"[\s\S]*tags[\s\S]*Environment\s*=\s*"Production"/,
      /resource\s+"aws_iam_user"\s+"deploy"[\s\S]*tags[\s\S]*Environment\s*=\s*"Production"/,
    ].forEach(re => expect(tf).toMatch(re));
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
