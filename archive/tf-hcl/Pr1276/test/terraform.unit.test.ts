import * as fs from 'fs';
import * as path from 'path';

describe('Terraform HCL unit checks (structure and content)', () => {
  const libDir = path.resolve(__dirname, '..', 'lib');
  const mainTfPath = path.join(libDir, 'main.tf');
  const providerTfPath = path.join(libDir, 'provider.tf');
  let mainTf: string;
  let providerTf: string;

  beforeAll(() => {
    mainTf = fs.readFileSync(mainTfPath, 'utf8');
    providerTf = fs.readFileSync(providerTfPath, 'utf8');
  });

  test('declares aws_region variable and provider consumes it', () => {
    expect(mainTf).toMatch(/variable\s+"aws_region"/);
    expect(providerTf).toMatch(/provider\s+"aws"/);
    expect(providerTf).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test('enforces region guard for us-west-2', () => {
    expect(mainTf).toMatch(/allowed_regions\s*=\s*\["us-west-2"\]/);
    expect(mainTf).toMatch(
      /precondition[\s\S]*contains\(local\.allowed_regions,\s*data\.aws_region\.current\.name\)/
    );
  });

  test('defines core security and logging resources', () => {
    expect(mainTf).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    expect(mainTf).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    expect(mainTf).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
  });

  test('defines VPC with public and private subnets and routing', () => {
    expect(mainTf).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(mainTf).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(mainTf).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(mainTf).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    expect(mainTf).toMatch(
      /resource\s+"aws_route_table_association"\s+"public"/
    );
    expect(mainTf).toMatch(
      /resource\s+"aws_route_table_association"\s+"private"/
    );
  });

  test('defines SGs and NACL associations for private subnets', () => {
    expect(mainTf).toMatch(/resource\s+"aws_security_group"\s+"private"/);
    expect(mainTf).toMatch(/resource\s+"aws_security_group"\s+"public"/);
    expect(mainTf).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
    expect(mainTf).toMatch(
      /resource\s+"aws_network_acl_association"\s+"private"/
    );
  });

  test('defines instance role/profile and compute (LT + ASG)', () => {
    expect(mainTf).toMatch(/resource\s+"aws_iam_role"\s+"ec2_instance"/);
    expect(mainTf).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    expect(mainTf).toMatch(/resource\s+"aws_launch_template"\s+"private"/);
    expect(mainTf).toMatch(/resource\s+"aws_autoscaling_group"\s+"private"/);
  });

  test('backend is defined in provider.tf (s3)', () => {
    expect(providerTf).toMatch(/backend\s+"s3"\s*\{/);
  });

  test('naming uses prod-<resource>-<id> pattern via resource_id', () => {
    expect(mainTf).toMatch(/prod-[a-z-]+-\$\{var\.resource_id\}/);
  });
});
