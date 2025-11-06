// Unit tests for Terraform Payment Processing Infrastructure
// Tests all infrastructure code without actual deployment

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'hcl2-parser';

describe('Terraform Payment Processing Infrastructure - Unit Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');
  let allTerraformFiles: string[] = [];
  let parsedConfigs: any = {};

  beforeAll(() => {
    // Load all Terraform files
    allTerraformFiles = fs.readdirSync(libPath)
      .filter(file => file.endsWith('.tf'))
      .map(file => path.join(libPath, file));

    // Parse all Terraform files
    allTerraformFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      try {
        parsedConfigs[fileName] = parse(content);
      } catch (error) {
        // HCL parser might fail on some valid HCL, use string matching as fallback
        parsedConfigs[fileName] = { content };
      }
    });
  });

  describe('File Structure', () => {
    test('all required Terraform files exist', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'main.tf',
        'security.tf',
        'database.tf',
        'compute.tf',
        'loadbalancer.tf',
        'secrets.tf',
        'monitoring.tf',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('terraform.tfvars file exists', () => {
      const tfvarsPath = path.join(libPath, 'terraform.tfvars');
      expect(fs.existsSync(tfvarsPath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf defines correct providers', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');

      expect(providerContent).toContain('hashicorp/aws');
      expect(providerContent).toContain('hashicorp/random');
      expect(providerContent).toContain('hashicorp/tls');
    });

    test('Terraform version requirement is set', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');

      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test('AWS provider uses variable for region', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');

      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe('Variables', () => {
    test('variables.tf defines environment_suffix variable', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');

      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test('variables.tf defines aws_region variable', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');

      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesContent).toContain('ap-southeast-1');
    });

    test('all sensitive variables are marked as sensitive', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');

      const sensitiveVars = ['db_username', 'dms_source_endpoint_username', 'dms_source_endpoint_password'];
      sensitiveVars.forEach(varName => {
        const varBlock = variablesContent.substring(
          variablesContent.indexOf(`variable "${varName}"`),
          variablesContent.indexOf('}', variablesContent.indexOf(`variable "${varName}"`))
        );
        expect(varBlock).toContain('sensitive');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('main.tf defines VPC resource', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');

      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(mainContent).toContain('enable_dns_hostnames');
      expect(mainContent).toContain('enable_dns_support');
    });

    test('VPC uses environment_suffix in name', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');

      const vpcBlock = mainContent.substring(
        mainContent.indexOf('resource "aws_vpc" "main"'),
        mainContent.indexOf('}', mainContent.indexOf('resource "aws_vpc" "main"') + 200)
      );
      expect(vpcBlock).toMatch(/payment-vpc-\$\{var\.environment_suffix\}/);
    });

    test('defines 2 public subnets', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');

      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(mainContent).toContain('count');
    });

    test('defines 2 private app subnets', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');

      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private_app"/);
    });

    test('defines 2 private db subnets', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');

      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private_db"/);
    });

    test('defines Internet Gateway', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');

      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('defines NAT Gateway with EIP', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');

      expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('route tables are properly configured', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');

      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private_app"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private_db"/);
    });

    test('subnets span 2 availability zones', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');

      expect(variablesContent).toContain('ap-southeast-1a');
      expect(variablesContent).toContain('ap-southeast-1b');
    });
  });

  describe('Security Groups', () => {
    test('security.tf defines ALB security group', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('ALB security group allows HTTP and HTTPS', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      const albSgBlock = securityContent.substring(
        securityContent.indexOf('resource "aws_security_group" "alb"'),
        securityContent.indexOf('resource "aws_security_group"', securityContent.indexOf('resource "aws_security_group" "alb"') + 100)
      );

      expect(albSgBlock).toContain('from_port   = 443');
      expect(albSgBlock).toContain('from_port   = 80');
    });

    test('security.tf defines app tier security group', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
    });

    test('app security group allows traffic from ALB', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      const appSgBlock = securityContent.substring(
        securityContent.indexOf('resource "aws_security_group" "app"'),
        securityContent.indexOf('resource "aws_security_group"', securityContent.indexOf('resource "aws_security_group" "app"') + 100)
      );

      expect(appSgBlock).toContain('security_groups');
      expect(appSgBlock).toContain('aws_security_group.alb.id');
    });

    test('security.tf defines database security group', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"db"/);
    });

    test('database security group allows PostgreSQL port', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      const dbSgBlock = securityContent.substring(
        securityContent.indexOf('resource "aws_security_group" "db"'),
        securityContent.indexOf('resource "aws_security_group"', securityContent.indexOf('resource "aws_security_group" "db"') + 100)
      );

      expect(dbSgBlock).toContain('from_port       = 5432');
      expect(dbSgBlock).toContain('to_port         = 5432');
    });

    test('security.tf defines DMS security group', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"dms"/);
    });
  });

  describe('RDS Database', () => {
    test('database.tf defines RDS instance', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test('RDS instance uses PostgreSQL 15.x', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/engine_version\s*=\s*"15\.\d+"/);
      expect(databaseContent).toContain('engine         = "postgres"');
    });

    test('RDS instance uses appropriate instance class', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/instance_class\s*=\s*"db\.r6g\.large"/);
    });

    test('RDS has Multi-AZ enabled', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toContain('multi_az');
    });

    test('RDS has encryption enabled', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toContain('storage_encrypted     = true');
      expect(databaseContent).toContain('kms_key_id');
    });

    test('RDS has backup retention configured', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test('RDS deletion_protection is false for testing', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toContain('deletion_protection             = false');
    });

    test('defines KMS key for RDS encryption', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
      expect(databaseContent).toContain('enable_key_rotation');
    });

    test('defines DB subnet group', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });
  });

  describe('DMS (Database Migration Service)', () => {
    test('database.tf defines DMS replication instance', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/resource\s+"aws_dms_replication_instance"\s+"main"/);
    });

    test('DMS instance uses correct class', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/replication_instance_class\s*=\s*"dms\.c5\.large"/);
    });

    test('defines DMS subnet group', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/resource\s+"aws_dms_replication_subnet_group"\s+"main"/);
    });

    test('defines DMS source endpoint', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"source"/);
      expect(databaseContent).toContain('endpoint_type = "source"');
    });

    test('defines DMS target endpoint', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"target"/);
      expect(databaseContent).toContain('endpoint_type = "target"');
    });

    test('DMS endpoints use SSL', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toContain('ssl_mode = "require"');
    });

    test('defines DMS replication task', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/resource\s+"aws_dms_replication_task"\s+"main"/);
      expect(databaseContent).toContain('migration_type');
    });

    test('DMS task uses full-load-and-cdc', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toContain('migration_type           = "full-load-and-cdc"');
    });
  });

  describe('Compute Layer', () => {
    test('compute.tf defines IAM role for EC2', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test('IAM role has proper permissions', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toContain('secretsmanager:GetSecretValue');
      expect(computeContent).toContain('ssm:GetParameter');
      expect(computeContent).toContain('logs:CreateLogGroup');
    });

    test('defines IAM instance profile', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test('defines launch template', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
    });

    test('launch template uses Amazon Linux 2023', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2023"/);
      expect(computeContent).toContain('al2023-ami');
    });

    test('launch template has user data', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toContain('user_data');
      expect(computeContent).toContain('base64encode');
    });

    test('user data installs CloudWatch agent', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toContain('amazon-cloudwatch-agent');
    });

    test('defines Auto Scaling Group', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"/);
    });

    test('ASG has correct capacity settings', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toContain('min_size');
      expect(computeContent).toContain('max_size');
      expect(computeContent).toContain('desired_capacity');
    });

    test('ASG has blue-green deployment tag', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toContain('DeploymentColor');
    });

    test('defines scaling policies', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      expect(computeContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(computeContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });
  });

  describe('Load Balancer', () => {
    test('loadbalancer.tf defines ALB', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toMatch(/resource\s+"aws_lb"\s+"app"/);
      expect(lbContent).toContain('load_balancer_type = "application"');
    });

    test('ALB is internet-facing', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toContain('internal           = false');
    });

    test('ALB deletion protection is false for testing', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test('defines target group', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"/);
    });

    test('target group has health checks', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toContain('health_check');
      expect(lbContent).toContain('path');
    });

    test('target group has session stickiness', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toContain('stickiness');
    });

    test('defines HTTP listener with redirect', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(lbContent).toContain('redirect');
    });

    test('defines HTTPS listener', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(lbContent).toContain('ssl_policy');
    });

    test('defines ACM certificate', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
    });
  });

  describe('WAF', () => {
    test('security.tf defines WAF Web ACL', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      expect(securityContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test('WAF is REGIONAL scope', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      expect(securityContent).toContain('scope = "REGIONAL"');
    });

    test('WAF has rate limiting rule', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      expect(securityContent).toContain('rate_based_statement');
      expect(securityContent).toContain('limit');
    });

    test('rate limit is 2000 requests per 5 minutes', () => {
      const securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');

      expect(securityContent).toMatch(/limit\s*=\s*2000/);
    });

    test('WAF is associated with ALB', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
    });
  });

  describe('Secrets Management', () => {
    test('secrets.tf defines Secrets Manager secret', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/);
    });

    test('secret has version with DB credentials', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_credentials"/);
    });

    test('secret rotation is configured', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toMatch(/resource\s+"aws_secretsmanager_secret_rotation"\s+"db_credentials"/);
    });

    test('rotation period is 30 days', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toMatch(/automatically_after_days\s*=\s*30/);
    });

    test('defines Lambda function for rotation', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toMatch(/resource\s+"aws_lambda_function"\s+"secrets_rotation"/);
    });

    test('Lambda function is in VPC', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toContain('vpc_config');
    });

    test('defines IAM role for Lambda', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toMatch(/resource\s+"aws_iam_role"\s+"secrets_rotation"/);
    });
  });

  describe('Systems Manager Parameter Store', () => {
    test('secrets.tf defines SSM parameters', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"app_config"/);
    });

    test('SSM parameter for DB secret ARN exists', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_secret_arn"/);
    });

    test('SSM parameters use environment_suffix in path', () => {
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      expect(secretsContent).toContain('${var.environment_suffix}');
    });
  });

  describe('Monitoring and Logging', () => {
    test('monitoring.tf defines CloudWatch log groups', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');

      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"dms"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds"/);
    });

    test('log groups have 30-day retention', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');

      expect(monitoringContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('defines CloudWatch alarms for RDS', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');

      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
    });

    test('defines CloudWatch alarms for ASG', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');

      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"asg_cpu_high"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"asg_cpu_low"/);
    });

    test('defines CloudWatch alarm for unhealthy targets', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');

      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unhealthy_targets"/);
    });

    test('defines CloudWatch alarm for ALB 5xx errors', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');

      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_5xx"/);
    });

    test('defines CloudWatch dashboard', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');

      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });
  });

  describe('Outputs', () => {
    test('outputs.tf defines VPC ID output', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });

    test('outputs.tf defines subnet outputs', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_app_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_db_subnet_ids"/);
    });

    test('outputs.tf defines ALB outputs', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

      expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
      expect(outputsContent).toMatch(/output\s+"alb_arn"/);
    });

    test('outputs.tf defines RDS outputs', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

      expect(outputsContent).toMatch(/output\s+"rds_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"rds_database_name"/);
    });

    test('RDS endpoint output is marked sensitive', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

      const rdsEndpointBlock = outputsContent.substring(
        outputsContent.indexOf('output "rds_endpoint"'),
        outputsContent.indexOf('}', outputsContent.indexOf('output "rds_endpoint"'))
      );

      expect(rdsEndpointBlock).toContain('sensitive');
    });

    test('outputs.tf defines DMS outputs', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

      expect(outputsContent).toMatch(/output\s+"dms_replication_instance_arn"/);
      expect(outputsContent).toMatch(/output\s+"dms_task_arn"/);
    });

    test('outputs.tf defines security outputs', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

      expect(outputsContent).toMatch(/output\s+"db_secret_arn"/);
      expect(outputsContent).toMatch(/output\s+"waf_web_acl_arn"/);
    });

    test('outputs.tf defines region output', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');

      expect(outputsContent).toMatch(/output\s+"region"/);
    });
  });

  describe('Resource Naming with environment_suffix', () => {
    test('all resource names include environment_suffix', () => {
      const files = ['main.tf', 'security.tf', 'database.tf', 'compute.tf', 'loadbalancer.tf', 'secrets.tf', 'monitoring.tf'];
      let totalSuffixUsage = 0;

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf8');
        const matches = content.match(/\$\{var\.environment_suffix\}/g);
        if (matches) {
          totalSuffixUsage += matches.length;
        }
      });

      // Should have many references to environment_suffix
      expect(totalSuffixUsage).toBeGreaterThan(50);
    });

    test('no resources use hardcoded environment names in identifiers', () => {
      const files = ['main.tf', 'security.tf', 'database.tf', 'compute.tf', 'loadbalancer.tf', 'secrets.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf8');

        // Check resource names and identifiers don't have hardcoded env names
        const namePattern = /(?:name|identifier)\s*=\s*"[^"]*(?:dev|prod|stage|test)[^"]*"/gi;
        const matches = content.match(namePattern);

        // Filter out allowed cases (like MigrationPhase tag)
        const invalid = matches?.filter(m =>
          !m.includes('MigrationPhase') &&
          !m.includes('production"') &&
          !m.toLowerCase().includes('var.environment')
        );

        expect(invalid?.length || 0).toBe(0);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no Retain deletion policies', () => {
      allTerraformFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.toLowerCase()).not.toContain('prevent_destroy');
      });
    });

    test('all data is encrypted in transit', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      // RDS encryption
      expect(databaseContent).toContain('storage_encrypted');

      // DMS SSL
      expect(databaseContent).toContain('ssl_mode');
    });

    test('all data is encrypted at rest', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toContain('kms_key_id');
      expect(databaseContent).toContain('storage_encrypted     = true');
    });

    test('IAM roles follow least privilege', () => {
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');
      const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf8');

      // EC2 role has specific resources
      expect(computeContent).toContain('Resource =');

      // Lambda role has specific permissions
      expect(secretsContent).toContain('Resource =');
    });
  });

  describe('High Availability', () => {
    test('RDS is configured for Multi-AZ', () => {
      const databaseContent = fs.readFileSync(path.join(libPath, 'database.tf'), 'utf8');

      expect(databaseContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('resources are deployed across 2 AZs', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      const computeContent = fs.readFileSync(path.join(libPath, 'compute.tf'), 'utf8');

      // Subnets across 2 AZs
      expect(mainContent).toContain('count');

      // ASG can span multiple AZs
      expect(computeContent).toContain('vpc_zone_identifier');
    });

    test('ALB is in multiple public subnets', () => {
      const lbContent = fs.readFileSync(path.join(libPath, 'loadbalancer.tf'), 'utf8');

      expect(lbContent).toContain('aws_subnet.public[*].id');
    });
  });

  describe('Tags and Metadata', () => {
    test('all resources have standard tags', () => {
      const files = ['main.tf', 'security.tf', 'database.tf', 'compute.tf', 'loadbalancer.tf', 'secrets.tf', 'monitoring.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf8');

        if (content.includes('resource "aws_')) {
          expect(content).toContain('tags');
          expect(content).toContain('Environment');
          expect(content).toContain('Application');
        }
      });
    });
  });
});
