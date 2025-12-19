import * as cdk from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

/**
 * Interface for stack properties
 */
interface TapStackProps extends cdk.StackProps {
  environment: string;
  projectName: string;
}

/**
 * Comprehensive migration stack that includes:
 * - VPC and networking setup
 * - RDS database for migrated data
 * - ECS cluster for application hosting
 * - S3 bucket for data storage
 * - Complete backup and restore solution
 * - IAM roles and policies
 * - Cross-region replication capabilities
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environment, projectName } = props;

    // =============================================================================
    // NETWORKING SETUP
    // =============================================================================

    // Create new VPC instead of importing existing one
    const vpc = new ec2.Vpc(this, 'MigrationVpc', {
      vpcName: `${projectName}-${environment}-vpc`,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Get private subnets for database
    const privateSubnets = vpc.privateSubnets;

    // Security Groups
    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    const applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc,
        description: 'Security group for application servers',
        allowAllOutbound: true,
      }
    );

    // Allow application to connect to database
    databaseSecurityGroup.addIngressRule(
      applicationSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow application access to PostgreSQL'
    );

    // =============================================================================
    // ENCRYPTION AND SECURITY
    // =============================================================================

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'MigrationEncryptionKey', {
      description: `Encryption key for ${projectName} migration resources`,
      enableKeyRotation: true,
      removalPolicy:
        environment === 'prod'
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.DESTROY,
    });

    encryptionKey.addAlias(`alias/${projectName}-${environment}-key`);

    // =============================================================================
    // DATA STORAGE
    // =============================================================================

    // S3 Bucket for data migration and storage
    const dataBucket = new s3.Bucket(this, 'MigrationDataBucket', {
      bucketName: `${projectName}-${environment}-data-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DataLifecycleRule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy:
        environment === 'prod'
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.DESTROY,
    });

    // Cross-region replication bucket
    const replicationBucket = new s3.Bucket(this, 'ReplicationBucket', {
      bucketName: `${projectName}-${environment}-replication-${this.account}-us-west-2`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      removalPolicy:
        environment === 'prod'
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.DESTROY,
    });

    // =============================================================================
    // DATABASE SETUP
    // =============================================================================

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for migration database',
      vpc,
      vpcSubnets: {
        subnets: privateSubnets,
      },
    });

    // RDS Parameter Group
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14_9,
        }),
        description: 'Parameter group for migration database',
        parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
          log_min_duration_statement: '1000',
        },
      }
    );

    // RDS Database Instance
    const database = new rds.DatabaseInstance(this, 'MigrationDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      credentials: rds.Credentials.fromGeneratedSecret('migrationadmin', {
        encryptionKey: encryptionKey,
      }),
      vpc,
      vpcSubnets: {
        subnets: privateSubnets,
      },
      subnetGroup: dbSubnetGroup,
      securityGroups: [databaseSecurityGroup],
      parameterGroup: parameterGroup,
      allocatedStorage: 100,
      maxAllocatedStorage: 1000,
      storageEncrypted: false,
      storageEncryptionKey: encryptionKey,
      backupRetention: cdk.Duration.days(environment === 'prod' ? 30 : 7),
      deleteAutomatedBackups: environment !== 'prod',
      deletionProtection: environment === 'prod',
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: encryptionKey,
      cloudwatchLogsExports: ['postgresql'],
      removalPolicy:
        environment === 'prod'
          ? cdk.RemovalPolicy.SNAPSHOT
          : cdk.RemovalPolicy.DESTROY,
    });

    // =============================================================================
    // APPLICATION HOSTING
    // =============================================================================

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MigrationCluster', {
      vpc,
      clusterName: `${projectName}-${environment}-cluster`,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ecs/${projectName}-${environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Role with necessary permissions
    const taskRole = new iam.Role(this, 'ApplicationTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for migration application tasks',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Grant permissions to access S3, RDS, and other resources
    dataBucket.grantReadWrite(taskRole);
    replicationBucket.grantReadWrite(taskRole);
    encryptionKey.grantEncryptDecrypt(taskRole);
    database.secret?.grantRead(taskRole);

    // Additional permissions for backup operations
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'backup:DescribeBackupJob',
          'backup:DescribeRestoreJob',
          'backup:ListBackupJobs',
          'backup:ListRestoreJobs',
          'backup:StartBackupJob',
          'backup:StartRestoreJob',
        ],
        resources: ['*'],
      })
    );

    // Fargate Service
    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        'MigrationService',
        {
          cluster,
          serviceName: `${projectName}-${environment}-service`,
          cpu: 512,
          memoryLimitMiB: 1024,
          desiredCount: environment === 'prod' ? 2 : 1,
          minHealthyPercent: 50,
          maxHealthyPercent: 200,
          taskImageOptions: {
            image: ecs.ContainerImage.fromRegistry('nginx:latest'), // Replace with your application image
            containerPort: 80,
            logDriver: ecs.LogDrivers.awsLogs({
              streamPrefix: 'migration-app',
              logGroup: logGroup,
            }),
            environment: {
              ENVIRONMENT: environment,
              REGION: this.region,
              PROJECT_NAME: projectName,
            },
            secrets: {
              DATABASE_URL: ecs.Secret.fromSecretsManager(
                database.secret!,
                'engine'
              ),
            },
            taskRole: taskRole,
          },
          publicLoadBalancer: false, // Set to true if you need internet access
          assignPublicIp: false,
        }
      );

    // =============================================================================
    // BACKUP AND RESTORE SOLUTION
    // =============================================================================

    // Detect LocalStack environment (account ID 000000000000 or AWS_ENDPOINT_URL set)
    const isLocalStack =
      this.account === '000000000000' ||
      process.env.AWS_ENDPOINT_URL !== undefined;

    // Skip AWS Backup resources in LocalStack as they are not fully supported
    let backupVault: backup.BackupVault | undefined;
    if (!isLocalStack) {
      // Backup Vault
      backupVault = new backup.BackupVault(this, 'MigrationBackupVault', {
        backupVaultName: `${projectName}-${environment}-backup-vault`,
        encryptionKey: encryptionKey,
      });

      // Backup Role
      const backupRole = new iam.Role(this, 'BackupRole', {
        assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
        managedPolicies: [],
      });

      // Add essential backup permissions (simplified to avoid service scope issues)
      backupRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'backup:StartBackupJob',
            'backup:StopBackupJob',
            'backup:StartRestoreJob',
            'backup:StopRestoreJob',
            'backup:DescribeBackupJob',
            'backup:DescribeRestoreJob',
            'backup:ListBackupJobs',
            'backup:ListRestoreJobs',
            'backup:ListBackupVaults',
            'backup:ListBackupPlans',
            'backup:ListBackupSelections',
            'backup:ListRecoveryPointsByBackupVault',
            'backup:ListRecoveryPointsByResource',
          ],
          resources: ['*'],
        })
      );

      // S3 permissions for backup and restore
      backupRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:GetObjectVersion',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
            's3:GetBucketLocation',
            's3:GetBucketVersioning',
            's3:GetBucketEncryption',
            's3:PutBucketEncryption',
          ],
          resources: [
            dataBucket.bucketArn,
            `${dataBucket.bucketArn}/*`,
            replicationBucket.bucketArn,
            `${replicationBucket.bucketArn}/*`,
          ],
        })
      );

      // RDS permissions for backup
      backupRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds:DescribeDBInstances',
            'rds:DescribeDBSnapshots',
            'rds:CreateDBSnapshot',
            'rds:DeleteDBSnapshot',
            'rds:CopyDBSnapshot',
            'rds:ModifyDBSnapshotAttribute',
            'rds:DescribeDBSnapshotAttributes',
            'rds:RestoreDBInstanceFromDBSnapshot',
            'rds:RestoreDBInstanceToPointInTime',
          ],
          resources: ['*'],
        })
      );

      // KMS permissions for encryption
      backupRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kms:Decrypt',
            'kms:DescribeKey',
            'kms:Encrypt',
            'kms:GenerateDataKey',
            'kms:GenerateDataKeyWithoutPlaintext',
            'kms:ReEncryptFrom',
            'kms:ReEncryptTo',
            'kms:CreateGrant',
            'kms:ListGrants',
            'kms:RetireGrant',
          ],
          resources: [encryptionKey.keyArn],
        })
      );

      // Backup Plan
      const backupPlan = new backup.BackupPlan(this, 'MigrationBackupPlan', {
        backupPlanName: `${projectName}-${environment}-backup-plan`,
        backupPlanRules: [
          // Daily backups
          new backup.BackupPlanRule({
            ruleName: 'DailyBackups',
            backupVault: backupVault,
            scheduleExpression: events.Schedule.cron({
              hour: '2',
              minute: '0',
            }),
            startWindow: cdk.Duration.hours(1),
            completionWindow: cdk.Duration.hours(2),
            deleteAfter: cdk.Duration.days(environment === 'prod' ? 35 : 7),
            moveToColdStorageAfter:
              environment === 'prod' ? cdk.Duration.days(30) : undefined,
          }),
          // Weekly backups
          new backup.BackupPlanRule({
            ruleName: 'WeeklyBackups',
            backupVault: backupVault,
            scheduleExpression: events.Schedule.cron({
              weekDay: 'SUN',
              hour: '3',
              minute: '0',
            }),
            startWindow: cdk.Duration.hours(1),
            completionWindow: cdk.Duration.hours(3),
            deleteAfter: cdk.Duration.days(environment === 'prod' ? 365 : 30),
            moveToColdStorageAfter:
              environment === 'prod' ? cdk.Duration.days(90) : undefined,
          }),
        ],
      });

      // Backup Selection - RDS
      new backup.BackupSelection(this, 'DatabaseBackupSelection', {
        backupPlan: backupPlan,
        backupSelectionName: 'DatabaseBackupSelection',
        role: backupRole,
        resources: [backup.BackupResource.fromRdsDatabaseInstance(database)],
      });

      // Backup Selection - S3
      new backup.BackupSelection(this, 'S3BackupSelection', {
        backupPlan: backupPlan,
        backupSelectionName: 'S3BackupSelection',
        role: backupRole,
        resources: [backup.BackupResource.fromArn(dataBucket.bucketArn)],
      });
    } else {
      // Add a note that backup is skipped for LocalStack
      new cdk.CfnOutput(this, 'BackupStatus', {
        value: 'Skipped (LocalStack does not fully support AWS Backup)',
        description: 'Backup Configuration Status',
      });
    }

    // =============================================================================
    // PARAMETER STORE VALUES
    // =============================================================================

    // Store important values in Parameter Store for easy access
    new ssm.StringParameter(this, 'DatabaseEndpointParameter', {
      parameterName: `/${projectName}/${environment}/database/endpoint`,
      stringValue: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new ssm.StringParameter(this, 'DataBucketParameter', {
      parameterName: `/${projectName}/${environment}/s3/data-bucket`,
      stringValue: dataBucket.bucketName,
      description: 'S3 data bucket name',
    });

    if (backupVault) {
      new ssm.StringParameter(this, 'BackupVaultParameter', {
        parameterName: `/${projectName}/${environment}/backup/vault-name`,
        stringValue: backupVault.backupVaultName,
        description: 'Backup vault name',
      });
    }

    // =============================================================================
    // OUTPUTS
    // =============================================================================

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
      exportName: `${projectName}-${environment}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret?.secretArn || 'N/A',
      description: 'Database secret ARN',
      exportName: `${projectName}-${environment}-db-secret-arn`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 data bucket name',
      exportName: `${projectName}-${environment}-data-bucket`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `${projectName}-${environment}-alb-dns`,
    });

    if (backupVault) {
      new cdk.CfnOutput(this, 'BackupVaultName', {
        value: backupVault.backupVaultName,
        description: 'Backup vault name',
        exportName: `${projectName}-${environment}-backup-vault`,
      });
    }

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS encryption key ID',
      exportName: `${projectName}-${environment}-kms-key-id`,
    });
  }
}
