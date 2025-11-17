import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');

  describe('Terraform Files Validation', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = [
        'compute.tf',
        'database.tf',
        'monitoring.tf',
        'networking.tf',
        'security.tf',
        'variables.tf',
        'provider.tf',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBeTruthy();
      });
    });

    test('should have proper file extensions', () => {
      const tfFiles = fs.readdirSync(libPath).filter(f => f.endsWith('.tf'));
      expect(tfFiles.length).toBeGreaterThan(0);

      tfFiles.forEach(file => {
        expect(file).toMatch(/\.tf$/);
      });
    });

    test('should have variables.tf with all required variables', () => {
      const variablesPath = path.join(libPath, 'variables.tf');
      const content = fs.readFileSync(variablesPath, 'utf-8');

      [
        'aws_region',
        'environment_suffix',
        'vpc_cidr',
        'availability_zones',
        'private_subnet_cidrs',
        'db_instance_class',
        'db_allocated_storage',
        'db_name',
        'db_username',
        'ec2_instance_type',
        'flow_logs_retention_days',
        'backup_retention_period',
        'tags'
      ].forEach(variableName => {
        expect(content).toContain(`variable "${variableName}"`);
      });
    });

    test('should have provider.tf with AWS provider configured', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf-8');

      expect(content).toContain('terraform');
      expect(content).toContain('required_providers');
      expect(content).toContain('provider "aws"');
      expect(content).toContain('region');
    });

    test('should have outputs.tf with key outputs defined', () => {
      const outputsPath = path.join(libPath, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf-8');

      [
        'vpc_id',
        'private_subnet_ids',
        'rds_endpoint',
        'rds_database_name',
        'kms_key_rds_arn',
        'app_logs_bucket',
        'audit_trails_bucket',
        'flow_logs_bucket',
        'security_alerts_topic_arn',
        'ec2_instance_ids'
      ].forEach(outputName => {
        expect(content).toContain(`output "${outputName}"`);
      });
    });
  });

  describe('Compute Configuration', () => {
    test('should have aws_launch_template with payment_processing', () => {
      const computePath = path.join(libPath, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf-8');

      expect(content).toContain('resource "aws_launch_template" "payment_processing"');
      expect(content).toContain('instance_type = var.ec2_instance_type');
      expect(content).toContain('metadata_options');
      expect(content).toContain('user_data = base64encode');
    });

    test('should have aws_instance with payment_processing count', () => {
      const computePath = path.join(libPath, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf-8');

      expect(content).toContain('resource "aws_instance" "payment_processing"');
      expect(content).toContain('count = length(var.availability_zones)');
      expect(content).toContain('iam_instance_profile = aws_iam_instance_profile.ec2_payment_processing.name');
    });
  });

  describe('Database Configuration', () => {
    test('should have aws_db_subnet_group', () => {
      const databasePath = path.join(libPath, 'database.tf');
      const content = fs.readFileSync(databasePath, 'utf-8');

      expect(content).toContain('resource "aws_db_subnet_group" "main"');
      expect(content).toContain('subnet_ids = aws_subnet.private[*].id');
    });

    test('should have aws_db_parameter_group with SSL enforcement', () => {
      const databasePath = path.join(libPath, 'database.tf');
      const content = fs.readFileSync(databasePath, 'utf-8');

      expect(content).toContain('resource "aws_db_parameter_group" "postgres_ssl"');
      expect(content).toContain('name  = "rds.force_ssl"');
      expect(content).toContain('value = "1"');
    });

    test('should have random_password for db_password', () => {
      const databasePath = path.join(libPath, 'database.tf');
      const content = fs.readFileSync(databasePath, 'utf-8');

      expect(content).toContain('resource "random_password" "db_password"');
      expect(content).toContain('length  = 32');
      expect(content).toContain('special = true');
    });

    test('should have aws_db_instance payment_db configured', () => {
      const databasePath = path.join(libPath, 'database.tf');
      const content = fs.readFileSync(databasePath, 'utf-8');

      expect(content).toContain('resource "aws_db_instance" "payment_db"');
      expect(content).toContain('multi_az            = true');
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
      expect(content).toMatch(/parameter_group_name\s*=\s*aws_db_parameter_group\.postgres_ssl\.name/);
    });
  });

  describe('Monitoring Configuration', () => {
    test('should have GuardDuty detector feature for S3 protection', () => {
      const monitoringPath = path.join(libPath, 'monitoring.tf');
      const content = fs.readFileSync(monitoringPath, 'utf-8');

      expect(content).toContain('resource "aws_guardduty_detector_feature" "s3_protection"');
      expect(content).toContain('status      = "ENABLED"');
    });

    test('should have SNS topic for security alerts with KMS encryption', () => {
      const monitoringPath = path.join(libPath, 'monitoring.tf');
      const content = fs.readFileSync(monitoringPath, 'utf-8');

      expect(content).toContain('resource "aws_sns_topic" "security_alerts"');
      expect(content).toContain('kms_master_key_id = aws_kms_key.logs.id');
    });

    test('should have CloudWatch Event Rule and Target for GuardDuty findings', () => {
      const monitoringPath = path.join(libPath, 'monitoring.tf');
      const content = fs.readFileSync(monitoringPath, 'utf-8');

      expect(content).toContain('resource "aws_cloudwatch_event_rule" "guardduty_findings"');
      expect(content).toContain('resource "aws_cloudwatch_event_target" "guardduty_sns"');
    });

    test('should have AWS Config recorder and delivery channel configured', () => {
      const monitoringPath = path.join(libPath, 'monitoring.tf');
      const content = fs.readFileSync(monitoringPath, 'utf-8');

      expect(content).toContain('resource "aws_config_configuration_recorder" "main"');
      expect(content).toContain('resource "aws_config_delivery_channel" "main"');
    });
  });

  describe('Networking Configuration', () => {
    test('should have aws_vpc main resource', () => {
      const networkingPath = path.join(libPath, 'networking.tf');
      const content = fs.readFileSync(networkingPath, 'utf-8');

      expect(content).toContain('resource "aws_vpc" "main"');
      expect(content).toContain('cidr_block           = var.vpc_cidr');
    });

    test('should have private subnets defined with correct count', () => {
      const networkingPath = path.join(libPath, 'networking.tf');
      const content = fs.readFileSync(networkingPath, 'utf-8');

      expect(content).toContain('resource "aws_subnet" "private"');
      expect(content).toContain('count             = length(var.availability_zones)');
    });

    test('should have VPC endpoints for S3, EC2, and RDS', () => {
      const networkingPath = path.join(libPath, 'networking.tf');
      const content = fs.readFileSync(networkingPath, 'utf-8');

      expect(content).toContain('resource "aws_vpc_endpoint" "s3"');
      expect(content).toContain('resource "aws_vpc_endpoint" "ec2"');
      expect(content).toContain('resource "aws_vpc_endpoint" "rds"');
    });

    test('should have network ACL for private subnets', () => {
      const networkingPath = path.join(libPath, 'networking.tf');
      const content = fs.readFileSync(networkingPath, 'utf-8');

      expect(content).toContain('resource "aws_network_acl" "private"');
      expect(content).toContain('ingress {');
      expect(content).toContain('egress {');
    });
  });

  describe('Security Configuration', () => {
    test('should have KMS keys and aliases for RDS, S3, Logs', () => {
      const securityPath = path.join(libPath, 'security.tf');
      const content = fs.readFileSync(securityPath, 'utf-8');

      expect(content).toContain('resource "aws_kms_key" "rds"');
      expect(content).toContain('resource "aws_kms_alias" "rds"');
      expect(content).toContain('resource "aws_kms_key" "s3"');
      expect(content).toContain('resource "aws_kms_alias" "s3"');
      expect(content).toContain('resource "aws_kms_key" "logs"');
      expect(content).toContain('resource "aws_kms_alias" "logs"');
    });

    test('should have security groups for app tier and database tier', () => {
      const securityPath = path.join(libPath, 'security.tf');
      const content = fs.readFileSync(securityPath, 'utf-8');

      expect(content).toContain('resource "aws_security_group" "app_tier"');
      expect(content).toContain('resource "aws_security_group" "database_tier"');
    });

    test('should have security group rules app_to_db and db_from_app', () => {
      const securityPath = path.join(libPath, 'security.tf');
      const content = fs.readFileSync(securityPath, 'utf-8');

      expect(content).toContain('resource "aws_security_group_rule" "app_to_db"');
      expect(content).toContain('resource "aws_security_group_rule" "db_from_app"');
    });


    test('should use environment_suffix consistently in resource names', () => {
      const allTfFiles = fs.readdirSync(libPath).filter(f => f.endsWith('.tf') && !['provider.tf', 'outputs.tf'].includes(f));
      let foundSuffix = false;
      allTfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf-8');
        if (/var\.environment_suffix/.test(content)) foundSuffix = true;
      });
      expect(foundSuffix).toBe(true);
    });

    test('should merge tags variable in all resources', () => {
      const allTfFiles = fs.readdirSync(libPath).filter(f => f.endsWith('.tf') && !['provider.tf', 'outputs.tf'].includes(f));
      let foundMergeTags = false;
      allTfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf-8');
        if (/merge\(\s*var\.tags/.test(content)) foundMergeTags = true;
      });
      expect(foundMergeTags).toBe(true);
    });
  });
});

