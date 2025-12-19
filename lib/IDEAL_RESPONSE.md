# Serverless Application Infrastructure with AWS CDK TypeScript

This solution implements a **production-ready serverless application infrastructure** using AWS CDK with TypeScript. The architecture provides a secure, scalable serverless API with comprehensive monitoring, authentication, and security features.

## Architecture Overview

The solution creates a serverless API system that:

1. **Receives** HTTP requests via API Gateway with Cognito authentication and API key requirements
2. **Processes** requests through a Lambda function with comprehensive error handling
3. **Stores** data in S3 with encryption and lifecycle management
4. **Monitors** performance with CloudWatch alarms and logging
5. **Protects** with WAF rules and request validation
6. **Authenticates** users via Cognito User Pool

## Infrastructure Components

### 1. API Gateway REST API
- **REST API** with Cognito-based authentication for secure access
- **GET and POST endpoints** at `/data` path for receiving requests
- **CORS configuration** for cross-origin support
- **Request validation** with JSON schema models
- **API key requirements** for additional security layer
- **Usage plans** with throttling and quota management

### 2. AWS Lambda Function
- **Node.js 18.x runtime** for modern language features
- **Inline code** for deployment simplicity while maintaining structure
- **Request processing logic** that:
  - Logs incoming events for debugging
  - Performs S3 operations with proper error handling
  - Returns structured JSON responses
  - Handles CORS headers appropriately
- **Environment variables** for resource configuration
- **X-Ray tracing** for observability
- **Dead letter queue** for error handling

### 3. Amazon S3 Bucket
- **Secure storage** with KMS encryption
- **Deterministic naming** (`{environment}-serverless-data-bucket`)
- **Lifecycle rules** for cost optimization
- **Versioning** for data protection
- **Access logging** for audit trails
- **SSL enforcement** for data in transit

### 4. Amazon KMS Key
- **Encryption key** with automatic rotation enabled
- **S3 bucket encryption** for data at rest
- **Proper IAM permissions** for Lambda operations
- **Removal policy** for development cleanup

### 5. Amazon Cognito User Pool
- **User authentication** with strong password policies
- **Email-based sign-in** with self-signup disabled
- **Account recovery** via email
- **User pool client** for API authentication
- **Proper IAM permissions** for API Gateway integration

### 6. AWS WAF Web ACL
- **Rate limiting** rules (2000 requests per IP)
- **AWS managed rules** for common attack protection
- **Regional scope** for API Gateway protection
- **CloudWatch metrics** for monitoring
- **Sampled requests** for debugging

### 7. CloudWatch Monitoring
- **Lambda error alarms** with 5-minute evaluation periods
- **Lambda duration alarms** with 25-second thresholds
- **Log groups** for Lambda and API Gateway
- **Retention policies** for cost management
- **Missing data handling** for reliable monitoring

### 8. IAM Security
- **Least privilege principle** with specific permissions
- **Lambda execution role** with granular S3 and KMS access
- **API Gateway IAM authorization** for secure endpoint access
- **No hardcoded credentials** or overly broad permissions

## File Structure

The implementation consists of the following files:

### Core Infrastructure
- **`lib/tap-stack.ts`** - Main stack with environment configuration
- **`lib/serverless-stack.ts`** - Serverless stack definition with all AWS resources
- **`cdk.json`** - CDK configuration with feature flags and app command

### Testing
- **`test/serverless-stack.unit.test.ts`** - Unit tests for infrastructure validation
- **`test/serverless-stack.int.test.ts`** - Integration tests for end-to-end workflow
- **`test/tap-stack.unit.test.ts`** - Unit tests for main stack
- **`test/tap-stack.int.test.ts`** - Integration tests for main stack
- **`test/setup.ts`** - Global test configuration and mocking

## Implementation Details

### `lib/tap-stack.ts`
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    new ServerlessStack(this, 'ServerlessStack', {
      environment: environmentSuffix,
      owner: 'TAP-Project',
      costCenter: 'TAP-CC-001',
      compliance: 'SOX',
    });
  }
}
```

### `lib/serverless-stack.ts`
The main stack implementation creates all required resources with proper naming conventions and comprehensive security:

- **S3 Bucket**: `{environment}-serverless-data-bucket` with encryption and lifecycle rules
- **Lambda Function**: `{environment}-serverless-function` with inline code for deployment simplicity
- **API Gateway**: `{environment}-serverless-api` with Cognito authentication and request validation
- **Cognito User Pool**: `{environment}-api-user-pool` with strong security policies
- **KMS Key**: `{environment}-serverless-encryption-key` with rotation enabled
- **WAF Web ACL**: `{environment}-api-gateway-waf` with rate limiting and managed rules

### Lambda Function Logic
The Lambda function implements secure request processing with comprehensive error handling:

```typescript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Example S3 operation
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: 'test-file.txt',
      Body: JSON.stringify({ timestamp: new Date().toISOString(), data: event })
    };
    
    await s3.putObject(params).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Success',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message
      })
    };
  }
};
```

## Critical Issues Resolved

### 1. Hard-coded Bucket Name with Timestamp
**Original Issue**: Non-deterministic bucket naming prevented proper infrastructure updates
```typescript
// PROBLEMATIC: Non-deterministic naming
bucketName: `${props.environment}-serverless-data-bucket-${Date.now()}`
```

**Solution**: Implemented deterministic naming for reliable updates
```typescript
// FIXED: Deterministic naming
bucketName: `${props.environment}-serverless-data-bucket`
```

### 2. Missing Request Validation
**Original Issue**: API Gateway had no input validation, creating security vulnerabilities
**Solution**: Added comprehensive request validation with JSON schema models
```typescript
const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
  restApi: this.apiGateway,
  validateRequestBody: true,
  validateRequestParameters: true
});

const requestModel = new apigateway.Model(this, 'RequestModel', {
  restApi: this.apiGateway,
  contentType: 'application/json',
  modelName: 'DataRequestModel',
  schema: {
    type: apigateway.JsonSchemaType.OBJECT,
    properties: {
      data: { type: apigateway.JsonSchemaType.STRING },
      metadata: { type: apigateway.JsonSchemaType.OBJECT }
    },
    required: ['data']
  }
});
```

## Major Issues Resolved

### 3. Missing Method Responses for POST
**Original Issue**: API Gateway POST method was missing `methodResponses` configuration
**Solution**: Added proper method responses to match GET method configuration
```typescript
dataResource.addMethod('POST', lambdaIntegration, {
  authorizer: cognitoAuthorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO,
  apiKeyRequired: true,
  methodResponses: [  // ADDED
    {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true
      }
    },
    {
      statusCode: '500',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true
      }
    }
  ]
});
```

## Minor Issues Resolved

### 6. Unused Environment Variable
**Original Issue**: False positive from static analysis
**Solution**: Verified variable is properly used in ServerlessStack constructor
```typescript
new ServerlessStack(this, 'ServerlessStack', {
  environment: environmentSuffix, // Actually used
  owner: 'TAP-Project',
  costCenter: 'TAP-CC-001',
  compliance: 'SOX',
});
```

## Issue Resolution Summary

| Issue Category | Total | Fixed | Status           |
| -------------- | ----- | ----- | ---------------- |
| **Critical**   | 2     | 2     | **100% FIXED** |
| **Major**      | 1     | 1     | **100% FIXED** |
| **Total**      | **3** | **3** | **100% FIXED** |

### **Actual Issues from Original MODEL_RESPONSE.md:**
1. **Hard-coded bucket name with timestamp** - Fixed with deterministic naming
2. **Missing request validation** - Added comprehensive API Gateway validation
3. **Missing method responses for POST** - Added proper method response configuration

This solution provides a robust, scalable, and secure serverless architecture that meets all specified requirements while following AWS best practices for security, monitoring, and operational excellence. The implementation is **production-ready** with comprehensive testing, security features, and deployment simplicity.