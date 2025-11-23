import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig } from './types';

export class DataPipelineEnvironment extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly table: aws.dynamodb.Table;
  public readonly successTopic: aws.sns.Topic;
  public readonly failureTopic: aws.sns.Topic;
  public readonly dlq: aws.sqs.Queue;
  public readonly replicationFunction?: aws.lambda.Function;
  public readonly eventRule?: aws.cloudwatch.EventRule;
  private readonly lambdaRole?: aws.iam.Role;

  constructor(
    name: string,
    config: EnvironmentConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:DataPipeline:Environment', name, {}, opts);

    const defaultOpts = { parent: this };
    const environment = config.environment;
    const suffix = config.environmentSuffix;

    // S3 Bucket for data storage
    this.bucket = new aws.s3.Bucket(
      `company-data-${environment}-${suffix}`,
      {
        bucket:
          `company-data-${environment}-${config.region}-${suffix}`.toLowerCase(),
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        forceDestroy: true,
        tags: {
          ...config.tags,
          Name: `company-data-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // DynamoDB Table for metadata storage
    this.table = new aws.dynamodb.Table(
      `pipeline-metadata-${environment}-${suffix}`,
      {
        name: `pipeline-metadata-${environment}-${suffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'id', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'environment', type: 'S' },
        ],
        globalSecondaryIndexes: [
          {
            name: 'environment-index',
            hashKey: 'environment',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
        ],
        tags: {
          ...config.tags,
          Name: `pipeline-metadata-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // SNS Topic for success notifications
    this.successTopic = new aws.sns.Topic(
      `replication-success-${environment}-${suffix}`,
      {
        name: `replication-success-${environment}-${suffix}`,
        tags: {
          ...config.tags,
          Name: `replication-success-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // SNS Topic for failure notifications
    this.failureTopic = new aws.sns.Topic(
      `replication-failure-${environment}-${suffix}`,
      {
        name: `replication-failure-${environment}-${suffix}`,
        tags: {
          ...config.tags,
          Name: `replication-failure-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // Dead Letter Queue for failed replications
    this.dlq = new aws.sqs.Queue(
      `replication-dlq-${environment}-${suffix}`,
      {
        name: `replication-dlq-${environment}-${suffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          ...config.tags,
          Name: `replication-dlq-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // Production-specific resources
    if (environment === 'prod') {
      // IAM Role for Lambda function
      this.lambdaRole = new aws.iam.Role(
        `replication-lambda-role-${suffix}`,
        {
          name: `replication-lambda-role-${suffix}`,
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
          tags: {
            ...config.tags,
            Name: `replication-lambda-role-${suffix}`,
          },
        },
        defaultOpts
      );

      // Attach basic Lambda execution policy
      new aws.iam.RolePolicyAttachment(
        `lambda-basic-execution-${suffix}`,
        {
          role: this.lambdaRole.name,
          policyArn:
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        },
        defaultOpts
      );

      // Custom policy for cross-environment access
      const replicationPolicy = new aws.iam.Policy(
        `replication-policy-${suffix}`,
        {
          name: `replication-policy-${suffix}`,
          policy: pulumi
            .all([
              this.bucket.arn,
              this.table.arn,
              this.successTopic.arn,
              this.failureTopic.arn,
              this.dlq.arn,
            ])
            .apply(
              ([
                bucketArn,
                tableArn,
                successTopicArn,
                failureTopicArn,
                dlqArn,
              ]) =>
                JSON.stringify({
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: ['s3:GetObject', 's3:ListBucket'],
                      Resource: [bucketArn, `${bucketArn}/*`],
                    },
                    {
                      Effect: 'Allow',
                      Action: ['s3:PutObject'],
                      Resource: [
                        'arn:aws:s3:::company-data-dev-*/*',
                        'arn:aws:s3:::company-data-staging-*/*',
                      ],
                    },
                    {
                      Effect: 'Allow',
                      Action: [
                        'dynamodb:GetItem',
                        'dynamodb:Query',
                        'dynamodb:Scan',
                      ],
                      Resource: tableArn,
                    },
                    {
                      Effect: 'Allow',
                      Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                      Resource: [
                        `arn:aws:dynamodb:${config.region}:*:table/pipeline-metadata-dev-*`,
                        `arn:aws:dynamodb:${config.region}:*:table/pipeline-metadata-staging-*`,
                      ],
                    },
                    {
                      Effect: 'Allow',
                      Action: ['sns:Publish'],
                      Resource: [successTopicArn, failureTopicArn],
                    },
                    {
                      Effect: 'Allow',
                      Action: ['sqs:SendMessage'],
                      Resource: dlqArn,
                    },
                  ],
                })
            ),
          tags: {
            ...config.tags,
            Name: `replication-policy-${suffix}`,
          },
        },
        defaultOpts
      );

      new aws.iam.RolePolicyAttachment(
        `lambda-replication-policy-${suffix}`,
        {
          role: this.lambdaRole.name,
          policyArn: replicationPolicy.arn,
        },
        defaultOpts
      );

      // Lambda function for replication
      this.replicationFunction = new aws.lambda.Function(
        `config-replication-${suffix}`,
        {
          name: `config-replication-${suffix}`,
          runtime: aws.lambda.Runtime.NodeJS18dX,
          handler: 'index.handler',
          role: this.lambdaRole.arn,
          timeout: 300, // 5 minutes
          code: new pulumi.asset.AssetArchive({
            '.': new pulumi.asset.FileArchive('./lib/lambda/replication'),
          }),
          environment: {
            variables: {
              PROD_BUCKET: this.bucket.id,
              PROD_TABLE: this.table.name,
              SUCCESS_TOPIC_ARN: this.successTopic.arn,
              FAILURE_TOPIC_ARN: this.failureTopic.arn,
              DLQ_URL: this.dlq.url,
              ENVIRONMENT_SUFFIX: suffix,
              REGION: config.region,
            },
          },
          deadLetterConfig: {
            targetArn: this.dlq.arn,
          },
          tags: {
            ...config.tags,
            Name: `config-replication-${suffix}`,
          },
        },
        defaultOpts
      );

      // EventBridge rule for production changes
      this.eventRule = new aws.cloudwatch.EventRule(
        `prod-config-change-${suffix}`,
        {
          name: `prod-config-change-${suffix}`,
          description:
            'Trigger replication on production configuration changes',
          eventPattern: pulumi
            .all([this.bucket.id, this.table.name])
            .apply(([bucketName, tableName]) =>
              JSON.stringify({
                source: ['aws.s3', 'aws.dynamodb'],
                detailType: ['AWS API Call via CloudTrail'],
                detail: {
                  eventSource: ['s3.amazonaws.com', 'dynamodb.amazonaws.com'],
                  eventName: [
                    'PutObject',
                    'CopyObject',
                    'PutItem',
                    'UpdateItem',
                  ],
                  requestParameters: {
                    bucketName: [bucketName],
                    tableName: [tableName],
                  },
                },
              })
            ),
          tags: {
            ...config.tags,
            Name: `prod-config-change-${suffix}`,
          },
        },
        defaultOpts
      );

      // EventBridge target to invoke Lambda
      new aws.cloudwatch.EventTarget(
        `replication-target-${suffix}`,
        {
          rule: this.eventRule.name,
          arn: this.replicationFunction.arn,
        },
        defaultOpts
      );

      // Permission for EventBridge to invoke Lambda
      new aws.lambda.Permission(
        `eventbridge-invoke-${suffix}`,
        {
          action: 'lambda:InvokeFunction',
          function: this.replicationFunction.name,
          principal: 'events.amazonaws.com',
          sourceArn: this.eventRule.arn,
        },
        defaultOpts
      );
    }

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      tableName: this.table.name,
      tableArn: this.table.arn,
      successTopicArn: this.successTopic.arn,
      failureTopicArn: this.failureTopic.arn,
      dlqUrl: this.dlq.url,
      dlqArn: this.dlq.arn,
    });
  }
}
