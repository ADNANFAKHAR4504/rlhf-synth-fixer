# A clean, modular, and production-ready serverless infrastructure solution.

## Project Structure

First, let's set up the project structure:

```typescript
// package.json
{
  "name": "serverless-cdk-infrastructure",
  "version": "1.0.0",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy:staging": "cdk deploy --context environmentSuffix=staging",
    "deploy:production": "cdk deploy --context environmentSuffix=prod"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119",
    "@types/jest": "^29.5.5",
    "@types/node": "20.8.10",
    "aws-cdk": "2.100.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.2"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.445.0",
    "@aws-sdk/lib-dynamodb": "^3.445.0",
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.3.0",
    "source-map-support": "^0.5.21"
  }
}
```

## Main CDK Stack Implementation

```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  projectName?: string;
  apiThrottleRate?: number;
  apiThrottleBurst?: number;
  lambdaMemorySize?: number;
  lambdaTimeout?: number;
  dynamodbReadCapacity?: number;
  dynamodbWriteCapacity?: number;
  enablePointInTimeRecovery?: boolean;
  logRetentionDays?: number;
}

export class TapStack extends cdk.Stack {
  public readonly apiEndpoint: cdk.CfnOutput;
  public readonly dynamodbTableArn: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      description: `Serverless infrastructure stack for ${props.projectName || 'TapProject'} - ${props.environmentSuffix} environment`,
    });

    // Set defaults
    const projectName = props.projectName || 'TapProject';
    const isProduction = props.environmentSuffix.toLowerCase().includes('prod');
    const removalPolicy = isProduction
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Default configuration values
    const config = {
      apiThrottleRate: props.apiThrottleRate || 100,
      apiThrottleBurst: props.apiThrottleBurst || 200,
      lambdaMemorySize: props.lambdaMemorySize || 512,
      lambdaTimeout: props.lambdaTimeout || 30,
      dynamodbReadCapacity: props.dynamodbReadCapacity || 5,
      dynamodbWriteCapacity: props.dynamodbWriteCapacity || 5,
      enablePointInTimeRecovery:
        props.enablePointInTimeRecovery ?? isProduction,
      logRetentionDays: props.logRetentionDays || (isProduction ? 90 : 7),
    };

    // Common tags
    const commonTags = {
      ProjectName: projectName,
      Environment: props.environmentSuffix,
    };

    // Apply tags to all resources in the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // ==================== DynamoDB Table ====================
    const dynamoTable = this.createDynamoDBTable(
      props.environmentSuffix,
      removalPolicy,
      config,
      commonTags
    );

    // ==================== S3 Bucket ====================
    const mediaBucket = this.createS3Bucket(
      props.environmentSuffix,
      removalPolicy,
      commonTags
    );

    // ==================== Lambda Function ====================
    const lambdaFunction = this.createLambdaFunction(
      props.environmentSuffix,
      dynamoTable,
      mediaBucket,
      config,
      commonTags,
      removalPolicy
    );

    // ==================== API Gateway ====================
    const api = this.createApiGateway(
      props.environmentSuffix,
      lambdaFunction,
      config,
      commonTags
    );

    // ==================== WAF ====================
    this.createWAF(props.environmentSuffix, api, commonTags);

    // ==================== Outputs ====================
    this.apiEndpoint = new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${projectName}-${props.environmentSuffix}-api-endpoint`,
    });

    this.dynamodbTableArn = new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: dynamoTable.tableArn,
      description: 'DynamoDB table ARN',
      exportName: `${projectName}-${props.environmentSuffix}-dynamodb-arn`,
    });
  }

  private createDynamoDBTable(
    environmentSuffix: string,
    removalPolicy: cdk.RemovalPolicy,
    config: any,
    tags: any
  ): dynamodb.Table {
    const table = new dynamodb.Table(this, 'RequestTable', {
      tableName: `tap-requests-${environmentSuffix}`,
      partitionKey: {
        name: 'RequestId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: config.dynamodbReadCapacity,
      writeCapacity: config.dynamodbWriteCapacity,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: config.enablePointInTimeRecovery,
      removalPolicy,
      contributorInsightsEnabled: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add metadata
    const cfnTable = table.node.defaultChild as dynamodb.CfnTable;
    cfnTable.addMetadata(
      'Purpose',
      'Store API request data with RequestId as primary key'
    );
    cfnTable.addMetadata(
      'Encryption',
      'AWS managed encryption at rest enabled'
    );

    // Add Global Secondary Index on Timestamp
    table.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: {
        name: 'Timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: config.dynamodbReadCapacity,
      writeCapacity: config.dynamodbWriteCapacity,
    });

    return table;
  }

  private createS3Bucket(
    environmentSuffix: string,
    removalPolicy: cdk.RemovalPolicy,
    tags: any
  ): s3.Bucket {
    const bucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName:
        `tap-media-${environmentSuffix}-${this.account}`.toLowerCase(),
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // Add metadata
    const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
    cfnBucket.addMetadata(
      'Purpose',
      'Store media files with versioning and encryption'
    );
    cfnBucket.addMetadata(
      'Security',
      'AES-256 encryption, SSL enforced, public access blocked'
    );

    return bucket;
  }

  private createLambdaFunction(
    environmentSuffix: string,
    table: dynamodb.Table,
    bucket: s3.Bucket,
    config: any,
    tags: any,
    removalPolicy: cdk.RemovalPolicy
  ): lambda.Function {
    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/tap-processor-${environmentSuffix}`,
      retention: config.logRetentionDays as logs.RetentionDays,
      removalPolicy,
    });

    // Create Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `tap-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'Execution role for TAP Lambda function with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific permissions for DynamoDB
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
          'dynamodb:BatchWriteItem',
        ],
        resources: [table.tableArn, `${table.tableArn}/index/*`],
      })
    );

    // Add specific permissions for S3
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject', 's3:GetObjectVersion'],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, 'ProcessorFunction', {
      functionName: `tap-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(this.getLambdaCode()),
      memorySize: config.lambdaMemorySize,
      timeout: cdk.Duration.seconds(config.lambdaTimeout),
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE_NAME: table.tableName,
        S3_BUCKET_NAME: bucket.bucketName,
        ENVIRONMENT: environmentSuffix,
      },
      logGroup,
      tracing: lambda.Tracing.ACTIVE,
      retryAttempts: 2,
      maxEventAge: cdk.Duration.hours(1),
      reservedConcurrentExecutions: 100,
    });

    // Add metadata
    const cfnFunction = lambdaFunction.node.defaultChild as lambda.CfnFunction;
    cfnFunction.addMetadata(
      'Purpose',
      'Process API requests and store data in DynamoDB'
    );
    cfnFunction.addMetadata(
      'Retries',
      'Configured for 2 retry attempts on transient errors'
    );

    return lambdaFunction;
  }

  private createApiGateway(
    environmentSuffix: string,
    lambdaFunction: lambda.Function,
    config: any,
    tags: any
  ): apigateway.RestApi {
    // Create REST API
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: `tap-api-${environmentSuffix}`,
      description: `RESTful API for TAP project - ${environmentSuffix}`,
      deployOptions: {
        stageName: environmentSuffix,
        throttlingRateLimit: config.apiThrottleRate,
        throttlingBurstLimit: config.apiThrottleBurst,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.hours(1),
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.EDGE],
      },
    });

    // Add metadata
    const cfnApi = api.node.defaultChild as apigateway.CfnRestApi;
    cfnApi.addMetadata(
      'Purpose',
      'RESTful API Gateway with throttling and CORS enabled'
    );
    cfnApi.addMetadata(
      'Throttling',
      `${config.apiThrottleRate} req/sec with ${config.apiThrottleBurst} burst`
    );

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }',
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': '',
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
        {
          statusCode: '400',
          selectionPattern: '4\\d{2}',
          responseTemplates: {
            'application/json': '{ "error": "$context.error.message" }',
          },
        },
        {
          statusCode: '500',
          selectionPattern: '5\\d{2}',
          responseTemplates: {
            'application/json': '{ "error": "Internal server error" }',
          },
        },
      ],
    });

    // Add /process resource
    const processResource = api.root.addResource('process');

    // Add POST method
    processResource.addMethod('POST', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
    });

    // Add GET method for health check
    processResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    return api;
  }

  private createWAF(
    environmentSuffix: string,
    api: apigateway.RestApi,
    tags: any
  ): void {
    // Create WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'TapWebAcl', {
      name: `tap-waf-${environmentSuffix}`,
      description: 'WAF rules to protect API Gateway from common attacks',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'SQLiRule',
          priority: 1,
          statement: {
            sqliMatchStatement: {
              fieldToMatch: {
                allQueryArguments: {},
              },
              textTransformations: [
                {
                  priority: 0,
                  type: 'URL_DECODE',
                },
                {
                  priority: 1,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRule',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 2,
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
          priority: 3,
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
            metricName: 'CommonRuleSet',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `tap-waf-${environmentSuffix}`,
      },
    });

    // Add metadata
    webAcl.addMetadata(
      'Purpose',
      'Protect API Gateway from SQL injection and other common attacks'
    );
    webAcl.addMetadata(
      'Rules',
      'SQL injection protection, rate limiting, AWS managed rules'
    );

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${environmentSuffix}`,
      webAclArn: webAcl.attrArn,
    });
  }

  private getLambdaCode(): string {
    return `
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Initialize AWS SDK v3 clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: { removeUndefinedValues: true },
});
const s3Client = new S3Client({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event, context) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
  
  try {
    const method = event.httpMethod || event.requestContext?.http?.method;
    
    // Handle GET request (health check)
    if (method === 'GET') {
      console.log('Processing health check request');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'healthy',
          environment: ENVIRONMENT,
          timestamp: new Date().toISOString(),
        }),
      };
    }
    
    // Handle POST request
    if (method === 'POST') {
      console.log('Processing POST request');
      
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const requestId = context.requestId;
      const timestamp = Date.now();
      
      // Prepare DynamoDB item
      const item = {
        RequestId: requestId,
        Timestamp: timestamp,
        Environment: ENVIRONMENT,
        RequestBody: body,
        CreatedAt: new Date(timestamp).toISOString(),
        TTL: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days TTL
      };
      
      // Store in DynamoDB with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: 'attribute_not_exists(RequestId)',
          }));
          console.log('Successfully stored item in DynamoDB:', requestId);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(\`Retrying DynamoDB operation. Retries left: \${retries}\`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 100));
        }
      }
      
      // Store metadata in S3 if media content is present
      if (body.mediaContent) {
        const s3Key = \`requests/\${ENVIRONMENT}/\${requestId}.json\`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(item),
          ContentType: 'application/json',
          ServerSideEncryption: 'AES256',
          Metadata: {
            'request-id': requestId,
            'environment': ENVIRONMENT,
          },
        }));
        console.log('Successfully stored metadata in S3:', s3Key);
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Request processed successfully',
          requestId: requestId,
          timestamp: timestamp,
        }),
      };
    }
    
    // Method not allowed
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Check if it's a transient error that should be retried
    if (error.name === 'ProvisionedThroughputExceededException' || 
        error.name === 'RequestLimitExceeded' ||
        error.name === 'ServiceUnavailable' ||
        error.name === 'ThrottlingException') {
      // Throw error to trigger Lambda retry
      throw error;
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        requestId: context.requestId,
      }),
    };
  }
};
    `;
  }
}
```

## Application Entry Point

```typescript
// bin/tap.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context
const environmentSuffix = app.node.tryGetContext('environmentSuffix');

if (!environmentSuffix) {
  throw new Error('Environment suffix is required. Use: cdk deploy --context environmentSuffix=<staging|prod>');
}

// Validate environment suffix
if (!['staging', 'prod', 'dev', 'test'].includes(environmentSuffix)) {
  console.warn(`Warning: Non-standard environment suffix '${environmentSuffix}' detected.`);
}

// Create the stack
new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  projectName: app.node.tryGetContext('projectName'),
  apiThrottleRate: app.node.tryGetContext('apiThrottleRate'),
  apiThrottleBurst: app.node.tryGetContext('apiThrottleBurst'),
  lambdaMemorySize: app.node.tryGetContext('lambdaMemorySize'),
  lambdaTimeout: app.node.tryGetContext('lambdaTimeout'),
  dynamodbReadCapacity: app.node.tryGetContext('dynamodbReadCapacity'),
  dynamodbWriteCapacity: app.node.tryGetContext('dynamodbWriteCapacity'),
  enablePointInTimeRecovery: app.node.tryGetContext('enablePointInTimeRecovery'),
  logRetentionDays: app.node.tryGetContext('logRetentionDays'),
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
```

## CDK Configuration

```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true
  }
}
```

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

## Deployment Instructions

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Deploy to staging
npm run deploy:staging

# Deploy to production with custom parameters
cdk deploy --context environmentSuffix=prod \
  --context projectName=MyProject \
  --context apiThrottleRate=1000 \
  --context apiThrottleBurst=2000 \
  --context lambdaMemorySize=1024 \
  --context dynamodbReadCapacity=10 \
  --context dynamodbWriteCapacity=10 \
  --context enablePointInTimeRecovery=true \
  --context logRetentionDays=90

# Destroy staging environment
cdk destroy --context environmentSuffix=staging
```

## Key Features Implemented

### Security Best Practices

- **Least privilege IAM roles** with specific permissions for Lambda
- **AWS WAF** configured to block SQL injection attacks
- **CORS** enabled for GET and POST methods
- **SSL/TLS enforcement** on S3 bucket
- **Encryption at rest** for DynamoDB (AWS managed) and S3 (AES-256)
- **Encryption in transit** enforced through HTTPS-only access

### Operational Excellence

- **API throttling** at 100 requests per second (configurable)
- **Lambda retry logic** for transient errors (2 retries with exponential backoff)
- **CloudWatch logging** with configurable retention periods
- **X-Ray tracing** enabled for distributed tracing
- **DynamoDB streams** for change data capture
- **S3 versioning** with lifecycle policies

### Resource Management

- **Environment-based naming** using environmentSuffix
- **Automatic cleanup** for non-production environments
- **Comprehensive tagging** for cost allocation and management
- **CloudFormation outputs** for API endpoint and DynamoDB ARN
- **Metadata** on all resources for documentation

### Scalability & Performance

- **DynamoDB Global Secondary Index** on Timestamp for efficient queries
- **Lambda reserved concurrency** to prevent throttling
- **API Gateway caching** capability (can be enabled)
- **Point-in-time recovery** for production DynamoDB tables

This solution provides a production-ready, secure, and scalable serverless infrastructure that meets all specified requirements while maintaining clean code organization and following AWS best practices.
