// Comprehensive unit tests for lib/tap_stack.tf without running Terraform
// These tests validate structure and key requirements via regex-based assertions.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);

let content = '';

beforeAll(() => {
  const exists = fs.existsSync(stackPath);
  if (!exists) {
    throw new Error(`[unit] Expected stack at: ${stackPath}`);
  }
  content = fs.readFileSync(stackPath, 'utf8');
});

const expectMatch = (re: RegExp, msg?: string) => {
  expect(content).toMatch(re);
};

const expectNotMatch = (re: RegExp, msg?: string) => {
  expect(content).not.toMatch(re);
};

describe('Terraform single-file stack: tap_stack.tf', () => {
  test('file exists and is non-empty', () => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(content.length).toBeGreaterThan(100);
  });

  test('does NOT declare provider block in tap_stack.tf (provider.tf owns providers)', () => {
    expectNotMatch(/\bprovider\s+"aws"\s*\{/);
    expectNotMatch(/\bbackend\s+"/);
  });

  test('does not define terraform block here (it lives in provider.tf)', () => {
    expectNotMatch(/terraform\s*\{/);
  });

  describe('Variables & locals', () => {
    test('declares aws_region variable with default us-east-1', () => {
      expectMatch(
        /variable\s+"aws_region"\s*\{[\s\S]*?default\s*=\s*"us-east-1"[\s\S]*?\}/
      );
    });

    test('declares required variables', () => {
      [
        'project_name',
        'environment',
        'allowed_cidrs',
        'db_engine',
        'db_engine_version',
        'db_instance_class',
        'db_allocated_storage',
        'db_port',
        'container_image',
        'container_port',
        'desired_count',
        'health_check_path',
        'alb_idle_timeout',
        'test_listener_port',
      ].forEach(v => expectMatch(new RegExp(`variable\\s+"${v}"\\s*\\{`)));
    });

    test('locals define common_tags and name prefixes', () => {
      expectMatch(/locals\s*\{[\s\S]*common_tags[\s\S]*name_prefix[\s\S]*\}/);
    });
  });

  describe('Networking (VPC, Subnets, Routes, NAT)', () => {
    test('VPC and IGW exist with tags', () => {
      expectMatch(/resource\s+"aws_vpc"\s+"main"\s*\{/);
      expectMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*\{/);
      expectMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test('Public and private subnets across at least 2 AZs', () => {
      expectMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*count\s*=/);
      expectMatch(/resource\s+"aws_subnet"\s+"private"[\s\S]*count\s*=/);
    });

    test('NAT gateways and EIPs per AZ', () => {
      expectMatch(/resource\s+"aws_eip"\s+"nat"[\s\S]*count\s*=/);
      expectMatch(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*count\s*=/);
    });

    test('Route tables associate subnets correctly', () => {
      expectMatch(/resource\s+"aws_route_table"\s+"public"/);
      expectMatch(/resource\s+"aws_route_table"\s+"private"[\s\S]*count\s*=/);
      expectMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expectMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe('Security Groups', () => {
    test('ALB SG allows 80/443 from allowed_cidrs and has egress all', () => {
      expectMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expectMatch(
        /ingress\s*\{[\s\S]*from_port\s*=\s*80[\s\S]*cidr_blocks\s*=\s*var\.allowed_cidrs[\s\S]*\}/
      );
      expectMatch(
        /ingress\s*\{[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*var\.allowed_cidrs[\s\S]*\}/
      );
      expectMatch(/egress\s*\{[\s\S]*protocol\s*=\s*"-1"[\s\S]*\}/);
    });

    test('ECS SG restricts inbound to container_port from ALB SG', () => {
      expectMatch(/resource\s+"aws_security_group"\s+"ecs"/);
      expectMatch(
        /ingress[\s\S]*from_port\s*=\s*var\.container_port[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb\.id\]/
      );
    });

    test('RDS SG allows inbound db_port from ECS SG only', () => {
      expectMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expectMatch(
        /ingress[\s\S]*from_port\s*=\s*var\.db_port[\s\S]*security_groups\s*=\s*\[aws_security_group\.ecs\.id\]/
      );
    });
  });

  describe('Secrets Manager & IAM least-privilege', () => {
    test('Secrets for db_password and app_config exist with versions', () => {
      expectMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
      expectMatch(
        /resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/
      );
      expectMatch(/resource\s+"aws_secretsmanager_secret"\s+"app_config"/);
      expectMatch(
        /resource\s+"aws_secretsmanager_secret_version"\s+"app_config"/
      );
    });

    test('IAM task role can read only those secrets', () => {
      expectMatch(/resource\s+"aws_iam_role"\s+"ecs_task_role"/);
      expectMatch(
        /resource\s+"aws_iam_role_policy"\s+"ecs_task_secrets_policy"[\s\S]*secretsmanager:GetSecretValue/
      );
      expectMatch(
        /Resource\s*=\s*\[[\s\S]*aws_secretsmanager_secret\.db_password\.arn[\s\S]*aws_secretsmanager_secret\.app_config\.arn[\s\S]*\]/
      );
    });

    test('Execution role attachment present', () => {
      expectMatch(/AmazonECSTaskExecutionRolePolicy/);
    });
  });

  describe('RDS (private, encrypted, backups)', () => {
    test('DB subnet group in private subnets', () => {
      expectMatch(
        /resource\s+"aws_db_subnet_group"\s+"main"[\s\S]*subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/
      );
    });

    test('DB instance configured for Multi-AZ, encryption, backups and windows', () => {
      expectMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expectMatch(/storage_encrypted\s*=\s*true/);
      expectMatch(/multi_az\s*=\s*true/);
      expectMatch(/backup_retention_period\s*=\s*7/);
      // Window attributes may vary by provider schema; ensure some window keywords exist
      expectMatch(/preferred_backup_window|backup_window/);
      expectMatch(/preferred_maintenance_window|maintenance_window/);
    });
  });

  describe('ECS Fargate, ALB, and Blue/Green deployments', () => {
    test('CloudWatch log group and ECS cluster present', () => {
      expectMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
      expectMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
    });

    test('Task definition uses FARGATE, awsvpc, logs, healthCheck, secrets, env', () => {
      expectMatch(/resource\s+"aws_ecs_task_definition"\s+"app"/);
      expectMatch(/requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/);
      expectMatch(/network_mode\s*=\s*"awsvpc"/);
      expectMatch(/awslogs-group/);
      expectMatch(/healthCheck\s*=\s*\{/);
      expectMatch(/secrets\s*=\s*\[/);
      expectMatch(/environment\s*=\s*\[/);
    });

    test('ALB, two target groups, and listeners exist', () => {
      expectMatch(/resource\s+"aws_lb"\s+"main"/);
      expectMatch(/resource\s+"aws_lb_target_group"\s+"blue"/);
      expectMatch(/resource\s+"aws_lb_target_group"\s+"green"/);
      expectMatch(
        /resource\s+"aws_lb_listener"\s+"http"[\s\S]*port\s*=\s*80\b/
      );
      expectMatch(/resource\s+"aws_lb_listener"\s+"test"/);
    });

    test('ECS service uses CodeDeploy deployment_controller and load balancer', () => {
      expectMatch(/resource\s+"aws_ecs_service"\s+"app"/);
      expectMatch(
        /deployment_controller\s*\{[\s\S]*type\s*=\s*"CODE_DEPLOY"[\s\S]*\}/
      );
      expectMatch(
        /load_balancer\s*\{[\s\S]*target_group_arn\s*=\s*aws_lb_target_group\.blue\.arn[\s\S]*\}/
      );
    });

    test('CodeDeploy app and deployment group with target group pair and routes', () => {
      expectMatch(/resource\s+"aws_codedeploy_app"\s+"app"/);
      expectMatch(/resource\s+"aws_codedeploy_deployment_group"\s+"app"/);
      expectMatch(/target_group_pair_info/);
      expectMatch(
        /prod_traffic_route[\s\S]*listener_arns\s*=\s*\[aws_lb_listener\.http\.arn\]/
      );
      expectMatch(
        /test_traffic_route[\s\S]*listener_arns\s*=\s*\[aws_lb_listener\.test\.arn\]/
      );
    });

    test('Autoscaling target and CPU/Memory policies exist', () => {
      expectMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs_target"/);
      expectMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_cpu_policy"/);
      expectMatch(
        /resource\s+"aws_appautoscaling_policy"\s+"ecs_memory_policy"/
      );
    });
  });

  describe('Monitoring & Alarms', () => {
    test('CloudWatch alarms: ALB 5XX, ECS CPU & Memory, RDS CPU & FreeStorage', () => {
      expectMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_5xx_errors"/
      );
      expectMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu_high"/);
      expectMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_memory_high"/
      );
      expectMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"/);
      expectMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_free_storage_low"/
      );
    });
  });

  describe('Tags & Outputs', () => {
    test('Most resources merge common tags', () => {
      // Not exhaustive, but ensure multiple tag merges exist
      const tagMerges =
        content.match(/tags\s*=\s*merge\(local\.common_tags/g) || [];
      expect(tagMerges.length).toBeGreaterThan(8);
    });

    test('Required outputs are defined', () => {
      [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'alb_dns_name',
        'ecs_cluster_name',
        'ecs_service_name',
        'ecs_service_arn',
        'codedeploy_app_name',
        'codedeploy_deployment_group_name',
        'rds_endpoint',
        'cloudwatch_log_group_name',
        'blue_target_group_arn',
        'green_target_group_arn',
      ].forEach(o => expectMatch(new RegExp(`output\\s+"${o}"\\s*\\{`)));
    });
  });
});
