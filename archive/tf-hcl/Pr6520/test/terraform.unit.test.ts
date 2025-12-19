// Unit tests for Terraform payment processing infrastructure
// Tests Terraform configuration files for proper resource definitions

import fs from 'fs';
import path from 'path';

const LIB_PATH = path.resolve(__dirname, '../lib');

describe('Terraform Payment Processing Infrastructure - Unit Tests', () => {

  // Helper function to read HCL files
  const readHCL = (filename: string): string => {
    const filePath = path.join(LIB_PATH, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8');
  };

  describe('Infrastructure File Structure', () => {
    const requiredFiles = [
      'main.tf',
      'variables.tf',
      'outputs.tf',
      'provider.tf',
      'ecs.tf',
      'rds.tf',
      'alb.tf',
      'security-groups.tf',
      'ssm.tf',
      'cloudwatch.tf',
      'autoscaling.tf',
      'iam.tf'
    ];

    requiredFiles.forEach(file => {
      test(`${file} should exist`, () => {
        const filePath = path.join(LIB_PATH, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Provider Configuration', () => {
    let providerConfig: string;

    beforeAll(() => {
      providerConfig = readHCL('provider.tf');
    });

    test('should require Terraform version >= 1.4.0', () => {
      expect(providerConfig).toContain('required_version');
      expect(providerConfig).toContain('1.4.0');
    });

    test('should configure AWS provider >= 5.0', () => {
      expect(providerConfig).toContain('source');
      expect(providerConfig).toContain('hashicorp/aws');
      expect(providerConfig).toMatch(/version.*>=.*5\.0/);
    });

    test('should configure random provider', () => {
      expect(providerConfig).toContain('hashicorp/random');
    });
  });

  describe('VPC and Networking Resources', () => {
    let mainConfig: string;

    beforeAll(() => {
      mainConfig = readHCL('main.tf');
    });

    test('should define VPC resource with environment_suffix', () => {
      expect(mainConfig).toContain('resource "aws_vpc"');
      expect(mainConfig).toContain('var.environment_suffix');
    });

    test('should define public and private subnets', () => {
      const content = fs.readFileSync(path.join(LIB_PATH, 'main.tf'), 'utf8');
      expect(content).toContain('aws_subnet');
      expect(content).toContain('public');
      expect(content).toContain('private');
    });

    test('should define NAT gateways for private subnet egress', () => {
      const content = fs.readFileSync(path.join(LIB_PATH, 'main.tf'), 'utf8');
      expect(content).toContain('aws_nat_gateway');
      expect(content).toContain('aws_eip');
    });

    test('should define internet gateway', () => {
      const content = fs.readFileSync(path.join(LIB_PATH, 'main.tf'), 'utf8');
      expect(content).toContain('aws_internet_gateway');
    });
  });

  describe('ECS Fargate Configuration', () => {
    let ecsConfig: string;

    beforeAll(() => {
      ecsConfig = fs.readFileSync(path.join(LIB_PATH, 'ecs.tf'), 'utf8');
    });

    test('should define ECS cluster with Container Insights', () => {
      expect(ecsConfig).toContain('aws_ecs_cluster');
      expect(ecsConfig).toContain('containerInsights');
    });

    test('should define task definition for payment processor', () => {
      expect(ecsConfig).toContain('aws_ecs_task_definition');
      expect(ecsConfig).toContain('FARGATE');
      expect(ecsConfig).toContain('payment-processor');
    });

    test('should define blue ECS service', () => {
      expect(ecsConfig).toContain('aws_ecs_service');
      expect(ecsConfig).toContain('blue');
    });

    test('should define green ECS service', () => {
      expect(ecsConfig).toContain('aws_ecs_service');
      expect(ecsConfig).toContain('green');
    });

    test('should configure secrets from Parameter Store', () => {
      expect(ecsConfig).toContain('secrets');
      expect(ecsConfig).toContain('DB_CONNECTION_STRING');
      expect(ecsConfig).toContain('aws_ssm_parameter');
    });

    test('should have environment_suffix in all resource names', () => {
      expect(ecsConfig).toContain('var.environment_suffix');
      const matches = ecsConfig.match(/var\.environment_suffix/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(5);
    });
  });

  describe('RDS Aurora PostgreSQL Configuration', () => {
    let rdsConfig: string;

    beforeAll(() => {
      rdsConfig = fs.readFileSync(path.join(LIB_PATH, 'rds.tf'), 'utf8');
    });

    test('should define Aurora PostgreSQL cluster', () => {
      expect(rdsConfig).toContain('aws_rds_cluster');
      expect(rdsConfig).toContain('aurora-postgresql');
    });

    test('should enable encryption at rest with KMS', () => {
      expect(rdsConfig).toContain('storage_encrypted');
      expect(rdsConfig).toContain('true');
      expect(rdsConfig).toContain('kms_key_id');
      expect(rdsConfig).toContain('aws_kms_key');
    });

    test('should define Multi-AZ cluster instances', () => {
      expect(rdsConfig).toContain('aws_rds_cluster_instance');
      expect(rdsConfig).toContain('count');
    });

    test('should have skip_final_snapshot set to true for destroyable resources', () => {
      expect(rdsConfig).toContain('skip_final_snapshot');
      expect(rdsConfig).toContain('= true');
    });

    test('should define KMS key for encryption', () => {
      expect(rdsConfig).toContain('aws_kms_key');
      expect(rdsConfig).toContain('enable_key_rotation');
    });
  });

  describe('Application Load Balancer Configuration', () => {
    let albConfig: string;

    beforeAll(() => {
      albConfig = fs.readFileSync(path.join(LIB_PATH, 'alb.tf'), 'utf8');
    });

    test('should define Application Load Balancer', () => {
      expect(albConfig).toContain('aws_lb');
      expect(albConfig).toContain('application');
    });

    test('should have deletion protection disabled', () => {
      expect(albConfig).toContain('enable_deletion_protection');
      expect(albConfig).toContain('false');
    });

    test('should define blue target group', () => {
      expect(albConfig).toContain('aws_lb_target_group');
      expect(albConfig).toContain('blue');
      expect(albConfig).toContain('target_type');
      expect(albConfig).toContain('ip');
    });

    test('should define green target group', () => {
      expect(albConfig).toContain('aws_lb_target_group');
      expect(albConfig).toContain('green');
    });

    test('should define ALB listener', () => {
      expect(albConfig).toContain('aws_lb_listener');
      expect(albConfig).toContain('HTTP');
    });

    test('should configure health checks for target groups', () => {
      expect(albConfig).toContain('health_check');
      expect(albConfig).toContain('healthy_threshold');
      expect(albConfig).toContain('unhealthy_threshold');
    });
  });

  describe('Security Groups Configuration', () => {
    let sgConfig: string;

    beforeAll(() => {
      sgConfig = fs.readFileSync(path.join(LIB_PATH, 'security-groups.tf'), 'utf8');
    });

    test('should define ALB security group', () => {
      expect(sgConfig).toContain('aws_security_group');
      expect(sgConfig).toContain('alb');
    });

    test('should define ECS tasks security group', () => {
      expect(sgConfig).toContain('aws_security_group');
      expect(sgConfig).toContain('ecs_tasks');
    });

    test('should define RDS security group', () => {
      expect(sgConfig).toContain('aws_security_group');
      expect(sgConfig).toContain('rds');
    });

    test('should restrict ECS ingress to ALB only', () => {
      expect(sgConfig).toMatch(/security_groups.*=.*\[aws_security_group\.alb\.id\]/);
    });

    test('should restrict RDS ingress to ECS tasks only', () => {
      expect(sgConfig).toMatch(/security_groups.*=.*\[aws_security_group\.ecs_tasks\.id\]/);
    });
  });

  describe('Parameter Store Configuration', () => {
    let ssmConfig: string;

    beforeAll(() => {
      ssmConfig = fs.readFileSync(path.join(LIB_PATH, 'ssm.tf'), 'utf8');
    });

    test('should store database connection string as SecureString', () => {
      expect(ssmConfig).toContain('aws_ssm_parameter');
      expect(ssmConfig).toContain('db_connection_string');
      expect(ssmConfig).toContain('SecureString');
    });

    test('should store database password as SecureString', () => {
      expect(ssmConfig).toContain('db_password');
      expect(ssmConfig).toContain('SecureString');
    });

    test('should include environment_suffix in parameter paths', () => {
      expect(ssmConfig).toContain('/payment/${var.environment_suffix}/');
    });
  });

  describe('CloudWatch Configuration', () => {
    let cwConfig: string;

    beforeAll(() => {
      cwConfig = fs.readFileSync(path.join(LIB_PATH, 'cloudwatch.tf'), 'utf8');
    });

    test('should define CloudWatch log group for ECS tasks', () => {
      expect(cwConfig).toContain('aws_cloudwatch_log_group');
      expect(cwConfig).toContain('ecs_tasks');
    });

    test('should define CloudWatch log group for Aurora', () => {
      expect(cwConfig).toContain('aws_cloudwatch_log_group');
      expect(cwConfig).toContain('aurora');
    });

    test('should set 30-day log retention', () => {
      expect(cwConfig).toContain('retention_in_days');
      expect(cwConfig).toContain('var.log_retention_days');
    });

    test('should define CloudWatch alarms for monitoring', () => {
      expect(cwConfig).toContain('aws_cloudwatch_metric_alarm');
    });

    test('should define alarms for both blue and green environments', () => {
      expect(cwConfig).toContain('unhealthy_hosts_blue');
      expect(cwConfig).toContain('unhealthy_hosts_green');
    });
  });

  describe('Auto-scaling Configuration', () => {
    let asConfig: string;

    beforeAll(() => {
      asConfig = fs.readFileSync(path.join(LIB_PATH, 'autoscaling.tf'), 'utf8');
    });

    test('should define auto-scaling targets for blue and green services', () => {
      expect(asConfig).toContain('aws_appautoscaling_target');
      expect(asConfig).toContain('ecs_target_blue');
      expect(asConfig).toContain('ecs_target_green');
    });

    test('should define CPU-based auto-scaling policy targeting 70%', () => {
      expect(asConfig).toContain('aws_appautoscaling_policy');
      expect(asConfig).toContain('ECSServiceAverageCPUUtilization');
      expect(asConfig).toContain('target_value');
      expect(asConfig).toContain('var.autoscaling_target_cpu');
    });

    test('should define memory-based auto-scaling policy', () => {
      expect(asConfig).toContain('ECSServiceAverageMemoryUtilization');
    });

    test('should configure auto-scaling for both blue and green', () => {
      const cpuPolicies = asConfig.match(/ecs_policy_cpu/g);
      expect(cpuPolicies).toBeTruthy();
      expect(cpuPolicies!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('IAM Configuration', () => {
    let iamConfig: string;

    beforeAll(() => {
      iamConfig = fs.readFileSync(path.join(LIB_PATH, 'iam.tf'), 'utf8');
    });

    test('should define ECS task execution role', () => {
      expect(iamConfig).toContain('aws_iam_role');
      expect(iamConfig).toContain('ecs_execution_role');
      expect(iamConfig).toContain('ecs-tasks.amazonaws.com');
    });

    test('should define ECS task role', () => {
      expect(iamConfig).toContain('ecs_task_role');
    });

    test('should grant SSM parameter access', () => {
      expect(iamConfig).toContain('ssm:GetParameter');
      expect(iamConfig).toContain('ssm:GetParameters');
    });

    test('should grant KMS decrypt permissions', () => {
      expect(iamConfig).toContain('kms:Decrypt');
    });

    test('should define RDS monitoring role', () => {
      expect(iamConfig).toContain('rds_monitoring_role');
      expect(iamConfig).toContain('monitoring.rds.amazonaws.com');
    });
  });

  describe('Variables Configuration', () => {
    let varsConfig: string;

    beforeAll(() => {
      varsConfig = fs.readFileSync(path.join(LIB_PATH, 'variables.tf'), 'utf8');
    });

    test('should define environment_suffix variable', () => {
      expect(varsConfig).toContain('variable "environment_suffix"');
    });

    test('should define required infrastructure variables', () => {
      const requiredVars = [
        'aws_region',
        'vpc_cidr',
        'availability_zones',
        'container_image',
        'task_cpu',
        'task_memory',
        'desired_count_blue',
        'desired_count_green',
        'db_master_username',
        'autoscaling_target_cpu',
        'log_retention_days'
      ];

      requiredVars.forEach(varName => {
        expect(varsConfig).toContain(`variable "${varName}"`);
      });
    });
  });

  describe('Outputs Configuration', () => {
    let outputsConfig: string;

    beforeAll(() => {
      outputsConfig = fs.readFileSync(path.join(LIB_PATH, 'outputs.tf'), 'utf8');
    });

    test('should output ALB DNS name', () => {
      expect(outputsConfig).toContain('output "alb_dns_name"');
    });

    test('should output ECS cluster information', () => {
      expect(outputsConfig).toContain('output "ecs_cluster_id"');
      expect(outputsConfig).toContain('output "ecs_cluster_name"');
    });

    test('should output RDS cluster endpoints', () => {
      expect(outputsConfig).toContain('output "rds_cluster_endpoint"');
      expect(outputsConfig).toContain('output "rds_cluster_reader_endpoint"');
    });

    test('should output target group ARNs', () => {
      expect(outputsConfig).toContain('output "blue_target_group_arn"');
      expect(outputsConfig).toContain('output "green_target_group_arn"');
    });

    test('should output Parameter Store parameter names', () => {
      expect(outputsConfig).toContain('output "db_connection_string_parameter"');
    });
  });

  describe('Resource Naming Conventions', () => {
    const configFiles = [
      'main.tf',
      'ecs.tf',
      'rds.tf',
      'alb.tf',
      'security-groups.tf',
      'ssm.tf',
      'cloudwatch.tf',
      'autoscaling.tf',
      'iam.tf'
    ];

    configFiles.forEach(file => {
      test(`${file} should use environment_suffix in resource names`, () => {
        const content = fs.readFileSync(path.join(LIB_PATH, file), 'utf8');
        // Match both ${var.environment_suffix} and var.environment_suffix patterns
        const suffixUsage = content.includes('var.environment_suffix');
        expect(suffixUsage).toBe(true);
      });
    });
  });

  describe('Blue-Green Deployment Support', () => {
    test('should have separate blue and green ECS services', () => {
      const ecsConfig = fs.readFileSync(path.join(LIB_PATH, 'ecs.tf'), 'utf8');
      expect(ecsConfig).toContain('aws_ecs_service" "blue"');
      expect(ecsConfig).toContain('aws_ecs_service" "green"');
    });

    test('should have separate blue and green target groups', () => {
      const albConfig = fs.readFileSync(path.join(LIB_PATH, 'alb.tf'), 'utf8');
      expect(albConfig).toContain('aws_lb_target_group" "blue"');
      expect(albConfig).toContain('aws_lb_target_group" "green"');
    });

    test('should have auto-scaling configured for both environments', () => {
      const asConfig = fs.readFileSync(path.join(LIB_PATH, 'autoscaling.tf'), 'utf8');
      expect(asConfig).toContain('ecs_target_blue');
      expect(asConfig).toContain('ecs_target_green');
    });
  });
});
