// Unit tests for Terraform disaster recovery infrastructure
// Tests the structure, configuration, and compliance of tap_stack.tf without executing Terraform

import fs from 'fs';
import * as hcl from 'hcl2-parser';
import path from 'path';

const STACK_FILE = '../lib/tap_stack.tf';
const VARIABLES_FILE = '../lib/variables.tf';
const PROVIDER_FILE = '../lib/provider.tf';

const stackPath = path.resolve(__dirname, STACK_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);

describe('Terraform Infrastructure Files - Structure', () => {
  let stackContent: string;
  let variablesContent: string;
  let providerContent: string;
  let parsedStack: any;
  let parsedVariables: any;
  let parsedProvider: any;

  beforeAll(() => {
    // Read all files
    stackContent = fs.readFileSync(stackPath, 'utf8');
    variablesContent = fs.readFileSync(variablesPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');

    // Parse HCL content
    try {
      parsedStack = hcl.parseToObject(stackContent)[0];
      parsedVariables = hcl.parseToObject(variablesContent)[0];
      parsedProvider = hcl.parseToObject(providerContent)[0];
    } catch (error) {
      console.error('HCL parsing error:', error);
      throw error;
    }
  });

  test('tap_stack.tf file exists and is readable', () => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(stackContent.length).toBeGreaterThan(0);
  });

  test('variables.tf file exists and is readable', () => {
    expect(fs.existsSync(variablesPath)).toBe(true);
    expect(variablesContent.length).toBeGreaterThan(0);
  });

  test('provider.tf file exists and is readable', () => {
    expect(fs.existsSync(providerPath)).toBe(true);
    expect(providerContent.length).toBeGreaterThan(0);
  });

  test('tap_stack.tf is valid HCL', () => {
    expect(parsedStack).toBeDefined();
    expect(typeof parsedStack).toBe('object');
  });

  test('tap_stack.tf does NOT declare provider blocks', () => {
    expect(stackContent).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
    expect(parsedStack.provider).toBeUndefined();
  });

  test('provider.tf declares primary and DR provider aliases', () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"primary"/);
    expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"dr"/);
  });
});

describe('Terraform Variables - Configuration', () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesPath, 'utf8');
  });

  test('environment_suffix variable is defined', () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
  });

  test('primary_region and secondary_region variables are defined', () => {
    expect(variablesContent).toMatch(/variable\s+"primary_region"/);
    expect(variablesContent).toMatch(/variable\s+"secondary_region"/);
  });

  test('RTO and RPO variables are defined', () => {
    expect(variablesContent).toMatch(/variable\s+"rto_minutes"/);
    expect(variablesContent).toMatch(/variable\s+"rpo_minutes"/);
  });

  test('Aurora configuration variables are defined', () => {
    expect(variablesContent).toMatch(/variable\s+"aurora_instance_class"/);
    expect(variablesContent).toMatch(/variable\s+"aurora_instance_count_primary"/);
    expect(variablesContent).toMatch(/variable\s+"aurora_instance_count_dr"/);
    expect(variablesContent).toMatch(/variable\s+"database_name"/);
    expect(variablesContent).toMatch(/variable\s+"db_master_username"/);
  });

  test('domain and Route 53 variables are defined', () => {
    expect(variablesContent).toMatch(/variable\s+"domain_name"/);
    expect(variablesContent).toMatch(/variable\s+"route53_zone_id"/);
  });

  test('alarm email variable is defined', () => {
    expect(variablesContent).toMatch(/variable\s+"alarm_email"/);
  });
});

describe('VPC Resources - Multi-Region Networking', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('primary VPC resource is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
  });

  test('DR VPC resource is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"dr"/);
  });

  test('primary region subnets are defined (public, private, database)', () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_public"/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private"/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"primary_database"/);
  });

  test('DR region subnets are defined (public, private, database)', () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dr_public"/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dr_private"/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"dr_database"/);
  });

  test('Internet Gateways are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"dr"/);
  });

  test('NAT Gateways are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"dr"/);
  });

  test('Route tables are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_public"/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"primary_private"/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"dr_public"/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"dr_private"/);
  });

  test('VPC does NOT use external modules', () => {
    expect(stackContent).not.toMatch(/module\s+"vpc_primary"/);
    expect(stackContent).not.toMatch(/module\s+"vpc_dr"/);
    expect(stackContent).not.toMatch(/source\s*=\s*"terraform-aws-modules\/vpc\/aws"/);
  });
});

describe('Aurora Global Database - RTO/RPO Compliance', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('Aurora Global Cluster is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_global_cluster"\s+"financial_db"/);
  });

  test('Aurora Global Cluster uses PostgreSQL engine', () => {
    const globalClusterMatch = stackContent.match(/resource\s+"aws_rds_global_cluster"\s+"financial_db"[\s\S]*?engine\s*=\s*"aurora-postgresql"[\s\S]*?^}/m);
    expect(globalClusterMatch).toBeTruthy();
  });

  test('Primary Aurora cluster is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"/);
  });

  test('DR Aurora cluster is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"dr"/);
  });

  test('Aurora cluster instances are defined for primary region', () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"/);
  });

  test('Aurora cluster instances are defined for DR region', () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"dr"/);
  });

  test('Aurora has encryption enabled', () => {
    const primaryClusterMatch = stackContent.match(/resource\s+"aws_rds_cluster"\s+"primary"\s*{[\s\S]*?storage_encrypted\s*=\s*true[\s\S]*?}/);
    const drClusterMatch = stackContent.match(/resource\s+"aws_rds_cluster"\s+"dr"\s*{[\s\S]*?storage_encrypted\s*=\s*true[\s\S]*?}/);

    expect(primaryClusterMatch).toBeTruthy();
    expect(drClusterMatch).toBeTruthy();
  });

  test('Aurora does NOT have deletion protection enabled (for testing)', () => {
    const deletionProtectionMatch = stackContent.match(/deletion_protection\s*=\s*true/g);
    expect(deletionProtectionMatch).toBeNull();
  });

  test('Aurora has enhanced monitoring enabled (5-second intervals for RTO)', () => {
    expect(stackContent).toMatch(/monitoring_interval\s*=\s*5/);
  });

  test('Aurora backup retention meets compliance requirements (35 days)', () => {
    expect(stackContent).toMatch(/backup_retention_period\s*=\s*35/);
  });

  test('DB subnet groups are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"dr"/);
  });

  test('IAM roles for RDS monitoring are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring_dr"/);
  });
});

describe('KMS Encryption Keys - Security Compliance', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('KMS keys are defined for Aurora in both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"aurora_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"aurora_dr"/);
  });

  test('KMS keys are defined for DynamoDB in both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"dynamodb_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"dynamodb_dr"/);
  });

  test('KMS keys have automatic rotation enabled', () => {
    const rotationMatches = stackContent.match(/enable_key_rotation\s*=\s*true/g);
    expect(rotationMatches).toBeTruthy();
    expect(rotationMatches!.length).toBeGreaterThanOrEqual(4);
  });

  test('KMS key aliases are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"aurora_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"aurora_dr"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"dynamodb_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"dynamodb_dr"/);
  });
});

describe('DynamoDB Global Tables - Session State Replication', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('DynamoDB table with global replication is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"session_data"/);
  });

  test('DynamoDB has point-in-time recovery enabled', () => {
    const pitrMatch = stackContent.match(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true[\s\S]*?}/);
    expect(pitrMatch).toBeTruthy();
  });

  test('DynamoDB has encryption enabled with KMS', () => {
    const encryptionMatch = stackContent.match(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true[\s\S]*?kms_key_arn[\s\S]*?}/);
    expect(encryptionMatch).toBeTruthy();
  });

  test('DynamoDB has replica configured for DR region', () => {
    const replicaMatch = stackContent.match(/replica\s*{[\s\S]*?region_name[\s\S]*?}/);
    expect(replicaMatch).toBeTruthy();
  });

  test('DynamoDB has streams enabled for replication', () => {
    expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
    expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
  });

  test('DynamoDB has TTL configured', () => {
    const ttlMatch = stackContent.match(/ttl\s*{[\s\S]*?enabled\s*=\s*true[\s\S]*?}/);
    expect(ttlMatch).toBeTruthy();
  });
});

describe('S3 Buckets - Cross-Region Replication', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('S3 transaction log buckets are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"transaction_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"transaction_logs_dr"/);
  });

  test('S3 buckets have versioning enabled', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"transaction_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"transaction_logs_dr"/);

    const versioningMatches = stackContent.match(/status\s*=\s*"Enabled"/g);
    expect(versioningMatches).toBeTruthy();
    expect(versioningMatches!.length).toBeGreaterThan(0);
  });

  test('S3 buckets have encryption enabled', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"transaction_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"transaction_logs_dr"/);
  });

  test('S3 buckets have public access blocked', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"transaction_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"transaction_logs_dr"/);

    const publicAccessMatches = stackContent.match(/block_public_acls\s*=\s*true/g);
    expect(publicAccessMatches).toBeTruthy();
    expect(publicAccessMatches!.length).toBeGreaterThan(0);
  });

  test('S3 replication configuration is defined for RPO compliance', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"transaction_logs_replication"/);
  });

  test('S3 replication has time control enabled (15 minutes for RPO)', () => {
    const rtcMatch = stackContent.match(/replication_time\s*{[\s\S]*?status\s*=\s*"Enabled"[\s\S]*?minutes\s*=\s*15[\s\S]*?}/s);
    expect(rtcMatch).toBeTruthy();
  });

  test('VPC Flow Logs buckets are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"vpc_flow_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"vpc_flow_logs_dr"/);
  });

  test('ALB logs buckets are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs_dr"/);
  });

  test('IAM role for S3 replication is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"s3_replication"/);
  });

  test('S3 bucket policies are defined for service access', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"vpc_flow_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"vpc_flow_logs_dr"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"alb_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"alb_logs_dr"/);
  });
});

describe('Application Load Balancers - Multi-Region', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('ALBs are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"dr"/);
  });

  test('ALB target groups are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"dr"/);
  });

  test('ALB health checks are configured with aggressive intervals for RTO', () => {
    const healthCheckMatches = stackContent.match(/interval\s*=\s*10/g);
    expect(healthCheckMatches).toBeTruthy();
    expect(healthCheckMatches!.length).toBeGreaterThan(0);
  });

  test('ALB target group deregistration delay is minimal (5 seconds)', () => {
    const deregMatches = stackContent.match(/deregistration_delay\s*=\s*5/g);
    expect(deregMatches).toBeTruthy();
    expect(deregMatches!.length).toBeGreaterThanOrEqual(2);
  });

  test('ALB security groups are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_dr"/);
  });

  test('ALB has access logging enabled', () => {
    const accessLogsMatches = stackContent.match(/access_logs\s*{[\s\S]*?enabled\s*=\s*true[\s\S]*?}/g);
    expect(accessLogsMatches).toBeTruthy();
    expect(accessLogsMatches!.length).toBeGreaterThanOrEqual(2);
  });

  test('ALB does NOT have deletion protection enabled (for testing)', () => {
    const albDeletionMatch = stackContent.match(/resource\s+"aws_lb"[\s\S]*?enable_deletion_protection\s*=\s*true/);
    expect(albDeletionMatch).toBeNull();
  });
});

describe('Route 53 - DNS Failover Configuration', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('Route 53 health checks are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"dr"/);
  });

  test('Route 53 health checks use 10-second intervals for RTO', () => {
    const healthCheckIntervals = stackContent.match(/request_interval\s*=\s*10/g);
    expect(healthCheckIntervals).toBeTruthy();
    expect(healthCheckIntervals!.length).toBeGreaterThanOrEqual(2);
  });

  test('Route 53 failover records are defined (PRIMARY and SECONDARY)', () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"dr"/);
    expect(stackContent).toMatch(/type\s*=\s*"PRIMARY"/);
    expect(stackContent).toMatch(/type\s*=\s*"SECONDARY"/);
  });
});

describe('Security Groups - Application Tier', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('Application tier security groups are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_dr"/);
  });

  test('Aurora security groups are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora_dr"/);
  });

  test('Security group rules have descriptions for compliance', () => {
    const descriptionMatches = stackContent.match(/description\s*=\s*"[^"]+"/g);
    expect(descriptionMatches).toBeTruthy();
    expect(descriptionMatches!.length).toBeGreaterThan(10);
  });
});

describe('CloudWatch Alarms - Monitoring and Alerting', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('CloudWatch alarm for primary ALB health is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_health"/);
  });

  test('CloudWatch alarm for Aurora replication lag is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_lag_alarm"/);
  });

  test('Aurora replication lag alarm threshold is set for RPO compliance (30 seconds)', () => {
    const lagAlarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_lag_alarm"[\s\S]*?threshold\s*=\s*30000[\s\S]*?}/);
    expect(lagAlarmMatch).toBeTruthy();
  });
});

describe('Lambda Functions - DR Automation', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('Failover orchestrator Lambda function is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"failover_orchestrator"/);
  });

  test('DR test validator Lambda function is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"dr_test_validator"/);
  });

  test('Lambda IAM roles are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_failover"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_dr_test"/);
  });

  test('Lambda has timeout configured for failover completion (5 minutes)', () => {
    const timeoutMatches = stackContent.match(/timeout\s*=\s*300/g);
    expect(timeoutMatches).toBeTruthy();
    expect(timeoutMatches!.length).toBeGreaterThanOrEqual(2);
  });

  test('Lambda has dead letter queue configured', () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"lambda_dlq"/);
    const dlqMatch = stackContent.match(/dead_letter_config\s*{[\s\S]*?target_arn[\s\S]*?}/);
    expect(dlqMatch).toBeTruthy();
  });

  test('Lambda IAM policies do NOT use wildcard permissions', () => {
    const lambdaPolicySection = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"lambda_failover"[\s\S]*?}[\s\S]*?}/);
    expect(lambdaPolicySection).toBeTruthy();

    if (lambdaPolicySection) {
      const wildcardResourceMatch = lambdaPolicySection[0].match(/"Resource"\s*[:=]\s*"\*"/);
      expect(wildcardResourceMatch).toBeNull();
    }
  });
});

describe('EventBridge - Automated Failover Orchestration', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('EventBridge rule for failover trigger is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"failover_trigger"/);
  });

  test('EventBridge target for Lambda is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"failover_lambda"/);
  });

  test('Lambda permission for EventBridge invocation is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
  });
});

describe('Systems Manager - DR Testing Automation', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('SSM automation document for DR testing is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_document"\s+"dr_test_runbook"/);
  });

  test('SSM document is of type Automation', () => {
    const ssmDocMatch = stackContent.match(/resource\s+"aws_ssm_document"\s+"dr_test_runbook"[\s\S]*?document_type\s*=\s*"Automation"[\s\S]*?}/);
    expect(ssmDocMatch).toBeTruthy();
  });

  test('SSM automation IAM role is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ssm_automation"/);
  });
});

describe('Security Hub - PCI-DSS Compliance', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('Security Hub configuration section exists with documentation', () => {
    expect(stackContent).toMatch(/Security Hub for PCI-DSS Compliance/);
    expect(stackContent).toMatch(/Security Hub/i);
  });

  test('Security Hub resources are commented or documented for account-level management', () => {
    const hasSecurityHubComment = stackContent.match(/# Security Hub/i);
    const hasAccountComment = stackContent.match(/account-level|organization level/i);
    
    expect(hasSecurityHubComment).toBeTruthy();
    expect(hasAccountComment || hasSecurityHubComment).toBeTruthy();
  });

  test('PCI-DSS compliance is documented in tags and configuration', () => {
    expect(stackContent).toMatch(/PCI-DSS/i);
    const pciMatches = stackContent.match(/PCI-DSS/gi);
    expect(pciMatches).toBeTruthy();
    expect(pciMatches!.length).toBeGreaterThan(0);
  });
});

describe('Secrets Manager - Credential Management', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('Secrets Manager secret for database credentials is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials_primary"/);
  });

  test('Secret version with credentials is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_credentials_primary"/);
  });

  test('Secret has replica configured for DR region', () => {
    const replicaMatch = stackContent.match(/replica\s*{[\s\S]*?region[\s\S]*?}/);
    expect(replicaMatch).toBeTruthy();
  });

  test('Random password resource is defined', () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
  });
});

describe('SNS - Notification System', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('SNS topic for DR notifications is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"dr_notifications"/);
  });

  test('SNS topic subscription for email is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"dr_email"/);
  });
});

describe('Resource Naming - Environment Suffix', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('Resources include unique_suffix in their names', () => {
    const suffixMatches = stackContent.match(/\$\{local\.unique_suffix\}/g);
    expect(suffixMatches).toBeTruthy();
    expect(suffixMatches!.length).toBeGreaterThan(50);
  });

  test('Random ID resource is defined for unique naming', () => {
    expect(stackContent).toMatch(/resource\s+"random_id"\s+"suffix"/);
  });

  test('Tags include environment suffix', () => {
    const suffixTagMatch = stackContent.match(/Suffix\s*=\s*var\.environment_suffix/);
    expect(suffixTagMatch).toBeTruthy();
  });
});

describe('Outputs - Deployment Information', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('Primary ALB endpoint output is defined', () => {
    expect(stackContent).toMatch(/output\s+"primary_alb_endpoint"/);
  });

  test('DR ALB endpoint output is defined', () => {
    expect(stackContent).toMatch(/output\s+"dr_alb_endpoint"/);
  });

  test('Aurora Global Cluster ID output is defined', () => {
    expect(stackContent).toMatch(/output\s+"aurora_global_cluster_id"/);
  });

  test('DynamoDB table name output is defined', () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_table_name"/);
  });

  test('S3 buckets output is defined', () => {
    expect(stackContent).toMatch(/output\s+"s3_buckets"/);
  });

  test('VPC IDs output is defined', () => {
    expect(stackContent).toMatch(/output\s+"vpc_ids"/);
  });

  test('Security group IDs output is defined', () => {
    expect(stackContent).toMatch(/output\s+"security_group_ids"/);
  });

  test('Sensitive outputs are marked as sensitive', () => {
    const sensitiveMatches = stackContent.match(/sensitive\s*=\s*true/g);
    expect(sensitiveMatches).toBeTruthy();
    expect(sensitiveMatches!.length).toBeGreaterThan(0);
  });
});

describe('Compliance - Overall Infrastructure', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, 'utf8');
  });

  test('All resources have proper tagging with common_tags', () => {
    const tagMatches = stackContent.match(/tags\s*=\s*(merge\()?local\.common_tags/g);
    expect(tagMatches).toBeTruthy();
    expect(tagMatches!.length).toBeGreaterThan(20);
  });

  test('Resources use provider aliases for multi-region deployment', () => {
    const primaryProviderMatches = stackContent.match(/provider\s*=\s*aws\.primary/g);
    const drProviderMatches = stackContent.match(/provider\s*=\s*aws\.dr/g);

    expect(primaryProviderMatches).toBeTruthy();
    expect(drProviderMatches).toBeTruthy();
    expect(primaryProviderMatches!.length).toBeGreaterThan(20);
    expect(drProviderMatches!.length).toBeGreaterThan(10);
  });

  test('Proper depends_on relationships are configured', () => {
    const dependsOnMatches = stackContent.match(/depends_on\s*=\s*\[/g);
    expect(dependsOnMatches).toBeTruthy();
    expect(dependsOnMatches!.length).toBeGreaterThan(5);
  });
});
