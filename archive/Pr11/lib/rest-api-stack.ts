import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ApiGatewayStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: { dynamoDBTable: dynamodb.Table; environmentSuffix?: string },
    cdkProps?: cdk.StackProps
  ) {
    super(scope, id, cdkProps);

    const environmentSuffix = props.environmentSuffix || 'dev';

    const api = new apigateway.RestApi(this, 'TurnAroundPromptApi', {
      restApiName: `Turn Around Prompt Service ${environmentSuffix}`,
      description:
        'This service provides CRUD operations for turn around prompts.',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      cloudWatchRole: true, // Enable CloudWatch logging
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY, // Remove the role when the stack is destroyed
    });

    const apiKey1 = api.addApiKey(`readOnlyApiKey${environmentSuffix}`, {
      apiKeyName: `readOnlyApiKey${environmentSuffix}`,
      value: 'readOnlyApiKeyValuexxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // In production, generate and store this securely
    });

    const apiKey2 = api.addApiKey(`adminApiKey${environmentSuffix}`, {
      apiKeyName: `adminApiKey${environmentSuffix}`,
      value: 'adminApiKeyValuexxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // In production, generate and store this securely
    });

    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `Easy${environmentSuffix}`,
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey1);
    usagePlan.addApiKey(apiKey2);

    const dynamoDBRole = new iam.Role(this, 'DynamoDBRole', {
      roleName: `TapApiGatewayDynamoDBRole${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    const dataModel = {
      id: {
        type: apigateway.JsonSchemaType.STRING,
        pattern: '^TAP-\\d+$',
        minLength: 5,
      },
      name: { type: apigateway.JsonSchemaType.STRING, minLength: 1 },
      status: { type: apigateway.JsonSchemaType.STRING, minLength: 1 },
      createdAt: { type: apigateway.JsonSchemaType.STRING },
      updatedAt: { type: apigateway.JsonSchemaType.STRING },
    };

    const defaultIntegrationResponses = [
      {
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({
            message: 'Success',
          }),
        },
      },
      {
        selectionPattern: '4\\d{2}', // Match any 4XX error
        statusCode: '400',
        responseTemplates: {
          'application/json': JSON.stringify({
            error: 'Bad Request',
            message: "$input.path('$.message')",
          }),
        },
      },
      {
        selectionPattern: '5\\d{2}',
        statusCode: '500',
        responseTemplates: {
          'application/json': JSON.stringify({
            error: 'Internal Server Error',
            message: '$context.error.message',
          }),
        },
      },
    ];

    const integrationHttpMethods = {
      GET: {
        dbOperation: 'GetItem',
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: props.dynamoDBTable.tableName,
            Key: {
              id: { S: "$input.params('id')" },
            },
            ConsistentRead: true,
          }),
        },
        requestModels: undefined,
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify({
                id: "$input.path('$.Item.id.S')",
                name: "$input.path('$.Item.name.S')",
                status: "$input.path('$.Item.status.S')",
                deleted: "$input.path('$.Item.deleted.BOOL')",
              }),
            },
          },
          {
            selectionPattern: '4\\d{2}', // Match any 4XX error
            statusCode: '400',
            responseTemplates: {
              'application/json': JSON.stringify({ error: 'Bad Request' }),
            },
          },
          {
            selectionPattern: '5\\d{2}',
            statusCode: '500',
            responseTemplates: {
              'application/json': JSON.stringify({
                error: 'Internal Server Error',
              }),
            },
          },
        ],
      },
      PUT: {
        dbOperation: 'PutItem',
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: props.dynamoDBTable.tableName,
            Item: {
              id: { S: "$input.path('$.id')" },
              name: { S: "$input.path('$.name')" },
              status: { S: "$input.path('$.status')" },
              createdAt: { S: '$context.requestTimeEpoch' },
              updatedAt: { S: '$context.requestTimeEpoch' },
            },
            ConditionExpression: 'attribute_not_exists(id)',
          }),
        },
        requestModels: {
          'application/json': api.addModel('TurnAroundPromptModelPut', {
            contentType: 'application/json',
            modelName: `TurnAroundPromptModelPut${environmentSuffix}`,
            schema: {
              type: apigateway.JsonSchemaType.OBJECT,
              properties: {
                id: dataModel.id,
                name: dataModel.name,
                status: dataModel.status,
              },
              required: ['id', 'name', 'status'],
            },
          }),
        },
        integrationResponses: defaultIntegrationResponses,
      },
      PATCH: {
        dbOperation: 'UpdateItem',
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: props.dynamoDBTable.tableName,
            Key: {
              id: { S: "$input.path('$.id')" },
            },
            UpdateExpression:
              'SET #nameField = :nameVal, #statusField = :statusVal, #updatedAtField = :updatedAtVal',
            ConditionExpression: '#deletedField <> :true',
            ExpressionAttributeNames: {
              '#nameField': 'name',
              '#statusField': 'status',
              '#updatedAtField': 'updatedAt',
              '#deletedField': 'deleted',
            },
            ExpressionAttributeValues: {
              ':nameVal': { S: "$input.path('$.name')" },
              ':statusVal': { S: "$input.path('$.status')" },
              ':updatedAtVal': { S: '$context.requestTimeEpoch' },
              ':true': { BOOL: true },
            },
          }),
        },
        requestModels: {
          'application/json': api.addModel('TurnAroundPromptModel', {
            contentType: 'application/json',
            modelName: `TurnAroundPromptModel${environmentSuffix}`,
            schema: {
              type: apigateway.JsonSchemaType.OBJECT,
              properties: {
                id: dataModel.id,
                name: dataModel.name,
                status: dataModel.status,
              },
              required: ['id', 'name', 'status'],
            },
          }),
        },
        integrationResponses: defaultIntegrationResponses,
      },
      DELETE: {
        dbOperation: 'UpdateItem',
        requestTemplates: {
          'application/json': JSON.stringify({
            TableName: props.dynamoDBTable.tableName,
            Key: {
              id: { S: "$input.path('$.id')" },
            },
            UpdateExpression: 'SET deleted = :true',
            ExpressionAttributeValues: {
              ':true': { BOOL: true },
            },
            ConditionExpression: 'attribute_exists(id) AND deleted <> :true',
          }),
        },
        requestModels: {
          'application/json': api.addModel('TurnAroundPromptModelDelete', {
            contentType: 'application/json',
            modelName: `TurnAroundPromptModelDelete${environmentSuffix}`,
            schema: {
              type: apigateway.JsonSchemaType.OBJECT,
              properties: {
                id: dataModel.id,
              },
              required: ['id'],
            },
          }),
        },
        integrationResponses: defaultIntegrationResponses,
      },
    };

    const resource = api.root.addResource('turnaroundprompt');

    type HttpMethod = keyof typeof integrationHttpMethods;
    Object.entries(integrationHttpMethods).forEach(
      ([method, options]: [
        string,
        (typeof integrationHttpMethods)[HttpMethod],
      ]) => {
        const integration = new apigateway.AwsIntegration({
          service: 'dynamodb',
          action: options.dbOperation,
          integrationHttpMethod: 'POST',
          options: {
            credentialsRole: dynamoDBRole,
            passthroughBehavior:
              apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
            requestParameters: {
              'integration.request.header.Content-Type': "'application/json'",
            },
            integrationResponses: options.integrationResponses,
            requestTemplates: options.requestTemplates,
          },
        });
        resource.addMethod(method, integration, {
          authorizationType: apigateway.AuthorizationType.NONE,
          apiKeyRequired: true,
          methodResponses: [
            { statusCode: '200' },
            { statusCode: '400' },
            { statusCode: '404' },
            { statusCode: '500' },
          ],
          requestValidator: new apigateway.RequestValidator(
            this,
            `${method}Validator`,
            {
              restApi: api,
              requestValidatorName: `${method}Validator${environmentSuffix}`,
              validateRequestBody: true,
              validateRequestParameters: false,
            }
          ),
          requestModels: options.requestModels,
        });
      }
    );

    // Add permissions to the DynamoDB table
    props.dynamoDBTable.grantReadWriteData(dynamoDBRole);

    // Output the API endpoint
    new cdk.CfnOutput(this, 'TurnAroundPromptApiEndpoint', {
      value: api.url,
      description:
        'API Gateway endpoint URL for the Turn Around Prompt service',
    });
  }
}
