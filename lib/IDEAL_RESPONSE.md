# Ideal Response: Full Working Code

## lib/tap-stack.ts

```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Import your stacks here
import { ApiStack } from './stacks/api-stack';
import { ComputeStack } from './stacks/compute-stack';
import { NetworkingStack } from './stacks/networking-stack';
import { StorageStack } from './stacks/storage-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'prod' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'prod';

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // 1. Networking Stack - VPC with private subnets and VPC endpoints
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
    });

    // 2. Storage Stack - S3 bucket and DynamoDB tables
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
    });

    // 3. Compute Stack - Lambda functions
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      lambdaSecurityGroup: networkingStack.lambdaSecurityGroup,
      documentBucket: storageStack.documentBucket,
      documentsTable: storageStack.documentsTable,
      apiKeysTable: storageStack.apiKeysTable,
    });

    // 4. API Stack - API Gateway with Lambda authorizer
    const apiStack = new ApiStack(this, 'ApiStack', {
      environmentSuffix,
      authorizerFunction: computeStack.authorizerFunction,
      apiHandlerFunction: computeStack.apiHandlerFunction,
    });

    // Comprehensive Stack Outputs for Integration Testing

    // === API Gateway Outputs ===
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiStack.api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: apiStack.api.restApiId,
      description: 'API Gateway REST API ID',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiStack.apiKey.keyId,
      description: 'API Key ID for authentication',
    });

    new cdk.CfnOutput(this, 'UsagePlanId', {
      value: apiStack.usagePlan.usagePlanId,
      description: 'API Gateway Usage Plan ID',
    });

    // === Lambda Function Outputs ===
    new cdk.CfnOutput(this, 'AuthorizerFunctionName', {
      value: computeStack.authorizerFunction.functionName,
      description: 'Lambda Authorizer function name',
    });

    new cdk.CfnOutput(this, 'AuthorizerFunctionArn', {
      value: computeStack.authorizerFunction.functionArn,
      description: 'Lambda Authorizer function ARN',
    });

    new cdk.CfnOutput(this, 'DocumentProcessorFunctionName', {
      value: computeStack.documentProcessorFunction.functionName,
      description: 'Document Processor Lambda function name',
    });

    new cdk.CfnOutput(this, 'DocumentProcessorFunctionArn', {
      value: computeStack.documentProcessorFunction.functionArn,
      description: 'Document Processor Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'ApiHandlerFunctionName', {
      value: computeStack.apiHandlerFunction.functionName,
      description: 'API Handler Lambda function name',
    });

    new cdk.CfnOutput(this, 'ApiHandlerFunctionArn', {
      value: computeStack.apiHandlerFunction.functionArn,
      description: 'API Handler Lambda function ARN',
    });

    // === Storage Outputs ===
    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: storageStack.documentBucket.bucketName,
      description: 'S3 bucket name for document storage',
    });

    new cdk.CfnOutput(this, 'DocumentsBucketArn', {
      value: storageStack.documentBucket.bucketArn,
      description: 'S3 bucket ARN for document storage',
    });

    new cdk.CfnOutput(this, 'DocumentsTableName', {
      value: storageStack.documentsTable.tableName,
      description: 'DynamoDB table name for document metadata',
    });

    new cdk.CfnOutput(this, 'DocumentsTableArn', {
      value: storageStack.documentsTable.tableArn,
      description: 'DynamoDB table ARN for document metadata',
    });

    new cdk.CfnOutput(this, 'DocumentsTableStreamArn', {
      value: storageStack.documentsTable.tableStreamArn || 'N/A',
      description: 'DynamoDB table stream ARN for document metadata',
    });

    new cdk.CfnOutput(this, 'ApiKeysTableName', {
      value: storageStack.apiKeysTable.tableName,
      description: 'DynamoDB table name for API keys',
    });

    new cdk.CfnOutput(this, 'ApiKeysTableArn', {
      value: storageStack.apiKeysTable.tableArn,
      description: 'DynamoDB table ARN for API keys',
    });

    // === VPC and Networking Outputs ===
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID for the serverless infrastructure',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: networkingStack.vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: networkingStack.vpc.privateSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Comma-separated list of private subnet IDs',
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: networkingStack.lambdaSecurityGroup.securityGroupId,
      description: 'Security Group ID for Lambda functions',
    });

    new cdk.CfnOutput(this, 'S3VpcEndpointId', {
      value: networkingStack.s3Endpoint.vpcEndpointId,
      description: 'S3 VPC Endpoint ID',
    });

    new cdk.CfnOutput(this, 'DynamoDbVpcEndpointId', {
      value: networkingStack.dynamoEndpoint.vpcEndpointId,
      description: 'DynamoDB VPC Endpoint ID',
    });

    new cdk.CfnOutput(this, 'ApiGatewayVpcEndpointId', {
      value: networkingStack.apiGatewayEndpoint.vpcEndpointId,
      description: 'API Gateway VPC Endpoint ID',
    });

    // === Test Configuration Outputs ===
    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where resources are deployed',
    });

    new cdk.CfnOutput(this, 'AccountId', {
      value: this.account,
      description: 'AWS account ID where resources are deployed',
    });

    // === Integration Test Endpoints ===
    new cdk.CfnOutput(this, 'DocumentUploadEndpoint', {
      value: `${apiStack.api.url}documents`,
      description: 'Full URL for document upload endpoint',
    });

    new cdk.CfnOutput(this, 'DocumentListEndpoint', {
      value: `${apiStack.api.url}documents`,
      description: 'Full URL for document list endpoint',
    });

    new cdk.CfnOutput(this, 'DocumentRetrieveEndpoint', {
      value: `${apiStack.api.url}documents/{documentId}`,
      description: 'URL template for document retrieve endpoint',
    });
  }
}
```

## lib/stacks/api-stack.ts

```typescript
// lib/stacks/api-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ApiStackProps {
  environmentSuffix: string;
  authorizerFunction: lambda.Function;
  apiHandlerFunction: lambda.Function;
}

export class ApiStack extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly apiKey: apigateway.IApiKey;
  public readonly usagePlan: apigateway.UsagePlan;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    // API Gateway with Lambda Authorizer
    this.api = new apigateway.RestApi(this, 'ProdDocumentApi', {
      description: 'Serverless document processing API with Lambda authorizer',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
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
    });

    // Lambda Authorizer for API Gateway
    const authorizer = new apigateway.RequestAuthorizer(
      this,
      'ProdApiAuthorizer',
      {
        handler: props.authorizerFunction,
        identitySources: [apigateway.IdentitySource.header('X-Api-Key')],
        resultsCacheTtl: cdk.Duration.seconds(0),
      }
    );

    // API Gateway Integration
    const apiIntegration = new apigateway.LambdaIntegration(
      props.apiHandlerFunction,
      {
        proxy: true,
        allowTestInvoke: false,
      }
    );

    // API Routes
    const documentsResource = this.api.root.addResource('documents');
    documentsResource.addMethod('POST', apiIntegration, {
      authorizer,
      apiKeyRequired: false,
    });
    documentsResource.addMethod('GET', apiIntegration, {
      authorizer,
      apiKeyRequired: false,
    });

    const documentResource = documentsResource.addResource('{documentId}');
    documentResource.addMethod('GET', apiIntegration, {
      authorizer,
      apiKeyRequired: false,
    });

    // API Key and Usage Plan
    this.apiKey = this.api.addApiKey('ProdApiKey', {
      description: 'API key for document processing system',
    });

    this.usagePlan = this.api.addUsagePlan('ProdUsagePlan', {
      description: 'Usage plan for document processing API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
    });

    this.usagePlan.addApiKey(this.apiKey);
    this.usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });
  }
}
```

## lib/stacks/compute-stack.ts

```typescript
// lib/stacks/compute-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ComputeStackProps {
  environmentSuffix: string;
  vpc: cdk.aws_ec2.IVpc;
  lambdaSecurityGroup: cdk.aws_ec2.ISecurityGroup;
  documentBucket: s3.IBucket;
  documentsTable: dynamodb.ITable;
  apiKeysTable: dynamodb.ITable;
}

export class ComputeStack extends Construct {
  public readonly authorizerFunction: lambda.Function;
  public readonly documentProcessorFunction: lambda.Function;
  public readonly apiHandlerFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // IAM Role for Lambda Functions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${props.documentBucket.bucketArn}/*`],
            }),
          ],
        }),
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ],
              resources: [
                `${props.documentsTable.tableArn}`,
                `${props.apiKeysTable.tableArn}`,
              ],
            }),
          ],
        }),
      },
    });

    // Lambda Authorizer Function
    this.authorizerFunction = new lambda.Function(this, 'AuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/lambda/authorizer.handler',
      code: lambda.Code.fromAsset('lambda/authorizer'),
      environment: {
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        API_KEYS_TABLE_NAME: props.apiKeysTable.tableName,
      },
      role: lambdaRole,
      vpc: props.vpc,
      securityGroups: [props.lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
    });

    // Document Processor Function
    this.documentProcessorFunction = new lambda.Function(
      this,
      'DocumentProcessorFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'src/lambda/documentProcessor.handler',
        code: lambda.Code.fromAsset('lambda/documentProcessor'),
        environment: {
          DOCUMENTS_BUCKET_NAME: props.documentBucket.bucketName,
          DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        },
        role: lambdaRole,
        vpc: props.vpc,
        securityGroups: [props.lambdaSecurityGroup],
        timeout: cdk.Duration.seconds(30),
      }
    );

    // API Handler Function
    this.apiHandlerFunction = new lambda.Function(this, 'ApiHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/lambda/apiHandler.handler',
      code: lambda.Code.fromAsset('lambda/apiHandler'),
      environment: {
        DOCUMENTS_BUCKET_NAME: props.documentBucket.bucketName,
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        API_KEYS_TABLE_NAME: props.apiKeysTable.tableName,
      },
      role: lambdaRole,
      vpc: props.vpc,
      securityGroups: [props.lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
    });
  }
}
```

## lib/stacks/networking-stack.ts

```typescript
// lib/stacks/networking-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface NetworkingStackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly lambdaSecurityGroup: ec2.ISecurityGroup;
  public readonly s3Endpoint: ec2.IVpcEndpoint;
  public readonly dynamoEndpoint: ec2.IVpcEndpoint;
  public readonly apiGatewayEndpoint: ec2.IVpcEndpoint;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    // VPC
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${props.environmentSuffix}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${props.environmentSuffix}-private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    // Lambda Security Group
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // S3 VPC Endpoint
    this.s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    // DynamoDB VPC Endpoint
    this.dynamoEndpoint = this.vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    // API Gateway VPC Endpoint
    this.apiGatewayEndpoint = this.vpc.addGatewayEndpoint(
      'ApiGatewayEndpoint',
      {
        service: ec2.GatewayVpcEndpointAwsService.API_GATEWAY,
        subnets: [
          {
            subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          },
        ],
      }
    );
  }
}
```

## lib/stacks/storage-stack.ts

```typescript
// lib/stacks/storage-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface StorageStackProps {
  environmentSuffix: string;
}

export class StorageStack extends Construct {
  public readonly documentBucket: s3.IBucket;
  public readonly documentsTable: dynamodb.ITable;
  public readonly apiKeysTable: dynamodb.ITable;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    // IAM Role for S3 and DynamoDB
    const storageRole = new iam.Role(this, 'StorageExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // S3 Bucket
    this.documentBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `documents-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioning: s3.BucketVersioning.ENABLED,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      grantRead: [storageRole],
      grantWrite: [storageRole],
    });

    // DynamoDB Tables
    this.documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
      tableName: `documents-${props.environmentSuffix}`,
      partitionKey: { name: 'documentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'uploadTimestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      grantRead: [storageRole],
      grantWrite: [storageRole],
    });

    this.apiKeysTable = new dynamodb.Table(this, 'ApiKeysTable', {
      tableName: `api-keys-${props.environmentSuffix}`,
      partitionKey: { name: 'apiKeyId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      grantRead: [storageRole],
      grantWrite: [storageRole],
    });
  }
}
```
