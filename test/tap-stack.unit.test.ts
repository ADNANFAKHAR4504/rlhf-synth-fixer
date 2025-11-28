// TAP Stack Unit Tests for Database Migration Infrastructure
// Simple presence + sanity checks for the lib/*.tf files
// No Terraform commands are executed.

import * as fs from 'fs';
import * as path from 'path';

const libPath = path.join(__dirname, '..', 'lib');

describe('TAP Stack - Database Migration Infrastructure Unit Tests', () => {
  let mainContent: string;
  let providerContent: string;
  let variablesContent: string;
  let outputsContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
  });

  describe('File Existence', () => {
    test('main.tf exists', () => {
      const filePath = path.join(libPath, 'main.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('provider.tf exists', () => {
      const filePath = path.join(libPath, 'provider.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('variables.tf exists', () => {
      const filePath = path.join(libPath, 'variables.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('outputs.tf exists', () => {
      const filePath = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('declares AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
    });

    test('requires Terraform >= 1.5.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('requires AWS provider ~> 5.0', () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('uses var.aws_region for region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configures default tags', () => {
      expect(providerContent).toMatch(/default_tags\s*\{/);
    });
  });

  describe('Variable Definitions', () => {
    test('declares environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test('declares aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
    });

    test('declares Aurora engine version variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aurora_engine_version"/);
    });

    test('declares Aurora instance class variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aurora_instance_class"/);
    });

    test('declares Aurora master password variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aurora_master_password"/);
    });

    test('declares DMS replication instance class variable', () => {
      expect(variablesContent).toMatch(/variable\s+"dms_replication_instance_class"/);
    });

    test('declares DMS source endpoint host variable', () => {
      expect(variablesContent).toMatch(/variable\s+"dms_source_endpoint_host"/);
    });

    test('declares DMS source password variable', () => {
      expect(variablesContent).toMatch(/variable\s+"dms_source_password"/);
    });

    test('declares S3 lifecycle IA transition days variable', () => {
      expect(variablesContent).toMatch(/variable\s+"s3_lifecycle_ia_transition_days"/);
    });

    test('declares S3 lifecycle Glacier transition days variable', () => {
      expect(variablesContent).toMatch(/variable\s+"s3_lifecycle_glacier_transition_days"/);
    });

    test('declares alarm replication lag threshold variable', () => {
      expect(variablesContent).toMatch(/variable\s+"alarm_replication_lag_threshold"/);
    });

    test('declares alarm CPU threshold variable', () => {
      expect(variablesContent).toMatch(/variable\s+"alarm_cpu_threshold"/);
    });

    test('sensitive variables are marked as sensitive', () => {
      const passwordVars = variablesContent.match(/variable\s+"(\w+password\w*)"\s*\{[^}]*\}/gi);
      expect(passwordVars).toBeTruthy();
      if (passwordVars) {
        passwordVars.forEach((varBlock) => {
          expect(varBlock).toMatch(/sensitive\s*=\s*true/);
        });
      }
    });
  });

  describe('KMS Key Resources', () => {
    test('creates RDS KMS key', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
    });

    test('creates S3 KMS key', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
    });

    test('enables key rotation', () => {
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('creates KMS aliases', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
      expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPC resource', () => {
      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('enables DNS hostnames', () => {
      expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('enables DNS support', () => {
      expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates public subnets', () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('creates private subnets', () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('public subnets map public IPs', () => {
      expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('creates Internet Gateway', () => {
      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('creates route tables', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });
  });

  describe('Security Groups', () => {
    test('creates Aurora security group', () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"/);
    });

    test('creates DMS security group', () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"dms"/);
    });

    test('Aurora SG allows PostgreSQL port', () => {
      expect(mainContent).toMatch(/from_port\s*=\s*5432/);
      expect(mainContent).toMatch(/to_port\s*=\s*5432/);
    });
  });

  describe('IAM Roles', () => {
    test('creates DMS VPC role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"dms_vpc_role"/);
    });

    test('creates DMS CloudWatch role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"dms_cloudwatch_role"/);
    });

    test('attaches AmazonDMSVPCManagementRole policy', () => {
      expect(mainContent).toContain('AmazonDMSVPCManagementRole');
    });

    test('attaches AmazonDMSCloudWatchLogsRole policy', () => {
      expect(mainContent).toContain('AmazonDMSCloudWatchLogsRole');
    });

    test('creates RDS monitoring role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
    });
  });

  describe('Aurora PostgreSQL Cluster', () => {
    test('creates Aurora cluster', () => {
      expect(mainContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"/);
    });

    test('uses aurora-postgresql engine', () => {
      expect(mainContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('enables storage encryption', () => {
      expect(mainContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('uses KMS key for encryption', () => {
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
    });

    test('creates Aurora cluster instances', () => {
      expect(mainContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"/);
    });

    test('enables performance insights', () => {
      expect(mainContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test('creates parameter group for PostgreSQL 13', () => {
      expect(mainContent).toMatch(/resource\s+"aws_rds_cluster_parameter_group"\s+"aurora"/);
      expect(mainContent).toMatch(/family\s*=\s*"aurora-postgresql13"/);
    });

    test('configures pg_stat_statements', () => {
      expect(mainContent).toContain('pg_stat_statements');
    });

    test('deletion protection is disabled for destroyability', () => {
      expect(mainContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('skips final snapshot for destroyability', () => {
      expect(mainContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('creates DB subnet group', () => {
      expect(mainContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"/);
    });
  });

  describe('DMS Resources', () => {
    test('creates DMS replication subnet group', () => {
      expect(mainContent).toMatch(/resource\s+"aws_dms_replication_subnet_group"\s+"main"/);
    });

    test('creates DMS replication instance', () => {
      expect(mainContent).toMatch(/resource\s+"aws_dms_replication_instance"\s+"main"/);
    });

    test('DMS instance is Multi-AZ', () => {
      expect(mainContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('DMS instance is not publicly accessible', () => {
      expect(mainContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('creates DMS source endpoint', () => {
      expect(mainContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"source"/);
      expect(mainContent).toMatch(/endpoint_type\s*=\s*"source"/);
    });

    test('creates DMS target endpoint', () => {
      expect(mainContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"target"/);
      expect(mainContent).toMatch(/endpoint_type\s*=\s*"target"/);
    });

    test('source endpoint uses postgres engine', () => {
      expect(mainContent).toMatch(/engine_name\s*=\s*"postgres"/);
    });

    test('target endpoint uses aurora-postgresql engine', () => {
      expect(mainContent).toMatch(/engine_name\s*=\s*"aurora-postgresql"/);
    });

    test('endpoints require SSL', () => {
      expect(mainContent).toMatch(/ssl_mode\s*=\s*"require"/);
    });

    test('creates DMS replication task', () => {
      expect(mainContent).toMatch(/resource\s+"aws_dms_replication_task"\s+"main"/);
    });

    test('replication task uses full-load-and-cdc', () => {
      expect(mainContent).toMatch(/migration_type\s*=\s*"full-load-and-cdc"/);
    });

    test('replication task has table mappings', () => {
      expect(mainContent).toContain('table_mappings');
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"migration"/);
    });

    test('enables bucket versioning', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"migration"/);
      expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures server-side encryption with KMS', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.arn/);
    });

    test('configures lifecycle rules', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(mainContent).toContain('STANDARD_IA');
      expect(mainContent).toContain('GLACIER');
    });

    test('blocks public access', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe('SNS and Alerting', () => {
    test('creates SNS topic for alerts', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"migration_alerts"/);
    });

    test('SNS topic uses KMS encryption', () => {
      expect(mainContent).toMatch(/kms_master_key_id/);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates DMS replication lag alarm', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dms_replication_lag"/);
      expect(mainContent).toContain('CDCLatencyTarget');
      expect(mainContent).toContain('AWS/DMS');
    });

    test('creates Aurora CPU alarm', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_cpu"/);
    });

    test('creates Aurora connections alarm', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_connections"/);
    });

    test('creates Aurora storage alarm', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_storage"/);
    });

    test('creates CloudWatch dashboard', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"migration"/);
      expect(mainContent).toContain('dashboard_body');
    });
  });

  describe('Resource Naming with environment_suffix', () => {
    test('Aurora cluster uses environment_suffix', () => {
      expect(mainContent).toMatch(/cluster_identifier\s*=\s*"aurora-cluster-\$\{var\.environment_suffix\}"/);
    });

    test('DMS instance uses environment_suffix', () => {
      expect(mainContent).toMatch(/replication_instance_id\s*=\s*"dms-instance-\$\{var\.environment_suffix\}"/);
    });

    test('S3 bucket uses environment_suffix', () => {
      expect(mainContent).toMatch(/bucket\s*=\s*"inventory-migration-\$\{var\.environment_suffix\}"/);
    });

    test('KMS keys use environment_suffix in tags', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"rds-kms-key-\$\{var\.environment_suffix\}"/);
      expect(mainContent).toMatch(/Name\s*=\s*"s3-kms-key-\$\{var\.environment_suffix\}"/);
    });

    test('Security groups use environment_suffix', () => {
      expect(mainContent).toMatch(/name_prefix\s*=\s*"aurora-sg-\$\{var\.environment_suffix\}-"/);
      expect(mainContent).toMatch(/name_prefix\s*=\s*"dms-sg-\$\{var\.environment_suffix\}-"/);
    });
  });

  describe('Output Definitions', () => {
    test('exports VPC ID', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });

    test('exports public subnet IDs', () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
    });

    test('exports private subnet IDs', () => {
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('exports Aurora cluster endpoint', () => {
      expect(outputsContent).toMatch(/output\s+"aurora_cluster_endpoint"/);
    });

    test('exports Aurora reader endpoint', () => {
      expect(outputsContent).toMatch(/output\s+"aurora_cluster_reader_endpoint"/);
    });

    test('exports Aurora database name', () => {
      expect(outputsContent).toMatch(/output\s+"aurora_database_name"/);
    });

    test('exports DMS replication instance ARN', () => {
      expect(outputsContent).toMatch(/output\s+"dms_replication_instance_arn"/);
    });

    test('exports DMS replication task ARN', () => {
      expect(outputsContent).toMatch(/output\s+"dms_replication_task_arn"/);
    });

    test('exports DMS source endpoint ARN', () => {
      expect(outputsContent).toMatch(/output\s+"dms_source_endpoint_arn"/);
    });

    test('exports DMS target endpoint ARN', () => {
      expect(outputsContent).toMatch(/output\s+"dms_target_endpoint_arn"/);
    });

    test('exports S3 bucket name', () => {
      expect(outputsContent).toMatch(/output\s+"s3_migration_bucket_name"/);
    });

    test('exports S3 bucket ARN', () => {
      expect(outputsContent).toMatch(/output\s+"s3_migration_bucket_arn"/);
    });

    test('exports CloudWatch dashboard name', () => {
      expect(outputsContent).toMatch(/output\s+"cloudwatch_dashboard_name"/);
    });

    test('exports SNS topic ARN', () => {
      expect(outputsContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('exports KMS key IDs', () => {
      expect(outputsContent).toMatch(/output\s+"kms_rds_key_id"/);
      expect(outputsContent).toMatch(/output\s+"kms_s3_key_id"/);
    });

    test('exports security group IDs', () => {
      expect(outputsContent).toMatch(/output\s+"security_group_aurora_id"/);
      expect(outputsContent).toMatch(/output\s+"security_group_dms_id"/);
    });
  });

  describe('Destroyability (No Retention Policies)', () => {
    test('Aurora cluster has deletion protection disabled', () => {
      expect(mainContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('Aurora cluster skips final snapshot', () => {
      expect(mainContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('does NOT use RETAIN deletion policy', () => {
      expect(mainContent).not.toMatch(/RETAIN/i);
    });
  });

  describe('Terraform Syntax', () => {
    test('uses proper HCL resource syntax', () => {
      const resourcePattern = /resource\s+"[a-z_]+"\s+"[a-z_]+"\s*\{/g;
      const matches = mainContent.match(resourcePattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(20);
    });

    test('uses jsonencode for complex objects', () => {
      expect(mainContent).toMatch(/jsonencode\s*\(/);
    });

    test('uses depends_on for dependencies', () => {
      expect(mainContent).toMatch(/depends_on\s*=\s*\[/);
    });

    test('uses count for multi-resource creation', () => {
      expect(mainContent).toMatch(/count\s*=\s*length\(/);
    });
  });
});
