import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * These integration tests run terraform commands in ./lib non-interactively.
 * They assume backend is pre-configured via provider.tf and environment.
 * Skips apply/destroy to avoid provisioning in CI; validates and plans only.
 */

const libDir = path.resolve(__dirname, '..', 'lib');

function run(cmd: string) {
  return execSync(cmd, { cwd: libDir, stdio: 'pipe', encoding: 'utf8' });
}

describe('Terraform integration (validate + plan)', () => {
  beforeAll(() => {
    // Ensure region env var is present for provider
    if (!process.env.TF_VAR_aws_region) {
      process.env.TF_VAR_aws_region = 'us-west-2';
    }
    // Provide a default resource_id for naming
    if (!process.env.TF_VAR_resource_id) {
      process.env.TF_VAR_resource_id = 'inttest';
    }
  });

  test('terraform validate succeeds', () => {
    const out = run('terraform validate');
    expect(out).toMatch(/Success!/);
  });

  test('terraform plan runs without syntax errors', () => {
    // -lock=false to avoid backend locking in CI contexts
    const outInit = run('terraform init -reconfigure -lock=false');
    expect(outInit).toMatch(
      /Terraform has been successfully initialized|Initializing the backend/
    );

    const outPlan = run(
      'terraform plan -input=false -lock=false -no-color -refresh=false'
    );
    expect(outPlan).toMatch(
      /Plan:\s+\d+ to add|No changes. Infrastructure is up-to-date./
    );

    // save plan output for debug artifacts
    fs.writeFileSync(path.join(libDir, 'plan.txt'), outPlan, 'utf8');
    expect(fs.existsSync(path.join(libDir, 'plan.txt'))).toBe(true);
  });

  test('outputs are defined and reference expected resources', () => {
    const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    expect(mainTf).toMatch(/output\s+"vpc_id"[\s\S]*aws_vpc\.main\.id/);
    expect(mainTf).toMatch(
      /output\s+"kms_key_arn"[\s\S]*aws_kms_key\.main\.arn/
    );
    expect(mainTf).toMatch(
      /output\s+"cloudtrail_name"[\s\S]*aws_cloudtrail\.main\.name/
    );
  });
});
