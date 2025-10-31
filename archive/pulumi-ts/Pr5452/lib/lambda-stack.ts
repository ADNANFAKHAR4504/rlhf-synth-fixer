/**
 * lambda-stack.ts
 *
 * Lambda functions for webhook processing and report generation.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tableName: pulumi.Input<string>;
  bucketName: pulumi.Input<string>;
  webhookLogGroupName: pulumi.Input<string>;
  reportLogGroupName: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly webhookLambda: aws.lambda.Function;
  public readonly reportLambda: aws.lambda.Function;
  public readonly webhookLambdaArn: pulumi.Output<string>;
  public readonly webhookLambdaName: pulumi.Output<string>;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, args, opts);

    // IAM role for webhook Lambda
    const webhookRole = new aws.iam.Role(
      `webhook-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Policy for webhook Lambda to access DynamoDB
    const webhookPolicy = new aws.iam.RolePolicy(
      `webhook-policy-${args.environmentSuffix}`,
      {
        role: webhookRole.id,
        policy: pulumi.all([args.tableName]).apply(([tableName]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['dynamodb:PutItem'],
                Resource: `arn:aws:dynamodb:ap-southeast-2:*:table/${tableName}`,
              },
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Webhook Lambda function
    this.webhookLambda = new aws.lambda.Function(
      `webhook-processor-${args.environmentSuffix}`,
      {
        name: `webhook-processor-${args.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: webhookRole.arn,
        memorySize: 512,
        timeout: 30,
        environment: {
          variables: {
            TABLE_NAME: args.tableName,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient({ region: 'ap-southeast-2' });

exports.handler = async (event) => {
  console.log('Received webhook:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body || '{}');
    const { amount, currency, provider } = body;

    // Validate required fields
    if (!amount || !currency || !provider) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'amount, currency, and provider are required',
        }),
      };
    }

    const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    const timestamp = Date.now();

    // Store in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: { S: transactionId },
        timestamp: { N: timestamp.toString() },
        amount: { N: amount.toString() },
        currency: { S: currency },
        provider: { S: provider },
        receivedAt: { S: new Date().toISOString() },
      },
    }));

    console.log('Transaction stored:', transactionId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        transactionId: transactionId,
        message: 'Webhook processed successfully',
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
          `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'webhook-processor',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.0.0',
              },
            })
          ),
        }),
        tags: args.tags,
      },
      { parent: this, dependsOn: [webhookPolicy] }
    );

    // IAM role for report Lambda
    const reportRole = new aws.iam.Role(
      `report-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Policy for report Lambda to access DynamoDB and S3
    const reportPolicy = new aws.iam.RolePolicy(
      `report-policy-${args.environmentSuffix}`,
      {
        role: reportRole.id,
        policy: pulumi
          .all([args.tableName, args.bucketName])
          .apply(([tableName, bucketName]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:Scan'],
                  Resource: `arn:aws:dynamodb:ap-southeast-2:*:table/${tableName}`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject'],
                  Resource: `arn:aws:s3:::${bucketName}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Report Lambda function
    this.reportLambda = new aws.lambda.Function(
      `report-generator-${args.environmentSuffix}`,
      {
        name: `report-generator-${args.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: reportRole.arn,
        memorySize: 512,
        timeout: 300,
        environment: {
          variables: {
            TABLE_NAME: args.tableName,
            BUCKET_NAME: args.bucketName,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamodb = new DynamoDBClient({ region: 'ap-southeast-2' });
const s3 = new S3Client({ region: 'ap-southeast-2' });

exports.handler = async (event) => {
  console.log('Generating daily report');

  try {
    // Scan DynamoDB for all transactions
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: process.env.TABLE_NAME,
    }));

    console.log(\`Found \${scanResult.Items.length} transactions\`);

    // Generate CSV
    let csv = 'Transaction ID,Timestamp,Amount,Currency,Provider,Received At\\n';

    for (const item of scanResult.Items) {
      const row = [
        item.transactionId?.S || '',
        item.timestamp?.N || '',
        item.amount?.N || '',
        item.currency?.S || '',
        item.provider?.S || '',
        item.receivedAt?.S || '',
      ].join(',');
      csv += row + '\\n';
    }

    // Upload to S3
    const date = new Date().toISOString().split('T')[0];
    const key = \`reports/transactions-\${date}.csv\`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: csv,
      ContentType: 'text/csv',
    }));

    console.log(\`Report uploaded to s3://\${process.env.BUCKET_NAME}/\${key}\`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        reportKey: key,
        transactionCount: scanResult.Items.length,
      }),
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};
          `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'report-generator',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.0.0',
                '@aws-sdk/client-s3': '^3.0.0',
              },
            })
          ),
        }),
        tags: args.tags,
      },
      { parent: this, dependsOn: [reportPolicy] }
    );

    // CloudWatch Events rule for daily report generation at 2 AM UTC
    const reportScheduleRule = new aws.cloudwatch.EventRule(
      `report-schedule-${args.environmentSuffix}`,
      {
        name: `report-schedule-${args.environmentSuffix}`,
        description: 'Trigger report generation daily at 2 AM UTC',
        scheduleExpression: 'cron(0 2 * * ? *)',
        tags: args.tags,
      },
      { parent: this }
    );

    // Target for the CloudWatch Events rule
    const reportScheduleTarget = new aws.cloudwatch.EventTarget(
      `report-schedule-target-${args.environmentSuffix}`,
      {
        rule: reportScheduleRule.name,
        arn: this.reportLambda.arn,
      },
      { parent: this }
    );

    // Permission for CloudWatch Events to invoke the Lambda
    const reportLambdaPermission = new aws.lambda.Permission(
      `report-lambda-permission-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: this.reportLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: reportScheduleRule.arn,
      },
      { parent: this }
    );

    // Ensure resources are created (prevent unused variable warnings)
    void reportScheduleTarget;
    void reportLambdaPermission;

    this.webhookLambdaArn = this.webhookLambda.arn;
    this.webhookLambdaName = this.webhookLambda.name;

    this.registerOutputs({
      webhookLambdaArn: this.webhookLambdaArn,
      webhookLambdaName: this.webhookLambdaName,
    });
  }
}
