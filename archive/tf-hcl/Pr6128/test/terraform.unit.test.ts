import fs from 'fs';
import path from 'path';

describe('Payment Processing Infrastructure - Terraform Unit Tests', () => {
  let tapstackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;

  beforeAll(() => {
    const libPath = path.join(__dirname, '..', 'lib');
    tapstackContent = fs.readFileSync(path.join(libPath, 'tapstack.tf'), 'utf8');
    variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
  });

  // -------------------------
  // Provider Configuration
  // -------------------------
  describe('Provider Configuration (provider.tf)', () => {
    test('AWS provider is configured', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('Terraform required version is specified', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('Backend configuration exists (local or S3)', () => {
      expect(providerContent).toMatch(/backend\s+"(local|s3)"\s*{/);
    });
  });

  // -------------------------
  // Variables (variables.tf)
  // -------------------------
  describe('Variables Definition (variables.tf)', () => {
    const requiredVariables = [
      'environment',
      'aws_region',
      'vpc_cidr',
      'availability_zones',
      'private_subnet_cidrs',
      'public_subnet_cidrs',
      'enable_nat_gateway',
      'single_nat_gateway',
      'rds_instance_class',
      'db_name',
      'db_username',
      'rds_allocated_storage',
      'rds_backup_retention',
      'rds_multi_az',
      'ecs_task_count',
      'ecs_task_cpu',
      'ecs_task_memory',
      'certificate_arn',
      's3_transition_days',
      's3_glacier_days',
      's3_expiration_days',
      'health_check_bucket'
    ];

    requiredVariables.forEach(varName => {
      test(`Variable "${varName}" is defined`, () => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test('Variables have type definitions', () => {
      const typeMatches = variablesContent.match(/type\s*=\s*(string|number|bool|list\(string\))/g);
      expect(typeMatches).not.toBeNull();
      expect(typeMatches!.length).toBeGreaterThanOrEqual(20);
    });

    test('Variables have descriptions', () => {
      const descMatches = variablesContent.match(/description\s*=\s*"/g);
      expect(descMatches).not.toBeNull();
      expect(descMatches!.length).toBeGreaterThanOrEqual(20);
    });
  });

  // -------------------------
  // Resources (tapstack.tf)
  // -------------------------
  describe('Resources Definition (tapstack.tf)', () => {
    test('tapstack.tf does NOT declare provider (provider.tf owns providers)', () => {
      expect(tapstackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('Local variable current_env is defined', () => {
      expect(tapstackContent).toMatch(/locals\s*{[\s\S]*?current_env\s*=/);
    });

    test('Local variable current_env maps default to dev', () => {
      expect(tapstackContent).toMatch(/current_env\s*=\s*terraform\.workspace\s*==\s*"default"\s*\?\s*"dev"\s*:\s*terraform\.workspace/);
    });

    test('Local variable health_check_bucket is defined', () => {
      expect(tapstackContent).toMatch(/health_check_bucket\s*=/);
    });

    test('Local variable health_check_script_key is defined', () => {
      expect(tapstackContent).toMatch(/health_check_script_key\s*=/);
    });

    describe('Data Sources', () => {
      test('AWS caller identity data source is defined', () => {
        expect(tapstackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
      });
    });

    describe('Module Blocks', () => {
      test('Core module is defined', () => {
        expect(tapstackContent).toMatch(/module\s+"core"\s*{/);
      });

      test('Core module source path is correct', () => {
        expect(tapstackContent).toMatch(/source\s*=\s*"\.\/modules\/core"/);
      });

      test('RDS module is defined', () => {
        expect(tapstackContent).toMatch(/module\s+"rds"\s*{/);
      });

      test('RDS module source path is correct', () => {
        expect(tapstackContent).toMatch(/source\s*=\s*"\.\/modules\/rds"/);
      });

      test('ECS module is defined', () => {
        expect(tapstackContent).toMatch(/module\s+"ecs"\s*{/);
      });

      test('ECS module source path is correct', () => {
        expect(tapstackContent).toMatch(/source\s*=\s*"\.\/modules\/ecs"/);
      });
    });

    describe('S3 Resources', () => {
      test('Transaction logs S3 bucket is defined', () => {
        expect(tapstackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"transaction_logs"\s*{/);
      });

      test('S3 bucket has workspace-specific naming', () => {
        expect(tapstackContent).toMatch(/bucket\s*=\s*"payment-logs-\$\{local\.current_env\}/);
      });

      test('S3 versioning is enabled', () => {
        expect(tapstackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"transaction_logs"\s*{/);
        expect(tapstackContent).toMatch(/status\s*=\s*"Enabled"/);
      });

      test('S3 lifecycle configuration is defined', () => {
        expect(tapstackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"transaction_logs"\s*{/);
      });

      test('S3 lifecycle transitions to STANDARD_IA', () => {
        expect(tapstackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      });

      test('S3 lifecycle transitions to GLACIER', () => {
        expect(tapstackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
      });

      test('S3 server-side encryption is configured', () => {
        expect(tapstackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"transaction_logs"\s*{/);
        expect(tapstackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      });

      test('S3 bucket has public access block configured', () => {
        expect(tapstackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"transaction_logs"\s*{/);
        expect(tapstackContent).toMatch(/block_public_acls\s*=\s*true/);
        expect(tapstackContent).toMatch(/block_public_policy\s*=\s*true/);
        expect(tapstackContent).toMatch(/ignore_public_acls\s*=\s*true/);
        expect(tapstackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
      });
    });

    describe('Module Inputs', () => {
      test('Core module receives environment parameter', () => {
        expect(tapstackContent).toMatch(/environment\s*=\s*local\.current_env/);
      });

      test('RDS module receives VPC ID from core module', () => {
        expect(tapstackContent).toMatch(/vpc_id\s*=\s*module\.core\.vpc_id/);
      });

      test('RDS module receives private subnet IDs from core module', () => {
        expect(tapstackContent).toMatch(/private_subnet_ids\s*=\s*module\.core\.private_subnet_ids/);
      });

      test('ECS module receives security group from RDS', () => {
        expect(tapstackContent).toMatch(/ecs_security_group_id\s*=\s*module\.ecs\.ecs_security_group_id/);
      });

      test('ECS module uses Docker Hub python image', () => {
        expect(tapstackContent).toMatch(/container_image\s*=\s*"python:3\.11-slim"/);
      });

      test('ECS module receives database URL from RDS', () => {
        expect(tapstackContent).toMatch(/database_url\s*=\s*module\.rds\.db_connection_string/);
      });

      test('ECS module receives health check bucket configuration', () => {
        expect(tapstackContent).toMatch(/health_check_bucket\s*=\s*local\.health_check_bucket/);
      });

      test('ECS module receives transaction logs bucket', () => {
        expect(tapstackContent).toMatch(/transaction_logs_bucket\s*=\s*aws_s3_bucket\.transaction_logs\.id/);
      });
    });

    describe('Tagging', () => {
      test('Resources have Environment tags with local.current_env', () => {
        const envTagMatches = tapstackContent.match(/Environment\s*=\s*local\.current_env/g);
        expect(envTagMatches).not.toBeNull();
        expect(envTagMatches!.length).toBeGreaterThanOrEqual(1);
      });

      test('Resources have Name tags', () => {
        const nameTagMatches = tapstackContent.match(/Name\s*=\s*"/g);
        expect(nameTagMatches).not.toBeNull();
        expect(nameTagMatches!.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // -------------------------
  // Outputs (outputs.tf)
  // -------------------------
  describe('Outputs Definition (outputs.tf)', () => {
    const requiredOutputs = [
      'alb_dns_name',
      'rds_endpoint',
      'vpc_id',
      'transaction_logs_bucket',
      'ecs_cluster_name'
    ];

    requiredOutputs.forEach(outputName => {
      test(`Output "${outputName}" is defined`, () => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${outputName}"\\s*{`));
      });
    });

    test('Outputs have descriptions', () => {
      const descMatches = outputsContent.match(/description\s*=\s*"/g);
      expect(descMatches).not.toBeNull();
      expect(descMatches!.length).toBe(5);
    });

    test('RDS endpoint output is marked as sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('ALB DNS output references ECS module', () => {
      expect(outputsContent).toMatch(/value\s*=\s*module\.ecs\.alb_dns_name/);
    });

    test('VPC ID output references core module', () => {
      expect(outputsContent).toMatch(/value\s*=\s*module\.core\.vpc_id/);
    });

    test('RDS endpoint output references RDS module', () => {
      expect(outputsContent).toMatch(/value\s*=\s*module\.rds\.db_endpoint/);
    });

    test('Transaction logs bucket output references S3 resource', () => {
      expect(outputsContent).toMatch(/value\s*=\s*aws_s3_bucket\.transaction_logs\.id/);
    });

    test('ECS cluster name output references ECS module', () => {
      expect(outputsContent).toMatch(/value\s*=\s*module\.ecs\.cluster_name/);
    });
  });

  // -------------------------
  // Module Structure
  // -------------------------
  describe('Module Directory Structure', () => {
    const modulesPath = path.join(__dirname, '..', 'lib', 'modules');

    test('Core module directory exists', () => {
      expect(fs.existsSync(path.join(modulesPath, 'core'))).toBe(true);
    });

    test('RDS module directory exists', () => {
      expect(fs.existsSync(path.join(modulesPath, 'rds'))).toBe(true);
    });

    test('ECS module directory exists', () => {
      expect(fs.existsSync(path.join(modulesPath, 'ecs'))).toBe(true);
    });

    test('Core module has main.tf', () => {
      expect(fs.existsSync(path.join(modulesPath, 'core', 'main.tf'))).toBe(true);
    });

    test('RDS module has main.tf', () => {
      expect(fs.existsSync(path.join(modulesPath, 'rds', 'main.tf'))).toBe(true);
    });

    test('ECS module has main.tf', () => {
      expect(fs.existsSync(path.join(modulesPath, 'ecs', 'main.tf'))).toBe(true);
    });
  });

  // -------------------------
  // Environment Configuration
  // -------------------------
  describe('Environment Variable Files', () => {
    const libPath = path.join(__dirname, '..', 'lib');

    test('dev.tfvars exists', () => {
      expect(fs.existsSync(path.join(libPath, 'dev.tfvars'))).toBe(true);
    });

    test('staging.tfvars exists', () => {
      expect(fs.existsSync(path.join(libPath, 'staging.tfvars'))).toBe(true);
    });

    test('prod.tfvars exists', () => {
      expect(fs.existsSync(path.join(libPath, 'prod.tfvars'))).toBe(true);
    });
  });

  // -------------------------
  // Security & Best Practices
  // -------------------------
  describe('Security and Best Practices', () => {
    test('No hardcoded credentials in tapstack.tf', () => {
      expect(tapstackContent).not.toMatch(/password\s*=\s*"[^$]/i);
      expect(tapstackContent).not.toMatch(/secret_key\s*=\s*"[^$]/i);
    });

    test('No hardcoded credentials in variables.tf', () => {
      expect(variablesContent).not.toMatch(/default\s*=\s*"(?:password|secret|key):/i);
    });

    test('Encryption is enabled for S3', () => {
      expect(tapstackContent).toMatch(/sse_algorithm/);
    });

    test('RDS backup retention is configurable', () => {
      expect(variablesContent).toMatch(/variable\s+"rds_backup_retention"/);
    });

    test('Multi-AZ is configurable for RDS', () => {
      expect(variablesContent).toMatch(/variable\s+"rds_multi_az"/);
    });
  });
});
