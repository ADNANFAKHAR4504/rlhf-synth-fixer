/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates AWS infrastructure including Lambda functions, DynamoDB, S3,
 * SQS, IAM roles, CloudWatch logging, X-Ray tracing, and KMS encryption.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component creates and orchestrates all AWS infrastructure including:
 * - KMS encryption keys
 * - S3 buckets for data storage
 * - DynamoDB tables for metadata
 * - SQS queues for error handling
 * - IAM roles and policies
 * - Lambda functions with CloudWatch logging and X-Ray tracing
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly dataBucketName: pulumi.Output<string>;
  public readonly metadataTableName: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly apiHandlerArn: pulumi.Output<string>;
  public readonly processorArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get current AWS region
    const region = aws.getRegionOutput({}, { parent: this }).name;

    // 1. KMS - Encryption key for Lambda environment variables
    const kmsKey = new aws.kms.Key(
      `tap-kms-${environmentSuffix}`,
      {
        description: `KMS key for TAP infrastructure - ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: tags,
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const kmsAlias = new aws.kms.Alias(
      `tap-kms-alias-${environmentSuffix}`,
      {
        name: `alias/tap-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // 2. S3 - Data bucket with encryption
    const dataBucket = new aws.s3.Bucket(
      `tap-data-${environmentSuffix}`,
      {
        bucket: `tap-data-${environmentSuffix}`,
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        versioning: {
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // 3. DynamoDB - Metadata table
    const metadataTable = new aws.dynamodb.Table(
      `tap-metadata-${environmentSuffix}`,
      {
        name: `tap-metadata-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'id', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        serverSideEncryption: {
          enabled: true,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // 4. SQS - Dead letter queue
    const deadLetterQueue = new aws.sqs.Queue(
      `tap-dlq-${environmentSuffix}`,
      {
        name: `tap-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: tags,
      },
      { parent: this }
    );

    // 5. IAM - API Handler Lambda role
    const apiHandlerRole = new aws.iam.Role(
      `tap-api-handler-role-${environmentSuffix}`,
      {
        name: `tap-api-handler-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach policies for API handler
    new aws.iam.RolePolicyAttachment(
      `tap-api-handler-basic-${environmentSuffix}`,
      {
        role: apiHandlerRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-api-handler-xray-${environmentSuffix}`,
      {
        role: apiHandlerRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Custom policy for API handler
    const apiHandlerPolicy = new aws.iam.RolePolicy(
      `tap-api-handler-policy-${environmentSuffix}`,
      {
        role: apiHandlerRole.id,
        policy: pulumi
          .all([dataBucket.arn, metadataTable.arn])
          .apply(([bucketArn, tableArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:Query',
                  ],
                  Resource: tableArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 5. IAM - Processor Lambda role
    const processorRole = new aws.iam.Role(
      `tap-processor-role-${environmentSuffix}`,
      {
        name: `tap-processor-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach policies for processor
    new aws.iam.RolePolicyAttachment(
      `tap-processor-basic-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-processor-xray-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Custom policy for processor
    const processorPolicy = new aws.iam.RolePolicy(
      `tap-processor-policy-${environmentSuffix}`,
      {
        role: processorRole.id,
        policy: pulumi
          .all([dataBucket.arn, metadataTable.arn, deadLetterQueue.arn])
          .apply(([bucketArn, tableArn, queueArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 6. CloudWatch - Log groups for Lambda functions
    const apiHandlerLogGroup = new aws.cloudwatch.LogGroup(
      `tap-api-handler-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/tap-api-handler-${environmentSuffix}`,
        retentionInDays: environmentSuffix === 'prod' ? 30 : 7,
        tags: tags,
      },
      { parent: this }
    );

    const processorLogGroup = new aws.cloudwatch.LogGroup(
      `tap-processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/tap-processor-${environmentSuffix}`,
        retentionInDays: environmentSuffix === 'prod' ? 30 : 7,
        tags: tags,
      },
      { parent: this }
    );

    // 7 & 8. Lambda - API Handler with X-Ray tracing
    const apiHandler = new aws.lambda.Function(
      `tap-api-handler-${environmentSuffix}`,
      {
        name: `tap-api-handler-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        role: apiHandlerRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('API Handler invoked', JSON.stringify(event));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success', environment: '${environmentSuffix}' }),
  };
};
          `),
        }),
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 5,
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            DATA_BUCKET: dataBucket.id,
            METADATA_TABLE: metadataTable.name,
            MAX_CONNECTIONS: '10',
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active', // X-Ray tracing enabled
        },
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        tags: tags,
      },
      { parent: this, dependsOn: [apiHandlerLogGroup, apiHandlerPolicy] }
    );

    // 7 & 8. Lambda - Processor with X-Ray tracing
    const processor = new aws.lambda.Function(
      `tap-processor-${environmentSuffix}`,
      {
        name: `tap-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        role: processorRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Processor invoked', JSON.stringify(event));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Processing complete', environment: '${environmentSuffix}' }),
  };
};
          `),
        }),
        memorySize: 1024,
        timeout: 300,
        reservedConcurrentExecutions: 5,
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            DATA_BUCKET: dataBucket.id,
            METADATA_TABLE: metadataTable.name,
            DLQ_URL: deadLetterQueue.url,
            MAX_CONNECTIONS: '10',
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active', // X-Ray tracing enabled
        },
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        tags: tags,
      },
      { parent: this, dependsOn: [processorLogGroup, processorPolicy] }
    );

    // Store outputs
    this.kmsKeyId = kmsKey.id;
    this.dataBucketName = dataBucket.id;
    this.metadataTableName = metadataTable.name;
    this.dlqUrl = deadLetterQueue.url;
    this.apiHandlerArn = apiHandler.arn;
    this.processorArn = processor.arn;

    // Register outputs
    this.registerOutputs({
      kmsKeyId: this.kmsKeyId,
      dataBucketName: this.dataBucketName,
      metadataTableName: this.metadataTableName,
      dlqUrl: this.dlqUrl,
      apiHandlerArn: this.apiHandlerArn,
      processorArn: this.processorArn,
      region: region,
    });
  }
}
