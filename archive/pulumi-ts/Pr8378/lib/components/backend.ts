// lib/components/backend.ts

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BackendInfrastructureArgs {
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  vpcEndpointSgId: pulumi.Output<string>;
  snsTopicArn: pulumi.Output<string>;
  tags: { [key: string]: string };
}

export class BackendInfrastructure extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;
  public readonly lambdaRole: aws.iam.Role;
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly apiGateway: aws.apigateway.RestApi;
  public readonly apiResource: aws.apigateway.Resource;
  public readonly apiResourceId: aws.apigateway.Resource;
  public readonly getMethod: aws.apigateway.Method;
  public readonly postMethod: aws.apigateway.Method;
  public readonly getItemMethod: aws.apigateway.Method;
  public readonly getIntegration: aws.apigateway.Integration;
  public readonly postIntegration: aws.apigateway.Integration;
  public readonly getItemIntegration: aws.apigateway.Integration;
  public readonly apiDeployment: aws.apigateway.Deployment;

  constructor(
    name: string,
    args: BackendInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:backend:Infrastructure', name, {}, opts);

    // DynamoDB Table
    this.table = new aws.dynamodb.Table(
      `${name}-table`,
      {
        name: `${name}-app-data`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Lambda IAM Role
    this.lambdaRole = new aws.iam.Role(
      `${name}-lambda-role`,
      {
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
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach VPC execution role policy
    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-vpc-policy`,
      {
        role: this.lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Lambda custom policy
    const lambdaPolicy = pulumi
      .all([this.table.arn, args.snsTopicArn])
      .apply(([tableArn, snsArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: 'sns:Publish',
              Resource: snsArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        })
      );

    new aws.iam.RolePolicy(
      `${name}-lambda-policy`,
      {
        role: this.lambdaRole.id,
        policy: lambdaPolicy,
      },
      { parent: this }
    );

    // Lambda Function
    const lambdaCode = this.getLambdaCode();

    this.lambdaFunction = new aws.lambda.Function(
      `${name}-function`,
      {
        name: `${name}-function`,
        runtime: 'nodejs18.x',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        handler: 'index.handler',
        role: this.lambdaRole.arn,
        timeout: 30,
        memorySize: 256,
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [args.vpcEndpointSgId],
        },
        environment: {
          variables: {
            TABLE_NAME: this.table.name,
            SNS_TOPIC_ARN: args.snsTopicArn,
          },
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // API Gateway REST API
    this.apiGateway = new aws.apigateway.RestApi(
      `${name}-api`,
      {
        name: `${name}-api`,
        description: 'Multi-tier web application API',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // API Gateway resource for /items
    this.apiResource = new aws.apigateway.Resource(
      `${name}-api-resource`,
      {
        restApi: this.apiGateway.id,
        parentId: this.apiGateway.rootResourceId,
        pathPart: 'items',
      },
      { parent: this }
    );

    // API Gateway resource for /items/{id}
    this.apiResourceId = new aws.apigateway.Resource(
      `${name}-api-resource-id`,
      {
        restApi: this.apiGateway.id,
        parentId: this.apiResource.id,
        pathPart: '{id}',
      },
      { parent: this }
    );

    // GET method for /items
    this.getMethod = new aws.apigateway.Method(
      `${name}-get-method`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // POST method for /items
    this.postMethod = new aws.apigateway.Method(
      `${name}-post-method`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // GET method for /items/{id}
    this.getItemMethod = new aws.apigateway.Method(
      `${name}-get-item-method`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResourceId.id,
        httpMethod: 'GET',
        authorization: 'NONE',
        requestParameters: {
          'method.request.path.id': true,
        },
      },
      { parent: this }
    );

    // Create Lambda integrations
    this.createLambdaIntegrations(name);

    // API Gateway deployment - Fixed: removed stageName and created separate stage
    this.apiDeployment = new aws.apigateway.Deployment(
      `${name}-api-deployment`,
      {
        restApi: this.apiGateway.id,
      },
      {
        parent: this,
        dependsOn: [
          this.getMethod,
          this.postMethod,
          this.getItemMethod,
          this.getIntegration,
          this.postIntegration,
          this.getItemIntegration,
        ],
      }
    );

    // Create a separate stage for the deployment
    new aws.apigateway.Stage(
      `${name}-api-stage`,
      {
        deployment: this.apiDeployment.id,
        restApi: this.apiGateway.id,
        stageName: 'v1',
      },
      { parent: this }
    );

    // Lambda permission for API Gateway
    new aws.lambda.Permission(
      `${name}-api-lambda-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: this.lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.apiGateway.executionArn}/*/*`,
      },
      { parent: this }
    );

    this.registerOutputs({
      tableName: this.table.name,
      lambdaFunctionName: this.lambdaFunction.name,
      apiGatewayUrl: pulumi.interpolate`https://${this.apiGateway.id}.execute-api.${aws.getRegion().then(r => r.name)}.amazonaws.com/v1`,
      apiGatewayId: this.apiGateway.id,
    });
  }

  private createLambdaIntegrations(name: string): void {
    // GET /items integration
    const getIntegration = new aws.apigateway.Integration(
      `${name}-get-integration`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResource.id,
        httpMethod: this.getMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: this.lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // POST /items integration
    const postIntegration = new aws.apigateway.Integration(
      `${name}-post-integration`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResource.id,
        httpMethod: this.postMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: this.lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // GET /items/{id} integration
    const getItemIntegration = new aws.apigateway.Integration(
      `${name}-get-item-integration`,
      {
        restApi: this.apiGateway.id,
        resourceId: this.apiResourceId.id,
        httpMethod: this.getItemMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: this.lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // Assign to readonly properties using Object.defineProperty
    Object.defineProperty(this, 'getIntegration', {
      value: getIntegration,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, 'postIntegration', {
      value: postIntegration,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, 'getItemIntegration', {
      value: getItemIntegration,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  private getLambdaCode(): string {
    return `
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const TABLE_NAME = process.env.TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event));
    
    try {
        const httpMethod = event.httpMethod;
        const path = event.path;
        
        if (httpMethod === 'GET' && path === '/items') {
            return await getAllItems();
        } else if (httpMethod === 'POST' && path === '/items') {
            return await createItem(event);
        } else if (httpMethod === 'GET' && path.includes('/items/')) {
            const itemId = event.pathParameters.id;
            return await getItem(itemId);
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Endpoint not found' })
            };
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        
        // Send error notification
        try {
            await sns.publish({
                TopicArn: SNS_TOPIC_ARN,
                Message: \`Lambda function error: \${error.message}\`,
                Subject: 'Backend API Error'
            }).promise();
        } catch (snsError) {
            console.error('Failed to send SNS notification:', snsError);
        }
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};

async function getAllItems() {
    try {
        const response = await dynamodb.scan({
            TableName: TABLE_NAME
        }).promise();
        
        const items = response.Items || [];
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                items: items,
                count: items.length
            })
        };
    } catch (error) {
        console.error('Error getting items:', error.message);
        throw error;
    }
}

async function createItem(event) {
    try {
        const body = JSON.parse(event.body);
        const itemId = uuidv4();
        const now = new Date().toISOString();
        
        const item = {
            id: itemId,
            name: body.name || '',
            description: body.description || '',
            created_at: now,
            updated_at: now
        };
        
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: item
        }).promise();
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(item)
        };
    } catch (error) {
        console.error('Error creating item:', error.message);
        throw error;
    }
}

async function getItem(itemId) {
    try {
        const response = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: { id: itemId }
        }).promise();
        
        if (response.Item) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(response.Item)
            };
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Item not found' })
            };
        }
    } catch (error) {
        console.error('Error getting item:', error.message);
        throw error;
    }
}
`;
  }
}
