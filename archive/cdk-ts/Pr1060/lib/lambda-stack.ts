import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface LambdaStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix: string;
}

export class LambdaStack extends cdk.Stack {
  public readonly apiFunction: lambda.Function;
  public readonly processingFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { environmentConfig, environmentSuffix } = props;

    // Create Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`arn:aws:s3:::tap-${environmentSuffix}-*/*`],
            }),
          ],
        }),
      },
    });

    // API Lambda Function with response streaming support
    this.apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `tap-${environmentSuffix}-api-function`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { Readable } = require('stream');
        
        exports.handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
          const metadata = {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Environment': '${environmentConfig.environmentName}',
            },
          };
          
          responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
          
          const data = {
            message: 'Hello from ${environmentConfig.environmentName} environment',
            timestamp: new Date().toISOString(),
            environment: '${environmentConfig.environmentName}',
            requestId: context.awsRequestId,
          };
          
          responseStream.write(JSON.stringify(data));
          responseStream.end();
        });
      `),
      memorySize: environmentConfig.lambdaMemorySize,
      timeout: cdk.Duration.seconds(environmentConfig.lambdaTimeout),
      role: lambdaRole,
      environment: {
        ENVIRONMENT: environmentConfig.environmentName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
        LOG_LEVEL: environmentConfig.enableLogging ? 'INFO' : 'ERROR',
      },
      tracing: environmentConfig.enableTracing
        ? lambda.Tracing.ACTIVE
        : lambda.Tracing.DISABLED,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Processing Lambda Function
    this.processingFunction = new lambda.Function(this, 'ProcessingFunction', {
      functionName: `tap-${environmentSuffix}-processing-function`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing event:', JSON.stringify(event, null, 2));
          
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Processing completed',
              environment: '${environmentConfig.environmentName}',
              timestamp: new Date().toISOString(),
            }),
          };
        };
      `),
      memorySize: environmentConfig.lambdaMemorySize,
      timeout: cdk.Duration.seconds(environmentConfig.lambdaTimeout),
      role: lambdaRole,
      environment: {
        ENVIRONMENT: environmentConfig.environmentName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
        LOG_LEVEL: environmentConfig.enableLogging ? 'INFO' : 'ERROR',
      },
      tracing: environmentConfig.enableTracing
        ? lambda.Tracing.ACTIVE
        : lambda.Tracing.DISABLED,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);
    cdk.Tags.of(this).add('Component', 'Lambda');

    // Outputs
    new cdk.CfnOutput(this, 'ApiFunctionName', {
      value: this.apiFunction.functionName,
      description: 'API Lambda function name',
    });

    new cdk.CfnOutput(this, 'ProcessingFunctionName', {
      value: this.processingFunction.functionName,
      description: 'Processing Lambda function name',
    });
  }
}
