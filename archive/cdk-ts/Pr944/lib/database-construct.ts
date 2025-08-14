import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: cdk.aws_ec2.Vpc;
  isPrimary: boolean;
  kmsKey: cdk.aws_kms.Key;
}

export class DatabaseConstruct extends Construct {
  public readonly rdsCluster: cdk.aws_rds.DatabaseCluster;
  public readonly dynamoDbTable: cdk.aws_dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, vpc, isPrimary, kmsKey } = props;

    // RDS Aurora Serverless v2 for cost optimization
    this.rdsCluster = new cdk.aws_rds.DatabaseCluster(this, 'AuroraCluster', {
      clusterIdentifier: `${environmentSuffix}-aurora-${region}`,
      engine: cdk.aws_rds.DatabaseClusterEngine.auroraPostgres({
        version: cdk.aws_rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      writer: cdk.aws_rds.ClusterInstance.serverlessV2('writer', {
        scaleWithWriter: true,
      }),
      readers: [
        cdk.aws_rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: false,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      vpc: vpc,
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: cdk.aws_rds.Credentials.fromGeneratedSecret('dbadmin', {
        secretName: `${environmentSuffix}/rds/credentials/${region}`,
        encryptionKey: kmsKey,
      }),
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'Sun:04:00-Sun:05:00',
      deletionProtection: false, // For dev/test environments
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Global Table (only create in primary region)
    if (isPrimary) {
      this.dynamoDbTable = new cdk.aws_dynamodb.Table(this, 'GlobalTable', {
        tableName: `${environmentSuffix}-global-table`,
        partitionKey: {
          name: 'PK',
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'SK',
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        // Global Tables only support AWS managed encryption
        encryption: cdk.aws_dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        replicationRegions: ['us-west-2'], // Set up replication to secondary region
      });
    } else {
      // In secondary region, create a regular table (global tables handle replication)
      this.dynamoDbTable = new cdk.aws_dynamodb.Table(this, 'RegionalTable', {
        tableName: `${environmentSuffix}-regional-table-${region}`,
        partitionKey: {
          name: 'PK',
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'SK',
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: cdk.aws_dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: kmsKey,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // Global Secondary Index
    this.dynamoDbTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
    });
  }
}
