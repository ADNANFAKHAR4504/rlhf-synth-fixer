### Reasoning Trace
---

Let's break down the requirements and create a complete CDK implementation:

1. We need to create:
   - API Gateway with REST endpoints
   - Lambda functions (Node.js 18) for processing workout logs
   - DynamoDB table with auto-scaling for storing workout data
   - IAM roles with least privilege
   - Systems Manager Parameter Store for configuration
   - CloudWatch for monitoring

2. The solution should prioritize:
   - Security
   - Performance
   - Operational visibility

Let me write the complete CDK code in JavaScript:

```javascript
const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const lambda = require('aws-cdk-lib/aws-lambda');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const iam = require('aws-cdk-lib/aws-iam');
const ssm = require('aws-cdk-lib/aws-ssm');
const logs = require('aws-cdk-lib/aws-logs');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');

class FitnessTrackingApiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create DynamoDB table with auto-scaling
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
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Add auto-scaling to DynamoDB table
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

    // Create SSM parameters for configuration
    const apiRateLimitParam = new ssm.StringParameter(this, 'ApiRateLimit', {
      parameterName: '/fitness-tracking/api-rate-limit',
      stringValue: '1000',
      description: 'Rate limit for fitness tracking API (requests per minute)',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Create Lambda function for workout log processing
    const workoutLogProcessorFunction = new lambda.Function(this, 'WorkoutLogProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/workout-processor'),
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        TABLE_NAME: workoutLogsTable.tableName,
        API_RATE_LIMIT_PARAM: apiRateLimitParam.parameterName,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });

    // Grant Lambda function access to DynamoDB table
    workoutLogsTable.grantReadWriteData(workoutLogProcessorFunction);

    // Grant Lambda function access to SSM parameter
    apiRateLimitParam.grantRead(workoutLogProcessorFunction);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'FitnessTrackingApi', {
      restApiName: 'Fitness Tracking API',
      description: 'API for tracking fitness workouts',
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
      cloudWatchRole: true,
    });

    // Set up API Gateway throttling
    api.addGatewayResponse('ThrottleResponse', {
      type: apigateway.ResponseType.THROTTLED,
      statusCode: '429',
      templates: {
        'application/json': '{"message": "Rate limit exceeded", "error": "Too many requests"}',
      },
    });

    // Add API Gateway resources and methods
    const workoutsResource = api.root.addResource('workouts');
    
    // POST /workouts
    workoutsResource.addMethod('POST', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // GET /workouts
    workoutsResource.addMethod('GET', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // Create individual workout resource
    const workoutResource = workoutsResource.addResource('{workoutId}');
    
    // GET /workouts/{workoutId}
    workoutResource.addMethod('GET', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // PUT /workouts/{workoutId}
    workoutResource.addMethod('PUT', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // DELETE /workouts/{workoutId}
    workoutResource.addMethod('DELETE', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // Create CloudWatch Alarms
    const apiErrorsAlarm = new cloudwatch.Alarm(this, 'ApiErrorsAlarm', {
      metric: api.metricServerError({
        period: Duration.minutes(1),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if the API has too many server errors',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      metric: workoutLogProcessorFunction.metricErrors({
        period: Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if the Lambda function has too many errors',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const dynamoReadThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoReadThrottleAlarm', {
      metric: workoutLogsTable.metricReadThrottleEvents({
        period: Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if DynamoDB read requests are throttled',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const dynamoWriteThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoWriteThrottleAlarm', {
      metric: workoutLogsTable.metricWriteThrottleEvents({
        period: Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if DynamoDB write requests are throttled',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    
    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'FitnessTrackingDashboard', {
      dashboardName: 'FitnessTracking-Monitoring',
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
          workoutLogsTable.metricReadThrottleEvents(),
          workoutLogsTable.metricWriteThrottleEvents(),
        ],
      })
    );
  }
}

module.exports = { FitnessTrackingApiStack }
```

Now let's create the actual application file (`bin/fitness-tracking-api.js`):

```javascript
#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { FitnessTrackingApiStack } = require('../lib/fitness-tracking-api-stack');

const app = new cdk.App();
new FitnessTrackingApiStack(app, 'FitnessTrackingApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Serverless API for fitness workout tracking',
});
```

Now let's include a basic Lambda function implementation for the workout log processor (`lambda/workout-processor/index.js`):

```javascript
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();

const TABLE_NAME = process.env.TABLE_NAME;
const API_RATE_LIMIT_PARAM = process.env.API_RATE_LIMIT_PARAM;

// Cache for parameters
let rateLimit = 1000; // Default value
let paramLastFetched = 0;

async function getParameter(paramName) {
  const now = Date.now();
  
  // Fetch parameter from SSM if it hasn't been fetched in the last 5 minutes
  if (now - paramLastFetched > 300000) {
    try {
      const response = await ssm.getParameter({
        Name: paramName,
        WithDecryption: true,
      }).promise();
      
      if (response.Parameter && response.Parameter.Value) {
        rateLimit = parseInt(response.Parameter.Value, 10);
        paramLastFetched = now;
      }
    } catch (error) {
      console.error('Error fetching parameter:', error);
      // Continue with the cached value
    }
  }
  
  return rateLimit;
}

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Get rate limit from parameter store
  await getParameter(API_RATE_LIMIT_PARAM);
  
  try {
    // Process based on HTTP method
    const httpMethod = event.httpMethod;
    const path = event.path;
    
    if (path.startsWith('/workouts')) {
      if (httpMethod === 'GET' && event.pathParameters && event.pathParameters.workoutId) {
        // GET /workouts/{workoutId}
        return await getWorkout(event.pathParameters.workoutId, event.requestContext.identity.userArn);
      } else if (httpMethod === 'GET') {
        // GET /workouts
        return await listWorkouts(event.requestContext.identity.userArn);
      } else if (httpMethod === 'POST') {
        // POST /workouts
        const workoutData = JSON.parse(event.body);
        return await createWorkout(workoutData, event.requestContext.identity.userArn);
      } else if (httpMethod === 'PUT' && event.pathParameters && event.pathParameters.workoutId) {
        // PUT /workouts/{workoutId}
        const workoutData = JSON.parse(event.body);
        return await updateWorkout(event.pathParameters.workoutId, workoutData, event.requestContext.identity.userArn);
      } else if (httpMethod === 'DELETE' && event.pathParameters && event.pathParameters.workoutId) {
        // DELETE /workouts/{workoutId}
        return await deleteWorkout(event.pathParameters.workoutId, event.requestContext.identity.userArn);
      }
    }
    
    // Default response for unhandled routes
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

async function getWorkout(workoutId, userArn) {
  const userId = getUserIdFromArn(userArn);
  
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  };
  
  const result = await dynamoDB.get(params).promise();
  
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

async function listWorkouts(userArn) {
  const userId = getUserIdFromArn(userArn);
  
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    Limit: 100 // Limit to 100 workouts per request
  };
  
  const result = await dynamoDB.query(params).promise();
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Items)
  };
}

async function createWorkout(workoutData, userArn) {
  const userId = getUserIdFromArn(userArn);
  const timestamp = new Date().toISOString();
  
  const item = {
    userId: userId,
    workoutTimestamp: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...workoutData
  };
  
  const params = {
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(workoutTimestamp)'
  };
  
  await dynamoDB.put(params).promise();
  
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  };
}

async function updateWorkout(workoutId, workoutData, userArn) {
  const userId = getUserIdFromArn(userArn);
  const timestamp = new Date().toISOString();
  
  // First check if the workout exists
  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  };
  
  const existingWorkout = await dynamoDB.get(getParams).promise();
  
  if (!existingWorkout.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Workout not found' })
    };
  }
  
  // Build update expression
  let updateExpression = 'SET updatedAt = :updatedAt';
  const expressionAttributeValues = {
    ':updatedAt': timestamp
  };
  
  // Add all the fields from workoutData to the update expression
  Object.keys(workoutData).forEach((key, index) => {
    if (key !== 'userId' && key !== 'workoutTimestamp') {
      updateExpression += `, #field${index} = :value${index}`;
      expressionAttributeValues[`:value${index}`] = workoutData[key];
    }
  });
  
  // Create expression attribute names
  const expressionAttributeNames = {};
  Object.keys(workoutData).forEach((key, index) => {
    if (key !== 'userId' && key !== 'workoutTimestamp') {
      expressionAttributeNames[`#field${index}`] = key;
    }
  });
  
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW'
  };
  
  const result = await dynamoDB.update(params).promise();
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Attributes)
  };
}

async function deleteWorkout(workoutId, userArn) {
  const userId = getUserIdFromArn(userArn);
  
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  };
  
  await dynamoDB.delete(params).promise();
  
  return {
    statusCode: 204,
    headers: {
      'Content-Type': 'application/json'
    },
    body: ''
  };
}

function getUserIdFromArn(userArn) {
  // Extract user ID from the ARN
  // This is a simplified version, in production you would use a proper identity system
  if (!userArn) {
    return 'anonymous';
  }
  
  const parts = userArn.split(':');
  return parts[parts.length - 1];
}
```

Now I'll put together the final code for this CDK application, merging all the components:

Actually, let's clean up the code based on the requirements:

1. We only need to provide the CDK code without explanations, descriptions, or comments.
2. Let's make sure everything is coherent and organized.

I'll simplify and remove all comments from the implementation to provide a cleaner output.
### Answer 
---

```javascript
const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const lambda = require('aws-cdk-lib/aws-lambda');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const iam = require('aws-cdk-lib/aws-iam');
const ssm = require('aws-cdk-lib/aws-ssm');
const logs = require('aws-cdk-lib/aws-logs');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');

class FitnessTrackingApiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

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
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
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
      parameterName: '/fitness-tracking/api-rate-limit',
      stringValue: '1000',
      description: 'Rate limit for fitness tracking API (requests per minute)',
      tier: ssm.ParameterTier.STANDARD,
    });

    const workoutLogProcessorFunction = new lambda.Function(this, 'WorkoutLogProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/workout-processor'),
      timeout: Duration.seconds(30),
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
      restApiName: 'Fitness Tracking API',
      description: 'API for tracking fitness workouts',
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
      cloudWatchRole: true,
    });

    api.addGatewayResponse('ThrottleResponse', {
      type: apigateway.ResponseType.THROTTLED,
      statusCode: '429',
      templates: {
        'application/json': '{"message": "Rate limit exceeded", "error": "Too many requests"}',
      },
    });

    const workoutsResource = api.root.addResource('workouts');
    
    workoutsResource.addMethod('POST', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    workoutsResource.addMethod('GET', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    const workoutResource = workoutsResource.addResource('{workoutId}');
    
    workoutResource.addMethod('GET', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    workoutResource.addMethod('PUT', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    workoutResource.addMethod('DELETE', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    const apiErrorsAlarm = new cloudwatch.Alarm(this, 'ApiErrorsAlarm', {
      metric: api.metricServerError({
        period: Duration.minutes(1),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if the API has too many server errors',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      metric: workoutLogProcessorFunction.metricErrors({
        period: Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if the Lambda function has too many errors',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const dynamoReadThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoReadThrottleAlarm', {
      metric: workoutLogsTable.metricReadThrottleEvents({
        period: Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if DynamoDB read requests are throttled',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const dynamoWriteThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoWriteThrottleAlarm', {
      metric: workoutLogsTable.metricWriteThrottleEvents({
        period: Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if DynamoDB write requests are throttled',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    
    const dashboard = new cloudwatch.Dashboard(this, 'FitnessTrackingDashboard', {
      dashboardName: 'FitnessTracking-Monitoring',
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
          workoutLogsTable.metricReadThrottleEvents(),
          workoutLogsTable.metricWriteThrottleEvents(),
        ],
      })
    );
  }
}

module.exports = { FitnessTrackingApiStack }
```

```javascript
#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { FitnessTrackingApiStack } = require('../lib/fitness-tracking-api-stack');

const app = new cdk.App();
new FitnessTrackingApiStack(app, 'FitnessTrackingApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Serverless API for fitness workout tracking',
});
```

```javascript
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();

const TABLE_NAME = process.env.TABLE_NAME;
const API_RATE_LIMIT_PARAM = process.env.API_RATE_LIMIT_PARAM;

let rateLimit = 1000;
let paramLastFetched = 0;

async function getParameter(paramName) {
  const now = Date.now();
  
  if (now - paramLastFetched > 300000) {
    try {
      const response = await ssm.getParameter({
        Name: paramName,
        WithDecryption: true,
      }).promise();
      
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
        return await getWorkout(event.pathParameters.workoutId, event.requestContext.identity.userArn);
      } else if (httpMethod === 'GET') {
        return await listWorkouts(event.requestContext.identity.userArn);
      } else if (httpMethod === 'POST') {
        const workoutData = JSON.parse(event.body);
        return await createWorkout(workoutData, event.requestContext.identity.userArn);
      } else if (httpMethod === 'PUT' && event.pathParameters && event.pathParameters.workoutId) {
        const workoutData = JSON.parse(event.body);
        return await updateWorkout(event.pathParameters.workoutId, workoutData, event.requestContext.identity.userArn);
      } else if (httpMethod === 'DELETE' && event.pathParameters && event.pathParameters.workoutId) {
        return await deleteWorkout(event.pathParameters.workoutId, event.requestContext.identity.userArn);
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

async function getWorkout(workoutId, userArn) {
  const userId = getUserIdFromArn(userArn);
  
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  };
  
  const result = await dynamoDB.get(params).promise();
  
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

async function listWorkouts(userArn) {
  const userId = getUserIdFromArn(userArn);
  
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    Limit: 100
  };
  
  const result = await dynamoDB.query(params).promise();
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Items)
  };
}

async function createWorkout(workoutData, userArn) {
  const userId = getUserIdFromArn(userArn);
  const timestamp = new Date().toISOString();
  
  const item = {
    userId: userId,
    workoutTimestamp: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...workoutData
  };
  
  const params = {
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(workoutTimestamp)'
  };
  
  await dynamoDB.put(params).promise();
  
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  };
}

async function updateWorkout(workoutId, workoutData, userArn) {
  const userId = getUserIdFromArn(userArn);
  const timestamp = new Date().toISOString();
  
  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  };
  
  const existingWorkout = await dynamoDB.get(getParams).promise();
  
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
  
  Object.keys(workoutData).forEach((key, index) => {
    if (key !== 'userId' && key !== 'workoutTimestamp') {
      updateExpression += `, #field${index} = :value${index}`;
      expressionAttributeValues[`:value${index}`] = workoutData[key];
    }
  });
  
  const expressionAttributeNames = {};
  Object.keys(workoutData).forEach((key, index) => {
    if (key !== 'userId' && key !== 'workoutTimestamp') {
      expressionAttributeNames[`#field${index}`] = key;
    }
  });
  
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW'
  };
  
  const result = await dynamoDB.update(params).promise();
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result.Attributes)
  };
}

async function deleteWorkout(workoutId, userArn) {
  const userId = getUserIdFromArn(userArn);
  
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      workoutTimestamp: workoutId
    }
  };
  
  await dynamoDB.delete(params).promise();
  
  return {
    statusCode: 204,
    headers: {
      'Content-Type': 'application/json'
    },
    body: ''
  };
}

function getUserIdFromArn(userArn) {
  if (!userArn) {
    return 'anonymous';
  }
  
  const parts = userArn.split(':');
  return parts[parts.length - 1];
}
```