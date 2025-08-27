import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let terraformFiles: { [key: string]: any } = {};

  beforeAll(() => {
    // Load all .tf files in the lib directory
    const tfFiles = [
      'provider.tf',
      'variables.tf',
      'locals.tf',
      'vpc.tf',
      'security_groups.tf',
      'iam.tf',
      's3.tf',
      'rds.tf',
      'alb.tf',
      'autoscaling.tf',
      'outputs.tf'
    ];
    tfFiles.forEach(file => {
      const filePath = path.join(libPath, file);
      if (fs.existsSync(filePath)) {
        terraformFiles[file] = fs.readFileSync(filePath, 'utf8');
      }
    });
    // No terraform init to prevent test stalling
  });

  describe('Provider Configuration', () => {
    test('should have required Terraform version', () => {
      const providerContent = terraformFiles['provider.tf'];
      expect(providerContent).toContain('required_version = ">= 1.4.0"');
    });

    test('should have AWS provider configured', () => {
      const providerContent = terraformFiles['provider.tf'];
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('hashicorp/aws');
      expect(providerContent).toContain('version = ">= 5.0"');
    });

    test('should use variable for AWS region', () => {
      const providerContent = terraformFiles['provider.tf'];
      expect(providerContent).toContain('region = var.aws_region');
    });
  });

  describe('Variables Configuration', () => {
    test('should define all required variables', () => {
      const variablesContent = terraformFiles['variables.tf'];
      const requiredVars = [
        'aws_region',
        'environment_tag',
        'vpc_cidr',
        'db_username',
        'db_password',
        'domain_name'
      ];
      requiredVars.forEach(varName => {
        expect(variablesContent).toContain(`variable "${varName}"`);
      });
    });

    test('should have proper variable descriptions', () => {
      const variablesContent = terraformFiles['variables.tf'];
      expect(variablesContent).toContain('description = "AWS region for resources"');
      expect(variablesContent).toContain('description = "Environment tag in format Environment-Name"');
      expect(variablesContent).toContain('description = "CIDR block for VPC"');
    });
  });

  describe('Locals and Random Suffix', () => {
    test('should define random_id for deployment', () => {
      const localsContent = terraformFiles['locals.tf'];
      expect(localsContent).toContain('resource "random_id" "deployment"');
    });

    test('should define random_id for bucket_suffix', () => {
      const localsContent = terraformFiles['locals.tf'];
      expect(localsContent).toContain('resource "random_id" "bucket_suffix"');
    });
  });

  describe('VPC and Networking', () => {
    test('should define VPC with environment suffix', () => {
      const vpcContent = terraformFiles['vpc.tf'];
      expect(vpcContent).toContain('resource "aws_vpc" "main"');
      expect(vpcContent).toMatch(/\${var\.environment_tag}-vpc-\${random_id\.deployment\.hex}/);
    });

    test('should define public, private, and database subnets with environment suffix', () => {
      const vpcContent = terraformFiles['vpc.tf'];
      expect(vpcContent).toContain('resource "aws_subnet" "public"');
      expect(vpcContent).toContain('resource "aws_subnet" "private"');
      expect(vpcContent).toContain('resource "aws_subnet" "database"');
      expect(vpcContent).toMatch(/\${var\.environment_tag}-public-subnet-\${count\.index \+ 1}-\${random_id\.deployment\.hex}/);
      expect(vpcContent).toMatch(/\${var\.environment_tag}-private-subnet-\${count\.index \+ 1}-\${random_id\.deployment\.hex}/);
      expect(vpcContent).toMatch(/\${var\.environment_tag}-db-subnet-\${count\.index \+ 1}-\${random_id\.deployment\.hex}/);
    });

    test('should have NAT Gateway and route tables', () => {
      const vpcContent = terraformFiles['vpc.tf'];
      expect(vpcContent).toContain('resource "aws_nat_gateway" "main"');
      expect(vpcContent).toContain('resource "aws_route_table" "public"');
      expect(vpcContent).toContain('resource "aws_route_table" "private"');
      expect(vpcContent).toContain('resource "aws_route_table_association" "public"');
      expect(vpcContent).toContain('resource "aws_route_table_association" "private"');
    });
  });

  describe('Security Groups', () => {
    test('should define ALB, app, and db security groups with environment suffix', () => {
      const sgContent = terraformFiles['security_groups.tf'];
      expect(sgContent).toContain('resource "aws_security_group" "alb"');
      expect(sgContent).toContain('resource "aws_security_group" "app"');
      expect(sgContent).toContain('resource "aws_security_group" "db"');
      expect(sgContent).toMatch(/\${var\.environment_tag}-alb-sg-\${random_id\.deployment\.hex}/);
      expect(sgContent).toMatch(/\${var\.environment_tag}-app-sg-\${random_id\.deployment\.hex}/);
      expect(sgContent).toMatch(/\${var\.environment_tag}-db-sg-\${random_id\.deployment\.hex}/);
    });

    test('should block SSH from 0.0.0.0/0', () => {
      const sgContent = terraformFiles['security_groups.tf'];
      expect(sgContent).not.toMatch(/cidr_blocks\s*=\s*\["0.0.0.0\/0"\]\s*.*from_port\s*=\s*22/);
    });

    test('should allow HTTP/HTTPS from ALB to app', () => {
      const sgContent = terraformFiles['security_groups.tf'];
      expect(sgContent).toContain('security_groups = [aws_security_group.alb.id]');
    });
  });

  describe('IAM Role and Policy', () => {
    test('should define EC2 role and instance profile with environment suffix', () => {
      const iamContent = terraformFiles['iam.tf'];
      expect(iamContent).toContain('resource "aws_iam_role" "ec2_role"');
      expect(iamContent).toContain('resource "aws_iam_instance_profile" "ec2_profile"');
      expect(iamContent).toMatch(/\${var\.environment_tag}-ec2-role-\${random_id\.deployment\.hex}/);
      expect(iamContent).toMatch(/\${var\.environment_tag}-ec2-profile-\${random_id\.deployment\.hex}/);
    });

    test('should define least privilege EC2 S3 policy', () => {
      const iamContent = terraformFiles['iam.tf'];
      expect(iamContent).toContain('s3:GetObject');
      expect(iamContent).toContain('s3:PutObject');
      expect(iamContent).toContain('s3:DeleteObject');
      expect(iamContent).toContain('s3:ListBucket');
    });
  });

  describe('S3 Buckets', () => {
    test('should define app_data and access_logs buckets with environment suffix', () => {
      const s3Content = terraformFiles['s3.tf'];
      expect(s3Content).toContain('resource "aws_s3_bucket" "app_data"');
      expect(s3Content).toContain('resource "aws_s3_bucket" "access_logs"');
      expect(s3Content).toMatch(/-app-data-\${random_id\.bucket_suffix\.hex}/);
      expect(s3Content).toMatch(/-access-logs-\${random_id\.bucket_suffix\.hex}/);
    });

    test('should enable versioning and AES256 encryption', () => {
      const s3Content = terraformFiles['s3.tf'];
      expect(s3Content).toContain('resource "aws_s3_bucket_versioning" "access_logs"');
      expect(s3Content).toContain('resource "aws_s3_bucket_versioning" "app_data"');
      expect(s3Content).toContain('status = "Enabled"');
      expect(s3Content).toContain('sse_algorithm = "AES256"');
    });

    test('should block public access for all buckets', () => {
      const s3Content = terraformFiles['s3.tf'];
      expect(s3Content).toContain('resource "aws_s3_bucket_public_access_block" "access_logs"');
      expect(s3Content).toContain('resource "aws_s3_bucket_public_access_block" "app_data"');
      expect(s3Content).toContain('block_public_acls       = true');
      expect(s3Content).toContain('block_public_policy     = true');
      expect(s3Content).toContain('ignore_public_acls      = true');
      expect(s3Content).toContain('restrict_public_buckets = true');
    });

    test('should set up S3 bucket logging to access_logs bucket', () => {
      const s3Content = terraformFiles['s3.tf'];
      expect(s3Content).toContain('resource "aws_s3_bucket_logging" "app_data"');
      expect(s3Content).toContain('target_bucket = aws_s3_bucket.access_logs.id');
    });
  });

  describe('RDS Resources', () => {
    test('should define RDS subnet group and instance with environment suffix', () => {
      const rdsContent = terraformFiles['rds.tf'];
      expect(rdsContent).toContain('resource "aws_db_subnet_group" "main"');
      expect(rdsContent).toContain('resource "aws_db_instance" "main"');
      expect(rdsContent).toMatch(/\${lower\(var\.environment_tag\)}-db-subnet-group-\${random_id\.deployment\.hex}/);
      expect(rdsContent).toMatch(/\${lower\(var\.environment_tag\)}-database-\${random_id\.deployment\.hex}/);
    });

    test('should enable storage encryption and backup', () => {
      const rdsContent = terraformFiles['rds.tf'];
      expect(rdsContent).toContain('storage_encrypted       = true');
      expect(rdsContent).toContain('backup_retention_period = 7');
    });
  });

  describe('ALB Resources', () => {
    test('should define ALB, target group, listeners with environment suffix', () => {
      const albContent = terraformFiles['alb.tf'];
      expect(albContent).toContain('resource "aws_lb" "main"');
      expect(albContent).toContain('resource "aws_lb_target_group" "main"');
      expect(albContent).toContain('resource "aws_lb_listener" "https"');
      expect(albContent).toContain('resource "aws_lb_listener" "http"');
      expect(albContent).toMatch(/\${lower\(var\.environment_tag\)}-alb-\${random_id\.deployment\.hex}/);
      expect(albContent).toMatch(/\${lower\(var\.environment_tag\)}-tg-\${random_id\.deployment\.hex}/);
    });

    test('should enforce SSL/TLS policy on ALB', () => {
      const albContent = terraformFiles['alb.tf'];
      expect(albContent).toContain('ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"');
    });
  });

  describe('Auto Scaling', () => {
    test('should use dynamic AMI for launch template', () => {
      const autoscalingContent = terraformFiles['autoscaling.tf'];
      expect(autoscalingContent).toContain('data "aws_ami" "amazon_linux2"');
      expect(autoscalingContent).toContain('image_id      = data.aws_ami.amazon_linux2.id');
    });

    test('should define launch template and auto scaling group with environment suffix', () => {
      const autoscalingContent = terraformFiles['autoscaling.tf'];
      expect(autoscalingContent).toContain('resource "aws_launch_template" "main"');
      expect(autoscalingContent).toContain('resource "aws_autoscaling_group" "main"');
      expect(autoscalingContent).toMatch(/\${var\.environment_tag}-lt-\${random_id\.deployment\.hex}-/);
      expect(autoscalingContent).toMatch(/\${var\.environment_tag}-asg-\${random_id\.deployment\.hex}/);
    });

    test('should pass required tags to instances and ASG', () => {
      const autoscalingContent = terraformFiles['autoscaling.tf'];
      expect(autoscalingContent).toContain('tag_specifications');
      expect(autoscalingContent).toContain('resource_type = "instance"');
      expect(autoscalingContent).toContain('Environment = var.environment_tag');
      expect(autoscalingContent).toContain('Name        = "${var.environment_tag}-instance-${random_id.deployment.hex}"');
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const outputsContent = terraformFiles['outputs.tf'];
      const requiredOutputs = [
        'deployment_id',
        'vpc_id',
        'public_subnets',
        'private_subnets',
        'db_subnets',
        'alb_dns_name',
        'alb_https_url',
        'rds_endpoint',
        's3_app_bucket',
        's3_logs_bucket',
        'autoscaling_group_name',
        'resource_summary'
      ];
      requiredOutputs.forEach(output => {
        expect(outputsContent).toContain(`output "${output}"`);
      });
    });

    test('should have proper output descriptions', () => {
      const outputsContent = terraformFiles['outputs.tf'];
      expect(outputsContent).toContain('description = "Unique deployment identifier"');
      expect(outputsContent).toContain('description = "ID of the VPC"');
      expect(outputsContent).toContain('description = "DNS name of the load balancer"');
    });
  });

  // Removed terraform fmt check as requested
  // No CLI checks in unit tests to avoid failure due to formatting

  describe('Resource Naming with Suffix', () => {
    test('should apply environment suffix to all resource names', () => {
      // S3 naming uses a different pattern, so remove s3.tf from this test!
      const files = ['vpc.tf','security_groups.tf','iam.tf','rds.tf','alb.tf','autoscaling.tf'];
      files.forEach(file => {
        const content = terraformFiles[file];
        expect(content).toMatch(/\${var\.environment_tag}.*(\${random_id\.deployment\.hex})/);
      });
    });
  });

  describe('Tags and Metadata', () => {
    test('should apply consistent tags to resources', () => {
      const files = ['vpc.tf','security_groups.tf','iam.tf','s3.tf','rds.tf','alb.tf','autoscaling.tf'];
      files.forEach(file => {
        const content = terraformFiles[file];
        expect(content).toContain('tags = {');
        expect(content).toContain('Environment = var.environment_tag');
      });
    });
  });
});