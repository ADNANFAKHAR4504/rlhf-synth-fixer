import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';
import { KmsConstruct } from './kms-construct';

export interface LambdaConstructProps {
  environmentSuffix: string;
  memorySize: number;
  timeout: number;
  dynamoTable: dynamodb.Table;
  removalPolicy: cdk.RemovalPolicy;
  kmsKey: KmsConstruct;
}

export class LambdaConstruct extends Construct {
  public readonly function: NodejsFunction;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    // Create Dead Letter Queue with KMS encryption
    this.deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `lambda-dlq-${props.environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: props.removalPolicy,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: props.kmsKey.key,
    });

    // Create Lambda function
    this.function = new NodejsFunction(this, 'Function', {
      functionName: `serverless-function-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X, // Updated to latest LTS
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/handler.ts'),
      memorySize: props.memorySize,
      timeout: cdk.Duration.seconds(props.timeout),
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: this.deadLetterQueue,
      deadLetterQueueEnabled: true,
      maxEventAge: cdk.Duration.hours(2),
      retryAttempts: 2,
      environment: {
        TABLE_NAME: props.dynamoTable.tableName,
        ENVIRONMENT: props.environmentSuffix,
        REGION: cdk.Stack.of(this).region,
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        minify: false,
        sourceMap: true,
        sourcesContent: false,
        target: 'es2022', // Updated to latest ES target
        tsconfig: path.join(__dirname, '../../tsconfig.json'),
        externalModules: ['@aws-sdk/*'], // Externalize AWS SDK for better performance
      },
      logGroup: new logs.LogGroup(this, 'FunctionLogGroup', {
        logGroupName: `/aws/lambda/serverless-function-${props.environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: props.removalPolicy,
        encryptionKey: props.kmsKey.key,
      }),
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0, // Updated to latest version
    });

    // Grant permissions using least privilege principle
    props.dynamoTable.grantWriteData(this.function);

    // Additional specific permissions
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:Query', 'dynamodb:GetItem'],
        resources: [props.dynamoTable.tableArn],
      })
    );

    // Grant permissions for X-Ray
    this.function.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Add tags
    cdk.Tags.of(this.function).add('Project', 'ServerlessInfra');
    cdk.Tags.of(this.deadLetterQueue).add('Project', 'ServerlessInfra');
  }
}
