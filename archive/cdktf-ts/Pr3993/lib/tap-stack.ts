// lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import Archive provider
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';

// Import AWS data sources
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';

// Import SSM Parameter Store
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

// Import API Gateway resources
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';

// Import custom modules
import {
  ApiGatewayConstruct,
  DynamoTableConstruct,
  LambdaConstruct,
  ResourceTags,
  productsHandlerCode,
  ordersHandlerCode,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Archive Provider
    new ArchiveProvider(this, 'archive');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Enable S3 state locking
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get current AWS account and region
    const current = new DataAwsCallerIdentity(this, 'current');
    const currentRegion = new DataAwsRegion(this, 'current-region');

    // Common tags
    const commonTags: ResourceTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      Project: 'ecommerce-serverless',
    };

    // Create DynamoDB tables
    const productsTable = new DynamoTableConstruct(
      this,
      'products-table',
      {
        tableName: `products-${environmentSuffix}`,
        hashKey: 'productId',
        hashKeyType: 'S',
        gsi: [
          {
            name: 'CategoryIndex',
            hashKey: 'category',
            hashKeyType: 'S',
            rangeKey: 'createdAt',
            rangeKeyType: 'S',
          },
        ],
      },
      commonTags
    );

    const ordersTable = new DynamoTableConstruct(
      this,
      'orders-table',
      {
        tableName: `orders-${environmentSuffix}`,
        hashKey: 'orderId',
        hashKeyType: 'S',
        gsi: [
          {
            name: 'CustomerIndex',
            hashKey: 'customerId',
            hashKeyType: 'S',
            rangeKey: 'createdAt',
            rangeKeyType: 'S',
          },
        ],
      },
      commonTags
    );

    // Store table names in Parameter Store
    const productsTableParam = new SsmParameter(this, 'products-table-param', {
      name: `/ecommerce/${environmentSuffix}/tables/products`,
      type: 'String',
      value: productsTable.table.name,
      tags: commonTags,
    });

    const ordersTableParam = new SsmParameter(this, 'orders-table-param', {
      name: `/ecommerce/${environmentSuffix}/tables/orders`,
      type: 'String',
      value: ordersTable.table.name,
      tags: commonTags,
    });

    // Create Lambda functions
    const productsLambda = new LambdaConstruct(
      this,
      'products-lambda',
      {
        functionName: `products-api-${environmentSuffix}`,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        environment: {
          PRODUCTS_TABLE_PARAM: productsTableParam.name,
        },
        inlineCode: productsHandlerCode,
        logRetentionDays: 30,
      },
      commonTags
    );

    const ordersLambda = new LambdaConstruct(
      this,
      'orders-lambda',
      {
        functionName: `orders-api-${environmentSuffix}`,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        environment: {
          ORDERS_TABLE_PARAM: ordersTableParam.name,
        },
        inlineCode: ordersHandlerCode,
        logRetentionDays: 30,
      },
      commonTags
    );

    // Add DynamoDB and SSM permissions to Lambda functions
    productsLambda.attachInlinePolicy('dynamodb-access', {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Scan',
            'dynamodb:Query',
          ],
          Resource: [
            productsTable.table.arn,
            `${productsTable.table.arn}/index/*`,
          ],
        },
        {
          Effect: 'Allow',
          Action: ['ssm:GetParameter'],
          Resource: `arn:aws:ssm:${currentRegion.name}:${current.accountId}:parameter/ecommerce/${environmentSuffix}/tables/*`,
        },
      ],
    });

    ordersLambda.attachInlinePolicy('dynamodb-access', {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Scan',
            'dynamodb:Query',
          ],
          Resource: [ordersTable.table.arn, `${ordersTable.table.arn}/index/*`],
        },
        {
          Effect: 'Allow',
          Action: ['ssm:GetParameter'],
          Resource: `arn:aws:ssm:${currentRegion.name}:${current.accountId}:parameter/ecommerce/${environmentSuffix}/tables/*`,
        },
      ],
    });

    // Create API Gateway
    const apiGateway = new ApiGatewayConstruct(
      this,
      'api-gateway',
      `ecommerce-api-${environmentSuffix}`,
      commonTags
    );

    // Create API resources
    const productsResource = new ApiGatewayResource(this, 'products-resource', {
      restApiId: apiGateway.api.id,
      parentId: apiGateway.api.rootResourceId,
      pathPart: 'products',
    });

    const productIdResource = new ApiGatewayResource(
      this,
      'product-id-resource',
      {
        restApiId: apiGateway.api.id,
        parentId: productsResource.id,
        pathPart: '{id}',
      }
    );

    const ordersResource = new ApiGatewayResource(this, 'orders-resource', {
      restApiId: apiGateway.api.id,
      parentId: apiGateway.api.rootResourceId,
      pathPart: 'orders',
    });

    const orderIdResource = new ApiGatewayResource(this, 'order-id-resource', {
      restApiId: apiGateway.api.id,
      parentId: ordersResource.id,
      pathPart: '{id}',
    });

    // Set up API integrations
    apiGateway.createLambdaIntegration(
      productsResource,
      'GET',
      productsLambda.lambda,
      'products'
    );
    apiGateway.createLambdaIntegration(
      productIdResource,
      'GET',
      productsLambda.lambda,
      'product-id'
    );
    apiGateway.addCorsOptions(productsResource, 'products');
    apiGateway.addCorsOptions(productIdResource, 'product-id');

    apiGateway.createLambdaIntegration(
      ordersResource,
      'POST',
      ordersLambda.lambda,
      'orders'
    );
    apiGateway.createLambdaIntegration(
      orderIdResource,
      'GET',
      ordersLambda.lambda,
      'order-id'
    );
    apiGateway.addCorsOptions(ordersResource, 'orders');
    apiGateway.addCorsOptions(orderIdResource, 'order-id');

    // Deploy API - use the collected dependencies
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: apiGateway.api.id,
      dependsOn: apiGateway.getDeploymentDependencies(),
      description: `Deployment for ${environmentSuffix} stage at ${new Date().toISOString()}`,
    });

    // Create API Stage
    const apiStage = new ApiGatewayStage(this, 'api-stage', {
      restApiId: apiGateway.api.id,
      deploymentId: deployment.id,
      stageName: environmentSuffix,
      description: `${environmentSuffix} stage`,
      tags: commonTags,
    });

    // Terraform Outputs
    new TerraformOutput(this, 'api-gateway-url', {
      value: `https://${apiGateway.api.id}.execute-api.${currentRegion.name}.amazonaws.com/${apiStage.stageName}`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'products-lambda-arn', {
      value: productsLambda.lambda.arn,
      description: 'Products Lambda function ARN',
    });

    new TerraformOutput(this, 'orders-lambda-arn', {
      value: ordersLambda.lambda.arn,
      description: 'Orders Lambda function ARN',
    });

    new TerraformOutput(this, 'products-table-name', {
      value: productsTable.table.name,
      description: 'Products DynamoDB table name',
    });

    new TerraformOutput(this, 'orders-table-name', {
      value: ordersTable.table.name,
      description: 'Orders DynamoDB table name',
    });

    new TerraformOutput(this, 'products-table-arn', {
      value: productsTable.table.arn,
      description: 'Products DynamoDB table ARN',
    });

    new TerraformOutput(this, 'orders-table-arn', {
      value: ordersTable.table.arn,
      description: 'Orders DynamoDB table ARN',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'aws-region', {
      value: currentRegion.name,
      description: 'Current AWS Region',
    });
  }
}
