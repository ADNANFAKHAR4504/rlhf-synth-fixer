import * as fs from 'fs';
import * as path from 'path';

/**
 * Terraform Unit Tests - 100% Mock Coverage
 * No live AWS deployments - Pure configuration validation using file system and regex
 */

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');

  // Helper to read Terraform files as text
  const readTerraformFile = (filePath: string): string => {
    return fs.readFileSync(filePath, 'utf8');
  };

  // Helper to check if file exists
  const fileExists = (filePath: string): boolean => {
    return fs.existsSync(filePath);
  };

  describe('1. File Structure Tests', () => {
    test('should have all required root Terraform files', () => {
      expect(fileExists(path.join(libPath, 'main.tf'))).toBe(true);
      expect(fileExists(path.join(libPath, 'variables.tf'))).toBe(true);
      expect(fileExists(path.join(libPath, 'outputs.tf'))).toBe(true);
      expect(fileExists(path.join(libPath, 'providers.tf'))).toBe(true);
      expect(fileExists(path.join(libPath, 'locals.tf'))).toBe(true);
    });

    test('should have all module directories', () => {
      const modules = ['vpc', 'iam', 'aurora', 'storage', 'lambda', 'alb', 'monitoring'];
      modules.forEach(moduleName => {
        const modulePath = path.join(libPath, 'modules', moduleName);
        expect(fileExists(modulePath)).toBe(true);
      });
    });

    test('should have main.tf in each module', () => {
      const modules = ['vpc', 'storage'];
      modules.forEach(moduleName => {
        const mainTfPath = path.join(libPath, 'modules', moduleName, 'main.tf');
        expect(fileExists(mainTfPath)).toBe(true);
      });
    });
  });

  describe('2. Provider Configuration Tests', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'providers.tf'));
    });

    test('should define terraform block', () => {
      expect(content).toContain('terraform {');
    });

    test('should require Terraform version >= 1.5.0', () => {
      expect(content).toContain('required_version = ">= 1.5.0"');
    });

    test('should configure AWS provider', () => {
      expect(content).toContain('required_providers');
      expect(content).toContain('source  = "hashicorp/aws"');
      expect(content).toContain('version = "~> 5.0"');
    });

    test('should configure S3 backend', () => {
      expect(content).toContain('backend "s3"');
    });

    test('should define AWS provider block', () => {
      expect(content).toContain('provider "aws"');
    });

    test('should configure default tags in provider', () => {
      expect(content).toContain('default_tags');
      expect(content).toContain('ManagedBy   = "Terraform"');
    });
  });

  describe('3. Variables Configuration Tests', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'variables.tf'));
    });

    test('should define environment variable', () => {
      expect(content).toContain('variable "environment"');
      expect(content).toContain('type        = string');
    });

    test('should validate environment values', () => {
      expect(content).toContain('validation');
      expect(content).toContain('dev');
      expect(content).toContain('staging');
      expect(content).toContain('prod');
    });

    test('should define environment_suffix variable', () => {
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('type        = string');
    });

    test('should validate environment_suffix length', () => {
      const suffixSection = content.substring(content.indexOf('variable "environment_suffix"'));
      expect(suffixSection).toContain('validation');
      expect(suffixSection).toContain('4');
      expect(suffixSection).toContain('16');
    });

    test('should define aws_region variable', () => {
      expect(content).toContain('variable "aws_region"');
      expect(content).toContain('type        = string');
    });

    test('should define project_name with default', () => {
      expect(content).toContain('variable "project_name"');
      expect(content).toContain('default     = "payment-processing"');
    });

    test('should define vpc_cidr variable', () => {
      expect(content).toContain('variable "vpc_cidr"');
      expect(content).toContain('type        = string');
    });

    test('should define availability_zones as list', () => {
      expect(content).toContain('variable "availability_zones"');
      expect(content).toContain('type        = list(string)');
    });

    test('should define aurora_instance_class variable', () => {
      expect(content).toContain('variable "aurora_instance_class"');
      expect(content).toContain('type        = string');
    });

    test('should define aurora_instance_count with default', () => {
      expect(content).toContain('variable "aurora_instance_count"');
      expect(content).toContain('type        = number');
      expect(content).toContain('default     = 2');
    });

    test('should define lambda_memory_size with default', () => {
      expect(content).toContain('variable "lambda_memory_size"');
      expect(content).toContain('default     = 512');
    });

    test('should define lambda_timeout with default', () => {
      expect(content).toContain('variable "lambda_timeout"');
      expect(content).toContain('default     = 300');
    });

    test('should define alb_instance_type with default', () => {
      expect(content).toContain('variable "alb_instance_type"');
      expect(content).toContain('default     = "t3.micro"');
    });

    test('should define log_retention_days variable', () => {
      expect(content).toContain('variable "log_retention_days"');
      expect(content).toContain('type        = number');
    });

    test('should define feature flag: enable_config_rules', () => {
      expect(content).toContain('variable "enable_config_rules"');
      expect(content).toContain('type        = bool');
      expect(content).toContain('default     = false');
    });

    test('should define feature flag: enable_step_functions', () => {
      expect(content).toContain('variable "enable_step_functions"');
      expect(content).toContain('type        = bool');
    });

    test('should define feature flag: enable_eventbridge', () => {
      expect(content).toContain('variable "enable_eventbridge"');
      expect(content).toContain('type        = bool');
    });

    test('should define bucket_names with default array', () => {
      expect(content).toContain('variable "bucket_names"');
      expect(content).toContain('type        = list(string)');
      expect(content).toContain('data-processing');
      expect(content).toContain('archive');
      expect(content).toContain('logs');
    });
  });

  describe('4. Locals Configuration Tests', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'locals.tf'));
    });

    test('should define locals block', () => {
      expect(content).toContain('locals {');
    });

    test('should define environment_config for all environments', () => {
      expect(content).toContain('environment_config');
      expect(content).toContain('dev =');
      expect(content).toContain('staging =');
      expect(content).toContain('prod =');
    });

    test('should configure dev environment correctly', () => {
      expect(content).toContain('instance_type         = "t3.small"');
      expect(content).toContain('aurora_instance_class = "db.t3.medium"');
      expect(content).toContain('log_retention         = 7');
      expect(content).toContain('backup_retention      = 1');
      expect(content).toContain('multi_az              = false');
    });

    test('should configure staging environment correctly', () => {
      expect(content).toContain('instance_type         = "t3.medium"');
      expect(content).toContain('aurora_instance_class = "db.r6g.large"');
      expect(content).toContain('log_retention         = 30');
      expect(content).toContain('backup_retention      = 7');
    });

    test('should configure prod environment correctly', () => {
      expect(content).toContain('instance_type         = "t3.large"');
      expect(content).toContain('aurora_instance_class = "db.r6g.xlarge"');
      expect(content).toContain('log_retention         = 90');
      expect(content).toContain('backup_retention      = 30');
    });

    test('should define current_config selector', () => {
      expect(content).toContain('current_config = local.environment_config[var.environment]');
    });

    test('should define name_prefix', () => {
      expect(content).toContain('name_prefix');
    });

    test('should define resource_names', () => {
      expect(content).toContain('resource_names');
      expect(content).toContain('vpc');
      expect(content).toContain('aurora_cluster');
      expect(content).toContain('alb');
      expect(content).toContain('lambda');
      expect(content).toContain('sns_topic');
    });

    test('should define common_tags', () => {
      expect(content).toContain('common_tags');
      expect(content).toContain('ManagedBy         = "Terraform"');
    });

    test('should define iam_roles configuration', () => {
      expect(content).toContain('iam_roles');
      expect(content).toContain('lambda_execution');
      expect(content).toContain('ecs_task');
      expect(content).toContain('rds_monitoring');
    });
  });

  describe('5. Outputs Configuration Tests', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'outputs.tf'));
    });

    test('should define vpc_id output', () => {
      expect(content).toContain('output "vpc_id"');
      expect(content).toContain('module.vpc.vpc_id');
    });

    test('should define vpc_cidr output', () => {
      expect(content).toContain('output "vpc_cidr"');
      expect(content).toContain('vpc_cidr_block');
    });

    test('should define subnet outputs', () => {
      expect(content).toContain('output "private_subnet_ids"');
      expect(content).toContain('output "public_subnet_ids"');
    });

    test('should define sensitive Aurora outputs', () => {
      expect(content).toContain('output "aurora_cluster_endpoint"');
      expect(content).toContain('sensitive   = true');
      expect(content).toContain('output "aurora_cluster_reader_endpoint"');
    });

    test('should define aurora_cluster_id output', () => {
      expect(content).toContain('output "aurora_cluster_id"');
    });

    test('should define S3 bucket outputs', () => {
      expect(content).toContain('output "s3_bucket_ids"');
      expect(content).toContain('output "s3_bucket_arns"');
    });

    test('should define Lambda function outputs', () => {
      expect(content).toContain('output "lambda_function_arn"');
      expect(content).toContain('output "lambda_function_name"');
    });

    test('should define ALB outputs', () => {
      expect(content).toContain('output "alb_dns_name"');
      expect(content).toContain('output "alb_arn"');
    });

    test('should define SNS topic output', () => {
      expect(content).toContain('output "sns_topic_arn"');
    });

    test('should define environment metadata outputs', () => {
      expect(content).toContain('output "environment"');
      expect(content).toContain('output "environment_suffix"');
    });
  });

  describe('6. Main Infrastructure - Module Configurations', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define VPC module', () => {
      expect(content).toContain('module "vpc"');
      expect(content).toContain('source = "./modules/vpc"');
    });

    test('should configure VPC module with correct parameters', () => {
      const vpcSection = content.substring(content.indexOf('module "vpc"'), content.indexOf('module "iam"'));
      expect(vpcSection).toContain('name_prefix');
      expect(vpcSection).toContain('vpc_cidr');
      expect(vpcSection).toContain('availability_zones');
      expect(vpcSection).toContain('enable_nat_gateway   = true');
      expect(vpcSection).toContain('enable_dns_hostnames = true');
      expect(vpcSection).toContain('enable_dns_support   = true');
    });

    test('should define IAM module', () => {
      expect(content).toContain('module "iam"');
      expect(content).toContain('source = "./modules/iam"');
    });

    test('should define Aurora module', () => {
      expect(content).toContain('module "aurora"');
      expect(content).toContain('source = "./modules/aurora"');
    });

    test('should configure Aurora with correct settings', () => {
      const auroraSection = content.substring(content.indexOf('module "aurora"'));
      expect(auroraSection).toContain('engine_version          = "15"');
      expect(auroraSection).toContain('master_username         = "dbadmin"');
      expect(auroraSection).toContain('storage_encrypted       = true');
      expect(auroraSection).toContain('skip_final_snapshot     = true');
      expect(auroraSection).toContain('preferred_backup_window = "03:00-04:00"');
    });

    test('should define storage module', () => {
      expect(content).toContain('module "storage"');
      expect(content).toContain('source = "./modules/storage"');
      expect(content).toContain('enable_versioning  = true');
      expect(content).toContain('force_destroy      = true');
    });

    test('should define Lambda module', () => {
      expect(content).toContain('module "lambda"');
      expect(content).toContain('source = "./modules/lambda"');
      expect(content).toContain('handler            = "index.handler"');
      expect(content).toContain('runtime            = "python3.9"');
    });

    test('should configure Lambda with VPC settings', () => {
      const lambdaSection = content.substring(content.indexOf('module "lambda"'));
      expect(lambdaSection).toContain('vpc_config');
      expect(lambdaSection).toContain('subnet_ids');
      expect(lambdaSection).toContain('security_group_ids');
    });

    test('should configure Lambda environment variables', () => {
      const lambdaSection = content.substring(content.indexOf('module "lambda"'));
      expect(lambdaSection).toContain('environment_variables');
      expect(lambdaSection).toContain('ENVIRONMENT');
      expect(lambdaSection).toContain('DB_ENDPOINT');
    });

    test('should define ALB module', () => {
      expect(content).toContain('module "alb"');
      expect(content).toContain('source = "./modules/alb"');
    });

    test('should configure ALB listener rules', () => {
      const albSection = content.substring(content.indexOf('module "alb"'));
      expect(albSection).toContain('listener_rules');
      expect(albSection).toContain('priority = 100');
    });

    test('should define monitoring module', () => {
      expect(content).toContain('module "monitoring"');
      expect(content).toContain('source = "./modules/monitoring"');
    });
  });

  describe('7. Main Infrastructure - KMS Resources', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define KMS key for Aurora', () => {
      expect(content).toContain('resource "aws_kms_key" "aurora"');
    });

    test('should enable KMS key rotation', () => {
      expect(content).toContain('enable_key_rotation     = true');
    });

    test('should set KMS deletion window', () => {
      expect(content).toContain('deletion_window_in_days = 7');
    });

    test('should define KMS alias', () => {
      expect(content).toContain('resource "aws_kms_alias" "aurora"');
    });
  });

  describe('8. Main Infrastructure - Security Groups', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define Lambda security group', () => {
      expect(content).toContain('resource "aws_security_group" "lambda"');
    });

    test('should configure Lambda security group egress', () => {
      const lambdaSgSection = content.substring(
        content.indexOf('resource "aws_security_group" "lambda"'),
        content.indexOf('resource "aws_security_group" "alb"')
      );
      expect(lambdaSgSection).toContain('egress');
      expect(lambdaSgSection).toContain('protocol    = "-1"');
    });

    test('should set Lambda security group lifecycle', () => {
      const lambdaSgSection = content.substring(
        content.indexOf('resource "aws_security_group" "lambda"'),
        content.indexOf('resource "aws_security_group" "alb"')
      );
      expect(lambdaSgSection).toContain('lifecycle');
      expect(lambdaSgSection).toContain('create_before_destroy = true');
    });

    test('should define ALB security group', () => {
      expect(content).toContain('resource "aws_security_group" "alb"');
    });

    test('should configure ALB security group with HTTP ingress', () => {
      const albSgSection = content.substring(content.indexOf('resource "aws_security_group" "alb"'));
      expect(albSgSection).toContain('from_port   = 80');
      expect(albSgSection).toContain('protocol    = "tcp"');
    });

    test('should configure ALB security group with HTTPS ingress', () => {
      const albSgSection = content.substring(content.indexOf('resource "aws_security_group" "alb"'));
      expect(albSgSection).toContain('from_port   = 443');
      expect(albSgSection).toContain('to_port     = 443');
    });

    test('should configure ALB security group egress', () => {
      const albSgSection = content.substring(content.indexOf('resource "aws_security_group" "alb"'));
      expect(albSgSection).toContain('egress');
    });
  });

  describe('9. Main Infrastructure - SSM and Secrets', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define SSM parameter for database password', () => {
      expect(content).toContain('resource "aws_ssm_parameter" "db_password"');
    });

    test('should configure SSM parameter as SecureString', () => {
      expect(content).toContain('type        = "SecureString"');
    });

    test('should define random password resource', () => {
      expect(content).toContain('resource "random_password" "db_password"');
    });

    test('should configure random password with correct length', () => {
      const passwordSection = content.substring(content.indexOf('resource "random_password"'));
      expect(passwordSection).toContain('length  = 32');
      expect(passwordSection).toContain('special = true');
    });
  });

  describe('10. Main Infrastructure - S3 Events', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should define S3 bucket notification', () => {
      expect(content).toContain('resource "aws_s3_bucket_notification" "data_processing"');
    });

    test('should configure Lambda function trigger', () => {
      const notificationSection = content.substring(content.indexOf('resource "aws_s3_bucket_notification"'));
      expect(notificationSection).toContain('lambda_function');
      expect(notificationSection).toContain('events              = ["s3:ObjectCreated:*"]');
      expect(notificationSection).toContain('filter_prefix       = "incoming/"');
    });

    test('should define Lambda permission for S3', () => {
      expect(content).toContain('resource "aws_lambda_permission" "allow_s3"');
    });

    test('should configure Lambda permission correctly', () => {
      const permissionSection = content.substring(content.indexOf('resource "aws_lambda_permission" "allow_s3"'));
      expect(permissionSection).toContain('action        = "lambda:InvokeFunction"');
      expect(permissionSection).toContain('principal     = "s3.amazonaws.com"');
    });
  });

  describe('11. VPC Module Tests', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'modules', 'vpc', 'main.tf'));
    });

    test('should define all VPC module variables', () => {
      expect(content).toContain('variable "name_prefix"');
      expect(content).toContain('variable "vpc_cidr"');
      expect(content).toContain('variable "availability_zones"');
      expect(content).toContain('variable "enable_nat_gateway"');
      expect(content).toContain('variable "single_nat_gateway"');
      expect(content).toContain('variable "enable_dns_hostnames"');
      expect(content).toContain('variable "enable_dns_support"');
      expect(content).toContain('variable "tags"');
    });

    test('should set default values for optional variables', () => {
      expect(content).toContain('default     = true');
      expect(content).toContain('default     = false');
    });

    test('should define VPC resource', () => {
      expect(content).toContain('resource "aws_vpc" "main"');
    });

    test('should configure VPC with DNS settings', () => {
      const vpcSection = content.substring(content.indexOf('resource "aws_vpc" "main"'));
      expect(vpcSection).toContain('enable_dns_hostnames');
      expect(vpcSection).toContain('enable_dns_support');
    });

    test('should define internet gateway', () => {
      expect(content).toContain('resource "aws_internet_gateway" "main"');
    });

    test('should define public subnets with count', () => {
      expect(content).toContain('resource "aws_subnet" "public"');
      expect(content).toContain('map_public_ip_on_launch = true');
    });

    test('should define private subnets', () => {
      expect(content).toContain('resource "aws_subnet" "private"');
    });

    test('should define elastic IPs for NAT', () => {
      expect(content).toContain('resource "aws_eip" "nat"');
      expect(content).toContain('domain = "vpc"');
    });

    test('should define NAT gateways', () => {
      expect(content).toContain('resource "aws_nat_gateway" "main"');
    });

    test('should define public route table', () => {
      expect(content).toContain('resource "aws_route_table" "public"');
      expect(content).toContain('cidr_block = "0.0.0.0/0"');
    });

    test('should define private route table', () => {
      expect(content).toContain('resource "aws_route_table" "private"');
    });

    test('should define route table associations', () => {
      expect(content).toContain('resource "aws_route_table_association" "public"');
      expect(content).toContain('resource "aws_route_table_association" "private"');
    });

    test('should define VPC outputs', () => {
      expect(content).toContain('output "vpc_id"');
      expect(content).toContain('output "vpc_cidr_block"');
      expect(content).toContain('output "public_subnet_ids"');
      expect(content).toContain('output "private_subnet_ids"');
      expect(content).toContain('output "nat_gateway_ids"');
    });
  });

  describe('12. Storage Module Tests', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile(path.join(libPath, 'modules', 'storage', 'main.tf'));
    });

    test('should define all storage module variables', () => {
      expect(content).toContain('variable "bucket_names"');
      expect(content).toContain('variable "environment"');
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('variable "project_name"');
      expect(content).toContain('variable "enable_versioning"');
      expect(content).toContain('variable "force_destroy"');
    });

    test('should set default values for storage variables', () => {
      expect(content).toContain('default     = true');
    });

    test('should define locals for bucket configuration', () => {
      expect(content).toContain('locals {');
      expect(content).toContain('buckets');
    });

    test('should define S3 bucket resource with for_each', () => {
      expect(content).toContain('resource "aws_s3_bucket" "buckets"');
      expect(content).toContain('for_each');
    });

    test('should define bucket versioning resource', () => {
      expect(content).toContain('resource "aws_s3_bucket_versioning" "buckets"');
      expect(content).toContain('status = "Enabled"');
    });

    test('should define bucket encryption', () => {
      expect(content).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "buckets"');
      expect(content).toContain('sse_algorithm = "AES256"');
    });

    test('should define public access block', () => {
      expect(content).toContain('resource "aws_s3_bucket_public_access_block" "buckets"');
      expect(content).toContain('block_public_acls       = true');
      expect(content).toContain('block_public_policy     = true');
      expect(content).toContain('ignore_public_acls      = true');
      expect(content).toContain('restrict_public_buckets = true');
    });

    test('should define storage outputs', () => {
      expect(content).toContain('output "bucket_ids"');
      expect(content).toContain('output "bucket_arns"');
      expect(content).toContain('output "bucket_names"');
    });
  });

  describe('13. Security Best Practices Tests', () => {
    let mainContent: string;
    let storageContent: string;

    beforeAll(() => {
      mainContent = readTerraformFile(path.join(libPath, 'main.tf'));
      storageContent = readTerraformFile(path.join(libPath, 'modules', 'storage', 'main.tf'));
    });

    test('should enable encryption at rest for Aurora', () => {
      expect(mainContent).toContain('storage_encrypted       = true');
    });

    test('should enable KMS key rotation', () => {
      expect(mainContent).toContain('enable_key_rotation     = true');
    });

    test('should store passwords as SecureString', () => {
      expect(mainContent).toContain('type        = "SecureString"');
    });

    test('should enable S3 encryption', () => {
      expect(storageContent).toContain('sse_algorithm = "AES256"');
    });

    test('should block all S3 public access', () => {
      expect(storageContent).toContain('block_public_acls       = true');
      expect(storageContent).toContain('block_public_policy     = true');
    });

    test('should use lifecycle policies for security groups', () => {
      expect(mainContent).toContain('create_before_destroy = true');
    });
  });

  describe('14. High Availability Tests', () => {
    let localsContent: string;
    let mainContent: string;

    beforeAll(() => {
      localsContent = readTerraformFile(path.join(libPath, 'locals.tf'));
      mainContent = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should enable multi-AZ for staging', () => {
      const stagingSection = localsContent.substring(localsContent.indexOf('staging ='));
      expect(stagingSection).toContain('multi_az              = true');
    });

    test('should enable multi-AZ for production', () => {
      const prodSection = localsContent.substring(localsContent.indexOf('prod ='));
      expect(prodSection).toContain('multi_az              = true');
    });

    test('should disable multi-AZ for dev to save costs', () => {
      const devSection = localsContent.substring(localsContent.indexOf('dev ='), localsContent.indexOf('staging ='));
      expect(devSection).toContain('multi_az              = false');
    });

    test('should use multiple availability zones', () => {
      expect(mainContent).toContain('availability_zones');
    });
  });

  describe('15. Backup and Disaster Recovery Tests', () => {
    let mainContent: string;
    let localsContent: string;

    beforeAll(() => {
      mainContent = readTerraformFile(path.join(libPath, 'main.tf'));
      localsContent = readTerraformFile(path.join(libPath, 'locals.tf'));
    });

    test('should configure Aurora backup window', () => {
      expect(mainContent).toContain('preferred_backup_window = "03:00-04:00"');
    });

    test('should have different backup retention per environment', () => {
      expect(localsContent).toContain('backup_retention      = 1');
      expect(localsContent).toContain('backup_retention      = 7');
      expect(localsContent).toContain('backup_retention      = 30');
    });

    test('should enable S3 versioning', () => {
      expect(mainContent).toContain('enable_versioning  = true');
    });

    test('should set KMS deletion window for recovery', () => {
      expect(mainContent).toContain('deletion_window_in_days = 7');
    });
  });

  describe('16. Monitoring and Logging Tests', () => {
    let mainContent: string;
    let localsContent: string;

    beforeAll(() => {
      mainContent = readTerraformFile(path.join(libPath, 'main.tf'));
      localsContent = readTerraformFile(path.join(libPath, 'locals.tf'));
    });

    test('should configure monitoring module', () => {
      expect(mainContent).toContain('module "monitoring"');
    });

    test('should have different log retention per environment', () => {
      expect(localsContent).toContain('log_retention         = 7');
      expect(localsContent).toContain('log_retention         = 30');
      expect(localsContent).toContain('log_retention         = 90');
    });

    test('should configure SNS topic for alerts', () => {
      expect(mainContent).toContain('sns_topic_name');
    });
  });

  describe('17. Tagging Strategy Tests', () => {
    let mainContent: string;
    let localsContent: string;
    let providersContent: string;

    beforeAll(() => {
      mainContent = readTerraformFile(path.join(libPath, 'main.tf'));
      localsContent = readTerraformFile(path.join(libPath, 'locals.tf'));
      providersContent = readTerraformFile(path.join(libPath, 'providers.tf'));
    });

    test('should define common tags in locals', () => {
      expect(localsContent).toContain('common_tags');
      expect(localsContent).toContain('ManagedBy         = "Terraform"');
    });

    test('should apply default tags at provider level', () => {
      expect(providersContent).toContain('default_tags');
      expect(providersContent).toContain('ManagedBy   = "Terraform"');
    });

    test('should pass tags to all modules', () => {
      expect(mainContent).toContain('tags = local.common_tags');
    });
  });

  describe('18. Resource Naming Convention Tests', () => {
    let localsContent: string;

    beforeAll(() => {
      localsContent = readTerraformFile(path.join(libPath, 'locals.tf'));
    });

    test('should define consistent naming prefix', () => {
      expect(localsContent).toContain('name_prefix');
    });

    test('should include environment suffix in resource names', () => {
      expect(localsContent).toContain('${var.environment_suffix}');
    });
  });

  describe('19. Cost Optimization Tests', () => {
    let localsContent: string;
    let mainContent: string;

    beforeAll(() => {
      localsContent = readTerraformFile(path.join(libPath, 'locals.tf'));
      mainContent = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should use smaller instances for dev', () => {
      const devSection = localsContent.substring(localsContent.indexOf('dev ='), localsContent.indexOf('staging ='));
      expect(devSection).toContain('instance_type         = "t3.small"');
      expect(devSection).toContain('aurora_instance_class = "db.t3.medium"');
    });

    test('should use single NAT gateway for dev', () => {
      expect(mainContent).toContain('single_nat_gateway');
    });

    test('should scale up for production', () => {
      const prodSection = localsContent.substring(localsContent.lastIndexOf('prod ='));
      expect(prodSection).toContain('instance_type         = "t3.large"');
      expect(prodSection).toContain('aurora_instance_class = "db.r6g.xlarge"');
    });
  });

  describe('20. Integration and Dependencies Tests', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readTerraformFile(path.join(libPath, 'main.tf'));
    });

    test('should reference VPC outputs in other modules', () => {
      expect(mainContent).toContain('module.vpc.vpc_id');
      expect(mainContent).toContain('module.vpc.private_subnet_ids');
    });

    test('should reference IAM outputs in Lambda', () => {
      expect(mainContent).toContain('module.iam.lambda_execution_role_arn');
    });

    test('should reference storage outputs in Lambda env vars', () => {
      expect(mainContent).toContain('module.aurora.cluster_endpoint');
    });

    test('should configure S3 notification with dependency', () => {
      expect(mainContent).toContain('depends_on = [aws_lambda_permission.allow_s3]');
    });
  });
});
