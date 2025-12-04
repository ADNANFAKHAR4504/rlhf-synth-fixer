// terraform.unit.test.ts
// Comprehensive unit tests for Multi-Environment AWS Infrastructure Terraform Stack
// Tests validate structure, configuration, and compliance without executing Terraform

import * as fs from 'fs';
import * as path from 'path';

// File paths - dynamically resolved
const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const VARIABLES_PATH = path.resolve(__dirname, '../lib/variables.tf');
const OUTPUTS_PATH = path.resolve(__dirname, '../lib/outputs.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');

// Helper functions
const readFileContent = (filePath: string): string => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
};

const hasResource = (content: string, resourceType: string, resourceName: string): boolean => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`);
  return regex.test(content);
};

const hasDataSource = (content: string, dataType: string, dataName: string): boolean => {
  const regex = new RegExp(`data\\s+"${dataType}"\\s+"${dataName}"`);
  return regex.test(content);
};

const hasVariable = (content: string, variableName: string): boolean => {
  const regex = new RegExp(`variable\\s+"${variableName}"`);
  return regex.test(content);
};

const hasOutput = (content: string, outputName: string): boolean => {
  const regex = new RegExp(`output\\s+"${outputName}"`);
  return regex.test(content);
};

const hasResourceAttribute = (content: string, resourceType: string, resourceName: string, attribute: string): boolean => {
  const resourceRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?${attribute}\\s*=`, 's');
  return resourceRegex.test(content);
};

const countResourceOccurrences = (content: string, resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

const hasTagging = (content: string, resourceType: string, resourceName: string): boolean => {
  const tagsRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?tags\\s*=`, 's');
  return tagsRegex.test(content);
};

const hasEnvironmentSpecificConfig = (content: string): boolean => {
  return /locals\s*{[\s\S]*environments\s*=/.test(content);
};

describe('Multi-Environment AWS Infrastructure Terraform Stack - Unit Tests', () => {
  let stackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = readFileContent(STACK_PATH);
    variablesContent = readFileContent(VARIABLES_PATH);
    outputsContent = readFileContent(OUTPUTS_PATH);
    providerContent = readFileContent(PROVIDER_PATH);
  });

  describe('File Structure and Existence', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('tap_stack.tf is sufficiently comprehensive', () => {
      expect(stackContent.length).toBeGreaterThan(15000);
    });

    test('variables.tf contains comprehensive variable definitions', () => {
      expect(variablesContent.length).toBeGreaterThan(500);
    });

    test('outputs.tf contains comprehensive output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(3000);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\./);
    });

    test('declares AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*?version\s*=\s*">=\s*5\./s);
    });

    test('configures S3 backend without hardcoded values', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
      expect(providerContent).not.toMatch(/"us-east-1"|"us-west-1"|"eu-west-1"/);
    });
  });

  describe('Variables Configuration', () => {
    test('defines environment variable with validation', () => {
      expect(hasVariable(variablesContent, 'environment')).toBe(true);
      expect(variablesContent).toMatch(/validation\s*{[\s\S]*?environment/s);
    });

    test('defines aws_region variable with appropriate default', () => {
      expect(hasVariable(variablesContent, 'aws_region')).toBe(true);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-2"/);
    });

    test('defines common_tags variable for resource tagging', () => {
      expect(hasVariable(variablesContent, 'common_tags')).toBe(true);
      expect(variablesContent).toMatch(/type\s*=\s*map\(string\)/);
    });

    test('variables use dynamic defaults (no hardcoded regions except default)', () => {
      const hardcodedRegions = variablesContent.match(/"us-west-1"|"eu-west-1"|"ap-southeast-1"/g);
      expect(hardcodedRegions).toBeNull();
    });
  });

  describe('Data Sources', () => {
    test('declares availability zones data source', () => {
      expect(hasDataSource(stackContent, 'aws_availability_zones', 'available')).toBe(true);
    });

    test('declares caller identity data source', () => {
      expect(hasDataSource(stackContent, 'aws_caller_identity', 'current')).toBe(true);
    });

    test('declares region data source', () => {
      expect(hasDataSource(stackContent, 'aws_region', 'current')).toBe(true);
    });

    test('availability zones data source uses dynamic state filter', () => {
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('declares locals block with environments configuration', () => {
      expect(hasEnvironmentSpecificConfig(stackContent)).toBe(true);
    });

    test('defines non-overlapping VPC CIDR blocks for environments', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*?vpc_cidr_base\s*=\s*10/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*?vpc_cidr_base\s*=\s*20/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*?vpc_cidr_base\s*=\s*30/s);
    });

    test('defines environment-specific ECS task counts', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*?ecs_task_count\s*=\s*1/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*?ecs_task_count\s*=\s*2/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*?ecs_task_count\s*=\s*4/s);
    });

    test('defines environment-specific RDS instance classes', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*?db_instance_class\s*=\s*"db\.t3\.medium"/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*?db_instance_class\s*=\s*"db\.r5\.large"/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*?db_instance_class\s*=\s*"db\.r5\.xlarge"/s);
    });

    test('defines environment-specific log retention periods', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*?log_retention_days\s*=\s*7/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*?log_retention_days\s*=\s*30/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*?log_retention_days\s*=\s*90/s);
    });

    test('uses current account ID from data source', () => {
      expect(stackContent).toMatch(/current_account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
    });
  });

  describe('Networking Infrastructure', () => {
    test('declares VPC with dynamic CIDR calculation', () => {
      expect(hasResource(stackContent, 'aws_vpc', 'main')).toBe(true);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.\$\{local\.current_env\.vpc_cidr_base\}\.0\.0\/16"/);
    });

    test('VPC enables DNS hostnames and support', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_hostnames')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_support')).toBe(true);
    });

    test('declares Internet Gateway', () => {
      expect(hasResource(stackContent, 'aws_internet_gateway', 'main')).toBe(true);
    });

    test('declares public subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'public')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*public.*count\s*=\s*2/s);
    });

    test('declares private subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'private')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*private.*count\s*=\s*2/s);
    });

    test('declares database subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'database')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*database.*count\s*=\s*2/s);
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      expect(stackContent).toMatch(/aws_subnet.*public[\s\S]*?map_public_ip_on_launch\s*=\s*true/s);
    });

    test('subnets use dynamic availability zones', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('declares NAT gateway with EIP', () => {
      expect(hasResource(stackContent, 'aws_nat_gateway', 'main')).toBe(true);
      expect(hasResource(stackContent, 'aws_eip', 'nat')).toBe(true);
    });

    test('EIP uses VPC domain', () => {
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('declares public and private route tables', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table', 'private')).toBe(true);
    });

    test('declares route table associations', () => {
      expect(hasResource(stackContent, 'aws_route_table_association', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table_association', 'private')).toBe(true);
    });

    test('route table associations use count based on subnet count', () => {
      expect(stackContent).toMatch(/aws_route_table_association.*public.*count\s*=\s*length\(aws_subnet\.public\)/s);
      expect(stackContent).toMatch(/aws_route_table_association.*private.*count\s*=\s*length\(aws_subnet\.private\)/s);
    });
  });

  describe('Security Groups', () => {
    const securityGroups = ['alb', 'ecs', 'rds'];

    test.each(securityGroups)('declares %s security group', (sgName) => {
      expect(hasResource(stackContent, 'aws_security_group', sgName)).toBe(true);
    });

    test('ALB security group allows HTTP and HTTPS ingress', () => {
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*?from_port\s*=\s*80/s);
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*?from_port\s*=\s*443/s);
    });

    test('ECS security group allows traffic from ALB', () => {
      expect(stackContent).toMatch(/aws_security_group.*ecs[\s\S]*?security_groups\s*=\s*\[aws_security_group\.alb\.id\]/s);
    });

    test('RDS security group allows traffic from ECS', () => {
      expect(stackContent).toMatch(/aws_security_group.*rds[\s\S]*?security_groups\s*=\s*\[aws_security_group\.ecs\.id\]/s);
      expect(stackContent).toMatch(/aws_security_group.*rds[\s\S]*?from_port\s*=\s*5432/s);
    });

    test('all security groups have appropriate tagging', () => {
      securityGroups.forEach(sgName => {
        expect(hasTagging(stackContent, 'aws_security_group', sgName)).toBe(true);
      });
    });
  });

  describe('RDS Aurora Configuration', () => {
    test('declares RDS Aurora cluster', () => {
      expect(hasResource(stackContent, 'aws_rds_cluster', 'main')).toBe(true);
    });

    test('RDS cluster uses PostgreSQL engine version 15.10', () => {
      expect(stackContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"15\.10"/);
    });

    test('RDS cluster uses managed master password', () => {
      expect(stackContent).toMatch(/manage_master_user_password\s*=\s*true/);
    });

    test('RDS cluster has environment-specific backup retention', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test('RDS cluster has environment-specific deletion protection', () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*var\.environment\s*==\s*"prod"/);
    });

    test('declares RDS cluster instance', () => {
      expect(hasResource(stackContent, 'aws_rds_cluster_instance', 'main')).toBe(true);
    });

    test('RDS instance uses environment-specific instance class', () => {
      expect(stackContent).toMatch(/instance_class\s*=\s*local\.current_env\.db_instance_class/);
    });

    test('RDS instance has environment-specific performance insights', () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*var\.environment\s*!=\s*"dev"/);
    });

    test('declares database subnet group', () => {
      expect(hasResource(stackContent, 'aws_db_subnet_group', 'main')).toBe(true);
    });
  });

  describe('ECS Configuration', () => {
    test('declares ECS cluster', () => {
      expect(hasResource(stackContent, 'aws_ecs_cluster', 'main')).toBe(true);
    });

    test('ECS cluster has environment-specific container insights', () => {
      expect(stackContent).toMatch(/value\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*"enabled"\s*:\s*"disabled"/);
    });

    test('declares ECS task definition', () => {
      expect(hasResource(stackContent, 'aws_ecs_task_definition', 'app')).toBe(true);
    });

    test('ECS task definition uses Fargate launch type', () => {
      expect(stackContent).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
      expect(stackContent).toMatch(/network_mode\s*=\s*"awsvpc"/);
    });

    test('ECS task definition has execution and task roles', () => {
      expect(stackContent).toMatch(/execution_role_arn\s*=\s*aws_iam_role\.ecs_execution\.arn/);
      expect(stackContent).toMatch(/task_role_arn\s*=\s*aws_iam_role\.ecs_task\.arn/);
    });

    test('declares ECS service', () => {
      expect(hasResource(stackContent, 'aws_ecs_service', 'app')).toBe(true);
    });

    test('ECS service uses environment-specific desired count', () => {
      expect(stackContent).toMatch(/desired_count\s*=\s*local\.current_env\.ecs_task_count/);
    });

    test('ECS service runs in private subnets', () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe('Application Load Balancer', () => {
    test('declares Application Load Balancer', () => {
      expect(hasResource(stackContent, 'aws_lb', 'main')).toBe(true);
    });

    test('ALB is internet-facing', () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('ALB has environment-specific deletion protection', () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*var\.environment\s*==\s*"prod"/);
    });

    test('declares ALB target group', () => {
      expect(hasResource(stackContent, 'aws_lb_target_group', 'app')).toBe(true);
    });

    test('ALB target group uses IP target type for Fargate', () => {
      expect(stackContent).toMatch(/target_type\s*=\s*"ip"/);
    });

    test('ALB target group has environment-specific health check intervals', () => {
      expect(stackContent).toMatch(/interval\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*60/);
    });

    test('declares ALB listener', () => {
      expect(hasResource(stackContent, 'aws_lb_listener', 'app')).toBe(true);
    });
  });

  describe('S3 Configuration', () => {
    test('declares S3 bucket with random suffix', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket', 'assets')).toBe(true);
      expect(hasResource(stackContent, 'random_string', 'bucket_suffix')).toBe(true);
    });

    test('S3 bucket has versioning enabled', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_versioning', 'assets')).toBe(true);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 bucket has lifecycle configuration', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_lifecycle_configuration', 'assets')).toBe(true);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
      expect(stackContent).toMatch(/days\s*=\s*90/);
    });

    test('S3 bucket has server-side encryption', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_server_side_encryption_configuration', 'assets')).toBe(true);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });
  });

  describe('IAM Configuration', () => {
    test('declares ECS execution role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'ecs_execution')).toBe(true);
    });

    test('declares ECS task role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'ecs_task')).toBe(true);
    });

    test('ECS execution role has managed policy attachment', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy_attachment', 'ecs_execution')).toBe(true);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AmazonECSTaskExecutionRolePolicy"/);
    });

    test('IAM roles have proper assume role policies', () => {
      expect(stackContent).toMatch(/Service.*ecs-tasks\.amazonaws\.com/);
    });
  });

  describe('Secrets Management', () => {
    test('uses AWS managed master user password', () => {
      expect(stackContent).toMatch(/manage_master_user_password\s*=\s*true/);
    });

    test('does not use manual secrets management', () => {
      // Should NOT have manual secret resources since we use AWS managed
      expect(hasResource(stackContent, 'aws_secretsmanager_secret', 'rds_password')).toBe(false);
      expect(hasResource(stackContent, 'aws_secretsmanager_secret_version', 'rds_password')).toBe(false);
      expect(hasResource(stackContent, 'random_password', 'rds_master_password')).toBe(false);
    });

    test('uses default AWS managed KMS key', () => {
      expect(stackContent).toMatch(/master_user_secret_kms_key_id\s*=\s*null/);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('declares CloudWatch log group', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'ecs')).toBe(true);
    });

    test('CloudWatch log group uses environment-specific retention', () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*local\.current_env\.log_retention_days/);
    });

    test('declares CloudWatch dashboard', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_dashboard', 'main')).toBe(true);
    });

    test('declares production-only CloudWatch alarms', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'high_cpu')).toBe(true);
      expect(stackContent).toMatch(/count\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*1\s*:\s*0/);
    });
  });

  describe('Resource Tagging', () => {
    const taggedResources = [
      ['aws_vpc', 'main'],
      ['aws_internet_gateway', 'main'],
      ['aws_subnet', 'public'],
      ['aws_subnet', 'private'],
      ['aws_subnet', 'database'],
      ['aws_security_group', 'alb'],
      ['aws_security_group', 'ecs'],
      ['aws_security_group', 'rds'],
      ['aws_ecs_cluster', 'main'],
      ['aws_rds_cluster', 'main'],
      ['aws_s3_bucket', 'assets'],
      ['aws_lb', 'main']
    ];

    test.each(taggedResources)('resource %s.%s has proper tagging', (resourceType, resourceName) => {
      expect(hasTagging(stackContent, resourceType, resourceName)).toBe(true);
    });

    test('common tags include required fields', () => {
      expect(stackContent).toMatch(/Project\s*=\s*local\.project_name/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Owner\s*=\s*"Platform Team"/);
      expect(stackContent).toMatch(/CostCenter\s*=\s*"Engineering"/);
    });
  });

  describe('Output Configuration', () => {
    const expectedOutputs = [
      'vpc_id',
      'vpc_cidr_block',
      'public_subnet_ids',
      'private_subnet_ids',
      'database_subnet_ids',
      'alb_dns_name',
      'alb_zone_id',
      'ecs_cluster_name',
      'ecs_service_name',
      'rds_cluster_identifier',
      'rds_cluster_endpoint',
      's3_bucket_name',
      'environment',
      'aws_region',
      'application_url'
    ];

    test.each(expectedOutputs)('declares output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('sensitive outputs are marked appropriately', () => {
      expect(outputsContent).toMatch(/output\s+"rds_cluster_endpoint"[\s\S]*?sensitive\s*=\s*true/s);
      expect(outputsContent).toMatch(/output\s+"rds_cluster_reader_endpoint"[\s\S]*?sensitive\s*=\s*true/s);
    });

    test('application URL output uses ALB DNS name', () => {
      expect(outputsContent).toMatch(/value\s*=\s*"http:\/\/\$\{aws_lb\.main\.dns_name\}"/);
    });
  });

  describe('Best Practices and Compliance', () => {
    test('no hardcoded secrets or passwords', () => {
      const secretPatterns = [
        /password\s*=\s*"[^"]*"/,
        /secret\s*=\s*"[^"]*"/,
        /key\s*=\s*"[A-Za-z0-9]{20,}"/
      ];

      secretPatterns.forEach(pattern => {
        expect(stackContent).not.toMatch(pattern);
      });
    });

    test('uses consistent naming conventions', () => {
      expect(stackContent).toMatch(/resource_prefix\s*=\s*"\$\{local\.project_name\}-\$\{var\.environment\}"/);
    });

    test('follows infrastructure as code principles', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
    });

    test('implements proper resource dependencies', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_lb_listener\.app\]/);
    });

    test('uses dynamic resource references', () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.\w+\[\*\]\.id/);
      // Check that we're not using hardcoded AWS subnet IDs
      const hardcodedSubnetPattern = /subnet_id\s*=\s*"subnet-[a-z0-9]+"/;
      expect(stackContent).not.toMatch(hardcodedSubnetPattern);
    });
  });
});
