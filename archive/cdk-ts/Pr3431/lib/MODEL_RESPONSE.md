# RDS MySQL Infrastructure with RDS Proxy and AWS Backup

Here's the complete CDK TypeScript implementation for your production-grade RDS MySQL database deployment with advanced connection management and centralized backup capabilities.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // VPC Configuration
    const vpc = new ec2.Vpc(this, `VPC-${environmentSuffix}`, {
      vpcName: `startup-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.4.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
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
      ],
    });

    // Application Security Group (for EC2/Lambda that will connect to RDS)
    const appSecurityGroup = new ec2.SecurityGroup(
      this,
      `AppSG-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for application tier',
        securityGroupName: `app-sg-${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // RDS Security Group
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RDSSG-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS MySQL database',
        securityGroupName: `rds-mysql-sg-${environmentSuffix}`,
        allowAllOutbound: false,
      }
    );

    // RDS Proxy Security Group
    const rdsProxySecurityGroup = new ec2.SecurityGroup(
      this,
      `RDSProxySG-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS Proxy',
        securityGroupName: `rds-proxy-sg-${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Allow MySQL traffic from RDS Proxy to RDS
    rdsSecurityGroup.addIngressRule(
      rdsProxySecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from RDS Proxy'
    );

    // Allow MySQL traffic from application to RDS Proxy
    rdsProxySecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from application tier'
    );

    // KMS Key for RDS Encryption
    const rdsKmsKey = new kms.Key(this, `RDSKMSKey-${environmentSuffix}`, {
      description: `KMS key for RDS MySQL encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      alias: `alias/rds-mysql-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS Key for Backup Vault Encryption
    const backupKmsKey = new kms.Key(this, `BackupKMSKey-${environmentSuffix}`, {
      description: `KMS key for AWS Backup vault encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      alias: `alias/backup-vault-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DBSubnetGroup-${environmentSuffix}`,
      {
        description: `Subnet group for RDS MySQL database - ${environmentSuffix}`,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Parameter Group for MySQL 8.0
    const parameterGroup = new rds.ParameterGroup(
      this,
      `MySQLParams-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_37,
        }),
        description: `Custom parameter group for MySQL 8.0 - ${environmentSuffix}`,
        parameters: {
          slow_query_log: '1',
          long_query_time: '2',
          general_log: '0',
          log_bin_trust_function_creators: '1',
        },
      }
    );

    // Enhanced Monitoring Role
    const monitoringRole = new iam.Role(
      this,
      `RDSMonitoringRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonRDSEnhancedMonitoringRole'
          ),
        ],
      }
    );

    // RDS MySQL Instance
    const database = new rds.DatabaseInstance(
      this,
      `MySQLDB-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_37,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [rdsSecurityGroup],
        subnetGroup: dbSubnetGroup,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: rds.StorageType.GP3,
        storageEncrypted: true,
        storageEncryptionKey: rdsKmsKey,
        multiAz: true,
        autoMinorVersionUpgrade: true,
        backupRetention: cdk.Duration.days(7),
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        parameterGroup: parameterGroup,
        enablePerformanceInsights: false,
        monitoringInterval: cdk.Duration.seconds(60),
        monitoringRole: monitoringRole,
        iamAuthentication: true,
        cloudwatchLogsExports: ['error', 'general', 'slowquery'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_WEEK,
        databaseName: 'customerprofiles',
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `rds-mysql-secret-${environmentSuffix}`,
        }),
      }
    );

    // RDS Proxy
    const dbProxy = new rds.DatabaseProxy(this, `RDSProxy-${environmentSuffix}`, {
      proxyTarget: rds.ProxyTarget.fromInstance(database),
      secrets: [database.secret!],
      vpc,
      dbProxyName: `rds-proxy-${environmentSuffix}`,
      debugLogging: true,
      engineFamily: rds.DatabaseProxyEngine.MYSQL,
      maxConnectionsPercent: 100,
      maxIdleConnectionsPercent: 50,
      borrowTimeout: cdk.Duration.seconds(30),
      sessionPinningFilters: [],
      requireTLS: true,
      iamAuth: true,
      securityGroups: [rdsProxySecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Grant connect permissions to the proxy
    dbProxy.grantConnect(appSecurityGroup);

    // AWS Backup Vault
    const backupVault = new backup.BackupVault(this, `BackupVault-${environmentSuffix}`, {
      backupVaultName: `rds-backup-vault-${environmentSuffix}`,
      encryptionKey: backupKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Backup Plan
    const backupPlan = new backup.BackupPlan(this, `BackupPlan-${environmentSuffix}`, {
      backupPlanName: `rds-backup-plan-${environmentSuffix}`,
      backupVault: backupVault,
      backupPlanRules: [
        // Daily backups with 30-day retention
        new backup.BackupPlanRule({
          ruleName: 'DailyBackup',
          scheduleExpression: cdk.Schedule.cron({
            hour: '2',
            minute: '0',
          }),
          deleteAfter: cdk.Duration.days(30),
          moveToColdStorageAfter: cdk.Duration.days(7),
          startWindow: cdk.Duration.hours(1),
          completionWindow: cdk.Duration.hours(2),
        }),
        // Weekly backups with 90-day retention
        new backup.BackupPlanRule({
          ruleName: 'WeeklyBackup',
          scheduleExpression: cdk.Schedule.cron({
            hour: '3',
            minute: '0',
            weekDay: 'SUN',
          }),
          deleteAfter: cdk.Duration.days(90),
          moveToColdStorageAfter: cdk.Duration.days(30),
          startWindow: cdk.Duration.hours(1),
          completionWindow: cdk.Duration.hours(3),
        }),
        // Monthly backups with 365-day retention
        new backup.BackupPlanRule({
          ruleName: 'MonthlyBackup',
          scheduleExpression: cdk.Schedule.cron({
            hour: '4',
            minute: '0',
            day: '1',
          }),
          deleteAfter: cdk.Duration.days(365),
          moveToColdStorageAfter: cdk.Duration.days(90),
          startWindow: cdk.Duration.hours(1),
          completionWindow: cdk.Duration.hours(4),
        }),
      ],
    });

    // Add RDS instance to backup plan
    backupPlan.addSelection('RDSBackupSelection', {
      resources: [backup.BackupResource.fromRdsDatabaseInstance(database)],
      backupSelectionName: `rds-backup-selection-${environmentSuffix}`,
    });

    // SNS Topic for Alarms
    const alarmTopic = new sns.Topic(
      this,
      `RDSAlarmTopic-${environmentSuffix}`,
      {
        topicName: `rds-alarms-${environmentSuffix}`,
        displayName: `RDS MySQL Alarms - ${environmentSuffix}`,
      }
    );

    // Add email subscription (replace with actual email)
    if (process.env.ALARM_EMAIL) {
      alarmTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(process.env.ALARM_EMAIL)
      );
    }

    // CloudWatch Alarms for RDS
    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `CPUAlarm-${environmentSuffix}`,
      {
        metric: database.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: `RDS CPU utilization is too high - ${environmentSuffix}`,
      }
    );
    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const storageAlarm = new cloudwatch.Alarm(
      this,
      `StorageAlarm-${environmentSuffix}`,
      {
        metric: database.metricFreeStorageSpace(),
        threshold: 2 * 1024 * 1024 * 1024,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: `RDS free storage space is low - ${environmentSuffix}`,
      }
    );
    storageAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const connectionAlarm = new cloudwatch.Alarm(
      this,
      `ConnectionAlarm-${environmentSuffix}`,
      {
        metric: database.metricDatabaseConnections(),
        threshold: 50,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.IGNORE,
        alarmDescription: `RDS connection count is high - ${environmentSuffix}`,
      }
    );
    connectionAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // CloudWatch Alarms for RDS Proxy
    const proxyConnectionAlarm = new cloudwatch.Alarm(
      this,
      `ProxyConnectionAlarm-${environmentSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnectionsCurrentlyBorrowed',
          dimensionsMap: {
            DBProxyName: dbProxy.dbProxyName,
          },
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.IGNORE,
        alarmDescription: `RDS Proxy borrowed connections high - ${environmentSuffix}`,
      }
    );
    proxyConnectionAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `RDSDashboard-${environmentSuffix}`,
      {
        dashboardName: `rds-mysql-dashboard-${environmentSuffix}`,
      }
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CPU Utilization',
        left: [database.metricCPUUtilization()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [database.metricDatabaseConnections()],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Free Storage Space',
        left: [database.metricFreeStorageSpace()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Proxy Connections',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnectionsCurrentlyBorrowed',
            dimensionsMap: {
              DBProxyName: dbProxy.dbProxyName,
            },
          }),
        ],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Read/Write IOPS',
        left: [database.metricReadIOPS()],
        right: [database.metricWriteIOPS()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Proxy Client Connections',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'ClientConnections',
            dimensionsMap: {
              DBProxyName: dbProxy.dbProxyName,
            },
          }),
        ],
        width: 12,
      })
    );

    // IAM Policy for Database Access through Proxy
    const dbAccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rds-db:connect'],
      resources: [
        `arn:aws:rds-db:${this.region}:${this.account}:dbuser:${database.instanceResourceId}/*`,
        `arn:aws:rds-db:${this.region}:${this.account}:dbuser:${dbProxy.dbProxyArn.replace('arn:aws:rds:', 'prx-')}/*`,
      ],
    });

    // Sample IAM Role for application (attach to Lambda/EC2)
    const appRole = new iam.Role(this, `AppRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Application role with RDS IAM auth access - ${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });
    appRole.addToPolicy(dbAccessPolicy);

    // IAM Role for Backup Service
    const backupRole = new iam.Role(this, `BackupRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSBackupServiceRolePolicyForBackup'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSBackupServiceRolePolicyForRestores'
        ),
      ],
    });

    // Tags
    cdk.Tags.of(this).add('Project', 'CustomerProfiles');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Purpose', 'Database');

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS MySQL Endpoint',
      exportName: `rds-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseProxyEndpoint', {
      value: dbProxy.endpoint,
      description: 'RDS Proxy Endpoint',
      exportName: `rds-proxy-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.dbInstanceEndpointPort,
      description: 'RDS MySQL Port',
      exportName: `rds-port-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret!.secretArn,
      description: 'Secret ARN for database credentials',
      exportName: `rds-secret-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseResourceId', {
      value: database.instanceResourceId!,
      description: 'Database Resource ID for IAM authentication',
      exportName: `rds-resource-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ProxyArn', {
      value: dbProxy.dbProxyArn,
      description: 'RDS Proxy ARN',
      exportName: `rds-proxy-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupVaultArn', {
      value: backupVault.backupVaultArn,
      description: 'AWS Backup Vault ARN',
      exportName: `backup-vault-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupPlanId', {
      value: backupPlan.backupPlanId,
      description: 'AWS Backup Plan ID',
      exportName: `backup-plan-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AppSecurityGroupId', {
      value: appSecurityGroup.securityGroupId,
      description: 'Application Security Group ID',
      exportName: `app-sg-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AppRoleArn', {
      value: appRole.roleArn,
      description: 'Application IAM Role ARN',
      exportName: `app-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
```

This implementation includes:

1. **RDS Proxy** for connection pooling with:
   - IAM authentication support
   - TLS enforcement for secure connections
   - Connection pool configuration with max connections and idle settings
   - Integration with Secrets Manager for credential management
   - Dedicated security group for proxy traffic
   - CloudWatch metrics and alarms for proxy monitoring

2. **AWS Backup Service** with:
   - Centralized backup vault with KMS encryption
   - Multi-tier backup strategy (daily, weekly, monthly)
   - Lifecycle policies with cold storage transitions for cost optimization
   - Cross-region backup capability (can be extended)
   - Point-in-time recovery support
   - Dedicated IAM role for backup operations

The infrastructure maintains all existing features while adding these production-grade enhancements for better connection management and comprehensive backup strategies.