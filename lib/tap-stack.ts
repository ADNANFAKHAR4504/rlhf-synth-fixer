import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly tableArn: pulumi.Output<string>;
  public readonly streamArn: pulumi.Output<string>;
  public readonly lambdaRoleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Team: 'Platform',
      CostCenter: 'Engineering',
    }));

    // DynamoDB Table with on-demand billing and optimizations
    const table = new aws.dynamodb.Table(
      `optimized-table-${environmentSuffix}`,
      {
        name: `optimized-table-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST', // On-demand billing for unpredictable workloads
        hashKey: 'id',
        rangeKey: 'timestamp',

        attributes: [
          { name: 'id', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'category', type: 'S' },
          { name: 'status', type: 'S' },
        ],

        // Global Secondary Index with attribute projection
        globalSecondaryIndexes: [
          {
            name: 'CategoryStatusIndex',
            hashKey: 'category',
            rangeKey: 'status',
            projectionType: 'INCLUDE', // Project specific attributes only
            nonKeyAttributes: ['id', 'timestamp'],
          },
        ],

        // Point-in-time recovery for data protection
        pointInTimeRecovery: {
          enabled: true,
        },

        // Server-side encryption with AWS managed keys
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: undefined, // Use AWS managed key
        },

        // DynamoDB Streams with NEW_AND_OLD_IMAGES
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',

        // Enable contributor insights for access pattern analysis
        tags: defaultTags.apply(t => ({
          ...t,
          ContributorInsightsEnabled: 'true',
        })),

        // Ensure destroyable for CI/CD
        deletionProtectionEnabled: false,
      },
      { parent: this }
    );

    // Enable Contributor Insights
    void new aws.dynamodb.ContributorInsights(
      `table-insights-${environmentSuffix}`,
      {
        tableName: table.name,
      },
      { parent: this }
    );

    // CloudWatch Alarm for Read Capacity
    void new aws.cloudwatch.MetricAlarm(
      `table-read-alarm-${environmentSuffix}`,
      {
        name: `table-read-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ConsumedReadCapacityUnits',
        namespace: 'AWS/DynamoDB',
        period: 300, // 5 minutes
        statistic: 'Sum',
        threshold: 80,
        dimensions: {
          TableName: table.name,
        },
        alarmDescription: 'Alarm when read capacity exceeds threshold',
        tags: defaultTags,
      },
      { parent: this }
    );

    // CloudWatch Alarm for Write Capacity
    void new aws.cloudwatch.MetricAlarm(
      `table-write-alarm-${environmentSuffix}`,
      {
        name: `table-write-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ConsumedWriteCapacityUnits',
        namespace: 'AWS/DynamoDB',
        period: 300, // 5 minutes
        statistic: 'Sum',
        threshold: 80,
        dimensions: {
          TableName: table.name,
        },
        alarmDescription: 'Alarm when write capacity exceeds threshold',
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM Role for Lambda with least-privilege read access
    const lambdaRole = new aws.iam.Role(
      `lambda-dynamodb-reader-${environmentSuffix}`,
      {
        name: `lambda-dynamodb-reader-${environmentSuffix}`,
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM Policy for DynamoDB read access
    void new aws.iam.RolePolicy(
      `lambda-dynamodb-read-policy-${environmentSuffix}`,
      {
        name: `lambda-dynamodb-read-policy-${environmentSuffix}`,
        role: lambdaRole.id,
        policy: pulumi
          .all([table.arn, table.streamArn])
          .apply(([tableArn, streamArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:BatchGetItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                    'dynamodb:DescribeTable',
                  ],
                  Resource: [tableArn, `${tableArn}/index/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetRecords',
                    'dynamodb:GetShardIterator',
                    'dynamodb:DescribeStream',
                    'dynamodb:ListStreams',
                  ],
                  Resource: streamArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    void new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Export outputs
    this.tableArn = table.arn;
    this.streamArn = table.streamArn;
    this.lambdaRoleArn = lambdaRole.arn;

    this.registerOutputs({
      tableArn: this.tableArn,
      streamArn: this.streamArn,
      lambdaRoleArn: this.lambdaRoleArn,
      tableName: table.name,
    });
  }
}
