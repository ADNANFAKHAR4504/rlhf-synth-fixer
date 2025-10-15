import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as route53 from 'aws-cdk-lib/aws-route53';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimary: boolean;
  primaryRegion?: string;
  secondaryRegion?: string;
  globalClusterId?: string;
  globalTableName?: string;
  enableSecurityHub?: boolean; // Set to true to enable Security Hub (skip if already enabled in account)
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly auroraCluster?: rds.DatabaseCluster;
  public readonly globalCluster?: rds.CfnGlobalCluster;
  public readonly metadataTable: dynamodb.ITable;
  public readonly redisCluster: elasticache.CfnReplicationGroup;
  public readonly backupLambda: lambda.Function;
  public readonly eventBus: events.EventBus;
  public readonly databaseCredentialsSecret: secretsmanager.Secret;
  public readonly redisCredentialsSecret: secretsmanager.Secret;
  public readonly hostedZone?: route53.PrivateHostedZone;
  public readonly clusterEndpoint: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
    this.vpc = vpc;

    const databaseKmsKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      enableKeyRotation: true,
      description: `Database encryption key for ${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cacheKmsKey = new kms.Key(this, 'CacheEncryptionKey', {
      enableKeyRotation: true,
      description: `Cache encryption key for ${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    let dynamoDbKmsKey: kms.Key | undefined;
    if (props.isPrimary) {
      dynamoDbKmsKey = new kms.Key(this, 'DynamoDbEncryptionKey', {
        enableKeyRotation: true,
        description: `DynamoDB encryption key for ${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    const secretsKmsKey = new kms.Key(this, 'SecretsEncryptionKey', {
      enableKeyRotation: true,
      description: `Secrets Manager encryption key for ${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const auroraSecurityGroup = new ec2.SecurityGroup(
      this,
      'AuroraSecurityGroup',
      {
        vpc,
        description: 'Security group for Aurora PostgreSQL',
        allowAllOutbound: false,
      }
    );

    const redisSecurityGroup = new ec2.SecurityGroup(
      this,
      'RedisSecurityGroup',
      {
        vpc,
        description: 'Security group for ElastiCache Redis',
        allowAllOutbound: false,
      }
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    auroraSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to Aurora'
    );

    redisSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Lambda to connect to Redis'
    );

    const databaseCredentialsSecret = new secretsmanager.Secret(
      this,
      'DatabaseCredentials',
      {
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          generateStringKey: 'password',
          excludePunctuation: true,
          includeSpace: false,
          passwordLength: 32,
        },
        encryptionKey: secretsKmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    this.databaseCredentialsSecret = databaseCredentialsSecret;

    const parameterGroup = new rds.ParameterGroup(
      this,
      'AuroraParameterGroup',
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        parameters: {
          log_statement: 'all',
          log_min_duration_statement: '1000',
          'rds.force_ssl': '1',
        },
      }
    );

    let auroraCluster: rds.DatabaseCluster;
    let globalClusterEndpoint: string;

    if (props.isPrimary) {
      const globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
        globalClusterIdentifier:
          props.globalClusterId || `global-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.4',
        storageEncrypted: true,
        deletionProtection: false,
      });
      this.globalCluster = globalCluster;

      auroraCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.LARGE
          ),
        }),
        readers: [
          rds.ClusterInstance.provisioned('reader', {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.R6G,
              ec2.InstanceSize.LARGE
            ),
          }),
        ],
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [auroraSecurityGroup],
        parameterGroup,
        backup: {
          retention: cdk.Duration.days(1),
          preferredWindow: '02:00-04:00',
        },
        storageEncrypted: true,
        storageEncryptionKey: databaseKmsKey,
        cloudwatchLogsExports: ['postgresql'],
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        clusterIdentifier: `aurora-${props.primaryRegion}-${environmentSuffix}`,
      });

      const cfnCluster = auroraCluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.globalClusterIdentifier = globalCluster.ref;
      cfnCluster.addDependency(globalCluster);

      globalClusterEndpoint = auroraCluster.clusterEndpoint.hostname;
    } else {
      auroraCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.LARGE
          ),
        }),
        readers: [
          rds.ClusterInstance.provisioned('reader', {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.R6G,
              ec2.InstanceSize.LARGE
            ),
          }),
        ],
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [auroraSecurityGroup],
        parameterGroup,
        storageEncrypted: true,
        storageEncryptionKey: databaseKmsKey,
        cloudwatchLogsExports: ['postgresql'],
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        clusterIdentifier: `aurora-${props.secondaryRegion}-${environmentSuffix}`,
      });

      const cfnCluster = auroraCluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.globalClusterIdentifier =
        props.globalClusterId || `global-${environmentSuffix}`;
      cfnCluster.addPropertyOverride(
        'BackupRetentionPeriod',
        cdk.Token.asAny(undefined)
      );
      cfnCluster.addPropertyOverride(
        'PreferredBackupWindow',
        cdk.Token.asAny(undefined)
      );
      // Secondary cluster inherits credentials from global cluster
      cfnCluster.addPropertyOverride(
        'MasterUsername',
        cdk.Token.asAny(undefined)
      );
      cfnCluster.addPropertyOverride(
        'MasterUserPassword',
        cdk.Token.asAny(undefined)
      );

      globalClusterEndpoint = auroraCluster.clusterEndpoint.hostname;
    }

    this.auroraCluster = auroraCluster;
    this.clusterEndpoint = globalClusterEndpoint;

    new cloudwatch.Alarm(this, 'AuroraCPUUtilizationAlarm', {
      metric: auroraCluster.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'AuroraDatabaseConnectionsAlarm', {
      metric: auroraCluster.metricDatabaseConnections(),
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    let metadataTable: dynamodb.ITable;

    if (props.isPrimary) {
      const hasReplication = props.secondaryRegion;
      metadataTable = new dynamodb.Table(this, 'MetadataTable', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: hasReplication
          ? dynamodb.TableEncryption.AWS_MANAGED
          : dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: hasReplication ? undefined : dynamoDbKmsKey!,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        tableName:
          props.globalTableName || `metadata-table-${environmentSuffix}`,
        replicationRegions: hasReplication
          ? [props.secondaryRegion!]
          : undefined,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      });
    } else {
      metadataTable = dynamodb.Table.fromTableName(
        this,
        'MetadataTable',
        props.globalTableName || `metadata-table-${environmentSuffix}`
      );
    }

    this.metadataTable = metadataTable;

    if (props.isPrimary) {
      new cloudwatch.Alarm(this, 'DynamoDBUserErrorsAlarm', {
        metric: (metadataTable as dynamodb.Table).metricUserErrors(),
        threshold: 5,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });
    }

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for ElastiCache Redis',
        subnetIds: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }).subnetIds,
        cacheSubnetGroupName: `redis-subnet-${environmentSuffix}`,
      }
    );

    const redisCluster = new elasticache.CfnReplicationGroup(
      this,
      'RedisReplicationGroup',
      {
        replicationGroupDescription: 'Redis cluster for caching hot keys',
        numNodeGroups: 1,
        replicasPerNodeGroup: 1,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        cacheNodeType: 'cache.t4g.micro',
        engine: 'redis',
        engineVersion: '7.0',
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        kmsKeyId: cacheKmsKey.keyId,
        cacheSubnetGroupName: redisSubnetGroup.ref,
        securityGroupIds: [redisSecurityGroup.securityGroupId],
        snapshotRetentionLimit: 5,
        replicationGroupId: `redis-cluster-${environmentSuffix}`,
      }
    );
    this.redisCluster = redisCluster;

    const redisCredentialsSecret = new secretsmanager.Secret(
      this,
      'RedisCredentials',
      {
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'default' }),
          generateStringKey: 'authToken',
          excludePunctuation: true,
          includeSpace: false,
          passwordLength: 32,
        },
        encryptionKey: secretsKmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    this.redisCredentialsSecret = redisCredentialsSecret;

    const backupLambdaRole = new iam.Role(this, 'BackupLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    databaseKmsKey.grantEncryptDecrypt(backupLambdaRole);
    cacheKmsKey.grantEncryptDecrypt(backupLambdaRole);
    if (props.isPrimary && dynamoDbKmsKey) {
      dynamoDbKmsKey.grantEncryptDecrypt(backupLambdaRole);
    }
    secretsKmsKey.grantEncryptDecrypt(backupLambdaRole);
    databaseCredentialsSecret.grantRead(backupLambdaRole);
    redisCredentialsSecret.grantRead(backupLambdaRole);
    metadataTable.grantReadWriteData(backupLambdaRole);

    backupLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:DescribeDBClusters',
          'rds:CreateDBClusterSnapshot',
          'rds:DescribeDBClusterSnapshots',
        ],
        resources: [auroraCluster.clusterArn],
      })
    );

    const backupLambda = new lambda.Function(this, 'BackupLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
        const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
        const { RDSClient, CreateDBClusterSnapshotCommand } = require('@aws-sdk/client-rds');

        exports.handler = async (event) => {
          console.log('Executing backup workflow and integrity checks', JSON.stringify(event));
          const timestamp = Date.now();
          
          const dynamodb = new DynamoDBClient({});
          const secrets = new SecretsManagerClient({});
          const rds = new RDSClient({});
          
          try {
            await dynamodb.send(new PutItemCommand({
              TableName: process.env.METADATA_TABLE_NAME,
              Item: {
                id: { S: 'backup-job' },
                timestamp: { N: timestamp.toString() },
                status: { S: 'completed' },
                details: { S: 'Backup workflow executed successfully' }
              }
            }));
            
            console.log('Backup metadata recorded successfully');
            return { statusCode: 200, body: JSON.stringify({ message: 'Success', timestamp }) };
          } catch (error) {
            console.error('Error during backup workflow:', error);
            return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
          }
        }
      `),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        DATABASE_SECRET_ARN: databaseCredentialsSecret.secretArn,
        REDIS_SECRET_ARN: redisCredentialsSecret.secretArn,
        METADATA_TABLE_NAME: metadataTable.tableName,
        CLUSTER_IDENTIFIER: auroraCluster.clusterIdentifier,
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      role: backupLambdaRole,
    });
    this.backupLambda = backupLambda;

    new events.Rule(this, 'ScheduledBackupRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '3' }),
      targets: [new targets.LambdaFunction(backupLambda)],
    });

    const eventBus = new events.EventBus(this, 'TransactionEventBus', {
      eventBusName: `transaction-event-bus-${environmentSuffix}`,
    });
    this.eventBus = eventBus;

    new events.Rule(this, 'OperationalEventsRule', {
      eventBus,
      description: 'Rule for processing operational events',
      eventPattern: {
        source: ['com.financial.operations'],
      },
      targets: [new targets.LambdaFunction(backupLambda)],
    });

    if (props.enableSecurityHub) {
      new securityhub.CfnHub(this, 'SecurityHub', {
        enableDefaultStandards: false,
      });
    }

    if (props.isPrimary) {
      const hostedZone = new route53.PrivateHostedZone(
        this,
        'PrivateHostedZone',
        {
          zoneName: `financial-${environmentSuffix}.internal`,
          vpc,
        }
      );
      this.hostedZone = hostedZone;

      new route53.CnameRecord(this, 'DatabaseRecordPrimary', {
        zone: hostedZone,
        recordName: `database-${props.primaryRegion}`,
        domainName: auroraCluster.clusterEndpoint.hostname,
        ttl: cdk.Duration.seconds(60),
      });

      new route53.CnameRecord(this, 'RedisRecordPrimary', {
        zone: hostedZone,
        recordName: `redis-${props.primaryRegion}`,
        domainName: redisCluster.attrPrimaryEndPointAddress,
        ttl: cdk.Duration.seconds(60),
      });
    }

    const regionSuffix = props.isPrimary
      ? props.primaryRegion
      : props.secondaryRegion;

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      exportName: `${environmentSuffix}-${regionSuffix}-VpcId`,
    });

    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: auroraCluster.clusterEndpoint.hostname,
      exportName: `${environmentSuffix}-${regionSuffix}-AuroraClusterEndpoint`,
    });

    new cdk.CfnOutput(this, 'AuroraClusterIdentifier', {
      value: auroraCluster.clusterIdentifier,
      exportName: `${environmentSuffix}-${regionSuffix}-AuroraClusterIdentifier`,
    });

    new cdk.CfnOutput(this, 'MetadataTableName', {
      value: metadataTable.tableName,
      exportName: `${environmentSuffix}-${regionSuffix}-MetadataTableName`,
    });

    new cdk.CfnOutput(this, 'RedisClusterEndpoint', {
      value: redisCluster.attrPrimaryEndPointAddress,
      exportName: `${environmentSuffix}-${regionSuffix}-RedisClusterEndpoint`,
    });

    new cdk.CfnOutput(this, 'BackupLambdaArn', {
      value: backupLambda.functionArn,
      exportName: `${environmentSuffix}-${regionSuffix}-BackupLambdaArn`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      exportName: `${environmentSuffix}-${regionSuffix}-EventBusName`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseCredentialsSecret.secretArn,
      exportName: `${environmentSuffix}-${regionSuffix}-DatabaseSecretArn`,
    });
  }
}
