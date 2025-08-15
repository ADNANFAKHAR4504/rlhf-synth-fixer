import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Senior-level Terraform integration tests. These tests:
 * - enforce fmt/validate
 * - create a plan file and parse terraform show -json for structural assertions
 * - verify variable validation failures
 * - verify feature toggles (e.g., CloudTrail) change the plan
 *
 * They do NOT apply infrastructure. AWS credentials/region must be configured
 * in CI for data sources to evaluate during plan. Tests run non-interactively.
 */

const libDir = path.resolve(__dirname, '..', 'lib');

function run(cmd: string, env?: NodeJS.ProcessEnv) {
  try {
    return execSync(cmd, {
      cwd: libDir,
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, TF_IN_AUTOMATION: '1', ...env },
    });
  } catch (err: any) {
    const out = err?.stdout?.toString?.() ?? '';
    const errOut = err?.stderr?.toString?.() ?? '';
    throw new Error(
      `Command failed: ${cmd}\nSTDOUT:\n${out}\nSTDERR:\n${errOut}`
    );
  }
}

function planAndShowJson(
  planFile: string,
  extraArgs: string[] = [],
  env?: NodeJS.ProcessEnv
) {
  const outPath = path.join(libDir, planFile);
  const args = [
    'terraform plan',
    '-input=false',
    '-lock=false',
    '-no-color',
    '-refresh=false',
    `-out=${outPath}`,
    ...extraArgs,
  ].join(' ');
  const planOut = run(args, env);
  expect(planOut).toMatch(
    /(Plan:\s+\d+ to add|No changes\. Infrastructure is up-to-date\.)/
  );
  const json = run(`terraform show -json ${outPath}`, env);
  const parsed = JSON.parse(json);
  // Persist artifacts for debugging
  fs.writeFileSync(path.join(libDir, `${planFile}.json`), json, 'utf8');
  fs.writeFileSync(path.join(libDir, `${planFile}.txt`), planOut, 'utf8');
  return parsed;
}

type PlanJson = {
  planned_values?: any;
  resource_changes?: Array<{
    address: string;
    type: string;
    name: string;
    change?: any;
  }>;
  configuration?: any;
  outputs?: Record<string, { value?: any }>;
};

function getPlannedResourceByAddress(plan: PlanJson, address: string) {
  const resources: Array<{ address: string; values: any }> =
    plan?.planned_values?.root_module?.resources ?? [];
  const childMods: Array<{
    resources?: Array<{ address: string; values: any }>;
  }> = plan?.planned_values?.root_module?.child_modules ?? [];
  const inRoot = resources.find(r => r.address === address);
  if (inRoot) return inRoot;
  for (const mod of childMods) {
    const found = (mod.resources ?? []).find(r => r.address === address);
    if (found) return found;
  }
  return undefined;
}

function expectResourceChange(plan: PlanJson, address: string) {
  const exists = (plan.resource_changes ?? []).some(r => r.address === address);
  expect(exists).toBe(true);
}

describe('Terraform integration (fmt + validate + structured plan assertions)', () => {
  beforeAll(() => {
    // Ensure region and naming vars
    if (!process.env.AWS_DEFAULT_REGION) {
      process.env.AWS_DEFAULT_REGION = 'us-west-2';
    }
    if (!process.env.TF_VAR_aws_region) {
      process.env.TF_VAR_aws_region = 'us-west-2';
    }
    if (!process.env.TF_VAR_resource_id) {
      process.env.TF_VAR_resource_id = 'inttest';
    }
    // Init once to install providers
    const outInit = run('terraform init -reconfigure -upgrade -lock=false');
    expect(outInit).toMatch(
      /Terraform has been successfully initialized|Initializing the backend/
    );
  });

  test('terraform fmt has no drift', () => {
    // Will throw if exit code != 0
    const out = run('terraform fmt -check -recursive');
    expect(out).toMatch(/\s*/);
  });

  test('terraform validate (JSON) has no errors', () => {
    const json = run('terraform validate -json');
    const parsed = JSON.parse(json);
    expect(parsed.valid).toBe(true);
    expect(
      (parsed.diagnostics ?? []).filter((d: any) => d.severity === 'error')
        .length
    ).toBe(0);
  });

  test('default plan composes secure VPC, KMS, S3, IAM, and compute correctly', () => {
    const plan = planAndShowJson('plan-default.tfplan');

    // Existence and counts
    expectResourceChange(plan, 'aws_vpc.main');
    expectResourceChange(plan, 'aws_internet_gateway.main');
    expectResourceChange(plan, 'aws_kms_key.main');
    expectResourceChange(plan, 'aws_kms_alias.main');
    expectResourceChange(plan, 'aws_s3_bucket.cloudtrail');
    expectResourceChange(plan, 'aws_s3_bucket_versioning.cloudtrail');
    expectResourceChange(
      plan,
      'aws_s3_bucket_server_side_encryption_configuration.cloudtrail'
    );
    expectResourceChange(plan, 'aws_s3_bucket_public_access_block.cloudtrail');
    expectResourceChange(plan, 'aws_s3_bucket_policy.cloudtrail');
    expectResourceChange(plan, 'aws_iam_role.ec2_instance');
    expectResourceChange(plan, 'aws_iam_instance_profile.ec2');
    expectResourceChange(plan, 'aws_iam_policy.ec2_minimal');
    expectResourceChange(plan, 'aws_iam_role_policy_attachment.ec2_minimal');
    expectResourceChange(plan, 'aws_launch_template.private');
    expectResourceChange(plan, 'aws_autoscaling_group.private');

    for (let i = 0; i < 2; i++) {
      expectResourceChange(plan, `aws_subnet.public[${i}]`);
      expectResourceChange(plan, `aws_subnet.private[${i}]`);
      expectResourceChange(plan, `aws_eip.nat[${i}]`);
      expectResourceChange(plan, `aws_nat_gateway.main[${i}]`);
      expectResourceChange(plan, `aws_route_table.private[${i}]`);
      expectResourceChange(plan, `aws_route_table_association.private[${i}]`);
    }
    expectResourceChange(plan, 'aws_route_table.public');
    for (let i = 0; i < 2; i++) {
      expectResourceChange(plan, `aws_route_table_association.public[${i}]`);
    }

    // No SSH rule by default
    const hasSshRule = (
      (plan.resource_changes ?? []) as Array<{ address: string }>
    ).some(
      (r: { address: string }) =>
        r.address === 'aws_vpc_security_group_ingress_rule.public_ssh'
    );
    expect(hasSshRule).toBe(false);

    // KMS key rotation on
    const kms = getPlannedResourceByAddress(plan, 'aws_kms_key.main');
    expect(kms?.values?.enable_key_rotation).toBe(true);

    // CloudTrail bucket SSE-KMS and public access blocked
    const sse = getPlannedResourceByAddress(
      plan,
      'aws_s3_bucket_server_side_encryption_configuration.cloudtrail'
    );
    expect(
      sse?.values?.rule?.[0]?.apply_server_side_encryption_by_default?.[0]
        ?.sse_algorithm
    ).toBe('aws:kms');
    expect(
      sse?.values?.rule?.[0]?.bucket_key_enabled === true ||
        sse?.values?.rule?.[0]?.bucket_key_enabled === 'true'
    ).toBe(true);
    const pab = getPlannedResourceByAddress(
      plan,
      'aws_s3_bucket_public_access_block.cloudtrail'
    );
    expect(pab?.values?.block_public_acls).toBe(true);
    expect(pab?.values?.block_public_policy).toBe(true);
    expect(pab?.values?.ignore_public_acls).toBe(true);
    expect(pab?.values?.restrict_public_buckets).toBe(true);

    // IAM trust policy for EC2 principal
    const role = getPlannedResourceByAddress(plan, 'aws_iam_role.ec2_instance');
    expect(String(role?.values?.assume_role_policy)).toMatch(
      /ec2\.amazonaws\.com/
    );

    // Launch template basics
    const lt = getPlannedResourceByAddress(plan, 'aws_launch_template.private');
    expect(lt?.values?.instance_type).toBe('t3.micro');
    expect(lt?.values?.user_data).toBeTruthy();

    // ASG sizing and tag propagation
    const asg = getPlannedResourceByAddress(
      plan,
      'aws_autoscaling_group.private'
    );
    expect(asg?.values?.min_size).toBe(1);
    expect(asg?.values?.max_size).toBe(3);
    expect(asg?.values?.desired_capacity).toBe(2);
    const asgTags: Array<{
      key: string;
      value: string;
      propagate_at_launch: boolean;
    }> = asg?.values?.tag ?? [];
    const envTag = asgTags.find(t => t.key === 'Environment');
    expect(envTag?.value).toBe('production');
    expect(envTag?.propagate_at_launch).toBe(true);

    // Outputs present (cloudtrail_name is null by default)
    const outputs = plan?.planned_values?.outputs ?? {};
    expect(outputs['vpc_id']).toBeDefined();
    expect(outputs['private_subnet_ids']).toBeDefined();
    expect(outputs['public_subnet_ids']).toBeDefined();
    expect(outputs['kms_key_arn']).toBeDefined();
    expect(outputs['cloudtrail_s3_bucket']).toBeDefined();
  });

  test('cloudtrail toggle: when enabled, trail resource is planned and output is set', () => {
    const plan = planAndShowJson('plan-cloudtrail.tfplan', [
      '-var',
      'enable_cloudtrail=true',
    ]);
    // Resource exists
    expectResourceChange(plan, 'aws_cloudtrail.main[0]');
    // Output becomes non-null
    const outputs = plan?.planned_values?.outputs ?? {};
    expect(outputs['cloudtrail_name']).toBeDefined();
  });

  test('variable validation: invalid resource_id is rejected', () => {
    // Use a bad value: uppercase disallowed and too short
    const badEnv = { TF_VAR_resource_id: 'BAD' } as NodeJS.ProcessEnv;
    expect(() => run('terraform validate', badEnv)).toThrow(
      /resource_id must be 4-32 chars/i
    );
  });
});
