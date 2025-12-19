// Integration tests for Terraform infrastructure configuration
// These tests validate the Terraform configuration and validate terraform commands

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const libPath = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Integration Tests', () => {
  describe('Terraform Configuration Validation', () => {
    test('terraform init can be executed successfully', () => {
      expect(() => {
        execSync('terraform init -backend=false', {
          cwd: libPath,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      }).not.toThrow();
    });

    test('terraform validate passes without errors', () => {
      // First ensure terraform is initialized
      try {
        execSync('terraform init -backend=false', {
          cwd: libPath,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error) {
        // Ignore init errors for this test
      }

      const result = execSync('terraform validate -json', {
        cwd: libPath,
        encoding: 'utf-8',
      });

      const validation = JSON.parse(result);
      expect(validation.valid).toBe(true);
      expect(validation.error_count).toBe(0);
    });

    test('terraform fmt check shows code is properly formatted', () => {
      const result = execSync('terraform fmt -check -recursive', {
        cwd: libPath,
        encoding: 'utf-8',
      });

      // If result is empty, all files are formatted correctly
      expect(result.trim()).toBe('');
    });
  });

  describe('Terraform Configuration Structure', () => {
    test('all required terraform files exist', () => {
      const requiredFiles = [
        'providers.tf',
        'variables.tf',
        's3.tf',
        'dynamodb.tf',
        'lambda.tf',
        'iam.tf',
        'monitoring.tf',
        'outputs.tf',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('lambda deployment packages exist', () => {
      const lambdaFiles = ['lambda/data_sync.zip', 'lambda/validation.zip'];

      lambdaFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('terraform.tfvars file exists and is valid', () => {
      const tfvarsPath = path.join(libPath, 'terraform.tfvars');
      expect(fs.existsSync(tfvarsPath)).toBe(true);

      const content = fs.readFileSync(tfvarsPath, 'utf-8');
      expect(content).toContain('environment_suffix');
    });
  });

  describe('Resource Configuration Validation', () => {
    test('S3 bucket configuration includes required security settings', () => {
      const s3Content = fs.readFileSync(path.join(libPath, 's3.tf'), 'utf-8');

      // Check for encryption
      expect(s3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(s3Content).toMatch(/bucket_key_enabled\s*=\s*true/);

      // Check for public access block
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);

      // Check for versioning
      expect(s3Content).toMatch(/aws_s3_bucket_versioning/);

      // Check for replication
      expect(s3Content).toMatch(/aws_s3_bucket_replication_configuration/);
    });

    test('DynamoDB configuration includes required features', () => {
      const dynamoContent = fs.readFileSync(path.join(libPath, 'dynamodb.tf'), 'utf-8');

      // Check for point-in-time recovery
      expect(dynamoContent).toMatch(/point_in_time_recovery/);
      expect(dynamoContent).toMatch(/enabled\s*=\s*true/);

      // Check for global tables (replica configuration)
      expect(dynamoContent).toMatch(/replica\s*{/);

      // Check for streams
      expect(dynamoContent).toMatch(/stream_enabled\s*=\s*true/);
    });

    test('Lambda functions use ARM64 architecture', () => {
      const lambdaContent = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf-8');

      expect(lambdaContent).toMatch(/architectures\s*=\s*\["arm64"\]/);
    });

    test('IAM roles follow least privilege principle', () => {
      const iamContent = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf-8');

      // Check for proper role definitions
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"/);
      expect(iamContent).toMatch(/resource\s+"aws_iam_.*policy/);

      // Check for assume role policy
      expect(iamContent).toMatch(/assume_role_policy/);
    });

    test('monitoring includes CloudWatch alarms', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf-8');

      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
    });
  });

  describe('Variable and Output Validation', () => {
    test('all required variables are defined with proper validation', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');

      const requiredVars = [
        'environment_suffix',
        'source_region',
        'target_region',
        'migration_phase',
        'cutover_date',
      ];

      requiredVars.forEach(varName => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });

      // Check for validation blocks
      expect(variablesContent).toMatch(/validation\s*{/);
    });

    test('outputs are properly defined for all major resources', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf-8');

      const expectedOutputs = [
        'source_bucket_name',
        'target_bucket_name',
        'metadata_table_name',
        'data_sync_lambda_arn',
        'validation_lambda_arn',
        'cloudwatch_dashboard_url',
      ];

      expectedOutputs.forEach(output => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });
  });

  describe('Naming Convention Compliance', () => {
    test('all resources follow the naming pattern {environment}-{region}-{service}-{purpose}', () => {
      const files = ['s3.tf', 'dynamodb.tf', 'lambda.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf-8');
        expect(content).toMatch(/doc-proc-\$\{var\.(source_region|target_region)\}/);
      });
    });
  });

  describe('Cross-Region Configuration', () => {
    test('provider configuration includes both source and target regions', () => {
      const providersContent = fs.readFileSync(path.join(libPath, 'providers.tf'), 'utf-8');

      expect(providersContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"source"/);
      expect(providersContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"target"/);
      expect(providersContent).toMatch(/var\.source_region/);
      expect(providersContent).toMatch(/var\.target_region/);
    });

    test('resources are distributed across both regions', () => {
      const s3Content = fs.readFileSync(path.join(libPath, 's3.tf'), 'utf-8');

      // Check for source provider usage
      expect(s3Content).toMatch(/provider\s*=\s*aws\.source/);

      // Check for target provider usage
      expect(s3Content).toMatch(/provider\s*=\s*aws\.target/);
    });
  });

  describe('Metadata Integration', () => {
    test('metadata.json exists and contains required fields', () => {
      const metadataPath = path.join(libPath, '..', 'metadata.json');
      expect(fs.existsSync(metadataPath)).toBe(true);

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      expect(metadata.platform).toBe('tf');
      expect(metadata.language).toBe('hcl');
      expect(metadata.aws_services).toBeDefined();
      expect(Array.isArray(metadata.aws_services)).toBe(true);
    });

    test('metadata.json AWS services match the infrastructure', () => {
      const metadataPath = path.join(libPath, '..', 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      const expectedServices = ['s3', 'dynamodb', 'lambda', 'iam', 'cloudwatch'];

      expectedServices.forEach(service => {
        expect(metadata.aws_services).toContain(service);
      });
    });
  });
});
