import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Tests', () => {
  let plan: any;

  beforeAll(() => {
    // Load Terraform plan JSON file
    const planPath = path.join(__dirname, '../lib/main.json');
    const planData = fs.readFileSync(planPath, 'utf8');
    plan = JSON.parse(planData);
    });
  test('VPC should have correct CIDR', () => {
    const vpcResource = plan.resource_changes.find(
      (r: any) => r.type === 'aws_vpc' && r.name === 'main'
    );

    expect(vpcResource.change.after.cidr_block).toBe('10.0.0.0/16');
  });

  test('Should create a public subnet with correct CIDR', () => {
    const publicSubnet = plan.resource_changes.find(
      (r: any) => r.type === 'aws_subnet' && r.name === 'public'
    );

    expect(publicSubnet.change.after.cidr_block).toBe('10.0.1.0/24');
  });


  test('Should create a private subnet with correct CIDR', () => {
    const privateSubnet = plan.resource_changes.find(
      (r: any) => r.type === 'aws_subnet' && r.name === 'private'
    );
    expect(privateSubnet.change.after.cidr_block).toBe('10.0.2.0/24');
  });

  test('Bastion host should have IAM instance profile', () => {
    const bastionInstance = plan.resource_changes.find(
      (r: any) => r.type === 'aws_instance' && r.name === 'bastion'
    );
    expect(bastionInstance.change.after.iam_instance_profile).toBeDefined();
  });

  test('Secrets Manager secret should exist', () => {
    const secret = plan.resource_changes.find(
      (r: any) => r.type === 'aws_secretsmanager_secret' && r.name === 'app_secrets'
    );
    expect(secret).toBeDefined();
  });
});