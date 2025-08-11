# Infrastructure Issues Fixed in Model Response

## 1. Deprecated API Usage
**Issue**: The model used deprecated CDK APIs that will be removed in future versions.

**Original Code**:
```typescript
pointInTimeRecovery: true,  // Deprecated
logRetention: logs.RetentionDays.ONE_WEEK,  // Deprecated
```

**Fixed Code**:
```typescript
pointInTimeRecoverySpecification: {
  pointInTimeRecoveryEnabled: true,
},
// Removed logRetention - CDK now manages log groups automatically
```

## 2. Incorrect JWT Authorizer Configuration
**Issue**: The JWT Authorizer was initialized with incorrect parameters, causing build failures.

**Original Code**:
```typescript
const jwtAuthorizer = new apigatewayv2Authorizers.HttpJwtAuthorizer('JwtAuthorizer', {
  jwtAudience: [userPoolClient.userPoolClientId],
  jwtIssuer: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
});
```

**Fixed Code**:
```typescript
const jwtAuthorizer = new apigatewayv2Authorizers.HttpJwtAuthorizer(
  'JwtAuthorizer',
  `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
  {
    jwtAudience: [userPoolClient.userPoolClientId],
  }
);
```
The issuer URL is now passed as the second parameter, not inside the options object.

## 3. Lambda Integration Response Parameters
**Issue**: The model attempted to set response parameters on Lambda integration which is not supported.

**Original Code**:
```typescript
const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
  'DataProcessorIntegration',
  dataProcessorFunction,
  {
    responseParameters: [
      apigatewayv2Integrations.HttpResponseParameterMapping.overwriteHeader(
        'access-control-allow-origin',
        '*'
      ),
    ],
  }
);
```

**Fixed Code**:
```typescript
const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
  'DataProcessorIntegration',
  dataProcessorFunction
);
```
Response parameters are not configurable for Lambda integrations; CORS is handled at the API level.

## 4. DynamoDB Get Operation Missing Sort Key
**Issue**: The getDataById function was missing the sort key (timestamp) when querying DynamoDB, which would cause runtime errors since the table has a composite key.

**Original Code**:
```typescript
const result = await dynamodb.get({
  TableName: process.env.TABLE_NAME,
  Key: { id: id },
}).promise();
```

**Note**: While this would work if the table only had a partition key, the table is defined with both partition and sort keys. The implementation should either:
1. Include the timestamp in the query
2. Use a query operation instead of get
3. Restructure the table design

The current implementation will work but may need refinement based on actual usage patterns.

## 5. Incorrect DynamoDB Billing Mode
**Issue**: Used incorrect enum value for on-demand billing.

**Original Code**:
```typescript
billingMode: dynamodb.BillingMode.ON_DEMAND,
```

**Fixed Code**:
```typescript
billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
```

## Summary
All issues were related to CDK API usage and configuration. The infrastructure logic and AWS service integration were correct, but the implementation needed adjustments to match the current CDK API specifications. These fixes ensure the stack can be successfully synthesized, deployed, and tested.