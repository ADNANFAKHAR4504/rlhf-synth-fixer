import { execSync } from 'child_process';
import path from 'path';

describe('Terraform Infrastructure Integration Test', () => {
  const terraformDir = path.join(__dirname, '../lib'); // adjust path to your Terraform code

  beforeAll(() => {
    console.log('Initializing Terraform...');
    execSync('terraform init -input=false', { cwd: terraformDir, stdio: 'inherit' });
  });

  it('should plan without errors', () => {
    console.log('Running Terraform plan...');
    execSync('terraform plan -input=false -no-color', { cwd: terraformDir, stdio: 'inherit' });
  });

  it('should apply successfully', () => {
    console.log('Applying Terraform (auto-approve)...');
    execSync('terraform apply -input=false -auto-approve -no-color', { cwd: terraformDir, stdio: 'inherit' });
  }, 600000); // allow up to 10 min

  it('should output correct infrastructure values', () => {
    console.log('Fetching Terraform outputs...');
    const outputRaw = execSync('terraform output -json', { cwd: terraformDir });
    const outputs = JSON.parse(outputRaw.toString());

    // Example validations:
    expect(outputs.vpc_id.value).toMatch(/^vpc-/);
    expect(outputs.public_subnet_ids.value[0]).toMatch(/^subnet-/);
    expect(outputs.private_subnet_ids.value[0]).toMatch(/^subnet-/);
    expect(outputs.bastion_host_public_ip.value).toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/);
    expect(outputs.private_instance_ids.value[0]).toMatch(/^i-/);
    expect(outputs.iam_role_name.value).toContain('production-ec2-secrets-role');
    expect(outputs.secrets_manager_secret_arn.value).toMatch(/^arn:aws:secretsmanager:/);
  });

  afterAll(() => {
    console.log('Destroying Terraform resources...');
    execSync('terraform destroy -auto-approve -input=false -no-color', { cwd: terraformDir, stdio: 'inherit' });
  });
})
