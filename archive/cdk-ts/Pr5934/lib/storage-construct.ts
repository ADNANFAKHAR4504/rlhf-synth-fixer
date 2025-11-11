import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface StorageConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
}

export class StorageConstruct extends Construct {
  public readonly dataBucket: s3.Bucket;
  public readonly stateTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    // Create S3 bucket
    this.dataBucket = new s3.Bucket(
      this,
      `DataBucket-${props.environmentSuffix}`,
      {
        bucketName: `analytics-data-${props.environmentSuffix}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: props.config.s3Versioning,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Create DynamoDB table
    this.stateTable = new dynamodb.Table(
      this,
      `StateTable-${props.environmentSuffix}`,
      {
        tableName: `analytics-state-${props.environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode:
          props.config.dynamodbBillingMode === 'PAY_PER_REQUEST'
            ? dynamodb.BillingMode.PAY_PER_REQUEST
            : dynamodb.BillingMode.PROVISIONED,
        readCapacity: props.config.dynamodbReadCapacity,
        writeCapacity: props.config.dynamodbWriteCapacity,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: props.config.rdsMultiAz, // Use multiAz as proxy for prod
      }
    );
  }
}
