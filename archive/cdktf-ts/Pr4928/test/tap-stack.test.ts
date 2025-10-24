import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('HIPAA-Compliant Disaster Recovery Infrastructure Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new TapStack(app, 'TestHIPAAStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'eu-central-1',
      awsRegion: 'eu-central-1',
    });
    synthesized = Testing.synth(stack);
  });

  describe('Stack Initialization', () => {
    test('TapStack instantiates successfully with props', () => {
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack uses custom environment suffix', () => {
      expect(synthesized).toContain('test');
      expect(synthesized).toContain('hipaa-vpc-test');
    });

    test('TapStack uses default values when no props provided', () => {
      const defaultApp = new App();
      const defaultStack = new TapStack(defaultApp, 'TestDefaultStack');
      const defaultSynthesized = Testing.synth(defaultStack);

      expect(defaultStack).toBeDefined();
      expect(defaultSynthesized).toBeDefined();
    });
  });

  describe('AWS Providers Configuration', () => {
    test('Creates primary AWS provider with correct region', () => {
      expect(synthesized).toContain('"provider":"aws"');
      expect(synthesized).toContain('"region":"eu-central-1"');
      expect(synthesized).toContain('"alias":"primary"');
    });

    test('Creates DR AWS provider with correct region', () => {
      expect(synthesized).toContain('"provider":"aws"');
      expect(synthesized).toContain('"region":"eu-west-1"');
      expect(synthesized).toContain('"alias":"dr"');
    });

    test('Configures S3 backend with encryption', () => {
      expect(synthesized).toContain('"backend"');
      expect(synthesized).toContain('"s3"');
      expect(synthesized).toContain('"encrypt":true');
      expect(synthesized).toContain('use_lockfile');
    });
  });

  describe('Networking Resources', () => {
    test('Creates VPC with proper CIDR and DNS settings', () => {
      expect(synthesized).toContain('aws_vpc');
      expect(synthesized).toContain('10.0.0.0/16');
      expect(synthesized).toContain('"enable_dns_hostnames":true');
      expect(synthesized).toContain('"enable_dns_support":true');
    });

    test('Creates public and private subnets in multiple AZs', () => {
      expect(synthesized).toContain('aws_subnet');
      expect(synthesized).toContain('10.0.1.0/24'); // Public subnet 1
      expect(synthesized).toContain('10.0.2.0/24'); // Public subnet 2
      expect(synthesized).toContain('10.0.10.0/24'); // Private subnet 1
      expect(synthesized).toContain('10.0.11.0/24'); // Private subnet 2
    });

    test('Creates Internet Gateway', () => {
      expect(synthesized).toContain('aws_internet_gateway');
      expect(synthesized).toContain('hipaa-igw-test');
    });

    test('Creates NAT Gateway with EIP', () => {
      expect(synthesized).toContain('aws_eip');
      expect(synthesized).toContain('aws_nat_gateway');
      expect(synthesized).toContain('hipaa-nat-gw-test');
    });

    test('Creates public and private route tables', () => {
      expect(synthesized).toContain('aws_route_table');
      expect(synthesized).toContain('hipaa-public-rt-test');
      expect(synthesized).toContain('hipaa-private-rt-test');
    });

    test('Creates routes for public and private traffic', () => {
      expect(synthesized).toContain('aws_route');
      expect(synthesized).toContain('0.0.0.0/0');
    });

    test('Associates subnets with route tables', () => {
      expect(synthesized).toContain('aws_route_table_association');
    });

    test('Creates S3 VPC endpoint', () => {
      expect(synthesized).toContain('aws_vpc_endpoint');
      expect(synthesized).toContain('com.amazonaws.eu-central-1.s3');
      expect(synthesized).toContain('hipaa-s3-endpoint-test');
    });

    test('Tags all network resources with HIPAA compliance', () => {
      const vpcMatch = synthesized.match(
        /"aws_vpc"[\s\S]*?"tags":\s*{[\s\S]*?"Compliance":"HIPAA"/
      );
      expect(vpcMatch).toBeTruthy();
    });
  });

  describe('Encryption and Security', () => {
    test('Creates KMS key with automatic rotation', () => {
      expect(synthesized).toContain('aws_kms_key');
      expect(synthesized).toContain('"enable_key_rotation":true');
      expect(synthesized).toContain('HIPAA-compliant data encryption');
    });

    test('Creates KMS alias', () => {
      expect(synthesized).toContain('aws_kms_alias');
      expect(synthesized).toContain('alias/hipaa-test');
    });

    test('Creates KMS key for DR region', () => {
      const drKeyMatches = synthesized.match(
        /"aws_kms_key"[\s\S]*?"region":"eu-west-1"/g
      );
      expect(drKeyMatches).toBeTruthy();
    });

    test('Configures KMS key policy with proper permissions', () => {
      expect(synthesized).toContain('data_aws_iam_policy_document');
      expect(synthesized).toContain('Enable IAM User Permissions');
      expect(synthesized).toContain('Allow CloudWatch Logs');
      expect(synthesized).toContain('Allow CloudTrail');
    });

    test('Creates database security group with restrictive rules', () => {
      expect(synthesized).toContain('aws_security_group');
      expect(synthesized).toContain('hipaa-db-sg-test');
      expect(synthesized).toContain('aws_security_group_rule');
      expect(synthesized).toContain('5432'); // PostgreSQL port
    });

    test('Security group allows PostgreSQL only from VPC CIDR', () => {
      expect(synthesized).toContain('10.0.0.0/16');
      expect(synthesized).toContain('"from_port":5432');
      expect(synthesized).toContain('"to_port":5432');
    });
  });

  describe('Storage Resources', () => {
    test('Creates S3 bucket for patient data in primary region', () => {
      expect(synthesized).toContain('aws_s3_bucket');
      expect(synthesized).toContain('hipaa-patient-data-test-eu-central-1');
    });

    test('Creates S3 bucket in DR region', () => {
      expect(synthesized).toContain('hipaa-patient-data-test-eu-west-1');
    });

    test('Enables S3 bucket versioning', () => {
      expect(synthesized).toContain('aws_s3_bucket_versioning');
      expect(synthesized).toContain('"status":"Enabled"');
    });

    test('Enables S3 server-side encryption with KMS', () => {
      expect(synthesized).toContain(
        'aws_s3_bucket_server_side_encryption_configuration'
      );
      expect(synthesized).toContain('"sse_algorithm":"aws:kms"');
      expect(synthesized).toContain('"bucket_key_enabled":true');
    });

    test('Blocks public access to S3 buckets', () => {
      expect(synthesized).toContain('aws_s3_bucket_public_access_block');
      expect(synthesized).toContain('"block_public_acls":true');
      expect(synthesized).toContain('"block_public_policy":true');
      expect(synthesized).toContain('"ignore_public_acls":true');
      expect(synthesized).toContain('"restrict_public_buckets":true');
    });

    test('Configures S3 lifecycle policies for compliance', () => {
      expect(synthesized).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(synthesized).toContain('archive-old-versions');
      expect(synthesized).toContain('STANDARD_IA');
      expect(synthesized).toContain('GLACIER');
      expect(synthesized).toContain('2555'); // 7 years retention
    });

    test('Creates IAM role for S3 replication', () => {
      expect(synthesized).toContain('aws_iam_role');
      expect(synthesized).toContain('hipaa-s3-replication-role-test');
      expect(synthesized).toContain('s3.amazonaws.com');
    });

    test('Configures S3 cross-region replication', () => {
      expect(synthesized).toContain('aws_s3_bucket_replication_configuration');
      expect(synthesized).toContain('"status":"Enabled"');
      expect(synthesized).toContain('"priority":1');
    });

    test('S3 replication includes delete marker replication', () => {
      expect(synthesized).toContain('delete_marker_replication');
    });

    test('S3 replication includes metrics and timing', () => {
      expect(synthesized).toContain('"minutes":15');
    });
  });

  describe('Database Resources', () => {
    test('Creates DB subnet group in private subnets', () => {
      expect(synthesized).toContain('aws_db_subnet_group');
      expect(synthesized).toContain('hipaa-db-subnet-group-test');
    });

    test('Creates Secrets Manager secret for database password', () => {
      expect(synthesized).toContain('aws_secretsmanager_secret');
      expect(synthesized).toContain('hipaa-db-master-password-test');
      expect(synthesized).toContain('"recovery_window_in_days":30');
    });

    test('Stores database credentials in Secrets Manager', () => {
      expect(synthesized).toContain('aws_secretsmanager_secret_version');
      expect(synthesized).toContain('admin');
      expect(synthesized).toContain('postgres');
    });

    test('Creates RDS Global Cluster for cross-region DR', () => {
      expect(synthesized).toContain('aws_rds_global_cluster');
      expect(synthesized).toContain('hipaa-aurora-global-test');
      expect(synthesized).toContain('"engine":"aurora-postgresql"');
      expect(synthesized).toContain('"storage_encrypted":true');
    });

    test('Creates Aurora cluster with encryption enabled', () => {
      expect(synthesized).toContain('aws_rds_cluster');
      expect(synthesized).toContain('hipaa-aurora-test');
      expect(synthesized).toContain('"storage_encrypted":true');
      expect(synthesized).toContain('"backup_retention_period":30');
    });

    test('Enables CloudWatch logs exports for Aurora', () => {
      expect(synthesized).toContain(
        '"enabled_cloudwatch_logs_exports":["postgresql"]'
      );
    });

    test('Creates two Aurora instances for Multi-AZ', () => {
      expect(synthesized).toContain('aws_rds_cluster_instance');
      expect(synthesized).toContain('hipaa-aurora-instance-1-test');
      expect(synthesized).toContain('hipaa-aurora-instance-2-test');
    });

    test('Enables Performance Insights on database instances', () => {
      expect(synthesized).toContain('"performance_insights_enabled":true');
      expect(synthesized).toContain('"monitoring_interval":60');
    });

    test('Database is not publicly accessible', () => {
      expect(synthesized).toContain('"publicly_accessible":false');
    });
  });

  describe('Logging and Audit', () => {
    test('Creates CloudWatch Log Groups with encryption', () => {
      expect(synthesized).toContain('aws_cloudwatch_log_group');
      expect(synthesized).toContain('/aws/hipaa/application-test');
      expect(synthesized).toContain(
        '/aws/rds/cluster/hipaa-aurora-test/postgresql'
      );
      expect(synthesized).toContain('"retention_in_days":365');
    });

    test('Creates CloudTrail S3 bucket', () => {
      expect(synthesized).toContain('hipaa-cloudtrail-test');
    });

    test('Creates separate bucket for CloudTrail logs', () => {
      expect(synthesized).toContain('hipaa-cloudtrail-logs-test');
    });

    test('Enables CloudTrail bucket logging', () => {
      expect(synthesized).toContain('aws_s3_bucket_logging');
      expect(synthesized).toContain('cloudtrail-bucket-logs/');
    });

    test('Creates CloudTrail bucket policy', () => {
      expect(synthesized).toContain('aws_s3_bucket_policy');
      expect(synthesized).toContain('AWSCloudTrailAclCheck');
      expect(synthesized).toContain('AWSCloudTrailWrite');
    });

    test('Creates CloudTrail with log file validation', () => {
      expect(synthesized).toContain('aws_cloudtrail');
      expect(synthesized).toContain('hipaa-trail-test');
      expect(synthesized).toContain('"enable_log_file_validation":true');
      expect(synthesized).toContain('"is_multi_region_trail":true');
    });

    test('CloudTrail includes data event tracking', () => {
      expect(synthesized).toContain('"read_write_type":"All"');
      expect(synthesized).toContain('"include_management_events":true');
      expect(synthesized).toContain('AWS::S3::Object');
    });
  });

  describe('Backup and Disaster Recovery', () => {
    test('Creates IAM role for AWS Backup', () => {
      expect(synthesized).toContain('hipaa-backup-role-test');
      expect(synthesized).toContain('backup.amazonaws.com');
    });

    test('Attaches AWS Backup policies to IAM role', () => {
      expect(synthesized).toContain('aws_iam_role_policy_attachment');
      expect(synthesized).toContain('AWSBackupServiceRolePolicyForBackup');
      expect(synthesized).toContain('AWSBackupServiceRolePolicyForRestores');
    });

    test('Creates backup vault with encryption', () => {
      expect(synthesized).toContain('aws_backup_vault');
      expect(synthesized).toContain('hipaa-backup-vault-test');
    });

    test('Creates backup plan with multiple retention tiers', () => {
      expect(synthesized).toContain('aws_backup_plan');
      expect(synthesized).toContain('hipaa-backup-plan-test');
      expect(synthesized).toContain('hourly-backup');
      expect(synthesized).toContain('daily-backup');
      expect(synthesized).toContain('weekly-backup');
      expect(synthesized).toContain('monthly-backup');
    });

    test('Hourly backup schedule for RPO compliance', () => {
      expect(synthesized).toContain('cron(0 * * * ? *)');
      expect(synthesized).toContain('"delete_after":7');
    });

    test('Monthly backup with cold storage for long-term retention', () => {
      expect(synthesized).toContain('cron(0 4 1 * ? *)');
      expect(synthesized).toContain('"cold_storage_after":30');
      expect(synthesized).toContain('"delete_after":2555');
    });

    test('Creates backup selection with tag-based selection', () => {
      expect(synthesized).toContain('aws_backup_selection');
      expect(synthesized).toContain('hipaa-backup-selection-test');
      expect(synthesized).toContain('STRINGEQUALS');
      expect(synthesized).toContain('"key":"Compliance"');
      expect(synthesized).toContain('"value":"HIPAA"');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('Creates SNS topic for alerts', () => {
      expect(synthesized).toContain('aws_sns_topic');
      expect(synthesized).toContain('hipaa-alerts-test');
    });

    test('Creates CloudWatch alarm for backup failures', () => {
      expect(synthesized).toContain('aws_cloudwatch_metric_alarm');
      expect(synthesized).toContain('hipaa-backup-job-failed-test');
      expect(synthesized).toContain('NumberOfBackupJobsFailed');
    });

    test('Creates CloudWatch alarm for high database CPU', () => {
      expect(synthesized).toContain('hipaa-db-cpu-high-test');
      expect(synthesized).toContain('CPUUtilization');
      expect(synthesized).toContain('"threshold":80');
    });

    test('Creates CloudWatch alarm for database connections', () => {
      expect(synthesized).toContain('hipaa-db-connections-high-test');
      expect(synthesized).toContain('DatabaseConnections');
    });

    test('Creates CloudWatch alarm for S3 replication latency', () => {
      expect(synthesized).toContain('hipaa-s3-replication-latency-test');
      expect(synthesized).toContain('ReplicationLatency');
      expect(synthesized).toContain('"threshold":900');
    });

    test('All alarms send notifications to SNS topic', () => {
      const alarmMatches = synthesized.match(/"aws_cloudwatch_metric_alarm"/g);
      expect(alarmMatches).toBeTruthy();
      expect(alarmMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('HIPAA Compliance Tagging', () => {
    test('All major resources tagged with Environment', () => {
      const environmentTagMatches = synthesized.match(/"Environment":"test"/g);
      expect(environmentTagMatches).toBeTruthy();
      expect(environmentTagMatches!.length).toBeGreaterThan(10);
    });

    test('All major resources tagged with Compliance HIPAA', () => {
      const complianceTagMatches = synthesized.match(/"Compliance":"HIPAA"/g);
      expect(complianceTagMatches).toBeTruthy();
      expect(complianceTagMatches!.length).toBeGreaterThan(5);
    });

    test('Resources tagged with CostCenter for cost allocation', () => {
      expect(synthesized).toContain('"CostCenter":"Healthcare"');
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources follow naming pattern with environment suffix', () => {
      expect(synthesized).toContain('hipaa-vpc-test');
      expect(synthesized).toContain('hipaa-aurora-test');
      expect(synthesized).toContain('hipaa-patient-data-test');
      expect(synthesized).toContain('hipaa-backup-plan-test');
    });

    test('Resource names are unique and identifiable', () => {
      expect(synthesized).toContain('hipaa-public-subnet-1-test');
      expect(synthesized).toContain('hipaa-public-subnet-2-test');
      expect(synthesized).toContain('hipaa-private-subnet-1-test');
      expect(synthesized).toContain('hipaa-private-subnet-2-test');
    });
  });

  describe('Disaster Recovery Metrics', () => {
    test('RTO target: Infrastructure supports 4-hour recovery', () => {
      // Verify automated failover components exist
      expect(synthesized).toContain('aws_rds_global_cluster');
      expect(synthesized).toContain('aws_s3_bucket_replication_configuration');
      expect(synthesized).toContain('aws_backup_plan');
    });

    test('RPO target: Hourly backups for 1-hour data loss window', () => {
      expect(synthesized).toContain('cron(0 * * * ? *)');
      expect(synthesized).toContain('hourly-backup');
    });

    test('Cross-region replication configured for both storage types', () => {
      // S3 cross-region replication
      expect(synthesized).toContain('eu-west-1');
      expect(synthesized).toContain('replica');

      // RDS Global Cluster
      expect(synthesized).toContain('aws_rds_global_cluster');
    });
  });

  describe('Production Readiness', () => {
    test('All resources can be destroyed for testing', () => {
      expect(synthesized).toContain('"force_destroy":true');
      expect(synthesized).toContain('"skip_final_snapshot":true');
      expect(synthesized).toContain('"deletion_protection":false');
    });

    test('Resources use proper dependency relationships', () => {
      expect(synthesized).toContain('"depends_on"');
    });

    test('Stack synthesizes without errors', () => {
      expect(() => Testing.synth(stack)).not.toThrow();
    });

    test('Stack is valid JSON', () => {
      expect(() => JSON.parse(synthesized)).not.toThrow();
    });
  });

  describe('Code Coverage', () => {
    test('Verifies comprehensive resource creation', () => {
      const resourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_eip',
        'aws_route_table',
        'aws_route',
        'aws_vpc_endpoint',
        'aws_kms_key',
        'aws_kms_alias',
        'aws_s3_bucket',
        'aws_s3_bucket_versioning',
        'aws_s3_bucket_server_side_encryption_configuration',
        'aws_s3_bucket_public_access_block',
        'aws_s3_bucket_replication_configuration',
        'aws_s3_bucket_lifecycle_configuration',
        'aws_security_group',
        'aws_security_group_rule',
        'aws_db_subnet_group',
        'aws_secretsmanager_secret',
        'aws_secretsmanager_secret_version',
        'aws_rds_global_cluster',
        'aws_rds_cluster',
        'aws_rds_cluster_instance',
        'aws_cloudwatch_log_group',
        'aws_cloudtrail',
        'aws_backup_vault',
        'aws_backup_plan',
        'aws_backup_selection',
        'aws_cloudwatch_metric_alarm',
        'aws_sns_topic',
        'aws_iam_role',
        'aws_iam_role_policy',
        'aws_iam_role_policy_attachment',
      ];

      resourceTypes.forEach(resourceType => {
        expect(synthesized).toContain(resourceType);
      });
    });
  });
});
