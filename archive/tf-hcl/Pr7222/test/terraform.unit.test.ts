// test/terraform.unit.test.ts
// Unit tests for Terraform infrastructure configuration
// These tests validate the structure and configuration without deploying

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Structure', () => {
    test('provider.tf exists', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('variables.tf exists', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test('vpc.tf exists', () => {
      const vpcPath = path.join(LIB_DIR, 'vpc.tf');
      expect(fs.existsSync(vpcPath)).toBe(true);
    });

    test('rds.tf exists', () => {
      const rdsPath = path.join(LIB_DIR, 'rds.tf');
      expect(fs.existsSync(rdsPath)).toBe(true);
    });

    test('ec2.tf exists', () => {
      const ec2Path = path.join(LIB_DIR, 'ec2.tf');
      expect(fs.existsSync(ec2Path)).toBe(true);
    });

    test('alb.tf exists', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      expect(fs.existsSync(albPath)).toBe(true);
    });

    test('security_groups.tf exists', () => {
      const sgPath = path.join(LIB_DIR, 'security_groups.tf');
      expect(fs.existsSync(sgPath)).toBe(true);
    });

    test('cloudwatch.tf exists', () => {
      const cwPath = path.join(LIB_DIR, 'cloudwatch.tf');
      expect(fs.existsSync(cwPath)).toBe(true);
    });

    test('route53.tf exists', () => {
      const r53Path = path.join(LIB_DIR, 'route53.tf');
      expect(fs.existsSync(r53Path)).toBe(true);
    });

    test('outputs.tf exists', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      expect(fs.existsSync(outputsPath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    const providerContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');

    test('declares AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('requires Terraform version >= 1.4.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test('uses AWS provider >= 5.0', () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('configures S3 backend', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
    });
  });

  describe('Variables Configuration', () => {
    const variablesContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');

    test('declares aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('declares environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('declares deployment_color variable for blue-green deployment', () => {
      expect(variablesContent).toMatch(/variable\s+"deployment_color"\s*{/);
    });

    test('declares ASG sizing variables', () => {
      expect(variablesContent).toMatch(/variable\s+"asg_min_size"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"asg_max_size"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"asg_desired_capacity"\s*{/);
    });

    test('has validation for deployment_color', () => {
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/blue|green/);
    });
  });

  describe('VPC Configuration', () => {
    const vpcContent = fs.readFileSync(path.join(LIB_DIR, 'vpc.tf'), 'utf8');

    test('creates VPC with correct CIDR block', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(vpcContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('enables DNS hostnames and support', () => {
      expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates 3 public subnets', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(vpcContent).toMatch(/count\s*=\s*3/);
    });

    test('creates 3 private subnets', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(vpcContent).toMatch(/count\s*=\s*3/);
    });

    test('creates 3 NAT gateways for high availability', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(vpcContent).toMatch(/count\s*=\s*3/);
    });

    test('creates Internet Gateway', () => {
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('includes environment_suffix in VPC name', () => {
      expect(vpcContent).toMatch(/payment-vpc-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Aurora RDS Configuration', () => {
    const rdsContent = fs.readFileSync(path.join(LIB_DIR, 'rds.tf'), 'utf8');

    test('creates Aurora PostgreSQL cluster', () => {
      expect(rdsContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"/);
      expect(rdsContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('has 7-day backup retention', () => {
      expect(rdsContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test('has encryption enabled', () => {
      expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('has deletion_protection set to false for CI/CD', () => {
      expect(rdsContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('has skip_final_snapshot set to true for CI/CD', () => {
      expect(rdsContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('creates writer instance', () => {
      expect(rdsContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_writer"/);
    });

    test('creates 2 reader instances', () => {
      expect(rdsContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_reader_1"/);
      expect(rdsContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_reader_2"/);
    });

    test('stores credentials in Secrets Manager', () => {
      expect(rdsContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_credentials"/);
    });

    test('includes environment_suffix in cluster identifier', () => {
      expect(rdsContent).toMatch(/payment-aurora-cluster-\$\{var\.environment_suffix\}/);
    });
  });

  describe('EC2 Auto Scaling Configuration', () => {
    const ec2Content = fs.readFileSync(path.join(LIB_DIR, 'ec2.tf'), 'utf8');

    test('creates blue and green launch templates', () => {
      expect(ec2Content).toMatch(/resource\s+"aws_launch_template"\s+"blue"/);
      expect(ec2Content).toMatch(/resource\s+"aws_launch_template"\s+"green"/);
    });

    test('uses t3.medium instance type', () => {
      expect(ec2Content).toMatch(/instance_type\s*=\s*"t3\.medium"/);
    });

    test('creates blue and green Auto Scaling Groups', () => {
      expect(ec2Content).toMatch(/resource\s+"aws_autoscaling_group"\s+"blue"/);
      expect(ec2Content).toMatch(/resource\s+"aws_autoscaling_group"\s+"green"/);
    });

    test('configures ASG with correct size constraints', () => {
      expect(ec2Content).toMatch(/min_size\s*=.*asg_min_size/);
      expect(ec2Content).toMatch(/max_size\s*=.*asg_max_size/);
      expect(ec2Content).toMatch(/desired_capacity\s*=.*asg_desired_capacity/);
    });

    test('uses ELB health check type', () => {
      expect(ec2Content).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test('has 300 second health check grace period', () => {
      expect(ec2Content).toMatch(/health_check_grace_period\s*=\s*300/);
    });

    test('creates IAM role for EC2 instances', () => {
      expect(ec2Content).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test('includes environment_suffix in ASG names', () => {
      expect(ec2Content).toMatch(/payment-asg-blue-\$\{var\.environment_suffix\}/);
      expect(ec2Content).toMatch(/payment-asg-green-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Application Load Balancer Configuration', () => {
    const albContent = fs.readFileSync(path.join(LIB_DIR, 'alb.tf'), 'utf8');

    test('creates Application Load Balancer', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(albContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('creates blue and green target groups', () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"blue"/);
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"green"/);
    });

    test('configures health checks with 30-second interval', () => {
      expect(albContent).toMatch(/interval\s*=\s*30/);
    });

    test('has 45-second deregistration delay', () => {
      expect(albContent).toMatch(/deregistration_delay\s*=\s*45/);
    });

    test('has deletion protection disabled for CI/CD', () => {
      expect(albContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test('health check path is /health', () => {
      expect(albContent).toMatch(/path\s*=\s*"\/health"/);
    });

    test('includes environment_suffix in ALB name', () => {
      expect(albContent).toMatch(/payment-alb-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Security Groups Configuration', () => {
    const sgContent = fs.readFileSync(path.join(LIB_DIR, 'security_groups.tf'), 'utf8');

    test('creates ALB security group', () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('creates EC2 security group', () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    });

    test('creates Aurora security group', () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"/);
    });

    test('ALB allows HTTP and HTTPS from internet', () => {
      expect(sgContent).toMatch(/from_port\s*=\s*80/);
      expect(sgContent).toMatch(/from_port\s*=\s*443/);
    });

    test('Aurora allows PostgreSQL port 5432', () => {
      expect(sgContent).toMatch(/from_port\s*=\s*5432/);
    });

    test('includes environment_suffix in security group names', () => {
      expect(sgContent).toMatch(/payment-alb-sg-\$\{var\.environment_suffix\}/);
      expect(sgContent).toMatch(/payment-ec2-sg-\$\{var\.environment_suffix\}/);
      expect(sgContent).toMatch(/payment-aurora-sg-\$\{var\.environment_suffix\}/);
    });
  });

  describe('CloudWatch Configuration', () => {
    const cwContent = fs.readFileSync(path.join(LIB_DIR, 'cloudwatch.tf'), 'utf8');

    test('creates alarm for Aurora database connections', () => {
      expect(cwContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_connections_high"/);
      expect(cwContent).toMatch(/metric_name\s*=\s*"DatabaseConnections"/);
    });

    test('Aurora connections alarm threshold is 80', () => {
      expect(cwContent).toMatch(/threshold\s*=\s*80/);
    });

    test('creates SNS topic for alarms', () => {
      expect(cwContent).toMatch(/resource\s+"aws_sns_topic"\s+"cloudwatch_alarms"/);
    });

    test('creates CloudWatch dashboard', () => {
      expect(cwContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });

    test('creates alarms for ALB health', () => {
      expect(cwContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_unhealthy_targets"/);
    });

    test('includes environment_suffix in alarm names', () => {
      expect(cwContent).toMatch(/payment-aurora-connections-high-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Route 53 Configuration', () => {
    const r53Content = fs.readFileSync(path.join(LIB_DIR, 'route53.tf'), 'utf8');

    test('creates health check for ALB', () => {
      expect(r53Content).toMatch(/resource\s+"aws_route53_health_check"\s+"alb_primary"/);
    });

    test('health check uses 30-second interval', () => {
      expect(r53Content).toMatch(/request_interval\s*=\s*30/);
    });

    test('creates CloudWatch alarm for health check', () => {
      expect(r53Content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"route53_health_check"/);
    });

    test('includes environment_suffix in health check name', () => {
      expect(r53Content).toMatch(/payment-alb-health-check-\$\{var\.environment_suffix\}/);
    });
  });

  describe('KMS Configuration', () => {
    const kmsContent = fs.readFileSync(path.join(LIB_DIR, 'kms.tf'), 'utf8');

    test('creates KMS key for Aurora', () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"aurora"/);
    });

    test('creates KMS key for CloudWatch', () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"cloudwatch"/);
    });

    test('enables key rotation', () => {
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('includes environment_suffix in KMS key aliases', () => {
      expect(kmsContent).toMatch(/payment-aurora-\$\{var\.environment_suffix\}/);
      expect(kmsContent).toMatch(/payment-cloudwatch-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Outputs Configuration', () => {
    const outputsContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');

    test('outputs VPC information', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
      expect(outputsContent).toMatch(/output\s+"vpc_cidr_block"/);
    });

    test('outputs subnet IDs', () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('outputs ALB information', () => {
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
      expect(outputsContent).toMatch(/output\s+"alb_arn"/);
    });

    test('outputs Aurora endpoints', () => {
      expect(outputsContent).toMatch(/output\s+"aurora_cluster_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"aurora_reader_endpoint"/);
    });

    test('outputs ASG names', () => {
      expect(outputsContent).toMatch(/output\s+"asg_blue_name"/);
      expect(outputsContent).toMatch(/output\s+"asg_green_name"/);
    });

    test('outputs deployment color', () => {
      expect(outputsContent).toMatch(/output\s+"active_deployment_color"/);
    });

    test('outputs security group IDs', () => {
      expect(outputsContent).toMatch(/output\s+"alb_security_group_id"/);
      expect(outputsContent).toMatch(/output\s+"ec2_security_group_id"/);
      expect(outputsContent).toMatch(/output\s+"aurora_security_group_id"/);
    });
  });

  describe('Resource Naming Standards', () => {
    const allFiles = [
      'vpc.tf', 'rds.tf', 'ec2.tf', 'alb.tf',
      'security_groups.tf', 'cloudwatch.tf', 'route53.tf', 'kms.tf'
    ];

    test.each(allFiles)('%s uses environment_suffix in resource names', (filename) => {
      const content = fs.readFileSync(path.join(LIB_DIR, filename), 'utf8');
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test.each(allFiles)('%s does not hardcode environment names', (filename) => {
      const content = fs.readFileSync(path.join(LIB_DIR, filename), 'utf8');
      expect(content).not.toMatch(/-prod[^a-z]/);
      expect(content).not.toMatch(/-dev[^a-z]/);
      expect(content).not.toMatch(/-staging[^a-z]/);
    });
  });

  describe('CI/CD Compliance', () => {
    const rdsContent = fs.readFileSync(path.join(LIB_DIR, 'rds.tf'), 'utf8');
    const albContent = fs.readFileSync(path.join(LIB_DIR, 'alb.tf'), 'utf8');

    test('RDS has no prevent_destroy lifecycle', () => {
      expect(rdsContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test('RDS has deletion_protection disabled', () => {
      expect(rdsContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('RDS has skip_final_snapshot enabled', () => {
      expect(rdsContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('ALB has deletion protection disabled', () => {
      expect(albContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });
  });
});
