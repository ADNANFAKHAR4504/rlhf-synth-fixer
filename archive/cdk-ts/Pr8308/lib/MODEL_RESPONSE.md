# AWS Serverless Infrastructure with CDK TypeScript

I'll design a secure serverless infrastructure using AWS CDK in TypeScript that meets all the specified requirements. The solution will include an S3 bucket for user data, a Lambda function for processing, and an API Gateway with IP whitelisting.

## Project Structure

Let's start by setting up the CDK project structure:

```typescript
// lib/corp-serverless-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface CorpServerlessStackProps extends cdk.StackProps {
  allowedIpRanges: string[];
}

export class CorpServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CorpServerlessStackProps) {
    super(scope, id, props);

    // Implementation will go here
  }
}
```

## Implementation

Here's the complete implementation of the stack:

```typescript
// lib/corp-serverless-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface CorpServerlessStackProps extends cdk.StackProps {
  allowedIpRanges: string[];
}

export class CorpServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CorpServerlessStackProps) {
    super(scope, id, props);

    // 1. S3 Bucket for User Data
    const userDataBucket = new s3.Bucket(this, 'CorpUserDataBucket', {
      bucketName: 'CorpUserDataBucket',
      versioned: true, // Enable versioning as required
      encryption: s3.BucketEncryption.S3_MANAGED, // Adding encryption for enhanced security
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Ensuring bucket is not publicly accessible
    });

    // 2. Lambda Function with IAM Role
    // Create the IAM role for the Lambda function
    const lambdaRole = new iam.Role(this, 'CorpLambdaRole', {
      roleName: 'CorpUserDataProcessorRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // Add permissions to the role
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    // Grant S3 permissions to the role
    userDataBucket.grantReadWrite(lambdaRole);

    // Create the Lambda function
    const userDataProcessor = new lambda.Function(this, 'CorpUserDataProcessor', {
      functionName: 'CorpUserDataProcessor',
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing user data:', JSON.stringify(event));
          
          // Sample processing logic (minimal for this infrastructure definition)
          const response = {
            statusCode: 200,
            body: JSON.stringify({
              message: 'User data processed successfully',
              input: event
            })
          };
          
          return response;
        };
      `),
    });

    // 3. API Gateway with IP Whitelisting
    // Create the API Gateway
    const api = new apigateway.RestApi(this, 'CorpUserDataApi', {
      restApiName: 'CorpUserDataApi',
      description: 'API for processing user data',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create a resource policy for IP whitelisting
    const apiResourcePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: ['execute-api:/*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: ['execute-api:/*'],
          conditions: {
            NotIpAddress: {
              'aws:SourceIp': props.allowedIpRanges,
            },
          },
        }),
      ],
    });

    // Apply the resource policy to the API Gateway
    const cfnApi = api.node.defaultChild as apigateway.CfnRestApi;
    cfnApi.policy = apiResourcePolicy.toJSON();

    // Create the API Gateway integration with Lambda
    const userDataResource = api.root.addResource('userdata');
    const lambdaIntegration = new apigateway.LambdaIntegration(userDataProcessor);
    userDataResource.addMethod('POST', lambdaIntegration);

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/prod/userdata`,
      description: 'URL for the API Gateway endpoint',
    });
  }
}
```

## CDK App Entry Point

Here's the main app file that instantiates the stack:

```typescript
// bin/corp-serverless-app.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CorpServerlessStack } from '../lib/corp-serverless-stack';

const app = new cdk.App();

// Define the allowed IP ranges for the API Gateway
const allowedIpRanges = [
  '192.168.1.0/24',  // Example corporate office IP range
  '10.0.0.0/16',     // Example VPN IP range
];

new CorpServerlessStack(app, 'CorpServerlessStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1'  // Explicitly set to us-east-1 as required
  },
  allowedIpRanges: allowedIpRanges,
});
```

## Explanation of the Implementation

### 1. S3 Bucket for User Data
- Created an S3 bucket named `CorpUserDataBucket` with versioning enabled
- Added additional security features like encryption and blocking public access

### 2. Lambda Function with IAM Role
- Created a dedicated IAM role named `CorpUserDataProcessorRole` for the Lambda function
- Granted the Lambda function permissions to:
  - Write logs to CloudWatch via the AWS managed policy `AWSLambdaBasicExecutionRole`
  - Read from and write to the S3 bucket via a resource-based policy
- Implemented a simple Lambda function that logs incoming data

### 3. API Gateway with IP Whitelisting
- Created a REST API named `CorpUserDataApi`
- Implemented IP whitelisting using a resource policy that:
  - Allows access from specified IP ranges
  - Denies access from all other IP ranges
- Integrated the API Gateway with the Lambda function

### 4. Security Considerations
- Used IAM roles instead of inline policies as required
- Implemented IP whitelisting for API Gateway
- Ensured S3 bucket is not publicly accessible
- Added encryption for the S3 bucket

### 5. Naming Conventions
- All resources follow the required "Corp" prefix naming convention

## Deployment Instructions

To deploy this infrastructure:

1. Install AWS CDK if not already installed:
```bash
npm install -g aws-cdk
```

2. Initialize a new CDK project:
```bash
mkdir corp-serverless-app && cd corp-serverless-app
cdk init app --language typescript
```

3. Replace the generated files with the code provided above

4. Install dependencies:
```bash
npm install aws-cdk-lib constructs source-map-support
```

5. Deploy the stack:
```bash
cdk deploy
```

This implementation meets all the success criteria:
- Proper CDK TypeScript implementation
- All resources follow Corp naming convention
- S3 bucket with versioning enabled
- Lambda function with appropriate IAM role
- API Gateway with Lambda integration
- IP whitelisting security implementation
- Deployment to us-east-1 region
