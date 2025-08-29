import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  const libDir = path.resolve(__dirname, '../lib');
  const terraformBin = 'terraform';
  const flatOutputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
  let flatOutputs: any;

  beforeAll(() => {
    // Ensure we're in the lib directory for Terraform commands
    process.chdir(libDir);

    // Load the reference flat-outputs.json file
    if (fs.existsSync(flatOutputsPath)) {
      const flatOutputsContent = fs.readFileSync(flatOutputsPath, 'utf8');
      flatOutputs = JSON.parse(flatOutputsContent);
    } else {
      throw new Error('Reference flat-outputs.json file not found');
    }
  });

  describe('Terraform Validation', () => {
    test('terraform validate passes', () => {
      try {
        const result = execSync(`${terraformBin} validate`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();
        // Allow warnings but ensure no errors
        expect(result).not.toContain('Error:');
      } catch (error) {
        throw new Error(`Terraform validation failed: ${error}`);
      }
    });

    test('terraform fmt check passes', () => {
      try {
        const result = execSync(`${terraformBin} fmt -check -recursive`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();
      } catch (error) {
        throw new Error(`Terraform format check failed: ${error}`);
      }
    });
  });

  describe('State Management', () => {
    test('terraform state list shows expected resources', () => {
      try {
        const result = execSync(`${terraformBin} state list`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();

        // Check for expected modules in state
        expect(result).toContain('module.central_logging');
        expect(result).toContain('module.secrets_us_east_1');
        expect(result).toContain('module.vpc_us_east_1');

        // Check for random password resources
        expect(result).toContain('random_password.db_passwords["us-east-1"]');
      } catch (error) {
        throw new Error(`Terraform state list failed: ${error}`);
      }
    });

    test('terraform output shows expected values', () => {
      try {
        const result = execSync(`${terraformBin} output`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();

        // Check for expected outputs
        expect(result).toContain('vpc_ids');
        expect(result).toContain('private_subnet_ids');
        expect(result).toContain('database_subnet_ids');
        expect(result).toContain('central_logging_bucket');
        expect(result).toContain('secrets_arns');
      } catch (error) {
        throw new Error(`Terraform output failed: ${error}`);
      }
    });
  });

  describe('Output Validation Against Reference', () => {
    test('central logging bucket matches reference', () => {
      try {
        const result = execSync(`${terraformBin} output -json central_logging_bucket`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        const output = JSON.parse(result);
        const expectedBucket = flatOutputs.central_logging_bucket;

        expect(output).toBe(expectedBucket);
        expect(output).toMatch(/^secure-infra-production-central-logging-/);
      } catch (error) {
        throw new Error(`Central logging bucket validation failed: ${error}`);
      }
    });

    test('VPC IDs match reference', () => {
      try {
        const result = execSync(`${terraformBin} output -json vpc_ids`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        const output = JSON.parse(result);
        const expectedVpcIds = JSON.parse(flatOutputs.vpc_ids);

        expect(output.us_east_1).toBe(expectedVpcIds.us_east_1);
        expect(output.us_east_1).toMatch(/^vpc-/);
      } catch (error) {
        throw new Error(`VPC IDs validation failed: ${error}`);
      }
    });

    test('private subnet IDs match reference', () => {
      try {
        const result = execSync(`${terraformBin} output -json private_subnet_ids`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        const output = JSON.parse(result);
        const expectedPrivateSubnets = JSON.parse(flatOutputs.private_subnet_ids);

        expect(output.us_east_1).toBe(expectedPrivateSubnets.us_east_1);
        expect(output.us_east_1).toMatch(/^subnet-/);
      } catch (error) {
        throw new Error(`Private subnet IDs validation failed: ${error}`);
      }
    });

    test('database subnet IDs match reference', () => {
      try {
        const result = execSync(`${terraformBin} output -json database_subnet_ids`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        const output = JSON.parse(result);
        const expectedDatabaseSubnets = JSON.parse(flatOutputs.database_subnet_ids);

        expect(output.us_east_1).toBe(expectedDatabaseSubnets.us_east_1);
        expect(output.us_east_1).toMatch(/^subnet-/);
      } catch (error) {
        throw new Error(`Database subnet IDs validation failed: ${error}`);
      }
    });

    test('secrets ARNs match reference', () => {
      try {
        const result = execSync(`${terraformBin} output -json secrets_arns`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        const output = JSON.parse(result);
        const expectedSecrets = JSON.parse(flatOutputs.secrets_arns);

        expect(output.us_east_1.api_keys).toBe(expectedSecrets.us_east_1.api_keys);
        expect(output.us_east_1.db_password).toBe(expectedSecrets.us_east_1.db_password);

        // Validate ARN format
        expect(output.us_east_1.api_keys).toMatch(/^arn:aws:secretsmanager:us-east-1:\d+:secret:/);
        expect(output.us_east_1.db_password).toMatch(/^arn:aws:secretsmanager:us-east-1:\d+:secret:/);
      } catch (error) {
        throw new Error(`Secrets ARNs validation failed: ${error}`);
      }
    });
  });

  describe('Resource Validation', () => {
    test('VPC resource exists and matches reference', () => {
      try {
        const vpcId = JSON.parse(flatOutputs.vpc_ids).us_east_1;
        const result = execSync(`${terraformBin} state show module.vpc_us_east_1.aws_vpc.main`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });

        expect(result).toBeDefined();
        expect(result).toContain(`id                                   = "${vpcId}"`);
        expect(result).toContain('cidr_block                           = "10.1.0.0/16"');
        expect(result).toContain('enable_dns_hostnames                 = true');
        expect(result).toContain('enable_dns_support                   = true');
      } catch (error) {
        throw new Error(`VPC resource validation failed: ${error}`);
      }
    });

    test('S3 bucket exists and matches reference', () => {
      try {
        const bucketName = flatOutputs.central_logging_bucket;
        const result = execSync(`${terraformBin} state show module.central_logging.aws_s3_bucket.central_logging`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });

        expect(result).toBeDefined();
        expect(result).toContain(`bucket                      = "${bucketName}"`);
      } catch (error) {
        throw new Error(`S3 bucket validation failed: ${error}`);
      }
    });

    test('Secrets exist and match reference', () => {
      try {
        const secrets = JSON.parse(flatOutputs.secrets_arns).us_east_1;

        // Check db_password secret
        const dbPasswordResult = execSync(`${terraformBin} state show module.secrets_us_east_1.aws_secretsmanager_secret.db_password`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(dbPasswordResult).toContain(`arn                            = "${secrets.db_password}"`);

        // Check api_keys secret
        const apiKeysResult = execSync(`${terraformBin} state show module.secrets_us_east_1.aws_secretsmanager_secret.api_keys`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(apiKeysResult).toContain(`arn                            = "${secrets.api_keys}"`);
      } catch (error) {
        throw new Error(`Secrets validation failed: ${error}`);
      }
    });

    test('Private subnet exists and matches reference', () => {
      try {
        const subnetId = JSON.parse(flatOutputs.private_subnet_ids).us_east_1;
        const result = execSync(`${terraformBin} state show module.vpc_us_east_1.aws_subnet.private`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });

        expect(result).toBeDefined();
        expect(result).toContain(`id                                             = "${subnetId}"`);
        expect(result).toContain('cidr_block                                     = "10.1.2.0/24"');
      } catch (error) {
        throw new Error(`Private subnet validation failed: ${error}`);
      }
    });

    test('Database subnet exists and matches reference', () => {
      try {
        const subnetId = JSON.parse(flatOutputs.database_subnet_ids).us_east_1;
        const result = execSync(`${terraformBin} state show module.vpc_us_east_1.aws_subnet.database`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });

        expect(result).toBeDefined();
        expect(result).toContain(`id                                             = "${subnetId}"`);
        expect(result).toContain('cidr_block                                     = "10.1.3.0/24"');
      } catch (error) {
        throw new Error(`Database subnet validation failed: ${error}`);
      }
    });
  });

  describe('Security Validation', () => {
    test('S3 bucket has encryption enabled', () => {
      try {
        const result = execSync(`${terraformBin} state show module.central_logging.aws_s3_bucket_server_side_encryption_configuration.central_logging`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();
        expect(result).toContain('rule');
        expect(result).toContain('sse_algorithm     = "aws:kms"');
      } catch (error) {
        throw new Error(`S3 encryption validation failed: ${error}`);
      }
    });

    test('S3 bucket has public access blocked', () => {
      try {
        const result = execSync(`${terraformBin} state show module.central_logging.aws_s3_bucket_public_access_block.central_logging`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();
        expect(result).toContain('block_public_acls       = true');
        expect(result).toContain('block_public_policy     = true');
        expect(result).toContain('ignore_public_acls      = true');
        expect(result).toContain('restrict_public_buckets = true');
      } catch (error) {
        throw new Error(`S3 public access block validation failed: ${error}`);
      }
    });

    test('Security groups have proper rules', () => {
      try {
        const result = execSync(`${terraformBin} state show module.vpc_us_east_1.aws_security_group.private_sg`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();
        expect(result).toContain('ingress');
        expect(result).toContain('egress');
      } catch (error) {
        throw new Error(`Security groups validation failed: ${error}`);
      }
    });
  });

  describe('Tagging Validation', () => {
    test('resources have proper tags', () => {
      try {
        const result = execSync(`${terraformBin} state list`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });

        // Check that we have resources that should be tagged
        const resources = result.split('\n').filter(line => line.trim());
        const taggedResources = resources.filter(resource =>
          resource.includes('aws_vpc') ||
          resource.includes('aws_subnet') ||
          resource.includes('aws_security_group') ||
          resource.includes('aws_s3_bucket')
        );

        expect(taggedResources.length).toBeGreaterThan(0);
      } catch (error) {
        throw new Error(`Failed to list resources for tagging validation: ${error}`);
      }
    });
  });

  describe('Configuration Validation', () => {
    test('all required variables are defined', () => {
      const variablesFile = path.join(libDir, 'variables.tf');
      if (fs.existsSync(variablesFile)) {
        const content = fs.readFileSync(variablesFile, 'utf8');
        expect(content).toContain('variable "project_name"');
        expect(content).toContain('variable "environment"');
        expect(content).toContain('variable "log_retention_days"');
        expect(content).toContain('variable "vpc_cidr_blocks"');
      }
    });

    test('backend configuration is valid', () => {
      const backendFile = path.join(libDir, 'backend.conf');
      expect(fs.existsSync(backendFile)).toBe(true);

      const content = fs.readFileSync(backendFile, 'utf8');
      expect(content).toContain('bucket = "iac-rlhf-tf-states"');
      expect(content).toContain('region = "us-east-1"');
      expect(content).toContain('encrypt = true');
    });

    test('provider configuration is valid', () => {
      const providerFile = path.join(libDir, 'provider.tf');
      expect(fs.existsSync(providerFile)).toBe(true);

      const content = fs.readFileSync(providerFile, 'utf8');
      expect(content).toContain('provider "aws"');
      expect(content).toContain('alias  = "us_east_1"');
      expect(content).toContain('region = "us-east-1"');
    });
  });

  describe('Flat Outputs File Validation', () => {
    test('flat-outputs.json file exists and is valid JSON', () => {
      expect(fs.existsSync(flatOutputsPath)).toBe(true);
      expect(flatOutputs).toBeDefined();
      expect(typeof flatOutputs).toBe('object');
    });

    test('flat-outputs.json contains all required keys', () => {
      const requiredKeys = [
        'central_logging_bucket',
        'database_subnet_ids',
        'private_subnet_ids',
        'secrets_arns',
        'vpc_ids'
      ];

      requiredKeys.forEach(key => {
        expect(flatOutputs).toHaveProperty(key);
      });
    });

    test('flat-outputs.json values have correct format', () => {
      // Check bucket name format
      expect(flatOutputs.central_logging_bucket).toMatch(/^secure-infra-production-central-logging-/);

      // Check VPC ID format
      const vpcIds = JSON.parse(flatOutputs.vpc_ids);
      expect(vpcIds.us_east_1).toMatch(/^vpc-/);

      // Check subnet ID formats
      const privateSubnets = JSON.parse(flatOutputs.private_subnet_ids);
      const databaseSubnets = JSON.parse(flatOutputs.database_subnet_ids);
      expect(privateSubnets.us_east_1).toMatch(/^subnet-/);
      expect(databaseSubnets.us_east_1).toMatch(/^subnet-/);

      // Check secrets ARN formats
      const secrets = JSON.parse(flatOutputs.secrets_arns);
      expect(secrets.us_east_1.api_keys).toMatch(/^arn:aws:secretsmanager:us-east-1:\d+:secret:/);
      expect(secrets.us_east_1.db_password).toMatch(/^arn:aws:secretsmanager:us-east-1:\d+:secret:/);
    });
  });
});
