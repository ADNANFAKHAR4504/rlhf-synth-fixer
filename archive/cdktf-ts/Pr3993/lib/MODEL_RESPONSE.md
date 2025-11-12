**tap-stack.ts**

```typescript

import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import * as aws from '@cdktf/provider-aws';
import {
  LambdaConstruct,
  ApiGatewayConstruct,
  DynamoTableConstruct,
  SsmParameterConstruct,
  CloudWatchLogGroupConstruct,
  IamRoleConstruct,
  StackConfig,
  ResourceTags
} from './modules';

export interface TapStackConfig {
  projectName: string;
  environment?: string;
  region?: string;
  logRetentionDays?: number;
  lambdaMemoryMb?: number;
  lambdaTimeoutSec?: number;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    // Validate required inputs
    if (!config.projectName) {
      throw new Error('projectName is required and cannot be empty');
    }

    // Set defaults
    const stackConfig: StackConfig = {
      projectName: config.projectName,
      environment: config.environment || 'production',
      region: config.region || 'us-east-1',
      logRetentionDays: config.logRetentionDays || 30,
      lambdaMemoryMb: config.lambdaMemoryMb || 512,
      lambdaTimeoutSec: config.lambdaTimeoutSec || 10
    };

    const tags: ResourceTags = {
      project: stackConfig.projectName,
      environment: stackConfig.environment,
      owner: 'ecommerce-team'
    };

    // AWS Provider
    new aws.provider.AwsProvider(this, 'aws', {
      region: stackConfig.region
    });

    // DynamoDB Tables
    const productsTable = new DynamoTableConstruct(this, 'products-table', {
      tableName: `${stackConfig.projectName}-products-${stackConfig.environment}`,
      hashKey: 'productId',
      rangeKey: 'category',
      gsiConfigs: [{
        indexName: 'category-price-index',
        hashKey: 'category',
        rangeKey: 'price',
        projectionType: 'ALL'
      }],
      tags
    });

    const ordersTable = new DynamoTableConstruct(this, 'orders-table', {
      tableName: `${stackConfig.projectName}-orders-${stackConfig.environment}`,
      hashKey: 'orderId',
      rangeKey: 'customerId',
      gsiConfigs: [{
        indexName: 'customer-date-index',
        hashKey: 'customerId',
        rangeKey: 'orderDate',
        projectionType: 'ALL'
      }],
      tags
    });

    // SSM Parameters for configuration
    const productsTableParam = new SsmParameterConstruct(this, 'products-table-param', {
      name: `/${stackConfig.projectName}/${stackConfig.environment}/dynamodb/products-table`,
      value: productsTable.tableName,
      tags
    });

    const ordersTableParam = new SsmParameterConstruct(this, 'orders-table-param', {
      name: `/${stackConfig.projectName}/${stackConfig.environment}/dynamodb/orders-table`,
      value: ordersTable.tableName,
      tags
    });

    const stageParam = new SsmParameterConstruct(this, 'stage-param', {
      name: `/${stackConfig.projectName}/${stackConfig.environment}/stage`,
      value: stackConfig.environment,
      tags
    });

    // CloudWatch Log Groups
    const productsLogGroup = new CloudWatchLogGroupConstruct(this, 'products-log-group', {
      name: `/aws/lambda/${stackConfig.projectName}-products-${stackConfig.environment}`,
      retentionDays: stackConfig.logRetentionDays,
      tags
    });

    const ordersLogGroup = new CloudWatchLogGroupConstruct(this, 'orders-log-group', {
      name: `/aws/lambda/${stackConfig.projectName}-orders-${stackConfig.environment}`,
      retentionDays: stackConfig.logRetentionDays,
      tags
    });

    // IAM Roles for Lambdas
    const productsLambdaRole = new IamRoleConstruct(this, 'products-lambda-role', {
      roleName: `${stackConfig.projectName}-products-lambda-role-${stackConfig.environment}`,
      assumeRoleService: 'lambda.amazonaws.com',
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      inlinePolicies: [{
        name: 'DynamoDBAccess',
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:UpdateItem'
              ],
              Resource: [
                productsTable.tableArn,
                `${productsTable.tableArn}/index/*`
              ]
            },
            {
              Effect: 'Allow',
              Action: ['ssm:GetParameter'],
              Resource: `arn:aws:ssm:${stackConfig.region}:*:parameter/${stackConfig.projectName}/${stackConfig.environment}/*`
            }
          ]
        }
      }],
      tags
    });

    const ordersLambdaRole = new IamRoleConstruct(this, 'orders-lambda-role', {
      roleName: `${stackConfig.projectName}-orders-lambda-role-${stackConfig.environment}`,
      assumeRoleService: 'lambda.amazonaws.com',
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      inlinePolicies: [{
        name: 'DynamoDBAccess',
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:UpdateItem'
              ],
              Resource: [
                ordersTable.tableArn,
                `${ordersTable.tableArn}/index/*`
              ]
            },
            {
              Effect: 'Allow',
              Action: ['ssm:GetParameter'],
              Resource: `arn:aws:ssm:${stackConfig.region}:*:parameter/${stackConfig.projectName}/${stackConfig.environment}/*`
            }
          ]
        }
      }],
      tags
    });

    // Lambda Functions with inline code
    const productsLambda = new LambdaConstruct(this, 'products-lambda', {
      functionName: `${stackConfig.projectName}-products-${stackConfig.environment}`,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      memorySize: stackConfig.lambdaMemoryMb,
      timeout: stackConfig.lambdaTimeoutSec,
      roleArn: productsLambdaRole.roleArn,
      environment: {
        PRODUCTS_TABLE_PARAM: productsTableParam.parameterName,
        STAGE_PARAM: stageParam.parameterName,
        REGION: stackConfig.region
      },
      inlineCode: `
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const dynamodb = new AWS.DynamoDB.DocumentClient();

let cachedTableName = null;

async function getTableName() {
  if (cachedTableName) return cachedTableName;
  const param = await ssm.getParameter({ Name: process.env.PRODUCTS_TABLE_PARAM }).promise();
  cachedTableName = param.Parameter.Value;
  return cachedTableName;
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  const tableName = await getTableName();
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  try {
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    
    if (method === 'GET' && event.pathParameters?.productId) {
      // Get single product
      const result = await dynamodb.get({
        TableName: tableName,
        Key: { productId: event.pathParameters.productId, category: event.queryStringParameters?.category || 'general' }
      }).promise();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Item || {})
      };
    } else if (method === 'GET') {
      // List products
      const result = await dynamodb.query({
        TableName: tableName,
        IndexName: 'category-price-index',
        KeyConditionExpression: 'category = :cat',
        ExpressionAttributeValues: {
          ':cat': event.queryStringParameters?.category || 'general'
        }
      }).promise();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items || [])
      };
    } else if (method === 'POST') {
      // Create product
      const productId = 'prod_' + Date.now();
      const item = {
        productId,
        category: body.category || 'general',
        name: body.name,
        price: body.price || 0,
        stock: body.stock || 0,
        createdAt: new Date().toISOString()
      };
      
      await dynamodb.put({
        TableName: tableName,
        Item: item
      }).promise();
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(item)
      };
    } else if (method === 'PUT' && event.pathParameters?.productId) {
      // Update product
      await dynamodb.update({
        TableName: tableName,
        Key: { productId: event.pathParameters.productId, category: body.category || 'general' },
        UpdateExpression: 'SET #name = :name, price = :price, stock = :stock, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: {
          ':name': body.name,
          ':price': body.price,
          ':stock': body.stock,
          ':updatedAt': new Date().toISOString()
        }
      }).promise();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Product updated' })
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
`,
      tags
    });

    const ordersLambda = new LambdaConstruct(this, 'orders-lambda', {
      functionName: `${stackConfig.projectName}-orders-${stackConfig.environment}`,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      memorySize: stackConfig.lambdaMemoryMb,
      timeout: stackConfig.lambdaTimeoutSec,
      roleArn: ordersLambdaRole.roleArn,
      environment: {
        ORDERS_TABLE_PARAM: ordersTableParam.parameterName,
        STAGE_PARAM: stageParam.parameterName,
        REGION: stackConfig.region
      },
      inlineCode: `
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const dynamodb = new AWS.DynamoDB.DocumentClient();

let cachedTableName = null;

async function getTableName() {
  if (cachedTableName) return cachedTableName;
  const param = await ssm.getParameter({ Name: process.env.ORDERS_TABLE_PARAM }).promise();
  cachedTableName = param.Parameter.Value;
  return cachedTableName;
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  const tableName = await getTableName();
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  try {
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    
    if (method === 'GET' && event.pathParameters?.orderId) {
      // Get single order
      const result = await dynamodb.get({
        TableName: tableName,
        Key: { 
          orderId: event.pathParameters.orderId,
          customerId: event.queryStringParameters?.customerId || 'unknown'
        }
      }).promise();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Item || {})
      };
    } else if (method === 'GET' && event.queryStringParameters?.customerId) {
      // List orders for customer
      const result = await dynamodb.query({
        TableName: tableName,
        IndexName: 'customer-date-index',
        KeyConditionExpression: 'customerId = :cid',
        ExpressionAttributeValues: {
          ':cid': event.queryStringParameters.customerId
        }
      }).promise();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items || [])
      };
    } else if (method === 'POST') {
      // Create order
      const orderId = 'ord_' + Date.now();
      const item = {
        orderId,
        customerId: body.customerId || 'unknown',
        products: body.products || [],
        totalAmount: body.totalAmount || 0,
        status: 'pending',
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      await dynamodb.put({
        TableName: tableName,
        Item: item
      }).promise();
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(item)
      };
    } else if (method === 'PUT' && event.pathParameters?.orderId) {
      // Update order status
      await dynamodb.update({
        TableName: tableName,
        Key: { 
          orderId: event.pathParameters.orderId,
          customerId: body.customerId || 'unknown'
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': body.status,
          ':updatedAt': new Date().toISOString()
        }
      }).promise();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Order updated' })
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
`,
      tags
    });

    // API Gateway
    const apiGateway = new ApiGatewayConstruct(this, 'api-gateway', {
      apiName: `${stackConfig.projectName}-api-${stackConfig.environment}`,
      stageName: stackConfig.environment,
      enableCors: true,
      lambdaIntegrations: [
        {
          path: 'products',
          methods: ['GET', 'POST'],
          lambdaArn: productsLambda.lambdaArn,
          lambdaInvokeFunctionName: productsLambda.functionName
        },
        {
          path: 'products/{productId}',
          methods: ['GET', 'PUT'],
          lambdaArn: productsLambda.lambdaArn,
          lambdaInvokeFunctionName: productsLambda.functionName
        },
        {
          path: 'orders',
          methods: ['GET', 'POST'],
          lambdaArn: ordersLambda.lambdaArn,
          lambdaInvokeFunctionName: ordersLambda.functionName
        },
        {
          path: 'orders/{orderId}',
          methods: ['GET', 'PUT'],
          lambdaArn: ordersLambda.lambdaArn,
          lambdaInvokeFunctionName: ordersLambda.functionName
        }
      ],
      tags
    });

    // Outputs
    new TerraformOutput(this, 'api-endpoint-url', {
      value: apiGateway.apiUrl,
      description: 'API Gateway endpoint URL'
    });

    new TerraformOutput(this, 'products-lambda-arn', {
      value: productsLambda.lambdaArn,
      description: 'Products Lambda function ARN'
    });

    new TerraformOutput(this, 'orders-lambda-arn', {
      value: ordersLambda.lambdaArn,
      description: 'Orders Lambda function ARN'
    });

    new TerraformOutput(this, 'products-table-name', {
      value: productsTable.tableName,
      description: 'Products DynamoDB table name'
    });

    new TerraformOutput(this, 'orders-table-name', {
      value: ordersTable.tableName,
      description: 'Orders DynamoDB table name'
    });

    new TerraformOutput(this, 'products-table-param-name', {
      value: productsTableParam.parameterName,
      description: 'SSM parameter name for products table'
    });

    new TerraformOutput(this, 'orders-table-param-name', {
      value: ordersTableParam.parameterName,
      description: 'SSM parameter name for orders table'
    });

    new TerraformOutput(this, 'stage-param-name', {
      value: stageParam.parameterName,
      description: 'SSM parameter name for stage'
    });

    new TerraformOutput(this, 'products-log-group-name', {
      value: productsLogGroup.logGroupName,
      description: 'Products Lambda CloudWatch Log Group name'
    });

    new TerraformOutput(this, 'orders-log-group-name', {
      value: ordersLogGroup.logGroupName,
      description: 'Orders Lambda CloudWatch Log Group name'
    });
  }
}
```

**modules.ts**
```typescript
// lib/modules.ts
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { Asset, TerraformAsset } from 'cdktf';

export interface StackConfig {
  projectName: string;
  environment: string;
  region: string;
  logRetentionDays: number;
  lambdaMemoryMb: number;
  lambdaTimeoutSec: number;
}

export interface ResourceTags {
  project: string;
  environment: string;
  owner: string;
  [key: string]: string;
}

// DynamoDB Table Construct
export interface DynamoTableConfig {
  tableName: string;
  hashKey: string;
  rangeKey?: string;
  gsiConfigs?: Array<{
    indexName: string;
    hashKey: string;
    rangeKey?: string;
    projectionType: string;
  }>;
  tags: ResourceTags;
}

export class DynamoTableConstruct extends Construct {
  public readonly table: aws.dynamodbTable.DynamodbTable;
  public readonly tableName: string;
  public readonly tableArn: string;

  constructor(scope: Construct, id: string, config: DynamoTableConfig) {
    super(scope, id);

    const attributes: aws.dynamodbTable.DynamodbTableAttribute[] = [
      { name: config.hashKey, type: 'S' }
    ];

    if (config.rangeKey) {
      attributes.push({ name: config.rangeKey, type: 'S' });
    }

    // Add GSI attributes
    config.gsiConfigs?.forEach(gsi => {
      if (!attributes.find(attr => attr.name === gsi.hashKey)) {
        attributes.push({ name: gsi.hashKey, type: 'S' });
      }
      if (gsi.rangeKey && !attributes.find(attr => attr.name === gsi.rangeKey)) {
        attributes.push({ name: gsi.rangeKey, type: 'S' });
      }
    });

    const globalSecondaryIndex = config.gsiConfigs?.map(gsi => ({
      name: gsi.indexName,
      hashKey: gsi.hashKey,
      rangeKey: gsi.rangeKey,
      projectionType: gsi.projectionType
    }));

    this.table = new aws.dynamodbTable.DynamodbTable(this, 'table', {
      name: config.tableName,
      billingMode: 'PAY_PER_REQUEST', // On-demand capacity
      hashKey: config.hashKey,
      rangeKey: config.rangeKey,
      attribute: attributes,
      globalSecondaryIndex: globalSecondaryIndex,
      tags: config.tags
    });

    this.tableName = this.table.name;
    this.tableArn = this.table.arn;
  }
}

// SSM Parameter Construct
export interface SsmParameterConfig {
  name: string;
  value: string;
  type?: string;
  tags: ResourceTags;
}

export class SsmParameterConstruct extends Construct {
  public readonly parameter: aws.ssmParameter.SsmParameter;
  public readonly parameterName: string;

  constructor(scope: Construct, id: string, config: SsmParameterConfig) {
    super(scope, id);

    this.parameter = new aws.ssmParameter.SsmParameter(this, 'parameter', {
      name: config.name,
      type: config.type || 'String',
      value: config.value,
      tags: config.tags
    });

    this.parameterName = this.parameter.name;
  }
}

// CloudWatch Log Group Construct
export interface CloudWatchLogGroupConfig {
  name: string;
  retentionDays: number;
  tags: ResourceTags;
}

export class CloudWatchLogGroupConstruct extends Construct {
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly logGroupName: string;

  constructor(scope: Construct, id: string, config: CloudWatchLogGroupConfig) {
    super(scope, id);

    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'log-group', {
      name: config.name,
      retentionInDays: config.retentionDays,
      tags: config.tags
    });

    this.logGroupName = this.logGroup.name;
  }
}

// IAM Role Construct
export interface IamRoleConfig {
  roleName: string;
  assumeRoleService: string;
  managedPolicyArns?: string[];
  inlinePolicies?: Array<{
    name: string;
    policy: any;
  }>;
  tags: ResourceTags;
}

export class IamRoleConstruct extends Construct {
  public readonly role: aws.iamRole.IamRole;
  public readonly roleArn: string;

  constructor(scope: Construct, id: string, config: IamRoleConfig) {
    super(scope, id);

    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: {
            Service: `${config.assumeRoleService}.amazonaws.com`
          },
          Effect: 'Allow'
        }
      ]
    };

    this.role = new aws.iamRole.IamRole(this, 'role', {
      name: config.roleName,
      assumeRolePolicy: JSON.stringify(assumeRolePolicy),
      tags: config.tags
    });

    // Attach managed policies
    config.managedPolicyArns?.forEach((arn, index) => {
      new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, `policy-attachment-${index}`, {
        role: this.role.name,
        policyArn: arn
      });
    });

    // Create inline policies
    config.inlinePolicies?.forEach((inlinePolicy, index) => {
      new aws.iamRolePolicy.IamRolePolicy(this, `inline-policy-${index}`, {
        name: inlinePolicy.name,
        role: this.role.name,
        policy: JSON.stringify(inlinePolicy.policy)
      });
    });

    this.roleArn = this.role.arn;
  }
}

// Lambda Function Construct
export interface LambdaConfig {
  functionName: string;
  handler: string;
  runtime: string;
  memorySize: number;
  timeout: number;
  roleArn: string;
  environment?: { [key: string]: string };
  inlineCode: string;
  tags: ResourceTags;
}

export class LambdaConstruct extends Construct {
  public readonly lambda: aws.lambdaFunction.LambdaFunction;
  public readonly lambdaArn: string;
  public readonly functionName: string;

  constructor(scope: Construct, id: string, config: LambdaConfig) {
    super(scope, id);

    // Create inline code asset
    const asset = new TerraformAsset(this, 'lambda-asset', {
      path: `/tmp/${config.functionName}-${Date.now()}`,
      type: 'archive'
    });

    this.lambda = new aws.lambdaFunction.LambdaFunction(this, 'function', {
      functionName: config.functionName,
      role: config.roleArn,
      handler: config.handler,
      runtime: config.runtime,
      memorySize: config.memorySize,
      timeout: config.timeout,
      environment: config.environment ? {
        variables: config.environment
      } : undefined,
      filename: asset.path,
      sourceCodeHash: asset.assetHash,
      tags: config.tags,
      lifecycle: {
        ignoreChanges: ['filename', 'sourceCodeHash']
      }
    });

    // Override with inline code using zipmap hack
    // In practice, you'd build the zip, but for inline we simulate it
    const inlineCodeOverride = new aws.lambdaFunction.LambdaFunction(this, 'function-inline', {
      functionName: config.functionName,
      role: config.roleArn,
      handler: config.handler,
      runtime: config.runtime,
      memorySize: config.memorySize,
      timeout: config.timeout,
      environment: config.environment ? {
        variables: config.environment
      } : undefined,
      inlineCode: config.inlineCode,
      tags: config.tags
    });

    // Use the inline version
    this.lambda = inlineCodeOverride;
    this.lambdaArn = this.lambda.arn;
    this.functionName = this.lambda.functionName;
  }
}

// API Gateway REST API Construct
export interface ApiGatewayConfig {
  apiName: string;
  stageName: string;
  enableCors: boolean;
  lambdaIntegrations: Array<{
    path: string;
    methods: string[];
    lambdaArn: string;
    lambdaInvokeFunctionName: string;
  }>;
  tags: ResourceTags;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: aws.apiGatewayRestApi.ApiGatewayRestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, config: ApiGatewayConfig) {
    super(scope, id);

    // Create REST API
    this.api = new aws.apiGatewayRestApi.ApiGatewayRestApi(this, 'api', {
      name: config.apiName,
      description: `E-commerce API for ${config.apiName}`,
      tags: config.tags
    });

    // Track resources for paths
    const resources: { [path: string]: aws.apiGatewayResource.ApiGatewayResource } = {};
    
    // Create resources and methods for each integration
    config.lambdaIntegrations.forEach((integration, idx) => {
      // Create or get resource for path
      if (!resources[integration.path]) {
        const pathParts = integration.path.split('/').filter(p => p);
        let parentId = this.api.rootResourceId;
        let currentPath = '';
        
        pathParts.forEach((part, partIdx) => {
          currentPath += `/${part}`;
          if (!resources[currentPath]) {
            resources[currentPath] = new aws.apiGatewayResource.ApiGatewayResource(this, `resource-${currentPath.replace(/[^a-zA-Z0-9]/g, '-')}`, {
              restApiId: this.api.id,
              parentId: parentId,
              pathPart: part
            });
          }
          parentId = resources[currentPath].id;
        });
      }

      const resource = resources[`/${integration.path}`] || this.api.rootResourceId;
      const resourceId = typeof resource === 'string' ? resource : resource.id;

      // Create methods and integrations
      integration.methods.forEach(method => {
        const methodResource = new aws.apiGatewayMethod.ApiGatewayMethod(this, `method-${integration.path}-${method}-${idx}`, {
          restApiId: this.api.id,
          resourceId: resourceId,
          httpMethod: method,
          authorization: 'NONE'
        });

        const integrationResource = new aws.apiGatewayIntegration.ApiGatewayIntegration(this, `integration-${integration.path}-${method}-${idx}`, {
          restApiId: this.api.id,
          resourceId: resourceId,
          httpMethod: method,
          type: 'AWS_PROXY',
          integrationHttpMethod: 'POST',
          uri: `arn:aws:apigateway:${config.tags.environment === 'production' ? 'us-east-1' : 'us-east-1'}:lambda:path/2015-03-31/functions/${integration.lambdaArn}/invocations`
        });

        // Lambda permission for API Gateway to invoke
        new aws.lambdaPermission.LambdaPermission(this, `lambda-permission-${integration.path}-${method}-${idx}`, {
          statementId: `AllowAPIGateway-${integration.path.replace(/[^a-zA-Z0-9]/g, '-')}-${method}`,
          action: 'lambda:InvokeFunction',
          functionName: integration.lambdaInvokeFunctionName,
          principal: 'apigateway.amazonaws.com',
          sourceArn: `${this.api.executionArn}/*/*`
        });
      });

      // Add CORS OPTIONS method if enabled
      if (config.enableCors) {
        const optionsMethod = new aws.apiGatewayMethod.ApiGatewayMethod(this, `method-options-${integration.path}-${idx}`, {
          restApiId: this.api.id,
          resourceId: resourceId,
          httpMethod: 'OPTIONS',
          authorization: 'NONE'
        });

        new aws.apiGatewayIntegration.ApiGatewayIntegration(this, `integration-options-${integration.path}-${idx}`, {
          restApiId: this.api.id,
          resourceId: resourceId,
          httpMethod: 'OPTIONS',
          type: 'MOCK',
          requestTemplates: {
            'application/json': '{"statusCode": 200}'
          }
        });

        new aws.apiGatewayMethodResponse.ApiGatewayMethodResponse(this, `method-response-options-${integration.path}-${idx}`, {
          restApiId: this.api.id,
          resourceId: resourceId,
          httpMethod: 'OPTIONS',
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true
          }
        });

        new aws.apiGatewayIntegrationResponse.ApiGatewayIntegrationResponse(this, `integration-response-options-${integration.path}-${idx}`, {
          restApiId: this.api.id,
          resourceId: resourceId,
          httpMethod: 'OPTIONS',
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': `'${integration.methods.join(',')},OPTIONS'`,
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          }
        });
      }
    });

    // Create deployment
    const deployment = new aws.apiGatewayDeployment.ApiGatewayDeployment(this, 'deployment', {
      restApiId: this.api.id,
      lifecycle: {
        createBeforeDestroy: true
      }
    });

    // Create stage
    const stage = new aws.apiGatewayStage.ApiGatewayStage(this, 'stage', {
      stageName: config.stageName,
      restApiId: this.api.id,
      deploymentId: deployment.id,
      tags: config.tags
    });

    this.apiUrl = `https://${this.api.id}.execute-api.us-east-1.amazonaws.com/${config.stageName}`;
  }
}
```