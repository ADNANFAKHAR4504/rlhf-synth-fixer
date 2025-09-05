// tests/unit/unit-tests.ts
// Static / lightweight checks against lib/tap_stack.tf to ensure the file
// expresses the requirements from the prompt (network, EC2, RDS, tags, CloudTrail).
// These are textual checks only and do not call Terraform or AWS.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf'; // path to the terraform stack file
const stackPath = path.resolve(__dirname, STACK_REL);

describe('Terraform single-file stack: tap_stack.tf (unit checks)', () => {
  test('tap_stack.tf exists', () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('declares aws_region variable in tap_stack.tf', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  // --- Requirements from prompt.md (textual assertions) ---

  test('declares tags that include Environment and Department keys', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    // Look for a tags map or local.tags merge that mentions Environment and Department
    const hasEnvironment =
      /Environment\s*=/.test(content) || /"Environment"\s*=>/.test(content);
    const hasDepartment =
      /Department\s*=/.test(content) ||
      /"Department"\s*=>/.test(content) ||
      /Department\s*\}/.test(content);
    // If the tags are set via local.tags merge, try a looser match
    const hasTagsBlock = /common_tags|local\.tags|tags\s*=/.test(content);

    // We expect Environment at minimum; Department is requested by the prompt and should be present.
    expect(hasTagsBlock).toBe(true);
    expect(hasEnvironment).toBe(true);
    // Department is an explicit requirement in the prompt; fail the test if missing so author is notified.
    expect(hasDepartment).toBe(true);
  });

  test('contains an RDS/Postgres resource with encryption enabled', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    const hasRdsInstance =
      /resource\s+"aws_db_instance"\s+"/.test(content) ||
      /resource\s+"aws_rds_cluster"\s+"/.test(content);
    const mentionsStorageEncrypted =
      /StorageEncrypted|storage_encrypted|server_side_encryption/.test(content);

    // The prompt requires a PostgreSQL RDS instance with encryption at rest.
    // If these checks fail, the unit test will fail and point that out.
    expect(hasRdsInstance).toBe(true);
    expect(mentionsStorageEncrypted).toBe(true);
  });

  test('contains an EC2 instance and security groups restricting access to HTTPS and limiting DB access to the web server', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    const hasEc2 =
      /resource\s+"aws_instance"\s+"/.test(content) ||
      /aws_launch_configuration/.test(content);
    const allowsHttps =
      /ingress\s+\{[\s\S]*from_port\s*=\s*443|cidr_blocks\s*=\s*\["0.0.0.0\/0"\][\s\S]*from_port\s*=\s*443/.test(
        content
      );
    const hasDbSgRuleFromSg =
      /from_security_group_id|security_groups\s*=\s*\[.*postgres|ingress[\s\S]*5432/.test(
        content
      );

    expect(hasEc2).toBe(true);
    expect(allowsHttps).toBe(true);
    expect(hasDbSgRuleFromSg).toBe(true);
  });

  test('enables CloudTrail', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    const hasCloudTrail =
      /resource\s+"aws_cloudtrail"\s+"/.test(content) ||
      /cloudtrail\s*=/i.test(content);
    expect(hasCloudTrail).toBe(true);
  });
});
