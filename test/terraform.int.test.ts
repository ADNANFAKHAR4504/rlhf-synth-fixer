import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TEST_VARS_FILE = path.join(LIB_DIR, 'terraform.tfvars.test');

describe('Terraform Integration Tests', () => {
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();

    // Create test variables file
    const testVars = `
aws_region = "us-east-1"
project_name = "test-tap"
environment_name = "dev"
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
  });

  afterAll(() => {
    process.chdir(originalCwd);

    // Clean up test files
    if (fs.existsSync(TEST_VARS_FILE)) {
      fs.unlinkSync(TEST_VARS_FILE);
    }
  });

  describe('Terraform Validation', () => {
    test('terraform init succeeds', () => {
      process.chdir(LIB_DIR);

      expect(() => {
        execSync('terraform init -backend=false', {
          stdio: 'pipe',
          timeout: 60000,
        });
      }).not.toThrow();
    });

    test('terraform validate succeeds', () => {
      process.chdir(LIB_DIR);

      expect(() => {
        execSync('terraform validate', {
          stdio: 'pipe',
          timeout: 30000,
        });
      }).not.toThrow();
    });

    test('terraform fmt check passes', () => {
      process.chdir(LIB_DIR);

      expect(() => {
        execSync('terraform fmt -check -recursive', {
          stdio: 'pipe',
          timeout: 30000,
        });
      }).not.toThrow();
    });

    test('terraform plan succeeds with test variables', () => {
      process.chdir(LIB_DIR);

      expect(() => {
        execSync(
          `terraform plan -var-file=${TEST_VARS_FILE} -out=tfplan.test`,
          {
            stdio: 'pipe',
            timeout: 120000,
          }
        );
      }).not.toThrow();

      // Clean up plan file
      if (fs.existsSync(path.join(LIB_DIR, 'tfplan.test'))) {
        fs.unlinkSync(path.join(LIB_DIR, 'tfplan.test'));
      }
    });
  });

  describe('Configuration Validation', () => {
    test('plan output contains expected resources', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
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
    });

    test('plan shows correct resource counts', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      // Should plan to create resources, not destroy
      expect(planOutput).toMatch(/Plan: \d+ to add, 0 to change, 0 to destroy/);

      // Should not show any errors
      expect(planOutput).not.toMatch(/Error:/);
      expect(planOutput).not.toMatch(/Warning:/);
    });
  });

  describe('Security Configuration Validation', () => {
    test('AMI is using latest Amazon Linux 2023', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      // Should reference the correct AMI parameter
      expect(planOutput).toMatch(/al2023-ami-kernel-6\.1-x86_64/);
    });

    test('S3 buckets have encryption enabled', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      // Should show encryption configuration
      expect(planOutput).toMatch(/server_side_encryption_configuration/);
      expect(planOutput).toMatch(/AES256/);
    });

    test('VPC has proper CIDR and DNS settings', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/cidr_block.*=.*"10\.0\.0\.0\/16"/);
      expect(planOutput).toMatch(/enable_dns_hostnames.*=.*true/);
      expect(planOutput).toMatch(/enable_dns_support.*=.*true/);
    });

    test('Lambda function uses correct runtime', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/runtime.*=.*"python3\.12"/);
    });

    test('Auto Scaling Group is configured for high availability', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/min_size.*=.*1/);
      expect(planOutput).toMatch(/max_size.*=.*2/);
      expect(planOutput).toMatch(/desired_capacity.*=.*1/);
    });
  });

  describe('Variable Validation', () => {
    test('rejects invalid AWS region', () => {
      process.chdir(LIB_DIR);

      const invalidVars = `
aws_region = "invalid-region"
project_name = "test-tap"
environment_name = "dev"
notification_email = "test@example.com"
`;
      const invalidVarsFile = path.join(LIB_DIR, 'invalid.tfvars');
      fs.writeFileSync(invalidVarsFile, invalidVars);

      expect(() => {
        execSync(`terraform plan -var-file=${invalidVarsFile}`, {
          stdio: 'pipe',
          timeout: 60000,
        });
      }).toThrow();

      fs.unlinkSync(invalidVarsFile);
    });

    test('rejects invalid environment name', () => {
      process.chdir(LIB_DIR);

      const invalidVars = `
aws_region = "us-east-1"
project_name = "test-tap"
environment_name = "invalid"
notification_email = "test@example.com"
`;
      const invalidVarsFile = path.join(LIB_DIR, 'invalid.tfvars');
      fs.writeFileSync(invalidVarsFile, invalidVars);

      expect(() => {
        execSync(`terraform plan -var-file=${invalidVarsFile}`, {
          stdio: 'pipe',
          timeout: 60000,
        });
      }).toThrow();

      fs.unlinkSync(invalidVarsFile);
    });

    test('rejects invalid email format', () => {
      process.chdir(LIB_DIR);

      const invalidVars = `
aws_region = "us-east-1"
project_name = "test-tap"
environment_name = "dev"
notification_email = "invalid-email"
`;
      const invalidVarsFile = path.join(LIB_DIR, 'invalid.tfvars');
      fs.writeFileSync(invalidVarsFile, invalidVars);

      expect(() => {
        execSync(`terraform plan -var-file=${invalidVarsFile}`, {
          stdio: 'pipe',
          timeout: 60000,
        });
      }).toThrow();

      fs.unlinkSync(invalidVarsFile);
    });

    test('rejects invalid instance type', () => {
      process.chdir(LIB_DIR);

      const invalidVars = `
aws_region = "us-east-1"
project_name = "test-tap"
environment_name = "dev"
notification_email = "test@example.com"
instance_type = "t2.nano"
`;
      const invalidVarsFile = path.join(LIB_DIR, 'invalid.tfvars');
      fs.writeFileSync(invalidVarsFile, invalidVars);

      expect(() => {
        execSync(`terraform plan -var-file=${invalidVarsFile}`, {
          stdio: 'pipe',
          timeout: 60000,
        });
      }).toThrow();

      fs.unlinkSync(invalidVarsFile);
    });
  });

  describe('Output Validation', () => {
    test('all required outputs are defined', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      const expectedOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'nat_gateway_ids',
        'asg_name',
        'data_bucket_name',
        'logging_bucket_name',
        'cloudtrail_name',
        'sns_topic_arn',
        'lambda_function_name',
        'lambda_function_arn',
      ];

      expectedOutputs.forEach(output => {
        expect(planOutput).toMatch(
          new RegExp(`Changes to Outputs:[\\s\\S]*?${output}`)
        );
      });
    });
  });

  describe('Production Readiness Checks', () => {
    test('CloudTrail is configured for multi-region', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/is_multi_region_trail.*=.*true/);
    });

    test('S3 buckets have public access blocked', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/block_public_acls.*=.*true/);
      expect(planOutput).toMatch(/block_public_policy.*=.*true/);
      expect(planOutput).toMatch(/ignore_public_acls.*=.*true/);
      expect(planOutput).toMatch(/restrict_public_buckets.*=.*true/);
    });

    test('VPC Flow Logs are enabled by default', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/aws_flow_log\.vpc/);
    });

    test('Security group allows SSH only from specified CIDRs', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/from_port.*=.*22/);
      expect(planOutput).toMatch(/to_port.*=.*22/);
      expect(planOutput).not.toMatch(/cidr_blocks.*=.*\["0\.0\.0\.0\/0"\]/);
    });

    test('EC2 instances are in private subnets only', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/vpc_zone_identifier.*private/);
      expect(planOutput).not.toMatch(/vpc_zone_identifier.*public/);
    });

    test('Lambda function has proper IAM permissions', () => {
      process.chdir(LIB_DIR);

      const planOutput = execSync(
        `terraform plan -var-file=${TEST_VARS_FILE}`,
        {
          encoding: 'utf8',
          timeout: 120000,
        }
      );

      expect(planOutput).toMatch(/ec2:DescribeSecurityGroups/);
      expect(planOutput).toMatch(/ec2:AuthorizeSecurityGroupIngress/);
      expect(planOutput).toMatch(/ec2:RevokeSecurityGroupIngress/);
    });
  });
});
