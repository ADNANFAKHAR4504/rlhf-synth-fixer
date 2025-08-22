// Integration tests that validate the deployed stack via outputs JSON only.
// No Terraform CLI commands are executed here (no init/apply/plan).

import fs from 'fs';
import path from 'path';

type StackOutputs = {
  data_bucket_name: string;
  trail_bucket_name: string; // may be empty if CloudTrail disabled/reused
  cloudtrail_arn: string; // may be empty if CloudTrail disabled/reused
  ec2_instance_id: string; // may be empty if EC2 disabled
  security_group_id: string; // may be empty if EC2 disabled
  iam_role_name: string;
  iam_user_name: string;
};

const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

function loadOutputs(): StackOutputs {
  if (!fs.existsSync(p)) {
    throw new Error(
      `Outputs file not found at ${p}. Ensure your pipeline exported Terraform outputs to this path.`
    );
  }
  const raw = fs.readFileSync(p, 'utf8');
  const json = JSON.parse(raw);
  // Support either a flat object of outputs, or a nested { outputs: {...} }
  const rawOutputs = (json.outputs ?? json) as Record<string, any>;
  // Normalize Terraform -json format where each key is an object: { value, type, sensitive }
  const normalized: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawOutputs)) {
    if (val && typeof val === 'object' && 'value' in val) {
      normalized[key] = (val as any).value;
    } else {
      normalized[key] = val;
    }
  }
  return normalized as unknown as StackOutputs;
}

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid or missing string for ${field}`);
  }
}

function extractRegionFromArn(arn: string): string | null {
  const parts = arn.split(':');
  return parts.length >= 6 ? parts[3] : null; // arn:partition:service:region:account-id:resource
}

function validateS3BucketName(name: string) {
  // Basic S3 rules: 3-63 chars, lowercase letters, numbers, dots and hyphens
  // must start and end with letter/number, no consecutive dots, not IP-like
  const basic =
    /^(?!\d+\.\d+\.\d+\.\d+$)(?!.*\.{2})[a-z0-9](?:[a-z0-9.-]{1,61})[a-z0-9]$/;
  if (!basic.test(name) || name.length < 3 || name.length > 63) {
    throw new Error(`S3 bucket name does not meet naming rules: ${name}`);
  }
}

function validateEc2InstanceId(id: string) {
  // i- followed by 8 or 17 hex chars
  if (!/^i-[a-f0-9]{8}(?:[a-f0-9]{9})?$/.test(id)) {
    throw new Error(`Invalid EC2 instance id: ${id}`);
  }
}

function validateSecurityGroupId(id: string) {
  if (!/^sg-[a-f0-9]{8,17}$/.test(id)) {
    throw new Error(`Invalid security group id: ${id}`);
  }
}

function validateCloudTrailArn(arn: string) {
  if (!/^arn:aws:cloudtrail:[a-z0-9-]+:\d{12}:trail\/.+/.test(arn)) {
    throw new Error(`Invalid CloudTrail ARN: ${arn}`);
  }
  const region = extractRegionFromArn(arn);
  if (region !== 'us-west-2') {
    throw new Error(`CloudTrail must be in us-west-2, found ${region}`);
  }
}

function validateIamNames(roleName: string, userName: string) {
  if (roleName !== 's3-tag-access-role') {
    throw new Error(
      `IAM role name must be 's3-tag-access-role', got '${roleName}'`
    );
  }
  if (userName !== 'terraform-deploy-user') {
    throw new Error(
      `IAM user name must be 'terraform-deploy-user', got '${userName}'`
    );
  }
}

function validateOutputs(outputs: StackOutputs) {
  // Required presence and types
  assertString(outputs.data_bucket_name, 'data_bucket_name');
  assertString(outputs.iam_role_name, 'iam_role_name');
  assertString(outputs.iam_user_name, 'iam_user_name');

  // Standards & format validations
  validateS3BucketName(outputs.data_bucket_name);

  // Optional/conditional parts: validate only when non-empty (CloudTrail/EC2 toggles)
  if (outputs.trail_bucket_name) {
    validateS3BucketName(outputs.trail_bucket_name);
    if (outputs.trail_bucket_name === outputs.data_bucket_name) {
      throw new Error('Data and trail bucket names must be different');
    }
  }

  if (outputs.cloudtrail_arn) {
    validateCloudTrailArn(outputs.cloudtrail_arn);
  }

  if (outputs.ec2_instance_id) {
    validateEc2InstanceId(outputs.ec2_instance_id);
  }

  if (outputs.security_group_id) {
    validateSecurityGroupId(outputs.security_group_id);
  }

  validateIamNames(outputs.iam_role_name, outputs.iam_user_name);
}

describe('Stack outputs integration tests (no Terraform execution)', () => {
  let outputs: StackOutputs;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  test('outputs JSON exists and has all expected keys', () => {
    expect(outputs).toBeDefined();
    const keys = [
      'data_bucket_name',
      'trail_bucket_name',
      'cloudtrail_arn',
      'ec2_instance_id',
      'security_group_id',
      'iam_role_name',
      'iam_user_name',
    ];
    for (const k of keys) {
      expect((outputs as any)[k]).toBeDefined();
      expect(typeof (outputs as any)[k]).toBe('string');
    }
  });

  test('happy path: outputs conform to standards and formats', () => {
    expect(() => validateOutputs(outputs)).not.toThrow();
  });

  test('edge: when CloudTrail is disabled or reused, outputs are still strings (possibly empty)', () => {
    const maybeEmpty = {
      ...outputs,
      trail_bucket_name: outputs.trail_bucket_name ?? '',
      cloudtrail_arn: outputs.cloudtrail_arn ?? '',
    };
    expect(typeof maybeEmpty.trail_bucket_name).toBe('string');
    expect(typeof maybeEmpty.cloudtrail_arn).toBe('string');
  });

  test('edge: wrong region in CloudTrail ARN is rejected (if ARN present)', () => {
    if (!outputs.cloudtrail_arn) return; // skip when feature disabled
    const mutated = {
      ...outputs,
      cloudtrail_arn: outputs.cloudtrail_arn.replace(
        ':us-west-2:',
        ':us-east-1:'
      ),
    };
    expect(() => validateOutputs(mutated)).toThrow(/us-west-2/);
  });

  test('edge: missing required output field is rejected', () => {
    const mutated: any = { ...outputs };
    delete mutated.data_bucket_name;
    expect(() => validateOutputs(mutated)).toThrow(/data_bucket_name/);
  });

  test('edge: invalid bucket names or duplicates are rejected', () => {
    const bad1 = { ...outputs, data_bucket_name: 'Invalid_Name' };
    expect(() => validateOutputs(bad1 as StackOutputs)).toThrow(
      /S3 bucket name/
    );

    if (outputs.trail_bucket_name) {
      const bad2 = { ...outputs, trail_bucket_name: outputs.data_bucket_name };
      expect(() => validateOutputs(bad2 as StackOutputs)).toThrow(
        /must be different/
      );
    }
  });

  test('edge: invalid identifiers are rejected (if present)', () => {
    if (outputs.ec2_instance_id) {
      const badEc2 = { ...outputs, ec2_instance_id: 'i-12345' };
      expect(() => validateOutputs(badEc2 as StackOutputs)).toThrow(
        /EC2 instance id/
      );
    }
    if (outputs.security_group_id) {
      const badSg = { ...outputs, security_group_id: 'security-group-1' };
      expect(() => validateOutputs(badSg as StackOutputs)).toThrow(
        /security group id/
      );
    }
  });

  test('edge: IAM names must match enforced standards', () => {
    const badRole = { ...outputs, iam_role_name: 'unexpected-role' };
    expect(() => validateOutputs(badRole as StackOutputs)).toThrow(
      /s3-tag-access-role/
    );

    const badUser = { ...outputs, iam_user_name: 'unexpected-user' };
    expect(() => validateOutputs(badUser as StackOutputs)).toThrow(
      /terraform-deploy-user/
    );
  });
});
