import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TEST_VARS_FILE = path.join(LIB_DIR, 'terraform.tfvars.test');
const TEST_TIMEOUT = 180000; // 3 minutes per test

// Isolated init-only suite that does not use the tap stack
describe('@terraform.init (provider-only)', () => {
  const INIT_DIR = path.join(__dirname, 'tf-init-only');

  beforeAll(() => {
    // Prepare isolated directory
    if (!fs.existsSync(INIT_DIR)) fs.mkdirSync(INIT_DIR, { recursive: true });

    // Copy only provider.tf
    const providerSrc = path.join(LIB_DIR, 'provider.tf');
    const providerDst = path.join(INIT_DIR, 'provider.tf');
    if (fs.existsSync(providerSrc)) {
      fs.copyFileSync(providerSrc, providerDst);
    } else {
      throw new Error(`Missing provider.tf at ${providerSrc}`);
    }
  });

  afterAll(() => {
    // Cleanup init directory contents
    if (!fs.existsSync(INIT_DIR)) return;
    const files = fs.readdirSync(INIT_DIR);
    for (const f of files) {
      try { fs.rmSync(path.join(INIT_DIR, f), { recursive: true, force: true }); } catch {}
    }
    try { fs.rmdirSync(INIT_DIR); } catch {}
  });

  test('terraform init succeeds', () => {
    expect(() => {
      execSync('terraform init -reconfigure -lock=false -upgrade', {
        cwd: INIT_DIR,
        stdio: 'pipe',
        timeout: 120000,
      });
    }).not.toThrow();
  }, TEST_TIMEOUT);

  test('terraform validate passes', () => {
    expect(() => {
      execSync('terraform validate', {
        cwd: INIT_DIR,
        stdio: 'pipe',
        timeout: 30000,
        shell: '/bin/sh',
      });
    }).not.toThrow();
  }, TEST_TIMEOUT);

  test('terraform fmt check passes', () => {
    expect(() => {
      execSync('terraform fmt -check -recursive', {
        cwd: INIT_DIR,
        stdio: 'pipe',
        timeout: 30000,
        shell: '/bin/sh',
      });
    }).not.toThrow();
  }, TEST_TIMEOUT);
});

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
      'terraform fmt runs without errors',
      () => {
        expect(() => {
          execSync('terraform fmt -recursive', {
            stdio: 'pipe',
            timeout: 30000,
            cwd: LIB_DIR,
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
      'plan output contains expected resources for current config',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Always expected (unconditional)
        const mustExist = [
          'aws_kms_key.primary',
          'aws_kms_key.secondary',
          'aws_kms_alias.primary',
          'aws_kms_alias.secondary',
          'aws_s3_bucket.primary',
          'aws_s3_bucket.secondary',
          'aws_s3_bucket.logging',
          // Replication configuration is created inside module.s3_replication as "this"
          // Match by type to be resilient to module resource name changes
          'aws_s3_bucket_replication_configuration',
          'aws_dynamodb_table.primary',
          'aws_dynamodb_table.secondary',
        ];
        mustExist.forEach(resource => {
          expect(planOutput).toMatch(new RegExp(resource.replace('.', '\.')));
        });

        // With create_vpcs=false and create_cloudtrail=false we should NOT see these
        const mustNotExist = [
          'aws_vpc.primary',
          'aws_vpc.secondary',
          'aws_internet_gateway.primary',
          'aws_internet_gateway.secondary',
          'aws_cloudtrail.primary',
          'aws_cloudtrail.secondary',
          'aws_vpc_peering_connection.primary_to_secondary',
          'aws_vpc_peering_connection_accepter.secondary',
        ];
        mustNotExist.forEach(resource => {
          expect(planOutput).not.toMatch(new RegExp(resource.replace('.', '\.')));
        });
      },
      TEST_TIMEOUT
    );

    test(
      'plan runs without errors',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
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
      'VPC resources are not present when disabled',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        expect(planOutput).not.toMatch(/aws_vpc\.primary/);
        expect(planOutput).not.toMatch(/aws_vpc\.secondary/);
      },
      TEST_TIMEOUT
    );

    test(
      'CloudTrail resources are absent when disabled',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        expect(planOutput).not.toMatch(/aws_cloudtrail\.primary/);
        expect(planOutput).not.toMatch(/aws_cloudtrail\.secondary/);
      },
      TEST_TIMEOUT
    );
  });

  describe('Conditional Resource Creation', () => {
    test(
      'VPC resources are conditional based on create_vpcs variable',
      () => {
        // Default (false) -> no VPC resources
        const planDefault = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          { encoding: 'utf8', timeout: 180000 }
        );
        expect(planDefault).not.toMatch(/aws_vpc\.primary/);
        expect(planDefault).not.toMatch(/aws_vpc\.secondary/);

        // Enable VPCs via temp tfvars -> VPC resources appear
        const vpcVars = `create_vpcs = true\ncreate_cloudtrail = false\nallowed_cidr_blocks = ["10.0.0.0/8"]\ndb_password = "TestPassword123!"\n`;
        const vpcVarsFile = path.join(LIB_DIR, 'enable-vpc.tfvars');
        fs.writeFileSync(vpcVarsFile, vpcVars);
        try {
          const planEnabled = execSync(
            `terraform plan -var-file=${vpcVarsFile}`,
            { encoding: 'utf8', timeout: 180000 }
          );
          expect(planEnabled).toMatch(/aws_vpc\.primary/);
          expect(planEnabled).toMatch(/aws_vpc\.secondary/);
        } finally {
          fs.unlinkSync(vpcVarsFile);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'CloudTrail resources are conditional based on create_cloudtrail variable',
      () => {
        // Default (false) -> no CloudTrail resources
        const planDefault = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          { encoding: 'utf8', timeout: 180000 }
        );
        expect(planDefault).not.toMatch(/aws_cloudtrail\.primary/);
        expect(planDefault).not.toMatch(/aws_cloudtrail\.secondary/);

        // Enable CloudTrail via temp tfvars -> CloudTrail resources appear
        const ctVars = `create_cloudtrail = true\ncreate_vpcs = false\ndb_password = "TestPassword123!"\n`;
        const ctVarsFile = path.join(LIB_DIR, 'enable-cloudtrail.tfvars');
        fs.writeFileSync(ctVarsFile, ctVars);
        try {
          const planEnabled = execSync(
            `terraform plan -var-file=${ctVarsFile}`,
            { encoding: 'utf8', timeout: 180000 }
          );
          expect(planEnabled).toMatch(/aws_cloudtrail\.primary/);
          expect(planEnabled).toMatch(/aws_cloudtrail\.secondary/);
        } finally {
          fs.unlinkSync(ctVarsFile);
        }
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
      'multiple providers are configured correctly (static check)',
      () => {
        const providerContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
        // required_providers includes aws from hashicorp
        expect(providerContent).toMatch(
          /required_providers[\s\S]*aws[\s\S]*source\s*=\s*"hashicorp\/aws"/
        );
        // default aws provider region
        expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*region\s*=\s*"us-west-1"/);
        // aliased eu_central_1 provider
        expect(providerContent).toMatch(/provider\s+"aws"[\s\S]*alias\s*=\s*"eu_central_1"[\s\S]*region\s*=\s*"eu-central-1"/);
      },
      TEST_TIMEOUT
    );
  });

  describe('Output Validation', () => {
    test(
      'outputs are declared in configuration (static check)',
      () => {
        const stackContent = fs.readFileSync(path.join(LIB_DIR, 'tap_stack.tf'), 'utf8');
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
          expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"`));
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

        // Check for S3 SSE with KMS
        expect(planOutput).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
        expect(planOutput).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
        // KMS key reference shown as kms_master_key_id in SSE blocks
        expect(planOutput).toMatch(/kms_master_key_id/);
      },
      TEST_TIMEOUT
    );

    test(
      'resources have tagging configured',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // Should show tags being applied (values depend on var-file)
        expect(planOutput).toMatch(/tags\s*=\s*{?/);
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
      'networking shows SSH rules only when VPCs are enabled',
      () => {
        const planOutput = execSync(
          `terraform plan -var-file=${TEST_VARS_FILE}`,
          {
            encoding: 'utf8',
            timeout: 180000,
          }
        );

        // With create_vpcs=false, SSH rules should not appear
        expect(planOutput).not.toMatch(/from_port.*=.*22/);
        expect(planOutput).not.toMatch(/to_port.*=.*22/);
      },
      TEST_TIMEOUT
    );
  });
});
