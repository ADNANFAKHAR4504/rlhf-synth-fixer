import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  let terraformConfig: string;

  beforeAll(() => {
    const configPath = path.resolve(__dirname, '../lib/main.tf');
    terraformConfig = fs.readFileSync(configPath, 'utf-8');
  });

  describe('Variable Declarations', () => {
    test('should declare aws_region variable', () => {
      expect(terraformConfig).toMatch(/variable\s+"aws_region"/);
      expect(terraformConfig).toContain('description = "AWS region"');
      expect(terraformConfig).toContain('default     = "us-east-1"');
    });

    test('should declare db_username variable', () => {
      expect(terraformConfig).toMatch(/variable\s+"db_username"/);
      expect(terraformConfig).toContain('description = "Database master username"');
      expect(terraformConfig).toContain('default     = "admin"');
    });

    test('should declare db_password variable', () => {
      expect(terraformConfig).toMatch(/variable\s+"db_password"/);
      expect(terraformConfig).toContain('description = "Database master password"');
      expect(terraformConfig).toContain('sensitive   = true');
    });

    test('should declare lambda_function_name variable', () => {
      expect(terraformConfig).toMatch(/variable\s+"lambda_function_name"/);
      expect(terraformConfig).toContain('description = "Name of the Lambda function"');
      expect(terraformConfig).toContain('default     = "prod-backend-processor"');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should use consistent naming pattern with suffix', () => {
      expect(terraformConfig).toContain('random_string.bucket_suffix.result');
      expect(terraformConfig).toContain('random_string.db_suffix.result');
    });

    test('should have proper resource naming for RDS', () => {
      expect(terraformConfig).toContain('identifier = "prod-database-${random_string.db_suffix.result}"');
      expect(terraformConfig).toContain('name       = "prod-db-subnet-group-${random_string.db_suffix.result}"');
    });

    test('should have proper IAM role naming with suffix', () => {
      expect(terraformConfig).toContain('name = "prod-rds-monitoring-role-${random_string.db_suffix.result}"');
      expect(terraformConfig).toContain('name = "prod-lambda-execution-role-${random_string.db_suffix.result}"');
    });

    test('should have Lambda function and log group names with suffix', () => {
      expect(terraformConfig).toContain('function_name = "${var.lambda_function_name}-${random_string.db_suffix.result}"');
      expect(terraformConfig).toContain('name              = "/aws/lambda/${var.lambda_function_name}-${random_string.db_suffix.result}"');
    });

    test('should have consistent tagging', () => {
      expect(terraformConfig).toContain('Environment = "Production"');
      expect(terraformConfig).toContain('Project     = "Production-Infrastructure"');
      expect(terraformConfig).toContain('ManagedBy   = "Terraform"');
    });
  });

  describe('Network Configuration', () => {
    test('should define VPC with proper CIDR', () => {
      expect(terraformConfig).toContain('cidr_block           = "10.0.0.0/16"');
      expect(terraformConfig).toContain('enable_dns_hostnames = true');
      expect(terraformConfig).toContain('enable_dns_support   = true');
    });

    test('should define public subnets', () => {
      expect(terraformConfig).toMatch(/resource "aws_subnet" "public"/);
      expect(terraformConfig).toContain('count = 2');
      expect(terraformConfig).toContain('map_public_ip_on_launch = true');
    });

    test('should define private subnets', () => {
      expect(terraformConfig).toMatch(/resource "aws_subnet" "private"/);
      expect(terraformConfig).toContain('cidr_block        = "10.0.${count.index + 10}.0/24"');
    });

    test('should have NAT gateways for private subnet connectivity', () => {
      expect(terraformConfig).toMatch(/resource "aws_nat_gateway" "main"/);
      expect(terraformConfig).toContain('count = 2');
    });
  });

  describe('Security Groups', () => {
    test('should define RDS security group', () => {
      expect(terraformConfig).toMatch(/resource "aws_security_group" "rds"/);
      expect(terraformConfig).toContain('name_prefix = "prod-rds-"');
      expect(terraformConfig).toContain('from_port       = 3306');
      expect(terraformConfig).toContain('to_port         = 3306');
    });

    test('should define Lambda security group', () => {
      expect(terraformConfig).toMatch(/resource "aws_security_group" "lambda"/);
      expect(terraformConfig).toContain('name_prefix = "prod-lambda-"');
    });

    test('should have proper egress rules', () => {
      const egressCount = (terraformConfig.match(/egress\s*\{/g) || []).length;
      expect(egressCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Storage Configuration', () => {
    test('should define S3 bucket with versioning', () => {
      expect(terraformConfig).toMatch(/resource "aws_s3_bucket" "main"/);
      expect(terraformConfig).toMatch(/resource "aws_s3_bucket_versioning" "main"/);
      expect(terraformConfig).toContain('status = "Enabled"');
    });

    test('should have S3 encryption enabled', () => {
      expect(terraformConfig).toMatch(/resource "aws_s3_bucket_server_side_encryption_configuration" "main"/);
      expect(terraformConfig).toContain('sse_algorithm = "AES256"');
    });

    test('should have S3 public access blocked', () => {
      expect(terraformConfig).toMatch(/resource "aws_s3_bucket_public_access_block" "main"/);
      expect(terraformConfig).toContain('block_public_acls       = true');
      expect(terraformConfig).toContain('block_public_policy     = true');
    });
  });

  describe('Database Configuration', () => {
    test('should define RDS instance with proper settings', () => {
      expect(terraformConfig).toMatch(/resource "aws_db_instance" "main"/);
      expect(terraformConfig).toContain('engine         = "mysql"');
      expect(terraformConfig).toContain('engine_version = "8.0"');
      expect(terraformConfig).toContain('instance_class = "db.t3.micro"');
    });

    test('should have RDS encryption enabled', () => {
      expect(terraformConfig).toContain('storage_encrypted     = true');
    });

    test('should have proper backup configuration', () => {
      expect(terraformConfig).toContain('backup_retention_period = 7');
      expect(terraformConfig).toContain('backup_window           = "03:00-04:00"');
    });

    test('should have monitoring enabled', () => {
      expect(terraformConfig).toContain('monitoring_interval = 60');
      expect(terraformConfig).toContain('monitoring_role_arn = aws_iam_role.rds_monitoring.arn');
    });

    test('should define DB subnet group', () => {
      expect(terraformConfig).toMatch(/resource "aws_db_subnet_group" "main"/);
      expect(terraformConfig).toContain('subnet_ids = aws_subnet.private[*].id');
    });
  });

  describe('Lambda Configuration', () => {
    test('should define Lambda function', () => {
      expect(terraformConfig).toMatch(/resource "aws_lambda_function" "main"/);
      expect(terraformConfig).toContain('runtime       = "python3.11"');
      expect(terraformConfig).toContain('handler       = "index.handler"');
      expect(terraformConfig).toContain('timeout       = 5');
    });

    test('should have VPC configuration for Lambda', () => {
      expect(terraformConfig).toContain('subnet_ids         = aws_subnet.private[*].id');
      expect(terraformConfig).toContain('security_group_ids = [aws_security_group.lambda.id]');
    });

    test('should have environment variables', () => {
      expect(terraformConfig).toContain('S3_BUCKET   = aws_s3_bucket.main.bucket');
      expect(terraformConfig).toContain('DB_ENDPOINT = aws_db_instance.main.endpoint');
      expect(terraformConfig).toContain('DB_NAME     = aws_db_instance.main.db_name');
    });

    test('should have CloudWatch log group', () => {
      expect(terraformConfig).toMatch(/resource "aws_cloudwatch_log_group" "lambda"/);
      expect(terraformConfig).toContain('retention_in_days = 7');
    });
  });

  describe('IAM Configuration', () => {
    test('should define IAM roles for services', () => {
      expect(terraformConfig).toMatch(/resource "aws_iam_role" "lambda"/);
      expect(terraformConfig).toMatch(/resource "aws_iam_role" "rds_monitoring"/);
    });

    test('should have proper assume role policies', () => {
      expect(terraformConfig).toContain('Service = "lambda.amazonaws.com"');
      expect(terraformConfig).toContain('Service = "monitoring.rds.amazonaws.com"');
    });

    test('should have least privilege IAM policies', () => {
      expect(terraformConfig).toMatch(/resource "aws_iam_role_policy" "lambda"/);
      expect(terraformConfig).toContain('logs:CreateLogGroup');
      expect(terraformConfig).toContain('s3:GetObject');
      expect(terraformConfig).toContain('rds-db:connect');
    });

    test('should attach RDS monitoring policy', () => {
      expect(terraformConfig).toMatch(/resource "aws_iam_role_policy_attachment" "rds_monitoring"/);
      expect(terraformConfig).toContain('AmazonRDSEnhancedMonitoringRole');
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      expect(terraformConfig).toMatch(/output "s3_bucket_name"/);
      expect(terraformConfig).toMatch(/output "s3_bucket_arn"/);
      expect(terraformConfig).toMatch(/output "rds_endpoint"/);
      expect(terraformConfig).toMatch(/output "rds_database_name"/);
      expect(terraformConfig).toMatch(/output "lambda_function_name"/);
      expect(terraformConfig).toMatch(/output "lambda_function_arn"/);
      expect(terraformConfig).toMatch(/output "iam_role_arn"/);
      expect(terraformConfig).toMatch(/output "vpc_id"/);
      expect(terraformConfig).toMatch(/output "private_subnet_ids"/);
    });

    test('should have proper output descriptions', () => {
      expect(terraformConfig).toContain('description = "Name of the S3 bucket"');
      expect(terraformConfig).toContain('description = "RDS instance endpoint"');
      expect(terraformConfig).toContain('description = "Name of the Lambda function"');
    });
  });

  describe('Data Sources', () => {
    test('should use availability zones data source', () => {
      expect(terraformConfig).toMatch(/data "aws_availability_zones" "available"/);
      expect(terraformConfig).toContain('state = "available"');
    });

    test('should use caller identity data source', () => {
      expect(terraformConfig).toMatch(/data "aws_caller_identity" "current"/);
    });

    test('should define archive data source for Lambda', () => {
      expect(terraformConfig).toMatch(/data "archive_file" "lambda_zip"/);
      expect(terraformConfig).toContain('type        = "zip"');
      expect(terraformConfig).toContain('output_path = "lambda_function.zip"');
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper depends_on for Lambda', () => {
      expect(terraformConfig).toContain('aws_iam_role_policy.lambda');
      expect(terraformConfig).toContain('aws_cloudwatch_log_group.lambda');
    });

    test('should have proper depends_on for NAT gateways', () => {
      expect(terraformConfig).toContain('depends_on = [aws_internet_gateway.main]');
    });
  });

  describe('Locals Configuration', () => {
    test('should define common_tags local', () => {
      expect(terraformConfig).toContain('locals {');
      expect(terraformConfig).toContain('common_tags = {');
      expect(terraformConfig).toContain('Environment = "Production"');
      expect(terraformConfig).toContain('ManagedBy   = "Terraform"');
    });
  });

  describe('Random Resources', () => {
    test('should define random strings for unique naming', () => {
      expect(terraformConfig).toMatch(/resource "random_string" "bucket_suffix"/);
      expect(terraformConfig).toMatch(/resource "random_string" "db_suffix"/);
      expect(terraformConfig).toContain('length  = 8');
      expect(terraformConfig).toContain('special = false');
      expect(terraformConfig).toContain('upper   = false');
    });
  });

  describe('File Structure Compliance', () => {
    test('should not contain provider block in main.tf', () => {
      expect(terraformConfig).not.toMatch(/^provider\s+"aws"/m);
    });

    test('should not contain terraform block in main.tf', () => {
      expect(terraformConfig).not.toMatch(/^terraform\s*\{/m);
    });

    test('should contain all infrastructure in single file', () => {
      expect(terraformConfig).toContain('# Variables');
      expect(terraformConfig).toContain('# Locals');
      expect(terraformConfig).toContain('# Random suffixes');
      expect(terraformConfig).toContain('# Outputs');
    });
  });
});
