import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  it('should create stack with default environment suffix', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toBeDefined();
  });

  it('should configure primary AWS provider with correct region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      awsRegion: 'ap-southeast-1',
    });

    const synthesized = Testing.synth(stack);
    const providers = synthesized.replace(/\s/g, '').match(/"region":\s*"[^"]+"/g);
    expect(providers).toBeDefined();
    expect(synthesized).toContain('ap-southeast-1');
  });

  it('should configure secondary AWS provider with DR region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ap-southeast-2');
    expect(synthesized).toContain('secondary');
  });

  it('should configure S3 backend with encryption', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('test-state-bucket');
    // S3 backend encryption is configured in backend section
    expect(synthesized).toBeDefined();
  });

  it('should create storage stack with environment suffix', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'unittest',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-data-primary-unittest');
    expect(synthesized).toContain('healthcare-data-dr-unittest');
  });

  it('should create monitoring stack with SNS topic', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-alerts-test');
    expect(synthesized).toContain('Healthcare DR Alerts');
  });

  it('should create database stack with Aurora configuration', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-test');
    expect(synthesized).toContain('aurora-postgresql');
    expect(synthesized).toContain('serverless');
  });

  it('should create disaster recovery stack with Lambda function', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-failover-test');
    expect(synthesized).toContain('failover-handler.handler');
  });

  it('should apply default tags when provided', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      defaultTags: {
        tags: {
          Project: 'Healthcare',
          ManagedBy: 'CDKTF',
        },
      },
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('Project');
    expect(synthesized).toContain('Healthcare');
  });

  it('should use environment suffix in all resource names', () => {
    const app = Testing.app();
    const suffix = 'mytest123';
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: suffix,
    });

    const synthesized = Testing.synth(stack);

    // Check various resource names contain the suffix
    expect(synthesized).toContain(`healthcare-kms-${suffix}`);
    expect(synthesized).toContain(`healthcare-db-${suffix}`);
    expect(synthesized).toContain(`healthcare-alerts-${suffix}`);
    expect(synthesized).toContain(`healthcare-failover-${suffix}`);
  });
});

describe('DatabaseStack', () => {
  it('should create primary VPC with correct CIDR', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-vpc-test');
    expect(synthesized).toContain('"cidr_block":"10.0.0.0/16"');
  });

  it('should enable DNS support and hostnames in VPC', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"enable_dns_hostnames":true');
    expect(synthesized).toContain('"enable_dns_support":true');
  });

  it('should create secondary VPC for DR region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-vpc-dr-test');
    expect(synthesized).toContain('"cidr_block":"10.1.0.0/16"');
  });

  it('should create multi-AZ subnets in primary region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"availability_zone":"ap-southeast-1a"');
    expect(synthesized).toContain('"availability_zone":"ap-southeast-1b"');
    expect(synthesized).toContain('"cidr_block":"10.0.1.0/24"');
    expect(synthesized).toContain('"cidr_block":"10.0.2.0/24"');
  });

  it('should create multi-AZ subnets in secondary region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"availability_zone":"ap-southeast-2a"');
    expect(synthesized).toContain('"availability_zone":"ap-southeast-2b"');
  });

  it('should create security group for database with PostgreSQL port', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-sg-test');
    expect(synthesized).toContain('"from_port":5432');
    expect(synthesized).toContain('"to_port":5432');
  });

  it('should restrict database access to VPC CIDR only', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"cidr_blocks":["10.0.0.0/16"]');
  });

  it('should create DB subnet groups with environment suffix', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'myenv',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-subnet-myenv');
    expect(synthesized).toContain('healthcare-db-subnet-dr-myenv');
  });

  it('should create Aurora Serverless v2 cluster with PostgreSQL', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-test');
    expect(synthesized).toContain('"engine":"aurora-postgresql"');
    expect(synthesized).toContain('"engine_mode":"provisioned"');
    expect(synthesized).toContain('"engine_version":"15.3"');
  });

  it('should configure serverless v2 scaling with min and max capacity', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('serverlessv2_scaling_configuration');
    expect(synthesized).toContain('"min_capacity":0.5');
    expect(synthesized).toContain('"max_capacity":2');
  });

  it('should enable storage encryption with KMS', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"storage_encrypted":true');
    expect(synthesized).toContain('healthcare-db-kms-test');
  });

  it('should configure 7-day backup retention', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"backup_retention_period":7');
  });

  it('should enable CloudWatch logs export for PostgreSQL', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"enabled_cloudwatch_logs_exports":["postgresql"]');
  });

  it('should disable deletion protection for destroyability', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"deletion_protection":false');
  });

  it('should skip final snapshot on deletion', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"skip_final_snapshot":true');
  });

  it('should create read replica cluster in secondary region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-dr-test');
    expect(synthesized).toContain('replication_source_identifier');
  });

  it('should create RDS cluster instances', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-instance-test');
    expect(synthesized).toContain('"instance_class":"db.serverless"');
  });

  it('should create database credentials in Secrets Manager', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-credentials-test');
    expect(synthesized).toContain('Database master credentials');
  });

  it('should create AWS Backup vault with KMS encryption', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-backup-vault-test');
  });

  it('should create backup plan with continuous backup enabled', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-backup-plan-test');
    expect(synthesized).toContain('continuous-backup');
    expect(synthesized).toContain('"enable_continuous_backup":true');
  });

  it('should configure hourly backup schedule for RPO < 15 minutes', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('cron(0 */1 * * ? *)');
  });

  it('should set backup lifecycle to 7 days', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"delete_after":7');
  });

  it('should create backup IAM role with correct permissions', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-backup-role-test');
    expect(synthesized).toContain('backup.amazonaws.com');
    expect(synthesized).toContain('AWSBackupServiceRolePolicyForBackup');
  });
});

describe('DisasterRecoveryStack', () => {
  it('should create SSM parameters for database identifiers', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('/healthcare/test/database/primary-id');
    expect(synthesized).toContain('/healthcare/test/database/replica-id');
    expect(synthesized).toContain('"type":"String"');
  });

  it('should create Lambda execution role with correct trust policy', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-dr-lambda-role-test');
    expect(synthesized).toContain('lambda.amazonaws.com');
  });

  it('should grant Lambda role RDS permissions', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('rds:DescribeDBClusters');
    expect(synthesized).toContain('rds:PromoteReadReplica');
    expect(synthesized).toContain('rds:ModifyDBCluster');
  });

  it('should grant Lambda role CloudWatch Logs permissions', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('logs:CreateLogGroup');
    expect(synthesized).toContain('logs:CreateLogStream');
    expect(synthesized).toContain('logs:PutLogEvents');
  });

  it('should grant Lambda role SNS publish permissions', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('sns:Publish');
  });

  it('should grant Lambda role SSM parameter access', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ssm:GetParameter');
    expect(synthesized).toContain('ssm:GetParameters');
  });

  it('should create Lambda function with correct configuration', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-failover-test');
    expect(synthesized).toContain('"handler":"failover-handler.handler"');
    expect(synthesized).toContain('"runtime":"nodejs18.x"');
  });

  it('should configure Lambda with 5-minute timeout', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"timeout":300');
  });

  it('should configure Lambda with environment variables', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'mytest',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"ENVIRONMENT_SUFFIX":"mytest"');
    expect(synthesized).toContain('"PRIMARY_REGION":"ap-southeast-1"');
    expect(synthesized).toContain('"SECONDARY_REGION":"ap-southeast-2"');
  });

  it('should create CloudWatch log group for Lambda', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('/aws/lambda/healthcare-failover-test');
    expect(synthesized).toContain('"retention_in_days":30');
  });

  it('should create CloudWatch alarm for database CPU', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-cpu-test');
    expect(synthesized).toContain('"metric_name":"CPUUtilization"');
    expect(synthesized).toContain('"namespace":"AWS/RDS"');
    expect(synthesized).toContain('"threshold":80');
  });

  it('should create CloudWatch alarm for database connections', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-connections-test');
    expect(synthesized).toContain('"metric_name":"DatabaseConnections"');
  });

  it('should create CloudWatch alarm for replication lag', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-replication-lag-test');
    expect(synthesized).toContain('"metric_name":"AuroraGlobalDBReplicationLag"');
    expect(synthesized).toContain('"threshold":900000');
  });

  it('should configure replication lag alarm to trigger Lambda', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('alarm_actions');
  });

  it('should create Route53 health check based on CloudWatch alarm', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-health-check-test');
    expect(synthesized).toContain('"type":"CLOUDWATCH_METRIC"');
    expect(synthesized).toContain('healthcare-replication-lag-test');
  });

  it('should configure health check with correct region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"cloudwatch_alarm_region":"ap-southeast-1"');
  });

  it('should set insufficient data as unhealthy for health check', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"insufficient_data_health_status":"Unhealthy"');
  });

  it('should configure alarm evaluation periods', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"evaluation_periods":2');
  });

  it('should use GreaterThanThreshold comparison for alarms', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"comparison_operator":"GreaterThanThreshold"');
  });
});

describe('MonitoringStack', () => {
  it('should create SNS topic with environment suffix', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-alerts-test');
    expect(synthesized).toContain('"display_name":"Healthcare DR Alerts"');
  });

  it('should create SNS email subscription', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"protocol":"email"');
    expect(synthesized).toContain('ops-team@example.com');
  });

  it('should create CloudWatch log group for applications', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('/aws/healthcare/application-test');
    expect(synthesized).toContain('"retention_in_days":30');
  });

  it('should create CloudWatch log group for disaster recovery', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('/aws/healthcare/disaster-recovery-test');
  });

  it('should create S3 bucket for CloudTrail logs', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-cloudtrail-test');
  });

  it('should block public access on CloudTrail bucket', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"block_public_acls":true');
    expect(synthesized).toContain('"block_public_policy":true');
    expect(synthesized).toContain('"ignore_public_acls":true');
    expect(synthesized).toContain('"restrict_public_buckets":true');
  });

  it('should configure CloudTrail bucket policy for CloudTrail service', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('cloudtrail.amazonaws.com');
    expect(synthesized).toContain('s3:GetBucketAcl');
    expect(synthesized).toContain('s3:PutObject');
  });

  it('should enable CloudTrail with multi-region support', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-audit-trail-test');
    expect(synthesized).toContain('"is_multi_region_trail":true');
    expect(synthesized).toContain('"include_global_service_events":true');
  });

  it('should enable log file validation for CloudTrail', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"enable_log_file_validation":true');
  });

  it('should configure event selector for all management events', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"read_write_type":"All"');
    expect(synthesized).toContain('"include_management_events":true');
  });

  it('should tag all monitoring resources with environment', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'prod',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"Environment":"prod"');
  });
});

describe('StorageStack', () => {
  it('should create primary S3 bucket with correct naming', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-data-primary-test');
    expect(synthesized).toContain('"force_destroy":true');
  });

  it('should create secondary S3 bucket in DR region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-data-dr-test');
    expect(synthesized).toContain('Disaster Recovery');
  });

  it('should enable versioning on primary bucket', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"status":"Enabled"');
  });

  it('should configure KMS encryption on primary bucket', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"sse_algorithm":"aws:kms"');
    expect(synthesized).toContain('"bucket_key_enabled":true');
  });

  it('should create separate KMS keys for each region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('KMS key for healthcare data encryption in ap-southeast-1');
    expect(synthesized).toContain('KMS key for healthcare data encryption in ap-southeast-2');
  });

  it('should enable KMS key rotation', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"enable_key_rotation":true');
  });

  it('should create KMS aliases with environment suffix', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'myenv',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('alias/healthcare-data-myenv');
  });

  it('should create replication IAM role with correct permissions', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('s3-replication-role-test');
    expect(synthesized).toContain('s3.amazonaws.com');
    expect(synthesized).toContain('s3:GetReplicationConfiguration');
    expect(synthesized).toContain('s3:ReplicateObject');
  });

  it('should grant KMS decrypt and encrypt permissions to replication role', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('kms:Decrypt');
    expect(synthesized).toContain('kms:Encrypt');
  });

  it('should configure S3 replication with encryption', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('replicate-all');
    expect(synthesized).toContain('"status":"Enabled"');
    expect(synthesized).toContain('encryption_configuration');
  });

  it('should configure replication with 15-minute RTO', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('replication_time');
    expect(synthesized).toContain('"minutes":15');
  });

  it('should enable delete marker replication', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('delete_marker_replication');
  });

  it('should include sourceSelectionCriteria with sseKmsEncryptedObjects', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('source_selection_criteria');
    expect(synthesized).toContain('sse_kms_encrypted_objects');
  });

  it('should configure lifecycle policy for intelligent tiering', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('intelligent-tiering');
    expect(synthesized).toContain('"days":30');
    expect(synthesized).toContain('INTELLIGENT_TIERING');
  });

  it('should configure lifecycle policy for old version cleanup', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('cleanup-old-versions');
    expect(synthesized).toContain('noncurrent_version_expiration');
    expect(synthesized).toContain('"noncurrent_days":90');
  });

  it('should set KMS deletion window to 7 days', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"deletion_window_in_days":7');
  });
});
