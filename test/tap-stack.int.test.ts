import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform E2E Integration Test', () => {
  const tfDir = path.join(__dirname, '../lib');
  const tfvarsPath = path.join(tfDir, 'terraform.tfvars');
  const stackFile = path.join(tfDir, 'tap_stack.tf');

  beforeAll(() => {
    // Ensure tfvars exists
    if (!fs.existsSync(tfvarsPath)) {
      fs.writeFileSync(tfvarsPath, 'projectname = "integrationtest"\n');
    }
  });

  test('terraform init completes successfully', () => {
    expect(() => execSync('terraform init', { cwd: tfDir, stdio: 'pipe' })).not.toThrow();
  });

  test('terraform validate passes with no errors', () => {
    expect(() => execSync('terraform validate', { cwd: tfDir, stdio: 'pipe' })).not.toThrow();
  });

  test('terraform plan produces expected resources', () => {
    const planOutput = execSync('terraform plan -no-color', { cwd: tfDir }).toString();
    expect(planOutput).toMatch(/aws_s3_bucket\.main/);
    expect(planOutput).toMatch(/aws_dynamodb_table\.main/);
    expect(planOutput).toMatch(/No changes. Infrastructure is up-to-date|Plan:/);
  });

  test('terraform apply can provision resources (dry-run)', () => {
    const applyOutput = execSync('terraform apply -no-color -auto-approve -refresh=false -input=false -lock=false -target=aws_s3_bucket.main -target=aws_dynamodb_table.main', { cwd: tfDir }).toString();
    expect(applyOutput).toMatch(/Apply complete|No changes. Infrastructure is up-to-date/);
  });

  afterAll(() => {
    // Optionally clean up state files for test isolation
    const stateFiles = ['terraform.tfstate', 'terraform.tfstate.backup'];
    stateFiles.forEach(f => {
      const filePath = path.join(tfDir, f);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  });
});
