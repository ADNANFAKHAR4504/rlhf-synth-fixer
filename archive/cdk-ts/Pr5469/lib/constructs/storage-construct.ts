import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class StorageConstruct extends Construct {
  public readonly dataBucket: s3.Bucket;
  public readonly artifactBucket: s3.Bucket;
  public readonly dynamoTable: dynamodb.Table;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const isProd = props.environmentSuffix.toLowerCase().includes('prod');
    const removalPolicy = isProd
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;
    const account = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      alias: `alias/financeapp-${props.environmentSuffix}-${account}-${region}`,
      description: 'KMS key for FinanceApp encryption',
      enableKeyRotation: true,
      removalPolicy,
    });

    // Create S3 bucket for data
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `financeapp-data-${props.environmentSuffix}-${account}-${region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects: !isProd,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Enforce KMS encryption policy on data bucket
    this.dataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.dataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );
    this.dataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.dataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            // Accept either the key ID or the full key ARN to avoid false denies
            's3:x-amz-server-side-encryption-aws-kms-key-id': [
              this.kmsKey.keyId,
              this.kmsKey.keyArn,
            ],
          },
        },
      })
    );

    // Create S3 bucket for pipeline artifacts
    this.artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `financeapp-artifacts-${props.environmentSuffix}-${account}-${region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects: !isProd,
      lifecycleRules: [
        {
          id: 'delete-old-artifacts',
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
    });

    // Enforce KMS encryption policy on artifact bucket
    this.artifactBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.artifactBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );
    this.artifactBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.artifactBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': [
              this.kmsKey.keyId,
              this.kmsKey.keyArn,
            ],
          },
        },
      })
    );

    // Create DynamoDB table
    this.dynamoTable = new dynamodb.Table(this, 'DataTable', {
      tableName: `financeapp-data-${props.environmentSuffix}-${account}-${region}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy,
      contributorInsightsEnabled: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add global secondary index
    this.dynamoTable.addGlobalSecondaryIndex({
      indexName: 'timestamp-index',
      partitionKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    // Store configuration in Parameter Store
    const apiKeyParam = new ssm.CfnParameter(this, 'ApiKeyParameter', {
      name: `/financeapp/${props.environmentSuffix}-${account}-${region}/api-key`,
      type: 'String',
      value: 'default-api-key-change-me',
      description: 'API key for FinanceApp',
      tier: 'Standard',
    });
    apiKeyParam.applyRemovalPolicy(removalPolicy);

    const dbUrlParam = new ssm.CfnParameter(this, 'DatabaseUrlParameter', {
      name: `/financeapp/${props.environmentSuffix}-${account}-${region}/database-url`,
      type: 'String',
      value: 'dynamodb://localhost:8000',
      description: 'Database URL for FinanceApp',
      tier: 'Standard',
    });
    dbUrlParam.applyRemovalPolicy(removalPolicy);

    // Apply tags
    Object.entries(props.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
