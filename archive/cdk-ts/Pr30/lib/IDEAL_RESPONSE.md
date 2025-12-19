```typescript
// metadata-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export class MetadataProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket to receive metadata.json files
    const bucket = new s3.Bucket(this, 'ReleaseMetadataBucket', {
      bucketName: 'iac-rlhf-aws-release',
      eventBridgeEnabled: true, // Enable EventBridge notifications
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for failed events
    const failureTable = new dynamodb.Table(this, 'FailureEventsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const collectionName = 'iac-rlhf-metadata-collection';

    // OpenSearch Serverless Collection
    const securityPolicy = new opensearchserverless.CfnSecurityPolicy(
      this,
      'OpenSearchSecurityPolicy',
      {
        name: 'metadata-security-policy',
        type: 'encryption',
        description: 'Encryption policy for metadata collection',
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${collectionName}`],
            },
          ],
          AWSOwnedKey: true,
        }),
      }
    );

    const networkPolicy = new opensearchserverless.CfnSecurityPolicy(
      this,
      'OpenSearchNetworkPolicy',
      {
        name: 'iac-rlhf-metadata-network-policy',
        type: 'network',
        description: 'Network policy for IaC Rlhf metadata collection',
        policy: JSON.stringify([
          {
            Rules: [
              {
                ResourceType: 'collection',
                Resource: [`collection/${collectionName}`],
              },
              {
                ResourceType: 'dashboard',
                Resource: [`collection/${collectionName}`],
              },
            ],
            AllowFromPublic: true,
          },
        ]),
      }
    );

    // Lambda Layer for OpenSearch dependencies
    const openSearchLayer = new lambda.LayerVersion(this, 'OpenSearchLayer', {
      code: lambda.Code.fromAsset(
        'lib/lambda-layers/opensearch-layer/opensearch-layer.zip'
      ),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      description:
        'Layer containing requests_aws4auth and opensearch-py dependencies',
    });

    // Lambda function to handle OpenSearch Serverless indexing
    const openSearchLambda = new lambda.Function(this, 'OpenSearchIndexer', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda-functions/opensearch-indexer'),
      layers: [openSearchLayer],
      timeout: cdk.Duration.minutes(5),
    });

    const dataAccessPolicy = new opensearchserverless.CfnAccessPolicy(
      this,
      'OpenSearchDataAccessPolicy',
      {
        name: 'iac-rlhf-metadata-access-policy',
        type: 'data',
        description: 'Data access policy for iac-rlhf-metadata collection',
        policy: JSON.stringify([
          {
            Rules: [
              {
                ResourceType: 'collection',
                Resource: [`collection/${collectionName}`],
                Permission: ['aoss:*'],
              },
              {
                ResourceType: 'index',
                Resource: [`index/${collectionName}/*`],
                Permission: ['aoss:*'],
              },
            ],
            Principal: [
              `arn:aws:iam::${this.account}:root`,
              openSearchLambda.role!.roleArn,
            ],
          },
        ]),
      }
    );

    const collection = new opensearchserverless.CfnCollection(
      this,
      'MetadataCollection',
      {
        name: collectionName,
        type: 'SEARCH', // Changed from TIMESERIES to SEARCH for document indexing
        description: 'Collection for storing metadata from iac-rlhf-releases',
      }
    );

    collection.addDependency(securityPolicy);
    collection.addDependency(networkPolicy);
    collection.addDependency(dataAccessPolicy);

    // Ensure the Lambda environment variables are set after collection creation
    // and that there's time for the data access policy to propagate
    const collectionEndpoint = collection.attrCollectionEndpoint;

    // Add environment variables to Lambda after collection is created
    openSearchLambda.addEnvironment('OPENSEARCH_ENDPOINT', collectionEndpoint);
    openSearchLambda.addEnvironment('COLLECTION_NAME', collection.name!);
    openSearchLambda.addEnvironment('OPENSEARCH_INDEX', 'iac-rlhf-metadata');

    // Grant Lambda permissions to access OpenSearch Serverless
    openSearchLambda.role!.attachInlinePolicy(
      new iam.Policy(this, 'LambdaOpenSearchPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['aoss:APIAccessAll'],
            resources: [collection.attrArn, `${collection.attrArn}/*`],
          }),
        ],
      })
    );

    // Step Function to process metadata and store in OpenSearch
    const processMetadataTask = tasks.CallAwsService.jsonata(
      this,
      'GetS3Object',
      {
        service: 's3',
        action: 'getObject',
        parameters: {
          Bucket: '{% $states.input.detail.bucket.name %}',
          Key: '{% $states.input.detail.object.key %}',
        },
        iamResources: [bucket.arnForObjects('*')],
        outputs: `{% $merge([
          { 
            "s3Location": {
              "Bucket": $states.input.detail.bucket.name,
              "Key": $states.input.detail.object.key
            },
            "@timestamp": $states.input.time
          },
          $parse($states.result.Body)
        ]
      ) %}`,
      }
    );

    // Lambda invocation task to send data to OpenSearch Serverless
    const storeInOpenSearchTask = tasks.LambdaInvoke.jsonata(
      this,
      'IndexDocumentInOpenSearch',
      {
        lambdaFunction: openSearchLambda,
        payload: sfn.TaskInput.fromText('{% $states.input %}'),
        outputs: `{% $merge([
          $states.input,
          {
            "documentId": $states.result.Payload.documentId  
          }
        ]) %}`,
      }
    );

    // Task to handle failures and store in DynamoDB
    const handleFailureTask = new tasks.DynamoPutItem(
      this,
      'StoreFailureInDynamoDB',
      {
        table: failureTable,
        item: {
          id: tasks.DynamoAttributeValue.fromString(
            '{% $states.context.Execution.Name %}'
          ),
          timestamp: tasks.DynamoAttributeValue.fromString('{% $now() %}'),
          error: tasks.DynamoAttributeValue.fromString(
            '{% $string($states.input.Error) %}'
          ),
          cause: tasks.DynamoAttributeValue.fromString(
            '{% $string($states.input.Cause) %}'
          ),
          originalEvent: tasks.DynamoAttributeValue.fromString(
            '{% $string($states.context.Execution.Input) %}'
          ),
        },
        outputs: '{% $states.input %}',
      }
    );

    // Fail state to ensure the execution fails after recording the error
    const failState = new sfn.Fail(this, 'ExecutionFailed', {
      cause: '{% $string($states.input.errorDetails.Cause) %}',
      error: '{% $string($states.input.errorDetails.Error) %}',
    });

    // Chain the failure handler to the fail state
    const failureChain = handleFailureTask.next(failState);

    // Create main processing chain
    const mainProcessingChain = processMetadataTask.next(storeInOpenSearchTask);

    // Wrap everything in a Parallel state with a single branch for cleaner error handling
    const parallelProcessing = new sfn.Parallel(
      this,
      'ProcessMetadataParallel',
      {
        comment: 'Main processing workflow with centralized error handling',
      }
    );

    // Add the main processing chain as a single branch
    parallelProcessing.branch(mainProcessingChain);

    // Add catch to the entire parallel block
    parallelProcessing.addCatch(failureChain, {
      errors: ['States.ALL'],
      outputs: `{% $merge([
        $states.input,
        {
          errorDetails: $states.errorOutput
        }
      ]) %}`,
    });

    const definition = parallelProcessing;

    const stateMachine = new sfn.StateMachine(
      this,
      'MetadataProcessingStateMachine',
      {
        definitionBody: sfn.DefinitionBody.fromChainable(definition),
        timeout: cdk.Duration.minutes(5),
        queryLanguage: sfn.QueryLanguage.JSONATA,
      }
    );

    // Grant necessary permissions to State Machine role
    bucket.grantRead(stateMachine.role!);
    openSearchLambda.grantInvoke(stateMachine.role!);
    failureTable.grantWriteData(stateMachine.role!);

    // EventBridge Rule to filter for metadata.json files
    const rule = new events.Rule(this, 'MetadataFileRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [bucket.bucketName],
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

    // Target the Step Function directly from EventBridge
    rule.addTarget(
      new targets.SfnStateMachine(stateMachine, {
        maxEventAge: cdk.Duration.hours(24),
        retryAttempts: 3,
      })
    );

    // CloudWatch Alarm for Step Function failures
    const stepFunctionFailureAlarm = new cloudwatch.Alarm(
      this,
      'StepFunctionFailureAlarm',
      {
        alarmName: 'MetadataProcessing-StepFunction-Failures',
        alarmDescription:
          'Alarm when Step Function for processing metadata fails',
        metric: stateMachine.metricFailed({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'The name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'The ARN of the Step Function state machine',
    });

    new cdk.CfnOutput(this, 'OpenSearchCollectionName', {
      value: collection.name!,
      description: 'The name of the OpenSearch Serverless collection',
    });

    new cdk.CfnOutput(this, 'OpenSearchCollectionEndpoint', {
      value: collection.attrCollectionEndpoint,
      description: 'The endpoint of the OpenSearch Serverless collection',
    });

    new cdk.CfnOutput(this, 'OpenSearchDashboardsUrl', {
      value: collection.attrDashboardEndpoint,
      description: 'The URL for OpenSearch Dashboards',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: failureTable.tableName,
      description: 'The name of the DynamoDB table for failures',
    });

    new cdk.CfnOutput(this, 'OpenSearchLambdaArn', {
      value: openSearchLambda.functionArn,
      description: 'The ARN of the Lambda function for OpenSearch indexing',
    });

    new cdk.CfnOutput(this, 'StepFunctionFailureAlarmName', {
      value: stepFunctionFailureAlarm.alarmName,
      description:
        'The name of the CloudWatch alarm for Step Function failures',
    });
  }
}

```

```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
import { MetadataProcessingStack } from './metadata-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    new MetadataProcessingStack(this, 'MetadataProcessingStack');
  }
}

```