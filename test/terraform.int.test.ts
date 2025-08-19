import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TEST_VARS_FILE = path.join(LIB_DIR, 'terraform.tfvars.test');
const TEST_TIMEOUT = 180000; // 3 minutes per test

describe('Terraform Multi-Region Integration Tests', () => {
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();

    // Create test variables file for multi-region setup
    const testVars = `
# Multi-region configuration
allowed_cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
create_vpcs = false
create_cloudtrail = false
ec2_instance_type = "t3.micro"
ec2_key_pair_name = ""
db_password = "TestPassword123!"

# Tags
tags = {
  TestRun = "integration"
  Owner = "terraform-test"
  Environment = "test"
}
`;
    fs.writeFileSync(TEST_VARS_FILE, testVars);
    process.chdir(LIB_DIR);
  }, TEST_TIMEOUT);

  afterAll(() => {
    process.chdir(originalCwd);

    // Clean up test files
    if (fs.existsSync(TEST_VARS_FILE)) {
      fs.unlinkSync(TEST_VARS_FILE);
    }

    // Clean up any terraform files
    const filesToClean = [
      'terraform.tfstate',
      'terraform.tfstate.backup',
      '.terraform.lock.hcl',
    ];
    filesToClean.forEach(file => {
      const filePath = path.join(LIB_DIR, file);
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
          execSync('terraform init -reconfigure -lock=false -upgrade', {
            stdio: 'pipe',
            timeout: 120000,
          });
        }).not.toThrow();
      },
      TEST_TIMEOUT
    );

    test(
      'terraform validate passes',
      () => {
        expect(() => {
          execSync('terraform validate', {
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
            stdio: 'pipe',
            timeout: 30000,
          });
        }).not.toThrow();
      },
      TEST_TIMEOUT
    );
  });

  describe('Multi-Region Configuration Validation', () => {
    test(
      'terraform plan succeeds with test variables',
      () => {
        expect(() => {
          execSync(
            `terraform plan -var-file=${TEST_VARS_FILE} -out=tfplan.test`,
            {
              stdio: 'pipe',
              timeout: 180000,
            }
          );
        }).not.toThrow();

        // Clean up plan file
        const planFile = path.join(LIB_DIR, 'tfplan.test');
        if (fs.existsSync(planFile)) {
          fs.unlinkSync(planFile);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'plan output contains expected multi-region resources',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Check for multi-region resources
        const expectedResources = [
          // KMS keys for both regions
          'aws_kms_key.primary',
          'aws_kms_key.secondary',
          'aws_kms_alias.primary',
          'aws_kms_alias.secondary',

          // VPC resources for both regions
          'aws_vpc.primary',
          'aws_vpc.secondary',
          'aws_internet_gateway.primary',
          'aws_internet_gateway.secondary',

          // S3 buckets
          'aws_s3_bucket.primary',
          'aws_s3_bucket.secondary',
          'aws_s3_bucket.logging',

          // Cross-region replication
          'aws_s3_bucket_replication_configuration.primary',

          // DynamoDB tables
          'aws_dynamodb_table.primary',
          'aws_dynamodb_table.secondary',

          // CloudTrail for both regions
          'aws_cloudtrail.primary',
          'aws_cloudtrail.secondary',

          // VPC Peering
          'aws_vpc_peering_connection.primary_to_secondary',
          'aws_vpc_peering_connection_accepter.secondary',
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
            encoding: 'utf8',
            timeout: 180000,
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

  describe('Multi-Region Security Validation', () => {
    test(
      'KMS keys are configured for both regions',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should show KMS keys for both regions
        expect(planOutput).toMatch(/aws_kms_key\.primary/);
        expect(planOutput).toMatch(/aws_kms_key\.secondary/);

        // Should show proper deletion window
        expect(planOutput).toMatch(/deletion_window_in_days.*=.*7/);
      },
      TEST_TIMEOUT
    );

    test(
      'S3 buckets have encryption and cross-region replication',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should show S3 encryption configuration
        expect(planOutput).toMatch(
          /aws_s3_bucket_server_side_encryption_configuration/
        );
        expect(planOutput).toMatch(/aws:kms/);

        // Should show replication configuration
        expect(planOutput).toMatch(/aws_s3_bucket_replication_configuration/);
        expect(planOutput).toMatch(/delete_marker_replication/);
      },
      TEST_TIMEOUT
    );

    test(
      'VPC configuration is secure',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should show proper CIDR blocks
        expect(planOutput).toMatch(/cidr_block.*=.*"10\.0\.0\.0\/16"/);
        expect(planOutput).toMatch(/cidr_block.*=.*"10\.1\.0\.0\/16"/);

        // Should show DNS settings
        expect(planOutput).toMatch(/enable_dns_hostnames.*=.*true/);
        expect(planOutput).toMatch(/enable_dns_support.*=.*true/);
      },
      TEST_TIMEOUT
    );

    test(
      'CloudTrail is configured for both regions',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        expect(planOutput).toMatch(/aws_cloudtrail\.primary/);
        expect(planOutput).toMatch(/aws_cloudtrail\.secondary/);
        expect(planOutput).toMatch(/is_multi_region_trail.*=.*true/);
        expect(planOutput).toMatch(/enable_log_file_validation.*=.*true/);
      },
      TEST_TIMEOUT
    );
  });

  describe('Conditional Resource Creation', () => {
    test(
      'VPC resources are conditional based on create_vpcs variable',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should show conditional creation
        expect(planOutput).toMatch(/count.*=.*var\.create_vpcs/);
      },
      TEST_TIMEOUT
    );

    test(
      'CloudTrail resources are conditional based on create_cloudtrail variable',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should show conditional creation for CloudTrail
        expect(planOutput).toMatch(/count.*=.*var\.create_cloudtrail/);
      },
      TEST_TIMEOUT
    );

    test(
      'plan with VPCs disabled works correctly',
      () => {
        // Create temporary vars file with VPCs disabled
        const noVpcVars = `
allowed_cidr_blocks = ["10.0.0.0/8"]
create_vpcs = false
create_cloudtrail = false
ec2_instance_type = "t3.micro"
ec2_key_pair_name = ""
db_password = "TestPassword123!"
`;
        const noVpcVarsFile = path.join(LIB_DIR, 'no-vpc.tfvars');
        fs.writeFileSync(noVpcVarsFile, noVpcVars);

        expect(() => {
          execSync(`terraform plan -var-file=${noVpcVarsFile}`, {
            stdio: 'pipe',
            timeout: 120000,
          });
        }).not.toThrow();

        // Clean up
        fs.unlinkSync(noVpcVarsFile);
      },
      TEST_TIMEOUT
    );
  });

  describe('Provider Configuration', () => {
    test(
      'multiple providers are configured correctly',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should reference both providers
        expect(planOutput).toMatch(
          /provider\[\"registry\.terraform\.io\/hashicorp\/aws\"\]/
        );
        expect(planOutput).toMatch(
          /provider\[\"registry\.terraform\.io\/hashicorp\/aws\"\.eu_central_1\]/
        );
      },
      TEST_TIMEOUT
    );
  });

  describe('Output Validation', () => {
    test(
      'all required outputs are defined',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        const expectedOutputs = [
          'primary_vpc_id',
          'secondary_vpc_id',
          'primary_s3_bucket_name',
          'secondary_s3_bucket_name',
          'logging_s3_bucket_name',
          'primary_kms_key_id',
          'secondary_kms_key_id',
          'dynamodb_table_name',
        ];

        expectedOutputs.forEach(output => {
          expect(planOutput).toMatch(
            new RegExp(`Changes to Outputs:[\\s\\S]*?${output}`)
          );
        });
      },
      TEST_TIMEOUT
    );
  });

  describe('Production Readiness Checks', () => {
    test(
      'resources use proper encryption',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Check for encryption settings
        expect(planOutput).toMatch(/encrypted.*=.*true/);
        expect(planOutput).toMatch(/kms_key_id/);
        expect(planOutput).toMatch(/server_side_encryption/);
      },
      TEST_TIMEOUT
    );

    test(
      'resources have proper tagging',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should show tags being applied
        expect(planOutput).toMatch(/tags.*=.*{/);
        expect(planOutput).toMatch(/Environment.*=.*"production"/);
      },
      TEST_TIMEOUT
    );

    test(
      'IAM follows least privilege principle',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should not have overly permissive policies
        expect(planOutput).not.toMatch(/"Action":\s*"\*"/);
        expect(planOutput).not.toMatch(/"Resource":\s*"\*"/);
      },
      TEST_TIMEOUT
    );

    test(
      'networking follows security best practices',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should show restricted SSH access
        expect(planOutput).toMatch(/from_port.*=.*22/);
        expect(planOutput).toMatch(/to_port.*=.*22/);

        // Should not allow SSH from 0.0.0.0/0
        expect(planOutput).not.toMatch(
          /cidr_blocks.*=.*\["0\.0\.0\.0\/0"\].*22/
        );
      },
      TEST_TIMEOUT
    );
  });
});
