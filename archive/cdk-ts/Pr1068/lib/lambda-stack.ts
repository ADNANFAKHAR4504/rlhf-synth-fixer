import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class LambdaStack extends cdk.Stack {
  public readonly processingFunction: lambda.Function;
  public readonly streamingFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create CloudWatch log groups with retention
    const processingLogGroup = new logs.LogGroup(
      this,
      'ProcessingFunctionLogGroup',
      {
        logGroupName: `/aws/lambda/processing-function-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const streamingLogGroup = new logs.LogGroup(
      this,
      'StreamingFunctionLogGroup',
      {
        logGroupName: `/aws/lambda/streaming-function-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // IAM role for Lambda functions with CloudWatch permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        CloudWatchMetrics: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Processing Lambda function for basic HTTP requests
    this.processingFunction = new lambda.Function(this, 'ProcessingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      functionName: `processing-function-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing request:', JSON.stringify(event, null, 2));
          
          try {
            // Log custom metrics (CloudWatch will automatically capture from logs)
            console.log(JSON.stringify({
              _aws: {
                CloudWatchMetrics: [{
                  Namespace: 'ServerlessApp/Processing',
                  Dimensions: [['Environment']],
                  Metrics: [{
                    Name: 'RequestCount',
                    Unit: 'Count'
                  }]
                }]
              },
              Environment: '${environmentSuffix}',
              RequestCount: 1
            }));

            const response = {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                message: 'Request processed successfully',
                timestamp: new Date().toISOString(),
                environment: '${environmentSuffix}',
                region: process.env.AWS_REGION,
                requestId: event.requestContext?.requestId || 'N/A'
              }),
            };
            
            return response;
          } catch (error) {
            console.error('Error processing request:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                error: 'Internal server error',
                timestamp: new Date().toISOString()
              }),
            };
          }
        };
      `),
      logGroup: processingLogGroup,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      reservedConcurrentExecutions: 100,
      environment: {
        ENVIRONMENT: environmentSuffix,
        LOG_LEVEL: 'INFO',
      },
    });

    // Streaming Lambda function for large payloads (up to 200MB response streaming)
    this.streamingFunction = new lambda.Function(this, 'StreamingFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      functionName: `streaming-function-${environmentSuffix}`,
      code: lambda.Code.fromInline(`
        exports.handler = async (event, context) => {
          console.log('Streaming request:', JSON.stringify(event, null, 2));
          
          try {
            // Log custom metrics (CloudWatch will automatically capture from logs)
            console.log(JSON.stringify({
              _aws: {
                CloudWatchMetrics: [{
                  Namespace: 'ServerlessApp/Streaming',
                  Dimensions: [['Environment']],
                  Metrics: [{
                    Name: 'StreamingRequestCount',
                    Unit: 'Count'
                  }]
                }]
              },
              Environment: '${environmentSuffix}',
              StreamingRequestCount: 1
            }));

            // Build response data
            const responseData = {
              message: 'Streaming response simulation',
              timestamp: new Date().toISOString(),
              environment: '${environmentSuffix}',
              region: process.env.AWS_REGION,
              requestId: context.awsRequestId,
              chunks: []
            };

            // Simulate streaming large data in chunks
            for (let i = 0; i < 10; i++) {
              responseData.chunks.push({
                chunkId: i + 1,
                data: \`Large data chunk \${i + 1} with timestamp \${new Date().toISOString()}\`,
                size: '1MB simulated'
              });
            }

            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                data: responseData,
                completed: true,
                totalChunks: responseData.chunks.length,
                note: 'Response streaming simulation - actual streaming requires Lambda Function URLs with response streaming enabled'
              }),
            };
          } catch (error) {
            console.error('Error in streaming function:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                error: 'Streaming error',
                message: error.message,
                timestamp: new Date().toISOString()
              }),
            };
          }
        };
      `),
      logGroup: streamingLogGroup,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      reservedConcurrentExecutions: 50,
      environment: {
        ENVIRONMENT: environmentSuffix,
        LOG_LEVEL: 'INFO',
      },
    });

    // Add CloudWatch alarms for monitoring
    new cdk.aws_cloudwatch.Alarm(this, 'ProcessingFunctionErrorAlarm', {
      alarmName: `processing-function-errors-${environmentSuffix}`,
      metric: this.processingFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when processing function has errors',
    });

    new cdk.aws_cloudwatch.Alarm(this, 'StreamingFunctionErrorAlarm', {
      alarmName: `streaming-function-errors-${environmentSuffix}`,
      metric: this.streamingFunction.metricErrors(),
      threshold: 3,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when streaming function has errors',
    });

    // Outputs
    new cdk.CfnOutput(this, 'ProcessingFunctionArn', {
      value: this.processingFunction.functionArn,
      description: 'ARN of the processing Lambda function',
    });

    new cdk.CfnOutput(this, 'StreamingFunctionArn', {
      value: this.streamingFunction.functionArn,
      description: 'ARN of the streaming Lambda function',
    });
  }
}
