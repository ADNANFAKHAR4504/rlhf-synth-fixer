import fs from 'fs';
import path from 'path';
import { parse } from 'hcl2-parser';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Structure', () => {
    test('lib directory exists', () => {
      expect(fs.existsSync(LIB_DIR)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
    });

    test('vpc.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'vpc.tf'))).toBe(true);
    });

    test('rds.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'rds.tf'))).toBe(true);
    });

    test('alb.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'alb.tf'))).toBe(true);
    });

    test('security_groups.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'security_groups.tf'))).toBe(true);
    });

    test('iam.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'iam.tf'))).toBe(true);
    });

    test('secrets.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'secrets.tf'))).toBe(true);
    });

    test('main.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'main.tf'))).toBe(true);
    });

    test('locals.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'locals.tf'))).toBe(true);
    });

    test('data.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'data.tf'))).toBe(true);
    });

    test('backend.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'backend.tf'))).toBe(true);
    });

    test('EC2 module directory exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'modules', 'ec2'))).toBe(true);
    });

    test('EC2 module main.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'modules', 'ec2', 'main.tf'))).toBe(true);
    });

    test('EC2 module variables.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'modules', 'ec2', 'variables.tf'))).toBe(true);
    });

    test('EC2 module outputs.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'modules', 'ec2', 'outputs.tf'))).toBe(true);
    });
  });

  describe('Variable Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
    });

    test('environmentSuffix variable is defined', () => {
      expect(variablesContent).toContain('variable "environmentSuffix"');
    });

    test('environmentSuffix has validation', () => {
      expect(variablesContent).toContain('validation {');
    });

    test('aws_region variable is defined', () => {
      expect(variablesContent).toContain('variable "aws_region"');
    });

    test('instance_type variable is defined', () => {
      expect(variablesContent).toContain('variable "instance_type"');
    });

    test('vpc_cidr variable is defined', () => {
      expect(variablesContent).toContain('variable "vpc_cidr"');
    });

    test('public_subnet_cidrs variable is defined', () => {
      expect(variablesContent).toContain('variable "public_subnet_cidrs"');
    });

    test('private_subnet_cidrs variable is defined', () => {
      expect(variablesContent).toContain('variable "private_subnet_cidrs"');
    });

    test('db_instance_class variable is defined', () => {
      expect(variablesContent).toContain('variable "db_instance_class"');
    });

    test('project_name variable is defined', () => {
      expect(variablesContent).toContain('variable "project_name"');
    });

    test('cost_center variable is defined', () => {
      expect(variablesContent).toContain('variable "cost_center"');
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
    });

    test('AWS provider is configured', () => {
      expect(providerContent).toContain('provider "aws"');
    });

    test('Random provider is configured', () => {
      expect(providerContent).toContain('source  = "hashicorp/random"');
    });

    test('Provider uses aws_region variable', () => {
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('Default tags are configured', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('local.common_tags');
    });
  });

  describe('Tagging Strategy', () => {
    let localsContent: string;

    beforeAll(() => {
      localsContent = fs.readFileSync(path.join(LIB_DIR, 'locals.tf'), 'utf8');
    });

    test('common_tags local is defined', () => {
      expect(localsContent).toContain('common_tags');
    });

    test('Environment tag uses environmentSuffix', () => {
      expect(localsContent).toContain('Environment = var.environmentSuffix');
    });

    test('Project tag is included', () => {
      expect(localsContent).toContain('Project');
    });

    test('ManagedBy tag is set to Terraform', () => {
      expect(localsContent).toContain('ManagedBy');
      expect(localsContent).toContain('Terraform');
    });

    test('CostCenter tag is included', () => {
      expect(localsContent).toContain('CostCenter');
    });
  });

  describe('Resource Naming', () => {
    const tfFiles = [
      'vpc.tf',
      'rds.tf',
      'alb.tf',
      'security_groups.tf',
      'iam.tf',
      'backend.tf',
      'secrets.tf'
    ];

    tfFiles.forEach(file => {
      test(`${file} uses environmentSuffix in resource names`, () => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).toMatch(/\$\{var\.environmentSuffix\}/);
      });
    });
  });

  describe('VPC Configuration', () => {
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(path.join(LIB_DIR, 'vpc.tf'), 'utf8');
    });

    test('VPC resource is defined', () => {
      expect(vpcContent).toContain('resource "aws_vpc" "main"');
    });

    test('VPC uses for_each for subnets', () => {
      expect(vpcContent).toContain('for_each');
    });

    test('Public subnets are configured', () => {
      expect(vpcContent).toContain('resource "aws_subnet" "public"');
    });

    test('Private subnets are configured', () => {
      expect(vpcContent).toContain('resource "aws_subnet" "private"');
    });

    test('Internet gateway is configured', () => {
      expect(vpcContent).toContain('resource "aws_internet_gateway"');
    });

    test('Route tables are configured', () => {
      expect(vpcContent).toContain('resource "aws_route_table"');
    });
  });

  describe('RDS Configuration', () => {
    let rdsContent: string;

    beforeAll(() => {
      rdsContent = fs.readFileSync(path.join(LIB_DIR, 'rds.tf'), 'utf8');
    });

    test('RDS instance is defined', () => {
      expect(rdsContent).toContain('resource "aws_db_instance" "main"');
    });

    test('RDS uses storage encryption', () => {
      expect(rdsContent).toContain('storage_encrypted = true');
    });

    test('RDS deletion_protection is false for CI/CD', () => {
      expect(rdsContent).toContain('deletion_protection = false');
    });

    test('RDS does NOT have prevent_destroy lifecycle', () => {
      expect(rdsContent).not.toContain('prevent_destroy = true');
    });

    test('RDS skip_final_snapshot is true for CI/CD', () => {
      expect(rdsContent).toContain('skip_final_snapshot       = true');
    });

    test('RDS uses KMS encryption', () => {
      expect(rdsContent).toContain('kms_key_id');
    });

    test('DB subnet group is configured', () => {
      expect(rdsContent).toContain('resource "aws_db_subnet_group"');
    });
  });

  describe('ALB Configuration', () => {
    let albContent: string;

    beforeAll(() => {
      albContent = fs.readFileSync(path.join(LIB_DIR, 'alb.tf'), 'utf8');
    });

    test('ALB resource is defined', () => {
      expect(albContent).toContain('resource "aws_lb" "main"');
    });

    test('ALB deletion_protection is false for CI/CD', () => {
      expect(albContent).toContain('enable_deletion_protection       = false');
    });

    test('Target group is defined', () => {
      expect(albContent).toContain('resource "aws_lb_target_group"');
    });

    test('Target group has create_before_destroy', () => {
      expect(albContent).toContain('create_before_destroy = true');
    });

    test('Listener is configured', () => {
      expect(albContent).toContain('resource "aws_lb_listener"');
    });

    test('Target group attachments use for_each', () => {
      expect(albContent).toContain('for_each = module.ec2_instances');
    });
  });

  describe('Security Groups', () => {
    let sgContent: string;

    beforeAll(() => {
      sgContent = fs.readFileSync(path.join(LIB_DIR, 'security_groups.tf'), 'utf8');
    });

    test('ALB security group is defined', () => {
      expect(sgContent).toContain('resource "aws_security_group" "alb"');
    });

    test('Web security group is defined', () => {
      expect(sgContent).toContain('resource "aws_security_group" "web"');
    });

    test('RDS security group is defined', () => {
      expect(sgContent).toContain('resource "aws_security_group" "rds"');
    });

    test('Security groups have lifecycle create_before_destroy', () => {
      expect(sgContent).toContain('create_before_destroy = true');
    });
  });

  describe('Secrets Manager', () => {
    let secretsContent: string;

    beforeAll(() => {
      secretsContent = fs.readFileSync(path.join(LIB_DIR, 'secrets.tf'), 'utf8');
    });

    test('Secrets Manager secret is created (not data source)', () => {
      expect(secretsContent).toContain('resource "aws_secretsmanager_secret"');
    });

    test('Secret version is created', () => {
      expect(secretsContent).toContain('resource "aws_secretsmanager_secret_version"');
    });

    test('Random password is generated', () => {
      expect(secretsContent).toContain('resource "random_password"');
    });

    test('Secret has recovery_window_in_days = 0 for CI/CD', () => {
      expect(secretsContent).toContain('recovery_window_in_days = 0');
    });
  });

  describe('IAM Configuration', () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
    });

    test('EC2 IAM role is defined', () => {
      expect(iamContent).toContain('resource "aws_iam_role" "ec2"');
    });

    test('IAM role policy for Secrets Manager is defined', () => {
      expect(iamContent).toContain('resource "aws_iam_role_policy" "ec2_secrets"');
    });

    test('IAM instance profile is defined', () => {
      expect(iamContent).toContain('resource "aws_iam_instance_profile"');
    });

    test('SSM managed policy is attached', () => {
      expect(iamContent).toContain('AmazonSSMManagedInstanceCore');
    });

    test('CloudWatch agent policy is attached', () => {
      expect(iamContent).toContain('CloudWatchAgentServerPolicy');
    });
  });

  describe('Data Sources', () => {
    let dataContent: string;

    beforeAll(() => {
      dataContent = fs.readFileSync(path.join(LIB_DIR, 'data.tf'), 'utf8');
    });

    test('AMI data source is defined', () => {
      expect(dataContent).toContain('data "aws_ami" "amazon_linux_2023"');
    });

    test('AMI uses dynamic lookup (no hardcoded ID)', () => {
      expect(dataContent).toContain('most_recent = true');
      expect(dataContent).toContain('owners      = ["amazon"]');
    });

    test('AMI filters for x86_64 architecture', () => {
      expect(dataContent).toContain('architecture');
      expect(dataContent).toContain('x86_64');
    });

    test('AMI filters for HVM virtualization', () => {
      expect(dataContent).toContain('virtualization-type');
      expect(dataContent).toContain('hvm');
    });

    test('Availability zones data source is defined', () => {
      expect(dataContent).toContain('data "aws_availability_zones"');
    });

    test('No external Secrets Manager data source', () => {
      expect(dataContent).not.toContain('data "aws_secretsmanager_secret"');
    });
  });

  describe('EC2 Module', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    });

    test('EC2 module is called with for_each', () => {
      expect(mainContent).toContain('module "ec2_instances"');
      expect(mainContent).toContain('for_each = var.ec2_instances');
    });

    test('Module source points to local module', () => {
      expect(mainContent).toContain('source = "./modules/ec2"');
    });

    test('Module receives environment_suffix parameter', () => {
      expect(mainContent).toContain('environment_suffix');
    });

    test('Module receives AMI from data source', () => {
      expect(mainContent).toContain('ami_id');
      expect(mainContent).toContain('data.aws_ami.amazon_linux_2023.id');
    });
  });

  describe('EC2 Module Files', () => {
    let moduleMainContent: string;
    let moduleVarsContent: string;
    let moduleOutputsContent: string;

    beforeAll(() => {
      moduleMainContent = fs.readFileSync(path.join(LIB_DIR, 'modules', 'ec2', 'main.tf'), 'utf8');
      moduleVarsContent = fs.readFileSync(path.join(LIB_DIR, 'modules', 'ec2', 'variables.tf'), 'utf8');
      moduleOutputsContent = fs.readFileSync(path.join(LIB_DIR, 'modules', 'ec2', 'outputs.tf'), 'utf8');
    });

    test('Module creates EC2 instance', () => {
      expect(moduleMainContent).toContain('resource "aws_instance" "this"');
    });

    test('Module uses IMDSv2 required', () => {
      expect(moduleMainContent).toContain('http_tokens                 = "required"');
    });

    test('Module enables root volume encryption', () => {
      expect(moduleMainContent).toContain('encrypted             = true');
    });

    test('Module has instance_name variable', () => {
      expect(moduleVarsContent).toContain('variable "instance_name"');
    });

    test('Module has environment_suffix variable', () => {
      expect(moduleVarsContent).toContain('variable "environment_suffix"');
    });

    test('Module outputs instance_id', () => {
      expect(moduleOutputsContent).toContain('output "instance_id"');
    });

    test('Module outputs private_ip', () => {
      expect(moduleOutputsContent).toContain('output "private_ip"');
    });

    test('Module outputs public_ip', () => {
      expect(moduleOutputsContent).toContain('output "public_ip"');
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
    });

    test('VPC ID output is defined', () => {
      expect(outputsContent).toContain('output "vpc_id"');
    });

    test('ALB DNS name output is defined', () => {
      expect(outputsContent).toContain('output "alb_dns_name"');
    });

    test('RDS endpoint output is defined and sensitive', () => {
      expect(outputsContent).toContain('output "rds_endpoint"');
      expect(outputsContent).toMatch(/output "rds_endpoint"[\s\S]*sensitive\s*=\s*true/);
    });

    test('EC2 instance IDs output is defined', () => {
      expect(outputsContent).toContain('output "ec2_instance_ids"');
    });

    test('S3 state bucket output is defined', () => {
      expect(outputsContent).toContain('output "s3_state_bucket"');
    });

    test('DynamoDB lock table output is defined', () => {
      expect(outputsContent).toContain('output "dynamodb_lock_table"');
    });

    test('Environment suffix output is defined', () => {
      expect(outputsContent).toContain('output "environment_suffix"');
    });
  });

  describe('Backend Configuration', () => {
    let backendContent: string;

    beforeAll(() => {
      backendContent = fs.readFileSync(path.join(LIB_DIR, 'backend.tf'), 'utf8');
    });

    test('Backend configuration is commented out for CI/CD', () => {
      expect(backendContent).toContain('# Backend configuration commented out');
    });

    test('S3 bucket resource is created', () => {
      expect(backendContent).toContain('resource "aws_s3_bucket" "terraform_state"');
    });

    test('S3 bucket versioning is enabled', () => {
      expect(backendContent).toContain('resource "aws_s3_bucket_versioning"');
      expect(backendContent).toContain('status = "Enabled"');
    });

    test('S3 bucket encryption is configured', () => {
      expect(backendContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
    });

    test('S3 public access is blocked', () => {
      expect(backendContent).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(backendContent).toContain('block_public_acls       = true');
    });

    test('DynamoDB lock table is created', () => {
      expect(backendContent).toContain('resource "aws_dynamodb_table" "terraform_lock"');
    });

    test('KMS key for state encryption is created', () => {
      expect(backendContent).toContain('resource "aws_kms_key" "terraform_state"');
    });
  });

  describe('No Hardcoded Values', () => {
    const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));

    tfFiles.forEach(file => {
      test(`${file} does not contain hardcoded environment names`, () => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        const linesWithoutComments = content.split('\n').filter(line => !line.trim().startsWith('#'));
        const cleanContent = linesWithoutComments.join('\n');

        expect(cleanContent).not.toMatch(/["\s]prod[-"]|["\s]dev[-"]|["\s]stage[-"]/);
      });
    });
  });
});
