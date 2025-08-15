# Model Response - E-commerce Serverless Infrastructure

## Overview

This document contains a model CDKTF implementation for deploying a serverless e-commerce application infrastructure on AWS. This represents a baseline implementation that demonstrates the required components and structure.

## Architecture Components

- **AWS Provider**: Configured for us-east-1 region
- **API Gateway**: Regional REST API with multiple service endpoints
- **Lambda Functions**: Three microservices (product, order, user) with Python 3.8 runtime
- **DynamoDB**: Three tables with auto-scaling capabilities
- **S3 Bucket**: Static hosting with encryption and versioning
- **IAM**: Service roles and policies for secure access
- **CloudWatch**: Log groups with 90-day retention
- **KMS**: Encryption keys for Lambda and S3

## Implementation

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { ApiGatewayMethodResponse } from "@cdktf/provider-aws/lib/api-gateway-method-response";
import { ApiGatewayIntegrationResponse } from "@cdktf/provider-aws/lib/api-gateway-integration-response";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { AppautoscalingTarget } from "@cdktf/provider-aws/lib/appautoscaling-target";
import { AppautoscalingPolicy } from "@cdktf/provider-aws/lib/appautoscaling-policy";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

class ECommerceServerlessStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common tags for cost allocation
    const commonTags = {
      Environment: "production",
      Owner: "ecommerce-team",
      Project: "serverless-ecommerce",
      ManagedBy: "terraform"
    };

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      defaultTags: [{
        tags: commonTags
      }]
    });

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, "current");

    // KMS Key for Lambda environment variables encryption
    const lambdaKmsKey = new KmsKey(this, "lambda-kms-key", {
      description: "KMS key for Lambda environment variables encryption",
      enableKeyRotation: true,
      tags: commonTags
    });

    new KmsAlias(this, "lambda-kms-alias", {
      name: "alias/ecommerce-lambda-env-vars",
      targetKeyId: lambdaKmsKey.keyId
    });

    // KMS Key for S3 encryption
    const s3KmsKey = new KmsKey(this, "s3-kms-key", {
      description: "KMS key for S3 bucket encryption",
      enableKeyRotation: true,
      tags: commonTags
    });

    new KmsAlias(this, "s3-kms-alias", {
      name: "alias/ecommerce-s3-bucket",
      targetKeyId: s3KmsKey.keyId
    });

    // CloudWatch Log Groups
    const productServiceLogGroup = new CloudwatchLogGroup(this, "product-service-logs", {
      name: "/aws/lambda/ecommerce-product-service",
      retentionInDays: 90,
      tags: commonTags
    });

    const orderServiceLogGroup = new CloudwatchLogGroup(this, "order-service-logs", {
      name: "/aws/lambda/ecommerce-order-service",
      retentionInDays: 90,
      tags: commonTags
    });

    const userServiceLogGroup = new CloudwatchLogGroup(this, "user-service-logs", {
      name: "/aws/lambda/ecommerce-user-service",
      retentionInDays: 90,
      tags: commonTags
    });

    // IAM Role for Lambda functions
    const lambdaRole = new IamRole(this, "lambda-execution-role", {
      name: "ecommerce-lambda-execution-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com"
            }
          }
        ]
      }),
      tags: commonTags
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, "lambda-basic-execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    });

    // Custom IAM policy for DynamoDB and KMS access
    const lambdaCustomPolicy = new IamPolicy(this, "lambda-custom-policy", {
      name: "ecommerce-lambda-custom-policy",
      description: "Custom policy for ecommerce Lambda functions",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan"
            ],
            Resource: [
              `arn:aws:dynamodb:us-east-1:${current.accountId}:table/ecommerce-products`,
              `arn:aws:dynamodb:us-east-1:${current.accountId}:table/ecommerce-orders`,
              `arn:aws:dynamodb:us-east-1:${current.accountId}:table/ecommerce-users`,
              `arn:aws:dynamodb:us-east-1:${current.accountId}:table/ecommerce-products/index/*`,
              `arn:aws:dynamodb:us-east-1:${current.accountId}:table/ecommerce-orders/index/*`,
              `arn:aws:dynamodb:us-east-1:${current.accountId}:table/ecommerce-users/index/*`
            ]
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:DescribeKey"
            ],
            Resource: lambdaKmsKey.arn
          },
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject"
            ],
            Resource: `arn:aws:s3:::ecommerce-static-assets-${current.accountId}/*`
          }
        ]
      }),
      tags: commonTags
    });

    new IamRolePolicyAttachment(this, "lambda-custom-policy-attachment", {
      role: lambdaRole.name,
      policyArn: lambdaCustomPolicy.arn
    });

    // DynamoDB Tables
    const productsTable = new DynamodbTable(this, "products-table", {
      name: "ecommerce-products",
      billingMode: "PROVISIONED",
      readCapacity: 5,
      writeCapacity: 5,
      hashKey: "productId",
      attribute: [
        {
          name: "productId",
          type: "S"
        },
        {
          name: "category",
          type: "S"
        }
      ],
      globalSecondaryIndex: [
        {
          name: "CategoryIndex",
          hashKey: "category",
          readCapacity: 5,
          writeCapacity: 5,
          projectionType: "ALL"
        }
      ],
      tags: commonTags
    });

    const ordersTable = new DynamodbTable(this, "orders-table", {
      name: "ecommerce-orders",
      billingMode: "PROVISIONED",
      readCapacity: 5,
      writeCapacity: 5,
      hashKey: "orderId",
      rangeKey: "userId",
      attribute: [
        {
          name: "orderId",
          type: "S"
        },
        {
          name: "userId",
          type: "S"
        }
      ],
      globalSecondaryIndex: [
        {
          name: "UserIndex",
          hashKey: "userId",
          readCapacity: 5,
          writeCapacity: 5,
          projectionType: "ALL"
        }
      ],
      tags: commonTags
    });

    const usersTable = new DynamodbTable(this, "users-table", {
      name: "ecommerce-users",
      billingMode: "PROVISIONED",
      readCapacity: 5,
      writeCapacity: 5,
      hashKey: "userId",
      attribute: [
        {
          name: "userId",
          type: "S"
        }
      ],
      tags: commonTags
    });

    // Auto-scaling for DynamoDB tables
    const tables = [
      { table: productsTable, name: "products" },
      { table: ordersTable, name: "orders" },
      { table: usersTable, name: "users" }
    ];

    tables.forEach(({ table, name }) => {
      // Read capacity auto-scaling
      const readTarget = new AppautoscalingTarget(this, `${name}-read-target`, {
        maxCapacity: 500,
        minCapacity: 5,
        resourceId: `table/${table.name}`,
        scalableDimension: "dynamodb:table:ReadCapacityUnits",
        serviceNamespace: "dynamodb"
      });

      new AppautoscalingPolicy(this, `${name}-read-policy`, {
        name: `DynamoDBReadCapacityUtilization:${readTarget.resourceId}`,
        policyType: "TargetTrackingScaling",
        resourceId: readTarget.resourceId,
        scalableDimension: readTarget.scalableDimension,
        serviceNamespace: readTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: "DynamoDBReadCapacityUtilization"
          }
        }
      });

      // Write capacity auto-scaling
      const writeTarget = new AppautoscalingTarget(this, `${name}-write-target`, {
        maxCapacity: 500,
        minCapacity: 5,
        resourceId: `table/${table.name}`,
        scalableDimension: "dynamodb:table:WriteCapacityUnits",
        serviceNamespace: "dynamodb"
      });

      new AppautoscalingPolicy(this, `${name}-write-policy`, {
        name: `DynamoDBWriteCapacityUtilization:${writeTarget.resourceId}`,
        policyType: "TargetTrackingScaling",
        resourceId: writeTarget.resourceId,
        scalableDimension: writeTarget.scalableDimension,
        serviceNamespace: writeTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: "DynamoDBWriteCapacityUtilization"
          }
        }
      });
    });

    // Lambda Functions
    const productServiceFunction = new LambdaFunction(this, "product-service", {
      functionName: "ecommerce-product-service",
      role: lambdaRole.arn,
      handler: "index.handler",
      runtime: "python3.8",
      filename: "product-service.zip",
      sourceCodeHash: "dummy-hash-product",
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          PRODUCTS_TABLE: productsTable.name,
          KMS_KEY_ID: lambdaKmsKey.keyId
        }
      },
      kmsKeyArn: lambdaKmsKey.arn,
      dependsOn: [productServiceLogGroup],
      tags: commonTags
    });

    const orderServiceFunction = new LambdaFunction(this, "order-service", {
      functionName: "ecommerce-order-service",
      role: lambdaRole.arn,
      handler: "index.handler",
      runtime: "python3.8",
      filename: "order-service.zip",
      sourceCodeHash: "dummy-hash-order",
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          ORDERS_TABLE: ordersTable.name,
          PRODUCTS_TABLE: productsTable.name,
          KMS_KEY_ID: lambdaKmsKey.keyId
        }
      },
      kmsKeyArn: lambdaKmsKey.arn,
      dependsOn: [orderServiceLogGroup],
      tags: commonTags
    });

    const userServiceFunction = new LambdaFunction(this, "user-service", {
      functionName: "ecommerce-user-service",
      role: lambdaRole.arn,
      handler: "index.handler",
      runtime: "python3.8",
      filename: "user-service.zip",
      sourceCodeHash: "dummy-hash-user",
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          USERS_TABLE: usersTable.name,
          KMS_KEY_ID: lambdaKmsKey.keyId
        }
      },
      kmsKeyArn: lambdaKmsKey.arn,
      dependsOn: [userServiceLogGroup],
      tags: commonTags
    });

    // S3 Bucket for static hosting
    const staticBucket = new S3Bucket(this, "static-assets-bucket", {
      bucket: `ecommerce-static-assets-${current.accountId}`,
      tags: commonTags
    });

    // S3 Bucket versioning
    new S3BucketVersioning(this, "static-bucket-versioning", {
      bucket: staticBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    // S3 Bucket encryption
    new S3BucketServerSideEncryptionConfiguration(this, "static-bucket-encryption", {
      bucket: staticBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: s3KmsKey.arn,
            sseAlgorithm: "aws:kms"
          },
          bucketKeyEnabled: true
        }
      ]
    });

    // S3 Bucket public access block
    new S3BucketPublicAccessBlock(this, "static-bucket-pab", {
      bucket: staticBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    // S3 Website configuration
    new S3BucketWebsiteConfiguration(this, "static-bucket-website", {
      bucket: staticBucket.id,
      indexDocument: {
        suffix: "index.html"
      },
      errorDocument: {
        key: "error.html"
      }
    });

    // API Gateway
    const api = new ApiGatewayRestApi(this, "ecommerce-api", {
      name: "ecommerce-api",
      description: "E-commerce serverless API",
      endpointConfiguration: {
        types: ["REGIONAL"]
      },
      tags: commonTags
    });

    // API Gateway Resources and Methods
    const apiResources = [
      { path: "products", lambda: productServiceFunction },
      { path: "orders", lambda: orderServiceFunction },
      { path: "users", lambda: userServiceFunction }
    ];

    apiResources.forEach(({ path, lambda }) => {
      const resource = new ApiGatewayResource(this, `${path}-resource`, {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: path
      });

      const method = new ApiGatewayMethod(this, `${path}-method`, {
        restApiId: api.id,
        resourceId: resource.id,
        httpMethod: "ANY",
        authorization: "NONE"
      });

      const integration = new ApiGatewayIntegration(this, `${path}-integration`, {
        restApiId: api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        integrationHttpMethod: "POST",
        type: "AWS_PROXY",
        uri: lambda.invokeArn
      });

      new ApiGatewayMethodResponse(this, `${path}-method-response`, {
        restApiId: api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        statusCode: "200"
      });

      new ApiGatewayIntegrationResponse(this, `${path}-integration-response`, {
        restApiId: api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        statusCode: "200",
        dependsOn: [integration]
      });

      new LambdaPermission(this, `${path}-lambda-permission`, {
        statementId: `AllowExecutionFromAPIGateway-${path}`,
        action: "lambda:InvokeFunction",
        functionName: lambda.functionName,
        principal: "apigateway.amazonaws.com",
        sourceArn: `${api.executionArn}/*/*`
      });
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, "api-deployment", {
      restApiId: api.id,
      stageName: "prod",
      dependsOn: [
        // Add all integrations as dependencies
        ...apiResources.map((_, index) => `${apiResources[index].path}-integration`)
      ]
    });

    // Outputs
    new TerraformOutput(this, "api-gateway-url", {
      value: `https://${api.id}.execute-api.us-east-1.amazonaws.com/prod`,
      description: "API Gateway endpoint URL"
    });

    new TerraformOutput(this, "s3-bucket-name", {
      value: staticBucket.bucket,
      description: "S3 bucket name for static assets"
    });

    new TerraformOutput(this, "dynamodb-tables", {
      value: {
        products: productsTable.name,
        orders: ordersTable.name,
        users: usersTable.name
      },
      description: "DynamoDB table names"
    });
  }
}

const app = new App();
new ECommerceServerlessStack(app, "ecommerce-serverless");
app.synth();
```

## Key Components

### Security Features
- KMS encryption for Lambda environment variables and S3
- IAM roles with least-privilege access policies
- S3 bucket public access blocking
- Encrypted environment variables for Lambda functions

### Scalability Features
- DynamoDB auto-scaling (5-500 capacity units)
- Regional API Gateway endpoint
- Appropriate Lambda memory allocation (256MB)
- Global Secondary Indexes for efficient queries

### Monitoring and Logging
- CloudWatch log groups with 90-day retention
- Proper tagging for cost allocation and resource management
- Lambda function dependencies on log groups

### Infrastructure Management
- Consistent resource naming patterns
- Cost allocation tags across all resources
- Proper dependency management for deployment ordering

## Notes

This model response demonstrates a functional serverless architecture but may require additional optimizations for production use, including:
- Enhanced error handling
- More granular IAM permissions
- Advanced monitoring and alerting
- Performance tuning based on usage patterns
- Security hardening for production environments