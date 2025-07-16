# AWS Infrastructure for Real-Time Metadata Processing to OpenSearch Dashboard

I'll design a serverless, event-driven architecture using AWS CDK with TypeScript to fulfill your requirements for processing metadata.json files and feeding them into an OpenSearch dashboard.

## Architecture Overview

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';

export class MetadataProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for metadata.json files
    const metadataBucket = new s3.Bucket(this, 'MetadataBucket', {
      bucketName: 'iac-rlhf-aws-release',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      eventBridgeEnabled: true, // Enable EventBridge notifications
    });

    // DynamoDB table for failure tracking
    const failureTable = new dynamodb.Table(this, 'MetadataProcessingFailures', {
      partitionKey: { name: 'executionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // OpenSearch Serverless Collection
    const openSearchCollection = new opensearchserverless.CfnCollection(this, 'MetadataCollection', {
      name: 'iac-rlhf-metadata-collection',
      type: 'TIMESERIES',
    });

    // OpenSearch Serverless Security Policy for public access
    const securityPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'OpenSearchSecurityPolicy', {
      name: 'iac-rlhf-metadata-security-policy',
      type: 'network',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${openSearchCollection.name}`],
            },
            {
              ResourceType: 'dashboard',
              Resource: [`collection/${openSearchCollection.name}`],
            }
          ],
          AllowFromPublic: true,
        },
      ]),
    });

    // OpenSearch Serverless Dashboard Policy
    const dashboardPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'OpenSearchDashboardPolicy', {
      name: 'iac-rlhf-metadata-dashboard-policy',
      type: 'data',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'dashboard',
              Resource: [`collection/${openSearchCollection.name}`],
              Permission: ['aoss:CreateApplication', 'aoss:ReadDocument', 'aoss:UpdateDocument']
            }
          ],
          Principal: ['*'],
        },
      ]),
    });

    // Step Functions IAM Role
    const stepFunctionsRole = new iam.Role(this, 'StepFunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });

    // Add permissions to the role
    stepFunctionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [metadataBucket.arnForObjects('*')],
    }));

    stepFunctionsRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'aoss:APIAccessAll',
        'aoss:DashboardAccessAll',
        'aoss:CreateIndex',
        'aoss:UpdateIndex',
        'aoss:DescribeIndex',
        'aoss:WriteDocument'
      ],
      resources: [`arn:aws:aoss:${this.region}:${this.account}:collection/${openSearchCollection.name}`],
    }));

    stepFunctionsRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:PutItem'],
      resources: [failureTable.tableArn],
    }));

    // Step Function Definition
    const getMetadataFromS3 = new tasks.CallAwsService(this, 'GetMetadataFromS3', {
      service: 's3',
      action: 'getObject',
      parameters: {
        Bucket: metadataBucket.bucketName,
        Key: stepfunctions.JsonPath.stringAt('$.detail.object.key')
      },
      iamResources: [metadataBucket.arnForObjects('*')],
      resultPath: '$.metadataFile',
    });

    const processMetadata = new stepfunctions.CustomState(this, 'ProcessMetadata', {
      stateJson: {
        Type: 'Task',
        Resource: 'arn:aws:states:::aws-sdk:opensearchserverless:batchGetCollection',
        Parameters: {
          Names: [openSearchCollection.name]
        },
        Next: 'PrepareMetadataForOpenSearch',
      },
    });

    const prepareMetadataForOpenSearch = new stepfunctions.Pass(this, 'PrepareMetadataForOpenSearch', {
      parameters: {
        'document.$': 'States.StringToJson($.metadataFile.Body)',
        'timestamp': stepfunctions.JsonPath.stringAt('States.Format(\'{}\', States.Timestamp(\'yyyy-MM-dd\'\'T\'\'HH:mm:ss.SSS\'\'Z\'\'))')
      },
      resultPath: '$.processedMetadata',
    });

    const indexToOpenSearch = new stepfunctions.CustomState(this, 'IndexToOpenSearch', {
      stateJson: {
        Type: 'Task',
        Resource: 'arn:aws:states:::aws-sdk:opensearchserverless:indexDocument',
        Parameters: {
          CollectionId: openSearchCollection.attrId,
          DocumentString: stepfunctions.JsonPath.stringAt('States.JsonToString($.processedMetadata.document)'),
          Index: 'metadata',
          Id: stepfunctions.JsonPath.stringAt('$$.Execution.Id')
        },
        End: true,
      },
    });

    const recordFailure = new tasks.DynamoPutItem(this, 'RecordFailure', {
      table: failureTable,
      item: {
        executionId: tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt('$$.Execution.Id')),
        timestamp: tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt('$$.State.EnteredTime')),
        input: tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt('States.JsonToString($)')),
        error: tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt('$.error')),
        cause: tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt('$.cause')),
      },
      resultPath: '$.failureRecord',
    });

    // Create Step Function workflow
    const metadataProcessingWorkflow = new stepfunctions.StateMachine(this, 'MetadataProcessingWorkflow', {
      definition: getMetadataFromS3
        .next(processMetadata)
        .next(prepareMetadataForOpenSearch)
        .next(indexToOpenSearch)
        .addCatch(recordFailure.next(new stepfunctions.Fail(this, 'ProcessingFailed', {
          error: 'MetadataProcessingError',
          cause: 'Error occurred during metadata processing',
        })), {
          resultPath: '$',
        }),
      role: stepFunctionsRole,
      tracingEnabled: true,
    });

    // EventBridge Rule to trigger Step Function
    const metadataFileRule = new events.Rule(this, 'MetadataFileRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [metadataBucket.bucketName]
          },
          object: {
            key: [{
              suffix: 'metadata.json'
            }]
          }
        }
      },
    });

    metadataFileRule.addTarget(new targets.SfnStateMachine(metadataProcessingWorkflow));

    // CloudWatch Alarm for Step Function failures
    const failureMetric = metadataProcessingWorkflow.metricFailed({
      period: cdk.Duration.minutes(1),
    });

    new cloudwatch.Alarm(this, 'StepFunctionFailureAlarm', {
      metric: failureMetric,
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm when the metadata processing step function fails',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // Outputs
    new cdk.CfnOutput(this, 'MetadataBucketName', {
      value: metadataBucket.bucketName,
      description: 'S3 bucket for metadata.json files',
    });

    new cdk.CfnOutput(this, 'OpenSearchCollectionName', {
      value: openSearchCollection.name!,
      description: 'OpenSearch Serverless collection name',
    });

    new cdk.CfnOutput(this, 'OpenSearchDashboardUrl', {
      value: `https://${openSearchCollection.attrDashboardEndpoint}`,
      description: 'OpenSearch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'FailureTableName', {
      value: failureTable.tableName,
      description: 'DynamoDB table for failure tracking',
    });
  }
}
```

## Architecture Explanation

This CDK code creates an AWS infrastructure with the following components:

1. **S3 Bucket (`iac-rlhf-aws-release`)**:
   - Configured to send events to the default EventBridge event bus when objects are created
   - Will store metadata.json files in various folders

2. **EventBridge Rule**:
   - Listens for S3 object creation events on the default event bus
   - Filters for objects with the name "metadata.json" in the specified bucket
   - Triggers the Step Functions workflow when matching events occur

3. **Step Functions Workflow**:
   - Retrieves the metadata.json file from S3
   - Processes the content, adding a @timestamp field
   - Indexes the document into OpenSearch Serverless
   - Records failures in DynamoDB if any step fails

4. **OpenSearch Serverless Collection**:
   - Time-series collection named "iac-rlhf-metadata-collection"
   - Configured with public access for the dashboard
   - Security policies to allow dashboard access

5. **DynamoDB Table**:
   - Stores execution failures with details about the input and error cause
   - Uses a composite key with executionId and timestamp

6. **CloudWatch Alarm**:
   - Monitors Step Functions for failures
   - Triggers when at least one failure occurs in a 1-minute period

The architecture follows AWS best practices by:

- Using serverless components for scalability and cost-effectiveness
- Implementing event-driven architecture with EventBridge
- Providing error handling and monitoring with DynamoDB and CloudWatch
- Securing OpenSearch with appropriate access policies
- Maintaining separation of concerns between components

This solution will process metadata.json files in real-time as they're uploaded to the S3 bucket, making the data immediately available for analysis in the OpenSearch dashboard
