import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
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
              Resource: ['collection/iac-rlhf-metadata-collection'],
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
                Resource: ['collection/iac-rlhf-metadata-collection'],
              },
            ],
            AllowFromPublic: true,
          },
        ]),
      }
    );

    // Lambda function to handle OpenSearch Serverless indexing
    const openSearchLambda = new lambda.Function(this, 'OpenSearchIndexer', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import urllib3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials
import os

def handler(event, context):
    try:
        # Log the execution context for debugging
        print(f"Lambda execution role: {context.invoked_function_arn}")
        print(f"AWS region: {os.environ.get('AWS_REGION', 'Unknown')}")
        
        # Extract data from Step Function input
        endpoint = event['endpoint']
        index = event.get('index', 'rlhf-iac-aws')
        body = event['body']
        
        print(f"OpenSearch endpoint: {endpoint}")
        print(f"Index: {index}")
        print(f"Document body: {json.dumps(body, default=str)}")
        
        # Create the OpenSearch document URL
        url = f"{endpoint}/{index}/_doc"
        print(f"Full URL: {url}")
        
        # Get AWS credentials
        session = boto3.Session()
        credentials = session.get_credentials()
        print(f"Using credentials for access key: {credentials.access_key[:8]}...")
        
        # Create request for AWS SigV4 signing
        request = AWSRequest(method='POST', url=url, data=json.dumps(body))
        SigV4Auth(credentials, 'aoss', os.environ['AWS_REGION']).add_auth(request)
        
        print(f"Request headers: {dict(request.headers)}")
        
        # Make the HTTP request
        http = urllib3.PoolManager()
        response = http.request(
            'POST',
            url,
            body=request.body,
            headers=dict(request.headers)
        )
        
        # Check if the response status is successful
        if response.status not in [200, 201]:
            error_msg = f"OpenSearch request failed with status {response.status}: {response.data.decode('utf-8')}"
            print(error_msg)
            raise Exception(error_msg)
        
        return {
            'statusCode': response.status,
            'body': response.data.decode('utf-8'),
            'headers': dict(response.headers)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise e
`),
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
                Resource: ['collection/iac-rlhf-metadata-collection'],
                Permission: ['aoss:*'],
              },
              {
                ResourceType: 'index',
                Resource: ['index/iac-rlhf-metadata-collection/*'],
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
        name: 'iac-rlhf-metadata-collection',
        type: 'TIMESERIES',
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

    // Grant Lambda permissions to access OpenSearch Serverless
    openSearchLambda.role!.attachInlinePolicy(
      new iam.Policy(this, 'LambdaOpenSearchPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'aoss:WriteDocument',
              'aoss:ReadDocument',
              'aoss:APIAccessAll',
            ],
            resources: [collection.attrArn, `${collection.attrArn}/*`],
          }),
        ],
      })
    );

    // Dead Letter Queue for failed Step Function executions
    const dlq = new sqs.Queue(this, 'MetadataProcessingDLQ', {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
    });

    // Step Function to process metadata and store in OpenSearch
    const processMetadataTask = new tasks.CallAwsService(this, 'GetS3Object', {
      service: 's3',
      action: 'getObject',
      parameters: {
        Bucket: bucket.bucketName,
        Key: sfn.JsonPath.stringAt('$.detail.object.key'),
      },
      iamResources: [bucket.arnForObjects('*')],
      resultPath: '$.s3Object',
    });

    // Lambda invocation task to send data to OpenSearch Serverless
    const storeInOpenSearchTask = new tasks.LambdaInvoke(
      this,
      'IndexDocumentInOpenSearch',
      {
        lambdaFunction: openSearchLambda,
        payload: sfn.TaskInput.fromObject({
          endpoint: collection.attrCollectionEndpoint,
          index: 'iac-rlhf-metadata',
          body: {
            'documentId.$': '$.detail.object.key',
            'documentContent.$': '$.s3Object.Body',
            'bucket.$': '$.detail.bucket.name',
            'key.$': '$.detail.object.key',
            'timestamp.$': '$$.State.EnteredTime',
            collectionName: collection.name,
          },
        }),
        resultPath: '$.openSearchResult',
      }
    );

    const definition = processMetadataTask.next(storeInOpenSearchTask);

    const stateMachine = new sfn.StateMachine(
      this,
      'MetadataProcessingStateMachine',
      {
        definitionBody: sfn.DefinitionBody.fromChainable(definition),
        timeout: cdk.Duration.minutes(5),
      }
    );

    // Grant necessary permissions to State Machine role
    bucket.grantRead(stateMachine.role!);
    openSearchLambda.grantInvoke(stateMachine.role!);

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
        deadLetterQueue: dlq, // Step Function failures go to DLQ
        maxEventAge: cdk.Duration.hours(24),
        retryAttempts: 3,
      })
    );

    // Create a Step Function task to process DLQ messages and store in DynamoDB
    const dlqToDbTask = new tasks.DynamoPutItem(this, 'PutItemInDynamoDB', {
      table: failureTable,
      item: {
        id: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt('$.receiptHandle')
        ),
        timestamp: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt('$$.State.EnteredTime')
        ),
        errorDetails: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt('$.body')
        ),
        originalEvent: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt('$.body')
        ),
      },
    });

    const dlqProcessingStateMachine = new sfn.StateMachine(
      this,
      'DLQProcessingStateMachine',
      {
        definitionBody: sfn.DefinitionBody.fromChainable(dlqToDbTask),
        timeout: cdk.Duration.minutes(5),
      }
    );

    // Grant the DLQ state machine permission to write to DynamoDB
    failureTable.grantWriteData(dlqProcessingStateMachine.role!);

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'The name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'The URL of the Dead Letter Queue',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'The ARN of the Step Function state machine',
    });

    new cdk.CfnOutput(this, 'DLQProcessingStateMachineArn', {
      value: dlqProcessingStateMachine.stateMachineArn,
      description: 'The ARN of the DLQ processing Step Function state machine',
    });

    new cdk.CfnOutput(this, 'OpenSearchCollectionName', {
      value: collection.name!,
      description: 'The name of the OpenSearch Serverless collection',
    });

    new cdk.CfnOutput(this, 'OpenSearchCollectionEndpoint', {
      value: collection.attrCollectionEndpoint,
      description: 'The endpoint of the OpenSearch Serverless collection',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: failureTable.tableName,
      description: 'The name of the DynamoDB table for failures',
    });

    new cdk.CfnOutput(this, 'OpenSearchLambdaArn', {
      value: openSearchLambda.functionArn,
      description: 'The ARN of the Lambda function for OpenSearch indexing',
    });
  }
}
