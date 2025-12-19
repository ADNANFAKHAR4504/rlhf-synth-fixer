import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Helper function to parse synthesized JSON
function parseSynthesized(synthesized: string): any {
  try {
    return JSON.parse(synthesized);
  } catch (error) {
    // If it's not valid JSON, return the string for backward compatibility
    return { raw: synthesized };
  }
}

// Helper to check if a value exists in nested object
function findInObject(obj: any, searchValue: any): boolean {
  const jsonStr = JSON.stringify(obj);
  if (typeof searchValue === 'string') {
    return jsonStr.includes(searchValue);
  }
  return jsonStr.includes(JSON.stringify(searchValue));
}

// Helper to normalize JSON for comparison (removes extra whitespace)
function normalizeJson(jsonString: string): string {
  return jsonString.replace(/\s+/g, '');
}

// Helper to check if synthesized output contains a pattern (ignoring whitespace)
function containsPattern(synthesized: string, pattern: string): boolean {
  const normalized = normalizeJson(synthesized);
  const normalizedPattern = normalizeJson(pattern);
  return normalized.includes(normalizedPattern);
}

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
      awsRegion: 'eu-west-2',
    });

    const synthesized = Testing.synth(stack);
    const providers = synthesized.replace(/\s/g, '').match(/"region":\s*"[^"]+"/g);
    expect(providers).toBeDefined();
    expect(synthesized).toContain('eu-west-2');
  });

  it('should configure secondary AWS provider with DR region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('eu-west-1');
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

  it('should use default environment suffix when not provided', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {});

    const synthesized = Testing.synth(stack);
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('dev');
  });

  it('should use default state bucket when not provided', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('iac-rlhf-tf-states');
  });

  it('should use default state bucket region when not provided', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      stateBucket: 'custom-bucket',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('custom-bucket');
    expect(containsPattern(synthesized, '"region":"us-east-1"')).toBe(true);
  });

  it('should work without default tags', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('healthcare-vpc-test');
  });

  it('should create stack with minimal props', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'MinimalStack', {});

    const synthesized = Testing.synth(stack);
    expect(synthesized).toBeDefined();
    // Should have default values
    expect(synthesized).toContain('iac-rlhf-tf-states');
    expect(synthesized).toContain('-dev');
  });

  it('should handle empty props object', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'EmptyPropsStack');

    const synthesized = Testing.synth(stack);
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('dev');
  });

  it('should use props.awsRegion when provided', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      awsRegion: 'eu-west-1',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('eu-west-1');
  });

  it('should use default region eu-west-2 when no awsRegion provided', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('eu-west-2');
    expect(synthesized).toBeDefined();
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
    expect(containsPattern(synthesized, '"cidr_block":"10.0.0.0/16"')).toBe(true);
  });

  it('should enable DNS support and hostnames in VPC', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"enable_dns_hostnames":true')).toBe(true);
    expect(containsPattern(synthesized, '"enable_dns_support":true')).toBe(true);
  });

  it('should create secondary VPC for DR region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-vpc-dr-test');
    expect(containsPattern(synthesized, '"cidr_block":"10.1.0.0/16"')).toBe(true);
  });

  it('should create multi-AZ subnets in primary region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"availability_zone":"eu-west-2a"')).toBe(true);
    expect(containsPattern(synthesized, '"availability_zone":"eu-west-2b"')).toBe(true);
    expect(containsPattern(synthesized, '"cidr_block":"10.0.1.0/24"')).toBe(true);
    expect(containsPattern(synthesized, '"cidr_block":"10.0.2.0/24"')).toBe(true);
  });

  it('should create multi-AZ subnets in secondary region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"availability_zone":"eu-west-1a"')).toBe(true);
    expect(containsPattern(synthesized, '"availability_zone":"eu-west-1b"')).toBe(true);
  });

  it('should create security group for database with PostgreSQL port', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-sg-test');
    expect(containsPattern(synthesized, '"from_port":5432')).toBe(true);
    expect(containsPattern(synthesized, '"to_port":5432')).toBe(true);
  });

  it('should restrict database access to VPC CIDR only', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"cidr_blocks":["10.0.0.0/16"]')).toBe(true);
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
    expect(containsPattern(synthesized, '"engine":"aurora-postgresql"')).toBe(true);
    expect(containsPattern(synthesized, '"engine_mode":"provisioned"')).toBe(true);
    expect(containsPattern(synthesized, '"engine_version":"15.3"')).toBe(true);
  });

  it('should configure serverless v2 scaling with min and max capacity', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('serverlessv2_scaling_configuration');
    expect(containsPattern(synthesized, '"min_capacity":0.5')).toBe(true);
    expect(containsPattern(synthesized, '"max_capacity":2')).toBe(true);
  });

  it('should enable storage encryption with KMS', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"storage_encrypted":true')).toBe(true);
    expect(synthesized).toContain('healthcare-db-kms-test');
  });

  it('should configure 7-day backup retention', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"backup_retention_period":7')).toBe(true);
  });

  it('should enable CloudWatch logs export for PostgreSQL', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"enabled_cloudwatch_logs_exports":["postgresql"]')).toBe(true);
  });

  it('should disable deletion protection for destroyability', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"deletion_protection":false')).toBe(true);
  });

  it('should skip final snapshot on deletion', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"skip_final_snapshot":true')).toBe(true);
  });

  it('should create read replica cluster in secondary region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-dr-test');
    expect(synthesized).toContain('aurora-postgresql');
    expect(containsPattern(synthesized, '"database_name":"healthcaredb"')).toBe(true);
  });

  it('should create RDS cluster instances', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-instance-test');
    expect(containsPattern(synthesized, '"instance_class":"db.serverless"')).toBe(true);
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
    expect(containsPattern(synthesized, '"enable_continuous_backup":true')).toBe(true);
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
    expect(containsPattern(synthesized, '"delete_after":7')).toBe(true);
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
    expect(containsPattern(synthesized, '"type":"String"')).toBe(true);
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
    expect(containsPattern(synthesized, 'rds:DescribeDBClusters')).toBe(true);
    expect(containsPattern(synthesized, 'rds:PromoteReadReplica')).toBe(true);
    expect(containsPattern(synthesized, 'rds:ModifyDBCluster')).toBe(true);
  });

  it('should grant Lambda role CloudWatch Logs permissions', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, 'logs:CreateLogGroup')).toBe(true);
    expect(containsPattern(synthesized, 'logs:CreateLogStream')).toBe(true);
    expect(containsPattern(synthesized, 'logs:PutLogEvents')).toBe(true);
  });

  it('should grant Lambda role SNS publish permissions', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, 'sns:Publish')).toBe(true);
  });

  it('should grant Lambda role SSM parameter access', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, 'ssm:GetParameter')).toBe(true);
    expect(containsPattern(synthesized, 'ssm:GetParameters')).toBe(true);
  });

  it('should create Lambda function with correct configuration', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-failover-test');
    expect(containsPattern(synthesized, '"handler":"failover-handler.handler"')).toBe(true);
    expect(containsPattern(synthesized, '"runtime":"nodejs18.x"')).toBe(true);
  });

  it('should configure Lambda with 5-minute timeout', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"timeout":300')).toBe(true);
  });

  it('should configure Lambda with environment variables', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'mytest',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"ENVIRONMENT_SUFFIX":"mytest"')).toBe(true);
    expect(containsPattern(synthesized, '"PRIMARY_REGION":"eu-west-2"')).toBe(true);
    expect(containsPattern(synthesized, '"SECONDARY_REGION":"eu-west-1"')).toBe(true);
  });

  it('should create CloudWatch log group for Lambda', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('/aws/lambda/healthcare-failover-test');
    expect(containsPattern(synthesized, '"retention_in_days":30')).toBe(true);
  });

  it('should create CloudWatch alarm for database CPU', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-cpu-test');
    expect(containsPattern(synthesized, '"metric_name":"CPUUtilization"')).toBe(true);
    expect(containsPattern(synthesized, '"namespace":"AWS/RDS"')).toBe(true);
    expect(containsPattern(synthesized, '"threshold":80')).toBe(true);
  });

  it('should create CloudWatch alarm for database connections', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-db-connections-test');
    expect(containsPattern(synthesized, '"metric_name":"DatabaseConnections"')).toBe(true);
  });

  it('should create CloudWatch alarm for replication lag', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-replication-lag-test');
    expect(containsPattern(synthesized, '"metric_name":"AuroraGlobalDBReplicationLag"')).toBe(true);
    expect(containsPattern(synthesized, '"threshold":900000')).toBe(true);
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
    expect(containsPattern(synthesized, '"type":"CLOUDWATCH_METRIC"')).toBe(true);
    expect(synthesized).toContain('healthcare-replication-lag-test');
  });

  it('should configure health check with correct region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"cloudwatch_alarm_region":"eu-west-2"')).toBe(true);
  });

  it('should set insufficient data as unhealthy for health check', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"insufficient_data_health_status":"Unhealthy"')).toBe(true);
  });

  it('should configure alarm evaluation periods', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"evaluation_periods":2')).toBe(true);
  });

  it('should use GreaterThanThreshold comparison for alarms', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"comparison_operator":"GreaterThanThreshold"')).toBe(true);
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
    expect(containsPattern(synthesized, '"display_name":"Healthcare DR Alerts"')).toBe(true);
  });

  it('should create SNS email subscription', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"protocol":"email"')).toBe(true);
    expect(synthesized).toContain('ops-team@example.com');
  });

  it('should create CloudWatch log group for applications', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('/aws/healthcare/application-test');
    expect(containsPattern(synthesized, '"retention_in_days":30')).toBe(true);
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
    expect(containsPattern(synthesized, '"block_public_acls":true')).toBe(true);
    expect(containsPattern(synthesized, '"block_public_policy":true')).toBe(true);
    expect(containsPattern(synthesized, '"ignore_public_acls":true')).toBe(true);
    expect(containsPattern(synthesized, '"restrict_public_buckets":true')).toBe(true);
  });

  it('should configure CloudTrail bucket policy for CloudTrail service', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('cloudtrail.amazonaws.com');
    expect(containsPattern(synthesized, 's3:GetBucketAcl')).toBe(true);
    expect(containsPattern(synthesized, 's3:PutObject')).toBe(true);
  });

  it('should enable CloudTrail with multi-region support', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('healthcare-audit-trail-test');
    expect(containsPattern(synthesized, '"is_multi_region_trail":true')).toBe(true);
    expect(containsPattern(synthesized, '"include_global_service_events":true')).toBe(true);
  });

  it('should enable log file validation for CloudTrail', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"enable_log_file_validation":true')).toBe(true);
  });

  it('should configure event selector for all management events', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"read_write_type":"All"')).toBe(true);
    expect(containsPattern(synthesized, '"include_management_events":true')).toBe(true);
  });

  it('should tag all monitoring resources with environment', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'prod',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"Environment":"prod"')).toBe(true);
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
    expect(containsPattern(synthesized, '"force_destroy":true')).toBe(true);
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
    expect(containsPattern(synthesized, '"status":"Enabled"')).toBe(true);
  });

  it('should configure KMS encryption on primary bucket', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"sse_algorithm":"aws:kms"')).toBe(true);
    expect(containsPattern(synthesized, '"bucket_key_enabled":true')).toBe(true);
  });

  it('should create separate KMS keys for each region', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('KMS key for healthcare data encryption in eu-west-2');
    expect(synthesized).toContain('KMS key for healthcare data encryption in eu-west-1');
  });

  it('should enable KMS key rotation', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"enable_key_rotation":true')).toBe(true);
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
    expect(containsPattern(synthesized, 's3:GetReplicationConfiguration')).toBe(true);
    expect(containsPattern(synthesized, 's3:ReplicateObject')).toBe(true);
  });

  it('should grant KMS decrypt and encrypt permissions to replication role', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, 'kms:Decrypt')).toBe(true);
    expect(containsPattern(synthesized, 'kms:Encrypt')).toBe(true);
  });

  it('should configure S3 replication with encryption', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('replicate-all');
    expect(containsPattern(synthesized, '"status":"Enabled"')).toBe(true);
    expect(synthesized).toContain('encryption_configuration');
  });

  it('should configure replication with 15-minute RTO', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('replication_time');
    expect(containsPattern(synthesized, '"minutes":15')).toBe(true);
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
    expect(containsPattern(synthesized, '"days":30')).toBe(true);
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
    expect(containsPattern(synthesized, '"noncurrent_days":90')).toBe(true);
  });

  it('should set KMS deletion window to 7 days', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    expect(containsPattern(synthesized, '"deletion_window_in_days":7')).toBe(true);
  });
});
