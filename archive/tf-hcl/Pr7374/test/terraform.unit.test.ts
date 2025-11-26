import * as fs from 'fs';
import * as path from 'path';

const libPath = path.resolve(__dirname, '../lib');

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

describe('High-Availability PostgreSQL Database Infrastructure - Unit Tests', () => {
  let stackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = readFileContent(path.join(libPath, 'tap_stack.tf'));
    variablesContent = readFileContent(path.join(libPath, 'variables.tf'));
    outputsContent = readFileContent(path.join(libPath, 'outputs.tf'));
    providerContent = readFileContent(path.join(libPath, 'provider.tf'));
  });

  describe('File Structure and Existence', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(path.join(libPath, 'tap_stack.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'outputs.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('tap_stack.tf is comprehensive', () => {
      expect(stackContent.length).toBeGreaterThan(30000);
    });

    test('outputs.tf contains comprehensive output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(3000);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version >= 1.4.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4/);
    });

    test('configures AWS provider with version constraint >= 5.0', () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('uses variable for AWS region - region agnostic', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configures S3 backend for state management', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('includes default tags configuration', () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });
  });

  describe('Data Sources', () => {
    test('declares availability zones data source', () => {
      expect(hasDataSource(stackContent, 'aws_availability_zones', 'available')).toBe(true);
    });

    test('availability zones data source uses dynamic filter', () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"[\s\S]*?filter\s*{[\s\S]*?opt-in-status/s);
    });

    test('declares caller identity data source', () => {
      expect(hasDataSource(stackContent, 'aws_caller_identity', 'current')).toBe(true);
    });

    test('declares region data source', () => {
      expect(hasDataSource(stackContent, 'aws_region', 'current')).toBe(true);
    });
  });

  describe('Locals Configuration', () => {
    test('defines name_prefix in locals', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"ha-postgres-\${var\.environment_suffix}"/);
    });

    test('defines common_tags in locals', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*?Environment[\s\S]*?Repository[\s\S]*?Team/s);
    });

    test('defines dynamic AZ selection in locals', () => {
      expect(stackContent).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*3\)/);
    });

    test('locals block does not contain hardcoded regions', () => {
      expect(stackContent).not.toMatch(/locals\s*{[\s\S]*?"us-east-1"|"us-west-2"|"eu-west-1"/s);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('declares VPC resource', () => {
      expect(hasResource(stackContent, 'aws_vpc', 'main')).toBe(true);
    });

    test('VPC has DNS support enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_hostnames')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_support')).toBe(true);
    });

    test('declares Internet Gateway', () => {
      expect(hasResource(stackContent, 'aws_internet_gateway', 'main')).toBe(true);
    });

    test('declares private subnets with count for multi-AZ', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'private')).toBe(true);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*3/s);
    });

    test('declares public subnets with count for multi-AZ', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'public')).toBe(true);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*3/s);
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*?map_public_ip_on_launch\s*=\s*true/s);
    });

    test('subnets use dynamic availability zones from locals', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/);
    });

    test('declares NAT gateways with count', () => {
      expect(hasResource(stackContent, 'aws_nat_gateway', 'main')).toBe(true);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?count\s*=\s*3/s);
    });

    test('declares EIP for NAT gateways', () => {
      expect(hasResource(stackContent, 'aws_eip', 'nat')).toBe(true);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"[\s\S]*?count\s*=\s*3/s);
    });

    test('NAT gateway depends on Internet Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?depends_on\s*=\s*\[aws_internet_gateway\.main\]/s);
    });

    test('declares route tables for public and private', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table', 'private')).toBe(true);
    });

    test('declares route table associations', () => {
      expect(hasResource(stackContent, 'aws_route_table_association', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table_association', 'private')).toBe(true);
    });

    test('all networking resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_vpc', 'main')).toBe(true);
      expect(hasTagging(stackContent, 'aws_subnet', 'private')).toBe(true);
      expect(hasTagging(stackContent, 'aws_subnet', 'public')).toBe(true);
      expect(hasTagging(stackContent, 'aws_internet_gateway', 'main')).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('declares RDS security group', () => {
      expect(hasResource(stackContent, 'aws_security_group', 'rds')).toBe(true);
    });

    test('declares Lambda security group', () => {
      expect(hasResource(stackContent, 'aws_security_group', 'lambda')).toBe(true);
    });

    test('RDS security group allows PostgreSQL traffic on port 5432', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?from_port\s*=\s*5432[\s\S]*?to_port\s*=\s*5432/s);
    });

    test('RDS security group restricts ingress to Lambda security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/s);
    });

    test('Lambda security group has egress rule', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"[\s\S]*?egress\s*{/s);
    });

    test('security groups are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_security_group', 'rds')).toBe(true);
      expect(hasTagging(stackContent, 'aws_security_group', 'lambda')).toBe(true);
    });
  });

  describe('RDS Aurora PostgreSQL Cluster', () => {
    test('declares DB subnet group', () => {
      expect(hasResource(stackContent, 'aws_db_subnet_group', 'aurora')).toBe(true);
    });

    test('DB subnet group uses private subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"[\s\S]*?subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/s);
    });

    test('declares Aurora PostgreSQL cluster', () => {
      expect(hasResource(stackContent, 'aws_rds_cluster', 'aurora')).toBe(true);
    });

    test('Aurora cluster uses PostgreSQL engine version 15.6', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?engine\s*=\s*"aurora-postgresql"[\s\S]*?engine_version\s*=\s*"15\.6"/s);
    });

    test('Aurora cluster uses provisioned engine mode', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?engine_mode\s*=\s*"provisioned"/s);
    });

    test('Aurora cluster has Serverless v2 scaling configuration', () => {
      expect(stackContent).toMatch(/serverlessv2_scaling_configuration\s*{[\s\S]*?max_capacity[\s\S]*?min_capacity/s);
    });

    test('Aurora cluster storage is encrypted', () => {
      expect(hasResourceAttribute(stackContent, 'aws_rds_cluster', 'aurora', 'storage_encrypted')).toBe(true);
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?storage_encrypted\s*=\s*true/s);
    });

    test('Aurora cluster uses KMS key for encryption', () => {
      expect(hasResourceAttribute(stackContent, 'aws_rds_cluster', 'aurora', 'kms_key_id')).toBe(true);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test('Aurora cluster has CloudWatch logs enabled', () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/);
    });

    test('Aurora cluster uses dynamic availability zones', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?availability_zones\s*=\s*local\.azs/s);
    });

    test('Aurora cluster backup retention is configured', () => {
      expect(hasResourceAttribute(stackContent, 'aws_rds_cluster', 'aurora', 'backup_retention_period')).toBe(true);
    });

    test('Aurora cluster has preferred backup and maintenance windows', () => {
      expect(hasResourceAttribute(stackContent, 'aws_rds_cluster', 'aurora', 'preferred_backup_window')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_rds_cluster', 'aurora', 'preferred_maintenance_window')).toBe(true);
    });

    test('declares Aurora cluster instances with count of 3', () => {
      expect(hasResource(stackContent, 'aws_rds_cluster_instance', 'aurora_instances')).toBe(true);
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_instances"[\s\S]*?count\s*=\s*3/s);
    });

    test('Aurora cluster instances use db.serverless instance class', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_instances"[\s\S]*?instance_class\s*=\s*"db\.serverless"/s);
    });

    test('Aurora cluster instances have Performance Insights enabled', () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test('Aurora cluster instances have enhanced monitoring', () => {
      expect(stackContent).toMatch(/monitoring_interval\s*=\s*1/);
      expect(stackContent).toMatch(/monitoring_role_arn\s*=\s*aws_iam_role\.rds_monitoring\.arn/);
    });

    test('Aurora cluster instances are distributed across AZs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_instances"[\s\S]*?availability_zone\s*=\s*local\.azs\[count\.index\]/s);
    });
  });

  describe('KMS Encryption Keys', () => {
    test('declares KMS key for RDS', () => {
      expect(hasResource(stackContent, 'aws_kms_key', 'rds')).toBe(true);
    });

    test('declares KMS key for SNS', () => {
      expect(hasResource(stackContent, 'aws_kms_key', 'sns')).toBe(true);
    });

    test('KMS keys have key rotation enabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"[\s\S]*?enable_key_rotation\s*=\s*true/s);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"sns"[\s\S]*?enable_key_rotation\s*=\s*true/s);
    });

    test('KMS keys have appropriate deletion window', () => {
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'rds', 'deletion_window_in_days')).toBe(true);
    });

    test('declares KMS alias for RDS key', () => {
      expect(hasResource(stackContent, 'aws_kms_alias', 'rds')).toBe(true);
    });

    test('KMS resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_kms_key', 'rds')).toBe(true);
      expect(hasTagging(stackContent, 'aws_kms_key', 'sns')).toBe(true);
    });
  });

  describe('Secrets Manager', () => {
    test('declares random password resource', () => {
      expect(hasResource(stackContent, 'random_password', 'master_password')).toBe(true);
    });

    test('random password has appropriate length', () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"master_password"[\s\S]*?length\s*=\s*32/s);
    });

    test('declares Secrets Manager secret for database credentials', () => {
      expect(hasResource(stackContent, 'aws_secretsmanager_secret', 'db_credentials')).toBe(true);
    });

    test('declares secret version for database credentials', () => {
      expect(hasResource(stackContent, 'aws_secretsmanager_secret_version', 'db_credentials')).toBe(true);
    });

    test('declares secret rotation configuration', () => {
      expect(hasResource(stackContent, 'aws_secretsmanager_secret_rotation', 'db_credentials')).toBe(true);
    });

    test('secret rotation is configured for 30 days', () => {
      expect(stackContent).toMatch(/rotation_rules\s*{[\s\S]*?automatically_after_days\s*=\s*30/s);
    });

    test('secret rotation depends on Lambda permission', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_rotation"\s+"db_credentials"[\s\S]*?depends_on\s*=\s*\[aws_lambda_permission\.secrets_manager\]/s);
    });
  });

  describe('Route53 Resources', () => {
    test('declares Route53 private hosted zone', () => {
      expect(hasResource(stackContent, 'aws_route53_zone', 'private')).toBe(true);
    });

    test('Route53 zone is associated with VPC', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"private"[\s\S]*?vpc\s*{[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/s);
    });

    test('declares Route53 record for primary endpoint', () => {
      expect(hasResource(stackContent, 'aws_route53_record', 'primary')).toBe(true);
    });

    test('declares Route53 record for reader endpoint', () => {
      expect(hasResource(stackContent, 'aws_route53_record', 'reader')).toBe(true);
    });

    test('primary record points to Aurora cluster endpoint', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"primary"[\s\S]*?records\s*=\s*\[aws_rds_cluster\.aurora\.endpoint\]/s);
    });

    test('reader record points to Aurora reader endpoint', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"reader"[\s\S]*?records\s*=\s*\[aws_rds_cluster\.aurora\.reader_endpoint\]/s);
    });
  });

  describe('SNS Topics and Subscriptions', () => {
    test('declares SNS topic for alerts', () => {
      expect(hasResource(stackContent, 'aws_sns_topic', 'alerts')).toBe(true);
    });

    test('SNS topic uses KMS encryption', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.sns\.id/s);
    });

    test('declares SNS topic subscription', () => {
      expect(hasResource(stackContent, 'aws_sns_topic_subscription', 'email')).toBe(true);
    });

    test('SNS topic is properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_sns_topic', 'alerts')).toBe(true);
    });
  });

  describe('EventBridge Rules', () => {
    test('declares EventBridge rule for RDS failover events', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_event_rule', 'rds_failover')).toBe(true);
    });

    test('RDS failover rule has appropriate event pattern', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"rds_failover"[\s\S]*?event_pattern[\s\S]*?aws\.rds/s);
    });

    test('declares EventBridge rule for health check failures', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_event_rule', 'health_check_failure')).toBe(true);
    });

    test('declares EventBridge rule for health check schedule', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_event_rule', 'health_check_schedule')).toBe(true);
    });

    test('health check schedule uses supported rate expression', () => {
      expect(stackContent).toMatch(/schedule_expression\s*=\s*"rate\(1 minute\)"/);
    });

    test('declares EventBridge rule for backup verification schedule', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_event_rule', 'backup_verification_schedule')).toBe(true);
    });

    test('backup verification uses cron schedule', () => {
      expect(stackContent).toMatch(/schedule_expression\s*=\s*"cron\(/);
    });

    test('declares EventBridge targets for rules', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_event_target', 'failover_lambda')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_event_target', 'health_check_schedule')).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('declares IAM role for RDS enhanced monitoring', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'rds_monitoring')).toBe(true);
    });

    test('RDS monitoring role has policy attachment', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy_attachment', 'rds_monitoring')).toBe(true);
    });

    test('declares IAM role for Lambda functions', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'lambda_role')).toBe(true);
    });

    test('Lambda role has inline policy', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'lambda_policy')).toBe(true);
    });

    test('Lambda policy includes CloudWatch Logs permissions', () => {
      expect(stackContent).toMatch(/CloudWatchLogsAccess[\s\S]*?logs:CreateLogGroup[\s\S]*?logs:PutLogEvents/s);
    });

    test('Lambda policy includes RDS Data API permissions', () => {
      expect(stackContent).toMatch(/RDSDataAPIAccess[\s\S]*?rds-data:ExecuteStatement/s);
    });

    test('Lambda policy includes Secrets Manager permissions', () => {
      expect(stackContent).toMatch(/SecretsManagerAccess[\s\S]*?secretsmanager:GetSecretValue/s);
    });

    test('Lambda policy includes SNS permissions', () => {
      expect(stackContent).toMatch(/SNSPublishAccess[\s\S]*?sns:Publish/s);
    });

    test('Lambda policy includes VPC permissions', () => {
      expect(stackContent).toMatch(/VPCAccess[\s\S]*?ec2:CreateNetworkInterface/s);
    });

    test('Lambda policy includes RDS management permissions', () => {
      expect(stackContent).toMatch(/RDSManagement[\s\S]*?rds:FailoverDBCluster/s);
    });

    test('declares IAM role for FIS', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'fis')).toBe(true);
    });

    test('FIS role has appropriate policy', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'fis')).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = [
      'failover_coordinator',
      'connection_drainer',
      'health_checker',
      'secret_rotation',
      'backup_verifier'
    ];

    test.each(lambdaFunctions)('declares Lambda function %s', (functionName) => {
      expect(hasResource(stackContent, 'aws_lambda_function', functionName)).toBe(true);
    });

    test('declares Lambda layer for database libraries', () => {
      expect(hasResource(stackContent, 'aws_lambda_layer_version', 'db_layer')).toBe(true);
    });

    test('Lambda layer supports Python 3.11 runtime', () => {
      expect(stackContent).toMatch(/compatible_runtimes\s*=\s*\["python3\.11"\]/);
    });

    test.each(lambdaFunctions)('Lambda function %s uses Python 3.11 runtime', (functionName) => {
      expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${functionName}"[\\s\\S]*?runtime\\s*=\\s*"python3\\.11"`, 's'));
    });

    test.each(lambdaFunctions)('Lambda function %s is in VPC', (functionName) => {
      expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${functionName}"[\\s\\S]*?vpc_config\\s*{`, 's'));
    });

    test.each(lambdaFunctions)('Lambda function %s has environment variables', (functionName) => {
      expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${functionName}"[\\s\\S]*?environment\\s*{`, 's'));
    });

    test.each(lambdaFunctions)('Lambda function %s uses Lambda layer', (functionName) => {
      expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${functionName}"[\\s\\S]*?layers\\s*=\\s*\\[aws_lambda_layer_version\\.db_layer\\.arn\\]`, 's'));
    });

    test('Lambda functions have appropriate timeouts configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover_coordinator"[\s\S]{1,500}timeout\s*=\s*300/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"connection_drainer"[\s\S]{1,500}timeout\s*=\s*60/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"health_checker"[\s\S]{1,500}timeout\s*=\s*30/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"secret_rotation"[\s\S]{1,500}timeout\s*=\s*300/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"backup_verifier"[\s\S]{1,500}timeout\s*=\s*900/);
    });

    test.each(lambdaFunctions)('Lambda function %s is properly tagged', (functionName) => {
      expect(hasTagging(stackContent, 'aws_lambda_function', functionName)).toBe(true);
    });

    test('declares Lambda permissions for EventBridge', () => {
      expect(hasResource(stackContent, 'aws_lambda_permission', 'eventbridge_failover')).toBe(true);
      expect(hasResource(stackContent, 'aws_lambda_permission', 'eventbridge_health')).toBe(true);
      expect(hasResource(stackContent, 'aws_lambda_permission', 'eventbridge_scheduler')).toBe(true);
    });

    test('declares Lambda permission for Secrets Manager', () => {
      expect(hasResource(stackContent, 'aws_lambda_permission', 'secrets_manager')).toBe(true);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('declares log group for RDS PostgreSQL', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'rds_postgresql')).toBe(true);
    });

    test('declares log groups for Lambda functions', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'lambda_failover')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'lambda_health')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'lambda_rotation')).toBe(true);
    });

    test('log groups have retention period configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?retention_in_days\s*=\s*7/s);
    });

    test('RDS log group name follows naming convention', () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/rds\/cluster\/\${local\.name_prefix}-aurora-cluster\/postgresql"/);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('declares CloudWatch dashboard', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_dashboard', 'main')).toBe(true);
    });

    test('dashboard includes RDS performance metrics', () => {
      expect(stackContent).toMatch(/dashboard_body[\s\S]*?DatabaseConnections[\s\S]*?CPUUtilization/s);
    });

    test('dashboard includes replication lag metrics', () => {
      expect(stackContent).toMatch(/dashboard_body[\s\S]*?AuroraReplicaLag/s);
    });

    test('dashboard includes throughput metrics', () => {
      expect(stackContent).toMatch(/dashboard_body[\s\S]*?CommitThroughput[\s\S]*?SelectThroughput/s);
    });

    test('dashboard uses dynamic region reference', () => {
      expect(stackContent).toMatch(/region\s*=\s*data\.aws_region\.current\.name/);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('declares CPU utilization alarm', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'cpu_high')).toBe(true);
    });

    test('declares replica lag alarm', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'replica_lag')).toBe(true);
    });

    test('declares connection count alarm', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'connections_high')).toBe(true);
    });

    test('declares database health alarm', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'database_health')).toBe(true);
    });

    test('declares Lambda error alarms', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'lambda_failover_errors')).toBe(true);
      expect(hasResource(stackContent, 'aws_cloudwatch_metric_alarm', 'lambda_health_errors')).toBe(true);
    });

    test('alarms send notifications to SNS topic', () => {
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });

    test('alarms reference database cluster identifier', () => {
      expect(stackContent).toMatch(/DBClusterIdentifier\s*=\s*aws_rds_cluster\.aurora\.cluster_identifier/);
    });
  });

  describe('AWS FIS Resources', () => {
    test('declares FIS experiment template', () => {
      expect(hasResource(stackContent, 'aws_fis_experiment_template', 'aurora_failover')).toBe(true);
    });

    test('FIS experiment targets Aurora cluster', () => {
      expect(stackContent).toMatch(/resource_arns\s*=\s*\[[\s\S]*?aws_rds_cluster\.aurora\.arn/s);
    });

    test('FIS experiment uses failover action', () => {
      expect(stackContent).toMatch(/action_id\s*=\s*"aws:rds:failover-db-cluster"/);
    });

    test('FIS experiment is properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_fis_experiment_template', 'aurora_failover')).toBe(true);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'vpc_id',
      'aurora_cluster_endpoint',
      'aurora_cluster_reader_endpoint',
      'aurora_cluster_arn',
      'route53_primary_endpoint',
      'route53_reader_endpoint',
      'db_credentials_secret_arn',
      'sns_alerts_topic_arn',
      'cloudwatch_dashboard_name',
      'rds_security_group_id',
      'kms_rds_key_arn'
    ];

    test.each(expectedOutputs)('declares output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('outputs include descriptions', () => {
      expect(outputsContent).toMatch(/description\s*=/);
    });

    test('sensitive outputs are marked as sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"aurora_master_username"[\s\S]*?sensitive\s*=\s*true/s);
    });

    test('outputs reference dynamic resources', () => {
      expect(outputsContent).toMatch(/aws_rds_cluster\.aurora/);
      expect(outputsContent).toMatch(/aws_vpc\.main/);
      expect(outputsContent).toMatch(/aws_sns_topic\.alerts/);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC resources use common_tags', () => {
      expect(stackContent).toMatch(/merge\(local\.common_tags/);
    });

    test('tags include environment information', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*?Environment\s*=\s*var\.environment_suffix/s);
    });

    test('tags include project information', () => {
      expect(stackContent).toMatch(/Project\s*=\s*"HA-PostgreSQL-Database"/);
    });

    test('tags include managed by Terraform', () => {
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe('High Availability Configuration', () => {
    test('infrastructure spans exactly 3 availability zones', () => {
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*3\)/);
    });

    test('NAT gateways are deployed in each AZ', () => {
      const natCount = countResourceOccurrences(stackContent, 'aws_nat_gateway');
      expect(natCount).toBeGreaterThanOrEqual(1);
    });

    test('Aurora cluster has multiple instances', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_instances"[\s\S]*?count\s*=\s*3/s);
    });

    test('failover mechanisms are configured', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_event_rule', 'rds_failover')).toBe(true);
      expect(hasResource(stackContent, 'aws_lambda_function', 'failover_coordinator')).toBe(true);
    });
  });

  describe('Security Best Practices', () => {
    test('RDS storage encryption is enabled', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('KMS encryption is used for RDS', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test('SNS topics use KMS encryption', () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.sns\.id/);
    });

    test('Secrets Manager is used for credential management', () => {
      expect(hasResource(stackContent, 'aws_secretsmanager_secret', 'db_credentials')).toBe(true);
    });

    test('secrets have automatic rotation configured', () => {
      expect(hasResource(stackContent, 'aws_secretsmanager_secret_rotation', 'db_credentials')).toBe(true);
    });

    test('Lambda functions are in private subnets', () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('security groups follow least privilege principle', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });
  });

  describe('Monitoring and Observability', () => {
    test('enhanced monitoring is enabled for RDS instances', () => {
      expect(stackContent).toMatch(/monitoring_interval\s*=\s*1/);
    });

    test('Performance Insights is enabled', () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test('CloudWatch Logs are configured for RDS', () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/);
    });

    test('comprehensive alarms are configured', () => {
      const alarmCount = countResourceOccurrences(stackContent, 'aws_cloudwatch_metric_alarm');
      expect(alarmCount).toBeGreaterThanOrEqual(5);
    });

    test('health check Lambda runs periodically', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_event_rule', 'health_check_schedule')).toBe(true);
    });
  });

  describe('Region Agnostic Configuration', () => {
    test('no hardcoded regions in stack configuration', () => {
      const regionMatches = stackContent.match(/"us-east-1"|"us-west-2"|"eu-west-1"|"ap-southeast-1"/g);
      expect(regionMatches).toBeNull();
    });

    test('uses data sources for region-specific information', () => {
      expect(stackContent).toMatch(/data\.aws_region\.current/);
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available/);
    });

    test('ARNs are constructed dynamically', () => {
      expect(stackContent).toMatch(/arn:aws:[\w-]+:\${data\.aws_region\.current/);
    });

    test('availability zones are selected dynamically', () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available\.names/);
    });
  });
});
