# Infrastructure Changes Required

## Critical Issues

### 1. DynamoDB Table RemovalPolicy
**Problem**: The table uses `RemovalPolicy.RETAIN` which prevents stack deletion.
```javascript
removalPolicy: RemovalPolicy.RETAIN,
pointInTimeRecovery: true,
```

**Fix**: Use `RemovalPolicy.DESTROY` and remove point-in-time recovery for a deletable stack.
```javascript
removalPolicy: cdk.RemovalPolicy.DESTROY,
```

### 2. API Gateway Authorization Strategy
**Problem**: Uses IAM authorization which requires AWS credentials and complicates client authentication.
```javascript
authorizationType: apigateway.AuthorizationType.IAM,
```

**Fix**: Implement API Key authentication with usage plans for simpler access control.
```javascript
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

workoutsResource.addMethod('POST', new apigateway.LambdaIntegration(workoutLogProcessorFunction), {
  apiKeyRequired: true,
});
```

### 3. SSM Parameter Naming
**Problem**: Parameter name lacks environment suffix causing conflicts in multi-environment deployments.
```javascript
parameterName: '/fitness-tracking/api-rate-limit',
```

**Fix**: Include environment suffix in parameter name.
```javascript
parameterName: `/fitness-tracking/api-rate-limit-${environmentSuffix}`,
```

### 4. DynamoDB Configuration
**Problem**: Missing explicit capacity configuration causes deployment issues.
```javascript
billingMode: dynamodb.BillingMode.PROVISIONED,
```

**Fix**: Add explicit read and write capacity units.
```javascript
billingMode: dynamodb.BillingMode.PROVISIONED,
removalPolicy: cdk.RemovalPolicy.DESTROY,
readCapacity: 5,
writeCapacity: 5,
```

### 5. Lambda User Identification
**Problem**: Uses `event.requestContext.identity.userArn` which is unavailable with API Key authentication.
```javascript
return await getWorkout(event.pathParameters.workoutId, event.requestContext.identity.userArn);
```

**Fix**: Use `sourceIp` for user identification.
```javascript
return await getWorkout(event.pathParameters.workoutId, event.requestContext.identity.sourceIp);

function getUserIdFromIp(sourceIp) {
  if (!sourceIp) {
    return 'anonymous';
  }
  return sourceIp.replace(/\./g, '-').replace(/:/g, '-');
}
```

## Additional Improvements

### 6. CloudWatch Dashboard Naming
**Problem**: Dashboard name lacks environment suffix.
```javascript
dashboardName: 'FitnessTracking-Monitoring',
```

**Fix**: Include environment suffix.
```javascript
dashboardName: `FitnessTracking-Monitoring-${environmentSuffix}`,
```

### 7. API Gateway Naming
**Problem**: API name lacks environment suffix.
```javascript
restApiName: 'Fitness Tracking API',
```

**Fix**: Include environment suffix.
```javascript
restApiName: `Fitness-Tracking-API-${environmentSuffix}`,
```

### 8. Stack Outputs
**Problem**: Missing exports for deployment outputs needed by integration tests.

**Fix**: Add CloudFormation outputs.
```javascript
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
```

### 9. Lambda SDK Usage
**Problem**: Uses AWS SDK v2 which is deprecated.
```javascript
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();
```

**Fix**: Use AWS SDK v3.
```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const ssm = new SSMClient({});
```

### 10. DynamoDB Throttle Metrics
**Problem**: Uses incorrect metrics for DynamoDB throttling alarms.
```javascript
metric: workoutLogsTable.metricReadThrottleEvents()
metric: workoutLogsTable.metricWriteThrottleEvents()
```

**Fix**: Use available metrics.
```javascript
metric: workoutLogsTable.metricUserErrors()
metric: workoutLogsTable.metricSystemErrorsForOperations({
  operations: [dynamodb.Operation.PUT_ITEM],
})
```

## Summary
The main infrastructure changes focus on making the stack deletable, simplifying authentication with API keys, ensuring proper environment isolation, and using modern AWS SDK v3.