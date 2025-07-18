import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

interface MetadataProcessingStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class MetadataProcessingStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: MetadataProcessingStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create a new S3 bucket for metadata files
    const metadataBucket = new s3.Bucket(this, 'MetadataBucket', {
      bucketName: `iac-rlhf-metadata-${environmentSuffix}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      autoDeleteObjects: true, // Automatically delete objects when bucket is deleted
    });

    // Note: EventBridge notifications need to be enabled on the existing bucket manually

    // DynamoDB table for failure tracking
    const failureTable = new dynamodb.Table(
      this,
      'MetadataProcessingFailures',
      {
        partitionKey: {
          name: 'executionId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // OpenSearch Serverless Collection
    const openSearchCollection = new opensearchserverless.CfnCollection(
      this,
      'MetadataCollection',
      {
        name: `iac-rlhf-metadata-coll-${environmentSuffix}`,
        type: 'TIMESERIES',
      }
    );

    // OpenSearch Serverless Security Policy for public access
    const securityPolicy = new opensearchserverless.CfnSecurityPolicy(
      this,
      'OpenSearchSecurityPolicy',
      {
        name: `iac-rlhf-metadata-net-${environmentSuffix}`,
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
              },
            ],
            AllowFromPublic: true,
          },
        ]),
      }
    );

    // OpenSearch Serverless Encryption Policy
    const encryptionPolicy = new opensearchserverless.CfnSecurityPolicy(
      this,
      'OpenSearchEncryptionPolicy',
      {
        name: `iac-rlhf-metadata-enc-${environmentSuffix}`,
        type: 'encryption',
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${openSearchCollection.name}`],
            },
          ],
          AWSOwnedKey: true,
        }),
      }
    );

    // Step Functions IAM Role
    const stepFunctionsRole = new iam.Role(this, 'StepFunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });

    // Lambda layer for OpenSearch dependencies
    const openSearchLayer = new lambda.LayerVersion(this, 'OpenSearchLayer', {
      code: lambda.Code.fromAsset(
        'lib/lambda-layers/opensearch-layer/opensearch-layer.zip'
      ),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description:
        'Layer containing requests and requests-aws4auth for OpenSearch',
    });

    // Lambda function for OpenSearch indexing
    const openSearchIndexerLambda = new lambda.Function(
      this,
      'OpenSearchIndexerLambda',
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/opensearch-indexer'),
        layers: [openSearchLayer],
        environment: {
          OPENSEARCH_ENDPOINT: openSearchCollection.attrCollectionEndpoint,
          OPENSEARCH_INDEX: 'metadata',
        },
        timeout: cdk.Duration.seconds(30),
      }
    );

    // OpenSearch Serverless Data Access Policy
    const dataAccessPolicy = new opensearchserverless.CfnAccessPolicy(
      this,
      'OpenSearchDataAccessPolicy',
      {
        name: `iac-rlhf-metadata-access-${environmentSuffix}`,
        type: 'data',
        policy: JSON.stringify([
          {
            Rules: [
              {
                ResourceType: 'collection',
                Resource: [`collection/${openSearchCollection.name}`],
                Permission: [
                  'aoss:CreateCollectionItems',
                  'aoss:DeleteCollectionItems',
                  'aoss:UpdateCollectionItems',
                  'aoss:DescribeCollectionItems',
                ],
              },
              {
                ResourceType: 'index',
                Resource: [`index/${openSearchCollection.name}/*`],
                Permission: [
                  'aoss:CreateIndex',
                  'aoss:DeleteIndex',
                  'aoss:UpdateIndex',
                  'aoss:DescribeIndex',
                  'aoss:ReadDocument',
                  'aoss:WriteDocument',
                ],
              },
            ],
            Principal: [
              stepFunctionsRole.roleArn,
              openSearchIndexerLambda.role!.roleArn,
            ],
          },
        ]),
      }
    );

    // Ensure collection depends on security policies
    openSearchCollection.addDependency(securityPolicy);
    openSearchCollection.addDependency(encryptionPolicy);
    openSearchCollection.addDependency(dataAccessPolicy);

    // Add permissions to the role
    stepFunctionsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [metadataBucket.arnForObjects('*')],
      })
    );

    stepFunctionsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'aoss:APIAccessAll',
          'aoss:DashboardAccessAll',
          'aoss:BatchGetCollection',
          'aoss:CreateIndex',
          'aoss:UpdateIndex',
          'aoss:DescribeIndex',
          'aoss:WriteDocument',
        ],
        resources: [
          `arn:aws:aoss:${this.region}:${this.account}:collection/${openSearchCollection.name}`,
          `arn:aws:aoss:${this.region}:${this.account}:collection/*`,
        ],
      })
    );

    stepFunctionsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:PutItem'],
        resources: [failureTable.tableArn],
      })
    );

    // Add specific OpenSearch Serverless permissions for BatchGetCollection
    stepFunctionsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['aoss:BatchGetCollection'],
        resources: ['*'], // BatchGetCollection requires wildcard resource
      })
    );

    // Step Function Definition
    const getMetadataFromS3 = new tasks.CallAwsService(
      this,
      'GetMetadataFromS3',
      {
        service: 's3',
        action: 'getObject',
        parameters: {
          Bucket: metadataBucket.bucketName,
          Key: stepfunctions.JsonPath.stringAt('$.detail.object.key'),
        },
        iamResources: [metadataBucket.arnForObjects('*')],
        resultPath: '$.metadataFile',
      }
    );

    const processMetadata = new stepfunctions.CustomState(
      this,
      'ProcessMetadata',
      {
        stateJson: {
          Type: 'Task',
          Resource:
            'arn:aws:states:::aws-sdk:opensearchserverless:batchGetCollection',
          Parameters: {
            Names: [openSearchCollection.name],
          },
          ResultPath: '$.collectionDetails',
          Next: 'PrepareMetadataForOpenSearch',
        },
      }
    );

    const prepareMetadataForOpenSearch = new stepfunctions.Pass(
      this,
      'PrepareMetadataForOpenSearch',
      {
        parameters: {
          'document.$': 'States.StringToJson($.metadataFile.Body)',
          '@timestamp.$': '$$.State.EnteredTime',
        },
        resultPath: '$.processedMetadata',
      }
    );

    // Add OpenSearch permissions to Lambda
    openSearchIndexerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'aoss:APIAccessAll',
          'aoss:CreateIndex',
          'aoss:UpdateIndex',
          'aoss:DescribeIndex',
          'aoss:WriteDocument',
        ],
        resources: [
          openSearchCollection.attrArn,
          `${openSearchCollection.attrArn}/*`,
        ],
      })
    );

    // Use Lambda function in Step Functions
    const indexToOpenSearch = new tasks.LambdaInvoke(
      this,
      'IndexToOpenSearch',
      {
        lambdaFunction: openSearchIndexerLambda,
        payload: stepfunctions.TaskInput.fromObject({
          'document.$': '$.processedMetadata.document',
          '@timestamp.$': '$.processedMetadata.@timestamp',
        }),
        outputPath: '$.Payload',
      }
    );

    const recordFailure = new tasks.DynamoPutItem(this, 'RecordFailure', {
      table: failureTable,
      item: {
        executionId: tasks.DynamoAttributeValue.fromString(
          stepfunctions.JsonPath.stringAt('$$.Execution.Id')
        ),
        timestamp: tasks.DynamoAttributeValue.fromString(
          stepfunctions.JsonPath.stringAt('$$.State.EnteredTime')
        ),
        input: tasks.DynamoAttributeValue.fromString(
          stepfunctions.JsonPath.stringAt('States.JsonToString($)')
        ),
        error: tasks.DynamoAttributeValue.fromString(
          stepfunctions.JsonPath.stringAt('$.error.Error')
        ),
        cause: tasks.DynamoAttributeValue.fromString(
          stepfunctions.JsonPath.stringAt('$.error.Cause')
        ),
      },
      resultPath: '$.failureRecord',
    });

    // Create failure handling flow
    const failureHandler = recordFailure.next(
      new stepfunctions.Fail(this, 'ProcessingFailed', {
        error: 'MetadataProcessingError',
        cause: 'Error occurred during metadata processing',
      })
    );

    // Add error handling to steps that support it
    getMetadataFromS3.addCatch(failureHandler, {
      resultPath: '$.error',
    });
    processMetadata.addCatch(failureHandler, {
      resultPath: '$.error',
    });
    indexToOpenSearch.addCatch(failureHandler, {
      resultPath: '$.error',
    });
    // Note: Pass states don't support addCatch

    const metadataProcessingWorkflow = new stepfunctions.StateMachine(
      this,
      'MetadataProcessingWorkflow',
      {
        definitionBody: stepfunctions.DefinitionBody.fromChainable(
          getMetadataFromS3
            .next(processMetadata)
            .next(prepareMetadataForOpenSearch)
            .next(indexToOpenSearch)
        ),
        role: stepFunctionsRole,
        tracingEnabled: true,
      }
    );

    // EventBridge Rule to trigger Step Function
    const metadataFileRule = new events.Rule(this, 'MetadataFileRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [metadataBucket.bucketName],
          },
          object: {
            key: [
              {
                suffix: 'metadata.json',
              },
            ],
          },
        },
      },
    });

    metadataFileRule.addTarget(
      new targets.SfnStateMachine(metadataProcessingWorkflow)
    );

    // CloudWatch Alarm for Step Function failures
    const failureMetric = metadataProcessingWorkflow.metricFailed({
      period: cdk.Duration.minutes(1),
    });

    new cloudwatch.Alarm(this, 'StepFunctionFailureAlarm', {
      metric: failureMetric,
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription:
        'Alarm when the metadata processing step function fails',
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
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

    new cdk.CfnOutput(this, 'MetadataProcessingWorkflowArn', {
      value: metadataProcessingWorkflow.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });
  }
}
