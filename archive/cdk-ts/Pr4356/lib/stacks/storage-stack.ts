import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly dataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // S3 Bucket with versioning and encryption
    this.dataBucket = new s3.Bucket(
      this,
      `DataBucket-${props.environmentSuffix}`,
      {
        bucketName: `serverless-data-bucket-${props.environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'delete-old-versions',
            noncurrentVersionExpiration: cdk.Duration.days(90),
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          },
        ],
        cors: [
          {
            allowedHeaders: ['*'],
            allowedMethods: [
              s3.HttpMethods.GET,
              s3.HttpMethods.PUT,
              s3.HttpMethods.POST,
            ],
            allowedOrigins: ['*'],
            exposedHeaders: ['ETag'],
            maxAge: 3000,
          },
        ],
        removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect data from accidental deletion
      }
    );

    // DynamoDB Table with backup and autoscaling
    this.dataTable = new dynamodb.Table(
      this,
      `DataTable-${props.environmentSuffix}`,
      {
        tableName: `serverless-data-table-${props.environmentSuffix}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecovery: true,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        contributorInsightsEnabled: true,
        timeToLiveAttribute: 'ttl',
      }
    );

    // Add Global Secondary Index for querying by status
    this.dataTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `DataBucketName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: this.dataTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `DataTableName-${props.environmentSuffix}`,
    });
  }
}
