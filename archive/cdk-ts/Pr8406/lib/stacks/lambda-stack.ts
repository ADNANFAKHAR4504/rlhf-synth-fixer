import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface LambdaStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class LambdaStack extends Construct {
  public readonly dataProcessorFunction: lambda.Function;
  public readonly functionName: string;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id);

    const { environment, isPrimary } = props;
    const region = cdk.Stack.of(this).region;

    // Import existing resources from other stacks
    const dataIngestionBucket = s3.Bucket.fromBucketName(
      this,
      'ImportedDataIngestionBucket',
      `serverless-data-ingestion-${environment}-${region}`
    );

    const processedDataTable = dynamodb.Table.fromTableName(
      this,
      'ImportedProcessedDataTable',
      `serverless-processed-data-${environment}`
    );

    const deadLetterQueue = sqs.Queue.fromQueueArn(
      this,
      'ImportedDeadLetterQueue',
      `arn:aws:sqs:${region}:${cdk.Stack.of(this).account}:serverless-dlq-${environment}-${region}`
    );

    // Create Lambda function for data processing
    this.functionName = `serverless-data-processor-${environment}-${region}`;

    this.dataProcessorFunction = new lambda.Function(
      this,
      'DataProcessorFunction',
      {
        functionName: this.functionName,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda-functions/data-processor'),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          DYNAMODB_TABLE_NAME: processedDataTable.tableName,
          ENVIRONMENT: environment,
          IS_PRIMARY: isPrimary.toString(),
        },
        deadLetterQueue: deadLetterQueue,
        logGroup: new logs.LogGroup(this, 'DataProcessorLogGroup', {
          logGroupName: `/aws/lambda/${this.functionName}`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Grant permissions to Lambda function
    dataIngestionBucket.grantRead(this.dataProcessorFunction);
    deadLetterQueue.grantSendMessages(this.dataProcessorFunction);

    // Add explicit DynamoDB permissions since we're using an imported table reference
    this.dataProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [
          `arn:aws:dynamodb:${region}:${cdk.Stack.of(this).account}:table/serverless-processed-data-${environment}`,
          `arn:aws:dynamodb:${region}:${cdk.Stack.of(this).account}:table/serverless-processed-data-${environment}/index/*`,
        ],
      })
    );

    // Add additional IAM permissions for CloudWatch logging
    this.dataProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Add S3 event notification to trigger Lambda
    dataIngestionBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.dataProcessorFunction),
      {
        suffix: '.json',
      }
    );

    dataIngestionBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.dataProcessorFunction),
      {
        suffix: '.csv',
      }
    );

    // Add tags for cost allocation and governance
    cdk.Tags.of(this.dataProcessorFunction).add('Environment', environment);
    cdk.Tags.of(this.dataProcessorFunction).add('Service', 'DataProcessing');
    cdk.Tags.of(this.dataProcessorFunction).add('Region', region);
    cdk.Tags.of(this.dataProcessorFunction).add(
      'IsPrimary',
      isPrimary.toString()
    );

    // Output the function name and ARN
    new cdk.CfnOutput(this, 'DataProcessorFunctionName', {
      value: this.dataProcessorFunction.functionName,
      description: 'Name of the data processor Lambda function',
      exportName: `serverless-data-processor-function-name-${region}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionArn', {
      value: this.dataProcessorFunction.functionArn,
      description: 'ARN of the data processor Lambda function',
      exportName: `serverless-data-processor-function-arn-${region}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionRoleArn', {
      value: this.dataProcessorFunction.role?.roleArn || '',
      description: 'ARN of the data processor Lambda function role',
      exportName: `serverless-data-processor-function-role-arn-${region}`,
    });
  }
}
