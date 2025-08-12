below were the model failures observed:

# Model Response Failures

Below were the model failures observed when comparing MODEL_RESPONSE.md to IDEAL_RESPONSE.md:

---

## 1. Project Structure
- **Failure:** Model did not provide or omitted a clear project structure (missing folders/files like `lib/`, `lambda/`, `bin/`).

## 2. Naming Convention
- **Failure:** Resource names did not follow the required `<service>-<team>-<environment>` format. Example: used defaults like `MyFunction` instead of `lambda-nova-team-development`.

## 3. Lambda Function Configuration
- **Failure:** Omitted or incorrectly set `functionName`, `handler`, or `code` properties.
  ```typescript
  // IDEAL
  functionName: 'lambda-nova-team-development',
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),

## 4. Provisioned Concurrency & Auto Scaling
- **Failure:** Did not configure provisioned concurrency or auto scaling for Lambda.
  ```typescript
  // IDEAL
  new lambda.CfnProvisionedConcurrencyConfig(this, 'ProvisionedConcurrency', {
    functionName: lambdaFunction.functionName,
    qualifier: lambdaAlias.aliasName,
    provisionedConcurrencyCount: 100
  });
  new applicationautoscaling.ScalableTarget(this, 'LambdaScalableTarget', {
    serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
    resourceId: `function:${lambdaFunction.functionName}:${lambdaAlias.aliasName}`,
    scalableDimension: 'lambda:function:ProvisionedConcurrency',
    minCapacity: 50,
    maxCapacity: 1000,
    role: autoScalingRole
  });

## 5. Centralized Logging
- **Failure:** No dedicated CloudWatch Log Group or retention policy set.
  ```typescript
  // IDEAL
  new logs.LogGroup(this, 'LambdaLogGroup', {
    logGroupName: `/aws/lambda/lambda-nova-team-development`,
    retention: logs.RetentionDays.THREE_MONTHS,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

## 6. Mandatory Tagging
Failure: Missing or incomplete resource tagging
``` typescript
// IDEAL
cdk.Tags.of(this).add('project', 'IaC-AWS-Nova-Model-Breaking');
cdk.Tags.of(this).add('owner', 'nova-team');
cdk.Tags.of(this).add('environment', 'development');
```

## 7. API Gateway Integration
```typescript
// IDEAL
new apigateway.HttpApi(this, 'NovaHttpApi', {
  apiName: 'api-gateway-nova-team-development',
  corsPreflight: {
      allowOrigins: ['*'],
    allowMethods: [
      apigateway.CorsHttpMethod.GET,
      apigateway.CorsHttpMethod.POST,
      apigateway.CorsHttpMethod.PUT,
      apigateway.CorsHttpMethod.DELETE
    ],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token']
  },
  defaultThrottle: {
    rateLimit: 10000,
    burstLimit: 20000
  }
});
```