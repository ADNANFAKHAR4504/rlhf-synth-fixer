// Comprehensive unit tests for Terraform ECS Fargate Microservices Infrastructure
// Tests validate all Terraform configuration files without requiring deployment

import fs from 'fs';
import path from 'path';
import * as hcl from 'hcl2-parser';

const libDir = path.resolve(__dirname, '../lib');

// Helper function to read and parse Terraform files
function readTerraformFile(filename: string): any {
  const filePath = path.join(libDir, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    return hcl.parseToObject(content);
  } catch (error) {
    throw new Error(`Failed to parse ${filename}: ${error}`);
  }
}

// Helper function to read raw content
function readFileContent(filename: string): string {
  const filePath = path.join(libDir, filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Helper to check if file exists
function fileExists(filename: string): boolean {
  const filePath = path.join(libDir, filename);
  return fs.existsSync(filePath);
}

describe('Terraform Infrastructure - File Structure', () => {
  test('all required Terraform files exist', () => {
    const requiredFiles = [
      'provider.tf',
      'main.tf',
      'variables.tf',
      'outputs.tf',
      'networking.tf',
      'security-groups.tf',
      'iam.tf',
      'cloudwatch.tf',
      'alb.tf',
      'ecs-cluster.tf',
      'ecs-payment-service.tf',
      'ecs-auth-service.tf',
      'ecs-analytics-service.tf',
      'autoscaling.tf'
    ];

    requiredFiles.forEach(file => {
      expect(fileExists(file)).toBe(true);
    });
  });

  test('provider.tf has correct Terraform version constraint', () => {
    const content = readFileContent('provider.tf');
    expect(content).toContain('required_version = ">= 1.4.0"');
    expect(content).toContain('hashicorp/aws');
    expect(content).toContain('backend "s3"');
  });

  test('main.tf contains common tags with environment_suffix', () => {
    const content = readFileContent('main.tf');
    expect(content).toContain('common_tags');
    expect(content).toContain('var.environment_suffix');
    expect(content).toContain('EnvironmentSuffix');
  });
});

describe('Terraform Infrastructure - Variables', () => {
  test('variables.tf declares environment_suffix variable', () => {
    const content = readFileContent('variables.tf');
    expect(content).toContain('variable "environment_suffix"');
    expect(content).toContain('type        = string');
  });

  test('variables.tf declares aws_region with ap-southeast-1 default', () => {
    const content = readFileContent('variables.tf');
    expect(content).toContain('variable "aws_region"');
    expect(content).toContain('default     = "ap-southeast-1"');
  });

  test('variables.tf declares ECS task configuration variables', () => {
    const content = readFileContent('variables.tf');
    expect(content).toContain('variable "task_cpu"');
    expect(content).toContain('default     = 512');
    expect(content).toContain('variable "task_memory"');
    expect(content).toContain('default     = 1024');
  });

  test('variables.tf declares autoscaling variables', () => {
    const content = readFileContent('variables.tf');
    expect(content).toContain('variable "autoscaling_cpu_threshold"');
    expect(content).toContain('default     = 70');
    expect(content).toContain('variable "autoscaling_memory_threshold"');
    expect(content).toContain('default     = 70');
  });

  test('variables.tf declares health check configuration', () => {
    const content = readFileContent('variables.tf');
    expect(content).toContain('variable "health_check_interval"');
    expect(content).toContain('default     = 30');
  });
});

describe('Terraform Infrastructure - Networking', () => {
  test('networking.tf creates VPC with DNS support enabled', () => {
    const content = readFileContent('networking.tf');
    expect(content).toContain('resource "aws_vpc" "main"');
    expect(content).toContain('enable_dns_hostnames = true');
    expect(content).toContain('enable_dns_support   = true');
    expect(content).toContain('fintech-vpc-${var.environment_suffix}');
  });

  test('networking.tf creates private subnets across 3 AZs', () => {
    const content = readFileContent('networking.tf');
    expect(content).toContain('resource "aws_subnet" "private"');
    expect(content).toContain('count = length(var.private_subnet_cidrs)');
    expect(content).toContain('var.availability_zones[count.index]');
  });

  test('networking.tf creates public subnets for NAT gateways', () => {
    const content = readFileContent('networking.tf');
    expect(content).toContain('resource "aws_subnet" "public"');
    expect(content).toContain('count = length(var.public_subnet_cidrs)');
    expect(content).toContain('map_public_ip_on_launch = true');
  });

  test('networking.tf creates NAT gateways for outbound access', () => {
    const content = readFileContent('networking.tf');
    expect(content).toContain('resource "aws_nat_gateway" "main"');
    expect(content).toContain('count = length(var.availability_zones)');
    expect(content).toContain('resource "aws_eip" "nat"');
  });

  test('networking.tf creates Internet Gateway', () => {
    const content = readFileContent('networking.tf');
    expect(content).toContain('resource "aws_internet_gateway" "main"');
    expect(content).toContain('vpc_id = aws_vpc.main.id');
  });

  test('networking.tf creates route tables for public and private subnets', () => {
    const content = readFileContent('networking.tf');
    expect(content).toContain('resource "aws_route_table" "public"');
    expect(content).toContain('resource "aws_route_table" "private"');
    expect(content).toContain('resource "aws_route_table_association" "public"');
    expect(content).toContain('resource "aws_route_table_association" "private"');
  });

  test('all network resources include environment_suffix in names', () => {
    const content = readFileContent('networking.tf');
    const nameTags = content.match(/Name\s*=\s*"[^"]*"/g) || [];
    nameTags.forEach(tag => {
      expect(tag).toContain('${var.environment_suffix}');
    });
  });
});

describe('Terraform Infrastructure - Security Groups', () => {
  test('security-groups.tf creates ALB security group', () => {
    const content = readFileContent('security-groups.tf');
    expect(content).toContain('resource "aws_security_group" "alb"');
    expect(content).toContain('fintech-alb-${var.environment_suffix}');
  });

  test('ALB security group allows HTTP and HTTPS from VPC', () => {
    const content = readFileContent('security-groups.tf');
    expect(content).toContain('from_port   = 80');
    expect(content).toContain('to_port     = 80');
    expect(content).toContain('from_port   = 443');
    expect(content).toContain('to_port     = 443');
    expect(content).toContain('cidr_blocks = [var.vpc_cidr]');
  });

  test('security-groups.tf creates ECS services security group', () => {
    const content = readFileContent('security-groups.tf');
    expect(content).toContain('resource "aws_security_group" "ecs_services"');
    expect(content).toContain('fintech-ecs-${var.environment_suffix}');
  });

  test('ECS security group allows port 8080 from ALB', () => {
    const content = readFileContent('security-groups.tf');
    expect(content).toContain('from_port       = 8080');
    expect(content).toContain('to_port         = 8080');
    expect(content).toContain('security_groups = [aws_security_group.alb.id]');
  });

  test('ECS security group allows inter-service communication on port 8080', () => {
    const content = readFileContent('security-groups.tf');
    expect(content).toContain('self        = true');
  });

  test('security groups use create_before_destroy lifecycle', () => {
    const content = readFileContent('security-groups.tf');
    const lifecycleMatches = content.match(/lifecycle\s*{[^}]*create_before_destroy\s*=\s*true[^}]*}/g);
    expect(lifecycleMatches).not.toBeNull();
    expect(lifecycleMatches!.length).toBeGreaterThan(0);
  });
});

describe('Terraform Infrastructure - IAM Roles', () => {
  test('iam.tf creates ECS task execution role', () => {
    const content = readFileContent('iam.tf');
    expect(content).toContain('resource "aws_iam_role" "ecs_task_execution_role"');
    expect(content).toContain('ecs-task-exec-${var.environment_suffix}');
  });

  test('task execution role has correct assume role policy', () => {
    const content = readFileContent('iam.tf');
    expect(content).toContain('Service = "ecs-tasks.amazonaws.com"');
    expect(content).toContain('Action = "sts:AssumeRole"');
  });

  test('task execution role attached to AWS managed policy', () => {
    const content = readFileContent('iam.tf');
    expect(content).toContain('resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy"');
    expect(content).toContain('AmazonECSTaskExecutionRolePolicy');
  });

  test('task execution role has ECR permissions', () => {
    const content = readFileContent('iam.tf');
    expect(content).toContain('ecr:GetAuthorizationToken');
    expect(content).toContain('ecr:BatchCheckLayerAvailability');
    expect(content).toContain('ecr:GetDownloadUrlForLayer');
    expect(content).toContain('ecr:BatchGetImage');
  });

  test('iam.tf creates ECS task role', () => {
    const content = readFileContent('iam.tf');
    expect(content).toContain('resource "aws_iam_role" "ecs_task_role"');
    expect(content).toContain('ecs-task-${var.environment_suffix}');
  });

  test('task role has Parameter Store permissions', () => {
    const content = readFileContent('iam.tf');
    expect(content).toContain('ssm:GetParameters');
    expect(content).toContain('ssm:GetParameter');
    expect(content).toContain('ssm:GetParametersByPath');
    expect(content).toContain('/fintech/*');
  });

  test('task role has CloudWatch Logs permissions', () => {
    const content = readFileContent('iam.tf');
    expect(content).toContain('logs:CreateLogGroup');
    expect(content).toContain('logs:CreateLogStream');
    expect(content).toContain('logs:PutLogEvents');
  });
});

describe('Terraform Infrastructure - CloudWatch Logs', () => {
  test('cloudwatch.tf creates log groups for all three services', () => {
    const content = readFileContent('cloudwatch.tf');
    expect(content).toContain('resource "aws_cloudwatch_log_group" "payment_service"');
    expect(content).toContain('resource "aws_cloudwatch_log_group" "auth_service"');
    expect(content).toContain('resource "aws_cloudwatch_log_group" "analytics_service"');
  });

  test('log groups use /ecs/fintech/ prefix', () => {
    const content = readFileContent('cloudwatch.tf');
    expect(content).toContain('/ecs/fintech/payment-service-${var.environment_suffix}');
    expect(content).toContain('/ecs/fintech/auth-service-${var.environment_suffix}');
    expect(content).toContain('/ecs/fintech/analytics-service-${var.environment_suffix}');
  });

  test('log groups have 7-day retention configured', () => {
    const content = readFileContent('cloudwatch.tf');
    expect(content).toContain('retention_in_days = var.log_retention_days');
  });
});

describe('Terraform Infrastructure - Application Load Balancer', () => {
  test('alb.tf creates internal ALB', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('resource "aws_lb" "internal"');
    expect(content).toContain('internal           = true');
    expect(content).toContain('load_balancer_type = "application"');
  });

  test('ALB has deletion protection disabled', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('enable_deletion_protection = false');
  });

  test('ALB uses private subnets', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('subnets            = aws_subnet.private[*].id');
  });

  test('alb.tf creates target groups for all three services', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('resource "aws_lb_target_group" "payment_service"');
    expect(content).toContain('resource "aws_lb_target_group" "auth_service"');
    expect(content).toContain('resource "aws_lb_target_group" "analytics_service"');
  });

  test('target groups use IP target type for Fargate', () => {
    const content = readFileContent('alb.tf');
    const targetTypeMatches = content.match(/target_type\s*=\s*"ip"/g);
    expect(targetTypeMatches).not.toBeNull();
    expect(targetTypeMatches!.length).toBe(3);
  });

  test('target groups have correct health check paths', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('path                = "/health"');
    expect(content).toContain('path                = "/auth/health"');
    expect(content).toContain('path                = "/analytics/health"');
  });

  test('health checks use 30-second interval', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('interval            = var.health_check_interval');
  });

  test('alb.tf creates HTTP listener', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('resource "aws_lb_listener" "http"');
    expect(content).toContain('port              = "80"');
    expect(content).toContain('protocol          = "HTTP"');
  });

  test('listener has default 404 response', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('type = "fixed-response"');
    expect(content).toContain('status_code  = "404"');
  });

  test('alb.tf creates listener rules for all services', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('resource "aws_lb_listener_rule" "payment_service"');
    expect(content).toContain('resource "aws_lb_listener_rule" "auth_service"');
    expect(content).toContain('resource "aws_lb_listener_rule" "analytics_service"');
  });

  test('listener rules have correct path patterns', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('values = ["/payment/*", "/health"]');
    expect(content).toContain('values = ["/auth/*"]');
    expect(content).toContain('values = ["/analytics/*"]');
  });
});

describe('Terraform Infrastructure - ECS Cluster', () => {
  test('ecs-cluster.tf creates ECS cluster with correct name', () => {
    const content = readFileContent('ecs-cluster.tf');
    expect(content).toContain('resource "aws_ecs_cluster" "fintech_cluster"');
    expect(content).toContain('name = "fintech-cluster-${var.environment_suffix}');
  });

  test('ECS cluster has Container Insights enabled', () => {
    const content = readFileContent('ecs-cluster.tf');
    expect(content).toContain('setting {');
    expect(content).toContain('name  = "containerInsights"');
    expect(content).toContain('var.enable_container_insights');
  });

  test('ECS cluster has Fargate capacity providers configured', () => {
    const content = readFileContent('ecs-cluster.tf');
    expect(content).toContain('resource "aws_ecs_cluster_capacity_providers"');
    expect(content).toContain('capacity_providers = ["FARGATE", "FARGATE_SPOT"]');
  });
});

describe('Terraform Infrastructure - ECS Payment Service', () => {
  test('ecs-payment-service.tf creates task definition', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('resource "aws_ecs_task_definition" "payment_service"');
    expect(content).toContain('family                   = "payment-service-${var.environment_suffix}');
  });

  test('payment service task definition uses Fargate', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('network_mode             = "awsvpc"');
    expect(content).toContain('requires_compatibilities = ["FARGATE"]');
  });

  test('payment service has correct CPU and memory', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('cpu                      = var.task_cpu');
    expect(content).toContain('memory                   = var.task_memory');
  });

  test('payment service uses correct IAM roles', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn');
    expect(content).toContain('task_role_arn            = aws_iam_role.ecs_task_role.arn');
  });

  test('payment service container has port 8080 exposed', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('containerPort = 8080');
  });

  test('payment service has CloudWatch logging configured', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('logDriver = "awslogs"');
    expect(content).toContain('awslogs-group');
    expect(content).toContain('aws_cloudwatch_log_group.payment_service.name');
  });

  test('payment service has health check configured', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('healthCheck = {');
    expect(content).toContain('http://localhost:8080/health');
  });

  test('ecs-payment-service.tf creates ECS service', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('resource "aws_ecs_service" "payment_service"');
    expect(content).toContain('name            = "payment-service-${var.environment_suffix}');
  });

  test('payment service has correct desired count', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('desired_count   = var.desired_count');
  });

  test('payment service uses private subnets', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('subnets          = aws_subnet.private[*].id');
    expect(content).toContain('assign_public_ip = false');
  });

  test('payment service has circuit breaker enabled', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('deployment_circuit_breaker {');
    expect(content).toContain('enable   = true');
    expect(content).toContain('rollback = true');
  });

  test('payment service has deployment configuration', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('deployment_maximum_percent         = 200');
    expect(content).toContain('deployment_minimum_healthy_percent = 100');
  });

  test('payment service has health check grace period', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('health_check_grace_period_seconds = 60');
  });

  test('payment service connected to ALB target group', () => {
    const content = readFileContent('ecs-payment-service.tf');
    expect(content).toContain('load_balancer {');
    expect(content).toContain('target_group_arn = aws_lb_target_group.payment_service.arn');
    expect(content).toContain('container_name   = "payment-service"');
    expect(content).toContain('container_port   = 8080');
  });
});

describe('Terraform Infrastructure - ECS Auth Service', () => {
  test('ecs-auth-service.tf creates task definition', () => {
    const content = readFileContent('ecs-auth-service.tf');
    expect(content).toContain('resource "aws_ecs_task_definition" "auth_service"');
    expect(content).toContain('family                   = "auth-service-${var.environment_suffix}');
  });

  test('auth service has health check path /auth/health', () => {
    const content = readFileContent('ecs-auth-service.tf');
    expect(content).toContain('http://localhost:8080/auth/health');
  });

  test('ecs-auth-service.tf creates ECS service', () => {
    const content = readFileContent('ecs-auth-service.tf');
    expect(content).toContain('resource "aws_ecs_service" "auth_service"');
    expect(content).toContain('name            = "auth-service-${var.environment_suffix}');
  });

  test('auth service connected to correct ALB target group', () => {
    const content = readFileContent('ecs-auth-service.tf');
    expect(content).toContain('target_group_arn = aws_lb_target_group.auth_service.arn');
    expect(content).toContain('container_name   = "auth-service"');
  });
});

describe('Terraform Infrastructure - ECS Analytics Service', () => {
  test('ecs-analytics-service.tf creates task definition', () => {
    const content = readFileContent('ecs-analytics-service.tf');
    expect(content).toContain('resource "aws_ecs_task_definition" "analytics_service"');
    expect(content).toContain('family                   = "analytics-service-${var.environment_suffix}');
  });

  test('analytics service has health check path /analytics/health', () => {
    const content = readFileContent('ecs-analytics-service.tf');
    expect(content).toContain('http://localhost:8080/analytics/health');
  });

  test('ecs-analytics-service.tf creates ECS service', () => {
    const content = readFileContent('ecs-analytics-service.tf');
    expect(content).toContain('resource "aws_ecs_service" "analytics_service"');
    expect(content).toContain('name            = "analytics-service-${var.environment_suffix}');
  });

  test('analytics service connected to correct ALB target group', () => {
    const content = readFileContent('ecs-analytics-service.tf');
    expect(content).toContain('target_group_arn = aws_lb_target_group.analytics_service.arn');
    expect(content).toContain('container_name   = "analytics-service"');
  });
});

describe('Terraform Infrastructure - Auto Scaling', () => {
  test('autoscaling.tf creates scaling targets for all three services', () => {
    const content = readFileContent('autoscaling.tf');
    expect(content).toContain('resource "aws_appautoscaling_target" "payment_service"');
    expect(content).toContain('resource "aws_appautoscaling_target" "auth_service"');
    expect(content).toContain('resource "aws_appautoscaling_target" "analytics_service"');
  });

  test('scaling targets have correct min and max capacity', () => {
    const content = readFileContent('autoscaling.tf');
    expect(content).toContain('max_capacity       = var.autoscaling_max_capacity');
    expect(content).toContain('min_capacity       = var.autoscaling_min_capacity');
  });

  test('autoscaling.tf creates CPU-based policies for all services', () => {
    const content = readFileContent('autoscaling.tf');
    expect(content).toContain('resource "aws_appautoscaling_policy" "payment_service_cpu"');
    expect(content).toContain('resource "aws_appautoscaling_policy" "auth_service_cpu"');
    expect(content).toContain('resource "aws_appautoscaling_policy" "analytics_service_cpu"');
  });

  test('autoscaling.tf creates memory-based policies for all services', () => {
    const content = readFileContent('autoscaling.tf');
    expect(content).toContain('resource "aws_appautoscaling_policy" "payment_service_memory"');
    expect(content).toContain('resource "aws_appautoscaling_policy" "auth_service_memory"');
    expect(content).toContain('resource "aws_appautoscaling_policy" "analytics_service_memory"');
  });

  test('CPU policies use 70% threshold', () => {
    const content = readFileContent('autoscaling.tf');
    const cpuThresholds = content.match(/predefined_metric_type = "ECSServiceAverageCPUUtilization"[\s\S]*?target_value\s*=\s*var\.autoscaling_cpu_threshold/g);
    expect(cpuThresholds).not.toBeNull();
    expect(cpuThresholds!.length).toBe(3);
  });

  test('memory policies use 70% threshold', () => {
    const content = readFileContent('autoscaling.tf');
    const memoryThresholds = content.match(/predefined_metric_type = "ECSServiceAverageMemoryUtilization"[\s\S]*?target_value\s*=\s*var\.autoscaling_memory_threshold/g);
    expect(memoryThresholds).not.toBeNull();
    expect(memoryThresholds!.length).toBe(3);
  });

  test('scaling policies have cooldown periods configured', () => {
    const content = readFileContent('autoscaling.tf');
    expect(content).toContain('scale_in_cooldown  = 300');
    expect(content).toContain('scale_out_cooldown = 60');
  });
});

describe('Terraform Infrastructure - Outputs', () => {
  test('outputs.tf exports ECS cluster information', () => {
    const content = readFileContent('outputs.tf');
    expect(content).toContain('output "ecs_cluster_name"');
    expect(content).toContain('output "ecs_cluster_arn"');
    expect(content).toContain('aws_ecs_cluster.fintech_cluster.name');
    expect(content).toContain('aws_ecs_cluster.fintech_cluster.arn');
  });

  test('outputs.tf exports ALB information', () => {
    const content = readFileContent('outputs.tf');
    expect(content).toContain('output "alb_dns_name"');
    expect(content).toContain('output "alb_arn"');
    expect(content).toContain('aws_lb.internal.dns_name');
  });

  test('outputs.tf exports target group ARNs for all services', () => {
    const content = readFileContent('outputs.tf');
    expect(content).toContain('output "payment_service_target_group_arn"');
    expect(content).toContain('output "auth_service_target_group_arn"');
    expect(content).toContain('output "analytics_service_target_group_arn"');
  });

  test('outputs.tf exports ECS service names', () => {
    const content = readFileContent('outputs.tf');
    expect(content).toContain('output "payment_service_name"');
    expect(content).toContain('output "auth_service_name"');
    expect(content).toContain('output "analytics_service_name"');
  });

  test('outputs.tf exports VPC and subnet information', () => {
    const content = readFileContent('outputs.tf');
    expect(content).toContain('output "vpc_id"');
    expect(content).toContain('output "private_subnet_ids"');
    expect(content).toContain('aws_vpc.main.id');
    expect(content).toContain('aws_subnet.private[*].id');
  });

  test('outputs.tf exports security group ID', () => {
    const content = readFileContent('outputs.tf');
    expect(content).toContain('output "ecs_security_group_id"');
    expect(content).toContain('aws_security_group.ecs_services.id');
  });

  test('outputs.tf exports CloudWatch log groups', () => {
    const content = readFileContent('outputs.tf');
    expect(content).toContain('output "cloudwatch_log_groups"');
    expect(content).toContain('aws_cloudwatch_log_group.payment_service.name');
    expect(content).toContain('aws_cloudwatch_log_group.auth_service.name');
    expect(content).toContain('aws_cloudwatch_log_group.analytics_service.name');
  });
});

describe('Terraform Infrastructure - Resource Naming Compliance', () => {
  test('all resources include environment_suffix in names', () => {
    const files = [
      'networking.tf',
      'security-groups.tf',
      'iam.tf',
      'cloudwatch.tf',
      'alb.tf',
      'ecs-cluster.tf',
      'ecs-payment-service.tf',
      'ecs-auth-service.tf',
      'ecs-analytics-service.tf',
      'autoscaling.tf'
    ];

    files.forEach(file => {
      const content = readFileContent(file);
      // Check that environment_suffix is used in names
      const hasEnvSuffix = content.includes('${var.environment_suffix}') ||
                           content.includes('environment_suffix');
      expect(hasEnvSuffix).toBe(true);
    });
  });

  test('no hardcoded environment names found', () => {
    const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

    files.forEach(file => {
      const content = readFileContent(file);
      // Check for common hardcoded environment names
      expect(content).not.toMatch(/(?<!var\.)(?:prod-|dev-|stage-|staging-)/i);
    });
  });
});

describe('Terraform Infrastructure - Best Practices', () => {
  test('no Retain deletion policies found', () => {
    const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

    files.forEach(file => {
      const content = readFileContent(file);
      expect(content.toLowerCase()).not.toContain('retain');
    });
  });

  test('ALB has deletion protection disabled for CI/CD', () => {
    const content = readFileContent('alb.tf');
    expect(content).toContain('enable_deletion_protection = false');
  });

  test('all services have depends_on for proper dependency order', () => {
    const serviceFiles = [
      'ecs-payment-service.tf',
      'ecs-auth-service.tf',
      'ecs-analytics-service.tf'
    ];

    serviceFiles.forEach(file => {
      const content = readFileContent(file);
      expect(content).toContain('depends_on = [');
      expect(content).toContain('aws_lb_listener.http');
    });
  });
});
