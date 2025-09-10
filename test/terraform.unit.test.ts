// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import * as fs from 'fs';
import * as path from 'path';

const STACK_REL = '../lib/tap_stack.tf'; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe('Terraform single-file stack: tap_stack.tf', () => {
  test('tap_stack.tf exists', () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('declares vpc_cidr variable in tap_stack.tf', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test('contains key resource types', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
  });

  test('includes security groups for ALB, App, and RDS', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"app"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
  });

  test('includes monitoring and logging resources', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder"/);
  });
});
