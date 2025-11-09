import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctions_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

interface ProcessingStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  apiGatewayId: string;
  databaseSecurityGroup: ec2.SecurityGroup;
  databaseEndpoint: string;
  databasePort: string;
}

export class ProcessingStack extends cdk.Stack {
  public readonly paymentValidationFunction: lambda.Function;
  public readonly paymentProcessingFunction: lambda.Function;
  public readonly paymentQueue: sqs.Queue;
  public readonly paymentDlq: sqs.Queue;
  public readonly paymentWorkflow: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: ProcessingStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      vpc,
      apiGatewayId,
      databaseSecurityGroup,
      databaseEndpoint,
      databasePort,
    } = props;

    // IAM role for Lambda functions
    const lambdaRole = new iam.Role(
      this,
      `ProcessingLambdaRole${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    // Add permissions for database access and SQS
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'rds-data:ExecuteStatement',
          'rds-data:BatchExecuteStatement',
          'rds-data:BeginTransaction',
          'rds-data:CommitTransaction',
          'rds-data:RollbackTransaction',
        ],
        resources: ['*'], // In production, restrict to specific cluster ARNs
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'sqs:SendMessage',
          'sqs:ReceiveMessage',
          'sqs:DeleteMessage',
          'sqs:GetQueueAttributes',
        ],
        resources: ['*'], // Will be restricted by resource-based policies
      })
    );

    // SQS queues for async processing
    this.paymentDlq = new sqs.Queue(this, `PaymentDlq${environmentSuffix}`, {
      queueName: `payment-processing-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.minutes(5),
    });

    this.paymentQueue = new sqs.Queue(
      this,
      `PaymentQueue${environmentSuffix}`,
      {
        queueName: `payment-processing-queue-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(4),
        visibilityTimeout: cdk.Duration.minutes(5),
        deadLetterQueue: {
          queue: this.paymentDlq,
          maxReceiveCount: 3,
        },
      }
    );

    // Lambda function for payment validation
    this.paymentValidationFunction = new lambda.Function(
      this,
      `PaymentValidation${environmentSuffix}`,
      {
        functionName: `payment-validation-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromInline(`
const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const rdsClient = new RDSDataClient({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  console.log('Payment validation event:', JSON.stringify(event, null, 2));

  try {
    // Extract payment data from API Gateway event
    const paymentData = JSON.parse(event.body || '{}');

    // Basic validation
    if (!paymentData.amount || !paymentData.currency || !paymentData.customerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: amount, currency, customerId'
        })
      };
    }

    // Validate payment amount
    if (paymentData.amount <= 0 || paymentData.amount > 1000000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid payment amount'
        })
      };
    }

    // Check customer credit limit (mock database check)
    const creditLimit = await checkCustomerCreditLimit(paymentData.customerId);

    if (paymentData.amount > creditLimit) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Payment exceeds customer credit limit'
        })
      };
    }

    // Queue for processing
    await queuePaymentForProcessing(paymentData);

    return {
      statusCode: 202,
      body: JSON.stringify({
        message: 'Payment validation successful, queued for processing',
        paymentId: paymentData.paymentId || generatePaymentId()
      })
    };

  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error during validation'
      })
    };
  }
};

async function checkCustomerCreditLimit(customerId) {
  // Mock implementation - in real scenario would query database
  const mockCreditLimits = {
    'customer-123': 50000,
    'customer-456': 100000,
  };

  return mockCreditLimits[customerId] || 10000; // Default 10k limit
}

async function queuePaymentForProcessing(paymentData) {
  const queueUrl = process.env.PAYMENT_QUEUE_URL;
  const paymentId = paymentData.paymentId || generatePaymentId();

  await sqsClient.send(new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({
      ...paymentData,
      paymentId,
      status: 'validated',
      timestamp: new Date().toISOString()
    }),
    MessageAttributes: {
      paymentId: {
        DataType: 'String',
        StringValue: paymentId
      },
      amount: {
        DataType: 'Number',
        StringValue: paymentData.amount.toString()
      }
    }
  }));

  return paymentId;
}

function generatePaymentId() {
  return 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
      `),
        handler: 'index.handler',
        role: lambdaRole,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [databaseSecurityGroup],
        timeout: cdk.Duration.minutes(2),
        memorySize: 256,
        environment: {
          PAYMENT_QUEUE_URL: this.paymentQueue.queueUrl,
          DATABASE_ENDPOINT: databaseEndpoint,
          DATABASE_PORT: databasePort,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
        reservedConcurrentExecutions: 10,
      }
    );

    // Lambda function for payment processing
    this.paymentProcessingFunction = new lambda.Function(
      this,
      `PaymentProcessing${environmentSuffix}`,
      {
        functionName: `payment-processing-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromInline(`
const { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand } = require('@aws-sdk/client-rds-data');
const { SQSClient, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

const rdsClient = new RDSDataClient({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  console.log('Payment processing event:', JSON.stringify(event, null, 2));

  for (const record of event.Records || []) {
    try {
      const paymentData = JSON.parse(record.body);
      const receiptHandle = record.receiptHandle;

      console.log('Processing payment:', paymentData.paymentId);

      // Process payment in database transaction
      await processPayment(paymentData);

      // Update payment status
      await updatePaymentStatus(paymentData.paymentId, 'completed');

      // Delete message from queue
      await sqsClient.send(new DeleteMessageCommand({
        QueueUrl: process.env.PAYMENT_QUEUE_URL,
        ReceiptHandle: receiptHandle
      }));

      console.log('Payment processed successfully:', paymentData.paymentId);

    } catch (error) {
      console.error('Payment processing error:', error);

      // Update payment status to failed
      if (record.body) {
        const paymentData = JSON.parse(record.body);
        await updatePaymentStatus(paymentData.paymentId, 'failed', error.message);
      }

      // Message will be retried or moved to DLQ based on SQS configuration
      throw error;
    }
  }
};

async function processPayment(paymentData) {
  // Begin transaction
  const transaction = await rdsClient.send(new BeginTransactionCommand({
    resourceArn: process.env.DATABASE_CLUSTER_ARN,
    secretArn: process.env.DATABASE_SECRET_ARN,
    database: 'paymentdb'
  }));

  try {
    // Insert payment record
    await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: 'paymentdb',
      sql: 'INSERT INTO payments (payment_id, customer_id, amount, currency, status, created_at) VALUES (:paymentId, :customerId, :amount, :currency, :status, :createdAt)',
      parameters: [
        { name: 'paymentId', value: { stringValue: paymentData.paymentId } },
        { name: 'customerId', value: { stringValue: paymentData.customerId } },
        { name: 'amount', value: { doubleValue: paymentData.amount } },
        { name: 'currency', value: { stringValue: paymentData.currency } },
        { name: 'status', value: { stringValue: 'processing' } },
        { name: 'createdAt', value: { stringValue: new Date().toISOString() } }
      ],
      transactionId: transaction.transactionId
    }));

    // Update customer balance (simplified)
    await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: 'paymentdb',
      sql: 'UPDATE customers SET balance = balance - :amount WHERE customer_id = :customerId',
      parameters: [
        { name: 'amount', value: { doubleValue: paymentData.amount } },
        { name: 'customerId', value: { stringValue: paymentData.customerId } }
      ],
      transactionId: transaction.transactionId
    }));

    // Commit transaction
    await rdsClient.send(new CommitTransactionCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      transactionId: transaction.transactionId
    }));

  } catch (error) {
    console.error('Database transaction error:', error);
    throw error;
  }
}

async function updatePaymentStatus(paymentId, status, errorMessage = null) {
  try {
    await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: 'paymentdb',
      sql: 'UPDATE payments SET status = :status, updated_at = :updatedAt, error_message = :errorMessage WHERE payment_id = :paymentId',
      parameters: [
        { name: 'status', value: { stringValue: status } },
        { name: 'updatedAt', value: { stringValue: new Date().toISOString() } },
        { name: 'errorMessage', value: { stringValue: errorMessage || '' } },
        { name: 'paymentId', value: { stringValue: paymentId } }
      ]
    });
  } catch (error) {
    console.error('Failed to update payment status:', error);
    // Don't throw here to avoid masking original error
  }
}
      `),
        handler: 'index.handler',
        role: lambdaRole,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [databaseSecurityGroup],
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          PAYMENT_QUEUE_URL: this.paymentQueue.queueUrl,
          DATABASE_ENDPOINT: databaseEndpoint,
          DATABASE_PORT: databasePort,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
        reservedConcurrentExecutions: 5,
      }
    );

    // Connect API Gateway to validation Lambda
    // Import the API Gateway from the API stack
    const apiGateway = apigateway.RestApi.fromRestApiAttributes(
      this,
      `ImportedApi${environmentSuffix}`,
      {
        restApiId: apiGatewayId,
        rootResourceId: 'root', // This will be resolved at deploy time
      }
    );

    const paymentsResource = apiGateway.root.addResource('payments');
    const paymentResource = paymentsResource.addResource('{paymentId}');

    paymentsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.paymentValidationFunction)
    );

    paymentResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.paymentValidationFunction)
    );

    paymentResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(this.paymentValidationFunction)
    );

    // EventBridge rule for payment events
    const paymentEventRule = new events.Rule(
      this,
      `PaymentEventRule${environmentSuffix}`,
      {
        ruleName: `payment-events-${environmentSuffix}`,
        description: 'Route payment processing events',
        eventPattern: {
          source: ['payment.service'],
          detailType: ['Payment Processed', 'Payment Failed'],
        },
      }
    );

    // Add Lambda targets to EventBridge rule
    paymentEventRule.addTarget(
      new targets.LambdaFunction(this.paymentValidationFunction)
    );

    // Step Functions workflow for complex payment processing
    const validatePaymentTask = new stepfunctions_tasks.LambdaInvoke(
      this,
      'ValidatePayment',
      {
        lambdaFunction: this.paymentValidationFunction,
        outputPath: '$.Payload',
      }
    );

    const processPaymentTask = new stepfunctions_tasks.LambdaInvoke(
      this,
      'ProcessPayment',
      {
        lambdaFunction: this.paymentProcessingFunction,
        outputPath: '$.Payload',
      }
    );

    const definition = validatePaymentTask.next(processPaymentTask);

    this.paymentWorkflow = new stepfunctions.StateMachine(
      this,
      `PaymentWorkflow${environmentSuffix}`,
      {
        stateMachineName: `payment-processing-workflow-${environmentSuffix}`,
        definition,
        timeout: cdk.Duration.hours(1),
        tracingEnabled: true,
      }
    );

    // SQS event source for processing Lambda
    this.paymentProcessingFunction.addEventSourceMapping(
      `PaymentQueueMapping${environmentSuffix}`,
      {
        eventSourceArn: this.paymentQueue.queueArn,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(30),
      }
    );

    // Outputs for cross-stack references
    new cdk.CfnOutput(
      this,
      `PaymentValidationFunctionArn${environmentSuffix}`,
      {
        value: this.paymentValidationFunction.functionArn,
        exportName: `PaymentValidationFunction-${environmentSuffix}`,
      }
    );

    new cdk.CfnOutput(
      this,
      `PaymentProcessingFunctionArn${environmentSuffix}`,
      {
        value: this.paymentProcessingFunction.functionArn,
        exportName: `PaymentProcessingFunction-${environmentSuffix}`,
      }
    );

    new cdk.CfnOutput(this, `PaymentQueueUrl${environmentSuffix}`, {
      value: this.paymentQueue.queueUrl,
      exportName: `PaymentQueueUrl-${environmentSuffix}`,
    });
  }
}
