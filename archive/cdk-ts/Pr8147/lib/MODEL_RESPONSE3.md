Here are the necessary code changes to fix the deprecation warning and add the requested improvements:

### Updated lib/serverless-api-stack.ts (only the changed sections)

```typescript
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
// ... other imports remain the same

export class ServerlessApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerlessApiStackProps) {
    super(scope, id, props);

    // ... existing code until Lambda function ...

    // Create dedicated log group for Lambda (fixes deprecation)
    const lambdaLogGroup = new logs.LogGroup(this, 'ApiLambdaLogGroup', {
      logGroupName: `/aws/lambda/${projectName}-API-${deploymentDate}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(lambdaLogGroup).add(key, value);
    });

    // Lambda function (updated to use logGroup instead of logRetention)
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `${projectName}-API-${deploymentDate}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'api-handler.lambda_handler',
      code: lambda.Code.fromAsset('lib/lambda'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      role: lambdaRole,
      environment: {
        STAGE: 'production',
        LOGS_BUCKET: logsBucket.bucketName,
      },
      deadLetterQueue: deadLetterQueue,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: lambdaLogGroup, // [OK] Fixed deprecation warning
    });

    // ... existing tags code ...

    // API Key for authentication
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${projectName}-API-Key-${deploymentDate}`,
      description: `API Key for ${projectName} Production API`,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(apiKey).add(key, value);
    });

    // Usage Plan
    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${projectName}-Usage-Plan-${deploymentDate}`,
      description: `Usage plan for ${projectName} API`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(usagePlan).add(key, value);
    });

    // WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'ApiWebAcl', {
      name: `${projectName}-WAF-${deploymentDate}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${projectName}WebAcl`,
      },
    });

    // API Gateway with improved CORS and authentication
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `${projectName}-API-${deploymentDate}`,
      description: `${projectName} Production API`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://yourdomain.com', 'https://app.yourdomain.com'], // [OK] Fixed CORS - specify actual origins
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowCredentials: true, // [OK] Enable credentials for authenticated requests
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER, // [OK] API Key authentication
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: webAcl.attrArn,
    });

    // ... existing tags code ...

    // Lambda integration with API Key requirement
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction, {
      proxy: true,
    });

    // Add proxy resource with API Key requirement
    const proxyResource = api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
      defaultMethodOptions: {
        apiKeyRequired: true, // [OK] Require API Key for all methods
      },
    });

    // Associate API Key with Usage Plan and API
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      api: api,
      stage: api.deploymentStage,
    });

    // ... existing CloudWatch alarms code ...

    // Updated outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID - retrieve value from AWS Console',
    });

    new cdk.CfnOutput(this, 'WAFWebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    // ... other existing outputs ...
  }
}
```

### Updated Lambda Handler (lib/lambda/api-handler.py) - CORS headers section only

```python
# Update the response headers in both success and error responses:

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    # ... existing code until response preparation ...
    
    # Get origin from request headers for CORS
    origin = event.get('headers', {}).get('Origin') or event.get('headers', {}).get('origin')
    allowed_origins = ['https://yourdomain.com', 'https://app.yourdomain.com']
    
    # Determine CORS origin
    cors_origin = origin if origin in allowed_origins else 'https://yourdomain.com'
    
    try:
        # ... existing request handling code ...
        
        # Prepare successful response with improved CORS
        response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': cors_origin,  # [OK] Dynamic origin
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Credentials': 'true',  # [OK] Allow credentials
                'Vary': 'Origin',  # [OK] Important for caching with multiple origins
            },
            'body': json.dumps({
                'success': True,
                'data': response_data,
                'timestamp': datetime.utcnow().isoformat(),
                'stage': os.environ.get('STAGE', 'unknown')
            })
        }
        
        return response
        
    except Exception as e:
        # ... existing error handling ...
        
        # Return error response with improved CORS
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': cors_origin,  # [OK] Dynamic origin
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Credentials': 'true',  # [OK] Allow credentials
                'Vary': 'Origin',  # [OK] Important for caching
            },
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error',
                'timestamp': datetime.utcnow().isoformat(),
                'stage': os.environ.get('STAGE', 'unknown')
            })
        }
```

## Key Improvements Made

### **Fixed Deprecation Warning**
- Replaced `logRetention` with dedicated `LogGroup` resource
- Proper log group management with tagging

### **Added API Authentication**
- API Key-based authentication
- Usage plan with rate limiting and quotas
- Required API key for all endpoints

### **Added WAF Protection**
- Rate limiting (2000 requests per 5 minutes per IP)
- AWS Managed Rules for common attacks
- Protection against known bad inputs
- CloudWatch metrics enabled

### **Fixed CORS Policy**
- Specific allowed origins instead of wildcard
- Credential support enabled
- Dynamic origin handling in Lambda
- Proper `Vary: Origin` header for caching

## Usage Instructions

After deployment, clients need to:

1. **Get the API Key value:**
```bash
aws apigateway get-api-key --api-key <API_KEY_ID> --include-value
```

2. **Make authenticated requests:**
```bash
curl -H "X-API-Key: <API_KEY_VALUE>" \
     -H "Origin: https://yourdomain.com" \
     https://your-api-url/prod/your-endpoint
```

3. **Update allowed origins** in both the CDK stack and Lambda function to match your actual domains.ad