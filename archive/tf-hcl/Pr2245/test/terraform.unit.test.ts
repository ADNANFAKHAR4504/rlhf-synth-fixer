// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from 'fs';
import path from 'path';

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

  test('contains required variables', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for essential variables
    expect(content).toMatch(/variable\s+"regions"\s*{/);
    expect(content).toMatch(/variable\s+"environment"\s*{/);
    expect(content).toMatch(/variable\s+"application_name"\s*{/);
    expect(content).toMatch(/variable\s+"instance_type"\s*{/);
    expect(content).toMatch(/variable\s+"db_username"\s*{/);
    expect(content).toMatch(/variable\s+"db_password"\s*{/);
  });

  test('contains provider configurations', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for provider configurations
    expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"primary"/);
    expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"us_east_1"/);
    expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"us_west_2"/);
  });

  test('contains VPC resources for both regions', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for VPC resources
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main_us_west_2"/);
  });

  test('contains subnet resources for both regions', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for subnet resources
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_us_east_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_us_west_2"/);
  });

  test('contains internet gateway resources', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for internet gateway resources
    expect(content).toMatch(
      /resource\s+"aws_internet_gateway"\s+"main_us_east_1"/
    );
    expect(content).toMatch(
      /resource\s+"aws_internet_gateway"\s+"main_us_west_2"/
    );
  });

  test('contains route table resources', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for route table resources
    expect(content).toMatch(
      /resource\s+"aws_route_table"\s+"public_us_east_1"/
    );
    expect(content).toMatch(
      /resource\s+"aws_route_table"\s+"public_us_west_2"/
    );
  });

  test('contains security group resources', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for security group resources
    expect(content).toMatch(
      /resource\s+"aws_security_group"\s+"alb_us_east_1"/
    );
    expect(content).toMatch(
      /resource\s+"aws_security_group"\s+"alb_us_west_2"/
    );
  });

  test('contains outputs', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for outputs
    expect(content).toMatch(/output\s+"vpc_ids"/);
    expect(content).toMatch(/output\s+"subnet_ids"/);
  });

  test('uses correct CIDR blocks', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for correct CIDR blocks
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/); // us-east-1 VPC
    expect(content).toMatch(/cidr_block\s*=\s*"10\.1\.0\.0\/16"/); // us-west-2 VPC
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/); // us-east-1 subnet
    expect(content).toMatch(/cidr_block\s*=\s*"10\.1\.1\.0\/24"/); // us-west-2 subnet
  });

  test('has proper tagging', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for proper tagging structure
    expect(content).toMatch(/tags\s*=\s*{/);
    expect(content).toMatch(/Name\s*=\s*"\${var\.application_name}/);
    expect(content).toMatch(/Environment\s*=\s*var\.environment/);
  });

  test('has proper provider references', () => {
    const content = fs.readFileSync(stackPath, 'utf8');

    // Check for proper provider references
    expect(content).toMatch(/provider\s*=\s*aws\.us_east_1/);
    expect(content).toMatch(/provider\s*=\s*aws\.us_west_2/);
  });
});
