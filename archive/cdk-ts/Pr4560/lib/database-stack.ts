import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';

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

    // Construct the secondary KMS key ARN using the predictable alias pattern
    // This avoids cross-region references and Custom::CrossRegionExportWriter
    // The SecondaryKmsStack creates a KMS key with a known alias pattern
    const secondaryKmsKeyArn = `arn:aws:kms:${props.replicaRegion}:${this.account}:alias/payments-table-key-${props.replicaRegion}-${props.environmentSuffix}`;

    // Create the DynamoDB Global Table with replication
    // Using customer-managed KMS keys for both primary and replica regions
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
        encryption: dynamodb.TableEncryptionV2.customerManagedKey(this.kmsKey, {
          [props.replicaRegion]: secondaryKmsKeyArn,
        }),
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

    // Output values for integration testing
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

    new cdk.CfnOutput(this, 'PrimaryRegion', {
      value: cdk.Stack.of(this).region,
      description: 'Primary region for DynamoDB table',
      exportName: `DynamoDBPrimaryRegion-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicaRegion', {
      value: props.replicaRegion,
      description: 'Replica region for DynamoDB table',
      exportName: `DynamoDBReplicaRegion-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN for DynamoDB encryption (primary region)',
      exportName: `PaymentsKmsKeyArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for DynamoDB encryption (primary region)',
      exportName: `PaymentsKmsKeyId-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PointInTimeRecovery', {
      value: 'ENABLED',
      description: 'Point-in-time recovery status',
      exportName: `DynamoDBPITR-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BillingMode', {
      value: 'PAY_PER_REQUEST',
      description: 'DynamoDB billing mode',
      exportName: `DynamoDBBillingMode-${props.environmentSuffix}`,
    });
  }
}
