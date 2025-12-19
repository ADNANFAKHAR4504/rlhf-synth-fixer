/**
 * tap-stack.ts
 *
 * Lambda Function Optimization - BASELINE Infrastructure
 *
 * IMPORTANT: This stack contains NON-OPTIMIZED baseline values:
 * - Lambda memory: 3008MB (high baseline, will be optimized to 1024MB)
 * - Lambda timeout: 300 seconds (5 minutes, will be optimized to 30s)
 * - CloudWatch log retention: NEVER_EXPIRE (indefinite, will be set to 7 days)
 * - No reserved concurrency limits (will be set to 50)
 * - X-Ray tracing: PassThrough (will be changed to Active)
 * - Dead Letter Queue: Created but not attached to Lambda (will be attached)
 * - CloudWatch alarms: Created with baseline thresholds
 *
 * Infrastructure includes (ready for optimization):
 * - S3 bucket with versioning for deployment packages
 * - Lambda layer for shared dependencies
 * - Dead Letter Queue (SQS)
 * - CloudWatch alarms for error rate and duration
 * - IAM roles with X-Ray and SQS permissions
 *
 * These will be optimized by the lib/optimize.py script after deployment.
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
 * TapStack - Lambda Function Infrastructure with baseline (non-optimized) configuration
 *
 * Creates:
 * - S3 bucket for Lambda deployment packages
 * - Lambda Layer for shared dependencies
 * - IAM role for Lambda execution
 * - Lambda function with BASELINE configuration
 * - CloudWatch log group with NO retention (indefinite)
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly deploymentBucketName: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly errorRateAlarmName: pulumi.Output<string>;
  public readonly durationAlarmName: pulumi.Output<string>;

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

    // S3 Bucket for Lambda deployment packages with versioning
    const deploymentBucket = new aws.s3.Bucket(
      `lambda-deployment-${environmentSuffix}`,
      {
        versioning: {
          enabled: true,
        },
        forceDestroy: true, // Allows destruction during testing
        tags: {
          ...tags,
          Name: `lambda-deployment-${environmentSuffix}`,
          Purpose: 'Lambda deployment packages',
        },
      },
      { parent: this }
    );

    // Lambda Layer for shared dependencies
    const sharedLayer = new aws.lambda.LayerVersion(
      `lambda-shared-layer-${environmentSuffix}`,
      {
        layerName: `lambda-shared-layer-${environmentSuffix}`,
        compatibleRuntimes: ['nodejs18.x', 'nodejs20.x'],
        code: new pulumi.asset.AssetArchive({
          nodejs: new pulumi.asset.StringAsset(
            '// Shared dependencies placeholder'
          ),
        }),
        description: 'Shared dependencies for Lambda functions',
      },
      { parent: this }
    );

    // IAM Role for Lambda execution
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
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
          ...tags,
          Name: `lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write access policy (for optimization phase)
    new aws.iam.RolePolicyAttachment(
      `lambda-xray-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Attach SQS policy for DLQ
    new aws.iam.RolePolicy(
      `lambda-sqs-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'sqs:SendMessage',
                'sqs:GetQueueAttributes',
                'sqs:GetQueueUrl',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create Dead Letter Queue (will be attached during optimization)
    const dlq = new aws.sqs.Queue(
      `lambda-dlq-${environmentSuffix}`,
      {
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          ...tags,
          Name: `lambda-dlq-${environmentSuffix}`,
          Purpose: 'Dead Letter Queue for Lambda failures',
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group with NO retention (BASELINE - indefinite retention)
    const logGroup = new aws.cloudwatch.LogGroup(
      `lambda-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/lambda-function-${environmentSuffix}`,
        retentionInDays: 0, // 0 means NEVER_EXPIRE - will be optimized to 7 days
        tags: {
          ...tags,
          Name: `lambda-log-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Lambda Function with BASELINE (non-optimized) configuration
    const lambdaFunction = new aws.lambda.Function(
      `lambda-function-${environmentSuffix}`,
      {
        name: `lambda-function-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,

        // BASELINE: High memory allocation (will be optimized to 1024MB)
        memorySize: 3008,

        // BASELINE: Long timeout (will be optimized to 30 seconds)
        timeout: 300,

        // BASELINE: Basic environment variables (non-secret)
        // Will be enhanced with DATABASE_URL and API_KEY from Secrets Manager
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            LOG_LEVEL: 'INFO',
          },
        },

        // Use the Lambda layer
        layers: [sharedLayer.arn],

        // BASELINE: No X-Ray tracing (will be added by optimize.py)
        tracingConfig: {
          mode: 'PassThrough',
        },

        // BASELINE: No reserved concurrency (will be set to 50 by optimize.py)
        // reservedConcurrentExecutions: undefined,

        // BASELINE: No Dead Letter Queue (will be added by optimize.py)
        // deadLetterConfig: undefined,

        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Processing event:', JSON.stringify(event));

    // Simulate some work
    const result = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Lambda function executed successfully',
            environment: process.env.ENVIRONMENT,
            timestamp: new Date().toISOString(),
        }),
    };

    return result;
};
        `),
        }),

        tags: {
          ...tags,
          Name: `lambda-function-${environmentSuffix}`,
          Purpose: 'Baseline Lambda for optimization',
        },
      },
      { parent: this, dependsOn: [logGroup] }
    );

    // BASELINE: CloudWatch alarms created but thresholds may need adjustment
    // Create CloudWatch alarm for error rate
    const errorRateAlarm = new aws.cloudwatch.MetricAlarm(
      `lambda-error-rate-alarm-${environmentSuffix}`,
      {
        name: `lambda-error-rate-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Average',
        threshold: 1, // 1% error rate
        alarmDescription: 'Alert when Lambda error rate exceeds 1%',
        dimensions: {
          FunctionName: lambdaFunction.name,
        },
        tags: {
          ...tags,
          Name: `lambda-error-rate-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for duration
    const durationAlarm = new aws.cloudwatch.MetricAlarm(
      `lambda-duration-alarm-${environmentSuffix}`,
      {
        name: `lambda-duration-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Duration',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Average',
        threshold: 20000, // 20 seconds in milliseconds
        alarmDescription: 'Alert when Lambda duration exceeds 20 seconds',
        dimensions: {
          FunctionName: lambdaFunction.name,
        },
        tags: {
          ...tags,
          Name: `lambda-duration-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Expose outputs
    this.lambdaFunctionName = lambdaFunction.name;
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.deploymentBucketName = deploymentBucket.id;
    this.dlqUrl = dlq.url;
    this.errorRateAlarmName = errorRateAlarm.name;
    this.durationAlarmName = durationAlarm.name;

    // Register the outputs of this component
    this.registerOutputs({
      lambdaFunctionName: this.lambdaFunctionName,
      lambdaFunctionArn: this.lambdaFunctionArn,
      deploymentBucketName: this.deploymentBucketName,
      dlqUrl: this.dlqUrl,
      errorRateAlarmName: this.errorRateAlarmName,
      durationAlarmName: this.durationAlarmName,
    });
  }
}
