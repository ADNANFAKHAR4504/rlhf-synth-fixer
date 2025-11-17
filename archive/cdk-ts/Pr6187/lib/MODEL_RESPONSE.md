# Serverless Transaction Processing Pipeline Implementation

Complete AWS CDK TypeScript implementation for a serverless transaction processing pipeline with Lambda functions, Step Functions, and DynamoDB.

## Architecture Overview

This solution implements:
- 3 Lambda functions (fraud-detector, compliance-checker, risk-assessor) with Node.js 18.x
- Step Functions state machine with Map state for parallel batch processing
- 2 DynamoDB tables (transactions-raw, transactions-processed) with on-demand billing
- CloudWatch Logs with 30-day retention
- Error handling with exponential backoff (2s, 4s, 8s)
- Proper tagging (Environment=production, Application=transaction-processor)

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Tags to apply to all resources
    const resourceTags = {
      Environment: 'production',
      Application: 'transaction-processor',
    };

    // DynamoDB Tables with on-demand billing
    const transactionsRawTable = new dynamodb.Table(this, 'TransactionsRawTable', {
      tableName: `transactions-raw-${environmentSuffix}`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable without retain
    });

    const transactionsProcessedTable = new dynamodb.Table(this, 'TransactionsProcessedTable', {
      tableName: `transactions-processed-${environmentSuffix}`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable without retain
    });

    // Apply tags to DynamoDB tables
    cdk.Tags.of(transactionsRawTable).add('Environment', resourceTags.Environment);
    cdk.Tags.of(transactionsRawTable).add('Application', resourceTags.Application);
    cdk.Tags.of(transactionsProcessedTable).add('Environment', resourceTags.Environment);
    cdk.Tags.of(transactionsProcessedTable).add('Application', resourceTags.Application);

    // Lambda Functions with exact specifications
    const fraudDetectorFunction = new lambda.Function(this, 'FraudDetectorFunction', {
      functionName: `fraud-detector-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/fraud-detector')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      environment: {
        TRANSACTIONS_RAW_TABLE: transactionsRawTable.tableName,
        TRANSACTIONS_PROCESSED_TABLE: transactionsProcessedTable.tableName,
      },
    });

    const complianceCheckerFunction = new lambda.Function(this, 'ComplianceCheckerFunction', {
      functionName: `compliance-checker-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/compliance-checker')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      environment: {
        TRANSACTIONS_RAW_TABLE: transactionsRawTable.tableName,
        TRANSACTIONS_PROCESSED_TABLE: transactionsProcessedTable.tableName,
      },
    });

    const riskAssessorFunction = new lambda.Function(this, 'RiskAssessorFunction', {
      functionName: `risk-assessor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/risk-assessor')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      environment: {
        TRANSACTIONS_RAW_TABLE: transactionsRawTable.tableName,
        TRANSACTIONS_PROCESSED_TABLE: transactionsProcessedTable.tableName,
      },
    });

    // Apply tags to Lambda functions
    cdk.Tags.of(fraudDetectorFunction).add('Environment', resourceTags.Environment);
    cdk.Tags.of(fraudDetectorFunction).add('Application', resourceTags.Application);
    cdk.Tags.of(complianceCheckerFunction).add('Environment', resourceTags.Environment);
    cdk.Tags.of(complianceCheckerFunction).add('Application', resourceTags.Application);
    cdk.Tags.of(riskAssessorFunction).add('Environment', resourceTags.Environment);
    cdk.Tags.of(riskAssessorFunction).add('Application', resourceTags.Application);

    // Grant DynamoDB permissions to Lambda functions
    transactionsRawTable.grantReadData(fraudDetectorFunction);
    transactionsRawTable.grantReadData(complianceCheckerFunction);
    transactionsRawTable.grantReadData(riskAssessorFunction);
    transactionsProcessedTable.grantWriteData(fraudDetectorFunction);
    transactionsProcessedTable.grantWriteData(complianceCheckerFunction);
    transactionsProcessedTable.grantWriteData(riskAssessorFunction);

    // Step Functions Tasks with retry logic
    const fraudDetectorTask = new tasks.LambdaInvoke(this, 'FraudDetection', {
      lambdaFunction: fraudDetectorFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    // Add retry with exponential backoff
    fraudDetectorTask.addRetry({
      errors: ['States.ALL'],
      maxAttempts: 3,
      backoffRate: 2,
      interval: cdk.Duration.seconds(2),
    });

    const complianceCheckerTask = new tasks.LambdaInvoke(this, 'ComplianceCheck', {
      lambdaFunction: complianceCheckerFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    complianceCheckerTask.addRetry({
      errors: ['States.ALL'],
      maxAttempts: 3,
      backoffRate: 2,
      interval: cdk.Duration.seconds(2),
    });

    const riskAssessorTask = new tasks.LambdaInvoke(this, 'RiskAssessment', {
      lambdaFunction: riskAssessorFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    riskAssessorTask.addRetry({
      errors: ['States.ALL'],
      maxAttempts: 3,
      backoffRate: 2,
      interval: cdk.Duration.seconds(2),
    });

    // Sequential processing chain
    const processingChain = fraudDetectorTask
      .next(complianceCheckerTask)
      .next(riskAssessorTask);

    // Map state for parallel processing of transaction batches
    const mapState = new sfn.Map(this, 'ProcessTransactionBatch', {
      maxConcurrency: 10,
      itemsPath: '$.transactions',
      resultPath: '$.results',
    });

    mapState.iterator(processingChain);

    // CloudWatch Log Group for Step Functions
    const logGroup = new logs.LogGroup(this, 'StateMachineLogGroup', {
      logGroupName: `/aws/vendedlogs/states/transaction-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH, // 30-day retention
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(logGroup).add('Environment', resourceTags.Environment);
    cdk.Tags.of(logGroup).add('Application', resourceTags.Application);

    // Step Functions State Machine
    const stateMachine = new sfn.StateMachine(this, 'TransactionProcessorStateMachine', {
      stateMachineName: `transaction-processor-${environmentSuffix}`,
      definition: mapState,
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
      tracingEnabled: true,
    });

    cdk.Tags.of(stateMachine).add('Environment', resourceTags.Environment);
    cdk.Tags.of(stateMachine).add('Application', resourceTags.Application);

    // Outputs
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Transaction Processor State Machine ARN',
      exportName: `transaction-processor-state-machine-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransactionsRawTableName', {
      value: transactionsRawTable.tableName,
      description: 'Transactions Raw Table Name',
      exportName: `transactions-raw-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransactionsProcessedTableName', {
      value: transactionsProcessedTable.tableName,
      description: 'Transactions Processed Table Name',
      exportName: `transactions-processed-table-${environmentSuffix}`,
    });
  }
}
```

## File: lib/lambda/fraud-detector/index.js

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Fraud Detector - Processing transaction:', JSON.stringify(event, null, 2));

  const transactionId = event.transactionId || event.transaction?.transactionId;
  const amount = event.amount || event.transaction?.amount || 0;

  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  // Fraud detection logic
  const isFraudulent = amount > 10000; // Simple rule: flag large transactions
  const fraudScore = isFraudulent ? 0.95 : 0.05;

  const result = {
    transactionId,
    amount,
    fraudDetection: {
      status: isFraudulent ? 'FLAGGED' : 'PASSED',
      fraudScore,
      timestamp: new Date().toISOString(),
    },
  };

  // Store intermediate result in processed table
  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.TRANSACTIONS_PROCESSED_TABLE,
        Item: {
          transactionId,
          step: 'fraud-detection',
          ...result,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error('Error storing fraud detection result:', error);
    throw error;
  }

  console.log('Fraud detection complete:', result);
  return result;
};
```

## File: lib/lambda/fraud-detector/package.json

```json
{
  "name": "fraud-detector",
  "version": "1.0.0",
  "description": "Fraud detection Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  }
}
```

## File: lib/lambda/compliance-checker/index.js

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Compliance Checker - Processing transaction:', JSON.stringify(event, null, 2));

  const transactionId = event.transactionId;
  const amount = event.amount || 0;
  const fraudDetection = event.fraudDetection || {};

  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  // Compliance check logic
  const requiresReview = amount > 5000 || fraudDetection.status === 'FLAGGED';
  const complianceStatus = requiresReview ? 'REVIEW_REQUIRED' : 'COMPLIANT';

  const result = {
    ...event,
    complianceCheck: {
      status: complianceStatus,
      requiresReview,
      checkedAt: new Date().toISOString(),
    },
  };

  // Store intermediate result
  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.TRANSACTIONS_PROCESSED_TABLE,
        Item: {
          transactionId,
          step: 'compliance-check',
          ...result,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error('Error storing compliance check result:', error);
    throw error;
  }

  console.log('Compliance check complete:', result);
  return result;
};
```

## File: lib/lambda/compliance-checker/package.json

```json
{
  "name": "compliance-checker",
  "version": "1.0.0",
  "description": "Compliance checker Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  }
}
```

## File: lib/lambda/risk-assessor/index.js

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Risk Assessor - Processing transaction:', JSON.stringify(event, null, 2));

  const transactionId = event.transactionId;
  const amount = event.amount || 0;
  const fraudDetection = event.fraudDetection || {};
  const complianceCheck = event.complianceCheck || {};

  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  // Risk assessment logic
  let riskLevel = 'LOW';
  let riskScore = 0.1;

  if (fraudDetection.status === 'FLAGGED') {
    riskLevel = 'HIGH';
    riskScore = 0.9;
  } else if (complianceCheck.status === 'REVIEW_REQUIRED') {
    riskLevel = 'MEDIUM';
    riskScore = 0.5;
  } else if (amount > 1000) {
    riskLevel = 'MEDIUM';
    riskScore = 0.4;
  }

  const finalResult = {
    ...event,
    riskAssessment: {
      riskLevel,
      riskScore,
      assessedAt: new Date().toISOString(),
    },
    processingComplete: true,
    finalTimestamp: new Date().toISOString(),
  };

  // Store final result in processed table
  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.TRANSACTIONS_PROCESSED_TABLE,
        Item: {
          transactionId,
          step: 'risk-assessment',
          ...finalResult,
          completedAt: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error('Error storing risk assessment result:', error);
    throw error;
  }

  console.log('Risk assessment complete:', finalResult);
  return finalResult;
};
```

## File: lib/lambda/risk-assessor/package.json

```json
{
  "name": "risk-assessor",
  "version": "1.0.0",
  "description": "Risk assessor Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  }
}
```

## File: lib/README.md

```markdown
# Serverless Transaction Processing Pipeline

A serverless transaction processing pipeline built with AWS CDK, Step Functions, Lambda, and DynamoDB.

## Architecture

This solution processes financial transactions through three sequential validation steps:

1. **Fraud Detection** - Analyzes transactions for fraudulent patterns
2. **Compliance Check** - Validates regulatory compliance requirements
3. **Risk Assessment** - Calculates overall risk score

### AWS Services Used

- **AWS Lambda**: Three Node.js 18.x functions (512MB, 60s timeout)
- **AWS Step Functions**: Orchestrates workflow with Map state for batch processing
- **Amazon DynamoDB**: Two tables (transactions-raw, transactions-processed) with on-demand billing
- **Amazon CloudWatch**: Logs with 30-day retention for execution history
- **AWS IAM**: Managed roles and permissions

### Key Features

- Parallel batch processing using Step Functions Map state
- Error handling with exponential backoff (2s, 4s, 8s intervals)
- Three retry attempts for each Lambda invocation
- Full execution logging to CloudWatch
- Resource tagging: Environment=production, Application=transaction-processor
- Unique resource naming with environmentSuffix

## Prerequisites

- Node.js 18.x or later
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- TypeScript

## Installation

```bash
npm install
```

## Deployment

Deploy with environment suffix:

```bash
cdk deploy -c environmentSuffix=prod
```

Or use default (dev):

```bash
cdk deploy
```

## Testing the Pipeline

Create a test execution with sample transactions:

```bash
aws stepfunctions start-execution \
  --state-machine-arn <STATE_MACHINE_ARN> \
  --input '{
    "transactions": [
      {
        "transactionId": "txn-001",
        "amount": 1500,
        "currency": "USD"
      },
      {
        "transactionId": "txn-002",
        "amount": 15000,
        "currency": "USD"
      }
    ]
  }'
```

## Monitoring

View execution logs in CloudWatch:

```bash
aws logs tail /aws/vendedlogs/states/transaction-processor-<environmentSuffix> --follow
```

## DynamoDB Tables

### transactions-raw
- Partition Key: transactionId (String)
- Billing: On-demand
- Purpose: Store incoming raw transactions

### transactions-processed
- Partition Key: transactionId (String)
- Billing: On-demand
- Purpose: Store processed transactions with validation results

## Lambda Functions

### fraud-detector
- Memory: 512MB
- Timeout: 60 seconds
- Runtime: Node.js 18.x
- Function: Detects fraudulent transactions (flags amounts > $10,000)

### compliance-checker
- Memory: 512MB
- Timeout: 60 seconds
- Runtime: Node.js 18.x
- Function: Validates compliance (reviews amounts > $5,000)

### risk-assessor
- Memory: 512MB
- Timeout: 60 seconds
- Runtime: Node.js 18.x
- Function: Calculates final risk score (LOW/MEDIUM/HIGH)

## Error Handling

Each Lambda invocation includes:
- 3 retry attempts
- Exponential backoff starting at 2 seconds
- Backoff rate: 2x (2s → 4s → 8s)

## Cleanup

Remove all resources:

```bash
cdk destroy -c environmentSuffix=<your-suffix>
```

## Resource Tagging

All resources tagged with:
- Environment: production
- Application: transaction-processor

## Outputs

After deployment, you'll receive:
- State Machine ARN
- Transactions Raw Table Name
- Transactions Processed Table Name
```

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   cd lib/lambda/fraud-detector && npm install && cd ../../..
   cd lib/lambda/compliance-checker && npm install && cd ../../..
   cd lib/lambda/risk-assessor && npm install && cd ../../..
   ```

2. Deploy the stack:
   ```bash
   cdk deploy -c environmentSuffix=<your-suffix>
   ```

3. Test the pipeline using the AWS CLI or Step Functions console

## Notes

- All Lambda functions use Node.js 18.x runtime with exactly 512MB memory and 60-second timeout
- DynamoDB tables use on-demand billing mode for cost optimization
- Step Functions uses Map state for parallel transaction processing
- Error handling includes 3 retries with exponential backoff (2s, 4s, 8s)
- CloudWatch Logs configured with 30-day retention
- All resources tagged with Environment=production and Application=transaction-processor
- Resource names include environmentSuffix for uniqueness
- No Retain policies - all resources are destroyable
