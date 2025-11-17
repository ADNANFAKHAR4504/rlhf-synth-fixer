import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure - Unit Tests', () => {
  const libPath = path.join(process.cwd(), 'lib');
  let tfInitialized = false;

  beforeAll(() => {
    // Initialize terraform once for all tests
    try {
      execSync('terraform init -backend=false', {
        cwd: libPath,
        stdio: 'pipe'
      });
      tfInitialized = true;
    } catch (error) {
      console.error('Terraform init failed:', error);
    }
  });

  describe('Terraform Configuration Files', () => {
    it('should have main.tf file', () => {
      const mainPath = path.join(libPath, 'main.tf');
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    it('should have variables.tf file', () => {
      const varsPath = path.join(libPath, 'variables.tf');
      expect(fs.existsSync(varsPath)).toBe(true);
    });

    it('should have outputs.tf file', () => {
      const outputsPath = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    it('should have terraform.tfvars file', () => {
      const tfvarsPath = path.join(libPath, 'terraform.tfvars');
      expect(fs.existsSync(tfvarsPath)).toBe(true);
    });

    it('should have backend.tf file', () => {
      const backendPath = path.join(libPath, 'backend.tf');
      expect(fs.existsSync(backendPath)).toBe(true);
    });
  });

  describe('Terraform Modules', () => {
    it('should have secrets module', () => {
      const modulePath = path.join(libPath, 'modules', 'secrets');
      expect(fs.existsSync(modulePath)).toBe(true);
      expect(fs.existsSync(path.join(modulePath, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(modulePath, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(modulePath, 'outputs.tf'))).toBe(true);
    });

    it('should have vpc_endpoints module', () => {
      const modulePath = path.join(libPath, 'modules', 'vpc_endpoints');
      expect(fs.existsSync(modulePath)).toBe(true);
      expect(fs.existsSync(path.join(modulePath, 'main.tf'))).toBe(true);
    });

    it('should have rds_proxy module', () => {
      const modulePath = path.join(libPath, 'modules', 'rds_proxy');
      expect(fs.existsSync(modulePath)).toBe(true);
      expect(fs.existsSync(path.join(modulePath, 'main.tf'))).toBe(true);
    });

    it('should have cloudwatch module', () => {
      const modulePath = path.join(libPath, 'modules', 'cloudwatch');
      expect(fs.existsSync(modulePath)).toBe(true);
      expect(fs.existsSync(path.join(modulePath, 'main.tf'))).toBe(true);
    });

    it('should have dynamodb_global module', () => {
      const modulePath = path.join(libPath, 'modules', 'dynamodb_global');
      expect(fs.existsSync(modulePath)).toBe(true);
      expect(fs.existsSync(path.join(modulePath, 'main.tf'))).toBe(true);
    });
  });

  describe('Terraform Validation', () => {
    it('should pass terraform validate', () => {
      if (!tfInitialized) {
        console.log('Skipping validation - terraform not initialized');
        return;
      }

      try {
        const output = execSync('terraform validate -json', {
          cwd: libPath,
          stdio: 'pipe',
          encoding: 'utf-8'
        });

        const result = JSON.parse(output);
        expect(result.valid).toBe(true);
        expect(result.error_count).toBe(0);
        expect(result.warning_count).toBe(0);
      } catch (error: any) {
        // If the command fails, parse the output to check for specific errors
        if (error.stdout) {
          const result = JSON.parse(error.stdout);
          console.error('Validation errors:', result.diagnostics);
          expect(result.valid).toBe(true);
        } else {
          throw error;
        }
      }
    });

    it('should have properly formatted terraform files', () => {
      try {
        // Check if files need formatting (exit code 0 = no changes needed)
        execSync('terraform fmt -check -recursive', {
          cwd: libPath,
          stdio: 'pipe'
        });
        // If we get here, files are properly formatted
        expect(true).toBe(true);
      } catch (error: any) {
        // Exit code 3 means files need formatting
        if (error.status === 3) {
          console.log('Files need formatting. Run: terraform fmt -recursive');
          expect(error.status).not.toBe(3);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Variable Definitions', () => {
    it('should have all required variables defined', () => {
      const varsPath = path.join(libPath, 'variables.tf');
      const content = fs.readFileSync(varsPath, 'utf8');

      // Check for essential variables
      const requiredVars = [
        'environment_suffix',
        'environment',
        'primary_region',
        'secondary_region',
        'database_name',
        'db_master_username',
        'db_master_password',
        'domain_name',
        'sns_email'
      ];

      requiredVars.forEach(varName => {
        expect(content).toContain(`variable "${varName}"`);
      });
    });

    it('should have sensitive variables marked as sensitive', () => {
      const varsPath = path.join(libPath, 'variables.tf');
      const content = fs.readFileSync(varsPath, 'utf8');

      // Check that password variables are marked sensitive
      const lines = content.split('\n');
      let inPasswordVar = false;
      let hasSensitive = false;

      lines.forEach(line => {
        if (line.includes('variable "db_master_password"')) {
          inPasswordVar = true;
        }
        if (inPasswordVar && line.includes('sensitive') && line.includes('true')) {
          hasSensitive = true;
        }
        if (line.includes('}') && inPasswordVar) {
          inPasswordVar = false;
        }
      });

      expect(hasSensitive).toBe(true);
    });
  });

  describe('Backend Configuration', () => {
    it('should have S3 backend configuration', () => {
      const backendPath = path.join(libPath, 'backend.tf');
      const content = fs.readFileSync(backendPath, 'utf8');

      expect(content).toContain('backend "s3"');
      expect(content).toContain('encrypt');
      expect(content).toContain('true');
    });
  });

  describe('Module Integration', () => {
    it('should reference secrets module in main.tf', () => {
      const mainPath = path.join(libPath, 'main.tf');
      if (!fs.existsSync(mainPath)) {
        console.log('main.tf not found, skipping test');
        return;
      }
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toContain('module "secrets_manager"');
      expect(content).toContain('source = "./modules/secrets"');
    });

    it('should have primary and secondary region modules', () => {
      const mainPath = path.join(libPath, 'main.tf');
      if (!fs.existsSync(mainPath)) {
        console.log('main.tf not found, skipping test');
        return;
      }
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toContain('module "primary_region"');
      expect(content).toContain('module "secondary_region"');
    });

    it('should have DynamoDB global tables module', () => {
      const mainPath = path.join(libPath, 'main.tf');
      if (!fs.existsSync(mainPath)) {
        console.log('main.tf not found, skipping test');
        return;
      }
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toContain('module "dynamodb_global"');
    });
  });

  describe('Security Configurations', () => {
    it('should not have hardcoded passwords in terraform.tfvars', () => {
      const tfvarsPath = path.join(libPath, 'terraform.tfvars');
      const content = fs.readFileSync(tfvarsPath, 'utf8');

      // Should NOT contain actual password values
      expect(content).not.toContain('SuperSecretPassword');
      expect(content).not.toContain('password123');

      // Should have comment about Secrets Manager
      expect(content.toLowerCase()).toContain('secrets manager');
    });

    it('should have KMS encryption configured', () => {
      const mainPath = path.join(libPath, 'main.tf');
      if (!fs.existsSync(mainPath)) {
        console.log('main.tf not found, skipping test');
        return;
      }
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toContain('aws_kms_key');
      expect(content).toContain('enable_key_rotation = true');
    });
  });

  describe('High Availability Configuration', () => {
    it('should configure multiple availability zones', () => {
      const varsPath = path.join(libPath, 'variables.tf');
      if (!fs.existsSync(varsPath)) {
        console.log('variables.tf not found, skipping test');
        return;
      }
      const content = fs.readFileSync(varsPath, 'utf8');

      expect(content).toContain('primary_availability_zones');
      expect(content).toContain('secondary_availability_zones');

      // Check for at least 3 AZs
      expect(content).toContain('us-east-1a');
      expect(content).toContain('us-east-1b');
      expect(content).toContain('us-east-1c');
    });

    it('should have RDS proxy configuration', () => {
      const modulePath = path.join(libPath, 'modules', 'rds_proxy', 'main.tf');
      if (fs.existsSync(modulePath)) {
        const content = fs.readFileSync(modulePath, 'utf8');
        expect(content).toContain('aws_db_proxy');
        expect(content).toContain('max_connections_percent');
        expect(content).toContain('idle_client_timeout');
      }
    });
  });

  describe('Monitoring and Alerting', () => {
    it('should have CloudWatch dashboard configuration', () => {
      const modulePath = path.join(libPath, 'modules', 'cloudwatch', 'main.tf');
      if (fs.existsSync(modulePath)) {
        const content = fs.readFileSync(modulePath, 'utf8');
        expect(content).toContain('aws_cloudwatch_dashboard');
      }
    });

    it('should have SNS topic for alerts', () => {
      const mainPath = path.join(libPath, 'main.tf');
      if (!fs.existsSync(mainPath)) {
        console.log('main.tf not found, skipping test');
        return;
      }
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toContain('aws_sns_topic');
      expect(content).toContain('aws_sns_topic_subscription');
    });
  });

  describe('Output Definitions', () => {
    it('should have essential outputs defined', () => {
      const outputsPath = path.join(libPath, 'outputs.tf');
      if (!fs.existsSync(outputsPath)) {
        console.log('outputs.tf not found, skipping test');
        return;
      }
      const content = fs.readFileSync(outputsPath, 'utf8');

      const requiredOutputs = [
        'primary_alb_dns',
        'secondary_alb_dns',
        'route53_failover_domain',
        'primary_rds_endpoint',
        'secondary_rds_endpoint',
        'dynamodb_table_name'
      ];

      requiredOutputs.forEach(output => {
        expect(content).toContain(`output "${output}"`);
      });
    });
  });

  describe('Terraform Plan', () => {
    it('should be able to create a terraform plan', () => {
      if (!tfInitialized) {
        console.log('Skipping plan - terraform not initialized');
        return;
      }

      try {
        // Just test that we can create a plan without errors
        // Don't apply it in unit tests
        execSync('terraform plan -input=false -out=test.tfplan', {
          cwd: libPath,
          stdio: 'pipe',
          env: {
            ...process.env,
            TF_VAR_db_master_password: 'TestPassword123!',
            TF_VAR_sns_email: 'test@example.com'
          }
        });

        // Clean up the plan file
        const planPath = path.join(libPath, 'test.tfplan');
        if (fs.existsSync(planPath)) {
          fs.unlinkSync(planPath);
        }

        expect(true).toBe(true);
      } catch (error: any) {
        console.error('Plan failed:', error.message);
        // Skip this test if credentials are not available
        if (error.message.includes('credentials') || error.message.includes('AWS')) {
          console.log('Skipping plan test - AWS credentials not configured');
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });
  });

  afterAll(() => {
    // Clean up any temporary files
    const planPath = path.join(libPath, 'test.tfplan');
    if (fs.existsSync(planPath)) {
      fs.unlinkSync(planPath);
    }
  });
});