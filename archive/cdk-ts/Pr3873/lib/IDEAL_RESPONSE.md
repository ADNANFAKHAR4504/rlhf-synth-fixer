# IDEAL_RESPONSE.md

## CDK TypeScript Infrastructure Stack

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // DynamoDB Table for votes with point-in-time recovery
    const votesTable = new dynamodb.Table(this, 'VotesTable', {
      tableName: `polling-votes-${environmentSuffix}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'pollId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Table for aggregated results
    const resultsTable = new dynamodb.Table(this, 'ResultsTable', {
      tableName: `polling-results-${environmentSuffix}`,
      partitionKey: { name: 'pollId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for result snapshots
    const snapshotBucket = new s3.Bucket(this, 'SnapshotBucket', {
      bucketName: `polling-snapshots-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda function for vote processing
    const voteProcessorFunction = new lambda.Function(this, 'VoteProcessor', {
      functionName: `vote-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda/auto-response')
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        VOTES_TABLE_NAME: votesTable.tableName,
        ENVIRONMENT: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to vote processor
    votesTable.grantReadWriteData(voteProcessorFunction);

    // Lambda function for results aggregation
    const resultsAggregatorFunction = new lambda.Function(
      this,
      'ResultsAggregator',
      {
        functionName: `results-aggregator-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, '../lambda/sentiment')
        ),
        timeout: cdk.Duration.seconds(60),
        memorySize: 512,
        environment: {
          RESULTS_TABLE_NAME: resultsTable.tableName,
          SNAPSHOT_BUCKET_NAME: snapshotBucket.bucketName,
          ENVIRONMENT: environmentSuffix,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to results aggregator
    resultsTable.grantReadWriteData(resultsAggregatorFunction);
    snapshotBucket.grantWrite(resultsAggregatorFunction);

    // Add DynamoDB Stream as event source
    resultsAggregatorFunction.addEventSource(
      new DynamoEventSource(votesTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        retryAttempts: 3,
        bisectBatchOnError: true,
      })
    );

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'PollingAPI', {
      restApiName: `polling-api-${environmentSuffix}`,
      description: 'API for submitting and retrieving poll votes',
      deployOptions: {
        stageName: environmentSuffix,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Gateway resources and methods
    const votesResource = api.root.addResource('votes');
    const voteIntegration = new apigateway.LambdaIntegration(
      voteProcessorFunction
    );

    const postVoteMethod = votesResource.addMethod('POST', voteIntegration, {
      apiKeyRequired: true,
    });

    const getVoteMethod = votesResource.addMethod('GET', voteIntegration, {
      apiKeyRequired: true,
    });

    // Results endpoint
    const resultsResource = api.root.addResource('results');
    const resultsIntegration = new apigateway.LambdaIntegration(
      resultsAggregatorFunction
    );

    const getResultsMethod = resultsResource.addMethod(
      'GET',
      resultsIntegration,
      {
        apiKeyRequired: true,
      }
    );

    // Usage Plan with rate limiting
    const usagePlan = api.addUsagePlan('PollingUsagePlan', {
      name: `polling-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for polling API with rate limiting',
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
      throttle: [
        {
          method: postVoteMethod,
          throttle: {
            rateLimit: 10,
            burstLimit: 20,
          },
        },
        {
          method: getVoteMethod,
          throttle: {
            rateLimit: 50,
            burstLimit: 100,
          },
        },
      ],
    });

    // API Keys
    const apiKey = api.addApiKey('PollingAPIKey', {
      apiKeyName: `polling-api-key-${environmentSuffix}`,
      description: 'API key for polling system',
    });

    usagePlan.addApiKey(apiKey);

    // CloudWatch Alarms
    const voteProcessorErrors = new cloudwatch.Alarm(
      this,
      'VoteProcessorErrors',
      {
        alarmName: `vote-processor-errors-${environmentSuffix}`,
        metric: voteProcessorFunction.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const apiGateway4xxErrors = new cloudwatch.Alarm(
      this,
      'APIGateway4xxErrors',
      {
        alarmName: `api-4xx-errors-${environmentSuffix}`,
        metric: api.metricClientError({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 50,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const resultsAggregatorErrors = new cloudwatch.Alarm(
      this,
      'ResultsAggregatorErrors',
      {
        alarmName: `results-aggregator-errors-${environmentSuffix}`,
        metric: resultsAggregatorFunction.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Suppress unused variable warnings - alarms are created for monitoring
    void getResultsMethod;
    void voteProcessorErrors;
    void apiGateway4xxErrors;
    void resultsAggregatorErrors;

    // Outputs
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'Polling API endpoint',
      exportName: `polling-api-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'APIKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `polling-api-key-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VotesTableName', {
      value: votesTable.tableName,
      description: 'DynamoDB votes table name',
      exportName: `votes-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ResultsTableName', {
      value: resultsTable.tableName,
      description: 'DynamoDB results table name',
      exportName: `results-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SnapshotBucketName', {
      value: snapshotBucket.bucketName,
      description: 'S3 bucket for result snapshots',
      exportName: `snapshot-bucket-${environmentSuffix}`,
    });
  }
}
```

## Lambda Function Code

### lib/vote-processor/vote_processor.py

```python
import json
import os
import boto3
import logging
from datetime import datetime
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
votes_table_name = os.environ['VOTES_TABLE_NAME']
votes_table = dynamodb.Table(votes_table_name)

def handler(event, context):
    """
    Lambda function to process vote submissions with duplicate prevention.
    """
    logger.info(f"Received event: {json.dumps(event)}")

    try:
        # Handle API Gateway request
        http_method = event.get('httpMethod', '')

        if http_method == 'POST':
            return handle_vote_submission(event)
        elif http_method == 'GET':
            return handle_get_vote(event)
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }

def handle_vote_submission(event):
    """
    Handle POST request to submit a vote with conditional write.
    """
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        poll_id = body.get('pollId')
        choice = body.get('choice')

        # Validate required fields
        if not all([user_id, poll_id, choice]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields: userId, pollId, choice'
                })
            }

        timestamp = datetime.utcnow().isoformat()

        # Use conditional write to prevent duplicate votes
        try:
            response = votes_table.put_item(
                Item={
                    'userId': user_id,
                    'pollId': poll_id,
                    'choice': choice,
                    'timestamp': timestamp,
                    'ttl': int(datetime.utcnow().timestamp()) + 86400 * 90  # 90 days TTL
                },
                ConditionExpression='attribute_not_exists(userId) AND attribute_not_exists(pollId)',
                ReturnValuesOnConditionCheckFailure='ALL_OLD'
            )

            logger.info(f"Vote recorded: userId={user_id}, pollId={poll_id}, choice={choice}")

            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Vote recorded successfully',
                    'userId': user_id,
                    'pollId': poll_id,
                    'choice': choice,
                    'timestamp': timestamp
                })
            }

        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                # User has already voted
                existing_vote = e.response.get('Item', {})
                logger.warning(f"Duplicate vote attempt: userId={user_id}, pollId={poll_id}")

                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'User has already voted in this poll',
                        'existingVote': {
                            'choice': existing_vote.get('choice', ''),
                            'timestamp': existing_vote.get('timestamp', '')
                        }
                    })
                }
            else:
                raise

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON body'})
        }

def handle_get_vote(event):
    """
    Handle GET request to retrieve a user's vote for a poll.
    """
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('userId')
        poll_id = query_params.get('pollId')

        if not all([user_id, poll_id]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required parameters: userId, pollId'
                })
            }

        response = votes_table.get_item(
            Key={
                'userId': user_id,
                'pollId': poll_id
            }
        )

        if 'Item' in response:
            item = response['Item']
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'userId': item['userId'],
                    'pollId': item['pollId'],
                    'choice': item['choice'],
                    'timestamp': item['timestamp']
                })
            }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Vote not found'
                })
            }

    except Exception as e:
        logger.error(f"Error retrieving vote: {str(e)}")
        raise
```

### lib/results-aggregator/results_aggregator.py

```python
import json
import os
import boto3
import logging
from datetime import datetime
from collections import defaultdict
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

results_table_name = os.environ['RESULTS_TABLE_NAME']
snapshot_bucket_name = os.environ['SNAPSHOT_BUCKET_NAME']

results_table = dynamodb.Table(results_table_name)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal types to JSON."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    """
    Lambda function to aggregate voting results from DynamoDB Stream.
    """
    logger.info(f"Received {len(event['Records'])} records from DynamoDB Stream")

    try:
        # Process stream records
        vote_changes = process_stream_records(event['Records'])

        # Update aggregated results
        update_results(vote_changes)

        # Take periodic snapshots (every 100 records as example)
        if len(event['Records']) >= 50:
            take_snapshot()

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Results aggregated successfully',
                'recordsProcessed': len(event['Records'])
            })
        }

    except Exception as e:
        logger.error(f"Error processing stream records: {str(e)}")
        raise

def process_stream_records(records):
    """
    Process DynamoDB stream records and extract vote changes.
    """
    vote_changes = defaultdict(lambda: defaultdict(int))

    for record in records:
        event_name = record['eventName']

        if event_name in ['INSERT', 'MODIFY']:
            new_image = record['dynamodb'].get('NewImage', {})
            poll_id = new_image.get('pollId', {}).get('S', '')
            choice = new_image.get('choice', {}).get('S', '')

            if poll_id and choice:
                vote_changes[poll_id][choice] += 1

        elif event_name == 'REMOVE':
            old_image = record['dynamodb'].get('OldImage', {})
            poll_id = old_image.get('pollId', {}).get('S', '')
            choice = old_image.get('choice', {}).get('S', '')

            if poll_id and choice:
                vote_changes[poll_id][choice] -= 1

    return vote_changes

def update_results(vote_changes):
    """
    Update aggregated results in DynamoDB.
    """
    for poll_id, choices in vote_changes.items():
        for choice, count_delta in choices.items():
            try:
                results_table.update_item(
                    Key={'pollId': poll_id},
                    UpdateExpression='ADD #choices.#choice :delta SET lastUpdated = :timestamp',
                    ExpressionAttributeNames={
                        '#choices': 'choices',
                        '#choice': choice
                    },
                    ExpressionAttributeValues={
                        ':delta': count_delta,
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
                logger.info(f"Updated results for poll {poll_id}, choice {choice}, delta {count_delta}")

            except Exception as e:
                logger.error(f"Error updating results: {str(e)}")
                raise

def take_snapshot():
    """
    Take a snapshot of current results and save to S3.
    """
    try:
        # Scan results table
        response = results_table.scan()
        items = response.get('Items', [])

        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = results_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))

        # Create snapshot
        timestamp = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
        snapshot_key = f"snapshots/results-{timestamp}.json"

        snapshot_data = {
            'timestamp': timestamp,
            'results': items
        }

        # Upload to S3
        s3_client.put_object(
            Bucket=snapshot_bucket_name,
            Key=snapshot_key,
            Body=json.dumps(snapshot_data, cls=DecimalEncoder),
            ContentType='application/json'
        )

        logger.info(f"Snapshot saved to s3://{snapshot_bucket_name}/{snapshot_key}")

    except Exception as e:
        logger.error(f"Error taking snapshot: {str(e)}")
        # Don't raise - snapshots are not critical
```

## Configuration Files

### lib/AWS_REGION

```
us-west-2
```

### lib/vote-processor/requirements.txt

```
boto3>=1.34.0
```

### lib/results-aggregator/requirements.txt

```
boto3>=1.34.0
```

## Infrastructure Summary

This CDK TypeScript infrastructure creates a complete polling system with:

- **DynamoDB Tables**: Votes table with PITR and streams, Results table for aggregation
- **S3 Bucket**: For result snapshots with versioning and encryption
- **Lambda Functions**: Vote processor and results aggregator with proper IAM permissions
- **API Gateway**: REST API with CORS, rate limiting, and API key authentication
- **CloudWatch**: Error monitoring alarms for all components
- **Event Sources**: DynamoDB stream integration for real-time aggregation

The system provides secure vote submission with duplicate prevention, real-time result aggregation, and comprehensive monitoring.
