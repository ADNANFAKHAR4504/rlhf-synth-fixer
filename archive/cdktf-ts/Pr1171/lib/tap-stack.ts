import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayIntegrationResponse } from '@cdktf/provider-aws/lib/api-gateway-integration-response';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayMethodResponse } from '@cdktf/provider-aws/lib/api-gateway-method-response';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketWebsiteConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-website-configuration';
import {
  App,
  TerraformOutput,
  TerraformStack,
  AssetType,
  TerraformAsset,
} from 'cdktf';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

export class TapStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    props?: {
      environmentSuffix?: string;
      stateBucket?: string;
      stateBucketRegion?: string;
      awsRegion?: string;
      defaultTags?: { tags: Record<string, string> };
    }
  ) {
    super(scope, id);

    // Helper method to create Lambda zip assets from inline code
    // Creates a temporary directory structure and writes the Python code to a file
    // Returns a TerraformAsset that automatically handles zip creation and hash generation
    const createLambdaAsset = (
      serviceName: string,
      code: string
    ): TerraformAsset => {
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const codeFile = path.join(tempDir, `${serviceName}.py`);
      fs.writeFileSync(codeFile, code);

      return new TerraformAsset(this, `${serviceName}-asset`, {
        path: tempDir,
        type: AssetType.ARCHIVE,
      });
    };

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'us-east-1';
    const defaultTags = props?.defaultTags?.tags || {};

    // Add timestamp for uniqueness in CI/CD environments
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const uniqueSuffix = `${environmentSuffix}-${timestamp}`;

    // Common tags for cost allocation
    const commonTags = {
      Environment: environmentSuffix || 'production',
      Owner: 'ecommerce-team',
      Project: 'serverless-ecommerce',
      ManagedBy: 'terraform',
      ...defaultTags,
    };

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion || 'us-east-1',
      defaultTags: [
        {
          tags: commonTags,
        },
      ],
    });

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, 'current');

    // KMS Key for Lambda environment variables encryption
    const lambdaKmsKey = new KmsKey(this, 'lambda-kms-key', {
      description: 'KMS key for Lambda environment variables encryption',
      enableKeyRotation: true,
      tags: commonTags,
    });

    new KmsAlias(this, 'lambda-kms-alias', {
      name: `alias/ecommerce-lambda-env-vars-${uniqueSuffix}`,
      targetKeyId: lambdaKmsKey.keyId,
    });

    // KMS Key for S3 encryption
    const s3KmsKey = new KmsKey(this, 's3-kms-key', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      tags: commonTags,
    });

    new KmsAlias(this, 's3-kms-alias', {
      name: `alias/ecommerce-s3-bucket-${uniqueSuffix}`,
      targetKeyId: s3KmsKey.keyId,
    });

    // CloudWatch Log Groups
    const productServiceLogGroup = new CloudwatchLogGroup(
      this,
      'product-service-logs',
      {
        name: `/aws/lambda/ecommerce-product-service-${uniqueSuffix}`,
        retentionInDays: 90,
        tags: commonTags,
      }
    );

    const orderServiceLogGroup = new CloudwatchLogGroup(
      this,
      'order-service-logs',
      {
        name: `/aws/lambda/ecommerce-order-service-${uniqueSuffix}`,
        retentionInDays: 90,
        tags: commonTags,
      }
    );

    const userServiceLogGroup = new CloudwatchLogGroup(
      this,
      'user-service-logs',
      {
        name: `/aws/lambda/ecommerce-user-service-${uniqueSuffix}`,
        retentionInDays: 90,
        tags: commonTags,
      }
    );

    // IAM Role for Lambda functions
    const lambdaRole = new IamRole(this, 'lambda-execution-role', {
      name: `ecommerce-lambda-execution-role-${uniqueSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: commonTags,
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // DynamoDB Tables
    const productsTable = new DynamodbTable(this, 'products-table', {
      name: `ecommerce-products-${uniqueSuffix}`,
      billingMode: 'PROVISIONED',
      readCapacity: 5,
      writeCapacity: 5,
      hashKey: 'productId',
      attribute: [
        {
          name: 'productId',
          type: 'S',
        },
        {
          name: 'category',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'CategoryIndex',
          hashKey: 'category',
          readCapacity: 5,
          writeCapacity: 5,
          projectionType: 'ALL',
        },
      ],
      tags: commonTags,
    });

    const ordersTable = new DynamodbTable(this, 'orders-table', {
      name: `ecommerce-orders-${uniqueSuffix}`,
      billingMode: 'PROVISIONED',
      readCapacity: 5,
      writeCapacity: 5,
      hashKey: 'orderId',
      rangeKey: 'userId',
      attribute: [
        {
          name: 'orderId',
          type: 'S',
        },
        {
          name: 'userId',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'UserIndex',
          hashKey: 'userId',
          readCapacity: 5,
          writeCapacity: 5,
          projectionType: 'ALL',
        },
      ],
      tags: commonTags,
    });

    const usersTable = new DynamodbTable(this, 'users-table', {
      name: `ecommerce-users-${uniqueSuffix}`,
      billingMode: 'PROVISIONED',
      readCapacity: 5,
      writeCapacity: 5,
      hashKey: 'userId',
      attribute: [
        {
          name: 'userId',
          type: 'S',
        },
      ],
      tags: commonTags,
    });

    // Custom IAM policy for DynamoDB and KMS access
    const lambdaCustomPolicy = new IamPolicy(this, 'lambda-custom-policy', {
      name: `ecommerce-lambda-custom-policy-${uniqueSuffix}`,
      description: 'Custom policy for ecommerce Lambda functions',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [
              productsTable.arn,
              ordersTable.arn,
              usersTable.arn,
              `${productsTable.arn}/index/*`,
              `${ordersTable.arn}/index/*`,
              `${usersTable.arn}/index/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:DescribeKey'],
            Resource: lambdaKmsKey.arn,
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `arn:aws:s3:::ecommerce-static-assets-${current.accountId}-${uniqueSuffix}/*`,
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'lambda-custom-policy-attachment', {
      role: lambdaRole.name,
      policyArn: lambdaCustomPolicy.arn,
    });

    // Auto-scaling for DynamoDB tables
    const tables = [
      { table: productsTable, name: 'products' },
      { table: ordersTable, name: 'orders' },
      { table: usersTable, name: 'users' },
    ];

    tables.forEach(({ table, name }) => {
      // Read capacity auto-scaling
      const readTarget = new AppautoscalingTarget(this, `${name}-read-target`, {
        maxCapacity: 500,
        minCapacity: 5,
        resourceId: `table/${table.name}`,
        scalableDimension: 'dynamodb:table:ReadCapacityUnits',
        serviceNamespace: 'dynamodb',
      });

      new AppautoscalingPolicy(this, `${name}-read-policy`, {
        name: `DynamoDBReadCapacityUtilization:${readTarget.resourceId}-${uniqueSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: readTarget.resourceId,
        scalableDimension: readTarget.scalableDimension,
        serviceNamespace: readTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'DynamoDBReadCapacityUtilization',
          },
        },
      });

      // Write capacity auto-scaling
      const writeTarget = new AppautoscalingTarget(
        this,
        `${name}-write-target`,
        {
          maxCapacity: 500,
          minCapacity: 5,
          resourceId: `table/${table.name}`,
          scalableDimension: 'dynamodb:table:WriteCapacityUnits',
          serviceNamespace: 'dynamodb',
        }
      );

      new AppautoscalingPolicy(this, `${name}-write-policy`, {
        name: `DynamoDBWriteCapacityUtilization:${writeTarget.resourceId}-${uniqueSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: writeTarget.resourceId,
        scalableDimension: writeTarget.scalableDimension,
        serviceNamespace: writeTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'DynamoDBWriteCapacityUtilization',
          },
        },
      });
    });

    // Lambda Functions
    const productServiceCode = `
import json
import boto3
import os

def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "message": "Product Service",
            "service": "products",
            "table": os.environ.get("PRODUCTS_TABLE", ""),
            "path": event.get("path", ""),
            "method": event.get("httpMethod", "")
        })
    }
`;

    const productServiceAsset = createLambdaAsset(
      'product-service',
      productServiceCode
    );
    const productServiceFunction = new LambdaFunction(this, 'product-service', {
      functionName: `ecommerce-product-service-${uniqueSuffix}`,
      role: lambdaRole.arn,
      handler: 'product-service.handler',
      runtime: 'python3.8',
      filename: productServiceAsset.path,
      sourceCodeHash: productServiceAsset.assetHash,
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          PRODUCTS_TABLE: productsTable.name,
          KMS_KEY_ID: lambdaKmsKey.keyId,
        },
      },
      kmsKeyArn: lambdaKmsKey.arn,
      dependsOn: [productServiceLogGroup],
      tags: commonTags,
    });

    const orderServiceCode = `
import json
import boto3
import os

def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "message": "Order Service",
            "service": "orders",
            "orders_table": os.environ.get("ORDERS_TABLE", ""),
            "products_table": os.environ.get("PRODUCTS_TABLE", ""),
            "path": event.get("path", ""),
            "method": event.get("httpMethod", "")
        })
    }
`;

    const orderServiceAsset = createLambdaAsset(
      'order-service',
      orderServiceCode
    );
    const orderServiceFunction = new LambdaFunction(this, 'order-service', {
      functionName: `ecommerce-order-service-${uniqueSuffix}`,
      role: lambdaRole.arn,
      handler: 'order-service.handler',
      runtime: 'python3.8',
      filename: orderServiceAsset.path,
      sourceCodeHash: orderServiceAsset.assetHash,
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          ORDERS_TABLE: ordersTable.name,
          PRODUCTS_TABLE: productsTable.name,
          KMS_KEY_ID: lambdaKmsKey.keyId,
        },
      },
      kmsKeyArn: lambdaKmsKey.arn,
      dependsOn: [orderServiceLogGroup],
      tags: commonTags,
    });

    const userServiceCode = `
import json
import boto3
import os

def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "message": "User Service",
            "service": "users",
            "table": os.environ.get("USERS_TABLE", ""),
            "path": event.get("path", ""),
            "method": event.get("httpMethod", "")
        })
    }
`;

    const userServiceAsset = createLambdaAsset('user-service', userServiceCode);
    const userServiceFunction = new LambdaFunction(this, 'user-service', {
      functionName: `ecommerce-user-service-${uniqueSuffix}`,
      role: lambdaRole.arn,
      handler: 'user-service.handler',
      runtime: 'python3.8',
      filename: userServiceAsset.path,
      sourceCodeHash: userServiceAsset.assetHash,
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          USERS_TABLE: usersTable.name,
          KMS_KEY_ID: lambdaKmsKey.keyId,
        },
      },
      kmsKeyArn: lambdaKmsKey.arn,
      dependsOn: [userServiceLogGroup],
      tags: commonTags,
    });

    // S3 Bucket for static hosting
    const staticBucket = new S3Bucket(this, 'static-assets-bucket', {
      bucket: `ecommerce-static-assets-${current.accountId}-${uniqueSuffix}`,
      tags: commonTags,
    });

    // S3 Bucket versioning
    new S3BucketVersioningA(this, 'static-bucket-versioning', {
      bucket: staticBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Bucket encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'static-bucket-encryption',
      {
        bucket: staticBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: s3KmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // S3 Bucket public access block
    new S3BucketPublicAccessBlock(this, 'static-bucket-pab', {
      bucket: staticBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 Website configuration
    new S3BucketWebsiteConfiguration(this, 'static-bucket-website', {
      bucket: staticBucket.id,
      indexDocument: {
        suffix: 'index.html',
      },
      errorDocument: {
        key: 'error.html',
      },
    });

    // API Gateway
    const api = new ApiGatewayRestApi(this, 'ecommerce-api', {
      name: `ecommerce-api-${uniqueSuffix}`,
      description: 'E-commerce serverless API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: commonTags,
    });

    // API Gateway Resources and Methods
    const apiResources = [
      { path: 'products', lambda: productServiceFunction },
      { path: 'orders', lambda: orderServiceFunction },
      { path: 'users', lambda: userServiceFunction },
    ];

    apiResources.forEach(({ path, lambda }) => {
      const resource = new ApiGatewayResource(this, `${path}-resource`, {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: path,
      });

      const method = new ApiGatewayMethod(this, `${path}-method`, {
        restApiId: api.id,
        resourceId: resource.id,
        httpMethod: 'ANY',
        authorization: 'NONE',
      });

      const integration = new ApiGatewayIntegration(
        this,
        `${path}-integration`,
        {
          restApiId: api.id,
          resourceId: resource.id,
          httpMethod: method.httpMethod,
          integrationHttpMethod: 'POST',
          type: 'AWS_PROXY',
          uri: lambda.invokeArn,
        }
      );

      new ApiGatewayMethodResponse(this, `${path}-method-response`, {
        restApiId: api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        statusCode: '200',
      });

      new ApiGatewayIntegrationResponse(this, `${path}-integration-response`, {
        restApiId: api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        statusCode: '200',
        dependsOn: [integration],
      });

      new LambdaPermission(this, `${path}-lambda-permission`, {
        statementId: `AllowExecutionFromAPIGateway-${path}`,
        action: 'lambda:InvokeFunction',
        functionName: lambda.functionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
      });
    });

    // Collect all integration and method resources for dependencies
    // API Gateway deployment requires all methods and integrations to be created first
    // This ensures proper dependency ordering during Terraform deployment
    const integrations: ApiGatewayIntegration[] = [];
    const methods: ApiGatewayMethod[] = [];

    apiResources.forEach(({ path }) => {
      integrations.push(
        this.node.findChild(`${path}-integration`) as ApiGatewayIntegration
      );
      methods.push(this.node.findChild(`${path}-method`) as ApiGatewayMethod);
    });

    // API Gateway Deployment
    const apiDeployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      dependsOn: [...integrations, ...methods],
      triggers: {
        redeployment: Date.now().toString(),
      },
    });

    // API Gateway Stage
    new ApiGatewayStage(this, 'api-stage', {
      restApiId: api.id,
      deploymentId: apiDeployment.id,
      stageName: 'prod',
      description: 'Production stage for e-commerce API',
      tags: commonTags,
      xrayTracingEnabled: true,
    });

    // Outputs
    new TerraformOutput(this, 'api-gateway-url', {
      value: `https://${api.id}.execute-api.us-east-1.amazonaws.com/prod`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: staticBucket.bucket,
      description: 'S3 bucket name for static assets',
    });

    new TerraformOutput(this, 'dynamodb-tables', {
      value: {
        products: productsTable.name,
        orders: ordersTable.name,
        users: usersTable.name,
      },
      description: 'DynamoDB table names',
    });
  }
}

if (require.main === module) {
  const app = new App();
  new TapStack(app, 'ecommerce-serverless');
  app.synth();
}
