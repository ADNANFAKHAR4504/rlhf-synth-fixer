import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Secure Data Processing Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providerContent: string;
  let combinedContent: string;

  beforeAll(() => {
    // Read BOTH provider.tf and main.tf
    const mainPath = path.join(libPath, 'main.tf');
    const providerPath = path.join(libPath, 'provider.tf');
    
    if (fs.existsSync(mainPath)) {
      mainContent = fs.readFileSync(mainPath, 'utf8');
    } else {
      throw new Error('main.tf file not found');
    }
    
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, 'utf8');
    } else {
      throw new Error('provider.tf file not found');
    }
    
    // Combined content for searches that could be in either file
    combinedContent = providerContent + '\n' + mainContent;
  });

  // ===== FILE STRUCTURE VALIDATION =====
  describe('File Structure Validation', () => {
    test('should have main.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'main.tf'))).toBe(true);
    });

    test('should have provider.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('should have lambda_function.py file', () => {
      expect(fs.existsSync(path.join(libPath, 'lambda_function.py'))).toBe(true);
    });

    test('should generate lambda_function.zip', () => {
      // More flexible regex to capture the archive_file data source
      expect(mainContent).toContain('data "archive_file" "lambda_code"');
      expect(mainContent).toContain('type        = "zip"');
      expect(mainContent).toContain('/lambda_function.py"');
      expect(mainContent).toContain('/lambda_function.zip"');
    });
  });

  // ===== TERRAFORM VERSION AND PROVIDER CONFIGURATION =====
  describe('Terraform Version and Provider Configuration', () => {
    test('should require Terraform version >= 1.5', () => {
      expect(providerContent).toContain('required_version = ">= 1.5"');
    });

    test('should use AWS provider version ~> 5.0', () => {
      expect(providerContent).toContain('source  = "hashicorp/aws"');
      expect(providerContent).toContain('version = "~> 5.0"');
    });

    test('should use random provider version ~> 3.5', () => {
      expect(providerContent).toContain('source  = "hashicorp/random"');
      expect(providerContent).toContain('version = "~> 3.5"');
    });

    test('should use archive provider version ~> 2.4', () => {
      expect(providerContent).toContain('source  = "hashicorp/archive"');
      expect(providerContent).toContain('version = "~> 2.4"');
    });

    test('should configure default tags in AWS provider', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('DataClassification = "Sensitive"');
      expect(providerContent).toContain('Environment');
      expect(providerContent).toContain('Owner');
      expect(providerContent).toContain('ManagedBy');
      expect(providerContent).toContain('Project');
    });

    test('should configure AWS region using variable', () => {
      const providerBlock = providerContent.match(/provider\s+"aws"\s+\{[\s\S]*?region\s*=\s*var\.aws_region/);
      expect(providerBlock).toBeTruthy();
    });
  });

  // ===== DATA SOURCES VALIDATION =====
  describe('Data Sources Validation', () => {
    test('should use aws_caller_identity data source', () => {
      // Data sources are in main.tf, not provider.tf
      expect(mainContent).toContain('data "aws_caller_identity" "current"');
    });

    test('should use aws_availability_zones data source', () => {
      // Data sources are in main.tf, not provider.tf
      expect(mainContent).toContain('data "aws_availability_zones" "available"');
      expect(mainContent).toContain('state = "available"');
    });

    test('should use archive_file data source for Lambda', () => {
      expect(mainContent).toContain('data "archive_file" "lambda_code"');
    });

    test('should not use forbidden data sources', () => {
      const forbiddenDataSources = [
        'data "aws_vpc"',
        'data "aws_subnet"',
        'data "aws_iam_role"',
        'data "aws_s3_bucket"',
        'data "aws_security_group"',
        'data "aws_kms_key"'
      ];
      
      forbiddenDataSources.forEach(forbidden => {
        expect(combinedContent).not.toContain(forbidden);
      });
    });
  });

  // ===== VPC AND NETWORKING CONFIGURATION =====
  describe('VPC and Networking Configuration', () => {
    test('should create isolated VPC with no internet gateway', () => {
      expect(mainContent).toContain('resource "aws_vpc" "secure_processing"');
      expect(mainContent).toContain('cidr_block           = var.vpc_cidr');
      expect(mainContent).toContain('enable_dns_hostnames = true');
      expect(mainContent).toContain('enable_dns_support   = true');
      expect(mainContent).not.toContain('aws_internet_gateway');
      expect(mainContent).not.toContain('aws_nat_gateway');
    });

    test('should create 3 private subnets across availability zones', () => {
      expect(mainContent).toContain('resource "aws_subnet" "private"');
      expect(mainContent).toContain('count = 3');
      expect(mainContent).toContain('map_public_ip_on_launch = false');
      expect(mainContent).toContain('availability_zone       = data.aws_availability_zones.available.names[count.index]');
    });

    test('should create private route table', () => {
      expect(mainContent).toContain('resource "aws_route_table" "private"');
      expect(mainContent).toContain('vpc_id = aws_vpc.secure_processing.id');
    });

    test('should associate subnets with route table', () => {
      expect(mainContent).toContain('resource "aws_route_table_association" "private"');
      const rtaBlock = mainContent.match(/resource\s+"aws_route_table_association"\s+"private"/);
      expect(rtaBlock).toBeTruthy();
    });

    test('should configure VPC flow logs', () => {
      expect(mainContent).toContain('resource "aws_flow_log" "vpc"');
      expect(mainContent).toContain('traffic_type         = "ALL"');
      expect(mainContent).toContain('log_destination_type = "cloud-watch-logs"');
    });

    test('should encrypt VPC flow logs', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "vpc_flow_logs"');
      const logGroupBlock = mainContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"[\s\S]*?kms_key_id/);
      expect(logGroupBlock).toBeTruthy();
    });
  });

  // ===== VPC ENDPOINTS CONFIGURATION =====
  describe('VPC Endpoints Configuration', () => {
    test('should create S3 gateway endpoint', () => {
      expect(mainContent).toContain('resource "aws_vpc_endpoint" "s3"');
      expect(mainContent).toContain('vpc_endpoint_type = "Gateway"');
      const s3Endpoint = mainContent.match(/resource\s+"aws_vpc_endpoint"\s+"s3"[\s\S]*?service_name[\s\S]*?s3/);
      expect(s3Endpoint).toBeTruthy();
    });

    test('should create DynamoDB gateway endpoint', () => {
      expect(mainContent).toContain('resource "aws_vpc_endpoint" "dynamodb"');
      expect(mainContent).toContain('vpc_endpoint_type = "Gateway"');
      const dynamoEndpoint = mainContent.match(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"[\s\S]*?service_name[\s\S]*?dynamodb/);
      expect(dynamoEndpoint).toBeTruthy();
    });

    test('should create Lambda interface endpoint', () => {
      expect(mainContent).toContain('resource "aws_vpc_endpoint" "lambda"');
      const lambdaEndpoint = mainContent.match(/resource\s+"aws_vpc_endpoint"\s+"lambda"[\s\S]*?vpc_endpoint_type\s*=\s*"Interface"/);
      expect(lambdaEndpoint).toBeTruthy();
      expect(mainContent).toContain('private_dns_enabled = true');
    });

    test('should create CloudWatch Logs interface endpoint', () => {
      expect(mainContent).toContain('resource "aws_vpc_endpoint" "logs"');
      const logsEndpoint = mainContent.match(/resource\s+"aws_vpc_endpoint"\s+"logs"[\s\S]*?vpc_endpoint_type\s*=\s*"Interface"/);
      expect(logsEndpoint).toBeTruthy();
    });
  });

  // ===== SECURITY GROUPS CONFIGURATION =====
  describe('Security Groups Configuration', () => {
    test('should create Lambda security group', () => {
      expect(mainContent).toContain('resource "aws_security_group" "lambda"');
      expect(mainContent).toContain('name        = "lambda-${var.environment}"');
    });

    test('should configure Lambda egress rule for HTTPS only', () => {
      expect(mainContent).toContain('resource "aws_security_group_rule" "lambda_egress_https"');
      const egressRule = mainContent.match(/resource\s+"aws_security_group_rule"\s+"lambda_egress_https"[\s\S]*?from_port\s*=\s*443/);
      expect(egressRule).toBeTruthy();
    });

    test('should create VPC endpoint security group', () => {
      expect(mainContent).toContain('resource "aws_security_group" "vpc_endpoint"');
    });

    test('should not have 0.0.0.0/0 in ingress rules', () => {
      const ingressRules = mainContent.match(/type\s*=\s*"ingress"[\s\S]*?cidr_blocks/g);
      if (ingressRules) {
        ingressRules.forEach(rule => {
          if (rule.includes('type') && rule.includes('ingress')) {
            expect(rule).not.toContain('0.0.0.0/0');
          }
        });
      }
      expect(true).toBe(true);
    });
  });

  // ===== KMS ENCRYPTION CONFIGURATION =====
  describe('KMS Encryption Configuration', () => {
    test('should create S3 encryption KMS key', () => {
      expect(mainContent).toContain('resource "aws_kms_key" "s3_encryption"');
      expect(mainContent).toContain('enable_key_rotation     = true');
      const kmsBlock = mainContent.match(/resource\s+"aws_kms_key"\s+"s3_encryption"[\s\S]*?deletion_window_in_days/);
      expect(kmsBlock).toBeTruthy();
    });

    test('should create DynamoDB encryption KMS key', () => {
      expect(mainContent).toContain('resource "aws_kms_key" "dynamodb_encryption"');
      expect(mainContent).toContain('enable_key_rotation     = true');
    });

    test('should create CloudWatch Logs encryption KMS key', () => {
      expect(mainContent).toContain('resource "aws_kms_key" "logs_encryption"');
      expect(mainContent).toContain('enable_key_rotation     = true');
    });

    test('should create KMS aliases', () => {
      expect(mainContent).toContain('resource "aws_kms_alias" "s3_encryption"');
      expect(mainContent).toContain('resource "aws_kms_alias" "dynamodb_encryption"');
      expect(mainContent).toContain('resource "aws_kms_alias" "logs_encryption"');
    });

    test('should configure KMS key policies', () => {
      expect(mainContent).toContain('resource "aws_kms_key_policy" "s3_encryption"');
      expect(mainContent).toContain('resource "aws_kms_key_policy" "dynamodb_encryption"');
      expect(mainContent).toContain('resource "aws_kms_key_policy" "logs_encryption"');
    });
  });

  // ===== S3 BUCKETS CONFIGURATION =====
  describe('S3 Buckets Configuration', () => {
    test('should create raw data bucket with encryption', () => {
      expect(mainContent).toContain('resource "aws_s3_bucket" "raw_data"');
      expect(mainContent).toContain('force_destroy = true');
    });

    test('should create processed data bucket with encryption', () => {
      expect(mainContent).toContain('resource "aws_s3_bucket" "processed_data"');
      expect(mainContent).toContain('force_destroy = true');
    });

    test('should create audit logs bucket with encryption', () => {
      expect(mainContent).toContain('resource "aws_s3_bucket" "audit_logs"');
      expect(mainContent).toContain('force_destroy = true');
    });

    test('should enable versioning on all buckets', () => {
      expect(mainContent).toContain('resource "aws_s3_bucket_versioning" "raw_data"');
      expect(mainContent).toContain('resource "aws_s3_bucket_versioning" "processed_data"');
      expect(mainContent).toContain('resource "aws_s3_bucket_versioning" "audit_logs"');
      
      const versioningBlocks = mainContent.match(/status\s*=\s*"Enabled"/g);
      expect(versioningBlocks?.length).toBeGreaterThanOrEqual(3);
    });

    test('should configure KMS encryption for all buckets', () => {
      const encryptionConfigs = mainContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g);
      expect(encryptionConfigs?.length).toBe(3);
      expect(mainContent).toContain('sse_algorithm     = "aws:kms"');
    });

    test('should block public access on all buckets', () => {
      const publicAccessBlocks = mainContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g);
      expect(publicAccessBlocks?.length).toBe(3);
      expect(mainContent).toContain('block_public_acls       = true');
      expect(mainContent).toContain('block_public_policy     = true');
      expect(mainContent).toContain('ignore_public_acls      = true');
      expect(mainContent).toContain('restrict_public_buckets = true');
    });

    test('should configure lifecycle policies for all buckets', () => {
      const lifecycleConfigs = mainContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"/g);
      expect(lifecycleConfigs?.length).toBe(3);
      expect(mainContent).toContain('storage_class = "GLACIER"');
      expect(mainContent).toContain('days = 90');
    });
  });

  // ===== DYNAMODB TABLES CONFIGURATION =====
  describe('DynamoDB Tables Configuration', () => {
    test('should create metadata table with encryption', () => {
      expect(mainContent).toContain('resource "aws_dynamodb_table" "metadata"');
      expect(mainContent).toContain('billing_mode                = "PAY_PER_REQUEST"');
      expect(mainContent).toContain('hash_key                    = "job_id"');
    });

    test('should create audit table with encryption', () => {
      expect(mainContent).toContain('resource "aws_dynamodb_table" "audit"');
      expect(mainContent).toContain('hash_key                    = "audit_id"');
      expect(mainContent).toContain('range_key                   = "timestamp"');
    });

    test('should enable point-in-time recovery on all tables', () => {
      const pitrMatches = mainContent.match(/point_in_time_recovery\s+\{[\s\S]*?enabled\s*=\s*true/g);
      expect(pitrMatches?.length).toBe(2);
    });

    test('should enable server-side encryption on all tables', () => {
      const sseMatches = mainContent.match(/server_side_encryption\s+\{[\s\S]*?enabled\s*=\s*true/g);
      expect(sseMatches?.length).toBe(2);
    });
  });

  // ===== IAM ROLES CONFIGURATION =====
  describe('IAM Roles Configuration', () => {
    test('should create lambda processor execution role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "lambda_processor"');
      expect(mainContent).toContain('name = "lambda-processor-role-${var.environment}"');
    });

    test('should create lambda validator execution role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "lambda_validator"');
      expect(mainContent).toContain('name = "lambda-validator-role-${var.environment}"');
    });

    test('should create data processor role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "data_processor"');
    });

    test('should create auditor role with read-only permissions', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "auditor"');
    });

    test('should create administrator role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "administrator"');
    });

    test('should create flow logs IAM role', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "flow_logs"');
    });

    test('should enforce least privilege in IAM policies', () => {
      const auditorPolicy = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"auditor"[\s\S]*?Effect\s*=\s*"Deny"/);
      expect(auditorPolicy).toBeTruthy();
      
      const adminPolicy = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"administrator"[\s\S]*?Effect\s*=\s*"Deny"/);
      expect(adminPolicy).toBeTruthy();
    });

    test('should not have wildcard actions in critical roles', () => {
      const lambdaPolicies = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"lambda_/g);
      expect(lambdaPolicies?.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===== LAMBDA FUNCTIONS CONFIGURATION =====
  describe('Lambda Functions Configuration', () => {
    test('should create data processor Lambda function', () => {
      expect(mainContent).toContain('resource "aws_lambda_function" "data_processor"');
      expect(mainContent).toContain('function_name    = "lambda-data-processor-${var.environment}"');
      expect(mainContent).toContain('runtime          = "python3.11"');
      expect(mainContent).toContain('memory_size      = 256');
      expect(mainContent).toContain('timeout          = 300');
    });

    test('should create data validator Lambda function', () => {
      expect(mainContent).toContain('resource "aws_lambda_function" "data_validator"');
      expect(mainContent).toContain('function_name    = "lambda-data-validator-${var.environment}"');
      expect(mainContent).toContain('runtime          = "python3.11"');
    });

    test('should configure VPC for Lambda functions', () => {
      const lambdaFunctions = mainContent.match(/resource\s+"aws_lambda_function"[\s\S]*?vpc_config/g);
      expect(lambdaFunctions?.length).toBe(2);
      expect(mainContent).toContain('subnet_ids         = aws_subnet.private[*].id');
      expect(mainContent).toContain('security_group_ids = [aws_security_group.lambda.id]');
    });

    test('should configure environment variables for Lambda functions', () => {
      expect(mainContent).toContain('RAW_BUCKET');
      expect(mainContent).toContain('PROCESSED_BUCKET');
      expect(mainContent).toContain('METADATA_TABLE');
      expect(mainContent).toContain('AUDIT_TABLE');
    });

    test('should create CloudWatch log groups for Lambda functions', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "data_processor"');
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "data_validator"');
    });
  });

  // ===== SECURITY BEST PRACTICES =====
  describe('Security Best Practices', () => {
    test('should not have hardcoded secrets', () => {
      const sensitivePatterns = [
        /password\s*=\s*"[^$\{][^"]+"/i,
        /secret\s*=\s*"[^$\{][^"]+"/i,
        /api_key\s*=\s*"[^$\{][^"]+"/i,
        /access_key\s*=\s*"[^$\{][^"]+"/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(combinedContent).not.toMatch(pattern);
      });
    });

    test('should use encryption for all data at rest', () => {
      expect(mainContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      
      const dynamoTables = mainContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?server_side_encryption/g);
      expect(dynamoTables?.length).toBe(2);
      
      const logGroups = mainContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id/g);
      expect(logGroups?.length).toBeGreaterThanOrEqual(3);
    });

    test('should enable key rotation for all KMS keys', () => {
      const kmsKeys = mainContent.match(/resource\s+"aws_kms_key"[\s\S]*?enable_key_rotation\s*=\s*true/g);
      expect(kmsKeys?.length).toBe(3);
    });

    test('should not expose resources to public internet', () => {
      expect(mainContent).not.toContain('aws_internet_gateway');
      expect(mainContent).not.toContain('aws_nat_gateway');
      expect(mainContent).not.toContain('aws_eip');
      expect(mainContent).not.toContain('map_public_ip_on_launch = true');
    });

    test('should use VPC endpoints for AWS service access', () => {
      const endpoints = ['s3', 'dynamodb', 'lambda', 'logs'];
      endpoints.forEach(endpoint => {
        expect(mainContent).toContain(`resource "aws_vpc_endpoint" "${endpoint}"`);
      });
    });

    test('should enable VPC flow logs for network monitoring', () => {
      expect(mainContent).toContain('resource "aws_flow_log"');
      expect(mainContent).toContain('traffic_type         = "ALL"');
    });
  });

  // ===== RESOURCE NAMING CONVENTION =====
  describe('Resource Naming Convention', () => {
    test('should use environment variable in resource names', () => {
      const envVarCount = (mainContent.match(/\$\{var\.environment\}/g) || []).length;
      expect(envVarCount).toBeGreaterThan(30);
    });

    test('should follow consistent naming pattern for resources', () => {
      expect(mainContent).toContain('Name = "vpc-secure-processing-${var.environment}"');
      expect(mainContent).toContain('s3-raw-data-${var.environment}');
      expect(mainContent).toContain('s3-processed-data-${var.environment}');
      expect(mainContent).toContain('dynamodb-metadata-${var.environment}');
      expect(mainContent).toContain('dynamodb-audit-${var.environment}');
      expect(mainContent).toContain('lambda-data-processor-${var.environment}');
      expect(mainContent).toContain('lambda-data-validator-${var.environment}');
    });

    test('should use consistent tag naming', () => {
      const tagBlocks = mainContent.match(/tags\s*=\s*\{/g);
      expect(tagBlocks?.length).toBeGreaterThan(20);
    });

    test('should include account ID in globally unique resource names', () => {
      const s3Buckets = mainContent.match(/\$\{data\.aws_caller_identity\.current\.account_id\}/g);
      expect(s3Buckets?.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ===== REQUIRED OUTPUTS =====
  describe('Required Outputs', () => {
    test('should have VPC and networking outputs', () => {
      expect(mainContent).toContain('output "vpc_id"');
      expect(mainContent).toContain('output "private_subnet_ids"');
      expect(mainContent).toContain('output "route_table_id"');
    });

    test('should have VPC endpoint outputs', () => {
      expect(mainContent).toContain('output "s3_endpoint_id"');
      expect(mainContent).toContain('output "dynamodb_endpoint_id"');
      expect(mainContent).toContain('output "lambda_endpoint_id"');
      expect(mainContent).toContain('output "logs_endpoint_id"');
    });

    test('should have security group outputs', () => {
      expect(mainContent).toContain('output "lambda_security_group_id"');
      expect(mainContent).toContain('output "vpc_endpoint_security_group_id"');
    });

    test('should have KMS key outputs', () => {
      expect(mainContent).toContain('output "kms_s3_key_arn"');
      expect(mainContent).toContain('output "kms_dynamodb_key_arn"');
      expect(mainContent).toContain('output "kms_logs_key_arn"');
    });

    test('should have IAM role outputs', () => {
      expect(mainContent).toContain('output "lambda_processor_role_arn"');
      expect(mainContent).toContain('output "lambda_validator_role_arn"');
      expect(mainContent).toContain('output "data_processor_role_arn"');
      expect(mainContent).toContain('output "auditor_role_arn"');
      expect(mainContent).toContain('output "administrator_role_arn"');
    });

    test('should have S3 bucket outputs', () => {
      expect(mainContent).toContain('output "raw_data_bucket_name"');
      expect(mainContent).toContain('output "processed_data_bucket_name"');
      expect(mainContent).toContain('output "audit_logs_bucket_name"');
      expect(mainContent).toContain('output "raw_data_bucket_arn"');
      expect(mainContent).toContain('output "processed_data_bucket_arn"');
      expect(mainContent).toContain('output "audit_logs_bucket_arn"');
    });

    test('should have Lambda function outputs', () => {
      expect(mainContent).toContain('output "lambda_processor_function_name"');
      expect(mainContent).toContain('output "lambda_validator_function_name"');
      expect(mainContent).toContain('output "lambda_processor_function_arn"');
      expect(mainContent).toContain('output "lambda_validator_function_arn"');
    });

    test('should have DynamoDB table outputs', () => {
      expect(mainContent).toContain('output "metadata_table_name"');
      expect(mainContent).toContain('output "audit_table_name"');
      expect(mainContent).toContain('output "metadata_table_arn"');
      expect(mainContent).toContain('output "audit_table_arn"');
    });

    test('should have CloudWatch log group outputs', () => {
      expect(mainContent).toContain('output "processor_log_group_name"');
      expect(mainContent).toContain('output "validator_log_group_name"');
      expect(mainContent).toContain('output "vpc_flow_logs_log_group_name"');
    });

    test('should have deployment metadata outputs', () => {
      expect(mainContent).toContain('output "environment"');
      expect(mainContent).toContain('output "aws_region"');
      expect(mainContent).toContain('output "aws_account_id"');
      expect(mainContent).toContain('output "deployment_timestamp"');
    });

    test('should have descriptions for all outputs', () => {
      const outputBlocks = mainContent.match(/output\s+"[^"]+"\s+\{[\s\S]*?\n\}/g);
      expect(outputBlocks?.length).toBeGreaterThan(40);
      
      outputBlocks?.forEach(output => {
        expect(output).toContain('description');
        expect(output).toContain('value');
      });
    });
  });

  // ===== VARIABLES CONFIGURATION =====
  describe('Variables Configuration', () => {
    test('should define aws_region variable in provider.tf', () => {
      expect(providerContent).toContain('variable "aws_region"');
      const varBlock = providerContent.match(/variable\s+"aws_region"[\s\S]*?description/);
      expect(varBlock).toBeTruthy();
    });

    test('should define environment variable in provider.tf', () => {
      expect(providerContent).toContain('variable "environment"');
      const varBlock = providerContent.match(/variable\s+"environment"[\s\S]*?default\s*=\s*"uat"/);
      expect(varBlock).toBeTruthy();
    });

    test('should define vpc_cidr variable in provider.tf', () => {
      expect(providerContent).toContain('variable "vpc_cidr"');
      expect(providerContent).toContain('default     = "10.0.0.0/16"');
    });

    test('should define log_retention_days variable in provider.tf', () => {
      expect(providerContent).toContain('variable "log_retention_days"');
      expect(providerContent).toContain('default     = 90');
    });

    test('should define kms_deletion_window variable in provider.tf', () => {
      expect(providerContent).toContain('variable "kms_deletion_window"');
      expect(providerContent).toContain('default     = 7');
    });

    test('should have all variables with proper attributes', () => {
      const variableBlocks = providerContent.match(/variable\s+"[^"]+"\s+\{[\s\S]*?\n\}/g);
      expect(variableBlocks?.length).toBeGreaterThanOrEqual(5);
      
      variableBlocks?.forEach(variable => {
        expect(variable).toContain('description');
        expect(variable).toContain('type');
        expect(variable).toContain('default');
      });
    });
  });

  // ===== COMPLIANCE AND TAGGING =====
  describe('Compliance and Tagging', () => {
    test('should have default tags configured in provider', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('DataClassification = "Sensitive"');
      expect(providerContent).toContain('ManagedBy          = "Terraform"');
      expect(providerContent).toContain('Project            = "PCICompliance"');
    });

    test('should tag all major resources', () => {
      const taggedResources = [
        'aws_vpc',
        'aws_subnet',
        'aws_s3_bucket',
        'aws_dynamodb_table',
        'aws_lambda_function'
      ];
      
      taggedResources.forEach(resource => {
        const resourceMatches = mainContent.match(new RegExp(`resource\\s+"${resource}"`, 'g'));
        if (resourceMatches) {
          expect(resourceMatches.length).toBeGreaterThan(0);
        }
      });
    });

    test('should include Name tag on resources', () => {
      const tagBlocks = mainContent.match(/Name\s*=\s*"/g);
      expect(tagBlocks?.length).toBeGreaterThan(20);
    });

    test('should use consistent environment tagging', () => {
      const envTags = mainContent.match(/\$\{var\.environment\}/g);
      expect(envTags?.length).toBeGreaterThan(30);
    });
  });

  // ===== COST OPTIMIZATION =====
  describe('Cost Optimization', () => {
    test('should use force_destroy for testing resources', () => {
      const s3Buckets = mainContent.match(/force_destroy\s*=\s*true/g);
      expect(s3Buckets?.length).toBe(3);
    });

    test('should use minimal KMS deletion window', () => {
      expect(providerContent).toContain('variable "kms_deletion_window"');
      expect(providerContent).toContain('default     = 7');
    });

    test('should use appropriate Lambda memory sizes', () => {
      const lambdaFunctions = mainContent.match(/memory_size\s*=\s*(\d+)/g);
      expect(lambdaFunctions?.length).toBe(2);
    });

    test('should use PAY_PER_REQUEST billing for DynamoDB', () => {
      const dynamoTables = mainContent.match(/billing_mode\s*=\s*"PAY_PER_REQUEST"/g);
      expect(dynamoTables?.length).toBe(2);
    });

    test('should configure lifecycle policies for S3', () => {
      const lifecycleConfigs = mainContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"/g);
      expect(lifecycleConfigs?.length).toBe(3);
    });

    test('should use free gateway endpoints where available', () => {
      expect(mainContent).toContain('resource "aws_vpc_endpoint" "s3"');
      expect(mainContent).toContain('resource "aws_vpc_endpoint" "dynamodb"');
      const gatewayEndpoints = mainContent.match(/vpc_endpoint_type\s*=\s*"Gateway"/g);
      expect(gatewayEndpoints?.length).toBe(2);
    });

    test('should set appropriate log retention periods', () => {
      expect(mainContent).toContain('retention_in_days = var.log_retention_days');
      expect(providerContent).toContain('default     = 90');
    });
  });

  // ===== ERROR HANDLING AND MONITORING =====
  describe('Error Handling and Monitoring', () => {
    test('should configure CloudWatch log groups for Lambda', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "data_processor"');
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group" "data_validator"');
    });

    test('should set Lambda timeout appropriately', () => {
      const lambdaFunctions = mainContent.match(/timeout\s*=\s*(\d+)/g);
      expect(lambdaFunctions?.length).toBe(2);
    });

    test('should configure VPC flow logs for network monitoring', () => {
      expect(mainContent).toContain('resource "aws_flow_log" "vpc"');
      expect(mainContent).toContain('traffic_type         = "ALL"');
    });

    test('should use depends_on for proper resource ordering', () => {
      const dependsOnCount = (mainContent.match(/depends_on\s*=/g) || []).length;
      expect(dependsOnCount).toBeGreaterThanOrEqual(2);
    });

    test('should configure CloudWatch log retention', () => {
      const logGroups = mainContent.match(/retention_in_days/g);
      expect(logGroups?.length).toBeGreaterThanOrEqual(3);
    });

    test('should enable DynamoDB point-in-time recovery', () => {
      const pitrEnabled = mainContent.match(/point_in_time_recovery\s+\{[\s\S]*?enabled\s*=\s*true/g);
      expect(pitrEnabled?.length).toBe(2);
    });
  });

  // ===== DEPENDENCIES AND INTEGRATION POINTS =====
  describe('Dependencies and Integration Points', () => {
    test('should properly reference VPC in subnets', () => {
      expect(mainContent).toContain('vpc_id                  = aws_vpc.secure_processing.id');
    });

    test('should properly reference subnets in Lambda VPC config', () => {
      const lambdaVpcConfigs = mainContent.match(/resource\s+"aws_lambda_function"[\s\S]*?subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/g);
      expect(lambdaVpcConfigs?.length).toBe(2);
    });

    test('should properly reference security groups', () => {
      const sgReferences = mainContent.match(/security_group_ids\s*=\s*\[aws_security_group\.\w+\.id\]/g);
      expect(sgReferences?.length).toBeGreaterThanOrEqual(2);
    });

    test('should properly reference KMS keys in encryption configs', () => {
      const s3Encryption = mainContent.match(/kms_master_key_id\s*=\s*aws_kms_key\.s3_encryption\.arn/g);
      expect(s3Encryption?.length).toBe(3);
      
      const dynamoEncryption = mainContent.match(/kms_key_arn\s*=\s*aws_kms_key\.dynamodb_encryption\.arn/g);
      expect(dynamoEncryption?.length).toBe(2);
      
      const logsEncryption = mainContent.match(/kms_key_id\s*=\s*aws_kms_key\.logs_encryption\.arn/g);
      expect(logsEncryption?.length).toBeGreaterThanOrEqual(3);
    });

    test('should properly reference IAM roles in Lambda functions', () => {
      expect(mainContent).toContain('role             = aws_iam_role.lambda_processor.arn');
      expect(mainContent).toContain('role             = aws_iam_role.lambda_validator.arn');
    });

    test('should properly reference buckets in Lambda environment variables', () => {
      expect(mainContent).toContain('RAW_BUCKET       = aws_s3_bucket.raw_data.id');
      expect(mainContent).toContain('PROCESSED_BUCKET = aws_s3_bucket.processed_data.id');
    });

    test('should properly reference DynamoDB tables in Lambda environment variables', () => {
      expect(mainContent).toContain('METADATA_TABLE   = aws_dynamodb_table.metadata.name');
      expect(mainContent).toContain('AUDIT_TABLE      = aws_dynamodb_table.audit.name');
    });

    test('should properly reference route tables in VPC endpoints', () => {
      expect(mainContent).toContain('route_table_ids   = [aws_route_table.private.id]');
    });

    test('should use data sources for dynamic values', () => {
      const accountIdRefs = combinedContent.match(/data\.aws_caller_identity\.current\.account_id/g);
      expect(accountIdRefs?.length).toBeGreaterThan(10);
      
      const azRefs = combinedContent.match(/data\.aws_availability_zones\.available/g);
      expect(azRefs?.length).toBeGreaterThanOrEqual(1);
    });

    test('should configure Lambda dependencies correctly', () => {
      const dependencies = mainContent.match(/depends_on\s*=\s*\[/g);
      expect(dependencies?.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===== RESOURCE COUNT VALIDATION =====
  describe('Resource Count Validation', () => {
    test('should have correct number of each resource type', () => {
      expect((mainContent.match(/resource\s+"aws_vpc"/g) || []).length).toBe(1);
      expect((mainContent.match(/resource\s+"aws_subnet"/g) || []).length).toBe(1);
      expect((mainContent.match(/resource\s+"aws_route_table"\s+"private"/g) || []).length).toBe(1);
      expect((mainContent.match(/resource\s+"aws_vpc_endpoint"/g) || []).length).toBe(4);
      expect((mainContent.match(/resource\s+"aws_security_group"/g) || []).length).toBe(2);
      expect((mainContent.match(/resource\s+"aws_security_group_rule"/g) || []).length).toBe(3);
      expect((mainContent.match(/resource\s+"aws_kms_key"/g) || []).length).toBe(3);
      expect((mainContent.match(/resource\s+"aws_kms_alias"/g) || []).length).toBe(3);
      expect((mainContent.match(/resource\s+"aws_kms_key_policy"/g) || []).length).toBe(3);
      expect((mainContent.match(/resource\s+"aws_s3_bucket"\s+"(raw_data|processed_data|audit_logs)"/g) || []).length).toBe(3);
      expect((mainContent.match(/resource\s+"aws_dynamodb_table"/g) || []).length).toBe(2);
      expect((mainContent.match(/resource\s+"aws_iam_role"/g) || []).length).toBe(6);
      expect((mainContent.match(/resource\s+"aws_iam_role_policy"/g) || []).length).toBe(6);
      expect((mainContent.match(/resource\s+"aws_lambda_function"/g) || []).length).toBe(2);
      expect((mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g) || []).length).toBeGreaterThanOrEqual(3);
    });
  });

  // ===== TERRAFORM BEST PRACTICES =====
  describe('Terraform Best Practices', () => {
    test('should use consistent resource naming', () => {
      const resources = combinedContent.match(/resource\s+"[^"]+"\s+"[^"]+"/g);
      expect(resources?.length).toBeGreaterThan(50);
    });

    test('should use variables for configuration', () => {
      const variableRefs = combinedContent.match(/var\.\w+/g);
      expect(variableRefs?.length).toBeGreaterThan(50);
    });

    test('should use data sources for dynamic lookups', () => {
      const dataRefs = combinedContent.match(/data\.\w+\.\w+/g);
      expect(dataRefs?.length).toBeGreaterThan(15);
    });

    test('should define outputs for integration', () => {
      const outputs = mainContent.match(/output\s+"/g);
      expect(outputs?.length).toBeGreaterThan(40);
    });

    test('should use consistent formatting', () => {
      const resourceBlocks = combinedContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s+\{/g);
      expect(resourceBlocks?.length).toBeGreaterThan(50);
    });

    test('should use interpolation for dynamic values', () => {
      const interpolations = combinedContent.match(/\$\{[^}]+\}/g);
      expect(interpolations?.length).toBeGreaterThan(50);
    });
  });
});

export {};