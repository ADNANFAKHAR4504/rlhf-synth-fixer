/**
 * ComputeStack - Lambda functions for payment processing
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ComputeStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  privateSubnetIds: pulumi.Output<string>[];
  securityGroupId: pulumi.Output<string>;
  tableName: pulumi.Output<string>;
  bucketName: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly validatorLambdaArn: pulumi.Output<string>;
  public readonly processorLambdaArn: pulumi.Output<string>;
  public readonly notifierLambdaArn: pulumi.Output<string>;
  public readonly validatorLambdaName: pulumi.Output<string>;
  public readonly processorLambdaName: pulumi.Output<string>;
  public readonly notifierLambdaName: pulumi.Output<string>;

  private snsTopicArnInput: pulumi.Output<string>;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compute:ComputeStack', name, args, opts);

    const {
      environmentSuffix,
      privateSubnetIds,
      securityGroupId,
      tableName,
      bucketName,
      tags,
    } = args;
    this.snsTopicArnInput = args.snsTopicArn;

    // IAM Role for Lambda functions
    const lambdaRole = new aws.iam.Role(
      `payment-lambda-role-${environmentSuffix}`,
      {
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
        maxSessionDuration: 3600, // 1 hour
        tags,
      },
      { parent: this }
    );

    // IAM Policies for Lambda
    new aws.iam.RolePolicyAttachment(
      `payment-lambda-vpc-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    const lambdaPolicy = new aws.iam.RolePolicy(
      `payment-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([tableName, bucketName, this.snsTopicArnInput])
          .apply(([table, bucket, sns]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:PutItem',
                    'dynamodb:GetItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                  ],
                  Resource: `arn:aws:dynamodb:eu-south-2:*:table/${table}`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:GetObject'],
                  Resource: `arn:aws:s3:::${bucket}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: sns || '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: 'arn:aws:logs:*:*:*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Lambda Function: payment-validator
    const validatorFunction = new aws.lambda.Function(
      `payment-validator-${environmentSuffix}`,
      {
        name: `payment-validator-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 30,
        memorySize: 512,
        reservedConcurrentExecutions: 10,
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [securityGroupId],
        },
        environment: {
          variables: {
            TABLE_NAME: tableName,
            BUCKET_NAME: bucketName,
            REGION: 'eu-south-2',
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Payment Validator - Processing request:', JSON.stringify(event));

  const body = JSON.parse(event.body || '{}');

  // Validation logic
  if (!body.amount || !body.currency || !body.paymentMethod) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields: amount, currency, or paymentMethod'
      }),
    };
  }

  if (body.amount <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Amount must be positive' }),
    };
  }

  // Generate transaction ID
  const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Payment validation successful',
      transactionId,
      status: 'validated',
      amount: body.amount,
      currency: body.currency,
    }),
  };
};
        `),
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-validator-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    this.validatorLambdaArn = validatorFunction.arn;
    this.validatorLambdaName = validatorFunction.name;

    // Lambda Function: payment-processor
    const processorFunction = new aws.lambda.Function(
      `payment-processor-${environmentSuffix}`,
      {
        name: `payment-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 30,
        memorySize: 512,
        reservedConcurrentExecutions: 10,
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [securityGroupId],
        },
        environment: {
          variables: {
            TABLE_NAME: tableName,
            BUCKET_NAME: bucketName,
            REGION: 'eu-south-2',
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamodb = new DynamoDBClient({ region: process.env.REGION });
const s3 = new S3Client({ region: process.env.REGION });

exports.handler = async (event) => {
  console.log('Payment Processor - Processing transaction:', JSON.stringify(event));

  const body = JSON.parse(event.body || '{}');
  const transactionId = body.transactionId || \`txn-\${Date.now()}\`;
  const timestamp = Date.now();

  try {
    // Store transaction in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: { S: transactionId },
        timestamp: { N: timestamp.toString() },
        amount: { N: (body.amount || 0).toString() },
        currency: { S: body.currency || 'USD' },
        status: { S: 'processed' },
        processedAt: { S: new Date().toISOString() },
      },
    }));

    // Log to S3 for audit
    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: \`transactions/\${transactionId}.json\`,
      Body: JSON.stringify({
        transactionId,
        timestamp,
        amount: body.amount,
        currency: body.currency,
        status: 'processed',
        processedAt: new Date().toISOString(),
      }),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment processed successfully',
        transactionId,
        status: 'processed',
      }),
    };
  } catch (error) {
    console.error('Processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Payment processing failed' }),
    };
  }
};
        `),
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-processor-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    this.processorLambdaArn = processorFunction.arn;
    this.processorLambdaName = processorFunction.name;

    // Lambda Function: payment-notifier
    const notifierFunction = new aws.lambda.Function(
      `payment-notifier-${environmentSuffix}`,
      {
        name: `payment-notifier-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 30,
        memorySize: 512,
        reservedConcurrentExecutions: 10,
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [securityGroupId],
        },
        environment: {
          variables: {
            SNS_TOPIC_ARN: this.snsTopicArnInput,
            REGION: 'eu-south-2',
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({ region: process.env.REGION });

exports.handler = async (event) => {
  console.log('Payment Notifier - Sending notification:', JSON.stringify(event));

  const body = JSON.parse(event.body || '{}');

  try {
    if (process.env.SNS_TOPIC_ARN && process.env.SNS_TOPIC_ARN !== '') {
      await sns.send(new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: 'Payment Notification',
        Message: JSON.stringify({
          transactionId: body.transactionId,
          status: body.status || 'completed',
          amount: body.amount,
          currency: body.currency,
          timestamp: new Date().toISOString(),
        }, null, 2),
      }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notification sent successfully',
        transactionId: body.transactionId,
      }),
    };
  } catch (error) {
    console.error('Notification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Notification failed' }),
    };
  }
};
        `),
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-notifier-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    this.notifierLambdaArn = notifierFunction.arn;
    this.notifierLambdaName = notifierFunction.name;

    this.registerOutputs({
      validatorLambdaArn: this.validatorLambdaArn,
      processorLambdaArn: this.processorLambdaArn,
      notifierLambdaArn: this.notifierLambdaArn,
      validatorLambdaName: this.validatorLambdaName,
      processorLambdaName: this.processorLambdaName,
      notifierLambdaName: this.notifierLambdaName,
    });
  }

  public setSnsTopicArn(arn: pulumi.Output<string>) {
    this.snsTopicArnInput = arn;
  }
}
