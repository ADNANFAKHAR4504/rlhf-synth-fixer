/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the Compliance Monitoring System.
 * Orchestrates all compliance monitoring infrastructure components.
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
 * Main Pulumi component resource for the Compliance Monitoring System.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly complianceAlarmArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Create SNS Topic for Compliance Notifications
    const snsTopic = new aws.sns.Topic(
      `compliance-notifications-${environmentSuffix}`,
      {
        displayName: 'Compliance Violation Notifications',
        tags: tags,
      },
      { parent: this }
    );

    // 2. Create SNS Email Subscription
    new aws.sns.TopicSubscription(
      `compliance-email-subscription-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: 'compliance@company.com',
      },
      { parent: this }
    );

    // 3. Create DynamoDB Table for Compliance History
    const dynamoTable = new aws.dynamodb.Table(
      `compliance-history-${environmentSuffix}`,
      {
        attributes: [
          {
            name: 'checkId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        hashKey: 'checkId',
        rangeKey: 'timestamp',
        billingMode: 'PAY_PER_REQUEST',
        ttl: {
          attributeName: 'expirationTime',
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // 4. Create IAM Role for Lambda Function
    const lambdaRole = new aws.iam.Role(
      `compliance-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    // 5. Attach policies to Lambda Role
    // Basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `compliance-lambda-basic-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for resource configuration access
    const lambdaCustomPolicy = new aws.iam.RolePolicy(
      `compliance-lambda-custom-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:Describe*',
                's3:GetBucketPolicy',
                's3:GetBucketAcl',
                's3:GetEncryptionConfiguration',
                'iam:ListUsers',
                'iam:ListRoles',
                'iam:GetRole',
                'iam:GetUser',
                'lambda:ListFunctions',
                'rds:DescribeDBInstances',
                'cloudwatch:PutMetricData',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
              Resource: dynamoTable.arn,
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: snsTopic.arn,
            },
          ],
        },
      },
      { parent: this }
    );

    // 6. Create CloudWatch Log Group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `compliance-lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-analyzer-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // 7. Create Lambda Function
    const lambdaFunction = new aws.lambda.Function(
      `compliance-analyzer-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(`${__dirname}/lambda`),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            DYNAMO_TABLE_NAME: dynamoTable.name,
            SNS_TOPIC_ARN: snsTopic.arn,
            COMPLIANCE_NAMESPACE: 'ComplianceMonitoring',
          },
        },
        tags: tags,
      },
      {
        parent: this,
        dependsOn: [lambdaLogGroup, lambdaBasicPolicy, lambdaCustomPolicy],
      }
    );

    // 8. Create EventBridge Rule for Scheduled Execution (every 15 minutes)
    const scheduledRule = new aws.cloudwatch.EventRule(
      `compliance-schedule-${environmentSuffix}`,
      {
        description: 'Trigger compliance check every 15 minutes',
        scheduleExpression: 'rate(15 minutes)',
        tags: tags,
      },
      { parent: this }
    );

    // 9. Allow EventBridge to invoke Lambda
    const lambdaPermission = new aws.lambda.Permission(
      `compliance-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    // 10. Create EventBridge Target
    new aws.cloudwatch.EventTarget(
      `compliance-schedule-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: lambdaFunction.arn,
      },
      { parent: this, dependsOn: [lambdaPermission] }
    );

    // 11. Create CloudWatch Alarm for Compliance Failure Rate
    const complianceAlarm = new aws.cloudwatch.MetricAlarm(
      `compliance-failure-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ComplianceFailureRate',
        namespace: 'ComplianceMonitoring',
        period: 900, // 15 minutes
        statistic: 'Average',
        threshold: 20,
        alarmDescription: 'Alert when compliance failure rate exceeds 20%',
        alarmActions: [snsTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.snsTopicArn = snsTopic.arn;
    this.dynamoTableName = dynamoTable.name;
    this.complianceAlarmArn = complianceAlarm.arn;

    this.registerOutputs({
      lambdaFunctionArn: this.lambdaFunctionArn,
      snsTopicArn: this.snsTopicArn,
      dynamoTableName: this.dynamoTableName,
      complianceAlarmArn: this.complianceAlarmArn,
    });
  }
}
