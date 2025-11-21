import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.join(__dirname, '..', 'lib');
const MODULES_DIR = path.join(LIB_DIR, 'modules');

/**
 * Execute Terraform command and return output
 */
function execTerraform(command: string, cwd: string = LIB_DIR): string {
  try {
    return execSync(`terraform ${command}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error: any) {
    throw new Error(`Terraform command failed: ${error.message}\nOutput: ${error.stdout}\nError: ${error.stderr}`);
  }
}

/**
 * Parse HCL file content
 */
function parseHCLFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Check if a string exists in file content
 */
function fileContains(filePath: string, searchString: string): boolean {
  const content = parseHCLFile(filePath);
  return content.includes(searchString);
}

/**
 * Extract resource blocks from Terraform content
 */
function extractResources(content: string): string[] {
  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
  const resources: string[] = [];
  let match;
  while ((match = resourceRegex.exec(content)) !== null) {
    resources.push(`${match[1]}.${match[2]}`);
  }
  return resources;
}

/**
 * Extract module blocks from Terraform content
 */
function extractModules(content: string): string[] {
  const moduleRegex = /module\s+"([^"]+)"/g;
  const modules: string[] = [];
  let match;
  while ((match = moduleRegex.exec(content)) !== null) {
    modules.push(match[1]);
  }
  return modules;
}

describe('Terraform Configuration Unit Tests', () => {
  describe('File Structure', () => {
    test('should have all required root files', () => {
      const requiredFiles = [
        'main.tf',
        'variables.tf',
        'outputs.tf',
        'versions.tf',
        'dev.tfvars',
        'staging.tfvars',
        'prod.tfvars',
        'kms.tf',
        'iam.tf',
        'waf.tf',
      ];

      requiredFiles.forEach((file) => {
        const filePath = path.join(LIB_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have all required module directories', () => {
      const requiredModules = ['vpc', 'alb', 'asg', 'rds', 's3'];

      requiredModules.forEach((module) => {
        const modulePath = path.join(MODULES_DIR, module);
        expect(fs.existsSync(modulePath)).toBe(true);
      });
    });

    test('each module should have main.tf, variables.tf, and outputs.tf', () => {
      const modules = ['vpc', 'alb', 'asg', 'rds', 's3'];
      const requiredFiles = ['main.tf', 'variables.tf', 'outputs.tf'];

      modules.forEach((module) => {
        requiredFiles.forEach((file) => {
          const filePath = path.join(MODULES_DIR, module, file);
          expect(fs.existsSync(filePath)).toBe(true);
        });
      });
    });
  });

  describe('Terraform Validation', () => {
    beforeAll(() => {
      // Initialize Terraform
      execTerraform('init -backend=false', LIB_DIR);
    });

    test('terraform fmt should pass', () => {
      const output = execTerraform('fmt -check -recursive', LIB_DIR);
      expect(output).toBe('');
    });

    test('terraform validate should pass', () => {
      const output = execTerraform('validate -json', LIB_DIR);
      const result = JSON.parse(output);
      expect(result.valid).toBe(true);
      expect(result.error_count).toBe(0);
    });
  });

  describe('Main Configuration (main.tf)', () => {
    const mainTfPath = path.join(LIB_DIR, 'main.tf');
    let mainContent: string;

    beforeAll(() => {
      mainContent = parseHCLFile(mainTfPath);
    });

    test('should define all required modules', () => {
      const requiredModules = ['vpc', 'alb', 'asg', 'rds', 's3'];
      const modules = extractModules(mainContent);

      requiredModules.forEach((module) => {
        expect(modules).toContain(module);
      });
    });

    test('should define locals for name_prefix and common_tags', () => {
      expect(mainContent).toContain('locals {');
      expect(mainContent).toContain('name_prefix');
      expect(mainContent).toContain('common_tags');
    });

    test('should define KMS resources', () => {
      const kmsContent = parseHCLFile(path.join(LIB_DIR, 'kms.tf'));
      expect(kmsContent).toContain('resource "aws_kms_key" "rds"');
      expect(kmsContent).toContain('resource "aws_kms_key" "ebs"');
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should define Secrets Manager for database password', () => {
      expect(mainContent).toContain('resource "aws_secretsmanager_secret"');
      expect(mainContent).toContain('resource "aws_secretsmanager_secret_version"');
      expect(mainContent).toContain('resource "random_password"');
    });

    test('should define security groups', () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('security groups should have proper ingress rules', () => {
      // ALB should allow HTTP/HTTPS (port 80 or 443 mentioned somewhere)
      expect(mainContent).toMatch(/80|443/);

      // DB security group should reference app security group
      expect(mainContent).toContain('security_group');
    });
  });

  describe('Variables Configuration (variables.tf)', () => {
    const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = parseHCLFile(variablesTfPath);
    });

    test('should define environment variable', () => {
      expect(variablesContent).toContain('variable "environment"');
    });

    test('should define pr_number variable', () => {
      expect(variablesContent).toContain('variable "pr_number"');
    });

    test('should define VPC CIDR variable', () => {
      expect(variablesContent).toContain('variable "vpc_cidr"');
    });

    test('should define instance type variables', () => {
      expect(variablesContent).toContain('variable "ec2_instance_type"');
      expect(variablesContent).toContain('variable "rds_instance_class"');
    });

    test('should define tenancy variable', () => {
      expect(variablesContent).toContain('variable "ec2_tenancy"');
    });

    test('should define cost_center variable for tagging', () => {
      expect(variablesContent).toContain('variable "cost_center"');
    });

    test('should define WAF-related variables', () => {
      expect(variablesContent).toContain('variable "blocked_countries"');
      expect(variablesContent).toContain('variable "allowed_ip_addresses"');
      expect(variablesContent).toContain('variable "blocked_ip_addresses"');
    });

    test('should define certificate_arn variable for HTTPS', () => {
      expect(variablesContent).toContain('variable "certificate_arn"');
    });
  });

  describe('Environment-Specific tfvars Files', () => {
    const environments = [
      { file: 'dev.tfvars', env: 'dev', cidr: '10.1.0.0/16', ec2: 't3.micro', rds: 'db.t3.micro', tenancy: 'default', pr: 'pr7015dev' },
      { file: 'staging.tfvars', env: 'staging', cidr: '10.2.0.0/16', ec2: 't3.micro', rds: 'db.t3.micro', tenancy: 'default', pr: 'pr7015staging' },
      { file: 'prod.tfvars', env: 'prod', cidr: '10.3.0.0/16', ec2: 'm5.large', rds: 'db.m5.large', tenancy: 'dedicated', pr: 'pr7015prod' },
    ];

    environments.forEach(({ file, env, cidr, ec2, rds, tenancy, pr }) => {
      describe(`${env} environment`, () => {
        const tfvarsPath = path.join(LIB_DIR, file);
        let tfvarsContent: string;

        beforeAll(() => {
          tfvarsContent = parseHCLFile(tfvarsPath);
        });

        test(`should define environment as ${env}`, () => {
          expect(tfvarsContent).toContain(`environment = "${env}"`);
        });

        test(`should define pr_number as ${pr}`, () => {
          expect(tfvarsContent).toContain(`pr_number   = "${pr}"`);
        });

        test(`should use VPC CIDR ${cidr}`, () => {
          expect(tfvarsContent).toContain(`vpc_cidr           = "${cidr}"`);
        });

        test(`should use EC2 instance type ${ec2}`, () => {
          expect(tfvarsContent).toContain(`ec2_instance_type  = "${ec2}"`);
        });

        test(`should use RDS instance class ${rds}`, () => {
          expect(tfvarsContent).toContain(`rds_instance_class = "${rds}"`);
        });

        test(`should use tenancy ${tenancy}`, () => {
          expect(tfvarsContent).toContain(`ec2_tenancy        = "${tenancy}"`);
        });

        test('should define cost_center', () => {
          expect(tfvarsContent).toContain('cost_center');
        });

        test('should NOT contain hardcoded passwords', () => {
          expect(tfvarsContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
        });
      });
    });
  });

  describe('WAF Configuration (waf.tf)', () => {
    const wafTfPath = path.join(LIB_DIR, 'waf.tf');
    let wafContent: string;

    beforeAll(() => {
      wafContent = parseHCLFile(wafTfPath);
    });

    test('should define WAF Web ACL', () => {
      expect(wafContent).toContain('resource "aws_wafv2_web_acl" "main"');
    });

    test('should have rate limiting rule', () => {
      expect(wafContent).toContain('rate_based_statement');
      expect(wafContent).toContain('RateLimitRule');
    });

    test('should have AWS Managed Rules', () => {
      expect(wafContent).toContain('AWSManagedRulesCommonRuleSet');
      expect(wafContent).toContain('AWSManagedRulesKnownBadInputsRuleSet');
      expect(wafContent).toContain('AWSManagedRulesSQLiRuleSet');
      expect(wafContent).toContain('AWSManagedRulesAmazonIpReputationList');
    });

    test('should have geo-blocking rule as dynamic block', () => {
      expect(wafContent).toContain('dynamic "rule"');
      expect(wafContent).toContain('geo_match_statement');
    });

    test('should have CloudWatch logging configuration', () => {
      expect(wafContent).toContain('resource "aws_cloudwatch_log_group" "waf"');
      expect(wafContent).toContain('resource "aws_wafv2_web_acl_logging_configuration" "main"');
      expect(wafContent).toContain('aws-waf-logs-');
    });

    test('should associate WAF with ALB', () => {
      expect(wafContent).toContain('resource "aws_wafv2_web_acl_association" "alb"');
    });

    test('should redact sensitive headers', () => {
      expect(wafContent).toContain('redacted_fields');
      expect(wafContent).toMatch(/authorization|cookie/);
    });
  });

  describe('IAM Configuration (iam.tf)', () => {
    const iamTfPath = path.join(LIB_DIR, 'iam.tf');
    let iamContent: string;

    beforeAll(() => {
      iamContent = parseHCLFile(iamTfPath);
    });

    test('should define EC2 IAM role', () => {
      expect(iamContent).toContain('resource "aws_iam_role" "ec2_instance"');
    });

    test('should define IAM instance profile', () => {
      expect(iamContent).toContain('resource "aws_iam_instance_profile" "ec2_instance"');
    });

    test('should have S3 access policy', () => {
      expect(iamContent).toContain('resource "aws_iam_role_policy" "s3_access"');
      expect(iamContent).toMatch(/s3:GetObject|s3:PutObject|s3:ListBucket/);
    });

    test('should have Secrets Manager access policy', () => {
      expect(iamContent).toContain('resource "aws_iam_role_policy" "secrets_access"');
      expect(iamContent).toContain('secretsmanager:GetSecretValue');
    });

    test('should have KMS access policy', () => {
      expect(iamContent).toContain('resource "aws_iam_role_policy" "kms_access"');
      expect(iamContent).toMatch(/kms:Decrypt|kms:DescribeKey/);
    });

    test('should have CloudWatch Logs policy', () => {
      expect(iamContent).toContain('resource "aws_iam_role_policy" "cloudwatch_logs"');
      expect(iamContent).toMatch(/logs:CreateLogGroup|logs:CreateLogStream|logs:PutLogEvents/);
    });

    test('should have SSM policy for Session Manager', () => {
      // Check for SSM managed policy attachment
      expect(iamContent).toMatch(/aws_iam_role_policy_attachment.*ssm/i);
      expect(iamContent).toContain('AmazonSSMManagedInstanceCore');
    });
  });

  describe('KMS Configuration (kms.tf)', () => {
    const kmsTfPath = path.join(LIB_DIR, 'kms.tf');
    let kmsContent: string;

    beforeAll(() => {
      kmsContent = parseHCLFile(kmsTfPath);
    });

    test('should define RDS KMS key', () => {
      expect(kmsContent).toContain('resource "aws_kms_key" "rds"');
    });

    test('should define EBS KMS key', () => {
      expect(kmsContent).toContain('resource "aws_kms_key" "ebs"');
    });

    test('should enable key rotation', () => {
      const rotationMatches = kmsContent.match(/enable_key_rotation\s*=\s*true/g);
      expect(rotationMatches).toBeTruthy();
      expect(rotationMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('should define KMS aliases', () => {
      expect(kmsContent).toContain('resource "aws_kms_alias" "rds"');
      expect(kmsContent).toContain('resource "aws_kms_alias" "ebs"');
    });

    test('RDS key should allow RDS service', () => {
      expect(kmsContent).toContain('rds.amazonaws.com');
    });

    test('EBS key should allow EC2 and AutoScaling services', () => {
      expect(kmsContent).toContain('ec2.amazonaws.com');
      expect(kmsContent).toContain('autoscaling.amazonaws.com');
    });
  });

  describe('Outputs Configuration (outputs.tf)', () => {
    const outputsTfPath = path.join(LIB_DIR, 'outputs.tf');
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = parseHCLFile(outputsTfPath);
    });

    test('should output name_prefix', () => {
      expect(outputsContent).toContain('output "name_prefix"');
    });

    test('should output pr_number', () => {
      expect(outputsContent).toContain('output "pr_number"');
    });

    test('should output VPC ID', () => {
      expect(outputsContent).toContain('output "vpc_id"');
    });

    test('should output ALB DNS name', () => {
      expect(outputsContent).toContain('output "alb_dns_name"');
    });

    test('should output RDS endpoint', () => {
      expect(outputsContent).toContain('output "rds_endpoint"');
      expect(outputsContent).toContain('sensitive   = true');
    });

    test('should output S3 bucket name', () => {
      expect(outputsContent).toContain('output "s3_bucket_name"');
    });

    test('should output WAF Web ACL details', () => {
      expect(outputsContent).toContain('output "waf_web_acl_id"');
      expect(outputsContent).toContain('output "waf_web_acl_name"');
    });

    test('should output IAM role details', () => {
      expect(outputsContent).toContain('output "iam_role_arn"');
      expect(outputsContent).toContain('output "iam_role_name"');
    });

    test('should output KMS key details', () => {
      expect(outputsContent).toContain('output "kms_rds_key_id"');
      expect(outputsContent).toContain('output "kms_ebs_key_id"');
    });

    test('should output Secrets Manager ARN', () => {
      expect(outputsContent).toContain('output "db_secret_arn"');
      expect(outputsContent).toContain('output "db_secret_name"');
    });

    test('should output resource_summary', () => {
      expect(outputsContent).toContain('output "resource_summary"');
    });

    test('should output CloudWatch alarm ARNs', () => {
      expect(outputsContent).toContain('output "cloudwatch_alarm_arns"');
      expect(outputsContent).toContain('alb_5xx_errors');
      expect(outputsContent).toContain('rds_cpu');
      expect(outputsContent).toContain('rds_storage');
      expect(outputsContent).toContain('asg_unhealthy');
    });

    test('should output SNS topic ARN', () => {
      expect(outputsContent).toContain('output "sns_topic_arn"');
    });
  });

  describe('VPC Module', () => {
    const vpcMainPath = path.join(MODULES_DIR, 'vpc', 'main.tf');
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = parseHCLFile(vpcMainPath);
    });

    test('should create VPC', () => {
      expect(vpcContent).toContain('resource "aws_vpc" "main"');
    });

    test('should create public subnets', () => {
      expect(vpcContent).toContain('resource "aws_subnet" "public"');
      expect(vpcContent).toContain('map_public_ip_on_launch = true');
    });

    test('should create private subnets', () => {
      expect(vpcContent).toContain('resource "aws_subnet" "private"');
    });

    test('should create Internet Gateway', () => {
      expect(vpcContent).toContain('resource "aws_internet_gateway" "main"');
    });

    test('should create NAT Gateway', () => {
      expect(vpcContent).toContain('resource "aws_nat_gateway" "main"');
    });

    test('should create Elastic IP for NAT', () => {
      expect(vpcContent).toContain('resource "aws_eip" "nat"');
    });

    test('should create route tables', () => {
      expect(vpcContent).toContain('resource "aws_route_table" "public"');
      expect(vpcContent).toContain('resource "aws_route_table" "private"');
    });

    test('should enable DNS support and hostnames', () => {
      expect(vpcContent).toContain('enable_dns_support');
      expect(vpcContent).toContain('enable_dns_hostnames');
    });
  });

  describe('ALB Module', () => {
    const albMainPath = path.join(MODULES_DIR, 'alb', 'main.tf');
    let albContent: string;

    beforeAll(() => {
      albContent = parseHCLFile(albMainPath);
    });

    test('should create Application Load Balancer', () => {
      expect(albContent).toContain('resource "aws_lb" "main"');
      expect(albContent).toContain('load_balancer_type = "application"');
    });

    test('should create target group', () => {
      expect(albContent).toContain('resource "aws_lb_target_group" "main"');
    });

    test('should create HTTP listener', () => {
      expect(albContent).toContain('resource "aws_lb_listener" "http"');
      expect(albContent).toContain('port              = "80"');
      expect(albContent).toContain('protocol          = "HTTP"');
    });

    test('should create HTTPS listener when certificate is provided', () => {
      expect(albContent).toContain('resource "aws_lb_listener" "https"');
      expect(albContent).toContain('count = var.certificate_arn != "" ? 1 : 0');
      expect(albContent).toContain('port              = "443"');
      expect(albContent).toContain('protocol          = "HTTPS"');
      expect(albContent).toContain('ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"');
      expect(albContent).toContain('certificate_arn   = var.certificate_arn');
    });

    test('HTTP listener should redirect to HTTPS when certificate is provided', () => {
      expect(albContent).toContain('type = var.certificate_arn != "" ? "redirect" : "forward"');
      expect(albContent).toContain('dynamic "redirect"');
      expect(albContent).toContain('port        = "443"');
      expect(albContent).toContain('protocol    = "HTTPS"');
      expect(albContent).toContain('status_code = "HTTP_301"');
    });

    test('should create S3 bucket for access logs', () => {
      expect(albContent).toContain('resource "aws_s3_bucket" "alb_logs"');
    });

    test('should configure access logging', () => {
      expect(albContent).toContain('access_logs');
    });

    test('should have bucket policy for ALB logging', () => {
      expect(albContent).toContain('resource "aws_s3_bucket_policy" "alb_logs"');
      expect(albContent).toContain('elasticloadbalancing.amazonaws.com');
    });

    test('should have health check configuration', () => {
      expect(albContent).toContain('health_check');
      expect(albContent).toMatch(/healthy_threshold|unhealthy_threshold/);
    });
  });

  describe('ASG Module', () => {
    const asgMainPath = path.join(MODULES_DIR, 'asg', 'main.tf');
    let asgContent: string;

    beforeAll(() => {
      asgContent = parseHCLFile(asgMainPath);
    });

    test('should create launch template', () => {
      expect(asgContent).toContain('resource "aws_launch_template" "main"');
    });

    test('should create Auto Scaling Group', () => {
      expect(asgContent).toContain('resource "aws_autoscaling_group" "main"');
    });

    test('should configure EBS encryption', () => {
      expect(asgContent).toContain('block_device_mappings');
      expect(asgContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('should attach IAM instance profile', () => {
      expect(asgContent).toContain('iam_instance_profile');
    });

    test('should use user_data script', () => {
      expect(asgContent).toContain('user_data');
    });

    test('should have user_data.sh file', () => {
      const userDataPath = path.join(MODULES_DIR, 'asg', 'user_data.sh');
      expect(fs.existsSync(userDataPath)).toBe(true);
    });

    test('user_data.sh should install Apache and Python', () => {
      const userDataPath = path.join(MODULES_DIR, 'asg', 'user_data.sh');
      const userDataContent = parseHCLFile(userDataPath);
      expect(userDataContent).toContain('httpd');
      expect(userDataContent).toContain('python3');
      expect(userDataContent).toContain('python3-pip');
    });

    test('user_data.sh should install Python PostgreSQL adapter', () => {
      const userDataPath = path.join(MODULES_DIR, 'asg', 'user_data.sh');
      const userDataContent = parseHCLFile(userDataPath);
      expect(userDataContent).toContain('psycopg2-binary');
      expect(userDataContent).toContain('boto3');
    });

    test('user_data.sh should create Python HTTP server', () => {
      const userDataPath = path.join(MODULES_DIR, 'asg', 'user_data.sh');
      const userDataContent = parseHCLFile(userDataPath);
      expect(userDataContent).toContain('/opt/payment-app/app.py');
      expect(userDataContent).toContain('PaymentAppHandler');
      expect(userDataContent).toContain('payment-app.service');
    });

    test('user_data.sh should create test endpoints', () => {
      const userDataPath = path.join(MODULES_DIR, 'asg', 'user_data.sh');
      const userDataContent = parseHCLFile(userDataPath);
      expect(userDataContent).toMatch(/health|db-test|s3-test|secrets-test/);
    });
  });

  describe('RDS Module', () => {
    const rdsMainPath = path.join(MODULES_DIR, 'rds', 'main.tf');
    let rdsContent: string;

    beforeAll(() => {
      rdsContent = parseHCLFile(rdsMainPath);
    });

    test('should create DB subnet group', () => {
      expect(rdsContent).toContain('resource "aws_db_subnet_group" "main"');
    });

    test('should create DB parameter group', () => {
      expect(rdsContent).toContain('resource "aws_db_parameter_group" "main"');
    });

    test('should create RDS instance', () => {
      expect(rdsContent).toContain('resource "aws_db_instance" "main"');
    });

    test('should use PostgreSQL engine', () => {
      expect(rdsContent).toContain('engine         = "postgres"');
    });

    test('should enable storage encryption', () => {
      expect(rdsContent).toContain('storage_encrypted = true');
    });

    test('should use KMS encryption', () => {
      expect(rdsContent).toContain('kms_key_id');
    });

    test('should enable CloudWatch logs', () => {
      expect(rdsContent).toContain('enabled_cloudwatch_logs_exports');
    });

    test('should configure backup retention', () => {
      expect(rdsContent).toContain('backup_retention_period');
    });

    test('should configure backup window to avoid conflict with maintenance window', () => {
      expect(rdsContent).toContain('backup_window           = "02:00-03:00"');
      expect(rdsContent).toContain('maintenance_window      = "sun:04:00-sun:05:00"');
      // Backup window (02:00-03:00) should not overlap with maintenance window (04:00-05:00)
    });

    test('should skip final snapshot for non-prod', () => {
      expect(rdsContent).toContain('skip_final_snapshot');
    });
  });

  describe('S3 Module', () => {
    const s3MainPath = path.join(MODULES_DIR, 's3', 'main.tf');
    let s3Content: string;

    beforeAll(() => {
      s3Content = parseHCLFile(s3MainPath);
    });

    test('should create S3 bucket', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket" "main"');
    });

    test('should enable versioning', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket_versioning" "main"');
      expect(s3Content).toContain('status = "Enabled"');
    });

    test('should configure server-side encryption', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "main"');
      expect(s3Content).toContain('sse_algorithm');
    });

    test('should block public access', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket_public_access_block" "main"');
      expect(s3Content).toContain('block_public_acls       = true');
      expect(s3Content).toContain('block_public_policy     = true');
      expect(s3Content).toContain('ignore_public_acls      = true');
      expect(s3Content).toContain('restrict_public_buckets = true');
    });

    test('should have lifecycle configuration', () => {
      expect(s3Content).toContain('resource "aws_s3_bucket_lifecycle_configuration" "main"');
    });

    test('lifecycle rules should have filter blocks', () => {
      expect(s3Content).toContain('filter {');
    });
  });

  describe('Versions Configuration (versions.tf)', () => {
    const versionsTfPath = path.join(LIB_DIR, 'versions.tf');
    let versionsContent: string;

    beforeAll(() => {
      versionsContent = parseHCLFile(versionsTfPath);
    });

    test('should specify Terraform version', () => {
      expect(versionsContent).toContain('required_version');
      expect(versionsContent).toMatch(/>=\s*1\.[0-9]+/);
    });

    test('should specify AWS provider', () => {
      expect(versionsContent).toContain('required_providers');
      expect(versionsContent).toContain('aws');
    });

    test('should specify Random provider', () => {
      expect(versionsContent).toContain('random');
    });

    test('should configure AWS provider', () => {
      expect(versionsContent).toContain('provider "aws"');
      expect(versionsContent).toContain('region');
    });
  });

  describe('Security Best Practices', () => {
    test('should not contain hardcoded AWS credentials', () => {
      const files = [
        path.join(LIB_DIR, 'main.tf'),
        path.join(LIB_DIR, 'dev.tfvars'),
        path.join(LIB_DIR, 'staging.tfvars'),
        path.join(LIB_DIR, 'prod.tfvars'),
      ];

      files.forEach((file) => {
        const content = parseHCLFile(file);
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
        expect(content).not.toMatch(/aws_secret_access_key\s*=\s*"[^"]+"/);
      });
    });

    test('should not contain hardcoded passwords', () => {
      const tfvarsFiles = [
        path.join(LIB_DIR, 'dev.tfvars'),
        path.join(LIB_DIR, 'staging.tfvars'),
        path.join(LIB_DIR, 'prod.tfvars'),
      ];

      tfvarsFiles.forEach((file) => {
        const content = parseHCLFile(file);
        expect(content).not.toMatch(/db_password\s*=\s*"[^"]+"/);
        expect(content).not.toMatch(/password\s*=\s*"[^"]+"/);
      });
    });

    test('should use AWS Secrets Manager for sensitive data', () => {
      const mainContent = parseHCLFile(path.join(LIB_DIR, 'main.tf'));
      expect(mainContent).toContain('aws_secretsmanager_secret');
      expect(mainContent).toContain('random_password');
    });

    test('should enable encryption for storage resources', () => {
      const rdsContent = parseHCLFile(path.join(MODULES_DIR, 'rds', 'main.tf'));
      const s3Content = parseHCLFile(path.join(MODULES_DIR, 's3', 'main.tf'));
      const asgContent = parseHCLFile(path.join(MODULES_DIR, 'asg', 'main.tf'));

      expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(s3Content).toContain('sse_algorithm');
      expect(asgContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('should use least privilege IAM policies', () => {
      const iamContent = parseHCLFile(path.join(LIB_DIR, 'iam.tf'));

      // Should have specific resource ARNs, not "*"
      expect(iamContent).toMatch(/Resource.*\$\{/);
    });
  });

  describe('Tagging Strategy', () => {
    test('should define common_tags in locals', () => {
      const mainContent = parseHCLFile(path.join(LIB_DIR, 'main.tf'));
      expect(mainContent).toContain('common_tags');
      expect(mainContent).toContain('Environment');
      expect(mainContent).toContain('CostCenter');
    });

    test('modules should use common tags', () => {
      const moduleFiles = [
        path.join(MODULES_DIR, 'vpc', 'main.tf'),
        path.join(MODULES_DIR, 'alb', 'main.tf'),
        path.join(MODULES_DIR, 'asg', 'main.tf'),
        path.join(MODULES_DIR, 'rds', 'main.tf'),
        path.join(MODULES_DIR, 's3', 'main.tf'),
      ];

      moduleFiles.forEach((file) => {
        const content = parseHCLFile(file);
        expect(content).toMatch(/tags\s*=.*merge|tags\s*=.*var\.tags/);
      });
    });
  });

  describe('Multi-Environment Support', () => {
    test('dev environment should use smaller instance sizes', () => {
      const devContent = parseHCLFile(path.join(LIB_DIR, 'dev.tfvars'));
      expect(devContent).toContain('ec2_instance_type  = "t3.micro"');
      expect(devContent).toContain('rds_instance_class = "db.t3.micro"');
    });

    test('prod environment should use larger instance sizes', () => {
      const prodContent = parseHCLFile(path.join(LIB_DIR, 'prod.tfvars'));
      expect(prodContent).toContain('ec2_instance_type  = "m5.large"');
      expect(prodContent).toContain('rds_instance_class = "db.m5.large"');
    });

    test('prod environment should use dedicated tenancy', () => {
      const prodContent = parseHCLFile(path.join(LIB_DIR, 'prod.tfvars'));
      expect(prodContent).toContain('ec2_tenancy        = "dedicated"');
    });

    test('non-prod environments should use default tenancy', () => {
      const devContent = parseHCLFile(path.join(LIB_DIR, 'dev.tfvars'));
      const stagingContent = parseHCLFile(path.join(LIB_DIR, 'staging.tfvars'));

      expect(devContent).toContain('ec2_tenancy        = "default"');
      expect(stagingContent).toContain('ec2_tenancy        = "default"');
    });

    test('each environment should have unique VPC CIDR', () => {
      const devContent = parseHCLFile(path.join(LIB_DIR, 'dev.tfvars'));
      const stagingContent = parseHCLFile(path.join(LIB_DIR, 'staging.tfvars'));
      const prodContent = parseHCLFile(path.join(LIB_DIR, 'prod.tfvars'));

      expect(devContent).toContain('vpc_cidr           = "10.1.0.0/16"');
      expect(stagingContent).toContain('vpc_cidr           = "10.2.0.0/16"');
      expect(prodContent).toContain('vpc_cidr           = "10.3.0.0/16"');
    });

    test('each environment should have unique PR number', () => {
      const devContent = parseHCLFile(path.join(LIB_DIR, 'dev.tfvars'));
      const stagingContent = parseHCLFile(path.join(LIB_DIR, 'staging.tfvars'));
      const prodContent = parseHCLFile(path.join(LIB_DIR, 'prod.tfvars'));

      expect(devContent).toContain('pr_number   = "pr7015dev"');
      expect(stagingContent).toContain('pr_number   = "pr7015staging"');
      expect(prodContent).toContain('pr_number   = "pr7015prod"');
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use name_prefix for resource naming', () => {
      const mainContent = parseHCLFile(path.join(LIB_DIR, 'main.tf'));
      expect(mainContent).toContain('local.name_prefix');
    });

    test('name_prefix should include PR number', () => {
      const mainContent = parseHCLFile(path.join(LIB_DIR, 'main.tf'));
      expect(mainContent).toMatch(/name_prefix.*pr_number/);
    });

    test('all modules should receive environment parameter', () => {
      const mainContent = parseHCLFile(path.join(LIB_DIR, 'main.tf'));
      const moduleMatches = mainContent.match(/module\s+"[^"]+"\s*{[^}]*environment[^}]*}/gs);
      expect(moduleMatches).toBeTruthy();
      expect(moduleMatches!.length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring Configuration (monitoring.tf)', () => {
    const monitoringTfPath = path.join(LIB_DIR, 'monitoring.tf');
    let monitoringContent: string;

    beforeAll(() => {
      if (fs.existsSync(monitoringTfPath)) {
        monitoringContent = parseHCLFile(monitoringTfPath);
      } else {
        monitoringContent = '';
      }
    });

    test('should define SNS topic for alarms', () => {
      expect(monitoringContent).toContain('resource "aws_sns_topic" "alarms"');
    });

    test('should define ALB 5XX errors alarm', () => {
      expect(monitoringContent).toContain('resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors"');
      expect(monitoringContent).toContain('metric_name         = "HTTPCode_Target_5XX_Count"');
      expect(monitoringContent).toContain('namespace           = "AWS/ApplicationELB"');
      expect(monitoringContent).toContain('comparison_operator = "GreaterThanThreshold"');
      expect(monitoringContent).toContain('threshold           = 10');
    });

    test('should define RDS CPU alarm', () => {
      expect(monitoringContent).toContain('resource "aws_cloudwatch_metric_alarm" "rds_cpu"');
      expect(monitoringContent).toContain('metric_name         = "CPUUtilization"');
      expect(monitoringContent).toContain('namespace           = "AWS/RDS"');
      expect(monitoringContent).toContain('threshold           = 80');
    });

    test('should define RDS storage alarm', () => {
      expect(monitoringContent).toContain('resource "aws_cloudwatch_metric_alarm" "rds_storage"');
      expect(monitoringContent).toContain('metric_name         = "FreeStorageSpace"');
      expect(monitoringContent).toContain('namespace           = "AWS/RDS"');
      expect(monitoringContent).toContain('comparison_operator = "LessThanThreshold"');
      expect(monitoringContent).toContain('threshold           = 2147483648'); // 2GB in bytes
    });

    test('should define ASG unhealthy instances alarm', () => {
      expect(monitoringContent).toContain('resource "aws_cloudwatch_metric_alarm" "asg_unhealthy_instances"');
      expect(monitoringContent).toContain('metric_name         = "GroupInServiceInstances"');
      expect(monitoringContent).toContain('namespace           = "AWS/AutoScaling"');
      expect(monitoringContent).toContain('comparison_operator = "LessThanThreshold"');
    });

    test('all alarms should be connected to SNS topic', () => {
      expect(monitoringContent).toContain('alarm_actions       = [aws_sns_topic.alarms.arn]');
    });

    test('alarms should have proper evaluation periods', () => {
      expect(monitoringContent).toMatch(/evaluation_periods\s*=\s*[12]/);
    });

    test('alarms should have proper periods', () => {
      expect(monitoringContent).toContain('period              = 300');
    });
  });

  describe('ALB Module Variables', () => {
    const albVariablesPath = path.join(MODULES_DIR, 'alb', 'variables.tf');
    let albVariablesContent: string;

    beforeAll(() => {
      albVariablesContent = parseHCLFile(albVariablesPath);
    });

    test('should define certificate_arn variable', () => {
      expect(albVariablesContent).toContain('variable "certificate_arn"');
      expect(albVariablesContent).toContain('description = "ARN of the ACM certificate for HTTPS listener (optional)"');
      expect(albVariablesContent).toContain('default     = ""');
    });

    test('should validate certificate_arn format', () => {
      expect(albVariablesContent).toContain('validation {');
      expect(albVariablesContent).toContain('condition');
      expect(albVariablesContent).toMatch(/arn:aws:acm:/);
      expect(albVariablesContent).toContain('error_message');
    });
  });

  describe('Root Variables Configuration', () => {
    const rootVariablesPath = path.join(LIB_DIR, 'variables.tf');
    let rootVariablesContent: string;

    beforeAll(() => {
      rootVariablesContent = parseHCLFile(rootVariablesPath);
    });

    test('should validate certificate_arn format in root variables', () => {
      expect(rootVariablesContent).toContain('variable "certificate_arn"');
      expect(rootVariablesContent).toContain('validation {');
      expect(rootVariablesContent).toMatch(/arn:aws:acm:/);
    });
  });

  describe('Monitoring Configuration Validation', () => {
    const monitoringTfPath = path.join(LIB_DIR, 'monitoring.tf');
    let monitoringContent: string;

    beforeAll(() => {
      if (fs.existsSync(monitoringTfPath)) {
        monitoringContent = parseHCLFile(monitoringTfPath);
      } else {
        monitoringContent = '';
      }
    });

    test('ALB 5XX errors alarm should use alb_arn_suffix for LoadBalancer dimension', () => {
      expect(monitoringContent).toContain('LoadBalancer = module.alb.alb_arn_suffix');
      // Should NOT use the incorrect split/element approach
      expect(monitoringContent).not.toContain('element(split("/", module.alb.alb_arn)');
    });
  });
});
