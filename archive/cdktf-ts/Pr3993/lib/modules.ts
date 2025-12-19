// lib/modules.ts - Fixed version
import { Construct } from 'constructs';

// Archive provider for Lambda inline code
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';

// CloudWatch
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

// DynamoDB
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DynamodbTableAttribute } from '@cdktf/provider-aws/lib/dynamodb-table';

// API Gateway - Import individual classes
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayMethodResponse } from '@cdktf/provider-aws/lib/api-gateway-method-response';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayIntegrationResponse } from '@cdktf/provider-aws/lib/api-gateway-integration-response';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

// Lambda
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';

export type ResourceTags = { [key: string]: string };

export interface LambdaConfig {
  functionName: string;
  handler: string;
  runtime?: string;
  memorySize?: number;
  timeout?: number;
  environment?: { [key: string]: string };
  inlineCode: string;
  logRetentionDays?: number;
}

export interface DynamoTableConfig {
  tableName: string;
  hashKey: string;
  hashKeyType?: string;
  rangeKey?: string;
  rangeKeyType?: string;
  gsi?: {
    name: string;
    hashKey: string;
    hashKeyType?: string;
    rangeKey?: string;
    rangeKeyType?: string;
    projectionType?: string;
  }[];
}

// Interface for method dependencies
export interface ApiMethodDependencies {
  method: ApiGatewayMethod;
  integration: ApiGatewayIntegration;
  methodResponse?: ApiGatewayMethodResponse;
  integrationResponse?: ApiGatewayIntegrationResponse;
}

export class LambdaConstruct extends Construct {
  public readonly lambda: LambdaFunction;
  public readonly role: IamRole;
  public readonly logGroup: CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    config: LambdaConfig,
    tags: ResourceTags
  ) {
    super(scope, id);

    // Create CloudWatch Log Group
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/${config.functionName}`,
      retentionInDays: config.logRetentionDays || 30,
      tags,
    });

    // Create IAM role for Lambda
    this.role = new IamRole(this, 'role', {
      name: `${config.functionName}-role`,
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
      tags,
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'basic-execution', {
      role: this.role.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Create in-memory zip file for Lambda code
    const lambdaCode = `
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const dynamodb = new AWS.DynamoDB.DocumentClient();

${config.inlineCode}
    `;

    const archive = new DataArchiveFile(this, 'lambda-archive', {
      type: 'zip',
      outputPath: `${config.functionName}.zip`,
      source: [
        {
          content: lambdaCode,
          filename: 'index.js',
        },
      ],
    });

    // Create Lambda function
    this.lambda = new LambdaFunction(this, 'function', {
      functionName: config.functionName,
      role: this.role.arn,
      handler: config.handler,
      runtime: config.runtime || 'nodejs18.x',
      memorySize: config.memorySize || 512,
      timeout: config.timeout || 10,
      environment: {
        variables: config.environment || {},
      },
      filename: archive.outputPath,
      sourceCodeHash: archive.outputBase64Sha256,
      tags,
      dependsOn: [this.logGroup],
    });
  }

  public attachInlinePolicy(policyName: string, policyDocument: any): void {
    new IamRolePolicy(this, `policy-${policyName}`, {
      name: policyName,
      role: this.role.id,
      policy: JSON.stringify(policyDocument),
    });
  }
}

export class DynamoTableConstruct extends Construct {
  public readonly table: DynamodbTable;

  constructor(
    scope: Construct,
    id: string,
    config: DynamoTableConfig,
    tags: ResourceTags
  ) {
    super(scope, id);

    const attributes: DynamodbTableAttribute[] = [
      {
        name: config.hashKey,
        type: config.hashKeyType || 'S',
      },
    ];

    if (config.rangeKey) {
      attributes.push({
        name: config.rangeKey,
        type: config.rangeKeyType || 'S',
      });
    }

    // Add GSI attributes
    if (config.gsi) {
      config.gsi.forEach(gsi => {
        if (!attributes.find(attr => attr.name === gsi.hashKey)) {
          attributes.push({
            name: gsi.hashKey,
            type: gsi.hashKeyType || 'S',
          });
        }
        if (
          gsi.rangeKey &&
          !attributes.find(attr => attr.name === gsi.rangeKey)
        ) {
          attributes.push({
            name: gsi.rangeKey,
            type: gsi.rangeKeyType || 'S',
          });
        }
      });
    }

    this.table = new DynamodbTable(this, 'table', {
      name: config.tableName,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: config.hashKey,
      rangeKey: config.rangeKey,
      attribute: attributes,
      globalSecondaryIndex: config.gsi?.map(gsi => ({
        name: gsi.name,
        hashKey: gsi.hashKey,
        rangeKey: gsi.rangeKey,
        projectionType: gsi.projectionType || 'ALL',
      })),
      tags,
    });
  }
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: ApiGatewayRestApi;
  public readonly allDependencies: any[] = [];

  constructor(
    scope: Construct,
    id: string,
    apiName: string,
    tags: ResourceTags
  ) {
    super(scope, id);

    this.api = new ApiGatewayRestApi(this, 'api', {
      name: apiName,
      description: 'E-commerce serverless API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags,
    });
  }

  public addCorsOptions(
    resource: ApiGatewayResource,
    resourceName: string
  ): ApiMethodDependencies {
    // 1. Create method first
    const optionsMethod = new ApiGatewayMethod(
      this,
      `${resourceName}-options-method`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: 'OPTIONS',
        authorization: 'NONE',
      }
    );

    // 2. Create integration after method
    const integration = new ApiGatewayIntegration(
      this,
      `${resourceName}-options-integration`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
        dependsOn: [optionsMethod],
      }
    );

    // 3. Create method response after method
    const methodResponse = new ApiGatewayMethodResponse(
      this,
      `${resourceName}-options-response`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: optionsMethod.httpMethod,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
        dependsOn: [optionsMethod],
      }
    );

    // 4. Create integration response after both integration and method response
    const integrationResponse = new ApiGatewayIntegrationResponse(
      this,
      `${resourceName}-options-integration-response`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: optionsMethod.httpMethod,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers':
            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          'method.response.header.Access-Control-Allow-Methods':
            "'GET,POST,PUT,DELETE,OPTIONS'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
        responseTemplates: {
          'application/json': '',
        },
        dependsOn: [integration, methodResponse],
      }
    );

    // Add all resources to dependencies
    this.allDependencies.push(
      optionsMethod,
      integration,
      methodResponse,
      integrationResponse
    );

    return {
      method: optionsMethod,
      integration,
      methodResponse,
      integrationResponse,
    };
  }

  public createLambdaIntegration(
    resource: ApiGatewayResource,
    httpMethod: string,
    lambda: LambdaFunction,
    resourceName: string
  ): ApiMethodDependencies {
    // 1. Create method first
    const method = new ApiGatewayMethod(
      this,
      `${resourceName}-${httpMethod}-method`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod,
        authorization: 'NONE',
      }
    );

    // 2. Create integration after method
    const integration = new ApiGatewayIntegration(
      this,
      `${resourceName}-${httpMethod}-integration`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambda.invokeArn,
        dependsOn: [method],
      }
    );

    // Add Lambda permission
    new LambdaPermission(this, `${resourceName}-${httpMethod}-permission`, {
      statementId: `AllowAPIGatewayInvoke-${resourceName}-${httpMethod}`,
      action: 'lambda:InvokeFunction',
      functionName: lambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.api.executionArn}/*/*`,
    });

    // Add to dependencies
    this.allDependencies.push(method, integration);

    return {
      method,
      integration,
    };
  }

  public getDeploymentDependencies(): any[] {
    return this.allDependencies;
  }
}

// Lambda handler code templates
export const productsHandlerCode = `
async function getParameterValue(parameterName) {
  const params = { Name: parameterName };
  const result = await ssm.getParameter(params).promise();
  return result.Parameter.Value;
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const tableName = await getParameterValue(process.env.PRODUCTS_TABLE_PARAM);
    
    if (event.httpMethod === 'GET' && event.path === '/products') {
      // List all products
      const params = { TableName: tableName };
      const result = await dynamodb.scan(params).promise();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ products: result.Items }),
      };
    } else if (event.httpMethod === 'GET' && event.pathParameters && event.pathParameters.id) {
      // Get product by ID
      const params = {
        TableName: tableName,
        Key: { productId: event.pathParameters.id },
      };
      const result = await dynamodb.get(params).promise();
      
      if (!result.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Product not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Item),
      };
    }
    
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid request' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
`;

export const ordersHandlerCode = `
async function getParameterValue(parameterName) {
  const params = { Name: parameterName };
  const result = await ssm.getParameter(params).promise();
  return result.Parameter.Value;
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const tableName = await getParameterValue(process.env.ORDERS_TABLE_PARAM);
    
    if (event.httpMethod === 'POST' && event.path === '/orders') {
      // Create new order
      const body = JSON.parse(event.body);
      const orderId = 'ORD-' + Date.now();
      
      const params = {
        TableName: tableName,
        Item: {
          orderId,
          customerId: body.customerId,
          items: body.items,
          total: body.total,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      };
      
      await dynamodb.put(params).promise();
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ orderId, message: 'Order created successfully' }),
      };
    } else if (event.httpMethod === 'GET' && event.pathParameters && event.pathParameters.id) {
      // Get order by ID
      const params = {
        TableName: tableName,
        Key: { orderId: event.pathParameters.id },
      };
      const result = await dynamodb.get(params).promise();
      
      if (!result.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Order not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Item),
      };
    }
    
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid request' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
`;
