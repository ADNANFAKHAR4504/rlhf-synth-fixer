import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');
  let terraformFiles: string[];

  beforeAll(() => {
    terraformFiles = fs.readdirSync(libDir).filter(file => file.endsWith('.tf'));
  });

  describe('File Structure', () => {
    it('should have main.tf file', () => {
      expect(terraformFiles).toContain('main.tf');
    });

    it('should have variables.tf file', () => {
      expect(terraformFiles).toContain('variables.tf');
    });

    it('should have outputs.tf file', () => {
      expect(terraformFiles).toContain('outputs.tf');
    });

    it('should have all required resource files', () => {
      const requiredFiles = ['vpc.tf', 'ecs.tf', 'rds.tf', 'alb.tf', 'cloudfront.tf', 'waf.tf', 'kms.tf', 'cloudwatch.tf'];
      requiredFiles.forEach(file => {
        expect(terraformFiles).toContain(file);
      });
    });
  });

  describe('main.tf Configuration', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf-8');
    });

    it('should configure AWS provider', () => {
      expect(mainTfContent).toContain('provider "aws"');
    });

    it('should specify required Terraform version', () => {
      expect(mainTfContent).toContain('required_version');
    });

    it('should configure S3 backend', () => {
      expect(mainTfContent).toContain('backend "s3"');
    });

    it('should use AWS provider version ~> 5.0', () => {
      expect(mainTfContent).toContain('version = "~> 5.0"');
    });

    it('should define default tags', () => {
      expect(mainTfContent).toContain('default_tags');
    });

    it('should include common tags for all resources', () => {
      expect(mainTfContent).toContain('CostCenter');
      expect(mainTfContent).toContain('Environment');
      expect(mainTfContent).toContain('Compliance');
      expect(mainTfContent).toContain('ManagedBy');
    });

    it('should use random provider for database password', () => {
      expect(mainTfContent).toContain('random_password');
    });
  });

  describe('variables.tf Configuration', () => {
    let variablesTfContent: string;

    beforeAll(() => {
      variablesTfContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
    });

    it('should define environment_suffix variable', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
    });

    it('should define region variable with default', () => {
      expect(variablesTfContent).toContain('variable "region"');
      expect(variablesTfContent).toContain('ap-southeast-1');
    });

    it('should mark sensitive variables as sensitive', () => {
      const sensitiveVars = ['db_username', 'db_password'];
      sensitiveVars.forEach(varName => {
        const varRegex = new RegExp(`variable "${varName}"[\\s\\S]*?sensitive\\s*=\\s*true`, 'm');
        expect(variablesTfContent).toMatch(varRegex);
      });
    });

    it('should have ECS configuration variables', () => {
      const ecsVars = ['container_image', 'container_port', 'desired_task_count', 'cpu', 'memory'];
      ecsVars.forEach(varName => {
        expect(variablesTfContent).toContain(`variable "${varName}"`);
      });
    });

    it('should have RDS configuration variables', () => {
      const rdsVars = ['db_name', 'db_username', 'db_password'];
      rdsVars.forEach(varName => {
        expect(variablesTfContent).toContain(`variable "${varName}"`);
      });
    });

    it('should have VPC configuration variables', () => {
      expect(variablesTfContent).toContain('variable "vpc_cidr"');
      expect(variablesTfContent).toContain('variable "availability_zones"');
    });
  });

  describe('VPC Configuration', () => {
    let vpcTfContent: string;

    beforeAll(() => {
      vpcTfContent = fs.readFileSync(path.join(libDir, 'vpc.tf'), 'utf-8');
    });

    it('should create VPC with environment_suffix in name', () => {
      expect(vpcTfContent).toContain('resource "aws_vpc" "main"');
      expect(vpcTfContent).toMatch(/vpc-\$\{var\.environment_suffix\}/);
    });

    it('should create public subnets', () => {
      expect(vpcTfContent).toContain('resource "aws_subnet" "public"');
    });

    it('should create private subnets', () => {
      expect(vpcTfContent).toContain('resource "aws_subnet" "private"');
    });

    it('should create database subnets', () => {
      expect(vpcTfContent).toContain('resource "aws_subnet" "database"');
    });

    it('should create internet gateway', () => {
      expect(vpcTfContent).toContain('resource "aws_internet_gateway"');
    });

    it('should create NAT gateways', () => {
      expect(vpcTfContent).toContain('resource "aws_nat_gateway"');
    });

    it('should enable DNS support and hostnames', () => {
      expect(vpcTfContent).toContain('enable_dns_support');
      expect(vpcTfContent).toContain('enable_dns_hostnames');
    });

    it('should create VPC flow logs', () => {
      expect(vpcTfContent).toContain('resource "aws_flow_log"');
    });
  });

  describe('ECS Configuration', () => {
    let ecsTfContent: string;

    beforeAll(() => {
      ecsTfContent = fs.readFileSync(path.join(libDir, 'ecs.tf'), 'utf-8');
    });

    it('should create ECS cluster with environment_suffix', () => {
      expect(ecsTfContent).toContain('resource "aws_ecs_cluster" "main"');
      expect(ecsTfContent).toMatch(/ecs-cluster-\$\{var\.environment_suffix\}/);
    });

    it('should enable Container Insights', () => {
      expect(ecsTfContent).toContain('containerInsights');
    });

    it('should create task definition', () => {
      expect(ecsTfContent).toContain('resource "aws_ecs_task_definition"');
    });

    it('should use Fargate compatibility', () => {
      expect(ecsTfContent).toContain('FARGATE');
    });

    it('should create ECS service', () => {
      expect(ecsTfContent).toContain('resource "aws_ecs_service" "main"');
    });

    it('should configure auto-scaling', () => {
      expect(ecsTfContent).toContain('resource "aws_appautoscaling_target"');
      expect(ecsTfContent).toContain('resource "aws_appautoscaling_policy"');
    });

    it('should use Fargate Spot for cost optimization', () => {
      expect(ecsTfContent).toContain('FARGATE_SPOT');
    });

    it('should configure health check grace period', () => {
      expect(ecsTfContent).toContain('health_check_grace_period_seconds');
    });

    it('should create CloudWatch log group for ECS', () => {
      expect(ecsTfContent).toContain('resource "aws_cloudwatch_log_group" "ecs"');
    });
  });

  describe('RDS Configuration', () => {
    let rdsTfContent: string;

    beforeAll(() => {
      rdsTfContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');
    });

    it('should create Aurora cluster with environment_suffix', () => {
      expect(rdsTfContent).toContain('resource "aws_rds_cluster" "main"');
      expect(rdsTfContent).toMatch(/aurora-cluster-\$\{var\.environment_suffix\}/);
    });

    it('should use Aurora PostgreSQL', () => {
      expect(rdsTfContent).toContain('aurora-postgresql');
    });

    it('should use KMS encryption', () => {
      expect(rdsTfContent).toContain('kms_key_id');
    });

    it('should configure serverless v2 scaling', () => {
      expect(rdsTfContent).toContain('serverlessv2_scaling_configuration');
    });

    it('should enable CloudWatch logs export', () => {
      expect(rdsTfContent).toContain('enabled_cloudwatch_logs_exports');
    });

    it('should create writer instance', () => {
      expect(rdsTfContent).toContain('resource "aws_rds_cluster_instance" "writer"');
    });

    it('should create reader instance', () => {
      expect(rdsTfContent).toContain('resource "aws_rds_cluster_instance" "reader"');
    });

    it('should create DB subnet group', () => {
      expect(rdsTfContent).toContain('resource "aws_db_subnet_group"');
    });
  });

  describe('ALB Configuration', () => {
    let albTfContent: string;

    beforeAll(() => {
      albTfContent = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf-8');
    });

    it('should create application load balancer', () => {
      expect(albTfContent).toContain('resource "aws_lb" "main"');
      expect(albTfContent).toContain('load_balancer_type = "application"');
    });

    it('should enable access logs', () => {
      expect(albTfContent).toContain('access_logs');
    });

    it('should create S3 bucket for logs', () => {
      expect(albTfContent).toContain('resource "aws_s3_bucket" "alb_logs"');
    });

    it('should enable S3 bucket encryption', () => {
      expect(albTfContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
    });

    it('should block public access to logs bucket', () => {
      expect(albTfContent).toContain('resource "aws_s3_bucket_public_access_block"');
    });

    it('should create target group', () => {
      expect(albTfContent).toContain('resource "aws_lb_target_group"');
    });

    it('should configure health check', () => {
      expect(albTfContent).toContain('health_check');
    });

    it('should create HTTP listener', () => {
      expect(albTfContent).toContain('resource "aws_lb_listener" "http"');
    });

    it('should set deregistration delay', () => {
      expect(albTfContent).toContain('deregistration_delay');
    });
  });

  describe('CloudFront Configuration', () => {
    let cloudfrontTfContent: string;

    beforeAll(() => {
      cloudfrontTfContent = fs.readFileSync(path.join(libDir, 'cloudfront.tf'), 'utf-8');
    });

    it('should create CloudFront distribution', () => {
      expect(cloudfrontTfContent).toContain('resource "aws_cloudfront_distribution" "main"');
    });

    it('should use ALB as origin', () => {
      expect(cloudfrontTfContent).toContain('aws_lb.main.dns_name');
    });

    it('should configure geo-restriction', () => {
      expect(cloudfrontTfContent).toContain('geo_restriction');
    });

    it('should create S3 bucket for CloudFront logs', () => {
      expect(cloudfrontTfContent).toContain('resource "aws_s3_bucket" "cloudfront_logs"');
    });

    it('should configure logging', () => {
      expect(cloudfrontTfContent).toContain('logging_config');
    });
  });

  describe('WAF Configuration', () => {
    let wafTfContent: string;

    beforeAll(() => {
      wafTfContent = fs.readFileSync(path.join(libDir, 'waf.tf'), 'utf-8');
    });

    it('should create WAF web ACL', () => {
      expect(wafTfContent).toContain('resource "aws_wafv2_web_acl"');
    });

    it('should configure for regional scope', () => {
      expect(wafTfContent).toContain('scope = "REGIONAL"');
    });

    it('should enable CloudWatch metrics', () => {
      expect(wafTfContent).toContain('metric_name');
    });
  });

  describe('KMS Configuration', () => {
    let kmsTfContent: string;

    beforeAll(() => {
      kmsTfContent = fs.readFileSync(path.join(libDir, 'kms.tf'), 'utf-8');
    });

    it('should create KMS key for ECS', () => {
      expect(kmsTfContent).toContain('resource "aws_kms_key" "ecs"');
    });

    it('should create KMS key for RDS', () => {
      expect(kmsTfContent).toContain('resource "aws_kms_key" "rds"');
    });

    it('should create KMS key for CloudWatch', () => {
      expect(kmsTfContent).toContain('resource "aws_kms_key" "cloudwatch"');
    });

    it('should create KMS aliases', () => {
      expect(kmsTfContent).toContain('resource "aws_kms_alias"');
    });
  });

  describe('CloudWatch Configuration', () => {
    let cloudwatchTfContent: string;

    beforeAll(() => {
      cloudwatchTfContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf-8');
    });

    it('should create CloudWatch dashboard', () => {
      expect(cloudwatchTfContent).toContain('resource "aws_cloudwatch_dashboard"');
    });

    it('should create metric alarms', () => {
      expect(cloudwatchTfContent).toContain('resource "aws_cloudwatch_metric_alarm"');
    });

    it('should monitor ECS CPU', () => {
      expect(cloudwatchTfContent).toContain('ecs-cpu') ||
        expect(cloudwatchTfContent).toContain('CPUUtilization');
    });

    it('should monitor ECS memory', () => {
      expect(cloudwatchTfContent).toContain('ecs-memory') ||
        expect(cloudwatchTfContent).toContain('MemoryUtilization');
    });

    it('should monitor RDS', () => {
      expect(cloudwatchTfContent).toContain('rds') ||
        expect(cloudwatchTfContent).toContain('DatabaseConnections');
    });
  });

  describe('Security Groups Configuration', () => {
    let securityGroupsTfContent: string;

    beforeAll(() => {
      securityGroupsTfContent = fs.readFileSync(path.join(libDir, 'security-groups.tf'), 'utf-8');
    });

    it('should create security group for ALB', () => {
      expect(securityGroupsTfContent).toContain('resource "aws_security_group" "alb"');
    });

    it('should create security group for ECS tasks', () => {
      expect(securityGroupsTfContent).toContain('resource "aws_security_group" "ecs_tasks"');
    });

    it('should create security group for RDS', () => {
      expect(securityGroupsTfContent).toContain('resource "aws_security_group" "rds"');
    });

    it('should allow HTTP/HTTPS on ALB', () => {
      expect(securityGroupsTfContent).toContain('80') ||
        expect(securityGroupsTfContent).toContain('443');
    });
  });

  describe('Outputs Configuration', () => {
    let outputsTfContent: string;

    beforeAll(() => {
      outputsTfContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');
    });

    it('should output VPC ID', () => {
      expect(outputsTfContent).toContain('output "vpc_id"');
    });

    it('should output ALB DNS name', () => {
      expect(outputsTfContent).toContain('output "alb_dns_name"');
    });

    it('should output RDS cluster endpoint', () => {
      expect(outputsTfContent).toContain('output "rds_cluster_endpoint"');
    });

    it('should output ECS cluster name', () => {
      expect(outputsTfContent).toContain('output "ecs_cluster_name"');
    });

    it('should output CloudFront distribution domain', () => {
      expect(outputsTfContent).toContain('output "cloudfront_distribution_domain"');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environment_suffix in all resource names', () => {
      terraformFiles.forEach(file => {
        if (file !== 'variables.tf' && file !== 'main.tf') {
          const content = fs.readFileSync(path.join(libDir, file), 'utf-8');
          const hasResources = content.includes('resource "');
          const hasEnvironmentSuffix = content.includes('${var.environment_suffix}');

          if (hasResources) {
            expect(hasEnvironmentSuffix).toBe(true);
          }
        }
      });
    });
  });
});
