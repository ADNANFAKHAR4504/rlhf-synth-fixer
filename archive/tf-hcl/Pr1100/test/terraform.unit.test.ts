import * as fs from 'fs';
import * as path from 'path';

//===============================================================================
// Static validation for Terraform HCL files in lib/
//===============================================================================

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');
const PROVIDER_TF = path.join(LIB_DIR, 'provider.tf');

const read = (p: string) => fs.readFileSync(p, 'utf8');
const hasIn = (p: string, re: RegExp) => re.test(read(p));
const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('provider.tf static structure', () => {
  it('exists and has content', () => {
    expect(fs.existsSync(PROVIDER_TF)).toBe(true);
    expect(read(PROVIDER_TF).length).toBeGreaterThan(30);
  });

  it('declares terraform block with required version and aws provider constraints', () => {
    expect(hasIn(PROVIDER_TF, /terraform\s*{[\s\S]*?required_version\s*=\s*"?>=\s*1\.4\.0"?[\s\S]*?}/)).toBe(true);
    expect(
      hasIn(
        PROVIDER_TF,
        /required_providers\s*{[\s\S]*?aws\s*=\s*{[\s\S]*?source\s*=\s*"?hashicorp\/aws"?[\s\S]*?version\s*=\s*"?>=\s*5\.0"?[\s\S]*?}/
      )
    ).toBe(true);
  });

  it('configures s3 backend (partial config allowed)', () => {
    expect(hasIn(PROVIDER_TF, /backend\s+"s3"\s*{\s*}/)).toBe(true);
  });

  it('does not contain hardcoded AWS credentials', () => {
    expect(hasIn(PROVIDER_TF, /aws_access_key_id\s*=/)).toBe(false);
    expect(hasIn(PROVIDER_TF, /aws_secret_access_key\s*=/)).toBe(false);
  });
});

describe('main.tf static structure', () => {
  it('exists and has content', () => {
    expect(fs.existsSync(MAIN_TF)).toBe(true);
    expect(read(MAIN_TF).length).toBeGreaterThan(200);
  });

  it('defines expected data sources (availability zones, caller identity, region)', () => {
    expect(hasIn(MAIN_TF, /data\s+"aws_availability_zones"\s+"available"[\s\S]*?state\s*=\s*"available"/)).toBe(true);
    expect(hasIn(MAIN_TF, /data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    expect(hasIn(MAIN_TF, /data\s+"aws_region"\s+"current"/)).toBe(true);
  });

  it('declares locals for vpc and subnets', () => {
    expect(hasIn(MAIN_TF, /locals\s*{[\s\S]*?vpc_cidr\s*=\s*"\d+\.\d+\.\d+\.\d+\/\d+"/)).toBe(true);
    expect(hasIn(MAIN_TF, /locals[\s\S]*?public_subnets\s*=\s*\[[\s\S]*?\]/)).toBe(true);
    expect(hasIn(MAIN_TF, /locals[\s\S]*?private_subnets\s*=\s*\[[\s\S]*?\]/)).toBe(true);
  });

  it('creates KMS key with rotation and alias', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_kms_key"\s+"main"[\s\S]*?enable_key_rotation\s*=\s*true/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_kms_alias"\s+"main"[\s\S]*?target_key_id\s*=\s*aws_kms_key\.main\.key_id/)).toBe(true);
  });

  it('creates VPC with DNS support/hostnames', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_vpc"\s+"main"[\s\S]*?cidr_block\s*=\s*local\.vpc_cidr/)).toBe(true);
    expect(hasIn(MAIN_TF, /enable_dns_support\s*=\s*true/)).toBe(true);
    expect(hasIn(MAIN_TF, /enable_dns_hostnames\s*=\s*true/)).toBe(true);
  });

  it('creates IGW and attaches to VPC', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_internet_gateway"\s+"main"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
  });

  it('creates public and private subnets with correct counts', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*length\(local\.public_subnets\)/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*length\(local\.private_subnets\)/)).toBe(true);
    expect(hasIn(MAIN_TF, /map_public_ip_on_launch\s*=\s*true/)).toBe(true);
  });

  it('allocates EIPs and NAT Gateways in public subnets', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_eip"\s+"nat"[\s\S]*?domain\s*=\s*"vpc"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?subnet_id\s*=\s*aws_subnet\.public\[count\.index]\.(id|arn)/)).toBe(true);
  });

  it('public route table has default route to IGW and associations for all public subnets', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_route_table"\s+"public"[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    expect(hasIn(MAIN_TF, /route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id[\s\S]*?}/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_route_table_association"\s+"public"[\s\S]*?count\s*=\s*length\(aws_subnet\.public\)/)).toBe(true);
  });

  it('private route tables route through NAT and are associated with private subnets', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_route_table"\s+"private"[\s\S]*?count\s*=\s*length\(local\.private_subnets\)/)).toBe(true);
    expect(hasIn(MAIN_TF, /route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index]/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_route_table_association"\s+"private"[\s\S]*?count\s*=\s*length\(aws_subnet\.private\)/)).toBe(true);
  });

  it('defines security groups for ALB, ECS service, and RDS with expected rules', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_security_group"\s+"alb"[\s\S]*?ingress[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_security_group"\s+"ecs_service"[\s\S]*?security_groups\s*=\s*\[\s*aws_security_group\.alb\.id\s*\]/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_security_group"\s+"rds"[\s\S]*?from_port\s*=\s*local\.db_port[\s\S]*?security_groups\s*=\s*\[\s*aws_security_group\.ecs_service\.id\s*\]/)).toBe(true);
  });

  it('creates S3 bucket with versioning, SSE-KMS, and public access block', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_s3_bucket"\s+"app_assets"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_s3_bucket_versioning"\s+"app_assets"[\s\S]*?status\s*=\s*"Enabled"/)).toBe(true);
    expect(
      hasIn(
        MAIN_TF,
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app_assets"[\s\S]*?sse_algorithm\s*=\s*"aws:kms"/
      )
    ).toBe(true);
    expect(
      hasIn(
        MAIN_TF,
        /resource\s+"aws_s3_bucket_public_access_block"\s+"app_assets"[\s\S]*?block_public_acls\s*=\s*true[\s\S]*?restrict_public_buckets\s*=\s*true/
      )
    ).toBe(true);
  });

  it('defines IAM roles and policies for ECS task execution and task role', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_iam_role"\s+"ecs_task_execution_role"/)).toBe(true);
    expect(hasIn(MAIN_TF, /aws_iam_role_policy_attachment"\s+"ecs_task_execution_role_policy"[\s\S]*?AmazonECSTaskExecutionRolePolicy/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_iam_role"\s+"ecs_task_role"/)).toBe(true);
  });

  it('configures CloudWatch log groups for ECS and RDS using KMS', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_cloudwatch_log_group"\s+"ecs"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main\.arn/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_cloudwatch_log_group"\s+"rds"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main\.arn/)).toBe(true);
  });

  it('creates ALB, target group, and listener wiring to ECS target group', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_lb"\s+"main"[\s\S]*?load_balancer_type\s*=\s*"application"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_lb_target_group"\s+"app"[\s\S]*?target_type\s*=\s*"ip"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_lb_listener"\s+"app"[\s\S]*?default_action[\s\S]*?target_group_arn\s*=\s*aws_lb_target_group\.app\.arn/)).toBe(true);
  });

  it('creates ECS cluster, capacity providers, task definition, and service without public IPs', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_ecs_cluster"\s+"main"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_ecs_cluster_capacity_providers"\s+"main"[\s\S]*?capacity_providers\s*=\s*\[\s*"FARGATE",\s*"FARGATE_SPOT"\s*\]/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_ecs_task_definition"\s+"app"[\s\S]*?requires_compatibilities\s*=\s*\[\s*"FARGATE"\s*\]/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_ecs_service"\s+"app"[\s\S]*?assign_public_ip\s*=\s*false/)).toBe(true);
  });

  it('configures autoscaling target and step scaling policies', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_appautoscaling_target"\s+"ecs_target"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_appautoscaling_policy"\s+"ecs_policy_up"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_appautoscaling_policy"\s+"ecs_policy_down"/)).toBe(true);
  });

  it('configures CloudWatch alarms for CPU high/low linked to scaling policies', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"[\s\S]*?alarm_actions\s*=\s*\[\s*aws_appautoscaling_policy\.ecs_policy_up\.arn\s*\]/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"[\s\S]*?alarm_actions\s*=\s*\[\s*aws_appautoscaling_policy\.ecs_policy_down\.arn\s*\]/)).toBe(true);
  });

  it('creates RDS subnet group, random password, and encrypted DB instance', () => {
    expect(hasIn(MAIN_TF, /resource\s+"aws_db_subnet_group"\s+"main"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"random_password"\s+"db_password"/)).toBe(true);
    expect(hasIn(MAIN_TF, /resource\s+"aws_db_instance"\s+"main"[\s\S]*?storage_encrypted\s*=\s*true[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.main\.arn/)).toBe(true);
  });

  it('declares required outputs including sensitive rds_endpoint', () => {
    const outputs = [
      'vpc_id',
      'public_subnet_ids',
      'private_subnet_ids',
      'alb_dns_name',
      'alb_zone_id',
      'ecs_cluster_name',
      'ecs_service_name',
      'rds_endpoint',
      's3_bucket_name',
      'kms_key_id',
      'cloudwatch_log_group_name',
    ];
    outputs.forEach((o) => {
      expect(hasIn(MAIN_TF, new RegExp(`output\\s+"${escapeRe(o)}"`))).toBe(true);
    });
    expect(hasIn(MAIN_TF, /output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/)).toBe(true);
  });

  it('does not contain hardcoded AWS credentials', () => {
    expect(hasIn(MAIN_TF, /aws_access_key_id\s*=/)).toBe(false);
    expect(hasIn(MAIN_TF, /aws_secret_access_key\s*=/)).toBe(false);
  });
});
