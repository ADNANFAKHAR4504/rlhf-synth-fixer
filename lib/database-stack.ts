import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly userSessionsTable: dynamodb.Table;
  public readonly apiKeysTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Aurora Serverless v2 PostgreSQL cluster
    this.cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.of('15.13', '15'),
      }),
      writer: rds.ClusterInstance.serverlessV2('Writer', {
        scaleWithWriter: true,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('Reader', {
          scaleWithWriter: true,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      defaultDatabaseName: `tradingdb${props.environmentSuffix.replace(/-/g, '')}`,
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    });

    // DynamoDB table for user sessions
    this.userSessionsTable = new dynamodb.Table(this, 'UserSessionsTable', {
      tableName: `user-sessions-${props.environmentSuffix}`,
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // DynamoDB table for API keys
    this.apiKeysTable = new dynamodb.Table(this, 'ApiKeysTable', {
      tableName: `api-keys-${props.environmentSuffix}`,
      partitionKey: {
        name: 'apiKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Global Secondary Index for API key lookups by user
    this.apiKeysTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
