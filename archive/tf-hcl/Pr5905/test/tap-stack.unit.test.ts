import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'hcl2-parser';

describe('Terraform Blue-Green Deployment Configuration Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');
  let parsedFiles: Record<string, any> = {};

  beforeAll(async () => {
    const tfFiles = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

    for (const file of tfFiles) {
      const filePath = path.join(libDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      try {
        parsedFiles[file] = await parse(filePath, content);
      } catch (err) {
        console.warn(`Could not parse ${file}:`, err);
        parsedFiles[file] = { content };
      }
    }
  });

  describe('Configuration Structure Tests', () => {
    test('should have main.tf with required terraform configuration', () => {
      expect(parsedFiles['main.tf']).toBeDefined();
      const mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('terraform');
      expect(mainContent).toContain('required_version');
      expect(mainContent).toContain('required_providers');
      expect(mainContent).toContain('provider "aws"');
    });

    test('should have variables.tf with all required variables', () => {
      expect(parsedFiles['variables.tf']).toBeDefined();
      const varsContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');

      const requiredVars = [
        'environment_suffix',
        'region',
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'db_subnet_ids',
        'ami_id',
        'instance_type',
        'db_master_username',
        'db_master_password',
        'hosted_zone_id',
        'domain_name'
      ];

      requiredVars.forEach(varName => {
        expect(varsContent).toContain(`variable "${varName}"`);
      });
    });

    test('should have outputs.tf with all expected outputs', () => {
      expect(parsedFiles['outputs.tf']).toBeDefined();
      const outputsContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');

      const requiredOutputs = [
        'alb_dns_name',
        'alb_arn',
        'blue_asg_name',
        'green_asg_name',
        'blue_target_group_arn',
        'green_target_group_arn',
        'rds_cluster_endpoint',
        'rds_proxy_endpoint',
        'artifacts_bucket_name'
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toContain(`output "${output}"`);
      });
    });
  });

  describe('Resource Configuration Tests', () => {
    test('should have ALB configuration in alb.tf', () => {
      expect(parsedFiles['alb.tf']).toBeDefined();
      const albContent = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf-8');

      expect(albContent).toContain('resource "aws_lb" "main"');
      expect(albContent).toContain('resource "aws_lb_target_group" "blue"');
      expect(albContent).toContain('resource "aws_lb_target_group" "green"');
      expect(albContent).toContain('resource "aws_lb_listener" "http"');
    });

    test('should have Auto Scaling Groups for blue and green', () => {
      expect(parsedFiles['asg.tf']).toBeDefined();
      const asgContent = fs.readFileSync(path.join(libDir, 'asg.tf'), 'utf-8');

      expect(asgContent).toContain('resource "aws_autoscaling_group" "blue"');
      expect(asgContent).toContain('resource "aws_autoscaling_group" "green"');
      expect(asgContent).toContain('resource "aws_autoscaling_policy"');
    });

    test('should have Launch Templates for blue and green environments', () => {
      expect(parsedFiles['launch_templates.tf']).toBeDefined();
      const ltContent = fs.readFileSync(path.join(libDir, 'launch_templates.tf'), 'utf-8');

      expect(ltContent).toContain('resource "aws_launch_template" "blue"');
      expect(ltContent).toContain('resource "aws_launch_template" "green"');
      expect(ltContent).toContain('user_data');
    });

    test('should have RDS Aurora cluster configuration', () => {
      expect(parsedFiles['rds.tf']).toBeDefined();
      const rdsContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');

      expect(rdsContent).toContain('resource "aws_rds_cluster" "main"');
      expect(rdsContent).toContain('resource "aws_rds_cluster_instance"');
      expect(rdsContent).toContain('resource "aws_db_proxy" "main"');
      expect(rdsContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
    });

    test('should have Route53 weighted routing records', () => {
      expect(parsedFiles['route53.tf']).toBeDefined();
      const r53Content = fs.readFileSync(path.join(libDir, 'route53.tf'), 'utf-8');

      expect(r53Content).toContain('resource "aws_route53_record" "blue"');
      expect(r53Content).toContain('resource "aws_route53_record" "green"');
      expect(r53Content).toContain('weighted_routing_policy');
    });

    test('should have S3 bucket configuration', () => {
      expect(parsedFiles['s3.tf']).toBeDefined();
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf-8');

      expect(s3Content).toContain('resource "aws_s3_bucket" "artifacts"');
      expect(s3Content).toContain('resource "aws_s3_bucket_versioning"');
      expect(s3Content).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(s3Content).toContain('resource "aws_s3_bucket_public_access_block"');
    });
  });

  describe('Security Configuration Tests', () => {
    test('should have security groups for all components', () => {
      expect(parsedFiles['security_groups.tf']).toBeDefined();
      const sgContent = fs.readFileSync(path.join(libDir, 'security_groups.tf'), 'utf-8');

      expect(sgContent).toContain('resource "aws_security_group" "alb"');
      expect(sgContent).toContain('resource "aws_security_group" "ec2"');
      expect(sgContent).toContain('resource "aws_security_group" "rds"');
      expect(sgContent).toContain('resource "aws_security_group" "rds_proxy"');
    });

    test('should have IAM roles and policies', () => {
      expect(parsedFiles['iam.tf']).toBeDefined();
      const iamContent = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf-8');

      expect(iamContent).toContain('resource "aws_iam_role"');
      expect(iamContent).toContain('resource "aws_iam_policy"');
      expect(iamContent).toContain('resource "aws_iam_instance_profile"');
    });

    test('S3 bucket should have encryption enabled', () => {
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf-8');
      expect(s3Content).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(s3Content).toContain('sse_algorithm');
    });

    test('S3 bucket should block public access', () => {
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf-8');
      expect(s3Content).toContain('aws_s3_bucket_public_access_block');
      expect(s3Content).toContain('block_public_acls');
      expect(s3Content).toContain('block_public_policy');
    });

    test('RDS should have encryption enabled', () => {
      const rdsContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');
      expect(rdsContent).toContain('storage_encrypted = true');
    });
  });

  describe('Environment Suffix Usage Tests', () => {
    test('ALB should use environment_suffix in name', () => {
      const albContent = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf-8');
      expect(albContent).toMatch(/name\s*=\s*".*\$\{var\.environment_suffix\}"/);
    });

    test('Target groups should use environment_suffix in names', () => {
      const albContent = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf-8');
      expect(albContent).toMatch(/tg-blue-\$\{var\.environment_suffix\}/);
      expect(albContent).toMatch(/tg-green-\$\{var\.environment_suffix\}/);
    });

    test('Auto Scaling Groups should use environment_suffix in names', () => {
      const asgContent = fs.readFileSync(path.join(libDir, 'asg.tf'), 'utf-8');
      expect(asgContent).toMatch(/asg-blue-\$\{var\.environment_suffix\}/);
      expect(asgContent).toMatch(/asg-green-\$\{var\.environment_suffix\}/);
    });

    test('RDS cluster should use environment_suffix in identifier', () => {
      const rdsContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');
      expect(rdsContent).toMatch(/aurora-cluster-\$\{var\.environment_suffix\}/);
    });

    test('S3 bucket should use environment_suffix in name', () => {
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf-8');
      expect(s3Content).toMatch(/app-artifacts-\$\{var\.environment_suffix\}/);
    });

    test('Security groups should use environment_suffix in names', () => {
      const sgContent = fs.readFileSync(path.join(libDir, 'security_groups.tf'), 'utf-8');
      expect(sgContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('IAM resources should use environment_suffix in names', () => {
      const iamContent = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf-8');
      expect(iamContent).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe('CloudWatch Monitoring Tests', () => {
    test('should have CloudWatch alarms for blue environment', () => {
      expect(parsedFiles['cloudwatch.tf']).toBeDefined();
      const cwContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf-8');

      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "blue_unhealthy_hosts"');
      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "blue_cpu_high"');
      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "blue_request_count_high"');
    });

    test('should have CloudWatch alarms for green environment', () => {
      const cwContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf-8');

      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "green_unhealthy_hosts"');
      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "green_cpu_high"');
      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "green_request_count_high"');
    });

    test('should have CloudWatch alarms for RDS', () => {
      const cwContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf-8');

      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "rds_cpu_high"');
      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "rds_connections_high"');
    });

    test('should have CloudWatch alarms for ALB', () => {
      const cwContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf-8');

      expect(cwContent).toContain('resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors"');
    });

    test('should have SNS topic for alarm notifications', () => {
      const cwContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf-8');

      expect(cwContent).toContain('resource "aws_sns_topic"');
    });
  });

  describe('Blue-Green Deployment Features Tests', () => {
    test('should support weighted traffic routing', () => {
      const r53Content = fs.readFileSync(path.join(libDir, 'route53.tf'), 'utf-8');
      expect(r53Content).toContain('weighted_routing_policy');
      expect(r53Content).toContain('weight');
    });

    test('should have separate target groups for blue and green', () => {
      const albContent = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf-8');
      expect(albContent).toMatch(/resource "aws_lb_target_group" "blue"/);
      expect(albContent).toMatch(/resource "aws_lb_target_group" "green"/);
    });

    test('should tag resources with deployment type and version', () => {
      const asgContent = fs.readFileSync(path.join(libDir, 'asg.tf'), 'utf-8');
      expect(asgContent).toContain('DeploymentType');
      expect(asgContent).toContain('Version');
      expect(asgContent).toContain('Environment');
    });

    test('should configure instance refresh for rolling updates', () => {
      const asgContent = fs.readFileSync(path.join(libDir, 'asg.tf'), 'utf-8');
      expect(asgContent).toContain('instance_refresh');
      expect(asgContent).toContain('strategy = "Rolling"');
    });
  });

  describe('High Availability Tests', () => {
    test('should use multiple availability zones', () => {
      const dataContent = fs.readFileSync(path.join(libDir, 'data.tf'), 'utf-8');
      expect(dataContent).toContain('data "aws_availability_zones"');
    });

    test('ALB should be internet-facing and in public subnets', () => {
      const albContent = fs.readFileSync(path.join(libDir, 'alb.tf'), 'utf-8');
      expect(albContent).toMatch(/subnets.*var\.public_subnet_ids/);
    });

    test('ASG should maintain minimum instances', () => {
      const asgContent = fs.readFileSync(path.join(libDir, 'asg.tf'), 'utf-8');
      expect(asgContent).toMatch(/min_size\s*=\s*var\.min_instances/);
    });

    test('RDS should have multiple reader instances', () => {
      const rdsContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');
      expect(rdsContent).toContain('resource "aws_rds_cluster_instance" "reader"');
      expect(rdsContent).toContain('count');
    });
  });

  describe('Best Practices Tests', () => {
    test('should enable versioning on S3 bucket', () => {
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf-8');
      expect(s3Content).toContain('aws_s3_bucket_versioning');
      expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should have lifecycle policies for S3 bucket', () => {
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf-8');
      expect(s3Content).toContain('aws_s3_bucket_lifecycle_configuration');
    });

    test('should skip final snapshot for test RDS', () => {
      const rdsContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');
      expect(rdsContent).toContain('skip_final_snapshot');
    });

    test('should have user data script for EC2 instances', () => {
      const ltContent = fs.readFileSync(path.join(libDir, 'launch_templates.tf'), 'utf-8');
      expect(ltContent).toContain('user_data');
      expect(fs.existsSync(path.join(libDir, 'user_data.sh'))).toBe(true);
    });

    test('should use RDS Proxy for connection pooling', () => {
      const rdsContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');
      expect(rdsContent).toContain('resource "aws_db_proxy" "main"');
      expect(rdsContent).toContain('connection_pool_config');
    });

    test('should have backup retention for RDS', () => {
      const rdsContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');
      expect(rdsContent).toContain('backup_retention_period');
    });

    test('should enable CloudWatch logs for RDS', () => {
      const rdsContent = fs.readFileSync(path.join(libDir, 'rds.tf'), 'utf-8');
      expect(rdsContent).toContain('enabled_cloudwatch_logs_exports');
    });

    test('should have health check grace period for ASG', () => {
      const asgContent = fs.readFileSync(path.join(libDir, 'asg.tf'), 'utf-8');
      expect(asgContent).toContain('health_check_grace_period');
      expect(asgContent).toContain('health_check_type');
    });
  });

  describe('Terraform Provider Version Tests', () => {
    test('should specify minimum Terraform version', () => {
      const mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf-8');
      expect(mainContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test('should specify AWS provider version constraint', () => {
      const mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('hashicorp/aws');
      expect(mainContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('should have provider default tags configured', () => {
      const mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf-8');
      expect(mainContent).toContain('default_tags');
      expect(mainContent).toContain('EnvironmentSuffix');
    });
  });
});
