import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class LambdaStack extends cdk.Stack {
  public readonly lambdaFunction: lambda.Function;
  public readonly functionUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create IAM role for Lambda function with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `lambda-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        CloudWatchInsightsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create CloudWatch Log Group with retention policy for cost optimization
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      logGroupClass: logs.LogGroupClass.STANDARD, // Using standard class for tiered pricing
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'ServerlessApiFunction', {
      functionName: `serverless-api-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event, null, 2));
          
          const response = {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            },
            body: JSON.stringify({
              message: 'Hello from serverless API!',
              timestamp: new Date().toISOString(),
              requestId: event.requestContext?.requestId || 'unknown',
            }),
          };
          
          return response;
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: logGroup,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0, // Enable Lambda Insights
    });

    // Create Function URL as alternative to API Gateway for simpler endpoint
    this.functionUrl = this.lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowCredentials: false,
        allowedHeaders: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedOrigins: ['*'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Add tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Service', 'ServerlessAPI');
    cdk.Tags.of(this).add('Component', 'Lambda');

    // Output the function URL
    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: this.functionUrl.url,
      description: 'Lambda Function URL',
      exportName: `${this.stackName}-FunctionUrl`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });
  }
}
