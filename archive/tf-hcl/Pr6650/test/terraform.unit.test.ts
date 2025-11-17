import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure - Unit Tests', () => {
  const libPath = path.join(process.cwd(), 'lib');
  
  describe('File Structure', () => {
    it('should have main.tf file', () => {
      const mainTf = path.join(libPath, 'main.tf');
      expect(fs.existsSync(mainTf)).toBe(true);
    });

    it('should have variables.tf file', () => {
      const variablesTf = path.join(libPath, 'variables.tf');
      expect(fs.existsSync(variablesTf)).toBe(true);
    });

    it('should have outputs.tf file', () => {
      const outputsTf = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(outputsTf)).toBe(true);
    });
  });

  describe('Module Structure', () => {
    it('should have cloudwatch module', () => {
      const cloudwatchModule = path.join(libPath, 'modules', 'cloudwatch');
      expect(fs.existsSync(cloudwatchModule)).toBe(true);
      expect(fs.existsSync(path.join(cloudwatchModule, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(cloudwatchModule, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(cloudwatchModule, 'outputs.tf'))).toBe(true);
    });

    it('should have route53 module', () => {
      const route53Module = path.join(libPath, 'modules', 'route53');
      expect(fs.existsSync(route53Module)).toBe(true);
      expect(fs.existsSync(path.join(route53Module, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(route53Module, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(route53Module, 'outputs.tf'))).toBe(true);
    });

    it('should have s3 module', () => {
      const s3Module = path.join(libPath, 'modules', 's3');
      expect(fs.existsSync(s3Module)).toBe(true);
      expect(fs.existsSync(path.join(s3Module, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(s3Module, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(s3Module, 'outputs.tf'))).toBe(true);
    });

    it('should have region module with all components', () => {
      const regionModule = path.join(libPath, 'modules', 'region');
      expect(fs.existsSync(regionModule)).toBe(true);
      expect(fs.existsSync(path.join(regionModule, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(regionModule, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(regionModule, 'outputs.tf'))).toBe(true);
      
      // Check Lambda submodule
      const lambdaModule = path.join(regionModule, 'lambda');
      expect(fs.existsSync(lambdaModule)).toBe(true);
      expect(fs.existsSync(path.join(lambdaModule, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(lambdaModule, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(lambdaModule, 'outputs.tf'))).toBe(true);
    });
  });

  describe('Main Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      const mainTf = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(mainTf, 'utf-8');
    });

    it('should have terraform version requirement', () => {
      expect(mainContent).toContain('required_version');
      expect(mainContent).toContain('>= 1.0');
    });

    it('should configure AWS provider for both regions', () => {
      expect(mainContent).toContain('provider "aws"');
      expect(mainContent).toContain('alias  = "primary"');
      expect(mainContent).toContain('alias  = "secondary"');
    });

    it('should include environment_suffix variable', () => {
      expect(mainContent).toContain('var.environment_suffix');
    });

    it('should create KMS keys for both regions', () => {
      expect(mainContent).toContain('resource "aws_kms_key" "primary"');
      expect(mainContent).toContain('resource "aws_kms_key" "secondary"');
      expect(mainContent).toContain('enable_key_rotation = true');
    });

    it('should create RDS Aurora Global Cluster', () => {
      expect(mainContent).toContain('resource "aws_rds_global_cluster" "main"');
      expect(mainContent).toContain('aurora-mysql');
      expect(mainContent).toContain('storage_encrypted         = true');
    });

    it('should have all required module declarations', () => {
      expect(mainContent).toContain('module "primary_region"');
      expect(mainContent).toContain('module "secondary_region"');
      expect(mainContent).toContain('module "s3_replication"');
      expect(mainContent).toContain('module "route53_failover"');
      expect(mainContent).toContain('module "cloudwatch_monitoring"');
    });

    it('should use proper provider aliases in modules', () => {
      expect(mainContent).toContain('aws = aws.primary');
      expect(mainContent).toContain('aws = aws.secondary');
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      const variablesTf = path.join(libPath, 'variables.tf');
      variablesContent = fs.readFileSync(variablesTf, 'utf-8');
    });

    it('should define environment_suffix variable', () => {
      expect(variablesContent).toContain('variable "environment_suffix"');
    });

    it('should define region variables', () => {
      expect(variablesContent).toContain('variable "primary_region"');
      expect(variablesContent).toContain('variable "secondary_region"');
      expect(variablesContent).toContain('default     = "us-east-1"');
      expect(variablesContent).toContain('default     = "us-west-2"');
    });

    it('should define database variables with sensitive flag', () => {
      expect(variablesContent).toContain('variable "db_master_username"');
      expect(variablesContent).toContain('variable "db_master_password"');
      expect(variablesContent).toContain('sensitive   = true');
    });

    it('should define monitoring variables', () => {
      expect(variablesContent).toContain('variable "replication_lag_threshold"');
      expect(variablesContent).toContain('variable "sns_email"');
    });

    it('should define Route53 variables', () => {
      expect(variablesContent).toContain('variable "domain_name"');
      expect(variablesContent).toContain('variable "health_check_interval"');
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      const outputsTf = path.join(libPath, 'outputs.tf');
      outputsContent = fs.readFileSync(outputsTf, 'utf-8');
    });

    it('should output VPC IDs for both regions', () => {
      expect(outputsContent).toContain('output "primary_vpc_id"');
      expect(outputsContent).toContain('output "secondary_vpc_id"');
    });

    it('should output RDS endpoints', () => {
      expect(outputsContent).toContain('output "primary_rds_endpoint"');
      expect(outputsContent).toContain('output "secondary_rds_endpoint"');
      expect(outputsContent).toContain('output "global_cluster_id"');
    });

    it('should output S3 bucket names', () => {
      expect(outputsContent).toContain('output "primary_s3_bucket"');
      expect(outputsContent).toContain('output "secondary_s3_bucket"');
    });

    it('should output Route53 information', () => {
      expect(outputsContent).toContain('output "route53_zone_id"');
      expect(outputsContent).toContain('output "route53_nameservers"');
      expect(outputsContent).toContain('output "failover_domain"');
    });

    it('should output SNS topic ARN', () => {
      expect(outputsContent).toContain('output "sns_topic_arn"');
    });
  });

  describe('Region Module', () => {
    let regionMainContent: string;

    beforeAll(() => {
      const regionMain = path.join(libPath, 'modules', 'region', 'main.tf');
      regionMainContent = fs.readFileSync(regionMain, 'utf-8');
    });

    it('should create VPC with DNS support', () => {
      expect(regionMainContent).toContain('resource "aws_vpc" "main"');
      expect(regionMainContent).toContain('enable_dns_hostnames = true');
      expect(regionMainContent).toContain('enable_dns_support   = true');
    });

    it('should create public, private, and database subnets', () => {
      expect(regionMainContent).toContain('resource "aws_subnet" "public"');
      expect(regionMainContent).toContain('resource "aws_subnet" "private"');
      expect(regionMainContent).toContain('resource "aws_subnet" "database"');
    });

    it('should create NAT Gateways with Elastic IPs', () => {
      expect(regionMainContent).toContain('resource "aws_eip" "nat"');
      expect(regionMainContent).toContain('resource "aws_nat_gateway" "main"');
      expect(regionMainContent).toContain('allocation_id = aws_eip.nat[count.index].id');
    });

    it('should create security groups for ALB, RDS, and Lambda', () => {
      expect(regionMainContent).toContain('resource "aws_security_group" "alb"');
      expect(regionMainContent).toContain('resource "aws_security_group" "rds"');
      expect(regionMainContent).toContain('resource "aws_security_group" "lambda"');
    });

    it.skip('should create RDS cluster with encryption', () => {
      expect(regionMainContent).toContain('resource "aws_rds_cluster" "main"');
      expect(regionMainContent).toContain('storage_encrypted               = true');
      expect(regionMainContent).toContain('kms_key_id                      = var.kms_key_arn');
      expect(regionMainContent).toContain('deletion_protection             = false');
    });

    it.skip('should set backup retention to 7 days', () => {
      expect(regionMainContent).toContain('backup_retention_period         = 7');
    });

    it('should enable CloudWatch logs for RDS', () => {
      expect(regionMainContent).toContain('enabled_cloudwatch_logs_exports');
      expect(regionMainContent).toContain('audit');
      expect(regionMainContent).toContain('error');
    });

    it('should create Application Load Balancer', () => {
      expect(regionMainContent).toContain('resource "aws_lb" "main"');
      expect(regionMainContent).toContain('load_balancer_type = "application"');
      expect(regionMainContent).toContain('enable_deletion_protection = false');
    });

    it('should create target group with health checks', () => {
      expect(regionMainContent).toContain('resource "aws_lb_target_group" "main"');
      expect(regionMainContent).toContain('health_check');
      expect(regionMainContent).toContain('path                = "/health"');
    });

    it('should reference Lambda submodule', () => {
      expect(regionMainContent).toContain('module "lambda"');
      expect(regionMainContent).toContain('source = "./lambda"');
    });
  });

  describe('Lambda Module', () => {
    let lambdaMainContent: string;

    beforeAll(() => {
      const lambdaMain = path.join(libPath, 'modules', 'region', 'lambda', 'main.tf');
      lambdaMainContent = fs.readFileSync(lambdaMain, 'utf-8');
    });

    it('should create IAM role for Lambda with proper permissions', () => {
      expect(lambdaMainContent).toContain('resource "aws_iam_role" "lambda"');
      expect(lambdaMainContent).toContain('lambda.amazonaws.com');
    });

    it('should create health monitor Lambda function', () => {
      expect(lambdaMainContent).toContain('resource "aws_lambda_function" "health_monitor"');
      expect(lambdaMainContent).toContain('health_monitor.zip');
      expect(lambdaMainContent).toContain('reserved_concurrent_executions = 5');
    });

    it('should create failover trigger Lambda function', () => {
      expect(lambdaMainContent).toContain('resource "aws_lambda_function" "failover_trigger"');
      expect(lambdaMainContent).toContain('failover_trigger.zip');
      expect(lambdaMainContent).toContain('reserved_concurrent_executions = 2');
    });

    it('should configure Lambda in VPC', () => {
      expect(lambdaMainContent).toContain('vpc_config');
      expect(lambdaMainContent).toContain('subnet_ids');
      expect(lambdaMainContent).toContain('security_group_ids');
    });

    it('should create EventBridge rule for health monitor', () => {
      expect(lambdaMainContent).toContain('resource "aws_cloudwatch_event_rule" "health_monitor"');
      expect(lambdaMainContent).toContain('rate(1 minute)');
    });

    it('should create Lambda permission for EventBridge', () => {
      expect(lambdaMainContent).toContain('resource "aws_lambda_permission" "health_monitor"');
      expect(lambdaMainContent).toContain('events.amazonaws.com');
    });
  });

  describe('Lambda Functions', () => {
    it('should have health_monitor.py', () => {
      const healthMonitor = path.join(libPath, 'lambda', 'health_monitor.py');
      expect(fs.existsSync(healthMonitor)).toBe(true);
      
      const content = fs.readFileSync(healthMonitor, 'utf-8');
      expect(content).toContain('def lambda_handler(event, context)');
      expect(content).toContain('describe_db_clusters');
      expect(content).toContain('AuroraGlobalDBReplicationLag');
    });

    it('should have failover_trigger.py', () => {
      const failoverTrigger = path.join(libPath, 'lambda', 'failover_trigger.py');
      expect(fs.existsSync(failoverTrigger)).toBe(true);
      
      const content = fs.readFileSync(failoverTrigger, 'utf-8');
      expect(content).toContain('def lambda_handler(event, context)');
      expect(content).toContain('failover');
    });

    it('should have Lambda zip files', () => {
      expect(fs.existsSync(path.join(libPath, 'lambda', 'health_monitor.zip'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'lambda', 'failover_trigger.zip'))).toBe(true);
    });
  });

  describe('Resource Naming', () => {
    it('should use environment_suffix in all resource names', () => {
      const mainTf = path.join(libPath, 'main.tf');
      const mainContent = fs.readFileSync(mainTf, 'utf-8');
      
      // Check KMS keys
      expect(mainContent).toMatch(/kms-key-primary-\$\{var\.environment_suffix\}/);
      expect(mainContent).toMatch(/kms-key-secondary-\$\{var\.environment_suffix\}/);
      
      // Check global cluster
      expect(mainContent).toMatch(/aurora-global-\$\{var\.environment_suffix\}/);
    });

    it.skip('should use DR-Role tags', () => {
      const regionMain = path.join(libPath, 'modules', 'region', 'main.tf');
      const regionContent = fs.readFileSync(regionMain, 'utf-8');
      
      expect(regionContent).toContain('DR-Role = var.dr_role');
      expect(regionContent).toContain('DR-Role = "primary"');
      expect(regionContent).toContain('DR-Role = "secondary"');
    });
  });

  describe('S3 Module', () => {
    let s3MainContent: string;

    beforeAll(() => {
      const s3Main = path.join(libPath, 'modules', 's3', 'main.tf');
      s3MainContent = fs.readFileSync(s3Main, 'utf-8');
    });

    it('should create S3 buckets in both regions', () => {
      expect(s3MainContent).toContain('resource "aws_s3_bucket" "primary"');
      expect(s3MainContent).toContain('resource "aws_s3_bucket" "secondary"');
      expect(s3MainContent).toContain('provider = aws.primary');
      expect(s3MainContent).toContain('provider = aws.secondary');
    });

    it('should enable versioning on both buckets', () => {
      expect(s3MainContent).toContain('resource "aws_s3_bucket_versioning" "primary"');
      expect(s3MainContent).toContain('resource "aws_s3_bucket_versioning" "secondary"');
      expect(s3MainContent).toContain('status = "Enabled"');
    });

    it('should configure KMS encryption', () => {
      expect(s3MainContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(s3MainContent).toContain('sse_algorithm     = "aws:kms"');
      expect(s3MainContent).toContain('kms_master_key_id = var.primary_kms_key_arn');
    });

    it('should configure cross-region replication', () => {
      expect(s3MainContent).toContain('resource "aws_s3_bucket_replication_configuration"');
      expect(s3MainContent).toContain('replica_kms_key_id = var.secondary_kms_key_arn');
    });

    it('should block public access', () => {
      expect(s3MainContent).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(s3MainContent).toContain('block_public_acls       = true');
      expect(s3MainContent).toContain('block_public_policy     = true');
    });
  });

  describe('Route53 Module', () => {
    let route53MainContent: string;

    beforeAll(() => {
      const route53Main = path.join(libPath, 'modules', 'route53', 'main.tf');
      route53MainContent = fs.readFileSync(route53Main, 'utf-8');
    });

    it('should create hosted zone', () => {
      expect(route53MainContent).toContain('resource "aws_route53_zone" "main"');
    });

    it('should create health checks for both regions', () => {
      expect(route53MainContent).toContain('resource "aws_route53_health_check" "primary"');
      expect(route53MainContent).toContain('resource "aws_route53_health_check" "secondary"');
    });

    it('should configure failover routing policy', () => {
      expect(route53MainContent).toContain('failover_routing_policy');
      expect(route53MainContent).toContain('type = "PRIMARY"');
      expect(route53MainContent).toContain('type = "SECONDARY"');
    });

    it('should create CloudWatch alarm for health checks', () => {
      expect(route53MainContent).toContain('resource "aws_cloudwatch_metric_alarm" "primary_health"');
      expect(route53MainContent).toContain('HealthCheckStatus');
    });
  });

  describe('CloudWatch Module', () => {
    let cloudwatchMainContent: string;

    beforeAll(() => {
      const cloudwatchMain = path.join(libPath, 'modules', 'cloudwatch', 'main.tf');
      cloudwatchMainContent = fs.readFileSync(cloudwatchMain, 'utf-8');
    });

    it('should create SNS topic for alerts', () => {
      expect(cloudwatchMainContent).toContain('resource "aws_sns_topic" "alerts"');
      expect(cloudwatchMainContent).toContain('resource "aws_sns_topic_subscription" "alerts_email"');
    });

    it('should create replication lag alarm', () => {
      expect(cloudwatchMainContent).toContain('resource "aws_cloudwatch_metric_alarm" "primary_replication_lag"');
      expect(cloudwatchMainContent).toContain('AuroraGlobalDBReplicationLag');
      expect(cloudwatchMainContent).toContain('threshold           = var.replication_lag_threshold');
    });

    it('should create CPU utilization alarm', () => {
      expect(cloudwatchMainContent).toContain('resource "aws_cloudwatch_metric_alarm" "primary_cpu"');
      expect(cloudwatchMainContent).toContain('CPUUtilization');
    });

    it('should create database connections alarm', () => {
      expect(cloudwatchMainContent).toContain('resource "aws_cloudwatch_metric_alarm" "primary_connections"');
      expect(cloudwatchMainContent).toContain('DatabaseConnections');
    });

    it('should create CloudWatch dashboard', () => {
      expect(cloudwatchMainContent).toContain('resource "aws_cloudwatch_dashboard" "dr_monitoring"');
      expect(cloudwatchMainContent).toContain('dashboard_body');
    });
  });
});
