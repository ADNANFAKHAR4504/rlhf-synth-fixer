// terraform.unit.test.ts
// Comprehensive unit tests for Multi-Region Trading Platform Infrastructure
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

const hasRegionSpecificConfig = (content: string): boolean => {
  return /locals\s*{[\s\S]*region_config\s*=/.test(content);
};

describe('Multi-Region Trading Platform Infrastructure - Unit Tests', () => {
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

    test('tap_stack.tf is comprehensive', () => {
      expect(stackContent.length).toBeGreaterThan(20000);
    });

    test('variables.tf contains variable definitions', () => {
      expect(variablesContent.length).toBeGreaterThan(100);
    });

    test('outputs.tf contains comprehensive output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(3000);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d/);
    });

    test('configures AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*version\s*=\s*">=\s*5\.0/);
    });

    test('uses variable for AWS region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configures default tags at provider level', () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });

    test('backend configuration uses S3', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('stack does not declare provider', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe('Required Variables Declaration', () => {
    const requiredVariables = [
      'aws_region',
      'environment_suffix',
      'repository',
      'commit_author',
      'pr_number',
      'team',
      'acm_certificate_arn'
    ];

    test.each(requiredVariables)('declares variable %s', (variableName) => {
      expect(hasVariable(variablesContent, variableName)).toBe(true);
    });

    test('acm_certificate_arn has empty string default', () => {
      expect(variablesContent).toMatch(/variable\s+"acm_certificate_arn"[\s\S]*default\s*=\s*""/s);
    });
  });

  describe('Data Sources', () => {
    test('declares availability zones data source', () => {
      expect(hasDataSource(stackContent, 'aws_availability_zones', 'available')).toBe(true);
    });

    test('availability zones data source filters opt-in-not-required', () => {
      expect(stackContent).toMatch(/filter\s*{[\s\S]*name\s*=\s*"opt-in-status"[\s\S]*values\s*=\s*\["opt-in-not-required"\]/s);
    });

    test('declares Amazon Linux 2 AMI data source', () => {
      expect(hasDataSource(stackContent, 'aws_ami', 'amazon_linux_2')).toBe(true);
    });

    test('AMI data source uses dynamic filters', () => {
      expect(stackContent).toMatch(/filter\s*{[\s\S]*name\s*=\s*"name"[\s\S]*values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/s);
    });

    test('AMI data source filters by virtualization type', () => {
      expect(stackContent).toMatch(/filter\s*{[\s\S]*name\s*=\s*"virtualization-type"[\s\S]*values\s*=\s*\["hvm"\]/s);
    });

    test('declares IAM policy documents', () => {
      expect(hasDataSource(stackContent, 'aws_iam_policy_document', 'ec2_assume_role')).toBe(true);
      expect(hasDataSource(stackContent, 'aws_iam_policy_document', 'rds_monitoring_assume_role')).toBe(true);
      expect(hasDataSource(stackContent, 'aws_iam_policy_document', 'ec2_secrets')).toBe(true);
    });
  });

  describe('Region-Specific Configuration', () => {
    test('declares locals block with region_config', () => {
      expect(hasRegionSpecificConfig(stackContent)).toBe(true);
    });

    test('defines non-overlapping CIDR blocks for regions', () => {
      expect(stackContent).toMatch(/us-east-1.*vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/s);
      expect(stackContent).toMatch(/eu-west-1.*vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/s);
      expect(stackContent).toMatch(/ap-southeast-1.*vpc_cidr\s*=\s*"10\.2\.0\.0\/16"/s);
    });

    test('defines CIDR offsets for each region', () => {
      expect(stackContent).toMatch(/us-east-1.*cidr_offset\s*=\s*0/s);
      expect(stackContent).toMatch(/eu-west-1.*cidr_offset\s*=\s*1/s);
      expect(stackContent).toMatch(/ap-southeast-1.*cidr_offset\s*=\s*2/s);
    });

    test('uses cidrsubnet function for subnet calculations', () => {
      expect(stackContent).toMatch(/cidrsubnet\(local\.vpc_cidr,\s*8,\s*1\)/);
      expect(stackContent).toMatch(/cidrsubnet\(local\.vpc_cidr,\s*8,\s*10\)/);
      expect(stackContent).toMatch(/cidrsubnet\(local\.vpc_cidr,\s*8,\s*20\)/);
    });

    test('defines current_region_config reference', () => {
      expect(stackContent).toMatch(/current_region_config\s*=\s*local\.region_config\[var\.aws_region\]/);
    });

    test('defines common_tags in locals', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*Environment[\s\S]*Region[\s\S]*ManagedBy/s);
    });

    test('defines name_prefix with region in locals', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${var\.aws_region}-trading"/);
    });

    test('calculates three public subnet CIDRs', () => {
      expect(stackContent).toMatch(/public_subnet_cidrs\s*=\s*\[[\s\S]*cidrsubnet[\s\S]*cidrsubnet[\s\S]*cidrsubnet/s);
    });

    test('calculates three private subnet CIDRs', () => {
      expect(stackContent).toMatch(/private_subnet_cidrs\s*=\s*\[[\s\S]*cidrsubnet[\s\S]*cidrsubnet[\s\S]*cidrsubnet/s);
    });

    test('calculates three database subnet CIDRs', () => {
      expect(stackContent).toMatch(/database_subnet_cidrs\s*=\s*\[[\s\S]*cidrsubnet[\s\S]*cidrsubnet[\s\S]*cidrsubnet/s);
    });
  });

  describe('Networking Resources', () => {
    test('declares VPC resource', () => {
      expect(hasResource(stackContent, 'aws_vpc', 'main')).toBe(true);
    });

    test('VPC uses dynamic CIDR from locals', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
    });

    test('VPC has DNS support enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_hostnames')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_support')).toBe(true);
    });

    test('declares Internet Gateway', () => {
      expect(hasResource(stackContent, 'aws_internet_gateway', 'main')).toBe(true);
    });

    test('declares public subnets with count of 3', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'public')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*public.*count\s*=\s*3/s);
    });

    test('declares private subnets with count of 3', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'private')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*private.*count\s*=\s*3/s);
    });

    test('declares database subnets with count of 3', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'database')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*database.*count\s*=\s*3/s);
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      expect(stackContent).toMatch(/aws_subnet.*public[\s\S]*map_public_ip_on_launch\s*=\s*true/s);
    });

    test('subnets use dynamic availability zones', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('subnets use dynamically calculated CIDRs', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.public_subnet_cidrs\[count\.index\]/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.private_subnet_cidrs\[count\.index\]/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.database_subnet_cidrs\[count\.index\]/);
    });

    test('declares NAT gateways with count of 3', () => {
      expect(hasResource(stackContent, 'aws_nat_gateway', 'main')).toBe(true);
      expect(stackContent).toMatch(/aws_nat_gateway.*main.*count\s*=\s*3/s);
    });

    test('declares EIP for NAT gateways with count of 3', () => {
      expect(hasResource(stackContent, 'aws_eip', 'nat')).toBe(true);
      expect(stackContent).toMatch(/aws_eip.*nat.*count\s*=\s*3/s);
    });

    test('NAT gateways use VPC domain', () => {
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('declares route tables', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table', 'private')).toBe(true);
    });

    test('private route tables use count of 3', () => {
      expect(stackContent).toMatch(/aws_route_table.*private.*count\s*=\s*3/s);
    });

    test('declares route table associations', () => {
      expect(hasResource(stackContent, 'aws_route_table_association', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table_association', 'private')).toBe(true);
    });

    test('route table associations use count of 3', () => {
      expect(stackContent).toMatch(/aws_route_table_association.*public.*count\s*=\s*3/s);
      expect(stackContent).toMatch(/aws_route_table_association.*private.*count\s*=\s*3/s);
    });
  });

  describe('Security Groups', () => {
    const securityGroups = ['alb', 'ec2', 'rds'];

    test.each(securityGroups)('declares %s security group', (sgName) => {
      expect(hasResource(stackContent, 'aws_security_group', sgName)).toBe(true);
    });

    test('ALB security group allows HTTPS from internet', () => {
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*ingress[\s\S]*from_port\s*=\s*443[\s\S]*to_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
    });

    test('ALB security group allows HTTP from internet', () => {
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*ingress[\s\S]*from_port\s*=\s*80[\s\S]*to_port\s*=\s*80/s);
    });

    test('ALB security group has egress rule', () => {
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*egress\s*{/s);
    });

    test('EC2 security group only allows HTTP traffic from ALB', () => {
      expect(stackContent).toMatch(/aws_security_group.*ec2[\s\S]*ingress[\s\S]*from_port\s*=\s*80[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb\.id\]/s);
    });

    test('EC2 security group allows HTTPS traffic from ALB', () => {
      expect(stackContent).toMatch(/aws_security_group.*ec2[\s\S]*ingress[\s\S]*from_port\s*=\s*443[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb\.id\]/s);
    });

    test('RDS security group only allows traffic from EC2', () => {
      expect(stackContent).toMatch(/aws_security_group.*rds[\s\S]*security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/s);
    });

    test('RDS security group uses PostgreSQL port 5432', () => {
      expect(stackContent).toMatch(/aws_security_group.*rds[\s\S]*from_port\s*=\s*5432[\s\S]*to_port\s*=\s*5432/s);
    });

    test('security groups are properly tagged', () => {
      securityGroups.forEach(sg => {
        expect(hasTagging(stackContent, 'aws_security_group', sg)).toBe(true);
      });
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('declares Application Load Balancer', () => {
      expect(hasResource(stackContent, 'aws_lb', 'main')).toBe(true);
    });

    test('ALB is external facing', () => {
      expect(stackContent).toMatch(/aws_lb.*main[\s\S]*internal\s*=\s*false/s);
    });

    test('ALB uses application load balancer type', () => {
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('ALB uses public subnets', () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('ALB uses ALB security group', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('declares target group', () => {
      expect(hasResource(stackContent, 'aws_lb_target_group', 'main')).toBe(true);
    });

    test('target group uses HTTP protocol', () => {
      expect(stackContent).toMatch(/aws_lb_target_group.*main[\s\S]*protocol\s*=\s*"HTTP"/s);
    });

    test('target group has health check configuration', () => {
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/healthy_threshold\s*=\s*2/);
      expect(stackContent).toMatch(/unhealthy_threshold\s*=\s*2/);
    });

    test('target group has deregistration delay', () => {
      expect(hasResourceAttribute(stackContent, 'aws_lb_target_group', 'main', 'deregistration_delay')).toBe(true);
    });

    test('declares HTTP listener', () => {
      expect(hasResource(stackContent, 'aws_lb_listener', 'http')).toBe(true);
    });

    test('HTTP listener forwards to target group', () => {
      expect(stackContent).toMatch(/aws_lb_listener.*http[\s\S]*target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/s);
    });

    test('HTTPS listener is conditional', () => {
      expect(hasResource(stackContent, 'aws_lb_listener', 'https')).toBe(true);
      expect(stackContent).toMatch(/aws_lb_listener.*https.*count\s*=\s*var\.acm_certificate_arn\s*!=\s*""\s*\?\s*1\s*:\s*0/s);
    });

    test('HTTPS listener uses provided certificate ARN', () => {
      expect(stackContent).toMatch(/certificate_arn\s*=\s*var\.acm_certificate_arn/);
    });

    test('HTTPS listener uses TLS 1.3 security policy', () => {
      expect(stackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS13-1-2-2021-06"/);
    });
  });

  describe('IAM Resources', () => {
    test('declares EC2 IAM role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'ec2')).toBe(true);
    });

    test('declares EC2 IAM instance profile', () => {
      expect(hasResource(stackContent, 'aws_iam_instance_profile', 'ec2')).toBe(true);
    });

    test('attaches SSM managed policy to EC2 role', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy_attachment', 'ec2_ssm')).toBe(true);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/);
    });

    test('attaches CloudWatch managed policy to EC2 role', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy_attachment', 'ec2_cloudwatch')).toBe(true);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/CloudWatchAgentServerPolicy"/);
    });

    test('declares custom IAM policy for Secrets Manager access', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'ec2_secrets')).toBe(true);
    });

    test('EC2 secrets policy allows GetSecretValue', () => {
      expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
      expect(stackContent).toMatch(/secretsmanager:DescribeSecret/);
    });

    test('declares RDS enhanced monitoring IAM role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'rds_enhanced_monitoring')).toBe(true);
    });

    test('attaches RDS enhanced monitoring policy', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy_attachment', 'rds_enhanced_monitoring')).toBe(true);
      expect(stackContent).toMatch(/AmazonRDSEnhancedMonitoringRole/);
    });
  });

  describe('Compute Resources', () => {
    test('declares launch template', () => {
      expect(hasResource(stackContent, 'aws_launch_template', 'main')).toBe(true);
    });

    test('launch template uses dynamic AMI', () => {
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
    });

    test('launch template uses t3.micro instance type', () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test('launch template references EC2 security group', () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test('launch template includes IAM instance profile', () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*{[\s\S]*name\s*=\s*aws_iam_instance_profile\.ec2\.name/s);
    });

    test('launch template includes user data', () => {
      expect(hasResourceAttribute(stackContent, 'aws_launch_template', 'main', 'user_data')).toBe(true);
    });

    test('user data is base64 encoded', () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
    });

    test('launch template has tag specifications', () => {
      expect(stackContent).toMatch(/tag_specifications\s*{[\s\S]*resource_type\s*=\s*"instance"/s);
      expect(stackContent).toMatch(/tag_specifications\s*{[\s\S]*resource_type\s*=\s*"volume"/s);
    });

    test('declares Auto Scaling Group', () => {
      expect(hasResource(stackContent, 'aws_autoscaling_group', 'main')).toBe(true);
    });

    test('ASG uses private subnets', () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('ASG uses target group for health checks', () => {
      expect(stackContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/);
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test('ASG has appropriate sizing', () => {
      expect(stackContent).toMatch(/min_size\s*=\s*2/);
      expect(stackContent).toMatch(/max_size\s*=\s*6/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*3/);
    });

    test('ASG has dynamic tags', () => {
      expect(stackContent).toMatch(/dynamic\s+"tag"\s*{[\s\S]*for_each\s*=\s*local\.common_tags/s);
    });

    test('ASG has enabled metrics', () => {
      expect(stackContent).toMatch(/enabled_metrics\s*=\s*\[/);
      expect(stackContent).toMatch(/GroupDesiredCapacity/);
      expect(stackContent).toMatch(/GroupInServiceInstances/);
    });

    test('declares Auto Scaling policies', () => {
      expect(hasResource(stackContent, 'aws_autoscaling_policy', 'scale_up')).toBe(true);
      expect(hasResource(stackContent, 'aws_autoscaling_policy', 'scale_down')).toBe(true);
    });

    test('declares CloudWatch alarms for scaling', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'high_cpu')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'low_cpu')).toBe(true);
    });

    test('CloudWatch alarms monitor CPU utilization', () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });
  });

  describe('Secrets Manager Resources', () => {
    test('declares random password resource', () => {
      expect(hasResource(stackContent, 'random_password', 'db_password')).toBe(true);
    });

    test('random password has sufficient length', () => {
      expect(stackContent).toMatch(/random_password.*db_password[\s\S]*length\s*=\s*32/s);
    });

    test('random password includes special characters', () => {
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });

    test('declares Secrets Manager secret', () => {
      expect(hasResource(stackContent, 'aws_secretsmanager_secret', 'db_credentials')).toBe(true);
    });

    test('declares Secrets Manager secret version', () => {
      expect(hasResource(stackContent, 'aws_secretsmanager_secret_version', 'db_credentials')).toBe(true);
    });

    test('secret includes database connection details', () => {
      expect(stackContent).toMatch(/username/);
      expect(stackContent).toMatch(/password/);
      expect(stackContent).toMatch(/engine/);
      expect(stackContent).toMatch(/host/);
    });
  });

  describe('RDS Aurora Resources', () => {
    test('declares RDS subnet group', () => {
      expect(hasResource(stackContent, 'aws_db_subnet_group', 'main')).toBe(true);
    });

    test('RDS subnet group uses database subnets', () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });

    test('declares Aurora cluster parameter group', () => {
      expect(hasResource(stackContent, 'aws_rds_cluster_parameter_group', 'main')).toBe(true);
    });

    test('cluster parameter group uses aurora-postgresql15 family', () => {
      expect(stackContent).toMatch(/family\s*=\s*"aurora-postgresql15"/);
    });

    test('declares DB parameter group', () => {
      expect(hasResource(stackContent, 'aws_db_parameter_group', 'main')).toBe(true);
    });

    test('declares Aurora cluster', () => {
      expect(hasResource(stackContent, 'aws_rds_cluster', 'main')).toBe(true);
    });

    test('Aurora cluster uses aurora-postgresql engine', () => {
      expect(stackContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('Aurora cluster uses version 15.6', () => {
      expect(stackContent).toMatch(/engine_version\s*=\s*"15\.6"/);
    });

    test('Aurora cluster has encryption enabled', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('Aurora cluster uses customer-managed KMS key', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test('Aurora cluster has 7-day backup retention', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test('Aurora cluster enables CloudWatch logs exports', () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/);
    });

    test('declares Aurora cluster instances', () => {
      expect(hasResource(stackContent, 'aws_rds_cluster_instance', 'main')).toBe(true);
    });

    test('Aurora instances use count of 3', () => {
      expect(stackContent).toMatch(/aws_rds_cluster_instance.*main.*count\s*=\s*3/s);
    });

    test('Aurora instances use db.t3.medium', () => {
      expect(stackContent).toMatch(/instance_class\s*=\s*"db\.t3\.medium"/);
    });

    test('Aurora instances have Performance Insights enabled', () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test('Aurora instances have Enhanced Monitoring', () => {
      expect(stackContent).toMatch(/monitoring_interval\s*=\s*60/);
      expect(stackContent).toMatch(/monitoring_role_arn\s*=\s*aws_iam_role\.rds_enhanced_monitoring\.arn/);
    });
  });

  describe('KMS Encryption Resources', () => {
    test('declares KMS key for RDS encryption', () => {
      expect(hasResource(stackContent, 'aws_kms_key', 'rds')).toBe(true);
    });

    test('declares KMS alias for RDS encryption', () => {
      expect(hasResource(stackContent, 'aws_kms_alias', 'rds')).toBe(true);
    });

    test('KMS key has deletion window', () => {
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'rds', 'deletion_window_in_days')).toBe(true);
    });

    test('KMS key has rotation enabled', () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_kms_key', 'rds')).toBe(true);
    });
  });

  describe('S3 Bucket Resources', () => {
    test('declares S3 bucket', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket', 'main')).toBe(true);
    });

    test('S3 bucket name includes region and environment', () => {
      expect(stackContent).toMatch(/bucket\s*=\s*"\${local\.name_prefix}-trading-data-\${var\.environment_suffix}"/);
    });

    test('declares S3 bucket versioning', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_versioning', 'main')).toBe(true);
    });

    test('versioning is enabled', () => {
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('declares S3 bucket encryption', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_server_side_encryption_configuration', 'main')).toBe(true);
    });

    test('declares S3 public access block', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_public_access_block', 'main')).toBe(true);
    });

    test('public access is blocked', () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('declares S3 lifecycle configuration', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_lifecycle_configuration', 'main')).toBe(true);
    });

    test('lifecycle policy includes transitions', () => {
      expect(stackContent).toMatch(/transition\s*{[\s\S]*storage_class\s*=\s*"STANDARD_IA"/s);
      expect(stackContent).toMatch(/transition\s*{[\s\S]*storage_class\s*=\s*"GLACIER"/s);
    });
  });

  describe('CloudWatch Resources', () => {
    test('declares CloudWatch log group for applications', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'app_logs')).toBe(true);
    });

    test('declares CloudWatch log group for ALB', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'alb_logs')).toBe(true);
    });

    test('log groups have retention period', () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('log group names use region prefix', () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/\${local\.name_prefix}\//);
    });
  });

  describe('Random Resources', () => {
    test('declares random_id resource', () => {
      expect(hasResource(stackContent, 'random_id', 'suffix')).toBe(true);
    });
  });

  describe('Output Definitions', () => {
    const expectedOutputs = [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'database_subnet_ids',
      'alb_dns_name',
      'alb_arn',
      'alb_zone_id',
      'alb_endpoint',
      'rds_cluster_endpoint',
      'rds_cluster_reader_endpoint',
      'rds_cluster_id',
      'rds_cluster_arn',
      'rds_cluster_database_name',
      'rds_cluster_port',
      'rds_instance_endpoints',
      'db_credentials_secret_arn',
      'db_credentials_secret_name',
      'autoscaling_group_name',
      'autoscaling_group_arn',
      'launch_template_id',
      's3_bucket_name',
      's3_bucket_arn',
      's3_bucket_region',
      'alb_security_group_id',
      'ec2_security_group_id',
      'rds_security_group_id',
      'region',
      'availability_zones',
      'deployment_summary'
    ];

    test.each(expectedOutputs)('exports output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('deployment_summary output includes all key components', () => {
      expect(outputsContent).toMatch(/deployment_summary[\s\S]*region[\s\S]*vpc_id[\s\S]*load_balancer[\s\S]*database[\s\S]*storage[\s\S]*compute/s);
    });

    test('outputs include descriptions', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"[\s\S]*description/s);
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"[\s\S]*description/s);
    });
  });

  describe('Security and Compliance', () => {
    test('no hardcoded secrets or passwords', () => {
      const forbiddenPatterns = [
        /password\s*=\s*"[^$]/i,
        /secret\s*=\s*"[^$]/i,
        /api_key\s*=\s*"[^$]/i,
        /access_key\s*=\s*"AKIA/i
      ];
      forbiddenPatterns.forEach(pattern => {
        expect(pattern.test(stackContent)).toBe(false);
      });
    });

    test('RDS password uses random_password resource', () => {
      expect(stackContent).toMatch(/password\s*=\s*random_password\.db_password\.result/);
    });

    test('database security group does not allow public access', () => {
      expect(stackContent).not.toMatch(/aws_security_group.*rds[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
    });

    test('S3 buckets block public access', () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    });
  });

  describe('Dynamic and Region-Agnostic Configuration', () => {
    test('no hardcoded region references in resources', () => {
      const hardcodedRegionPattern = /resource[\s\S]{1,200}(us-east-1|us-west-2|eu-west-1|ap-southeast-1)/;
      expect(hardcodedRegionPattern.test(stackContent)).toBe(false);
    });

    test('uses dynamic availability zones from data source', () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available\.names/);
    });

    test('uses variables for region configuration', () => {
      expect(stackContent).toMatch(/var\.aws_region/);
    });

    test('subnet CIDRs use cidrsubnet function', () => {
      const cidrsubnetCount = (stackContent.match(/cidrsubnet/g) || []).length;
      expect(cidrsubnetCount).toBeGreaterThanOrEqual(9);
    });

    test('count parameters use fixed values for multi-AZ', () => {
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test('no hardcoded CIDR blocks in resource definitions', () => {
      const hardcodedCidrPattern = /resource\s+"aws_subnet"[\s\S]{1,100}cidr_block\s*=\s*"10\.\d+\.\d+\.\d+\/\d+"/;
      expect(hardcodedCidrPattern.test(stackContent)).toBe(false);
    });
  });

  describe('Resource Dependencies and References', () => {
    test('subnets reference VPC ID dynamically', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('security groups reference each other properly', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
    });

    test('ALB references public subnets', () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('ASG references private subnets', () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('RDS uses database subnets', () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });

    test('proper depends_on usage for NAT gateways', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('IAM instance profile references IAM role', () => {
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2\.name/);
    });

    test('launch template references instance profile', () => {
      expect(stackContent).toMatch(/name\s*=\s*aws_iam_instance_profile\.ec2\.name/);
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
      ['aws_security_group', 'ec2'],
      ['aws_security_group', 'rds'],
      ['aws_lb', 'main'],
      ['aws_lb_target_group', 'main'],
      ['aws_kms_key', 'rds'],
      ['aws_rds_cluster', 'main'],
      ['aws_s3_bucket', 'main'],
      ['aws_cloudwatch_log_group', 'app_logs']
    ];

    test.each(taggedResources)('resource %s.%s has proper tagging', (resourceType, resourceName) => {
      expect(hasTagging(stackContent, resourceType, resourceName)).toBe(true);
    });

    test('resources use merge function for common tags', () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test('common tags include required fields', () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.aws_region/);
      expect(stackContent).toMatch(/Region\s*=\s*var\.aws_region/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(stackContent).toMatch(/Workspace\s*=\s*terraform\.workspace/);
    });
  });

  describe('Best Practices Compliance', () => {
    test('uses lifecycle rules for launch template', () => {
      expect(stackContent).toMatch(/lifecycle\s*{[\s\S]*create_before_destroy\s*=\s*true/s);
    });

    test('resource names use consistent naming convention', () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.name_prefix}-/);
    });

    test('uses name_prefix for launch template', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${local\.name_prefix}-/);
    });

    test('ASG uses latest launch template version', () => {
      expect(stackContent).toMatch(/version\s*=\s*"\$Latest"/);
    });

    test('count is used for multi-AZ resources', () => {
      expect(countResourceOccurrences(stackContent, 'aws_subnet')).toBeGreaterThanOrEqual(3);
      expect(countResourceOccurrences(stackContent, 'aws_nat_gateway')).toBeGreaterThanOrEqual(1);
    });

    test('NAT gateways provide high availability', () => {
      const natCount = (stackContent.match(/resource\s+"aws_nat_gateway"\s+"main"/g) || []).length;
      expect(natCount).toBe(1);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });
  });
});
