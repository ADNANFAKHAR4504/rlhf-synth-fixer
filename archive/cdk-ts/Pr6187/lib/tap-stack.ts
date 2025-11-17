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
    const transactionsRawTable = new dynamodb.Table(
      this,
      'TransactionsRawTable',
      {
        tableName: `transactions-raw-${environmentSuffix}`,
        partitionKey: {
          name: 'transactionId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable without retain
      }
    );

    const transactionsProcessedTable = new dynamodb.Table(
      this,
      'TransactionsProcessedTable',
      {
        tableName: `transactions-processed-${environmentSuffix}`,
        partitionKey: {
          name: 'transactionId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable without retain
      }
    );

    // Apply tags to DynamoDB tables
    cdk.Tags.of(transactionsRawTable).add(
      'Environment',
      resourceTags.Environment
    );
    cdk.Tags.of(transactionsRawTable).add(
      'Application',
      resourceTags.Application
    );
    cdk.Tags.of(transactionsProcessedTable).add(
      'Environment',
      resourceTags.Environment
    );
    cdk.Tags.of(transactionsProcessedTable).add(
      'Application',
      resourceTags.Application
    );

    // Lambda Functions with exact specifications
    const fraudDetectorFunction = new lambda.Function(
      this,
      'FraudDetectorFunction',
      {
        functionName: `fraud-detector-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda/fraud-detector')
        ),
        memorySize: 512,
        timeout: cdk.Duration.seconds(60),
        environment: {
          TRANSACTIONS_RAW_TABLE: transactionsRawTable.tableName,
          TRANSACTIONS_PROCESSED_TABLE: transactionsProcessedTable.tableName,
        },
      }
    );

    const complianceCheckerFunction = new lambda.Function(
      this,
      'ComplianceCheckerFunction',
      {
        functionName: `compliance-checker-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda/compliance-checker')
        ),
        memorySize: 512,
        timeout: cdk.Duration.seconds(60),
        environment: {
          TRANSACTIONS_RAW_TABLE: transactionsRawTable.tableName,
          TRANSACTIONS_PROCESSED_TABLE: transactionsProcessedTable.tableName,
        },
      }
    );

    const riskAssessorFunction = new lambda.Function(
      this,
      'RiskAssessorFunction',
      {
        functionName: `risk-assessor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda/risk-assessor')
        ),
        memorySize: 512,
        timeout: cdk.Duration.seconds(60),
        environment: {
          TRANSACTIONS_RAW_TABLE: transactionsRawTable.tableName,
          TRANSACTIONS_PROCESSED_TABLE: transactionsProcessedTable.tableName,
        },
      }
    );

    // Apply tags to Lambda functions
    cdk.Tags.of(fraudDetectorFunction).add(
      'Environment',
      resourceTags.Environment
    );
    cdk.Tags.of(fraudDetectorFunction).add(
      'Application',
      resourceTags.Application
    );
    cdk.Tags.of(complianceCheckerFunction).add(
      'Environment',
      resourceTags.Environment
    );
    cdk.Tags.of(complianceCheckerFunction).add(
      'Application',
      resourceTags.Application
    );
    cdk.Tags.of(riskAssessorFunction).add(
      'Environment',
      resourceTags.Environment
    );
    cdk.Tags.of(riskAssessorFunction).add(
      'Application',
      resourceTags.Application
    );

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

    const complianceCheckerTask = new tasks.LambdaInvoke(
      this,
      'ComplianceCheck',
      {
        lambdaFunction: complianceCheckerFunction,
        outputPath: '$.Payload',
        retryOnServiceExceptions: true,
      }
    );

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
    const stateMachine = new sfn.StateMachine(
      this,
      'TransactionProcessorStateMachine',
      {
        stateMachineName: `transaction-processor-${environmentSuffix}`,
        definition: mapState,
        logs: {
          destination: logGroup,
          level: sfn.LogLevel.ALL,
          includeExecutionData: true,
        },
        tracingEnabled: true,
      }
    );

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
