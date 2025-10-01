# Serverless API Infrastructure for Mobile Gaming Score Management with X-Ray and Usage Plans

Here's the complete AWS CDK TypeScript infrastructure code for your serverless API to manage player scores with enhanced monitoring and rate limiting:

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
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

    // DynamoDB Table
    const playerScoresTable = new dynamodb.Table(this, 'PlayerScoresTable', {
      tableName: `PlayerScores-${environmentSuffix}`,
      partitionKey: {
        name: 'playerId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
    });

    // Lambda Execution Role with X-Ray permissions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Create Lambda Functions with X-Ray tracing
    const createScoreFunction = new lambda.Function(this, 'CreateScoreFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'createScore.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: playerScoresTable.tableName,
        ENVIRONMENT: environmentSuffix,
        _X_AMZN_TRACE_ID: process.env._X_AMZN_TRACE_ID || '',
      },
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
    });

    const getScoreFunction = new lambda.Function(this, 'GetScoreFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'getScore.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: playerScoresTable.tableName,
        ENVIRONMENT: environmentSuffix,
        _X_AMZN_TRACE_ID: process.env._X_AMZN_TRACE_ID || '',
      },
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
    });

    const updateScoreFunction = new lambda.Function(this, 'UpdateScoreFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'updateScore.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: playerScoresTable.tableName,
        ENVIRONMENT: environmentSuffix,
        _X_AMZN_TRACE_ID: process.env._X_AMZN_TRACE_ID || '',
      },
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
    });

    const deleteScoreFunction = new lambda.Function(this, 'DeleteScoreFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'deleteScore.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: playerScoresTable.tableName,
        ENVIRONMENT: environmentSuffix,
        _X_AMZN_TRACE_ID: process.env._X_AMZN_TRACE_ID || '',
      },
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant DynamoDB permissions
    playerScoresTable.grantWriteData(createScoreFunction);
    playerScoresTable.grantReadData(getScoreFunction);
    playerScoresTable.grantWriteData(updateScoreFunction);
    playerScoresTable.grantWriteData(deleteScoreFunction);

    // API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, 'ScoresApi', {
      restApiName: `ScoresApi-${environmentSuffix}`,
      description: 'API for managing player scores',
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // API Resources and Methods
    const scoresResource = api.root.addResource('scores');
    const playerResource = scoresResource.addResource('{playerId}');

    // POST /scores
    scoresResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createScoreFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        apiKeyRequired: true,
      }
    );

    // GET /scores/{playerId}
    playerResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getScoreFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        apiKeyRequired: true,
      }
    );

    // PUT /scores/{playerId}
    playerResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateScoreFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        apiKeyRequired: true,
      }
    );

    // DELETE /scores/{playerId}
    playerResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteScoreFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        apiKeyRequired: true,
      }
    );

    // Create API Key
    const apiKey = new apigateway.ApiKey(this, 'ScoresApiKey', {
      apiKeyName: `ScoresApiKey-${environmentSuffix}`,
      description: 'API Key for accessing the Scores API',
    });

    // Create Usage Plan
    const usagePlan = new apigateway.UsagePlan(this, 'ScoresUsagePlan', {
      name: `ScoresUsagePlan-${environmentSuffix}`,
      description: 'Usage plan for the Scores API with rate limiting',
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    // Associate API Key with Usage Plan
    usagePlan.addApiKey(apiKey);

    // Parameter Store
    new ssm.StringParameter(this, 'ApiEndpointParameter', {
      parameterName: `/scores-api/${environmentSuffix}/endpoint`,
      stringValue: api.url,
      description: 'API Gateway endpoint URL',
    });

    new ssm.StringParameter(this, 'TableNameParameter', {
      parameterName: `/scores-api/${environmentSuffix}/table-name`,
      stringValue: playerScoresTable.tableName,
      description: 'DynamoDB table name',
    });

    new ssm.StringParameter(this, 'EnvironmentParameter', {
      parameterName: `/scores-api/${environmentSuffix}/environment`,
      stringValue: environmentSuffix,
      description: 'Environment name',
    });

    new ssm.StringParameter(this, 'ApiKeyIdParameter', {
      parameterName: `/scores-api/${environmentSuffix}/api-key-id`,
      stringValue: apiKey.keyId,
      description: 'API Key ID for the Scores API',
    });

    // Ensure Lambda functions have RemovalPolicy.DESTROY for log groups
    [
      createScoreFunction,
      getScoreFunction,
      updateScoreFunction,
      deleteScoreFunction,
    ].forEach(fn => {
      new logs.LogGroup(this, `${fn.node.id}LogGroup`, {
        logGroupName: `/aws/lambda/${fn.functionName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: playerScoresTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'CreateScoreFunctionName', {
      value: createScoreFunction.functionName,
      description: 'Create Score Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'GetScoreFunctionName', {
      value: getScoreFunction.functionName,
      description: 'Get Score Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'UpdateScoreFunctionName', {
      value: updateScoreFunction.functionName,
      description: 'Update Score Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'DeleteScoreFunctionName', {
      value: deleteScoreFunction.functionName,
      description: 'Delete Score Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for accessing the API',
    });

    new cdk.CfnOutput(this, 'UsagePlanId', {
      value: usagePlan.usagePlanId,
      description: 'Usage Plan ID for the API',
    });
  }
}
```

## File: lib/lambda/createScore.js

```javascript
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // Input validation
    if (!body.playerId || !body.score || !body.gameId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: playerId, score, gameId'
        }),
      };
    }

    const item = {
      playerId: body.playerId,
      score: body.score,
      gameId: body.gameId,
      timestamp: new Date().toISOString(),
    };

    const params = {
      TableName: TABLE_NAME,
      Item: marshall(item),
      ConditionExpression: 'attribute_not_exists(playerId)',
    };

    await dynamoClient.send(new PutItemCommand(params));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Score created successfully',
        data: item
      }),
    };
  } catch (error) {
    console.error('Error creating score:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Player score already exists'
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
};
```

## File: lib/lambda/getScore.js

```javascript
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;

    if (!playerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing playerId parameter'
        }),
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        playerId: { S: playerId },
      },
    };

    const result = await dynamoClient.send(new GetItemCommand(params));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Player score not found'
        }),
      };
    }

    const item = unmarshall(result.Item);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: item
      }),
    };
  } catch (error) {
    console.error('Error getting score:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
};
```

## File: lib/lambda/updateScore.js

```javascript
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;
    const body = JSON.parse(event.body);

    if (!playerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing playerId parameter'
        }),
      };
    }

    if (!body.score && !body.gameId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'At least one field (score or gameId) must be provided'
        }),
      };
    }

    let updateExpression = 'SET #timestamp = :timestamp';
    const expressionAttributeNames = {
      '#timestamp': 'timestamp',
    };
    const expressionAttributeValues = {
      ':timestamp': new Date().toISOString(),
    };

    if (body.score !== undefined) {
      updateExpression += ', #score = :score';
      expressionAttributeNames['#score'] = 'score';
      expressionAttributeValues[':score'] = body.score;
    }

    if (body.gameId !== undefined) {
      updateExpression += ', #gameId = :gameId';
      expressionAttributeNames['#gameId'] = 'gameId';
      expressionAttributeValues[':gameId'] = body.gameId;
    }

    const params = {
      TableName: TABLE_NAME,
      Key: marshall({ playerId }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ConditionExpression: 'attribute_exists(playerId)',
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoClient.send(new UpdateItemCommand(params));
    const updatedItem = unmarshall(result.Attributes);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Score updated successfully',
        data: updatedItem
      }),
    };
  } catch (error) {
    console.error('Error updating score:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Player score not found'
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
};
```

## File: lib/lambda/deleteScore.js

```javascript
const { DynamoDBClient, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;

    if (!playerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing playerId parameter'
        }),
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Key: marshall({ playerId }),
      ConditionExpression: 'attribute_exists(playerId)',
    };

    await dynamoClient.send(new DeleteItemCommand(params));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Score deleted successfully'
      }),
    };
  } catch (error) {
    console.error('Error deleting score:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Player score not found'
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
};
```

## File: lib/lambda/package.json

```json
{
  "name": "score-api-lambdas",
  "version": "1.0.0",
  "description": "Lambda functions for score management API",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.600.0",
    "@aws-sdk/util-dynamodb": "^3.600.0"
  }
}
```

This infrastructure provides a complete serverless API solution with:
- REST API Gateway with CRUD endpoints and X-Ray tracing enabled
- Four Lambda functions with active X-Ray distributed tracing
- DynamoDB table with on-demand scaling
- API Gateway Usage Plans with rate limiting (100 req/sec, 200 burst)
- API Key authentication required for all endpoints
- Daily quota of 10,000 requests per API key
- Least privilege IAM roles with X-Ray write permissions
- CloudWatch logging and monitoring integration
- Parameter Store for configuration management
- Proper error handling and input validation
- Development environment configuration with removal policies
- End-to-end request tracing for performance monitoring