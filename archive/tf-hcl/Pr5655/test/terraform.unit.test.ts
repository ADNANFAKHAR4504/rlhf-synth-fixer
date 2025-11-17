// Unit tests for ECS Fargate Infrastructure Terraform configuration
// Tests validate Terraform configuration files without deploying infrastructure
// All tests are dynamic and region agnostic

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const STACK_PATH = path.join(LIB_DIR, 'tap_stack.tf');
const PROVIDER_PATH = path.join(LIB_DIR, 'provider.tf');
const VARIABLES_PATH = path.join(LIB_DIR, 'variables.tf');
const OUTPUTS_PATH = path.join(LIB_DIR, 'outputs.tf');
const TERRAFORM_TFVARS_PATH = path.join(LIB_DIR, 'terraform.tfvars');
const DEV_TFVARS_PATH = path.join(LIB_DIR, 'dev.tfvars');
const STAGING_TFVARS_PATH = path.join(LIB_DIR, 'staging.tfvars');
const PROD_TFVARS_PATH = path.join(LIB_DIR, 'prod.tfvars');

describe('ECS Fargate Infrastructure Configuration - Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;
  let outputsContent: string;

  beforeAll(() => {
    if (fs.existsSync(STACK_PATH)) {
      stackContent = fs.readFileSync(STACK_PATH, 'utf8');
    }
    if (fs.existsSync(PROVIDER_PATH)) {
      providerContent = fs.readFileSync(PROVIDER_PATH, 'utf8');
    }
    if (fs.existsSync(VARIABLES_PATH)) {
      variablesContent = fs.readFileSync(VARIABLES_PATH, 'utf8');
    }
    if (fs.existsSync(OUTPUTS_PATH)) {
      outputsContent = fs.readFileSync(OUTPUTS_PATH, 'utf8');
    }
  });

  describe('File Structure and Existence', () => {
    test('tap_stack.tf exists and is not empty', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(1000);
    });

    test('provider.tf exists and is not empty', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(50);
    });

    test('variables.tf exists and is not empty', () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(variablesContent.length).toBeGreaterThan(500);
    });

    test('outputs.tf exists and is not empty', () => {
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      expect(outputsContent.length).toBeGreaterThan(500);
    });

    test('terraform.tfvars exists', () => {
      expect(fs.existsSync(TERRAFORM_TFVARS_PATH)).toBe(true);
    });

    test('environment-specific tfvars files exist', () => {
      expect(fs.existsSync(DEV_TFVARS_PATH)).toBe(true);
      expect(fs.existsSync(STAGING_TFVARS_PATH)).toBe(true);
      expect(fs.existsSync(PROD_TFVARS_PATH)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf contains terraform block with required version', () => {
      expect(providerContent).toMatch(/terraform\s*\{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+/);
    });

    test('provider.tf contains AWS provider with dynamic region', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('provider.tf contains required providers block', () => {
      expect(providerContent).toMatch(/required_providers\s*\{/);
      expect(providerContent).toMatch(/aws\s*=\s*\{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\./);
    });

    test('tap_stack.tf does not contain provider blocks', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"/);
      expect(stackContent).not.toMatch(/terraform\s*\{\s*required_version/);
    });
  });

  describe('Variable Definitions', () => {
    test('variables.tf declares aws_region variable with string type', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
      expect(variablesContent).toMatch(/description\s*=\s*".*region.*"/i);
    });

    test('variables.tf declares project_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"\s*\{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('variables.tf declares environment variable with validation', () => {
      expect(variablesContent).toMatch(/variable\s+"environment"\s*\{/);
      expect(variablesContent).toMatch(/validation\s*\{/);
      expect(variablesContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
    });

    test('variables.tf declares cost_center variable', () => {
      expect(variablesContent).toMatch(/variable\s+"cost_center"\s*\{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('variables.tf declares certificate_arn variable for HTTPS', () => {
      expect(variablesContent).toMatch(/variable\s+"certificate_arn"\s*\{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('variables.tf declares health_check_path variable', () => {
      expect(variablesContent).toMatch(/variable\s+"health_check_path"\s*\{/);
      expect(variablesContent).toMatch(/default\s*=\s*"\/health"/);
    });
  });

  describe('Data Sources Configuration', () => {
    test('tap_stack.tf declares availability zones data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test('tap_stack.tf declares caller identity data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('tap_stack.tf declares current region data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  describe('Environment Configuration and Dynamic Values', () => {
    test('tap_stack.tf defines environment_config with dynamic CIDR blocks', () => {
      expect(stackContent).toMatch(/environment_config\s*=\s*\{/);
      expect(stackContent).toMatch(/dev\s*=\s*\{/);
      expect(stackContent).toMatch(/staging\s*=\s*\{/);
      expect(stackContent).toMatch(/prod\s*=\s*\{/);
    });

    test('environment configurations use non-overlapping CIDR blocks', () => {
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/); // dev
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.2\.0\.0\/16"/); // staging
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.3\.0\.0\/16"/); // prod
    });

    test('environment configurations define subnet CIDRs dynamically', () => {
      expect(stackContent).toMatch(/public_subnet_cidrs\s*=\s*\[/);
      expect(stackContent).toMatch(/private_subnet_cidrs\s*=\s*\[/);
      expect(stackContent).toMatch(/database_subnet_cidrs\s*=\s*\[/);
    });

    test('current_config uses variable environment selection', () => {
      expect(stackContent).toMatch(/current_config\s*=\s*local\.environment_config\[var\.environment\]/);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('tap_stack.tf defines name_prefix using variables', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment\}"/);
    });

    test('tap_stack.tf defines common_tags with required fields', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*\{/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/CostCenter\s*=\s*var\.cost_center/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test('uses dynamic availability zone references', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[/);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('creates VPC with dynamic CIDR from configuration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.current_config\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates Internet Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('creates public subnets with count-based deployment across AZs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.current_config\.public_subnet_cidrs\[count\.index\]/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('creates private subnets with count-based deployment', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.current_config\.private_subnet_cidrs\[count\.index\]/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('creates database subnets for RDS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.current_config\.database_subnet_cidrs\[count\.index\]/);
    });

    test('creates Elastic IPs for NAT gateways', () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('creates NAT gateways for high availability', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTPS and HTTP access', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('creates ECS security group allowing ALB traffic', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ecs"/);
      expect(stackContent).toMatch(/from_port\s*=\s*8080/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('creates RDS security group allowing ECS access', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ecs\.id\]/);
    });
  });

  describe('KMS Encryption', () => {
    test('creates KMS key for encryption', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test('creates KMS alias for the key', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });
  });

  describe('Secrets Manager', () => {
    test('creates random password for database', () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
      expect(stackContent).toMatch(/length\s*=\s*32/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });

    test('creates secrets manager secret for DB credentials', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*7/);
    });

    test('creates secret version with username and password', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_credentials"/);
      expect(stackContent).toMatch(/secret_string\s*=\s*jsonencode/);
    });

    test('creates automatic secret rotation', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_rotation"\s+"db_credentials"/);
      expect(stackContent).toMatch(/rotation_lambda_arn\s*=\s*aws_lambda_function\.rotate_secret\.arn/);
    });
  });

  describe('RDS Aurora Configuration', () => {
    test('creates DB subnet group for Aurora', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });

    test('creates RDS Aurora cluster with encryption', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"main"/);
      expect(stackContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('Aurora cluster uses environment-specific configuration', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*local\.current_config\.backup_retention/);
      expect(stackContent).toMatch(/deletion_protection\s*=\s*local\.current_config\.deletion_protection/);
    });

    test('creates Aurora cluster instances with monitoring', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"cluster_instances"/);
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/monitoring_interval\s*=\s*60/);
    });
  });

  describe('ECR Repository', () => {
    test('creates ECR repository with vulnerability scanning', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"main"/);
      expect(stackContent).toMatch(/scan_on_push\s*=\s*true/);
      expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
    });

    test('creates ECR lifecycle policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"main"/);
      expect(stackContent).toMatch(/repository\s*=\s*aws_ecr_repository\.main\.name/);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates ECS execution role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_execution_role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"ecs-tasks\.amazonaws\.com"/);
    });

    test('attaches ECS execution policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ecs_execution_role_policy"/);
      expect(stackContent).toMatch(/AmazonECSTaskExecutionRolePolicy/);
    });

    test('creates ECS task role with X-Ray permissions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ecs_task_xray_policy"/);
      expect(stackContent).toMatch(/AWSXRayDaemonWriteAccess/);
    });

    test('creates RDS enhanced monitoring role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/);
      expect(stackContent).toMatch(/monitoring\.rds\.amazonaws\.com/);
    });
  });

  describe('ECS Configuration', () => {
    test('creates CloudWatch log group with encryption', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ecs"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('creates ECS cluster with container insights', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
      expect(stackContent).toMatch(/containerInsights/);
      expect(stackContent).toMatch(/value\s*=\s*"enabled"/);
    });

    test('creates ECS task definition with Fargate compatibility', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"app"/);
      expect(stackContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
      expect(stackContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
      expect(stackContent).toMatch(/cpu\s*=\s*local\.current_config\.ecs_cpu/);
      expect(stackContent).toMatch(/memory\s*=\s*local\.current_config\.ecs_memory/);
    });

    test('task definition includes X-Ray sidecar container', () => {
      expect(stackContent).toMatch(/xray-daemon/);
      expect(stackContent).toMatch(/public\.ecr\.aws\/xray\/aws-xray-daemon/);
    });

    test('task definition includes application container with secrets', () => {
      expect(stackContent).toMatch(/"app"/);
      expect(stackContent).toMatch(/secrets\s*=\s*\[/);
      expect(stackContent).toMatch(/DB_PASSWORD/);
      expect(stackContent).toMatch(/DB_USERNAME/);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('creates Application Load Balancer', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test('creates blue and green target groups', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"blue"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"green"/);
      expect(stackContent).toMatch(/target_type\s*=\s*"ip"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });

    test('creates ALB listeners', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
    });

    test('creates conditional HTTPS listener', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.certificate_arn\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });
  });

  describe('ECS Service Configuration', () => {
    test('creates ECS service with proper configuration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecs_service"\s+"main"/);
      expect(stackContent).toMatch(/launch_type\s*=\s*"FARGATE"/);
      expect(stackContent).toMatch(/desired_count\s*=\s*local\.current_config\.ecs_desired_count/);
    });

    test('ECS service uses private subnets', () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(stackContent).toMatch(/assign_public_ip\s*=\s*false/);
    });

    test('ECS service has deployment configuration', () => {
      expect(stackContent).toMatch(/deployment_maximum_percent\s*=\s*200/);
      expect(stackContent).toMatch(/deployment_minimum_healthy_percent\s*=\s*50/);
    });

    test('ECS service has circuit breaker configuration', () => {
      expect(stackContent).toMatch(/deployment_circuit_breaker\s*\{/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
      expect(stackContent).toMatch(/rollback\s*=\s*true/);
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('creates auto scaling target', () => {
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs_target"/);
      expect(stackContent).toMatch(/scalable_dimension\s*=\s*"ecs:service:DesiredCount"/);
      expect(stackContent).toMatch(/service_namespace\s*=\s*"ecs"/);
    });

    test('creates CPU-based scaling policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_cpu_policy"/);
      expect(stackContent).toMatch(/ECSServiceAverageCPUUtilization/);
      expect(stackContent).toMatch(/target_value\s*=\s*70\.0/);
    });

    test('creates memory-based scaling policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_memory_policy"/);
      expect(stackContent).toMatch(/ECSServiceAverageMemoryUtilization/);
      expect(stackContent).toMatch(/target_value\s*=\s*70\.0/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates ECS CPU utilization alarm', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_high_cpu"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/ECS"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"80"/);
    });

    test('creates ECS memory utilization alarm', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_high_memory"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"MemoryUtilization"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/ECS"/);
    });

    test('creates ALB response time alarm', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_high_response_time"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"TargetResponseTime"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/ApplicationELB"/);
    });

    test('creates RDS CPU utilization alarm', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_high_cpu"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/RDS"/);
      expect(stackContent).toMatch(/DBClusterIdentifier/);
    });
  });

  describe('Output Configuration', () => {
    test('outputs.tf declares ALB DNS name', () => {
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
    });

    test('outputs.tf declares VPC ID', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test('outputs.tf declares Aurora cluster endpoint', () => {
      expect(outputsContent).toMatch(/output\s+"rds_cluster_endpoint"/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_rds_cluster\.main\.endpoint/);
      expect(outputsContent).toMatch(/sensitive\s*=\s*false/);
    });

    test('outputs.tf declares ECR repository URL', () => {
      expect(outputsContent).toMatch(/output\s+"ecr_repository_url"/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_ecr_repository\.main\.repository_url/);
    });

    test('outputs.tf declares ECS cluster information', () => {
      expect(outputsContent).toMatch(/output\s+"ecs_cluster_name"/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_ecs_cluster\.main\.name/);
    });
  });

  describe('Environment-Specific Configuration Files', () => {
    test('dev.tfvars contains development-specific settings', () => {
      if (fs.existsSync(DEV_TFVARS_PATH)) {
        const devContent = fs.readFileSync(DEV_TFVARS_PATH, 'utf8');
        expect(devContent).toMatch(/environment\s*=\s*"dev"/);
        expect(devContent).toMatch(/cost_center\s*=\s*"engineering"/);
        expect(devContent).toMatch(/enable_deletion_protection\s*=\s*false/);
      }
    });

    test('staging.tfvars contains staging-specific settings', () => {
      if (fs.existsSync(STAGING_TFVARS_PATH)) {
        const stagingContent = fs.readFileSync(STAGING_TFVARS_PATH, 'utf8');
        expect(stagingContent).toMatch(/environment\s*=\s*"staging"/);
        expect(stagingContent).toMatch(/cost_center\s*=\s*"engineering"/);
        expect(stagingContent).toMatch(/enable_multi_az_override\s*=\s*true/);
      }
    });

    test('prod.tfvars contains production-specific settings', () => {
      if (fs.existsSync(PROD_TFVARS_PATH)) {
        const prodContent = fs.readFileSync(PROD_TFVARS_PATH, 'utf8');
        expect(prodContent).toMatch(/environment\s*=\s*"prod"/);
        expect(prodContent).toMatch(/10\.3\.0\.0\/16/);
      }
    });
  });

  describe('No Hardcoded Values Validation', () => {
    test('no hardcoded AWS regions in main configuration', () => {
      expect(stackContent).not.toMatch(/us-east-1|us-west-2|eu-west-1|ap-south-1/);
    });

    test('no hardcoded account IDs', () => {
      expect(stackContent).not.toMatch(/\b\d{12}\b/);
    });

    test('uses variables for region references', () => {
      expect(stackContent).toMatch(/var\.aws_region/);
    });

    test('uses dynamic availability zone selection', () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available/);
    });

    test('uses environment-specific configuration', () => {
      expect(stackContent).toMatch(/local\.current_config/);
      expect(stackContent).toMatch(/var\.environment/);
    });
  });

  describe('Terraform Best Practices', () => {
    test('resources use proper naming conventions', () => {
      expect(stackContent).toMatch(/local\.name_prefix/);
      expect(stackContent).toMatch(/merge\(local\.common_tags/);
    });

    test('uses data sources for dynamic values', () => {
      expect(stackContent).toMatch(/data\.aws_caller_identity\.current/);
      expect(stackContent).toMatch(/data\.aws_region\.current|var\.aws_region/);
    });

    test('implements proper resource dependencies', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
    });

    test('uses lifecycle management where appropriate', () => {
      expect(stackContent).toMatch(/lifecycle\s*\{/);
      expect(stackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });
});
