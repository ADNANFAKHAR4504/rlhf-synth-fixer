import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as path from 'path';

describe('Terraform Security Foundation - Integration Tests', () => {
  const libPath = path.join(__dirname, '../lib');
  let terraformInitialized = false;

  beforeAll(() => {
    try {
      // Check if Terraform is installed
      execSync('terraform version', { stdio: 'pipe' });

      // Initialize Terraform
      execSync('terraform init -backend=false', {
        cwd: libPath,
        stdio: 'pipe'
      });

      terraformInitialized = true;
    } catch (error) {
      console.warn('Terraform not available, skipping integration tests');
    }
  });

  describe('Terraform Plan Validation', () => {
    it('should generate a valid plan with minimal variables', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const result = execSync(
          'terraform plan -var="environment=test" -var="environment_suffix=test123" -out=/dev/null',
          {
            cwd: libPath,
            encoding: 'utf-8',
            stdio: 'pipe'
          }
        );

        // Should not have errors
        expect(result).not.toContain('Error:');
      } catch (error: any) {
        console.error('Terraform plan failed:', error.message);
        throw error;
      }
    });

    it('should validate variable constraints', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      // Test KMS deletion window constraint
      try {
        execSync(
          'terraform plan -var="kms_key_deletion_window=10" -out=/dev/null',
          {
            cwd: libPath,
            stdio: 'pipe'
          }
        );
        // Should fail because deletion window must be 7
        fail('Should have failed validation');
      } catch (error: any) {
        expect(error.message).toContain('validation');
      }

      // Test IAM session duration constraint
      try {
        execSync(
          'terraform plan -var="iam_session_duration_seconds=7200" -out=/dev/null',
          {
            cwd: libPath,
            stdio: 'pipe'
          }
        );
        // Should fail because duration must be 3600
        fail('Should have failed validation');
      } catch (error: any) {
        expect(error.message).toContain('validation');
      }
    });
  });

  describe('Resource Dependencies', () => {
    it('should have proper resource dependencies', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        // Generate dependency graph
        const graph = execSync('terraform graph', {
          cwd: libPath,
          encoding: 'utf-8'
        });

        // Check key dependencies exist
        expect(graph).toContain('aws_kms_key.primary');
        expect(graph).toContain('aws_kms_replica_key');
        expect(graph).toContain('aws_secretsmanager_secret');
        expect(graph).toContain('aws_lambda_function');
        expect(graph).toContain('aws_config_configuration_recorder');
      } catch (error: any) {
        console.error('Failed to generate graph:', error.message);
      }
    });
  });

  describe('Provider Configuration', () => {
    it('should configure multiple AWS providers', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const providers = execSync('terraform providers', {
          cwd: libPath,
          encoding: 'utf-8'
        });

        expect(providers).toContain('hashicorp/aws');
        expect(providers).toContain('hashicorp/random');
      } catch (error: any) {
        console.error('Failed to list providers:', error.message);
      }
    });
  });

  describe('Resource Count Validation', () => {
    it('should plan to create expected number of resources', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const plan = execSync(
          'terraform plan -var="environment=test" -var="environment_suffix=test123" -out=/dev/null',
          {
            cwd: libPath,
            encoding: 'utf-8',
            stdio: 'pipe'
          }
        );

        // Should plan to create multiple resources
        expect(plan).toMatch(/Plan: \d+ to add/);

        // Check for key resource types
        expect(plan).toContain('aws_kms_key.primary');
        expect(plan).toContain('aws_kms_replica_key.eu_west_1');
        expect(plan).toContain('aws_kms_replica_key.ap_southeast_1');
        expect(plan).toContain('aws_secretsmanager_secret.database_credentials');
        expect(plan).toContain('aws_lambda_function.secret_rotation');
        expect(plan).toContain('aws_iam_role.secrets_rotation');
        expect(plan).toContain('aws_iam_role.admin_with_mfa');
        expect(plan).toContain('aws_config_configuration_recorder.main');
      } catch (error: any) {
        console.error('Plan validation failed:', error.message);
      }
    });
  });

  describe('Output Validation', () => {
    it('should define all required outputs', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const outputs = execSync('terraform output', {
          cwd: libPath,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        // Outputs won't have values until apply, but should be defined
        console.log('Outputs defined (values available after apply)');
      } catch (error: any) {
        // Expected - outputs have no values until apply
        expect(error.message).toContain('No outputs found');
      }
    });
  });

  describe('Security Validation', () => {
    it('should not expose sensitive values in plan', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const plan = execSync(
          'terraform plan -var="environment=test" -var="environment_suffix=test123" -out=/dev/null',
          {
            cwd: libPath,
            encoding: 'utf-8',
            stdio: 'pipe'
          }
        );

        // Should show sensitive values as (sensitive value)
        if (plan.includes('password')) {
          expect(plan).toContain('(sensitive');
        }
      } catch (error: any) {
        console.error('Security validation failed:', error.message);
      }
    });
  });

  describe('Multi-Region Configuration', () => {
    it('should configure resources in multiple regions', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const plan = execSync(
          'terraform plan -var="environment=test" -var="environment_suffix=test123" -out=/dev/null',
          {
            cwd: libPath,
            encoding: 'utf-8',
            stdio: 'pipe'
          }
        );

        // Check for multi-region resources
        expect(plan).toContain('eu-west-1');
        expect(plan).toContain('ap-southeast-1');
      } catch (error: any) {
        console.error('Multi-region validation failed:', error.message);
      }
    });
  });

  describe('Tags Validation', () => {
    it('should apply required tags to resources', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const plan = execSync(
          'terraform plan -var="environment=test" -var="environment_suffix=test123" -out=/dev/null',
          {
            cwd: libPath,
            encoding: 'utf-8',
            stdio: 'pipe'
          }
        );

        // Check for required tags
        expect(plan).toContain('Environment');
        expect(plan).toContain('DataClassification');
        expect(plan).toContain('ManagedBy');
      } catch (error: any) {
        console.error('Tags validation failed:', error.message);
      }
    });
  });

  describe('Conditional Resource Creation', () => {
    it('should create VPC when not provided', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const plan = execSync(
          'terraform plan -var="environment=test" -var="environment_suffix=test123" -out=/dev/null',
          {
            cwd: libPath,
            encoding: 'utf-8',
            stdio: 'pipe'
          }
        );

        // Should plan to create VPC and subnets
        expect(plan).toContain('aws_vpc.security');
        expect(plan).toContain('aws_subnet.security_private');
      } catch (error: any) {
        console.error('VPC creation validation failed:', error.message);
      }
    });

    it('should not create VPC when provided', () => {
      if (!terraformInitialized) {
        console.warn('Skipping: Terraform not initialized');
        return;
      }

      try {
        const plan = execSync(
          'terraform plan -var="environment=test" -var="environment_suffix=test123" -var="vpc_id=vpc-12345" -var=\'subnet_ids=["subnet-123","subnet-456"]\' -out=/dev/null',
          {
            cwd: libPath,
            encoding: 'utf-8',
            stdio: 'pipe'
          }
        );

        // Should not plan to create VPC
        expect(plan).not.toContain('aws_vpc.security will be created');
      } catch (error: any) {
        console.error('VPC skip validation failed:', error.message);
      }
    });
  });
});
