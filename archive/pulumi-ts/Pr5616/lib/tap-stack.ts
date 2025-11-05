/**
 * tap-stack.ts
 *
 * This module defines the TapStack class for DynamoDB infrastructure optimization.
 * It refactors existing DynamoDB tables from provisioned to on-demand billing mode,
 * adds monitoring, security controls, and proper tagging across all resources.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

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
 * Represents the main Pulumi component resource for the TAP DynamoDB optimization project.
 *
 * This component creates and configures three DynamoDB tables with on-demand billing,
 * CloudWatch monitoring, IAM roles, and other operational features.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly tableNames: pulumi.Output<string[]>;
  public readonly tableArns: pulumi.Output<string[]>;
  public readonly streamArns: pulumi.Output<string[]>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const baseTags = args.tags || {};

    // Define table configurations
    const tableConfigs = [
      {
        name: 'events',
        hashKey: 'eventId',
        enableStreams: true,
        enableInsights: true,
      },
      { name: 'sessions', hashKey: 'sessionId', enableGSI: true },
      { name: 'users', hashKey: 'userId', enablePITR: true },
    ];

    // Arrays to collect outputs
    const tableNamesList: string[] = [];
    const tableArnsList: pulumi.Output<string>[] = [];
    const streamArnsList: pulumi.Output<string | undefined>[] = [];

    // Create DynamoDB tables
    tableConfigs.forEach(config => {
      const tableName = config.name;
      const resourceName = `${tableName}-${environmentSuffix}`;

      // Merge tags with table-specific environment suffix
      const tableTags = pulumi.output(baseTags).apply(bt => ({
        ...bt,
        Environment: environmentSuffix,
        Team: bt.Team || 'data-analytics',
        CostCenter: bt.CostCenter || 'engineering',
      }));

      // Create the DynamoDB table
      const table = new aws.dynamodb.Table(
        resourceName,
        {
          name: tableName,
          billingMode: 'PAY_PER_REQUEST',
          hashKey: config.hashKey,
          attributes: config.enableGSI
            ? [
                { name: config.hashKey, type: 'S' },
                { name: 'userId', type: 'S' },
                { name: 'timestamp', type: 'N' },
              ]
            : [{ name: config.hashKey, type: 'S' }],
          streamEnabled: config.enableStreams || false,
          streamViewType: config.enableStreams
            ? 'NEW_AND_OLD_IMAGES'
            : undefined,
          serverSideEncryption: {
            enabled: true,
          },
          pointInTimeRecovery: {
            enabled: config.enablePITR || false,
          },
          globalSecondaryIndexes: config.enableGSI
            ? [
                {
                  name: 'userId-timestamp-index',
                  hashKey: 'userId',
                  rangeKey: 'timestamp',
                  projectionType: 'ALL',
                },
              ]
            : undefined,
          tags: tableTags,
        },
        { parent: this }
      );

      tableNamesList.push(tableName);
      tableArnsList.push(table.arn);
      streamArnsList.push(table.streamArn);

      // Enable contributor insights for events table only
      if (config.enableInsights) {
        new aws.dynamodb.ContributorInsights(
          `${tableName}-insights-${environmentSuffix}`,
          {
            tableName: table.name,
          },
          { parent: this }
        );
      }

      // Create CloudWatch alarms for UserErrors
      new aws.cloudwatch.MetricAlarm(
        `${tableName}-user-errors-${environmentSuffix}`,
        {
          name: `dynamodb-${tableName}-user-errors-${environmentSuffix}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'UserErrors',
          namespace: 'AWS/DynamoDB',
          period: 60,
          statistic: 'Sum',
          threshold: 5,
          treatMissingData: 'notBreaching',
          dimensions: {
            TableName: table.name,
          },
          tags: tableTags,
        },
        { parent: this }
      );

      // Create CloudWatch alarms for SystemErrors
      new aws.cloudwatch.MetricAlarm(
        `${tableName}-system-errors-${environmentSuffix}`,
        {
          name: `dynamodb-${tableName}-system-errors-${environmentSuffix}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'SystemErrors',
          namespace: 'AWS/DynamoDB',
          period: 60,
          statistic: 'Sum',
          threshold: 5,
          treatMissingData: 'notBreaching',
          dimensions: {
            TableName: table.name,
          },
          tags: tableTags,
        },
        { parent: this }
      );

      // Create IAM read role
      const readRole = new aws.iam.Role(
        `dynamodb-${tableName}-read-role-${environmentSuffix}`,
        {
          name: `dynamodb-${tableName}-read-role-${environmentSuffix}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
              },
            ],
          }),
          tags: tableTags,
        },
        { parent: this }
      );

      // Attach read policy to read role
      new aws.iam.RolePolicy(
        `dynamodb-${tableName}-read-policy-${environmentSuffix}`,
        {
          role: readRole.id,
          policy: table.arn.apply(arn =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                    'dynamodb:BatchGetItem',
                    'dynamodb:DescribeTable',
                  ],
                  Resource: [arn, `${arn}/index/*`],
                },
              ],
            })
          ),
        },
        { parent: this }
      );

      // Create IAM write role
      const writeRole = new aws.iam.Role(
        `dynamodb-${tableName}-write-role-${environmentSuffix}`,
        {
          name: `dynamodb-${tableName}-write-role-${environmentSuffix}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
              },
            ],
          }),
          tags: tableTags,
        },
        { parent: this }
      );

      // Attach write policy to write role
      new aws.iam.RolePolicy(
        `dynamodb-${tableName}-write-policy-${environmentSuffix}`,
        {
          role: writeRole.id,
          policy: table.arn.apply(arn =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                    'dynamodb:BatchWriteItem',
                  ],
                  Resource: arn,
                },
              ],
            })
          ),
        },
        { parent: this }
      );

      return table;
    });

    // Set outputs
    this.tableNames = pulumi.output(tableNamesList);
    this.tableArns = pulumi.all(tableArnsList);
    this.streamArns = pulumi
      .all(streamArnsList)
      .apply(arns => arns.filter((arn): arn is string => arn !== undefined));

    // Register the outputs of this component
    this.registerOutputs({
      tableNames: this.tableNames,
      tableArns: this.tableArns,
      streamArns: this.streamArns,
    });
  }
}
