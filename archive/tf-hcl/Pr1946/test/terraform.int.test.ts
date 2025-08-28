// Integration-style tests for lib/tap_stack.tf without invoking Terraform CLI
// These tests validate cross-resource relationships, references, and standards.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);

let content = '';

beforeAll(() => {
  const exists = fs.existsSync(stackPath);
  if (!exists) {
    throw new Error(`[integration] Expected stack at: ${stackPath}`);
  }
  content = fs.readFileSync(stackPath, 'utf8');
});

const expectMatch = (re: RegExp) => expect(content).toMatch(re);
const expectNotMatch = (re: RegExp) => expect(content).not.toMatch(re);

// Quick helpers to capture snippets
const findBlock = (re: RegExp): string => {
  const m = content.match(re);
  return m ? m[0] : '';
};

describe('Terraform stack integration validations', () => {
  test('stack file present and large enough to represent full config', () => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(content.length).toBeGreaterThan(5000);
  });

  test('no provider/backend blocks in stack (kept in provider.tf)', () => {
    expectNotMatch(/\bprovider\s+"aws"\s*\{/);
    expectNotMatch(/\bbackend\s+"/);
  });

  describe('Global standards', () => {
    test('terraform block is not defined here (kept in provider.tf)', () => {
      expectNotMatch(/\bterraform\s*\{/);
    });

    test('EBS encryption-by-default is enabled', () => {
      expectMatch(
        /resource\s+"aws_ebs_encryption_by_default"\s+"this"[\s\S]*enabled\s*=\s*true/
      );
    });

    test('Environment tagging via local.common_tags is merged broadly', () => {
      const tagMerges =
        content.match(/tags\s*=\s*merge\(local\.common_tags/g) || [];
      expect(tagMerges.length).toBeGreaterThan(12);
    });
  });

  describe('Networking integrity', () => {
    test('ALB in public subnets; ECS in private subnets', () => {
      expectMatch(
        /resource\s+"aws_lb"\s+"main"[\s\S]*subnets\s*=\s*aws_subnet\.public\[\*\]\.id/
      );
      expectMatch(
        /resource\s+"aws_ecs_service"\s+"app"[\s\S]*subnets\s*=\s*aws_subnet\.private\[\*\]\.id/
      );
    });

    test('Public route table has default route to IGW', () => {
      expectMatch(
        /resource\s+"aws_route_table"\s+"public"[\s\S]*gateway_id\s*=\s*aws_internet_gateway\.main\.id/
      );
    });

    test('Private route tables route via NAT gateways', () => {
      expectMatch(
        /resource\s+"aws_route_table"\s+"private"[\s\S]*nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/
      );
    });
  });

  describe('Security constraints', () => {
    test('ALB SG exposes only 80/443 to allowed_cidrs', () => {
      const sgAlb = findBlock(
        /resource\s+"aws_security_group"\s+"alb"[\s\S]*?\n\}/
      );
      expect(sgAlb).toMatch(/from_port\s*=\s*80/);
      expect(sgAlb).toMatch(/from_port\s*=\s*443/);
      expect(sgAlb).toMatch(/cidr_blocks\s*=\s*var\.allowed_cidrs/);
    });

    test('ECS SG allows container_port only from ALB SG', () => {
      const sgEcs = findBlock(
        /resource\s+"aws_security_group"\s+"ecs"[\s\S]*?\n\}/
      );
      expect(sgEcs).toMatch(/from_port\s*=\s*var\.container_port/);
      expect(sgEcs).toMatch(
        /security_groups\s*=\s*\[aws_security_group\.alb\.id\]/
      );
    });

    test('RDS SG restricts ingress to ECS SG on DB port', () => {
      const sgRds = findBlock(
        /resource\s+"aws_security_group"\s+"rds"[\s\S]*?\n\}/
      );
      expect(sgRds).toMatch(/from_port\s*=\s*var\.db_port/);
      expect(sgRds).toMatch(
        /security_groups\s*=\s*\[aws_security_group\.ecs\.id\]/
      );
    });
  });

  describe('RDS data layer', () => {
    test('RDS subnet group uses private subnets', () => {
      expectMatch(
        /resource\s+"aws_db_subnet_group"\s+"main"[\s\S]*subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/
      );
    });

    test('RDS instance encrypted, Multi-AZ, backups and maintenance windows set', () => {
      const rds = findBlock(
        /resource\s+"aws_db_instance"\s+"main"[\s\S]*?\n\}/
      );
      expect(rds).toMatch(/storage_encrypted\s*=\s*true/);
      expect(rds).toMatch(/multi_az\s*=\s*true/);
      expect(rds).toMatch(/backup_retention_period\s*=\s*7/);
      // Accept either preferred_* or legacy names; our stack uses backup_window/maintenance_window
      expect(rds).toMatch(/backup_window\s*=|preferred_backup_window\s*=/);
      expect(rds).toMatch(
        /maintenance_window\s*=|preferred_maintenance_window\s*=/
      );
    });

    test('RDS SG and subnet group referenced by instance', () => {
      expectMatch(
        /vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/
      );
      expectMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });
  });

  describe('Secrets and IAM least-privilege', () => {
    test('Secrets created and referenced in task definition', () => {
      expectMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
      expectMatch(/resource\s+"aws_secretsmanager_secret"\s+"app_config"/);
      const td = findBlock(
        /resource\s+"aws_ecs_task_definition"\s+"app"[\s\S]*?\n\}/
      );
      expect(td).toMatch(/secrets\s*=\s*\[/);
      expect(td).toMatch(/aws_secretsmanager_secret\.db_password\.arn/);
      expect(td).toMatch(/aws_secretsmanager_secret\.app_config\.arn/);
    });

    test('Task role policy allows only GetSecretValue on those ARNs', () => {
      const pol = findBlock(
        /resource\s+"aws_iam_role_policy"\s+"ecs_task_secrets_policy"[\s\S]*?\n\}/
      );
      expect(pol).toMatch(
        /Action\s*=\s*\[[\s\S]*"secretsmanager:GetSecretValue"[\s\S]*\]/
      );
      expect(pol).toMatch(
        /Resource\s*=\s*\[[\s\S]*aws_secretsmanager_secret\.db_password\.arn[\s\S]*aws_secretsmanager_secret\.app_config\.arn[\s\S]*\]/
      );
    });
  });

  describe('ECS Fargate service behind ALB with blue/green', () => {
    test('Task definition uses FARGATE + awsvpc + logs driver + healthCheck', () => {
      const td = findBlock(
        /resource\s+"aws_ecs_task_definition"\s+"app"[\s\S]*?\n\}/
      );
      expect(td).toMatch(/requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/);
      expect(td).toMatch(/network_mode\s*=\s*"awsvpc"/);
      expect(td).toMatch(/logConfiguration[\s\S]*awslogs-group/);
      expect(td).toMatch(/healthCheck\s*=\s*\{/);
    });

    test('Two target groups (blue, green) exist with health checks on health_check_path', () => {
      expectMatch(
        /resource\s+"aws_lb_target_group"\s+"blue"[\s\S]*path\s*=\s*var\.health_check_path/
      );
      expectMatch(
        /resource\s+"aws_lb_target_group"\s+"green"[\s\S]*path\s*=\s*var\.health_check_path/
      );
    });

    test('Listeners forward to blue by default; ECS service uses CodeDeploy controller', () => {
      const http = findBlock(
        /resource\s+"aws_lb_listener"\s+"http"[\s\S]*?\n\}/
      );
      expect(http).toMatch(
        /default_action[\s\S]*target_group_arn\s*=\s*aws_lb_target_group\.blue\.arn/
      );
      const svc = findBlock(/resource\s+"aws_ecs_service"\s+"app"[\s\S]*?\n\}/);
      expect(svc).toMatch(
        /deployment_controller[\s\S]*type\s*=\s*"CODE_DEPLOY"/
      );
      expect(svc).toMatch(
        /load_balancer[\s\S]*target_group_arn\s*=\s*aws_lb_target_group\.blue\.arn/
      );
    });

    test('CodeDeploy deployment group uses target_group_pair_info and routes listeners', () => {
      const dg = findBlock(
        /resource\s+"aws_codedeploy_deployment_group"\s+"app"[\s\S]*?\n\}/
      );
      expect(dg).toMatch(/target_group_pair_info/);
      expect(dg).toMatch(
        /target_group[\s\S]*name\s*=\s*aws_lb_target_group\.blue\.name/
      );
      expect(dg).toMatch(
        /target_group[\s\S]*name\s*=\s*aws_lb_target_group\.green\.name/
      );
      expect(dg).toMatch(
        /prod_traffic_route[\s\S]*listener_arns\s*=\s*\[aws_lb_listener\.http\.arn\]/
      );
      expect(dg).toMatch(
        /test_traffic_route[\s\S]*listener_arns\s*=\s*\[aws_lb_listener\.test\.arn\]/
      );
    });

    test('App autoscaling target and policies reference the ECS service and cluster', () => {
      expectMatch(
        /resource\s+"aws_appautoscaling_target"\s+"ecs_target"[\s\S]*resource_id\s*=\s*"service\/\$\{aws_ecs_cluster\.main\.name\}\/\$\{aws_ecs_service\.app\.name\}"/
      );
      expectMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_cpu_policy"/);
      expectMatch(
        /resource\s+"aws_appautoscaling_policy"\s+"ecs_memory_policy"/
      );
    });
  });

  describe('Monitoring and outputs', () => {
    test('CloudWatch alarms for ALB 5XX, ECS CPU/Memory, RDS CPU/FreeStorage reference correct dimensions', () => {
      expectMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_5xx_errors"[\s\S]*LoadBalancer\s*=\s*aws_lb\.main\.arn_suffix/
      );
      expectMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu_high"[\s\S]*ServiceName\s*=\s*aws_ecs_service\.app\.name[\s\S]*ClusterName\s*=\s*aws_ecs_cluster\.main\.name/
      );
      expectMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_memory_high"[\s\S]*ServiceName\s*=\s*aws_ecs_service\.app\.name[\s\S]*ClusterName\s*=\s*aws_ecs_cluster\.main\.name/
      );
      expectMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"[\s\S]*DBInstanceIdentifier\s*=\s*aws_db_instance\.main\.id/
      );
      expectMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_free_storage_low"[\s\S]*DBInstanceIdentifier\s*=\s*aws_db_instance\.main\.id/
      );
    });

    test('All required outputs exist', () => {
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
      ].forEach(name =>
        expect(content).toMatch(new RegExp(`output\\s+"${name}"\\s*\\{`))
      );
    });
  });
});
