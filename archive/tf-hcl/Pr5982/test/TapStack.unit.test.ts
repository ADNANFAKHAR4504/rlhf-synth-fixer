/**
 * Unit Tests for Payment Processing System Migration Infrastructure (Terraform)
 *
 * These tests validate the Terraform configuration for correctness, security,
 * and compliance with QA requirements.
 */

import * as fs from 'fs';
import * as path from 'path';

const libDir = path.resolve(__dirname, '../lib');

describe('Terraform Configuration - Payment Processing Migration Infrastructure', () => {
  let tfConfig: Record<string, { content: string }> = {};
  let tfvars: Record<string, string> = {};

  beforeAll(() => {
    // Load and parse all Terraform files
    const tfFiles = [
      'provider.tf',
      'variables.tf',
      'locals.tf',
      'networking.tf',
      'database.tf',
      'compute.tf',
      'loadbalancer.tf',
      'migration.tf',
      'dns.tf',
      'logging.tf',
      'outputs.tf'
    ];

    tfFiles.forEach(file => {
      const filePath = path.resolve(libDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          // Store raw content for string matching
          tfConfig[file] = { content };
        } catch (error: any) {
          console.warn(`Failed to read ${file}:`, error.message);
        }
      }
    });

    // Load terraform.tfvars
    const tfvarsPath = path.resolve(libDir, 'terraform.tfvars');
    if (fs.existsSync(tfvarsPath)) {
      const content = fs.readFileSync(tfvarsPath, 'utf8');
      // Simple parser for tfvars
      content.split('\n').forEach(line => {
        const match = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (match) {
          tfvars[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
        }
      });
    }
  });

  describe('File Structure and Existence', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'locals.tf',
        'networking.tf',
        'database.tf',
        'compute.tf',
        'loadbalancer.tf',
        'migration.tf',
        'dns.tf',
        'logging.tf',
        'outputs.tf',
        'terraform.tfvars'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.resolve(libDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have DMS configuration files', () => {
      expect(fs.existsSync(path.resolve(libDir, 'dms-table-mappings.json'))).toBe(true);
      expect(fs.existsSync(path.resolve(libDir, 'dms-task-settings.json'))).toBe(true);
    });

    test('should have README documentation', () => {
      expect(fs.existsSync(path.resolve(libDir, 'README.md'))).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('should configure AWS provider correctly', () => {
      const providerContent = tfConfig['provider.tf'].content;
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('should require Terraform version >= 1.4.0', () => {
      const providerContent = tfConfig['provider.tf'].content;
      expect(providerContent).toMatch(/required_version.*>=.*1\.[45]/);
    });

    test('should require AWS provider version >= 5.0', () => {
      const providerContent = tfConfig['provider.tf'].content;
      expect(providerContent).toMatch(/version.*>=.*5\.0/);
    });
  });

  describe('Variables Configuration', () => {
    test('should define environment_suffix variable', () => {
      const variablesContent = tfConfig['variables.tf'].content;
      expect(variablesContent).toContain('variable "environment_suffix"');
      expect(variablesContent).toMatch(/environment_suffix.*{[\s\S]*?description/);
    });

    test('should define aws_region variable with default us-east-1', () => {
      const variablesContent = tfConfig['variables.tf'].content;
      expect(variablesContent).toContain('variable "aws_region"');
      expect(variablesContent).toMatch(/default.*=.*"us-east-1"/);
    });

    test('should mark sensitive variables as sensitive', () => {
      const variablesContent = tfConfig['variables.tf'].content;
      const sensitiveVars = [
        'db_master_password',
        'db_master_username',
        'onprem_db_username',
        'onprem_db_password'
      ];

      sensitiveVars.forEach(varName => {
        const regex = new RegExp(`variable\\s+"${varName}"[\\s\\S]*?sensitive\\s*=\\s*true`, 'i');
        expect(variablesContent).toMatch(regex);
      });
    });

    test('should define all required variables for migration', () => {
      const variablesContent = tfConfig['variables.tf'].content;
      const requiredVars = [
        'vpc_cidr',
        'availability_zones',
        'onprem_cidr',
        'payment_app_image',
        'payment_app_port',
        'blue_target_weight',
        'green_target_weight',
        'migration_phase',
        'cost_center'
      ];

      requiredVars.forEach(varName => {
        expect(variablesContent).toContain(`variable "${varName}"`);
      });
    });
  });

  describe('Locals Configuration', () => {
    test('should define environment from terraform.workspace', () => {
      const localsContent = tfConfig['locals.tf'].content;
      expect(localsContent).toMatch(/environment\s*=\s*terraform\.workspace/);
    });

    test('should define environment-specific configurations', () => {
      const localsContent = tfConfig['locals.tf'].content;
      expect(localsContent).toContain('env_config');
      expect(localsContent).toContain('staging-migration');
      expect(localsContent).toContain('production-migration');
    });

    test('should include common tags with required fields', () => {
      const localsContent = tfConfig['locals.tf'].content;
      expect(localsContent).toContain('common_tags');
      expect(localsContent).toMatch(/Environment.*=/);
      expect(localsContent).toMatch(/MigrationPhase.*=/);
      expect(localsContent).toMatch(/CostCenter.*=/);
      expect(localsContent).toMatch(/ManagedBy.*=/);
    });

    test('should define name_prefix with environment_suffix', () => {
      const localsContent = tfConfig['locals.tf'].content;
      expect(localsContent).toMatch(/name_prefix.*var\.environment_suffix/);
    });
  });

  describe('Networking Configuration', () => {
    test('should create VPC with environment_suffix in name', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(networkingContent).toMatch(/vpc-.*var\.environment_suffix/);
    });

    test('should create 3 public subnets across AZs', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(networkingContent).toMatch(/count\s*=\s*3/);
    });

    test('should create 3 private app subnets', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_app"/);
      expect(networkingContent).toContain('private-app-subnet');
    });

    test('should create 3 private database subnets', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_db"/);
      expect(networkingContent).toContain('private-db-subnet');
    });

    test('should create NAT gateways for private subnets', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(networkingContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('should create internet gateway for public subnets', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should create security groups for all tiers', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
      expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"dms"/);
    });

    test('should create VPC endpoints for Systems Manager', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm"/);
      expect(networkingContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssmmessages"/);
    });
  });

  describe('Database Configuration', () => {
    test('should create Aurora MySQL cluster', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toMatch(/resource\s+"aws_rds_cluster"\s+"payment"/);
      expect(databaseContent).toContain('aurora-mysql');
    });

    test('should NOT have deletion_protection=true (QA requirement)', () => {
      const databaseContent = tfConfig['database.tf'].content;
      // Should either not have deletion_protection or have it set to false
      expect(databaseContent).not.toMatch(/deletion_protection\s*=\s*true/);
    });

    test('should NOT have lifecycle prevent_destroy (QA requirement)', () => {
      const databaseContent = tfConfig['database.tf'].content;
      // Should not have prevent_destroy = true
      expect(databaseContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test('should skip final snapshot for QA', () => {
      const databaseContent = tfConfig['database.tf'].content;
      // Either skip_final_snapshot = true or no skip_final_snapshot (defaults to true)
      if (databaseContent.includes('skip_final_snapshot')) {
        expect(databaseContent).toMatch(/skip_final_snapshot\s*=\s*true/);
      }
    });

    test('should store credentials in SSM Parameter Store', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_master_username"/);
      expect(databaseContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_master_password"/);
    });

    test('should create Aurora cluster instances (writer and readers)', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"payment_writer"/);
      expect(databaseContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"payment_reader"/);
    });

    test('should enable encryption at rest', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('should enable CloudWatch logs export', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toContain('enabled_cloudwatch_logs_exports');
    });
  });

  describe('Compute Configuration', () => {
    test('should create ECS cluster with environment_suffix', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"payment"/);
      expect(computeContent).toMatch(/payment-cluster.*var\.environment_suffix/);
    });

    test('should enable container insights', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/containerInsights[\s\S]*?enabled/i);
    });

    test('should create ECS task definition for Fargate', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"payment"/);
      expect(computeContent).toContain('FARGATE');
    });

    test('should create both blue and green ECS services', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_ecs_service"\s+"payment_blue"/);
      expect(computeContent).toMatch(/resource\s+"aws_ecs_service"\s+"payment_green"/);
    });

    test('should configure auto-scaling for ECS services', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs_blue"/);
      expect(computeContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_blue_cpu"/);
    });

    test('should create IAM roles for ECS task execution', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
      expect(computeContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
    });

    test('should grant Parameter Store access to ECS tasks', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toContain('ssm:GetParameters');
      expect(computeContent).toContain('ssm:GetParameter');
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create Application Load Balancer', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toMatch(/resource\s+"aws_lb"\s+"payment"/);
      expect(lbContent).toContain('application');
    });

    test('should NOT have prevent_destroy on S3 logs bucket (QA requirement)', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).not.toMatch(/lifecycle\s*{\s*prevent_destroy\s*=\s*true/);
    });

    test('should create blue and green target groups', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toMatch(/resource\s+"aws_lb_target_group"\s+"blue"/);
      expect(lbContent).toMatch(/resource\s+"aws_lb_target_group"\s+"green"/);
    });

    test('should create HTTP listener', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(lbContent).toMatch(/port\s*=\s*"80"/);
    });

    test('should configure health checks on target groups', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toContain('health_check');
      expect(lbContent).toMatch(/path\s*=\s*"\//);  // Path is "/" or "/health"
    });

    test('should enable ALB access logs', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toContain('access_logs');
      expect(lbContent).toMatch(/enabled\s*=\s*true/);
    });

    test('should create S3 bucket for ALB logs with encryption', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);
      expect(lbContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });
  });

  describe('Migration (DMS) Configuration', () => {
    test('should create DMS replication instance', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_dms_replication_instance"\s+"main"/);
    });

    test('should create DMS source and target endpoints', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"source"/);
      expect(migrationContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"target"/);
    });

    test('should create DMS replication task with CDC', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_dms_replication_task"\s+"main"/);
      expect(migrationContent).toMatch(/migration_type.*full-load-and-cdc/);
    });

    test('should create IAM roles for DMS', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_iam_role"\s+"dms_vpc"/);
      expect(migrationContent).toMatch(/resource\s+"aws_iam_role"\s+"dms_cloudwatch"/);
    });

    test('should create CloudWatch alarms for DMS replication lag', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dms_replication_lag"/);
      expect(migrationContent).toContain('CDCLatencySource');
    });
  });

  describe('DNS Configuration', () => {
    test('should create Route 53 private hosted zone', () => {
      const dnsContent = tfConfig['dns.tf'].content;
      expect(dnsContent).toMatch(/resource\s+"aws_route53_zone"\s+"private"/);
      expect(dnsContent).toContain('payment.internal');
    });

    test('should create weighted routing for blue/green deployment', () => {
      const dnsContent = tfConfig['dns.tf'].content;
      expect(dnsContent).toMatch(/resource\s+"aws_route53_record"\s+"payment_blue"/);
      expect(dnsContent).toMatch(/resource\s+"aws_route53_record"\s+"payment_green"/);
      expect(dnsContent).toContain('weighted_routing_policy');
    });

    test('should create Route 53 health checks', () => {
      const dnsContent = tfConfig['dns.tf'].content;
      expect(dnsContent).toMatch(/resource\s+"aws_route53_health_check"\s+"blue"/);
      expect(dnsContent).toMatch(/resource\s+"aws_route53_health_check"\s+"green"/);
    });

    test('should create CNAME records for database endpoints', () => {
      const dnsContent = tfConfig['dns.tf'].content;
      expect(dnsContent).toMatch(/resource\s+"aws_route53_record"\s+"database_writer"/);
      expect(dnsContent).toMatch(/resource\s+"aws_route53_record"\s+"database_reader"/);
    });
  });

  describe('Logging Configuration', () => {
    test('should create CloudWatch log groups', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"/);
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"infrastructure"/);
    });

    test('should create Kinesis Firehose for log forwarding', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_kinesis_firehose_delivery_stream"\s+"onprem_logs"/);
    });

    test('should create S3 bucket for log backups', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs_backup"/);
    });

    test('should configure lifecycle policy for log retention', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(loggingContent).toContain('GLACIER');
    });

    test('should create CloudWatch alarms for monitoring', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_5xx"/);
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_cpu"/);
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu"/);
    });
  });

  describe('Outputs Configuration', () => {
    test('should output VPC and subnet IDs', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_app_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_db_subnet_ids"/);
    });

    test('should output Aurora endpoints', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"aurora_cluster_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"aurora_reader_endpoint"/);
    });

    test('should output ALB DNS name', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test('should output ECS cluster information', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"ecs_cluster_name"/);
      expect(outputsContent).toMatch(/output\s+"ecs_blue_service_name"/);
      expect(outputsContent).toMatch(/output\s+"ecs_green_service_name"/);
    });

    test('should output DMS resource ARNs', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"dms_replication_instance_arn"/);
      expect(outputsContent).toMatch(/output\s+"dms_replication_task_arn"/);
    });

    test('should output migration status information', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"migration_phase"/);
      expect(outputsContent).toMatch(/output\s+"traffic_distribution"/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environment_suffix', () => {
      const allContent = Object.values(tfConfig)
        .map(config => config.content || '')
        .join('\n');

      // Check that resources are using environment_suffix for naming
      expect(allContent).toMatch(/var\.environment_suffix/);

      // Common resource naming patterns should include suffix
      const resourcePatterns = [
        /name\s*=\s*"[^"]*\${var\.environment_suffix}/,
        /identifier\s*=\s*"[^"]*\${var\.environment_suffix}/,
        /bucket\s*=\s*"[^"]*\${var\.environment_suffix}/
      ];

      resourcePatterns.forEach(pattern => {
        expect(allContent).toMatch(pattern);
      });
    });
  });

  describe('Terraform Variables File', () => {
    test('should have environment_suffix configured', () => {
      expect(tfvars.environment_suffix).toBeDefined();
      expect(tfvars.environment_suffix).not.toBe('');
    });

    test('should have aws_region configured', () => {
      expect(tfvars.aws_region).toBeDefined();
      expect(tfvars.aws_region).toBe('us-east-1');
    });

    test('should have database credentials configured', () => {
      expect(tfvars.db_master_username).toBeDefined();
      expect(tfvars.db_master_password).toBeDefined();
    });

    test('should have realistic Docker image configured', () => {
      expect(tfvars.payment_app_image).toBeDefined();
      // Should be a real image like nginx or nginxdemos/hello
      expect(tfvars.payment_app_image).toMatch(/nginx/i);
    });
  });

  describe('DMS Configuration Files', () => {
    test('dms-table-mappings.json should be valid JSON', () => {
      const mappingsPath = path.resolve(libDir, 'dms-table-mappings.json');
      const content = fs.readFileSync(mappingsPath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty('rules');
      expect(Array.isArray(parsed.rules)).toBe(true);
      expect(parsed.rules.length).toBeGreaterThan(0);
    });

    test('dms-task-settings.json should be valid JSON', () => {
      const settingsPath = path.resolve(libDir, 'dms-task-settings.json');
      const content = fs.readFileSync(settingsPath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty('TargetMetadata');
      expect(parsed).toHaveProperty('FullLoadSettings');
      expect(parsed).toHaveProperty('Logging');
    });
  });

  describe('Documentation', () => {
    test('README should exist and have migration instructions', () => {
      const readmePath = path.resolve(libDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf8');

      expect(content).toMatch(/migration/i);
      expect(content).toMatch(/terraform/i);
      expect(content).toMatch(/deployment/i);
    });
  });
});
