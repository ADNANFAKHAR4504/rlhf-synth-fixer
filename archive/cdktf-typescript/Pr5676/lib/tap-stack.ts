import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbParameterGroup } from '@cdktf/provider-aws/lib/db-parameter-group';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { Password } from '@cdktf/provider-random/lib/password';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface TapStackConfig {
  environmentSuffix: string;
  stateBucket: string;
  stateBucketRegion: string;
  awsRegion: string;
  defaultTags: {
    tags: {
      [key: string]: string;
    };
  };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    // --- S3 Backend Configuration ---
    new S3Backend(this, {
      bucket: config.stateBucket,
      key: `${config.environmentSuffix}/terraform.tfstate`,
      region: config.stateBucketRegion,
      encrypt: true,
    });

    // --- Provider Configuration ---
    new AwsProvider(this, 'aws', {
      region: config.awsRegion,
      defaultTags: [config.defaultTags],
    });

    new RandomProvider(this, 'random', {});

    // --- Environment Configuration ---
    const environmentSuffix = config.environmentSuffix;
    const resourcePrefix = `rds-prod-${environmentSuffix}`;

    // Get caller identity for IAM policies
    const caller = new DataAwsCallerIdentity(this, 'current', {});

    // --- VPC and Subnet Discovery ---
    // Discover the default VPC (will work in any AWS account)
    const vpc = new DataAwsVpc(this, 'prodVpc', {
      default: true,
    });

    // Discover subnets for RDS deployment (use all available subnets in the VPC)
    const privateSubnets = new DataAwsSubnets(this, 'privateSubnets', {
      filter: [
        {
          name: 'vpc-id',
          values: [vpc.id],
        },
      ],
    });

    // --- KMS Key for Encryption ---
    const kmsKey = new KmsKey(this, 'rdsKmsKey', {
      description: `KMS key for RDS encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${caller.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow RDS to use the key',
            Effect: 'Allow',
            Principal: {
              Service: 'rds.amazonaws.com',
            },
            Action: ['kms:Decrypt', 'kms:DescribeKey', 'kms:CreateGrant'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${resourcePrefix}-kms-key`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // --- Database Credentials in Secrets Manager ---
    const dbPassword = new Password(this, 'dbPassword', {
      length: 32,
      special: true,
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
    });

    const dbSecret = new SecretsmanagerSecret(this, 'dbCredentials', {
      name: `${resourcePrefix}-db-cred`,
      description: 'RDS PostgreSQL production database credentials',
      kmsKeyId: kmsKey.id,
      tags: {
        Name: `${resourcePrefix}-db-secret`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Store database credentials in Secrets Manager
    new SecretsmanagerSecretVersion(this, 'dbCredentialsVersion', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'postgres',
        password: dbPassword.result,
        engine: 'postgres',
        host: 'placeholder', // Will be updated after RDS creation
        port: 5432,
        dbname: 'production',
      }),
    });

    // Note: Secret rotation requires a Lambda function implementation
    // For now, rotation is not configured to allow the stack to deploy successfully
    // In production, implement rotation using AWS Secrets Manager rotation Lambda
    // with the SecretsmanagerSecretRotation resource and appropriate Lambda function

    // --- SNS Topic for Database Alerts ---
    const snsTopic = new SnsTopic(this, 'dbAlertsTopic', {
      name: `${resourcePrefix}-db-alerts`,
      displayName: 'RDS Production Database Alerts',
      tags: {
        Name: `${resourcePrefix}-sns-topic`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new SnsTopicSubscription(this, 'opsEmailSubscription', {
      topicArn: snsTopic.arn,
      protocol: 'email',
      endpoint: 'ops@company.com',
    });

    // --- IAM Role for Enhanced Monitoring ---
    const monitoringRole = new IamRole(this, 'rdsMonitoringRole', {
      name: `${resourcePrefix}-monitoring-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'monitoring.rds.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${resourcePrefix}-monitoring-role`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'monitoringRolePolicy', {
      role: monitoringRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
    });

    // --- RDS Security Group ---
    const rdsSg = new SecurityGroup(this, 'rdsSecurityGroup', {
      name: `${resourcePrefix}-rds-sg`,
      description: 'Security group for RDS PostgreSQL production instance',
      vpcId: vpc.id,
      tags: {
        Name: `${resourcePrefix}-rds-sg`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Allow access from application subnets using CIDR blocks
    new SecurityGroupRule(this, 'rdsIngressApp1', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.4.0/24'],
      description: 'PostgreSQL access from application subnet 1',
      securityGroupId: rdsSg.id,
    });

    new SecurityGroupRule(this, 'rdsIngressApp2', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.5.0/24'],
      description: 'PostgreSQL access from application subnet 2',
      securityGroupId: rdsSg.id,
    });

    // No egress rules needed for RDS (responses to ingress only)

    // --- DB Subnet Group ---
    const dbSubnetGroup = new DbSubnetGroup(this, 'rdsSubnetGroup', {
      name: `${resourcePrefix}-subnet-group`,
      description: 'Subnet group for RDS PostgreSQL production instance',
      subnetIds: privateSubnets.ids,
      tags: {
        Name: `${resourcePrefix}-subnet-group`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // --- DB Parameter Group ---
    const dbParameterGroup = new DbParameterGroup(this, 'rdsParameterGroup', {
      name: `${resourcePrefix}-pg14-params`,
      family: 'postgres14',
      description:
        'Custom parameter group for PostgreSQL 14 production instance',
      parameter: [
        {
          name: 'shared_preload_libraries',
          value: 'pg_stat_statements',
        },
        {
          name: 'log_statement',
          value: 'all',
        },
        {
          name: 'log_min_duration_statement',
          value: '1000', // Log queries taking more than 1 second
        },
      ],
      tags: {
        Name: `${resourcePrefix}-parameter-group`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // --- RDS PostgreSQL Instance ---
    const dbInstance = new DbInstance(this, 'rdsInstance', {
      identifier: `${resourcePrefix}-postgres`,
      engine: 'postgres',
      engineVersion: '14.15',
      instanceClass: 'db.t3.large',
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,

      // Multi-AZ for high availability
      multiAz: true,
      availabilityZone: undefined, // Let AWS choose for Multi-AZ

      // Database configuration
      dbName: 'production',
      username: 'postgres',
      password: dbPassword.result,
      port: 5432,

      // Network configuration
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      publiclyAccessible: false,

      // Backup configuration
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00', // UTC
      maintenanceWindow: 'sun:04:00-sun:05:00', // UTC

      // Deletion protection disabled for CI/CD workflows
      deletionProtection: false,
      skipFinalSnapshot: true,

      // Parameter group
      parameterGroupName: dbParameterGroup.name,

      // Enhanced monitoring
      monitoringInterval: 60,
      monitoringRoleArn: monitoringRole.arn,
      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],

      // Performance Insights
      performanceInsightsEnabled: true,
      performanceInsightsKmsKeyId: kmsKey.arn,
      performanceInsightsRetentionPeriod: 7,

      // Auto minor version upgrade
      autoMinorVersionUpgrade: true,

      // Copy tags to snapshots
      copyTagsToSnapshot: true,

      tags: {
        Name: `${resourcePrefix}-postgres`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // --- CloudWatch Alarms ---

    // CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'cpuAlarm', {
      alarmName: `${resourcePrefix}-cpu-utilization`,
      alarmDescription: 'Alarm when CPU exceeds 80%',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        DBInstanceIdentifier: dbInstance.identifier,
      },
      alarmActions: [snsTopic.arn],
      okActions: [snsTopic.arn],
      tags: {
        Name: `${resourcePrefix}-cpu-alarm`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Free Storage Space Alarm
    new CloudwatchMetricAlarm(this, 'storageAlarm', {
      alarmName: `${resourcePrefix}-free-storage-space`,
      alarmDescription: 'Alarm when free storage space is less than 10GB',
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 1,
      metricName: 'FreeStorageSpace',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 10737418240, // 10GB in bytes
      dimensions: {
        DBInstanceIdentifier: dbInstance.identifier,
      },
      alarmActions: [snsTopic.arn],
      okActions: [snsTopic.arn],
      tags: {
        Name: `${resourcePrefix}-storage-alarm`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Database Connections Alarm (90% of max connections)
    // db.t3.large default max_connections for PostgreSQL is approximately 135
    new CloudwatchMetricAlarm(this, 'connectionsAlarm', {
      alarmName: `${resourcePrefix}-database-connections`,
      alarmDescription: 'Alarm when database connections exceed 90% of maximum',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 121, // ~90% of 135 max connections
      dimensions: {
        DBInstanceIdentifier: dbInstance.identifier,
      },
      alarmActions: [snsTopic.arn],
      okActions: [snsTopic.arn],
      tags: {
        Name: `${resourcePrefix}-connections-alarm`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // --- Stack Outputs ---
    new TerraformOutput(this, 'dbEndpoint', {
      value: dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'dbAddress', {
      value: dbInstance.address,
      description: 'RDS instance address',
    });

    new TerraformOutput(this, 'dbPort', {
      value: dbInstance.port.toString(),
      description: 'RDS instance port',
    });

    new TerraformOutput(this, 'dbSecretArn', {
      value: dbSecret.arn,
      description:
        'ARN of the Secrets Manager secret containing database credentials',
    });

    new TerraformOutput(this, 'snsTopicArn', {
      value: snsTopic.arn,
      description: 'ARN of the SNS topic for database alerts',
    });

    new TerraformOutput(this, 'dbInstanceId', {
      value: dbInstance.identifier,
      description: 'RDS instance identifier',
    });

    new TerraformOutput(this, 'dbSecurityGroupId', {
      value: rdsSg.id,
      description: 'Security group ID for RDS instance',
    });

    new TerraformOutput(this, 'environmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix for resource identification',
    });
  }
}
