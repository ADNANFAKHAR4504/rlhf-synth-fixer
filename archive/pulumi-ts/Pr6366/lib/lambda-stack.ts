/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * lambda-stack.ts
 * 
 * This module defines Lambda functions for payment processing with proper
 * IAM roles, security groups, and CloudWatch logging.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  dynamoTableName: pulumi.Input<string>;
  dynamoTableArn: pulumi.Input<string>;
  auditBucketName: pulumi.Input<string>;
  auditBucketArn: pulumi.Input<string>;
  snsTopicArn: pulumi.Input<string>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly validatorFunction: aws.lambda.Function;
  public readonly processorFunction: aws.lambda.Function;
  public readonly notifierFunction: aws.lambda.Function;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      vpcId,
      privateSubnetIds,
      dynamoTableName,
      dynamoTableArn,
      auditBucketName,
      auditBucketArn,
      snsTopicArn,
    } = args;

    // Create security group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for payment processing Lambda functions',
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-lambda-sg-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // ============================================================
    // PAYMENT VALIDATOR
    // ============================================================

    // Create IAM role for payment-validator Lambda
    const validatorRole = new aws.iam.Role(
      `payment-validator-role-${environmentSuffix}`,
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-validator-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `payment-validator-vpc-policy-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for validator
    new aws.iam.RolePolicy(
      `payment-validator-inline-policy-${environmentSuffix}`,
      {
        role: validatorRole.id,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "${dynamoTableArn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}`,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for validator
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/payment-validator-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `/aws/lambda/payment-validator-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Payment Validator Lambda Code
    const validatorCode = `/**
 * payment-validator Lambda function
 * 
 * Validates payment requests before processing.
 */
const { DynamoDBClient, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');

// CHANGE: Use AWS_REGION environment variable instead of hardcoded region
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamoTableName = process.env.DYNAMO_TABLE_NAME;

/**
 * Validate payment amount
 */
function validateAmount(amount) {
  if (!amount || amount <= 0) {
    return { valid: false, error: 'Invalid payment amount' };
  }
  if (amount > 1000000) {
    return { valid: false, error: 'Payment amount exceeds maximum limit' };
  }
  return { valid: true };
}

/**
 * Validate customer information
 */
function validateCustomer(customer) {
  if (!customer || !customer.customerId) {
    return { valid: false, error: 'Customer ID is required' };
  }
  if (!customer.customerEmail) {
    return { valid: false, error: 'Customer email is required' };
  }
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(customer.customerEmail)) {
    return { valid: false, error: 'Invalid customer email format' };
  }
  return { valid: true };
}

/**
 * Check for duplicate transactions
 */
async function checkDuplicateTransaction(transactionId) {
  try {
    const getItemCommand = new GetItemCommand({
      TableName: dynamoTableName,
      Key: {
        transactionId: { S: transactionId },
      },
    });
    const result = await dynamoClient.send(getItemCommand);
    return result.Item ? true : false;
  } catch (error) {
    console.error('Error checking duplicate transaction:', error);
    throw error;
  }
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received validation request:', JSON.stringify(event, null, 2));
  try {
    // Parse payment data
    const payment = typeof event === 'string' ? JSON.parse(event) : event;

    // Validate required fields
    if (!payment.transactionId) {
      return {
        valid: false,
        error: 'Transaction ID is required',
      };
    }

    // Validate amount
    const amountValidation = validateAmount(payment.amount);
    if (!amountValidation.valid) {
      return amountValidation;
    }

    // Validate customer
    const customerValidation = validateCustomer(payment.customer || {});
    if (!customerValidation.valid) {
      return customerValidation;
    }

    // Check for duplicate transaction
    const isDuplicate = await checkDuplicateTransaction(payment.transactionId);
    if (isDuplicate) {
      return {
        valid: false,
        error: 'Duplicate transaction detected',
      };
    }

    console.log('Payment validation successful');
    return {
      valid: true,
      message: 'Payment validation successful',
      transactionId: payment.transactionId,
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      error: error.message,
    };
  }
};`;

    // Create payment-validator Lambda function
    this.validatorFunction = new aws.lambda.Function(
      `payment-validator-${environmentSuffix}`,
      {
        name: `payment-validator-${environmentSuffix}`,
        role: validatorRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(validatorCode),
        }),
        environment: {
          variables: {
            DYNAMO_TABLE_NAME: dynamoTableName,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-validator-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this, dependsOn: [validatorLogGroup] }
    );

    // ============================================================
    // PAYMENT PROCESSOR
    // ============================================================

    // Create IAM role for payment-processor Lambda
    const processorRole = new aws.iam.Role(
      `payment-processor-role-${environmentSuffix}`,
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-processor-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `payment-processor-vpc-policy-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for processor
    new aws.iam.RolePolicy(
      `payment-processor-inline-policy-${environmentSuffix}`,
      {
        role: processorRole.id,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "${dynamoTableArn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "${auditBucketArn}/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}`,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for processor
    const processorLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/payment-processor-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `/aws/lambda/payment-processor-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Payment Processor Lambda Code
    const processorCode = `/**
 * payment-processor Lambda function
 * 
 * Processes validated payments and stores transaction records.
 */
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// CHANGE: Use AWS_REGION environment variable instead of hardcoded region
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoTableName = process.env.DYNAMO_TABLE_NAME;
const auditBucketName = process.env.AUDIT_BUCKET_NAME;

/**
 * Process payment transaction
 */
async function processPayment(payment) {
  const timestamp = new Date().toISOString();
  const transactionRecord = {
    transactionId: { S: payment.transactionId },
    amount: { N: payment.amount.toString() },
    currency: { S: payment.currency || 'USD' },
    customerId: { S: payment.customer.customerId },
    customerEmail: { S: payment.customer.customerEmail },
    status: { S: 'PROCESSING' },
    timestamp: { S: timestamp },
    ttl: { N: Math.floor(Date.now() / 1000 + 7 * 24 * 60 * 60).toString() }, // 7 days TTL
  };

  // Store transaction in DynamoDB
  const putItemCommand = new PutItemCommand({
    TableName: dynamoTableName,
    Item: transactionRecord,
  });
  await dynamoClient.send(putItemCommand);

  return transactionRecord;
}

/**
 * Update transaction status
 */
async function updateTransactionStatus(transactionId, status, details) {
  const updateCommand = new UpdateItemCommand({
    TableName: dynamoTableName,
    Key: {
      transactionId: { S: transactionId },
    },
    UpdateExpression: 'SET #status = :status, #details = :details, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#details': 'processingDetails',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':status': { S: status },
      ':details': { S: JSON.stringify(details) },
      ':updatedAt': { S: new Date().toISOString() },
    },
  });
  await dynamoClient.send(updateCommand);
}

/**
 * Store audit log in S3
 */
async function storeAuditLog(payment, transactionRecord, status) {
  const auditLog = {
    transactionId: payment.transactionId,
    timestamp: new Date().toISOString(),
    payment: payment,
    transactionRecord: transactionRecord,
    status: status,
  };

  const key = \`audit-logs/\${new Date().toISOString().split('T')[0]}/\${payment.transactionId}.json\`;
  const putObjectCommand = new PutObjectCommand({
    Bucket: auditBucketName,
    Key: key,
    Body: JSON.stringify(auditLog, null, 2),
    ContentType: 'application/json',
  });
  await s3Client.send(putObjectCommand);

  return key;
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received payment processing request:', JSON.stringify(event, null, 2));
  try {
    // Parse payment data
    const payment = typeof event === 'string' ? JSON.parse(event) : event;

    // Process payment
    const transactionRecord = await processPayment(payment);
    console.log('Payment processed successfully');

    // Simulate payment processing (in real scenario, this would call payment gateway)
    const processingSuccess = Math.random() > 0.1; // 90% success rate

    let finalStatus, processingDetails;
    if (processingSuccess) {
      finalStatus = 'SUCCESS';
      processingDetails = {
        processedAt: new Date().toISOString(),
        paymentGateway: 'mock-gateway',
        confirmationCode: \`CONF-\${Date.now()}\`,
      };
    } else {
      finalStatus = 'FAILED';
      processingDetails = {
        processedAt: new Date().toISOString(),
        paymentGateway: 'mock-gateway',
        failureReason: 'Insufficient funds',
      };
    }

    // Update transaction status
    await updateTransactionStatus(payment.transactionId, finalStatus, processingDetails);

    // Store audit log
    const auditLogKey = await storeAuditLog(payment, transactionRecord, finalStatus);

    console.log('Transaction completed:', finalStatus);
    return {
      success: finalStatus === 'SUCCESS',
      transactionId: payment.transactionId,
      status: finalStatus,
      processingDetails: processingDetails,
      auditLogKey: auditLogKey,
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};`;

    // Create payment-processor Lambda function
    this.processorFunction = new aws.lambda.Function(
      `payment-processor-${environmentSuffix}`,
      {
        name: `payment-processor-${environmentSuffix}`,
        role: processorRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(processorCode),
        }),
        environment: {
          variables: {
            DYNAMO_TABLE_NAME: dynamoTableName,
            AUDIT_BUCKET_NAME: auditBucketName,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-processor-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this, dependsOn: [processorLogGroup] }
    );

    // ============================================================
    // PAYMENT NOTIFIER
    // ============================================================

    // Create IAM role for payment-notifier Lambda
    const notifierRole = new aws.iam.Role(
      `payment-notifier-role-${environmentSuffix}`,
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-notifier-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `payment-notifier-vpc-policy-${environmentSuffix}`,
      {
        role: notifierRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for notifier
    new aws.iam.RolePolicy(
      `payment-notifier-inline-policy-${environmentSuffix}`,
      {
        role: notifierRole.id,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "${snsTopicArn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}`,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for notifier
    const notifierLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/payment-notifier-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `/aws/lambda/payment-notifier-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Payment Notifier Lambda Code
    const notifierCode = `/**
 * payment-notifier Lambda function
 * 
 * Sends payment notifications via SNS for successful or failed transactions.
 */
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// CHANGE: Use AWS_REGION environment variable instead of hardcoded region
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const snsTopicArn = process.env.SNS_TOPIC_ARN;

/**
 * Send notification via SNS
 */
async function sendNotification(notification) {
  const message = {
    default: JSON.stringify(notification, null, 2),
    email: formatEmailMessage(notification),
  };

  const publishCommand = new PublishCommand({
    TopicArn: snsTopicArn,
    Subject: \`Payment Notification: \${notification.status}\`,
    Message: JSON.stringify(message),
    MessageStructure: 'json',
  });

  const result = await snsClient.send(publishCommand);
  return result.MessageId;
}

/**
 * Format email message
 */
function formatEmailMessage(notification) {
  let message = \`Payment Notification\\n\\n\`;
  message += \`Transaction ID: \${notification.transactionId}\\n\`;
  message += \`Status: \${notification.status}\\n\`;
  message += \`Amount: \${notification.amount} \${notification.currency}\\n\`;
  message += \`Customer Email: \${notification.customerEmail}\\n\`;
  message += \`Timestamp: \${notification.timestamp}\\n\\n\`;

  if (notification.status === 'SUCCESS') {
    message += \`The payment has been processed successfully.\\n\`;
  } else if (notification.status === 'FAILED') {
    message += \`The payment processing has failed.\\n\`;
    message += \`Reason: \${notification.failureReason || 'Unknown'}\\n\`;
  }

  return message;
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received payment notification request:', JSON.stringify(event, null, 2));
  try {
    // Parse notification data
    const notification = typeof event === 'string' ? JSON.parse(event) : event;

    // Validate required fields
    if (!notification.transactionId || !notification.status) {
      throw new Error('Missing required fields: transactionId or status');
    }

    // Send notification
    const messageId = await sendNotification(notification);
    console.log('Notification sent successfully:', messageId);

    return {
      success: true,
      message: 'Notification sent successfully',
      messageId,
      transactionId: notification.transactionId,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    };
  }
};`;

    // Create payment-notifier Lambda function
    this.notifierFunction = new aws.lambda.Function(
      `payment-notifier-${environmentSuffix}`,
      {
        name: `payment-notifier-${environmentSuffix}`,
        role: notifierRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(notifierCode),
        }),
        environment: {
          variables: {
            SNS_TOPIC_ARN: snsTopicArn,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-notifier-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this, dependsOn: [notifierLogGroup] }
    );

    // ============================================================
    // CLOUDWATCH ALARMS
    // ============================================================

    // Create CloudWatch alarms for Lambda errors
    [
      this.validatorFunction,
      this.processorFunction,
      this.notifierFunction,
    ].forEach((fn, idx) => {
      const functionNames = ['validator', 'processor', 'notifier'];
      const functionName = functionNames[idx];

      new aws.cloudwatch.MetricAlarm(
        `payment-${functionName}-error-alarm-${environmentSuffix}`,
        {
          name: `payment-${functionName}-errors-${environmentSuffix}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'Errors',
          namespace: 'AWS/Lambda',
          period: 60,
          statistic: 'Sum',
          threshold: 1,
          actionsEnabled: true,
          alarmActions: [snsTopicArn],
          dimensions: {
            FunctionName: fn.name,
          },
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-${functionName}-error-alarm-${environmentSuffix}`,
            EnvironmentSuffix: environmentSuffix,
          })),
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      validatorFunctionArn: this.validatorFunction.arn,
      processorFunctionArn: this.processorFunction.arn,
      notifierFunctionArn: this.notifierFunction.arn,
    });
  }
}
