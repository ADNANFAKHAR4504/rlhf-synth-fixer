import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const PLAN_JSON = path.join(LIB_DIR, 'main.json');

const file = () => fs.readFileSync(PLAN_JSON, 'utf8');
const json = () => JSON.parse(file());

describe('Terraform plan.json structure', () => {
  it('plan.json exists and is valid JSON', () => {
    expect(fs.existsSync(PLAN_JSON)).toBe(true);
    expect(() => JSON.parse(file())).not.toThrow();
  });

  it('VPC should have correct CIDR', () => {
    const plan = json();
    const vpcResource = plan.resource_changes.find(
      (r: any) => r.type === 'aws_vpc' && r.name === 'main'
    );
    expect(vpcResource).toBeDefined();
    expect(vpcResource.change.after.cidr_block).toBe('172.31.0.0/16');
  });

  it('Should create a public subnet with correct CIDR', () => {
    const plan = json();
    const publicSubnet = plan.resource_changes.find(
      (r: any) => r.type === 'aws_subnet' && r.name === 'public'
    );
    expect(publicSubnet).toBeDefined();
    expect(publicSubnet.change.after.cidr_block).toBe('172.31.0.0/20');
  });

  it('Should create a private subnet with correct CIDR', () => {
    const plan = json();
    const privateSubnet = plan.resource_changes.find(
      (r: any) => r.type === 'aws_subnet' && r.name === 'private'
    );
    expect(privateSubnet).toBeDefined();
    expect(privateSubnet.change.after.cidr_block).toBe('172.31.16.0/20');
  });

  it('Bastion host should have IAM instance profile', () => {
    const plan = json();
    const bastionInstance = plan.resource_changes.find(
      (r: any) => r.type === 'aws_instance' && r.name === 'bastion'
    );
    expect(bastionInstance).toBeDefined();
    expect(bastionInstance.change.after.iam_instance_profile).toBeDefined();
  });

  it('Secrets Manager secret should exist', () => {
    const plan = json();
    const secret = plan.resource_changes.find(
      (r: any) => r.type === 'aws_secretsmanager_secret' && r.name === 'app_secrets'
    );
    expect(secret).toBeDefined();
  });

  it('does not contain hardcoded AWS credentials in plan', () => {
    const planString = file();
    expect(/aws_access_key_id\s*=/.test(planString)).toBe(false);
    expect(/aws_secret_access_key\s*=/.test(planString)).toBe(false);
  });
});