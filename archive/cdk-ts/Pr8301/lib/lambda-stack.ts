import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

// LocalStack detection
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.AWS_ENDPOINT_URL?.includes('localstack');

interface ProjectXLambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class ProjectXLambdaStack extends cdk.Stack {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ProjectXLambdaStackProps) {
    super(scope, id, props);

    // CloudWatch Log Group for Lambda
    const logGroup = new logs.LogGroup(this, 'ProjectXLambdaLogGroup', {
      logGroupName: `/aws/lambda/projectX-handler-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function with response streaming support
    this.lambdaFunction = new lambda.Function(this, 'ProjectXHandler', {
      functionName: `projectX-handler-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event, context) => {
          console.log('Event:', JSON.stringify(event, null, 2));

          const response = {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'Hello from ProjectX Lambda!',
              timestamp: new Date().toISOString(),
              requestId: context.awsRequestId,
              path: event.path || '/',
              httpMethod: event.httpMethod || 'GET',
              environment: process.env.NODE_ENV || 'unknown'
            })
          };

          return response;
        };
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      logGroup: logGroup,
      environment: {
        NODE_ENV: props.environmentSuffix,
        PROJECT_NAME: 'projectX',
        LOCALSTACK: isLocalStack ? 'true' : 'false',
      },
    });

    // Note: Output is created at the main stack level
  }
}
