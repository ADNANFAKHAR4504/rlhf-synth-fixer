/**
 * tap-stack.ts
 *
 * Baseline Lambda-based data processing infrastructure.
 * This creates the initial infrastructure with standard configurations
 * that will be optimized by the optimize.py script.
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
 * Represents the main Pulumi component resource for Lambda data processing.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Determine timeout based on environment
    const timeout = environmentSuffix === 'prod' ? 300 : 60;

    // Create Dead Letter Queue for failed invocations
    const dlq = new aws.sqs.Queue(
      `data-processing-dlq-${environmentSuffix}`,
      {
        name: `data-processing-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          ...tags,
          Purpose: 'Lambda Dead Letter Queue',
        },
      },
      { parent: this }
    );

    // Create IAM role with least-privilege permissions
    const lambdaRole = new aws.iam.Role(
      `lambda-processing-role-${environmentSuffix}`,
      {
        name: `lambda-processing-role-${environmentSuffix}`,
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
          Purpose: 'Lambda Execution Role',
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

    // Attach X-Ray write policy
    new aws.iam.RolePolicyAttachment(
      `lambda-xray-write-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Create inline policy for SQS and CloudWatch Metrics
    const lambdaPolicy = new aws.iam.RolePolicy(
      `lambda-processing-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([dlq.arn]).apply(([dlqArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sqs:SendMessage'],
                Resource: dlqArn,
              },
              {
                Effect: 'Allow',
                Action: ['cloudwatch:PutMetricData'],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'cloudwatch:namespace': 'DataProcessing',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create CloudWatch Log Group with 7-day retention
    const logGroup = new aws.cloudwatch.LogGroup(
      `lambda-data-processing-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/data-processing-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Purpose: 'Lambda Logs',
        },
      },
      { parent: this }
    );

    // Create Lambda function (consolidated from three functions)
    // BASELINE: Using 3008MB memory (will be optimized by optimize.py)
    const lambdaFunction = new aws.lambda.Function(
      `data-processing-${environmentSuffix}`,
      {
        name: `data-processing-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: timeout,
        memorySize: 3008, // BASELINE: High memory allocation
        reservedConcurrentExecutions: 10, // Prevent throttling
        deadLetterConfig: {
          targetArn: dlq.arn,
        },
        tracingConfig: {
          mode: 'Active', // Enable X-Ray tracing
        },
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            DLQ_URL: dlq.url,
            LOG_LEVEL: environmentSuffix === 'prod' ? 'INFO' : 'DEBUG',
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const cloudwatch = new CloudWatchClient();

/**
 * Consolidated data processing handler.
 * Handles multiple data processing operations that were previously in separate functions.
 */
exports.handler = async (event) => {
  console.log('Processing event:', JSON.stringify(event));

  const operation = event.operation || 'process';

  try {
    let result;

    switch(operation) {
      case 'transform':
        result = await transformData(event.data);
        break;
      case 'validate':
        result = await validateData(event.data);
        break;
      case 'process':
      default:
        result = await processData(event.data);
        break;
    }

    // Record success metric
    await recordMetric('ProcessingSuccess', 1);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data processing completed successfully',
        operation: operation,
        result: result
      })
    };

  } catch (error) {
    console.error('Processing error:', error);

    // Record error metric
    await recordMetric('ProcessingError', 1);

    // Error will be sent to DLQ automatically
    throw error;
  }
};

/**
 * Transform data operation
 */
async function transformData(data) {
  if (!data) throw new Error('No data provided for transformation');

  // Simulate data transformation
  return {
    transformed: true,
    records: Array.isArray(data) ? data.length : 1,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate data operation
 */
async function validateData(data) {
  if (!data) throw new Error('No data provided for validation');

  // Simulate data validation
  return {
    valid: true,
    records: Array.isArray(data) ? data.length : 1,
    timestamp: new Date().toISOString()
  };
}

/**
 * Process data operation
 */
async function processData(data) {
  if (!data) throw new Error('No data provided for processing');

  // Simulate data processing
  return {
    processed: true,
    records: Array.isArray(data) ? data.length : 1,
    timestamp: new Date().toISOString()
  };
}

/**
 * Record custom CloudWatch metric
 */
async function recordMetric(metricName, value) {
  try {
    const command = new PutMetricDataCommand({
      Namespace: 'DataProcessing',
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: 'Count',
        Timestamp: new Date()
      }]
    });
    await cloudwatch.send(command);
  } catch (error) {
    console.error('Failed to record metric:', error);
    // Don't throw - metric recording failure shouldn't fail the operation
  }
}
          `),
        }),
        tags: {
          ...tags,
          Purpose: 'Data Processing Lambda',
          Optimizable: 'true',
        },
      },
      { parent: this, dependsOn: [logGroup, lambdaPolicy] }
    );

    // Create CloudWatch alarms for monitoring
    new aws.cloudwatch.MetricAlarm(
      `lambda-errors-alarm-${environmentSuffix}`,
      {
        name: `lambda-data-processing-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert when Lambda function has too many errors',
        dimensions: {
          FunctionName: lambdaFunction.name,
        },
        tags: {
          ...tags,
          Purpose: 'Error Monitoring',
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `lambda-throttles-alarm-${environmentSuffix}`,
      {
        name: `lambda-data-processing-throttles-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Throttles',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert when Lambda function is throttled',
        dimensions: {
          FunctionName: lambdaFunction.name,
        },
        tags: {
          ...tags,
          Purpose: 'Throttle Monitoring',
        },
      },
      { parent: this }
    );

    // Store outputs
    this.lambdaFunctionName = lambdaFunction.name;
    this.dlqUrl = dlq.url;
    this.logGroupName = logGroup.name;

    // Register outputs
    this.registerOutputs({
      lambdaFunctionName: this.lambdaFunctionName,
      dlqUrl: this.dlqUrl,
      logGroupName: this.logGroupName,
    });
  }
}
