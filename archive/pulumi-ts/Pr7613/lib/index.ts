import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

interface LambdaEtlStackProps {
  environmentSuffix: string;
  environment: string; // "dev" or "prod"
}

export class LambdaEtlStack extends pulumi.ComponentResource {
  public readonly apiHandlerFunctionArn: pulumi.Output<string>;
  public readonly batchProcessorFunctionArn: pulumi.Output<string>;
  public readonly transformFunctionArn: pulumi.Output<string>;
  public readonly dlqUrl: pulumi.Output<string>;
  public readonly layerArn: pulumi.Output<string>;

  constructor(
    name: string,
    props: LambdaEtlStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaEtlStack', name, {}, opts);

    const { environmentSuffix, environment } = props;

    // Determine log retention based on environment
    const logRetentionDays = environment === 'prod' ? 30 : 7;

    // Create shared Lambda layer for dependencies
    const sharedLayer = new aws.lambda.LayerVersion(
      `shared-deps-layer-${environmentSuffix}`,
      {
        layerName: `shared-deps-layer-${environmentSuffix}`,
        code: new pulumi.asset.AssetArchive({
          nodejs: new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda-layers/nodejs')
          ),
        }),
        compatibleRuntimes: ['nodejs18.x'],
        description: 'Shared dependencies layer for Lambda functions',
      },
      { parent: this }
    );

    this.layerArn = sharedLayer.arn;

    // Create Dead Letter Queue for failed executions
    const dlq = new aws.sqs.Queue(
      `lambda-dlq-${environmentSuffix}`,
      {
        name: `lambda-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          Name: `lambda-dlq-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    this.dlqUrl = dlq.url;

    // IAM Role for API Handler Lambda
    const apiHandlerRole = new aws.iam.Role(
      `api-handler-role-${environmentSuffix}`,
      {
        name: `api-handler-role-${environmentSuffix}`,
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
          Name: `api-handler-role-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `api-handler-basic-exec-${environmentSuffix}`,
      {
        role: apiHandlerRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy
    new aws.iam.RolePolicyAttachment(
      `api-handler-xray-${environmentSuffix}`,
      {
        role: apiHandlerRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Attach SQS policy for DLQ
    new aws.iam.RolePolicy(
      `api-handler-sqs-policy-${environmentSuffix}`,
      {
        role: apiHandlerRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "sqs:SendMessage",
            "sqs:GetQueueUrl"
          ],
          "Resource": "${dlq.arn}"
        }]
      }`,
      },
      { parent: this }
    );

    // CloudWatch Log Group for API Handler
    const apiHandlerLogGroup = new aws.cloudwatch.LogGroup(
      `api-handler-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/api-handler-${environmentSuffix}`,
        retentionInDays: logRetentionDays,
        tags: {
          Name: `api-handler-logs-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // API Handler Lambda Function (small function - 512MB, 30s timeout)
    const apiHandlerFunction = new aws.lambda.Function(
      `api-handler-${environmentSuffix}`,
      {
        name: `api-handler-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: apiHandlerRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/api-handler')
          ),
        }),
        memorySize: 512,
        timeout: 30,
        layers: [sharedLayer.arn],
        environment: {
          variables: {
            ENVIRONMENT: environment,
            MAX_CONNECTIONS: '10',
            LOG_LEVEL: 'INFO',
          },
        },
        deadLetterConfig: {
          targetArn: dlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: {
          Name: `api-handler-${environmentSuffix}`,
          Environment: environment,
          FunctionType: 'API',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this, dependsOn: [apiHandlerLogGroup] }
    );

    this.apiHandlerFunctionArn = apiHandlerFunction.arn;

    // IAM Role for Batch Processor Lambda
    const batchProcessorRole = new aws.iam.Role(
      `batch-processor-role-${environmentSuffix}`,
      {
        name: `batch-processor-role-${environmentSuffix}`,
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
          Name: `batch-processor-role-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `batch-processor-basic-exec-${environmentSuffix}`,
      {
        role: batchProcessorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `batch-processor-xray-${environmentSuffix}`,
      {
        role: batchProcessorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `batch-processor-sqs-policy-${environmentSuffix}`,
      {
        role: batchProcessorRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "sqs:SendMessage",
            "sqs:GetQueueUrl"
          ],
          "Resource": "${dlq.arn}"
        }]
      }`,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Batch Processor
    const batchProcessorLogGroup = new aws.cloudwatch.LogGroup(
      `batch-processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/batch-processor-${environmentSuffix}`,
        retentionInDays: logRetentionDays,
        tags: {
          Name: `batch-processor-logs-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // Batch Processor Lambda Function (large function - 1024MB, 5min timeout)
    const batchProcessorFunction = new aws.lambda.Function(
      `batch-processor-${environmentSuffix}`,
      {
        name: `batch-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: batchProcessorRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/batch-processor')
          ),
        }),
        memorySize: 1024,
        timeout: 300,
        layers: [sharedLayer.arn],
        environment: {
          variables: {
            ENVIRONMENT: environment,
            MAX_CONNECTIONS: '10',
            BATCH_SIZE: '100',
            LOG_LEVEL: 'INFO',
          },
        },
        deadLetterConfig: {
          targetArn: dlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: {
          Name: `batch-processor-${environmentSuffix}`,
          Environment: environment,
          FunctionType: 'Batch',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this, dependsOn: [batchProcessorLogGroup] }
    );

    this.batchProcessorFunctionArn = batchProcessorFunction.arn;

    // IAM Role for Transform Lambda
    const transformRole = new aws.iam.Role(
      `transform-role-${environmentSuffix}`,
      {
        name: `transform-role-${environmentSuffix}`,
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
          Name: `transform-role-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `transform-basic-exec-${environmentSuffix}`,
      {
        role: transformRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `transform-xray-${environmentSuffix}`,
      {
        role: transformRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `transform-sqs-policy-${environmentSuffix}`,
      {
        role: transformRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "sqs:SendMessage",
            "sqs:GetQueueUrl"
          ],
          "Resource": "${dlq.arn}"
        }]
      }`,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Transform
    const transformLogGroup = new aws.cloudwatch.LogGroup(
      `transform-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/transform-${environmentSuffix}`,
        retentionInDays: logRetentionDays,
        tags: {
          Name: `transform-logs-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // Transform Lambda Function (small function - 512MB, 30s timeout)
    const transformFunction = new aws.lambda.Function(
      `transform-${environmentSuffix}`,
      {
        name: `transform-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: transformRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/transform')
          ),
        }),
        memorySize: 512,
        timeout: 30,
        layers: [sharedLayer.arn],
        environment: {
          variables: {
            ENVIRONMENT: environment,
            MAX_CONNECTIONS: '10',
            LOG_LEVEL: 'INFO',
          },
        },
        deadLetterConfig: {
          targetArn: dlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: {
          Name: `transform-${environmentSuffix}`,
          Environment: environment,
          FunctionType: 'Transform',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this, dependsOn: [transformLogGroup] }
    );

    this.transformFunctionArn = transformFunction.arn;

    // CloudWatch Alarms for Critical Functions
    new aws.cloudwatch.MetricAlarm(
      `api-handler-errors-${environmentSuffix}`,
      {
        name: `api-handler-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription:
          'Alert when API handler has more than 5 errors in 10 minutes',
        dimensions: {
          FunctionName: apiHandlerFunction.name,
        },
        tags: {
          Name: `api-handler-errors-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `batch-processor-errors-${environmentSuffix}`,
      {
        name: `batch-processor-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 3,
        alarmDescription:
          'Alert when batch processor has more than 3 errors in 10 minutes',
        dimensions: {
          FunctionName: batchProcessorFunction.name,
        },
        tags: {
          Name: `batch-processor-errors-${environmentSuffix}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // Register outputs
    this.registerOutputs({
      apiHandlerFunctionName: apiHandlerFunction.name,
      apiHandlerFunctionArn: apiHandlerFunction.arn,
      batchProcessorFunctionName: batchProcessorFunction.name,
      batchProcessorFunctionArn: batchProcessorFunction.arn,
      transformFunctionName: transformFunction.name,
      transformFunctionArn: transformFunction.arn,
      dlqUrl: dlq.url,
      dlqArn: dlq.arn,
      sharedLayerArn: sharedLayer.arn,
    });
  }
}
