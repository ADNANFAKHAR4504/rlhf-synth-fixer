# Model Failures Documentation

This document captures common failure patterns and mistakes that language models might make when implementing the serverless infrastructure requirements from TASK_DESCRIPTION.md.

## Infrastructure Design Failures

### 1. VPC Configuration Mistakes

**Failure Pattern**: Model creates VPC but fails to implement DynamoDB VPC Gateway Endpoint
```typescript
// INCORRECT - Missing DynamoDB endpoint
const vpc = new ec2.Vpc(this, 'MyVpc', {
  maxAzs: 2
});
// Missing: vpc.addGatewayEndpoint for DynamoDB
```

**Why This Fails**: Lambda functions in VPC cannot access DynamoDB without internet gateway or VPC endpoint, violating the requirement to avoid public internet usage.

**Correct Implementation**: Always add DynamoDB Gateway VPC Endpoint when Lambda is in VPC.

### 2. Lambda Layer Implementation Failures

**Failure Pattern**: Model tries to create Lambda layers with external file dependencies
```typescript
// INCORRECT - Requires external files
const layer = new lambda.LayerVersion(this, 'Layer', {
  code: lambda.Code.fromAsset('lambda-layers/dependencies')
});
```

**Why This Fails**: Task constraints specify updating existing stack only, no new file creation allowed.

**Correct Implementation**: Use inline code or remove layers entirely when file creation is restricted.

### 3. API Gateway Logging Configuration Failures

**Failure Pattern**: Model enables API Gateway logging without setting up CloudWatch role
```typescript
// INCORRECT - Missing IAM role setup
deployOptions: {
  loggingLevel: apigateway.MethodLoggingLevel.INFO,
  accessLogDestination: new apigateway.LogGroupLogDestination(logGroup)
}
```

**Why This Fails**: API Gateway requires account-level CloudWatch role configuration before enabling logging.

**Correct Implementation**: Create IAM role and set up CfnAccount resource with CloudWatch role ARN.

## Security and IAM Failures

### 4. Overprivileged IAM Policies

**Failure Pattern**: Model grants overly broad permissions
```typescript
// INCORRECT - Too broad permissions
new iam.PolicyStatement({
  actions: ['dynamodb:*'],
  resources: ['*']
})
```

**Why This Fails**: Violates least privilege principle and security best practices.

**Correct Implementation**: Grant specific permissions to specific resources using resource ARNs.

### 5. Missing API Key Authentication

**Failure Pattern**: Model creates API Gateway without requiring API keys
```typescript
// INCORRECT - No API key requirement
resource.addMethod('GET', integration, {
  authorizationType: apigateway.AuthorizationType.NONE
});
```

**Why This Fails**: Requirement explicitly states "Secure API Gateway using an API Key".

**Correct Implementation**: Set `apiKeyRequired: true` for all methods and create usage plans.

### 6. Incomplete CORS Configuration

**Failure Pattern**: Model partially implements CORS headers
```typescript
// INCORRECT - Incomplete CORS
defaultCorsPreflightOptions: {
  allowOrigins: ['*']
  // Missing: allowMethods, allowHeaders
}
```

**Why This Fails**: Requirement states "The API should include CORS headers to allow cross-origin requests".

**Correct Implementation**: Include all required CORS headers (origins, methods, headers).

## Resource Configuration Failures

### 7. DynamoDB Capacity and TTL Mistakes

**Failure Pattern**: Model sets insufficient capacity or forgets TTL
```typescript
// INCORRECT - Insufficient capacity and missing TTL
new dynamodb.Table(this, 'Table', {
  readCapacity: 1,  // Too low
  writeCapacity: 1, // Too low
  // Missing: timeToLiveAttribute
});
```

**Why This Fails**: Requirements specify minimum 5 read/write capacity and TTL for 30-day lifecycle.

**Correct Implementation**: Set capacity ≥5 and configure TTL attribute for automatic deletion.

### 8. Lambda Configuration Oversights

**Failure Pattern**: Model misses critical Lambda configuration
```typescript
// INCORRECT - Missing required configurations
new lambda.Function(this, 'Function', {
  runtime: lambda.Runtime.NODEJS_18_X, // Wrong runtime
  // Missing: tracing, deadLetterQueue, environment variables
});
```

**Why This Fails**: Requirements specify Python runtime, X-Ray tracing, DLQ, and environment variables.

**Correct Implementation**: Use Python 3.9, enable X-Ray, configure DLQ, and set environment variables.

### 9. Missing Resource Tagging

**Failure Pattern**: Model creates resources without required tags
```typescript
// INCORRECT - No tagging strategy
new dynamodb.Table(this, 'Table', {
  tableName: 'my-table'
  // Missing: Tags
});
```

**Why This Fails**: Requirement states "Tag all resources with 'Environment: production'".

**Correct Implementation**: Use `cdk.Tags.of(this).add()` to tag all resources consistently.

## Monitoring and Observability Failures

### 10. Incomplete X-Ray Configuration

**Failure Pattern**: Model enables X-Ray on Lambda but not API Gateway
```typescript
// INCORRECT - Partial X-Ray configuration
new lambda.Function(this, 'Function', {
  tracing: lambda.Tracing.ACTIVE
});
// Missing: API Gateway tracing
```

**Why This Fails**: Requirement states "Enable X-Ray tracing on both Lambda and API Gateway".

**Correct Implementation**: Enable tracing on both services for complete request tracing.

### 11. CloudWatch Logs Policy Mistakes

**Failure Pattern**: Model creates log groups without proper retention or access policies
```typescript
// INCORRECT - Missing retention and policies
new logs.LogGroup(this, 'LogGroup', {
  logGroupName: '/aws/lambda/my-function'
  // Missing: retention, removalPolicy
});
```

**Why This Fails**: Requirement states "Create a separate logging policy for CloudWatch Logs".

**Correct Implementation**: Set retention period and proper removal policies.

## Integration and Testing Failures

### 12. Inadequate Error Handling

**Failure Pattern**: Model creates Lambda without proper error responses
```python
# INCORRECT - Poor error handling
def handler(event, context):
    # Process without try-catch
    return {"statusCode": 200}
```

**Why This Fails**: Requirement states "The Lambda function should handle errors gracefully and return appropriate HTTP status codes".

**Correct Implementation**: Implement comprehensive try-catch with proper HTTP status codes.

### 13. Missing Usage Plan Configuration

**Failure Pattern**: Model creates API key but no usage plan
```typescript
// INCORRECT - API key without usage plan
const apiKey = new apigateway.ApiKey(this, 'Key');
// Missing: Usage plan with throttling
```

**Why This Fails**: Requirement states "API Gateway usage plans should throttle requests to avoid abuse, limiting to 1000 req/sec".

**Correct Implementation**: Create usage plan with rate limits and associate with API key.

## Common Anti-Patterns

### 14. Hardcoded Values Instead of Environment-Aware Configuration

**Failure Pattern**: Model hardcodes resource names and regions
```typescript
// INCORRECT - Hardcoded values
tableName: 'my-table-production',
// Missing: Environment suffix usage
```

**Why This Fails**: Code should work across different environments (dev, staging, prod).

**Correct Implementation**: Use environment suffix for all resource names.

### 15. Incomplete Stack Outputs

**Failure Pattern**: Model forgets required CloudFormation outputs
```typescript
// INCORRECT - Missing outputs
// No CfnOutput declarations
```

**Why This Fails**: Requirement states "Set up CloudFormation Stack outputs to provide the REST API's endpoint".

**Correct Implementation**: Export all required values (API endpoint, table name, function name, API key ID).

## Testing and Validation Failures

### 16. Insufficient Test Coverage

**Failure Pattern**: Model creates basic tests without comprehensive validation
```typescript
// INCORRECT - Minimal testing
test('stack exists', () => {
  expect(stack).toBeDefined();
});
```

**Why This Fails**: Complex infrastructure requires thorough testing of all components and configurations.

**Correct Implementation**: Test all resource properties, integrations, and live AWS resource behavior.

### 17. Integration Tests Without Real AWS Resources

**Failure Pattern**: Model mocks AWS SDK calls instead of testing live resources
```typescript
// INCORRECT - Mocked AWS calls
jest.mock('@aws-sdk/client-dynamodb');
```

**Why This Fails**: Integration tests should validate actual deployed resources, not mocked responses.

**Correct Implementation**: Use real AWS SDK calls against deployed infrastructure.

## Summary

These failure patterns represent common mistakes when implementing complex serverless architectures. The key lessons are:

1. **Read requirements carefully** - Every specification detail matters
2. **Follow security best practices** - Implement least privilege and proper authentication
3. **Test comprehensively** - Both unit tests and integration tests are essential
4. **Handle errors gracefully** - Implement proper error handling and status codes
5. **Consider operational aspects** - Monitoring, logging, and observability are crucial
6. **Use environment-aware configurations** - Avoid hardcoded values
7. **Validate against live resources** - Integration tests should use real AWS services

Understanding these failure patterns helps in creating robust, secure, and well-tested infrastructure implementations.