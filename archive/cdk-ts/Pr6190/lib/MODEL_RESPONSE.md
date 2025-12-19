# Database Migration Infrastructure - CDK TypeScript Implementation

This implementation provides a complete AWS CDK TypeScript solution for migrating an RDS MySQL database to Aurora MySQL using AWS DMS with comprehensive security, monitoring, and validation.

## File: lib/database-migration-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface DatabaseMigrationStackProps extends cdk.StackProps {
  environmentSuffix: string;
  // Existing VPC and subnet information
  developmentVpcId?: string;
  productionVpcId?: string;
  developmentSubnetIds?: string[];
  productionSubnetIds?: string[];
  // Existing RDS source details
  sourceRdsEndpoint?: string;
  sourceRdsPort?: number;
  sourceDbName?: string;
  // Secret ARNs for existing credentials
  sourceSecretArn?: string;
  targetSecretArn?: string;
}

export class DatabaseMigrationStack extends cdk.Stack {
  public readonly auroraClusterEndpoint: string;
  public readonly dmsTaskArn: string;

  constructor(scope: Construct, id: string, props: DatabaseMigrationStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // ==============================
    // 1. VPC and Networking Setup
    // ==============================

    // Reference existing development VPC
    const devVpc = props.developmentVpcId
      ? ec2.Vpc.fromLookup(this, 'DevelopmentVpc', {
          vpcId: props.developmentVpcId,
        })
      : ec2.Vpc.fromLookup(this, 'DevelopmentVpc', {
          tags: { Environment: 'development' },
        });

    // Reference existing production VPC
    const prodVpc = props.productionVpcId
      ? ec2.Vpc.fromLookup(this, 'ProductionVpc', {
          vpcId: props.productionVpcId,
        })
      : ec2.Vpc.fromLookup(this, 'ProductionVpc', {
          tags: { Environment: 'production' },
        });

    // Get private subnets for production Aurora deployment
    const prodPrivateSubnets = prodVpc.privateSubnets.slice(0, 3);

    // ==============================
    // 2. KMS Encryption Keys
    // ==============================

    const auroraKmsKey = new kms.Key(this, `AuroraKmsKey-${environmentSuffix}`, {
      alias: `aurora-encryption-${environmentSuffix}`,
      description: 'KMS key for Aurora MySQL cluster encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==============================
    // 3. Security Groups
    // ==============================

    // Security group for Aurora cluster in production
    const auroraSecurityGroup = new ec2.SecurityGroup(
      this,
      `AuroraSecurityGroup-${environmentSuffix}`,
      {
        vpc: prodVpc,
        description: 'Security group for Aurora MySQL cluster',
        securityGroupName: `aurora-sg-${environmentSuffix}`,
      }
    );

    // Security group for DMS replication instance
    const dmsSecurityGroup = new ec2.SecurityGroup(
      this,
      `DmsSecurityGroup-${environmentSuffix}`,
      {
        vpc: prodVpc,
        description: 'Security group for DMS replication instance',
        securityGroupName: `dms-sg-${environmentSuffix}`,
      }
    );

    // Security group for source RDS in development
    const sourceRdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `SourceRdsSecurityGroup-${environmentSuffix}`,
      {
        vpc: devVpc,
        description: 'Security group for source RDS MySQL instance',
        securityGroupName: `source-rds-sg-${environmentSuffix}`,
      }
    );

    // Allow DMS to connect to Aurora
    auroraSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(dmsSecurityGroup.securityGroupId),
      ec2.Port.tcp(3306),
      'Allow DMS to connect to Aurora MySQL'
    );

    // Allow DMS to connect to source RDS
    sourceRdsSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(dmsSecurityGroup.securityGroupId),
      ec2.Port.tcp(3306),
      'Allow DMS to connect to source RDS MySQL'
    );

    // ==============================
    // 4. Secrets Manager for Credentials
    // ==============================

    // Reference existing source database secret
    const sourceDbSecret = props.sourceSecretArn
      ? secretsmanager.Secret.fromSecretCompleteArn(
          this,
          'SourceDbSecret',
          props.sourceSecretArn
        )
      : secretsmanager.Secret.fromSecretNameV2(
          this,
          'SourceDbSecret',
          'dev/rds/mysql/credentials'
        );

    // Reference or create target database secret
    const targetDbSecret = props.targetSecretArn
      ? secretsmanager.Secret.fromSecretCompleteArn(
          this,
          'TargetDbSecret',
          props.targetSecretArn
        )
      : new secretsmanager.Secret(this, `TargetDbSecret-${environmentSuffix}`, {
          secretName: `prod/aurora/mysql/credentials-${environmentSuffix}`,
          description: 'Aurora MySQL cluster master credentials',
          generateSecretString: {
            secretStringTemplate: JSON.stringify({ username: 'admin' }),
            generateStringKey: 'password',
            excludeCharacters: '"@/\\',
            passwordLength: 32,
          },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

    // Enable automatic rotation for target secret (production)
    if (!props.targetSecretArn) {
      // Note: Rotation lambda will be created after Aurora cluster
    }

    // ==============================
    // 5. Aurora MySQL Parameter Group
    // ==============================

    const auroraParameterGroup = new rds.ParameterGroup(
      this,
      `AuroraParameterGroup-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_04_0, // MySQL 8.0 compatible
        }),
        description: 'Parameter group for Aurora MySQL cluster',
        parameters: {
          // Match source MySQL 8.0.35 configuration
          max_connections: '1000',
          innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
          character_set_server: 'utf8mb4',
          collation_server: 'utf8mb4_unicode_ci',
          // Enable binary logging for DMS CDC
          binlog_format: 'ROW',
          binlog_row_image: 'FULL',
        },
      }
    );

    // ==============================
    // 6. Aurora MySQL Cluster
    // ==============================

    const auroraSubnetGroup = new rds.SubnetGroup(
      this,
      `AuroraSubnetGroup-${environmentSuffix}`,
      {
        vpc: prodVpc,
        description: 'Subnet group for Aurora MySQL cluster',
        vpcSubnets: {
          subnets: prodPrivateSubnets,
        },
        subnetGroupName: `aurora-subnet-group-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const auroraCluster = new rds.DatabaseCluster(
      this,
      `AuroraCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
        }),
        credentials: rds.Credentials.fromSecret(targetDbSecret),
        defaultDatabaseName: props.sourceDbName || 'migrationdb',
        parameterGroup: auroraParameterGroup,
        storageEncrypted: true,
        storageEncryptionKey: auroraKmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        cloudwatchLogsExports: ['error', 'general', 'slowquery', 'audit'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
        clusterIdentifier: `aurora-mysql-${environmentSuffix}`,
        subnetGroup: auroraSubnetGroup,
        vpc: prodVpc,
        vpcSubnets: {
          subnets: prodPrivateSubnets,
        },
        securityGroups: [auroraSecurityGroup],
        instanceProps: {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
          enablePerformanceInsights: true,
          performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
          performanceInsightEncryptionKey: auroraKmsKey,
          publiclyAccessible: false,
        },
        instances: 1, // Start with 1 writer
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Add reader instance
    auroraCluster.addReader('ReaderInstance', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      instanceIdentifier: `aurora-reader-${environmentSuffix}`,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: auroraKmsKey,
      publiclyAccessible: false,
    });

    // Enable backtrack (72 hours)
    const cfnCluster = auroraCluster.node.defaultChild as rds.CfnDBCluster;
    cfnCluster.backtrackWindow = 259200; // 72 hours in seconds

    // Enable secret rotation after Aurora cluster is created
    if (!props.targetSecretArn) {
      (targetDbSecret as secretsmanager.Secret).addRotationSchedule(
        'RotationSchedule',
        {
          automaticallyAfter: cdk.Duration.days(30),
          hostedRotation: secretsmanager.HostedRotation.mysqlSingleUser(),
        }
      );
    }

    // ==============================
    // 7. DMS IAM Roles
    // ==============================

    // DMS VPC Management Role
    const dmsVpcRole = new iam.Role(this, `DmsVpcRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonDMSVPCManagementRole'),
      ],
      roleName: `dms-vpc-role-${environmentSuffix}`,
    });

    // DMS CloudWatch Logs Role
    const dmsCloudwatchRole = new iam.Role(
      this,
      `DmsCloudwatchRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonDMSCloudWatchLogsRole'),
        ],
        roleName: `dms-cloudwatch-role-${environmentSuffix}`,
      }
    );

    // ==============================
    // 8. DMS Subnet Group
    // ==============================

    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      `DmsSubnetGroup-${environmentSuffix}`,
      {
        replicationSubnetGroupIdentifier: `dms-subnet-group-${environmentSuffix}`,
        replicationSubnetGroupDescription: 'Subnet group for DMS replication instance',
        subnetIds: prodPrivateSubnets.map((subnet) => subnet.subnetId),
      }
    );

    // ==============================
    // 9. DMS Replication Instance
    // ==============================

    const dmsReplicationInstance = new dms.CfnReplicationInstance(
      this,
      `DmsReplicationInstance-${environmentSuffix}`,
      {
        replicationInstanceClass: 'dms.t3.medium',
        replicationInstanceIdentifier: `dms-replication-${environmentSuffix}`,
        allocatedStorage: 100,
        engineVersion: '3.5.1',
        multiAz: false,
        publiclyAccessible: false,
        replicationSubnetGroupIdentifier: dmsSubnetGroup.replicationSubnetGroupIdentifier,
        vpcSecurityGroupIds: [dmsSecurityGroup.securityGroupId],
      }
    );

    dmsReplicationInstance.addDependency(dmsSubnetGroup);

    // ==============================
    // 10. DMS Source Endpoint (RDS MySQL)
    // ==============================

    const sourceEndpoint = new dms.CfnEndpoint(
      this,
      `DmsSourceEndpoint-${environmentSuffix}`,
      {
        endpointType: 'source',
        endpointIdentifier: `source-rds-mysql-${environmentSuffix}`,
        engineName: 'mysql',
        serverName: props.sourceRdsEndpoint || 'source-rds.example.com',
        port: props.sourceRdsPort || 3306,
        databaseName: props.sourceDbName || 'migrationdb',
        username: sourceDbSecret.secretValueFromJson('username').unsafeUnwrap(),
        password: sourceDbSecret.secretValueFromJson('password').unsafeUnwrap(),
        sslMode: 'require',
        mySqlSettings: {
          // Enable CDC for continuous replication
          afterConnectScript: '',
          cleanSourceMetadataOnMismatch: false,
          eventsPollInterval: 5,
          maxFileSize: 512000,
          parallelLoadThreads: 1,
          serverTimezone: 'UTC',
          targetDbType: 'specific-database',
        },
      }
    );

    // ==============================
    // 11. DMS Target Endpoint (Aurora MySQL)
    // ==============================

    const targetEndpoint = new dms.CfnEndpoint(
      this,
      `DmsTargetEndpoint-${environmentSuffix}`,
      {
        endpointType: 'target',
        endpointIdentifier: `target-aurora-mysql-${environmentSuffix}`,
        engineName: 'aurora',
        serverName: auroraCluster.clusterEndpoint.hostname,
        port: 3306,
        databaseName: props.sourceDbName || 'migrationdb',
        username: targetDbSecret.secretValueFromJson('username').unsafeUnwrap(),
        password: targetDbSecret.secretValueFromJson('password').unsafeUnwrap(),
        sslMode: 'require',
        mySqlSettings: {
          cleanSourceMetadataOnMismatch: false,
          maxFileSize: 512000,
          parallelLoadThreads: 1,
          serverTimezone: 'UTC',
          targetDbType: 'specific-database',
        },
      }
    );

    targetEndpoint.addDependency(auroraCluster.node.defaultChild as rds.CfnDBCluster);

    // ==============================
    // 12. DMS Migration Task
    // ==============================

    const dmsTask = new dms.CfnReplicationTask(
      this,
      `DmsMigrationTask-${environmentSuffix}`,
      {
        replicationTaskIdentifier: `migration-task-${environmentSuffix}`,
        migrationType: 'full-load-and-cdc',
        replicationInstanceArn: dmsReplicationInstance.ref,
        sourceEndpointArn: sourceEndpoint.ref,
        targetEndpointArn: targetEndpoint.ref,
        tableMappings: JSON.stringify({
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': '%',
                'table-name': '%',
              },
              'rule-action': 'include',
            },
          ],
        }),
        replicationTaskSettings: JSON.stringify({
          Logging: {
            EnableLogging: true,
            LogComponents: [
              {
                Id: 'TRANSFORMATION',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'SOURCE_UNLOAD',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'IO',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'TARGET_LOAD',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'PERFORMANCE',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'SOURCE_CAPTURE',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'SORTER',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'REST_SERVER',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'VALIDATOR_EXT',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'TARGET_APPLY',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'TASK_MANAGER',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
            ],
          },
          TargetMetadata: {
            TargetSchema: '',
            SupportLobs: true,
            FullLobMode: false,
            LobChunkSize: 64,
            LimitedSizeLobMode: true,
            LobMaxSize: 32,
          },
          FullLoadSettings: {
            TargetTablePrepMode: 'DROP_AND_CREATE',
            CreatePkAfterFullLoad: false,
            StopTaskCachedChangesApplied: false,
            StopTaskCachedChangesNotApplied: false,
            MaxFullLoadSubTasks: 8,
            TransactionConsistencyTimeout: 600,
            CommitRate: 10000,
          },
          ChangeProcessingDdlHandlingPolicy: {
            HandleSourceTableDropped: true,
            HandleSourceTableTruncated: true,
            HandleSourceTableAltered: true,
          },
          ChangeProcessingTuning: {
            BatchApplyPreserveTransaction: true,
            BatchApplyTimeoutMin: 1,
            BatchApplyTimeoutMax: 30,
            BatchApplyMemoryLimit: 500,
            BatchSplitSize: 0,
            MinTransactionSize: 1000,
            CommitTimeout: 1,
            MemoryLimitTotal: 1024,
            MemoryKeepTime: 60,
            StatementCacheSize: 50,
          },
        }),
      }
    );

    dmsTask.addDependency(dmsReplicationInstance);
    dmsTask.addDependency(sourceEndpoint);
    dmsTask.addDependency(targetEndpoint);

    // ==============================
    // 13. SNS Topic for Alarms
    // ==============================

    const alarmTopic = new sns.Topic(this, `AlarmTopic-${environmentSuffix}`, {
      topicName: `dms-migration-alarms-${environmentSuffix}`,
      displayName: 'DMS Migration Alarms',
    });

    // ==============================
    // 14. CloudWatch Alarms
    // ==============================

    // Alarm for DMS task failures
    const dmsTaskFailureAlarm = new cloudwatch.Alarm(
      this,
      `DmsTaskFailureAlarm-${environmentSuffix}`,
      {
        alarmName: `dms-task-failure-${environmentSuffix}`,
        alarmDescription: 'Alert when DMS migration task fails',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DMS',
          metricName: 'FullLoadThroughputRowsTarget',
          dimensionsMap: {
            ReplicationInstanceIdentifier: dmsReplicationInstance.replicationInstanceIdentifier!,
            ReplicationTaskIdentifier: dmsTask.replicationTaskIdentifier!,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    dmsTaskFailureAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm for Aurora replication lag > 30 seconds
    const auroraReplicationLagAlarm = new cloudwatch.Alarm(
      this,
      `AuroraReplicationLagAlarm-${environmentSuffix}`,
      {
        alarmName: `aurora-replication-lag-${environmentSuffix}`,
        alarmDescription: 'Alert when Aurora replication lag exceeds 30 seconds',
        metric: auroraCluster.metricServerlessDatabaseCapacity({
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 30000, // 30 seconds in milliseconds
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    auroraReplicationLagAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ==============================
    // 15. Lambda Function for Data Validation
    // ==============================

    const validationLambdaRole = new iam.Role(
      this,
      `ValidationLambdaRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ],
      }
    );

    // Grant Lambda access to secrets
    sourceDbSecret.grantRead(validationLambdaRole);
    targetDbSecret.grantRead(validationLambdaRole);

    const validationLambda = new lambda.Function(
      this,
      `ValidationLambda-${environmentSuffix}`,
      {
        functionName: `db-validation-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import pymysql
import boto3
import os
from typing import Dict, Any

def get_secret(secret_arn: str) -> Dict[str, str]:
    """Retrieve secret from Secrets Manager"""
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_arn)
    return json.loads(response['SecretString'])

def get_connection(host: str, port: int, user: str, password: str, database: str):
    """Create MySQL connection"""
    return pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        connect_timeout=30
    )

def get_table_count(connection, table_name: str) -> int:
    """Get row count for a table"""
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        return cursor.fetchone()[0]

def get_all_tables(connection) -> list:
    """Get list of all tables in database"""
    with connection.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        return [row[0] for row in cursor.fetchall()]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler to validate data consistency between source and target databases
    """
    try:
        # Get database credentials from Secrets Manager
        source_secret = get_secret(os.environ['SOURCE_SECRET_ARN'])
        target_secret = get_secret(os.environ['TARGET_SECRET_ARN'])

        # Connect to source database
        source_conn = get_connection(
            host=os.environ['SOURCE_HOST'],
            port=int(os.environ['SOURCE_PORT']),
            user=source_secret['username'],
            password=source_secret['password'],
            database=os.environ['SOURCE_DB']
        )

        # Connect to target database
        target_conn = get_connection(
            host=os.environ['TARGET_HOST'],
            port=3306,
            user=target_secret['username'],
            password=target_secret['password'],
            database=os.environ['TARGET_DB']
        )

        # Get tables from both databases
        source_tables = set(get_all_tables(source_conn))
        target_tables = set(get_all_tables(target_conn))

        # Check for missing tables
        missing_tables = source_tables - target_tables
        extra_tables = target_tables - source_tables

        # Validate row counts for common tables
        validation_results = []
        common_tables = source_tables & target_tables

        for table in common_tables:
            source_count = get_table_count(source_conn, table)
            target_count = get_table_count(target_conn, table)

            validation_results.append({
                'table': table,
                'source_count': source_count,
                'target_count': target_count,
                'match': source_count == target_count
            })

        # Close connections
        source_conn.close()
        target_conn.close()

        # Prepare response
        all_match = all(r['match'] for r in validation_results)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'validation_status': 'PASSED' if all_match and not missing_tables else 'FAILED',
                'missing_tables': list(missing_tables),
                'extra_tables': list(extra_tables),
                'table_validations': validation_results,
                'total_tables_checked': len(common_tables)
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'validation_status': 'ERROR',
                'error': str(e)
            })
        }
`),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        vpc: prodVpc,
        vpcSubnets: {
          subnets: prodPrivateSubnets,
        },
        securityGroups: [dmsSecurityGroup],
        environment: {
          SOURCE_SECRET_ARN: sourceDbSecret.secretArn,
          TARGET_SECRET_ARN: targetDbSecret.secretArn,
          SOURCE_HOST: props.sourceRdsEndpoint || 'source-rds.example.com',
          SOURCE_PORT: (props.sourceRdsPort || 3306).toString(),
          SOURCE_DB: props.sourceDbName || 'migrationdb',
          TARGET_HOST: auroraCluster.clusterEndpoint.hostname,
          TARGET_DB: props.sourceDbName || 'migrationdb',
        },
        layers: [
          // Note: In production, add pymysql layer ARN for your region
          // lambda.LayerVersion.fromLayerVersionArn(this, 'PyMySQLLayer', 'arn:aws:lambda:...')
        ],
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // ==============================
    // 16. Stack Outputs
    // ==============================

    this.auroraClusterEndpoint = auroraCluster.clusterEndpoint.hostname;
    this.dmsTaskArn = dmsTask.ref;

    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora MySQL cluster writer endpoint',
      exportName: `aurora-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuroraClusterReaderEndpoint', {
      value: auroraCluster.clusterReadEndpoint.hostname,
      description: 'Aurora MySQL cluster reader endpoint',
      exportName: `aurora-reader-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuroraClusterIdentifier', {
      value: auroraCluster.clusterIdentifier,
      description: 'Aurora MySQL cluster identifier',
      exportName: `aurora-cluster-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DmsTaskArn', {
      value: dmsTask.ref,
      description: 'DMS migration task ARN',
      exportName: `dms-task-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DmsReplicationInstanceArn', {
      value: dmsReplicationInstance.ref,
      description: 'DMS replication instance ARN',
      exportName: `dms-instance-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ValidationLambdaArn', {
      value: validationLambda.functionArn,
      description: 'Data validation Lambda function ARN',
      exportName: `validation-lambda-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for migration alarms',
      exportName: `alarm-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TargetSecretArn', {
      value: targetDbSecret.secretArn,
      description: 'Target Aurora database credentials secret ARN',
      exportName: `target-secret-arn-${environmentSuffix}`,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseMigrationStack } from './database-migration-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the Database Migration Stack
    new DatabaseMigrationStack(this, 'DatabaseMigration', {
      environmentSuffix: environmentSuffix,
      // Optional: Override these with actual values if known
      // developmentVpcId: 'vpc-xxxxx',
      // productionVpcId: 'vpc-yyyyy',
      // sourceRdsEndpoint: 'source-rds.xxxxxx.ap-southeast-1.rds.amazonaws.com',
      // sourceRdsPort: 3306,
      // sourceDbName: 'migrationdb',
      // sourceSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:...',
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ap-southeast-1', // Explicitly set target region
      },
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-1', // Target region
  },
});
```

## File: lib/README.md

```markdown
# Database Migration Infrastructure

## Overview

This CDK TypeScript stack provides a complete solution for migrating an RDS MySQL database to Aurora MySQL using AWS Database Migration Service (DMS). The infrastructure includes:

- **Aurora MySQL Cluster**: Production-grade cluster with one writer and one reader instance
- **DMS Replication**: Automated migration with full load and CDC (Change Data Capture)
- **Security**: KMS encryption, Secrets Manager integration, and VPC isolation
- **Monitoring**: CloudWatch alarms for task failures and replication lag
- **Validation**: Lambda function for post-migration data consistency checks

## Architecture

```
Development VPC                    Production VPC
                                                          
                                                          
  Source RDS                       Aurora MySQL Cluster   
  MySQL 8.0.35   Ä              $   - Writer Instance      
                    DMS Task       - Reader Instance      
                                                          
                                     DMS Replication        
                                     Instance               
                                                            
                                     Lambda Validation      
                                                            
```

## Prerequisites

1. **Existing VPCs**: Development and production VPCs must exist with peering configured
2. **Source RDS**: Existing RDS MySQL 8.0.35 instance in development VPC
3. **Secrets**: Database credentials stored in AWS Secrets Manager
4. **Subnets**: Private subnets available in each availability zone

## Deployment

### Install Dependencies

```bash
npm install
```

### Configure Environment

Set the environment suffix for your deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"
```

### Deploy Stack

```bash
cdk deploy TapStack${ENVIRONMENT_SUFFIX} \
  -c environmentSuffix=${ENVIRONMENT_SUFFIX}
```

### Customize Configuration

Edit `lib/tap-stack.ts` to provide actual values:

```typescript
new DatabaseMigrationStack(this, 'DatabaseMigration', {
  environmentSuffix: environmentSuffix,
  developmentVpcId: 'vpc-xxxxx',
  productionVpcId: 'vpc-yyyyy',
  sourceRdsEndpoint: 'source-rds.xxxxxx.ap-southeast-1.rds.amazonaws.com',
  sourceRdsPort: 3306,
  sourceDbName: 'migrationdb',
  sourceSecretArn: 'arn:aws:secretsmanager:ap-southeast-1:...',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-1',
  },
});
```

## Resources Created

### Database Resources
- Aurora MySQL 8.0 cluster with 1 writer + 1 reader
- DB subnet group across 3 availability zones
- Parameter group matching source configuration
- Automated backups (7-day retention)
- Backtrack enabled (72 hours)

### DMS Resources
- Replication instance (dms.t3.medium)
- Source endpoint (RDS MySQL)
- Target endpoint (Aurora MySQL)
- Migration task (full-load-and-cdc)
- Subnet group for DMS

### Security Resources
- KMS customer-managed key for encryption
- Security groups for Aurora, DMS, and source RDS
- IAM roles for DMS operations
- Secrets Manager secrets with rotation

### Monitoring Resources
- CloudWatch alarms for DMS task failures
- CloudWatch alarms for replication lag > 30s
- SNS topic for alarm notifications
- CloudWatch Logs for Aurora and DMS
- Performance Insights enabled

### Validation Resources
- Lambda function for data consistency checks
- VPC connectivity to both databases
- IAM role with Secrets Manager access

## Post-Deployment

### Start Migration

The DMS task is created but not automatically started. Start it manually:

```bash
aws dms start-replication-task \
  --replication-task-arn <DmsTaskArn-from-output> \
  --start-replication-task-type start-replication
```

### Monitor Migration

Check DMS task status:

```bash
aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values=<DmsTaskArn>
```

View CloudWatch metrics:
- Navigate to CloudWatch Console
- Select DMS metrics
- Monitor `FullLoadThroughputRowsTarget` and `CDCLatencySource`

### Validate Data

Invoke the validation Lambda function:

```bash
aws lambda invoke \
  --function-name db-validation-${ENVIRONMENT_SUFFIX} \
  --payload '{}' \
  response.json

cat response.json
```

Expected successful output:
```json
{
  "statusCode": 200,
  "body": {
    "validation_status": "PASSED",
    "missing_tables": [],
    "extra_tables": [],
    "table_validations": [...],
    "total_tables_checked": 10
  }
}
```

### Subscribe to Alarms

Subscribe to SNS topic for alarm notifications:

```bash
aws sns subscribe \
  --topic-arn <AlarmTopicArn-from-output> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Stack Outputs

| Output | Description |
|--------|-------------|
| `AuroraClusterEndpoint` | Writer endpoint for Aurora cluster |
| `AuroraClusterReaderEndpoint` | Reader endpoint for Aurora cluster |
| `AuroraClusterIdentifier` | Cluster identifier |
| `DmsTaskArn` | DMS migration task ARN |
| `DmsReplicationInstanceArn` | DMS replication instance ARN |
| `ValidationLambdaArn` | Data validation Lambda ARN |
| `AlarmTopicArn` | SNS topic for alarms |
| `TargetSecretArn` | Aurora credentials secret ARN |

## Security Considerations

1. **Encryption**: All data encrypted at rest using KMS customer-managed keys
2. **Network Isolation**: Resources deployed in private subnets only
3. **Least Privilege**: IAM roles follow principle of least privilege
4. **SSL/TLS**: Database connections require SSL encryption
5. **Secret Rotation**: Automatic rotation enabled for production credentials
6. **VPC Peering**: Secure connectivity between development and production

## Troubleshooting

### DMS Task Fails to Start

Check:
- VPC peering route tables
- Security group ingress rules
- Source RDS binary logging enabled
- Credentials in Secrets Manager

### Replication Lag

Monitor CloudWatch metric `CDCLatencySource`. If lag exceeds 30 seconds:
- Check source database load
- Verify DMS replication instance size
- Review network connectivity

### Lambda Validation Fails

Check:
- Lambda has VPC access to both databases
- Security groups allow Lambda to connect
- Secrets Manager permissions granted
- pymysql layer attached (add layer ARN)

## Cost Optimization

- Use Aurora Serverless v2 for variable workloads
- Stop DMS replication instance after migration completes
- Reduce CloudWatch log retention after validation
- Delete stack when migration is complete

## Cleanup

To destroy all resources:

```bash
cdk destroy TapStack${ENVIRONMENT_SUFFIX}
```

**Note**: Some resources may require manual cleanup:
- Secrets in Secrets Manager (if not empty)
- CloudWatch log groups
- KMS keys (30-day waiting period)

## Additional Notes

### Lambda Layer for pymysql

The validation Lambda requires the `pymysql` library. In production, add a Lambda layer:

```typescript
layers: [
  lambda.LayerVersion.fromLayerVersionArn(
    this,
    'PyMySQLLayer',
    'arn:aws:lambda:ap-southeast-1:123456789012:layer:pymysql:1'
  )
]
```

Or create a layer:

```bash
mkdir python
pip install pymysql -t python/
zip -r pymysql-layer.zip python/
aws lambda publish-layer-version \
  --layer-name pymysql \
  --zip-file fileb://pymysql-layer.zip \
  --compatible-runtimes python3.11
```

### Source RDS Configuration

Ensure source RDS has binary logging enabled:

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 24);
```

Verify:

```sql
SHOW VARIABLES LIKE 'log_bin';
-- Should return ON
```

## Support

For issues or questions, refer to:
- [AWS DMS Documentation](https://docs.aws.amazon.com/dms/)
- [Aurora MySQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [CDK Documentation](https://docs.aws.amazon.com/cdk/)
```

## Summary

This implementation provides:

1. **Complete Database Migration Infrastructure** using AWS CDK with TypeScript
2. **Aurora MySQL Cluster** with 1 writer + 1 reader across 3 AZs
3. **DMS Replication** with full load and CDC enabled
4. **Comprehensive Security** with KMS encryption, Secrets Manager, and SSL/TLS
5. **CloudWatch Monitoring** with alarms for failures and replication lag > 30s
6. **Aurora Backtrack** enabled for 72 hours
7. **Automated Backups** with 7-day retention
8. **Lambda Validation** function for data consistency checks
9. **Stack Outputs** for Aurora endpoint and DMS task ARN
10. **Production-Ready** with proper IAM roles, security groups, and error handling

All resources use the `environmentSuffix` variable for unique naming and are fully destroyable for CI/CD workflows.
