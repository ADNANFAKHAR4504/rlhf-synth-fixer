import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.join(__dirname, '../lib');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Existence', () => {
    test('main.tf file exists and is readable', () => {
      const mainTfPath = path.join(libPath, 'main.tf');
      expect(fs.existsSync(mainTfPath)).toBe(true);

      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('variables.tf file exists and is readable', () => {
      const variablesTfPath = path.join(libPath, 'variables.tf');
      expect(fs.existsSync(variablesTfPath)).toBe(true);

      const content = fs.readFileSync(variablesTfPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('outputs.tf file exists and is readable', () => {
      const outputsTfPath = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(outputsTfPath)).toBe(true);

      const content = fs.readFileSync(outputsTfPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('optimize.py file exists and is readable', () => {
      const optimizePyPath = path.join(libPath, 'optimize.py');
      expect(fs.existsSync(optimizePyPath)).toBe(true);

      const content = fs.readFileSync(optimizePyPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Terraform Version and Provider Configuration', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('requires Terraform version >= 1.5.0', () => {
      expect(mainTfContent).toContain('required_version = ">= 1.5.0"');
    });

    test('uses AWS provider version ~> 5.0', () => {
      expect(mainTfContent).toContain('source  = "hashicorp/aws"');
      expect(mainTfContent).toContain('version = "~> 5.0"');
    });

    test('configures default tags in provider', () => {
      expect(mainTfContent).toContain('default_tags {');
      expect(mainTfContent).toContain('tags = var.common_tags');
    });
  });

  describe('OPTIMIZATION #1: Dynamic Security Group Rules', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('uses dynamic blocks for ingress rules', () => {
      expect(mainTfContent).toContain('dynamic "ingress"');
    });

    test('uses setproduct for ports and CIDR blocks combination', () => {
      expect(mainTfContent).toContain('setproduct(var.allowed_ports, var.allowed_cidr_blocks)');
    });

    test('security group has environment suffix in name', () => {
      expect(mainTfContent).toContain('payment-sg-${var.environment_suffix}');
    });

    test('dynamic ingress rule has description', () => {
      expect(mainTfContent).toContain('description = "Allow port ${ingress.value.port} from ${ingress.value.cidr}"');
    });
  });

  describe('OPTIMIZATION #2: Data Sources Replace Hardcoded Values', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('uses data source for Amazon Linux 2 AMI', () => {
      expect(mainTfContent).toContain('data "aws_ami" "amazon_linux_2"');
      expect(mainTfContent).toContain('most_recent = true');
      expect(mainTfContent).toContain('owners      = ["amazon"]');
    });

    test('uses data source for availability zones', () => {
      expect(mainTfContent).toContain('data "aws_availability_zones" "available"');
      expect(mainTfContent).toContain('state = "available"');
    });

    test('EC2 instances use AMI from data source', () => {
      expect(mainTfContent).toContain('ami                    = data.aws_ami.amazon_linux_2.id');
    });

    test('uses data source for default VPC', () => {
      expect(mainTfContent).toContain('data "aws_vpc" "default"');
      expect(mainTfContent).toContain('default = true');
    });

    test('uses data source for subnets', () => {
      expect(mainTfContent).toContain('data "aws_subnets" "default"');
    });
  });

  describe('OPTIMIZATION #3: Explicit Dependencies', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('RDS instance has explicit depends_on', () => {
      expect(mainTfContent).toContain('depends_on = [');
      expect(mainTfContent).toContain('aws_security_group.rds_sg');
      expect(mainTfContent).toContain('aws_db_subnet_group.payment_db_subnet');
    });

    test('RDS instance depends on security group', () => {
      const rdsBlock = mainTfContent.match(/resource "aws_db_instance" "payment_db" {[\s\S]*?^}/m);
      expect(rdsBlock).toBeDefined();
      expect(rdsBlock![0]).toContain('depends_on');
    });
  });

  describe('OPTIMIZATION #4: IAM Policy Documents', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('uses data source for EC2 assume role policy', () => {
      expect(mainTfContent).toContain('data "aws_iam_policy_document" "ec2_assume_role"');
    });

    test('uses data source for EC2 S3 access policy', () => {
      expect(mainTfContent).toContain('data "aws_iam_policy_document" "ec2_s3_access"');
    });

    test('EC2 role policy has S3 permissions', () => {
      expect(mainTfContent).toContain('"s3:GetObject"');
      expect(mainTfContent).toContain('"s3:PutObject"');
      expect(mainTfContent).toContain('"s3:ListBucket"');
    });

    test('EC2 role policy has CloudWatch permissions', () => {
      expect(mainTfContent).toContain('"cloudwatch:PutMetricData"');
      expect(mainTfContent).toContain('"logs:CreateLogGroup"');
      expect(mainTfContent).toContain('"logs:PutLogEvents"');
    });

    test('EC2 role policy has EC2 describe permissions', () => {
      expect(mainTfContent).toContain('"ec2:DescribeInstances"');
      expect(mainTfContent).toContain('"ec2:DescribeTags"');
    });

    test('policy document has statement IDs (sid)', () => {
      expect(mainTfContent).toContain('sid    = "S3LogAccess"');
      expect(mainTfContent).toContain('sid    = "CloudWatchLogs"');
      expect(mainTfContent).toContain('sid    = "EC2Describe"');
    });
  });

  describe('OPTIMIZATION #5: S3 Bucket Consolidation with for_each', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('S3 buckets use for_each loop', () => {
      expect(mainTfContent).toContain('for_each = toset(var.s3_bucket_environments)');
    });

    test('S3 bucket name uses each.key', () => {
      expect(mainTfContent).toContain('bucket = "payment-logs-${each.key}-${var.environment_suffix}"');
    });

    test('S3 bucket versioning uses for_each', () => {
      expect(mainTfContent).toContain('for_each = aws_s3_bucket.transaction_logs');
    });

    test('S3 bucket encryption uses for_each', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs"');
    });

    test('S3 bucket public access block uses for_each', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_public_access_block" "transaction_logs"');
    });

    test('S3 bucket lifecycle configuration uses for_each', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs"');
    });
  });

  describe('OPTIMIZATION #6: RDS Lifecycle Rules', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('RDS instance has lifecycle block', () => {
      expect(mainTfContent).toContain('lifecycle {');
      expect(mainTfContent).toContain('ignore_changes = [password]');
    });

    test('RDS instance ignores password changes', () => {
      const rdsBlock = mainTfContent.match(/resource "aws_db_instance" "payment_db" {[\s\S]*?^}/m);
      expect(rdsBlock).toBeDefined();
      expect(rdsBlock![0]).toContain('ignore_changes');
    });
  });

  describe('OPTIMIZATION #7: Tagging Strategy with merge()', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('resources use merge() for tags', () => {
      const mergeMatches = mainTfContent.match(/tags = merge\(/g);
      expect(mergeMatches).toBeDefined();
      expect(mergeMatches!.length).toBeGreaterThan(5);
    });

    test('security group uses merge() for tags', () => {
      const sgBlock = mainTfContent.match(/resource "aws_security_group" "payment_sg" {[\s\S]*?^}/m);
      expect(sgBlock).toBeDefined();
      expect(sgBlock![0]).toContain('tags = merge(');
    });

    test('EC2 instances use merge() for tags', () => {
      const ec2Block = mainTfContent.match(/resource "aws_instance" "payment_server" {[\s\S]*?^}/m);
      expect(ec2Block).toBeDefined();
      expect(ec2Block![0]).toContain('tags = merge(');
    });

    test('tags include environment_suffix', () => {
      expect(mainTfContent).toContain('${var.environment_suffix}');
    });
  });

  describe('OPTIMIZATION #8: Sensitive Outputs', () => {
    let outputsTfContent: string;

    beforeAll(() => {
      const outputsTfPath = path.join(libPath, 'outputs.tf');
      outputsTfContent = fs.readFileSync(outputsTfPath, 'utf8');
    });

    test('database_endpoint output is marked sensitive', () => {
      expect(outputsTfContent).toContain('output "database_endpoint"');
      const endpointBlock = outputsTfContent.match(/output "database_endpoint" {[\s\S]*?^}/m);
      expect(endpointBlock).toBeDefined();
      expect(endpointBlock![0]).toContain('sensitive   = true');
    });

    test('database_address output is marked sensitive', () => {
      expect(outputsTfContent).toContain('output "database_address"');
      const addressBlock = outputsTfContent.match(/output "database_address" {[\s\S]*?^}/m);
      expect(addressBlock).toBeDefined();
      expect(addressBlock![0]).toContain('sensitive   = true');
    });

    test('all outputs have descriptions', () => {
      const outputMatches = outputsTfContent.match(/output "/g);
      const descriptionMatches = outputsTfContent.match(/description =/g);
      expect(outputMatches!.length).toBe(descriptionMatches!.length);
    });

    test('ALB DNS name output exists', () => {
      expect(outputsTfContent).toContain('output "alb_dns_name"');
      expect(outputsTfContent).toContain('description = "DNS name of the Application Load Balancer"');
    });

    test('S3 bucket outputs use for comprehension', () => {
      expect(outputsTfContent).toContain('{ for k, v in aws_s3_bucket.transaction_logs');
    });
  });

  describe('Variable Definitions', () => {
    let variablesTfContent: string;

    beforeAll(() => {
      const variablesTfPath = path.join(libPath, 'variables.tf');
      variablesTfContent = fs.readFileSync(variablesTfPath, 'utf8');
    });

    test('environment_suffix variable has validation', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
      const envSuffixBlock = variablesTfContent.match(/variable "environment_suffix" {[\s\S]*?^}/m);
      expect(envSuffixBlock).toBeDefined();
      expect(envSuffixBlock![0]).toContain('validation {');
    });

    test('aws_region variable has validation', () => {
      expect(variablesTfContent).toContain('variable "aws_region"');
      const regionBlock = variablesTfContent.match(/variable "aws_region" {[\s\S]*?^}/m);
      expect(regionBlock).toBeDefined();
      expect(regionBlock![0]).toContain('validation {');
    });

    test('instance_type variable has validation', () => {
      expect(variablesTfContent).toContain('variable "instance_type"');
      const instanceTypeBlock = variablesTfContent.match(/variable "instance_type" {[\s\S]*?^}/m);
      expect(instanceTypeBlock).toBeDefined();
      expect(instanceTypeBlock![0]).toContain('validation {');
    });

    test('allowed_ports variable has validation', () => {
      expect(variablesTfContent).toContain('variable "allowed_ports"');
      const portsBlock = variablesTfContent.match(/variable "allowed_ports" {[\s\S]*?^}/m);
      expect(portsBlock).toBeDefined();
      expect(portsBlock![0]).toContain('validation {');
    });

    test('allowed_cidr_blocks variable has validation', () => {
      expect(variablesTfContent).toContain('variable "allowed_cidr_blocks"');
      const cidrBlock = variablesTfContent.match(/variable "allowed_cidr_blocks" {[\s\S]*?^}/m);
      expect(cidrBlock).toBeDefined();
      expect(cidrBlock![0]).toContain('validation {');
    });

    test('db_password variable is marked sensitive', () => {
      expect(variablesTfContent).toContain('variable "db_password"');
      const passwordBlock = variablesTfContent.match(/variable "db_password" {[\s\S]*?^}/m);
      expect(passwordBlock).toBeDefined();
      expect(passwordBlock![0]).toContain('sensitive   = true');
    });

    test('db_username variable is marked sensitive', () => {
      expect(variablesTfContent).toContain('variable "db_username"');
      const usernameBlock = variablesTfContent.match(/variable "db_username" {[\s\S]*?^}/m);
      expect(usernameBlock).toBeDefined();
      expect(usernameBlock![0]).toContain('sensitive   = true');
    });

    test('log_retention_days variable has validation', () => {
      expect(variablesTfContent).toContain('variable "log_retention_days"');
      const retentionBlock = variablesTfContent.match(/variable "log_retention_days" {[\s\S]*?^}/m);
      expect(retentionBlock).toBeDefined();
      expect(retentionBlock![0]).toContain('validation {');
    });

    test('all required variables are defined', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
      expect(variablesTfContent).toContain('variable "aws_region"');
      expect(variablesTfContent).toContain('variable "instance_type"');
      expect(variablesTfContent).toContain('variable "availability_zones"');
      expect(variablesTfContent).toContain('variable "allowed_ports"');
      expect(variablesTfContent).toContain('variable "allowed_cidr_blocks"');
      expect(variablesTfContent).toContain('variable "s3_bucket_environments"');
      expect(variablesTfContent).toContain('variable "common_tags"');
    });
  });

  describe('Resource Naming Convention', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('all resource names include environment_suffix', () => {
      const resourceNamePatterns = [
        'payment-sg-${var.environment_suffix}',
        'rds-sg-${var.environment_suffix}',
        'payment-db-${var.environment_suffix}',
        'payment-alb-${var.environment_suffix}',
        'payment-tg-${var.environment_suffix}',
        'ec2-payment-role-${var.environment_suffix}',
      ];

      resourceNamePatterns.forEach((pattern) => {
        expect(mainTfContent).toContain(pattern);
      });
    });

    test('S3 bucket names include environment suffix', () => {
      expect(mainTfContent).toContain('payment-logs-${each.key}-${var.environment_suffix}');
      expect(mainTfContent).toContain('payment-alb-logs-${var.environment_suffix}');
    });
  });

  describe('Security and Compliance', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('RDS has encryption enabled', () => {
      expect(mainTfContent).toContain('storage_encrypted     = true');
    });

    test('RDS has backup retention configured', () => {
      expect(mainTfContent).toContain('backup_retention_period = 7');
    });

    test('RDS has skip_final_snapshot for destroyability', () => {
      expect(mainTfContent).toContain('skip_final_snapshot = true');
    });

    test('RDS has deletion_protection disabled', () => {
      expect(mainTfContent).toContain('deletion_protection = false');
    });

    test('S3 buckets have public access blocked', () => {
      expect(mainTfContent).toContain('block_public_acls       = true');
      expect(mainTfContent).toContain('block_public_policy     = true');
      expect(mainTfContent).toContain('ignore_public_acls      = true');
      expect(mainTfContent).toContain('restrict_public_buckets = true');
    });

    test('S3 buckets have encryption enabled', () => {
      expect(mainTfContent).toContain('sse_algorithm = "AES256"');
    });

    test('S3 buckets have versioning enabled', () => {
      expect(mainTfContent).toContain('status = "Enabled"');
    });

    test('EC2 instances require IMDSv2', () => {
      expect(mainTfContent).toContain('http_tokens                 = "required"');
    });

    test('EC2 instances have monitoring enabled', () => {
      expect(mainTfContent).toContain('monitoring = true');
    });
  });

  describe('Production Enhancements', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('RDS has CloudWatch log exports enabled', () => {
      expect(mainTfContent).toContain('enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]');
    });

    test('RDS has Performance Insights enabled', () => {
      expect(mainTfContent).toContain('performance_insights_enabled          = true');
      expect(mainTfContent).toContain('performance_insights_retention_period = 7');
    });

    test('S3 has lifecycle policies for cost optimization', () => {
      expect(mainTfContent).toContain('transition {');
      expect(mainTfContent).toContain('storage_class = "STANDARD_IA"');
      expect(mainTfContent).toContain('storage_class = "GLACIER"');
    });

    test('ALB has access logs enabled', () => {
      expect(mainTfContent).toContain('access_logs {');
      expect(mainTfContent).toContain('enabled = true');
    });

    test('ALB target group has deregistration delay', () => {
      expect(mainTfContent).toContain('deregistration_delay = 30');
    });

    test('ALB target group has stickiness configured', () => {
      expect(mainTfContent).toContain('stickiness {');
      expect(mainTfContent).toContain('type            = "lb_cookie"');
      expect(mainTfContent).toContain('enabled         = true');
    });

    test('EC2 user_data includes CloudWatch agent', () => {
      expect(mainTfContent).toContain('amazon-cloudwatch-agent');
    });

    test('EC2 user_data has error handling', () => {
      expect(mainTfContent).toContain('set -e');
    });

    test('EC2 user_data has logging configured', () => {
      expect(mainTfContent).toContain('exec > >(tee /var/log/user-data.log)');
    });
  });

  describe('Multi-AZ and High Availability', () => {
    let mainTfContent: string;

    beforeAll(() => {
      const mainTfPath = path.join(libPath, 'main.tf');
      mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
    });

    test('RDS is configured as multi-AZ', () => {
      expect(mainTfContent).toContain('multi_az               = true');
    });

    test('EC2 instances use multiple availability zones', () => {
      expect(mainTfContent).toContain('availability_zone      = var.availability_zones[count.index % length(var.availability_zones)]');
    });

    test('creates multiple EC2 instances', () => {
      expect(mainTfContent).toContain('count = 2');
    });

    test('ALB uses multiple subnets', () => {
      expect(mainTfContent).toContain('subnets            = data.aws_subnets.default.ids');
    });
  });

  describe('optimize.py Script Validation', () => {
    let optimizePyContent: string;

    beforeAll(() => {
      const optimizePyPath = path.join(libPath, 'optimize.py');
      optimizePyContent = fs.readFileSync(optimizePyPath, 'utf8');
    });

    test('optimize.py has proper shebang', () => {
      expect(optimizePyContent).toMatch(/^#!\/usr\/bin\/env python3/);
    });

    test('optimize.py has TerraformOptimizer class', () => {
      expect(optimizePyContent).toContain('class TerraformOptimizer');
    });

    test('optimize.py has main function', () => {
      expect(optimizePyContent).toContain('def main()');
    });

    test('optimize.py has optimize method', () => {
      expect(optimizePyContent).toContain('def optimize(self)');
    });

    test('optimize.py handles all 8 optimizations', () => {
      expect(optimizePyContent).toContain('OPTIMIZATION #1');
      expect(optimizePyContent).toContain('OPTIMIZATION #2');
      expect(optimizePyContent).toContain('OPTIMIZATION #3');
      expect(optimizePyContent).toContain('OPTIMIZATION #4');
      expect(optimizePyContent).toContain('OPTIMIZATION #5');
      expect(optimizePyContent).toContain('OPTIMIZATION #6');
      expect(optimizePyContent).toContain('OPTIMIZATION #7');
      expect(optimizePyContent).toContain('OPTIMIZATION #8');
    });
  });
});
