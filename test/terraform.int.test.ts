import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = path.resolve(__dirname);
const LIB_DIR = path.resolve(__dirname, '../lib');
const TEST_VARS_FILE = path.join(TEST_DIR, 'terraform.tfvars.test');
const TEST_TIMEOUT = 120000; // 2 minutes per test

describe('Terraform Integration Tests', () => {
  beforeAll(() => {
    // Create test variables file
    const testVars = `
aws_region = "us-east-1"
project_name = "test-tap"
environment_name = "dev"
environment_suffix = "test"
notification_email = "test@example.com"
allowed_ssh_cidrs = ["10.0.0.0/8"]
instance_type = "t3.micro"
enable_vpc_flow_logs = true
tags = {
  TestRun = "integration"
  Owner = "terraform-test"
}
`;
    fs.writeFileSync(TEST_VARS_FILE, testVars);
  }, TEST_TIMEOUT);

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(TEST_VARS_FILE)) {
      fs.unlinkSync(TEST_VARS_FILE);
    }

    // Clean up terraform files
    const filesToClean = [
      'terraform.tfstate',
      'terraform.tfstate.backup',
      '.terraform.lock.hcl',
      'tfplan.test',
    ];
    filesToClean.forEach(file => {
      const filePath = path.join(TEST_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('Terraform Basic Operations', () => {
    test(
      'terraform init succeeds',
      () => {
        expect(() => {
          execSync('terraform init -backend=false -reconfigure', {
            cwd: TEST_DIR,
            stdio: 'pipe',
            timeout: 60000,
          });
        }).not.toThrow();
      },
      TEST_TIMEOUT
    );

    test(
      'terraform validate succeeds',
      () => {
        expect(() => {
          execSync('terraform validate', {
            cwd: TEST_DIR,
            stdio: 'pipe',
            timeout: 30000,
          });
        }).not.toThrow();
      },
      TEST_TIMEOUT
    );

    test(
      'terraform fmt check passes',
      () => {
        expect(() => {
          execSync('terraform fmt -check -recursive', {
            cwd: TEST_DIR,
            stdio: 'pipe',
            timeout: 30000,
          });
        }).not.toThrow();
      },
      TEST_TIMEOUT
    );

    test(
      'terraform plan succeeds with test variables',
      () => {
        expect(() => {
          execSync(
            `terraform plan -var-file=${TEST_VARS_FILE} -out=tfplan.test`,
            {
              cwd: TEST_DIR,
              stdio: 'pipe',
              timeout: 120000,
            }
          );
        }).not.toThrow();

        // Clean up plan file
        const planFile = path.join(TEST_DIR, 'tfplan.test');
        if (fs.existsSync(planFile)) {
          fs.unlinkSync(planFile);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Configuration Validation', () => {
    test(
      'plan output contains expected resources',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            cwd: TEST_DIR,
            encoding: 'utf8',
            timeout: 120000,
          }
        );

        // Check for critical resources
        const expectedResources = [
          'aws_vpc.main',
          'aws_subnet.public',
          'aws_subnet.private',
          'aws_internet_gateway.main',
          'aws_nat_gateway.main',
          'aws_s3_bucket.logging',
          'aws_s3_bucket.data',
          'aws_cloudtrail.main',
          'aws_autoscaling_group.main',
          'aws_lambda_function.sg_remediation',
          'aws_sns_topic.alerts',
          'aws_security_group.ec2',
        ];

        expectedResources.forEach(resource => {
          expect(planOutput).toMatch(new RegExp(resource.replace('.', '\\.')));
        });
      },
      TEST_TIMEOUT
    );

    test(
      'plan shows correct resource counts',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            cwd: TEST_DIR,
            encoding: 'utf8',
            timeout: 120000,
          }
        );

        // Should plan to create resources, not destroy
        expect(planOutput).toMatch(
          /Plan: \d+ to add, 0 to change, 0 to destroy/
        );

        // Should not show any errors
        expect(planOutput).not.toMatch(/Error:/);
      },
      TEST_TIMEOUT
    );
  });
});
