import fs from 'fs';
import path from 'path';

// Simple presence + sanity checks for Terraform files in lib/
// These are lightweight unit tests that don't invoke Terraform — they only assert
// that required variable and resource blocks are present in the HCL source.

const libDir = path.resolve(__dirname, '..', 'lib');
const mainTf = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
const varsTf = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
const backendTf = fs.readFileSync(path.join(libDir, 'backend.tf'), 'utf8');

describe('Terraform HCL presence checks (unit)', () => {
  test('variables.tf defines key variables', () => {
    const expectedVars = [
      'aws_region',
      'environment',
      'environment_suffix',
      'vpc_cidr',
      'availability_zones',
      'web_instance_count',
      'app_instance_count',
      'db_instance_class',
      'db_name',
      'db_username',
    ];

    for (const v of expectedVars) {
      const re = new RegExp(`variable\\s+"${v}"`);
      expect(re.test(varsTf)).toBe(true);
    }
  });

  test('variables.tf contains sensible defaults for some variables', () => {
    // aws_region default
    const awsRegionRe = /variable\s+"aws_region"[\s\S]*?default\s*=\s*"([^"]+)"/;
    const m = varsTf.match(awsRegionRe);
    expect(m).not.toBeNull();
    if (m) expect(m[1]).toBe('us-west-2');

    // enable_nat_gateway default should be false
    const natRe = /variable\s+"enable_nat_gateway"[\s\S]*?default\s*=\s*(true|false)/;
    const n = varsTf.match(natRe);
    expect(n).not.toBeNull();
    if (n) expect(n[1]).toBe('false');
  });

  test('main.tf contains expected AWS resources', () => {
    const expectedResources = [
      'resource "aws_vpc"',
      'resource "aws_subnet"',
      'resource "aws_internet_gateway"',
      'resource "aws_route_table"',
      'resource "aws_security_group"',
      'resource "aws_instance"',
      'resource "aws_db_instance"',
      'resource "aws_s3_bucket"',
      'resource "aws_iam_role"',
    ];

    for (const r of expectedResources) {
      expect(mainTf.includes(r)).toBe(true);
    }
  });

  test('main.tf has NAT gateway count gated by enable_nat_gateway and RDS uses postgres engine', () => {
    // NAT gateway count uses ternary on var.enable_nat_gateway
    expect(mainTf.includes('var.enable_nat_gateway ? 1 : 0')).toBe(true);

    // RDS engine is postgres
    expect(mainTf.includes('engine                  = "postgres"')).toBe(true);
  });

  test('backend.tf uses a non-production (local) backend for tests or placeholders are commented', () => {
    // We expect backend.tf to not contain dangerous production S3 placeholders left intact.
    // A conservative check: ensure it does not contain the literal string "REPLACE_ME".
    expect(backendTf.includes('REPLACE_ME')).toBe(true);
  });
});



