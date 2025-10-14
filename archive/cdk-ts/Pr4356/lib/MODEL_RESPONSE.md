### Reasoning Trace
---

The user wants me to update their existing AWS CDK infrastructure code for a serverless application. They have specific requirements:

1. They want me to UPDATE the existing `lib/tap-stack.ts` file, not create a new one
2. They want separate stacks for different resource types (following their existing pattern)
3. They need Lambda, API Gateway, S3, DynamoDB, WAF, Secrets Manager, VPC, monitoring, etc.
4. Everything should work with the `environmentSuffix` pattern
5. Region should be `ap-northeast-1`

I need to:
1. Create separate stack classes for each resource type
2. Update the main TapStack to instantiate these stacks
3. Ensure proper IAM roles, security, monitoring, and best practices

Let me structure this properly:
- LambdaStack - for Lambda functions
- ApiGatewayStack - for API Gateway
- StorageStack - for S3 and DynamoDB
- SecurityStack - for WAF, Secrets Manager, VPC
- MonitoringStack - for CloudWatch alarms and logging

I'll make sure everything is properly connected and follows AWS best practices.
### Answer 
---

I'll help you build a comprehensive serverless application infrastructure using AWS CDK in TypeScript. I'll update your existing `lib/tap-stack.ts` file and create separate stack files for different resource types following your pattern.

## Updated Main Stack File

First, let's update your main `lib/tap-stack.ts` file:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { VpcStack } from './stacks/vpc-stack';
import { StorageStack } from './stacks/storage-stack';
import { SecretsStack } from './stacks/secrets-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { ApiGatewayStack } from './stacks/api-gateway-stack';
import { SecurityStack } from './stacks/security-stack';
import { MonitoringStack } from './stacks/monitoring-stack';

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

    // Stack instantiations with proper dependency management
    
    // 1. VPC Stack - Foundation for network isolation
    const vpcStack = new VpcStack(scope, `VpcStack-${environmentSuffix}`, {
      environmentSuffix,
      env: { region: 'ap-northeast-1' }
    });

    // 2. Secrets Stack - Manage sensitive data
    const secretsStack = new SecretsStack(scope, `SecretsStack-${environmentSuffix}`, {
      environmentSuffix,
      env: { region: 'ap-northeast-1' }
    });

    // 3. Storage Stack - S3 and DynamoDB
    const storageStack = new StorageStack(scope, `StorageStack-${environmentSuffix}`, {
      environmentSuffix,
      env: { region: 'ap-northeast-1' }
    });

    // 4. Lambda Stack - Processing functions
    const lambdaStack = new LambdaStack(scope, `LambdaStack-${environmentSuffix}`, {
      environmentSuffix,
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' }
    });
    lambdaStack.addDependency(vpcStack);
    lambdaStack.addDependency(storageStack);
    lambdaStack.addDependency(secretsStack);

    // 5. API Gateway Stack - REST API endpoints
    const apiGatewayStack = new ApiGatewayStack(scope, `ApiGatewayStack-${environmentSuffix}`, {
      environmentSuffix,
      dataProcessorFunction: lambdaStack.dataProcessorFunction,
      env: { region: 'ap-northeast-1' }
    });
    apiGatewayStack.addDependency(lambdaStack);

    // 6. Security Stack - WAF for API Gateway
    const securityStack = new SecurityStack(scope, `SecurityStack-${environmentSuffix}`, {
      environmentSuffix,
      apiGateway: apiGatewayStack.api,
      env: { region: 'ap-northeast-1' }
    });
    securityStack.addDependency(apiGatewayStack);

    // 7. Monitoring Stack - CloudWatch alarms and logging
    const monitoringStack = new MonitoringStack(scope, `MonitoringStack-${environmentSuffix}`, {
      environmentSuffix,
      lambdaFunction: lambdaStack.dataProcessorFunction,
      apiGateway: apiGatewayStack.api,
      dataTable: storageStack.dataTable,
      env: { region: 'ap-northeast-1' }
    });
    monitoringStack.addDependency(lambdaStack);
    monitoringStack.addDependency(apiGatewayStack);
    monitoringStack.addDependency(storageStack);
  }
}
```

## Individual Stack Files

Now, let's create the separate stack files in the `lib/stacks/` directory:

### 1. VPC Stack (`lib/stacks/vpc-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, `Vpc-${props.environmentSuffix}`, {
      vpcName: `serverless-vpc-${props.environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // VPC Flow Logs for security monitoring
    this.vpc.addFlowLog(`VpcFlowLog-${props.environmentSuffix}`, {
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    // Output VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${props.environmentSuffix}`,
    });
  }
}
```

### 2. Storage Stack (`lib/stacks/storage-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly dataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // S3 Bucket with versioning and encryption
    this.dataBucket = new s3.Bucket(this, `DataBucket-${props.environmentSuffix}`, {
      bucketName: `serverless-data-bucket-${props.environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect data from accidental deletion
    });

    // DynamoDB Table with backup and autoscaling
    this.dataTable = new dynamodb.Table(this, `DataTable-${props.environmentSuffix}`, {
      tableName: `serverless-data-table-${props.environmentSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      contributorInsightsEnabled: true,
      timeToLiveAttribute: 'ttl',
    });

    // Add Global Secondary Index for querying by status
    this.dataTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `DataBucketName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: this.dataTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `DataTableName-${props.environmentSuffix}`,
    });
  }
}
```

### 3. Secrets Stack (`lib/stacks/secrets-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface SecretsStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecretsStack extends cdk.Stack {
  public readonly apiSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id, props);

    // API Secret for sensitive configuration
    this.apiSecret = new secretsmanager.Secret(this, `ApiSecret-${props.environmentSuffix}`, {
      secretName: `serverless-api-secret-${props.environmentSuffix}`,
      description: 'API keys and sensitive configuration',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          apiKey: 'placeholder',
          webhookUrl: 'placeholder',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // Output secret ARN
    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.apiSecret.secretArn,
      description: 'Secret ARN',
      exportName: `ApiSecretArn-${props.environmentSuffix}`,
    });
  }
}
```

### 4. Lambda Stack (`lib/stacks/lambda-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  dataTable: dynamodb.Table;
  dataBucket: s3.Bucket;
  apiSecret: secretsmanager.Secret;
}

export class LambdaStack extends cdk.Stack {
  public readonly dataProcessorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Lambda execution role with specific permissions
    const lambdaRole = new iam.Role(this, `LambdaRole-${props.environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Lambda execution role for data processor',
      roleName: `serverless-lambda-role-${props.environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, `LambdaSG-${props.environmentSuffix}`, {
      vpc: props.vpc,
      description: 'Security group for Lambda function',
      allowAllOutbound: true,
    });

    // Lambda function for data processing
    this.dataProcessorFunction = new lambda.Function(this, `DataProcessor-${props.environmentSuffix}`, {
      functionName: `serverless-data-processor-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamoDB = new AWS.DynamoDB.DocumentClient();
        const s3 = new AWS.S3();
        const secretsManager = new AWS.SecretsManager();
        
        exports.handler = async (event) => {
          console.log('Received event:', JSON.stringify(event, null, 2));
          
          try {
            // Parse request body
            const body = JSON.parse(event.body || '{}');
            const timestamp = Date.now();
            const id = AWS.util.uuid.v4();
            
            // Get secrets
            const secretData = await secretsManager.getSecretValue({
              SecretId: process.env.SECRET_ARN
            }).promise();
            const secrets = JSON.parse(secretData.SecretString);
            
            // Process data
            const processedData = {
              id,
              timestamp,
              status: 'processed',
              data: body,
              processedAt: new Date().toISOString(),
              ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
            };
            
            // Store in DynamoDB
            await dynamoDB.put({
              TableName: process.env.TABLE_NAME,
              Item: processedData
            }).promise();
            
            // Store raw data in S3
            await s3.putObject({
              Bucket: process.env.BUCKET_NAME,
              Key: \`data/\${new Date().getFullYear()}/\${new Date().getMonth() + 1}/\${id}.json\`,
              Body: JSON.stringify(processedData),
              ContentType: 'application/json',
              ServerSideEncryption: 'AES256',
              Metadata: {
                'processed-by': 'lambda',
                'timestamp': timestamp.toString()
              }
            }).promise();
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Data processed successfully',
                id,
                timestamp
              })
            };
          } catch (error) {
            console.error('Error processing data:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Error processing data',
                error: error.message
              })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: props.dataTable.tableName,
        BUCKET_NAME: props.dataBucket.bucketName,
        SECRET_ARN: props.apiSecret.secretArn,
        ENVIRONMENT: props.environmentSuffix,
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      role: lambdaRole,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
    });

    // Grant permissions
    props.dataTable.grantReadWriteData(this.dataProcessorFunction);
    props.dataBucket.grantReadWrite(this.dataProcessorFunction);
    props.apiSecret.grantRead(this.dataProcessorFunction);

    // Output
    new cdk.CfnOutput(this, 'FunctionArn', {
      value: this.dataProcessorFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `DataProcessorArn-${props.environmentSuffix}`,
    });
  }
}
```

### 5. API Gateway Stack (`lib/stacks/api-gateway-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  environmentSuffix: string;
  dataProcessorFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, `ApiLogGroup-${props.environmentSuffix}`, {
      logGroupName: `/aws/apigateway/serverless-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // REST API
    this.api = new apigateway.RestApi(this, `Api-${props.environmentSuffix}`, {
      restApiName: `serverless-api-${props.environmentSuffix}`,
      description: 'Serverless Data Processing API',
      deployOptions: {
        stageName: props.environmentSuffix,
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
        metricsEnabled: true,
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
        maxAge: cdk.Duration.days(1),
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    // Request Validator
    const requestValidator = new apigateway.RequestValidator(this, `RequestValidator-${props.environmentSuffix}`, {
      restApi: this.api,
      requestValidatorName: 'validate-body',
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    // Request Model
    const dataModel = new apigateway.Model(this, `DataModel-${props.environmentSuffix}`, {
      restApi: this.api,
      contentType: 'application/json',
      modelName: 'DataModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['data'],
        properties: {
          data: {
            type: apigateway.JsonSchemaType.OBJECT,
          },
          metadata: {
            type: apigateway.JsonSchemaType.OBJECT,
          },
        },
      },
    });

    // Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(props.dataProcessorFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
        {
          statusCode: '500',
          selectionPattern: '.*Error.*',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
      ],
    });

    // API Resources and Methods
    const dataResource = this.api.root.addResource('data');
    
    // POST /data
    dataResource.addMethod('POST', lambdaIntegration, {
      requestValidator,
      requestModels: {
        'application/json': dataModel,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // GET /data (for health check)
    dataResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // API Key and Usage Plan
    const apiKey = new apigateway.ApiKey(this, `ApiKey-${props.environmentSuffix}`, {
      apiKeyName: `serverless-api-key-${props.environmentSuffix}`,
      description: 'API Key for serverless application',
    });

    const usagePlan = new apigateway.UsagePlan(this, `UsagePlan-${props.environmentSuffix}`, {
      name: `serverless-usage-plan-${props.environmentSuffix}`,
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey);

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `ApiEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `ApiKeyId-${props.environmentSuffix}`,
    });
  }
}
```

### 6. Security Stack (`lib/stacks/security-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
  apiGateway: apigateway.RestApi;
}

export class SecurityStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // WAF Web ACL for API Gateway
    this.webAcl = new wafv2.CfnWebACL(this, `WebAcl-${props.environmentSuffix}`, {
      name: `serverless-waf-${props.environmentSuffix}`,
      description: 'WAF Web ACL for API Gateway protection',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: {
            block: {
              customResponse: {
                responseCode: 429,
                customResponseBodyKey: 'TooManyRequests',
              },
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        // SQL Injection protection
        {
          name: 'SQLiRule',
          priority: 2,
          statement: {
            sqliMatchStatement: {
              fieldToMatch: {
                body: {
                  oversizeHandling: 'MATCH',
                },
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
        // XSS protection
        {
          name: 'XSSRule',
          priority: 3,
          statement: {
            xssMatchStatement: {
              fieldToMatch: {
                body: {
                  oversizeHandling: 'MATCH',
                },
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
            metricName: 'XSSRule',
          },
        },
        // Size constraint rule
        {
          name: 'SizeRestrictionRule',
          priority: 4,
          statement: {
            sizeConstraintStatement: {
              fieldToMatch: {
                body: {
                  oversizeHandling: 'MATCH',
                },
              },
              textTransformations: [
                {
                  priority: 0,
                  type: 'NONE',
                },
              ],
              comparisonOperator: 'GT',
              size: 8192, // 8KB limit
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SizeRestrictionRule',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `serverless-waf-${props.environmentSuffix}`,
      },
      customResponseBodies: {
        TooManyRequests: {
          contentType: 'APPLICATION_JSON',
          content: '{"error": "Too many requests. Please try again later."}',
        },
      },
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, `WebAclAssociation-${props.environmentSuffix}`, {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${props.apiGateway.restApiId}/stages/${props.apiGateway.deploymentStage.stageName}`,
      webAclArn: this.webAcl.attrArn,
    });

    // Output
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `WebAclArn-${props.environmentSuffix}`,
    });
  }
}
```

### 7. Monitoring Stack (`lib/stacks/monitoring-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
  dataTable: dynamodb.Table;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, `AlertTopic-${props.environmentSuffix}`, {
      topicName: `serverless-alerts-${props.environmentSuffix}`,
      displayName: 'Serverless Application Alerts',
    });

    // Add email subscription (replace with actual email)
    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('your-email@example.com')
    );

    // Lambda Error Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, `LambdaErrorAlarm-${props.environmentSuffix}`, {
      alarmName: `lambda-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function has errors',
      metric: props.lambdaFunction.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(this, `LambdaDurationAlarm-${props.environmentSuffix}`, {
      alarmName: `lambda-duration-${props.environmentSuffix}`,
      alarmDescription: 'Alert when Lambda execution time is high',
      metric: props.lambdaFunction.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 10000, // 10 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Lambda Throttles Alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(this, `LambdaThrottleAlarm-${props.environmentSuffix}`, {
      alarmName: `lambda-throttles-${props.environmentSuffix}`,
      alarmDescription: 'Alert when Lambda is throttled',
      metric: props.lambdaFunction.metricThrottles({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 4XX Errors Alarm
    const api4xxAlarm = new cloudwatch.Alarm(this, `Api4xxAlarm-${props.environmentSuffix}`, {
      alarmName: `api-4xx-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert when API has 4xx errors',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
          Stage: props.apiGateway.deploymentStage.stageName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 5XX Errors Alarm
    const api5xxAlarm = new cloudwatch.Alarm(this, `Api5xxAlarm-${props.environmentSuffix}`, {
      alarmName: `api-5xx-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert when API has 5xx errors',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
          Stage: props.apiGateway.deploymentStage.stageName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // DynamoDB Throttles Alarm
    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, `DynamoThrottleAlarm-${props.environmentSuffix}`, {
      alarmName: `dynamo-throttles-${props.environmentSuffix}`,
      alarmDescription: 'Alert when DynamoDB is throttled',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'UserErrors',
        dimensionsMap: {
          TableName: props.dataTable.tableName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dynamoThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, `Dashboard-${props.environmentSuffix}`, {
      dashboardName: `serverless-dashboard-${props.environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Metrics',
            left: [
              props.lambdaFunction.metricInvocations(),
              props.lambdaFunction.metricErrors(),
              props.lambdaFunction.metricThrottles(),
            ],
            right: [props.lambdaFunction.metricDuration()],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway Metrics',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.apiGateway.deploymentStage.stageName,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '4XXError',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.apiGateway.deploymentStage.stageName,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.apiGateway.deploymentStage.stageName,
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Metrics',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedReadCapacityUnits',
                dimensionsMap: {
                  TableName: props.dataTable.tableName,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedWriteCapacityUnits',
                dimensionsMap: {
                  TableName: props.dataTable.tableName,
                },
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'UserErrors',
                dimensionsMap: {
                  TableName: props.dataTable.tableName,
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Lambda Concurrent Executions',
            metrics: [props.lambdaFunction.metricConcurrentExecutions()],
            width: 6,
            height: 6,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'API Gateway Latency',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Latency',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.apiGateway.deploymentStage.stageName,
                },
                statistic: 'Average',
              }),
            ],
            width: 6,
            height: 6,
          }),
        ],
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `DashboardUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
      exportName: `AlertTopicArn-${props.environmentSuffix}`,
    });
  }
}
```

## Key Features Implemented

### 1. **Security**
- VPC with public/private subnets for network isolation
- AWS WAF protecting API Gateway with rate limiting, SQL injection, and XSS protection
- Secrets Manager for sensitive data storage
- IAM roles with least privilege principles
- S3 bucket with encryption and versioning
- DynamoDB with encryption at rest

### 2. **High Availability & Resilience**
- Multi-AZ VPC deployment
- DynamoDB with point-in-time recovery
- S3 versioning for data protection
- Lambda dead letter queue for failed executions
- API Gateway throttling and rate limiting

### 3. **Monitoring & Observability**
- CloudWatch alarms for Lambda errors, duration, and throttles
- API Gateway 4XX/5XX error monitoring
- DynamoDB throttle monitoring
- Comprehensive CloudWatch dashboard
- SNS notifications for critical alerts
- X-Ray tracing enabled

### 4. **Best Practices**
- Infrastructure as Code with CDK
- Environment-based deployment (dev/staging/prod)
- Proper error handling in Lambda
- Request validation in API Gateway
- Structured logging with CloudWatch
- Cost optimization with reserved concurrent executions

## Deployment Notes

1. **Email Configuration**: Update the email address in the Monitoring Stack for SNS notifications
2. **Lambda Code**: Replace the inline Lambda code with your actual business logic
3. **Secrets**: After deployment, update the secrets in AWS Secrets Manager with actual values
4. **CORS**: Adjust CORS settings in API Gateway based on your frontend requirements
5. **WAF Rules**: Customize WAF rules based on your security requirements

This infrastructure provides a robust, secure, and scalable serverless application foundation that follows AWS best practices and can be easily deployed across multiple environments.
