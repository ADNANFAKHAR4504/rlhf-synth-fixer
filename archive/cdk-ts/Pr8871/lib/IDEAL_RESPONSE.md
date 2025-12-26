I'll help you create a serverless infrastructure using CDK TypeScript that meets your requirements. Here's a complete solution with separate files for better organization:

## lib/serverless-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ServerlessStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class ServerlessStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly lambdaFunction: lambda.Function;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: ServerlessStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create S3 bucket with versioning and intelligent tiering
    // Note: S3 Express One Zone is not available in current CDK versions,
    // using Intelligent Tiering for optimal performance
    this.bucket = new s3.Bucket(this, 'CorpUserDataBucket', {
      bucketName: `corp-user-data-bucket-${environmentSuffix}`.toLowerCase(),
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'IntelligentTieringTransition',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
    });

    // Create IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'CorpLambdaExecutionRole', {
      roleName: `CorpLambdaExecutionRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add S3 permissions to Lambda role
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:GetObjectVersion',
          's3:PutObjectAcl',
          's3:GetObjectAcl',
        ],
        resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
      })
    );

    // Create Lambda function with Node.js 18.x runtime
    this.lambdaFunction = new lambda.Function(this, 'CorpDataProcessor', {
      functionName: `CorpDataProcessor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
const { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        const timestamp = new Date().toISOString();
        const requestId = event.requestContext?.requestId || 'unknown';
        
        // Process user data
        const userData = {
            timestamp: timestamp,
            requestId: requestId,
            body: event.body,
            headers: event.headers,
            sourceIP: event.requestContext?.identity?.sourceIp,
        };
        
        console.log('Processing user data:', userData);
        
        // Store in S3
        const key = \`user-data/\${timestamp}-\${requestId}.json\`;
        const putCommand = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(userData),
            ContentType: 'application/json',
        });
        
        await s3Client.send(putCommand);
        console.log(\`Data stored in S3 with key: \${key}\`);
        
        // Example of moving to processed folder using copy/delete pattern
        // (RenameObject API is not yet widely available)
        const processedKey = \`processed/\${timestamp}-\${requestId}.json\`;
        try {
            // Copy the object to new location
            const copyCommand = new CopyObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                CopySource: \`\${process.env.BUCKET_NAME}/\${key}\`,
                Key: processedKey,
            });
            await s3Client.send(copyCommand);
            
            // Delete the original object
            const deleteCommand = new DeleteObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: key,
            });
            await s3Client.send(deleteCommand);
            
            console.log(\`File moved from \${key} to \${processedKey}\`);
        } catch (moveError) {
            console.log('Error moving file, keeping original:', moveError.message);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Data processed successfully',
                key: processedKey || key,
                timestamp: timestamp,
            }),
        };
        
    } catch (error) {
        console.error('Error processing data:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Error processing data',
                error: error.message,
            }),
        };
    }
};
      `),
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
    });

    // Create resource policy for IP whitelisting
    const resourcePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: ['execute-api:/*'],
          conditions: {
            IpAddress: {
              'aws:SourceIp': ['203.0.113.0/24', '198.51.100.0/24'],
            },
          },
        }),
      ],
    });

    // Create API Gateway with IP whitelisting
    this.api = new apigateway.RestApi(this, 'CorpUserDataApi', {
      restApiName: `CorpUserDataApi-${environmentSuffix}`,
      description: 'API for processing user data with IP whitelisting',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
      policy: resourcePolicy,
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      this.lambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // Add API Gateway resources and methods
    const dataResource = this.api.root.addResource('data');
    dataResource.addMethod('POST', lambdaIntegration);
    dataResource.addMethod('GET', lambdaIntegration);

    // Add health check endpoint
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json':
                '{"status": "healthy", "timestamp": "$context.requestTime"}',
            },
          },
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true,
            },
          },
        ],
      }
    );

    // Output important values
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Name of the Lambda function',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'URL of the API Gateway',
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.api.restApiId,
      description: 'ID of the API Gateway',
    });
  }
}
```

## lib/tap-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the serverless infrastructure stack
    const serverlessStack = new ServerlessStack(this, 'ServerlessInfrastructure', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });

    // Export the outputs from the nested stack to the parent stack
    // This ensures they are available in cfn-outputs when deployed
    new cdk.CfnOutput(this, 'BucketName', {
      value: serverlessStack.bucket.bucketName,
      description: 'Name of the S3 bucket',
      exportName: `${this.stackName}-BucketName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: serverlessStack.lambdaFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: serverlessStack.api.url,
      description: 'URL of the API Gateway',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: serverlessStack.api.restApiId,
      description: 'ID of the API Gateway',
      exportName: `${this.stackName}-ApiGatewayId`,
    });
  }
}
```

## bin/tap.ts
```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
```

This solution provides:

1. **S3 Bucket**: Created with versioning enabled and Intelligent Tiering storage class for optimal performance (S3 Express One Zone is not available in current CDK versions)
2. **Lambda Function**: Node.js 18.x runtime with proper IAM role and S3 permissions, includes file organization using copy/delete pattern
3. **API Gateway**: REST API with IP whitelisting for the specified IP ranges (203.0.113.0/24 and 198.51.100.0/24)
4. **IAM Security**: Proper roles and policies following least privilege principle
5. **Company Naming**: All resources use 'Corp' prefix as requested
6. **Organization**: Code is split into separate files for better maintainability
7. **Environment Flexibility**: Support for multiple environments through environment suffix
8. **Cleanup Support**: Resources configured with DESTROY removal policy for dev environments

The Lambda function logs all input data and stores it in S3, with file organization capabilities using copy/delete patterns. The API Gateway is secured with IP whitelisting and includes both data processing and health check endpoints.

Key features:
- Intelligent Tiering storage class for performance optimization
- Copy/Delete pattern for file organization (as RenameObject API is not widely available)
- Comprehensive error handling and logging
- CORS enabled for web applications
- Environment-specific resource naming
- CloudFormation outputs for easy reference
- Proper exports from nested stack to parent stack for deployment outputs