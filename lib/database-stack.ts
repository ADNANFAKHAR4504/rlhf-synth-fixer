import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface DatabaseStackProps extends cdk.StackProps {
  replicaRegion: string;
  environmentSuffix: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly tableName: string;
  public readonly table: dynamodb.TableV2;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create customer managed KMS key for DynamoDB encryption in primary region
    this.kmsKey = new kms.Key(
      this,
      `PaymentsTableKey-${props.environmentSuffix}`,
      {
        enableKeyRotation: true,
        description: 'KMS key for encrypting the payments DynamoDB table',
        alias: `alias/payments-table-key-${props.environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create replica KMS key for secondary region
    const replicaKey = new kms.Key(
      this,
      `PaymentsTableReplicaKey-${props.environmentSuffix}`,
      {
        enableKeyRotation: true,
        description: `KMS key for encrypting the payments DynamoDB table replica in ${props.replicaRegion}`,
        alias: `alias/payments-table-replica-key-${props.environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create the DynamoDB Global Table with replication
    this.table = new dynamodb.TableV2(
      this,
      `PaymentsTable-${props.environmentSuffix}`,
      {
        partitionKey: {
          name: 'transactionId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
        billing: dynamodb.Billing.onDemand(),
        encryption: dynamodb.TableEncryptionV2.customerManagedKey(
          this.kmsKey,
          {
            [props.replicaRegion]: replicaKey.keyArn,
          }
        ),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
        replicas: [
          {
            region: props.replicaRegion,
          },
        ],
      }
    );

    this.tableName = this.table.tableName;

    // Create S3 bucket for CloudTrail logs
    const trailBucket = new s3.Bucket(
      this,
      `TrailBucket-${props.environmentSuffix}`,
      {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }
    );

    // Enable CloudTrail for DynamoDB data events (audit trail)
    const trail = new cloudtrail.Trail(
      this,
      `PaymentsTrail-${props.environmentSuffix}`,
      {
        bucket: trailBucket,
        sendToCloudWatchLogs: true,
      }
    );

    // Add DynamoDB table to CloudTrail for auditing
    // CloudTrail will log all data events for this table
    const cfnTrail = trail.node.defaultChild as cloudtrail.CfnTrail;
    cfnTrail.eventSelectors = [
      {
        readWriteType: 'All',
        includeManagementEvents: true,
        dataResources: [
          {
            type: 'AWS::DynamoDB::Table',
            values: [this.table.tableArn],
          },
        ],
      },
    ];

    // Output values
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB Global Table name',
      exportName: `PaymentsTableName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: 'DynamoDB Global Table ARN',
      exportName: `PaymentsTableArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN for DynamoDB encryption',
      exportName: `PaymentsKmsKeyArn-${props.environmentSuffix}`,
    });
  }
}
