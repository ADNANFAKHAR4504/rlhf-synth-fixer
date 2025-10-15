## CDK Stack Implementation

```javascript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const workoutLogsTable = new dynamodb.Table(this, 'WorkoutLogsTable', {
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'workoutTimestamp',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      readCapacity: 5,
      writeCapacity: 5,
    });

    const readScaling = workoutLogsTable.autoScaleReadCapacity({
      minCapacity: 5,
      maxCapacity: 100
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70
    });

    const writeScaling = workoutLogsTable.autoScaleWriteCapacity({
      minCapacity: 5,
      maxCapacity: 100
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70
    });

    const apiRateLimitParam = new ssm.StringParameter(this, 'ApiRateLimit', {
      parameterName: `/fitness-tracking/api-rate-limit-${environmentSuffix}`,
      stringValue: '1000',
      tier: ssm.ParameterTier.STANDARD,
    });

    const workoutLogProcessorFunction = new lambda.Function(this, 'WorkoutLogProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/workout-processor'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        TABLE_NAME: workoutLogsTable.tableName,
        API_RATE_LIMIT_PARAM: apiRateLimitParam.parameterName,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
      tracing: lambda.Tracing.ACTIVE,
    });

    workoutLogsTable.grantReadWriteData(workoutLogProcessorFunction);
    apiRateLimitParam.grantRead(workoutLogProcessorFunction);

    const api = new apigateway.RestApi(this, 'FitnessTrackingApi', {
      restApiName: `Fitness-Tracking-API-${environmentSuffix}`,
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
      cloudWatchRole: true,
    });

    const apiKey = api.addApiKey('ApiKey', {
      apiKeyName: `fitness-api-key-${environmentSuffix}`,
    });

    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `fitness-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    const workoutsResource = api.root.addResource('workouts');
    
    workoutsResource.addMethod('POST', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    workoutsResource.addMethod('GET', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    const workoutResource = workoutsResource.addResource('{workoutId}');
    
    workoutResource.addMethod('GET', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    workoutResource.addMethod('PUT', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    workoutResource.addMethod('DELETE', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: true,
    });

    new cloudwatch.Alarm(this, 'ApiErrorsAlarm', {
      metric: api.metricServerError({
        period: cdk.Duration.minutes(1),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      metric: workoutLogProcessorFunction.metricErrors({
        period: cdk.Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'DynamoReadThrottleAlarm', {
      metric: workoutLogsTable.metricUserErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'DynamoWriteThrottleAlarm', {
      metric: workoutLogsTable.metricSystemErrorsForOperations({
        operations: [dynamodb.Operation.PUT_ITEM],
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    
    const dashboard = new cloudwatch.Dashboard(this, 'FitnessTrackingDashboard', {
      dashboardName: `FitnessTracking-Monitoring-${environmentSuffix}`,
    });
    
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [api.metricCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Errors',
        left: [
          api.metricClientError(),
          api.metricServerError(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Function',
        left: [
          workoutLogProcessorFunction.metricInvocations(),
          workoutLogProcessorFunction.metricErrors(),
          workoutLogProcessorFunction.metricDuration(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB',
        left: [
          workoutLogsTable.metricConsumedReadCapacityUnits(),
          workoutLogsTable.metricConsumedWriteCapacityUnits(),
        ],
      })
    );

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      exportName: `FitnessApiEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      exportName: `FitnessApiKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: workoutLogsTable.tableName,
      exportName: `WorkoutTableName-${environmentSuffix}`,
    });
  }
}

export { TapStack };
```

## Lambda Function Handler

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const ssm = new SSMClient({});

const TABLE_NAME = process.env.TABLE_NAME;
const API_RATE_LIMIT_PARAM = process.env.API_RATE_LIMIT_PARAM;

let rateLimit = 1000;
let paramLastFetched = 0;

async function getParameter(paramName) {
  const now = Date.now();
  
  if (now - paramLastFetched > 300000) {
    try {
      const command = new GetParameterCommand({
        Name: paramName,
        WithDecryption: true,
      });
      
      const response = await ssm.send(command);
      
      if (response.Parameter && response.Parameter.Value) {
        rateLimit = parseInt(response.Parameter.Value, 10);
        paramLastFetched = now;
      }
    } catch (error) {
      console.error('Error fetching parameter:', error);
    }
  }
  
  return rateLimit;
}

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  await getParameter(API_RATE_LIMIT_PARAM);
  
  try {
    const httpMethod = event.httpMethod;
    const path = event.path;
    
    if (path.startsWith('/workouts')) {
      if (httpMethod === 'GET' && event.pathParameters && event.pathParameters.workoutId) {
        return await getWorkout(event.pathParameters.workoutId, event.requestContext.identity.sourceIp);
      } else if (httpMethod === 'GET') {
        return await listWorkouts(event.requestContext.identity.sourceIp);
      } else if (httpMethod === 'POST') {
        const workoutData = JSON.parse(event.body);
        return await createWorkout(workoutData, event.requestContext.identity.sourceIp);
      } else if (httpMethod === 'PUT' && event.pathParameters && event.pathParameters.workoutId) {
        const workoutData = JSON.parse(event.body);
        return await updateWorkout(event.pathParameters.workoutId, workoutData, event.requestContext.identity.sourceIp);
      } else if (httpMethod === 'DELETE' && event.pathParameters && event.pathParameters.workoutId) {
        return await deleteWorkout(event.pathParameters.workoutId, event.requestContext.identity.sourceIp);
      }
    }
    
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Not found' })
    };
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

async function getWorkout(workoutId, sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  });
  
  const result = await dynamoDB.send(command);
  
  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Workout not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Item)
  };
}

async function listWorkouts(sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    Limit: 100
  });
  
  const result = await dynamoDB.send(command);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Items)
  };
}

async function createWorkout(workoutData, sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  const timestamp = new Date().toISOString();
  
  const item = {
    userId: userId,
    workoutTimestamp: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...workoutData
  };
  
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(workoutTimestamp)'
  });
  
  await dynamoDB.send(command);
  
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  };
}

async function updateWorkout(workoutId, workoutData, sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  const timestamp = new Date().toISOString();
  
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  });
  
  const existingWorkout = await dynamoDB.send(getCommand);
  
  if (!existingWorkout.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Workout not found' })
    };
  }
  
  let updateExpression = 'SET updatedAt = :updatedAt';
  const expressionAttributeValues = {
    ':updatedAt': timestamp
  };
  const expressionAttributeNames = {};
  
  Object.keys(workoutData).forEach((key, index) => {
    if (key !== 'userId' && key !== 'workoutTimestamp') {
      updateExpression += `, #field${index} = :value${index}`;
      expressionAttributeValues[`:value${index}`] = workoutData[key];
      expressionAttributeNames[`#field${index}`] = key;
    }
  });
  
  const updateCommand = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    ReturnValues: 'ALL_NEW'
  });
  
  const result = await dynamoDB.send(updateCommand);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Attributes)
  };
}

async function deleteWorkout(workoutId, sourceIp) {
  const userId = getUserIdFromIp(sourceIp);
  
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  });
  
  await dynamoDB.send(command);
  
  return {
    statusCode: 204,
    headers: {
      'Content-Type': 'application/json'
    },
    body: ''
  };
}

function getUserIdFromIp(sourceIp) {
  if (!sourceIp) {
    return 'anonymous';
  }
  
  return sourceIp.replace(/\./g, '-').replace(/:/g, '-');
}
```

## Lambda Package Configuration

```json
{
  "name": "workout-processor",
  "version": "1.0.0",
  "description": "Lambda function for processing workout logs",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.883.0",
    "@aws-sdk/lib-dynamodb": "^3.901.0",
    "@aws-sdk/client-ssm": "^3.879.0"
  }
}
```