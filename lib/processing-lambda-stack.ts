import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface ProcessingLambdaStackProps extends cdk.StackProps {
  globalTable: dynamodb.ITable;
  environmentSuffix: string;
}

export class ProcessingLambdaStack extends cdk.Stack {
  public readonly processingLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: ProcessingLambdaStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create IAM role for the Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'ProcessingLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for the Trading Event Processing Lambda',
    });

    // Add permissions to write to DynamoDB
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:BatchWriteItem',
        ],
        resources: [props.globalTable.tableArn],
      })
    );

    // Add permissions for CloudWatch Logs
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Add permissions for X-Ray
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Create log group for the Lambda
    const logGroup = new logs.LogGroup(this, 'ProcessingLambdaLogGroup', {
      logGroupName: `/aws/lambda/trading-event-processor-${suffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create the Lambda function
    this.processingLambda = new lambda.Function(this, 'ProcessingLambda', {
      functionName: `trading-event-processor-${suffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Processing event:', JSON.stringify(event, null, 2));
  return { statusCode: 200, body: 'Event processed successfully' };
};
      `),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 1024,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE_NAME: props.globalTable.tableName,
        POWERTOOLS_SERVICE_NAME: 'trading-event-processor',
        POWERTOOLS_LOGGER_LOG_LEVEL: 'INFO',
        POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
        POWERTOOLS_METRICS_NAMESPACE: 'TradingSystem',
      },
      logGroup: logGroup,
    });

    new cdk.CfnOutput(this, 'ProcessingLambdaArn', {
      value: this.processingLambda.functionArn,
      description: 'ARN of the Trading Event Processing Lambda',
      exportName: `trading-lambda-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ProcessingLambdaName', {
      value: this.processingLambda.functionName,
      description: 'Name of the Trading Event Processing Lambda',
      exportName: `trading-lambda-name-${suffix}`,
    });
  }
}
