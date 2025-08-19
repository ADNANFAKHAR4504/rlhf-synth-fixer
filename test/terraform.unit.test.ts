import * as fs from 'fs';
import * as path from 'path';

const TF_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');

describe('Terraform Core Infrastructure (static checks)', () => {
  let hcl: string;
  beforeAll(() => {
    const exists = fs.existsSync(TF_PATH);
    if (!exists) {
      throw new Error(`Terraform file not found at ${TF_PATH}`);
    }
    hcl = fs.readFileSync(TF_PATH, 'utf8');
  });

  test('defines all required modules', () => {
    const modules = [
      'networking',
      'security',
      'compute',
      'database',
      'storage',
      'iam',
      'monitoring',
    ];
    modules.forEach(module => {
      expect(hcl).toMatch(new RegExp(`module\\s+"${module}"\\s*{`, 'm'));
    });
  });

  test('networking module is configured correctly', () => {
    const networkingBlock = hcl.match(
      /module\s+"networking"\s*{([\s\S]*?)}/m
    )?.[0];
    expect(networkingBlock).toBeTruthy();
    expect(networkingBlock).toMatch(/source\s*=\s*"\.\/modules\/networking"/);
    expect(networkingBlock).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr/);
  });

  test('security module is configured correctly', () => {
    const securityBlock = hcl.match(/module\s+"security"\s*{([\s\S]*?)}/m)?.[0];
    expect(securityBlock).toBeTruthy();
    expect(securityBlock).toMatch(/source\s*=\s*"\.\/modules\/security"/);
    expect(securityBlock).toMatch(/vpc_id\s*=\s*module\.networking\.vpc_id/);
  });

  test('compute module is configured correctly', () => {
    const computeBlock = hcl.match(/module\s+"compute"\s*{([\s\S]*?)}/m)?.[0];
    expect(computeBlock).toBeTruthy();
    expect(computeBlock).toMatch(/source\s*=\s*"\.\/modules\/compute"/);
    expect(computeBlock).toMatch(/vpc_id\s*=\s*module\.networking\.vpc_id/);
    expect(computeBlock).toMatch(/ec2_sg_id\s*=\s*module\.security\.ec2_sg_id/);
  });

  test('database module is configured correctly', () => {
    const databaseBlock = hcl.match(/module\s+"database"\s*{([\s\S]*?)}/m)?.[0];
    expect(databaseBlock).toBeTruthy();
    expect(databaseBlock).toMatch(/source\s*=\s*"\.\/modules\/database"/);
    expect(databaseBlock).toMatch(
      /private_subnet_ids\s*=\s*module\.networking\.private_subnet_ids/
    );
    expect(databaseBlock).toMatch(
      /rds_sg_id\s*=\s*module\.security\.rds_sg_id/
    );
  });

  test('storage module is configured correctly', () => {
    const storageBlock = hcl.match(/module\s+"storage"\s*{([\s\S]*?)}/m)?.[0];
    expect(storageBlock).toBeTruthy();
    expect(storageBlock).toMatch(/source\s*=\s*"\.\/modules\/storage"/);
    expect(storageBlock).toMatch(/vpc_id\s*=\s*module\.networking\.vpc_id/);
  });

  test('iam module is configured correctly', () => {
    const iamBlock = hcl.match(/module\s+"iam"\s*{([\s\S]*?)}/m)?.[0];
    expect(iamBlock).toBeTruthy();
    expect(iamBlock).toMatch(/source\s*=\s*"\.\/modules\/iam"/);
  });

  test('monitoring module is configured correctly', () => {
    const monitoringBlock = hcl.match(
      /module\s+"monitoring"\s*{([\s\S]*?)}/m
    )?.[0];
    expect(monitoringBlock).toBeTruthy();
    expect(monitoringBlock).toMatch(/source\s*=\s*"\.\/modules\/monitoring"/);
  });

  test('outputs are wired correctly', () => {
    expect(hcl).toMatch(/output\s+"vpc_id"/);
    expect(hcl).toMatch(/output\s+"public_subnet_ids"/);
    expect(hcl).toMatch(/output\s+"private_subnet_ids"/);
    expect(hcl).toMatch(/output\s+"ec2_sg_id"/);
    expect(hcl).toMatch(/output\s+"rds_sg_id"/);
    expect(hcl).toMatch(/output\s+"alb_dns_name"/);
    expect(hcl).toMatch(/output\s+"rds_endpoint"/);
    expect(hcl).toMatch(/output\s+"s3_data_bucket_name"/);
    expect(hcl).toMatch(/output\s+"cloudtrail_arn"/);
  });
});
