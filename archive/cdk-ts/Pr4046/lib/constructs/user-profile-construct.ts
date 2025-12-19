import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as path from 'path';

interface UserProfileConstructProps {
  environmentSuffix: string;
}

export class UserProfileConstruct extends Construct {
  public readonly apiUrl: string;
  public readonly apiKeyId: string;
  public readonly apiKeyValue: string;
  public readonly tableName: string;

  constructor(scope: Construct, id: string, props: UserProfileConstructProps) {
    super(scope, id);

    // Create DynamoDB table for user profiles
    const userTable = new dynamodb.Table(this, 'UserTable', {
      tableName: `user-profiles-${props.environmentSuffix}`,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Retain data on stack deletion
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add Global Secondary Index on username
    userTable.addGlobalSecondaryIndex({
      indexName: 'username-index',
      partitionKey: {
        name: 'username',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create Lambda function for user profile operations
    const userProfileFunction = new nodejs.NodejsFunction(
      this,
      'UserProfileFunction',
      {
        functionName: `user-profile-handler-${props.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, '../lambda/user-profile/index.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        // Note: reservedConcurrentExecutions removed due to account limits
        bundling: {
          externalModules: [],
          minify: false,
          sourceMap: true,
        },
        environment: {
          TABLE_NAME: userTable.tableName,
          USERNAME_INDEX: 'username-index',
          NODE_ENV: 'production',
          LOG_LEVEL: 'INFO',
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        tracing: lambda.Tracing.ACTIVE,
        description: 'Handles user profile CRUD operations',
      }
    );

    // Grant Lambda function permissions to access DynamoDB (least privilege)
    userTable.grantReadWriteData(userProfileFunction);

    // Add additional specific permissions for GSI queries
    userProfileFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:Query'],
        resources: [`${userTable.tableArn}/index/*`],
      })
    );

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'UserProfileApi', {
      restApiName: `user-profile-api-${props.environmentSuffix}`,
      description: 'User Profile Management API',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
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
      },
    });

    // Create API Key
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `user-profile-api-key-${props.environmentSuffix}`,
      description: 'API Key for User Profile API',
    });

    // Create Usage Plan with rate limiting
    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `user-profile-usage-plan-${props.environmentSuffix}`,
      description: 'Usage plan for User Profile API',
      throttle: {
        rateLimit: 100, // requests per second
        burstLimit: 200, // burst capacity
      },
      quota: {
        limit: 10000, // requests per day
        period: apigateway.Period.DAY,
      },
    });

    // Add API stage to usage plan
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Associate API key with usage plan
    usagePlan.addApiKey(apiKey);

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      userProfileFunction,
      {
        requestTemplates: {
          'application/json': '{ "statusCode": "200" }',
        },
      }
    );

    // Create API resources and methods
    const users = api.root.addResource('users');
    const userById = users.addResource('{userId}');
    const userByUsername = users
      .addResource('username')
      .addResource('{username}');

    // POST /users - Create user
    users.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
      requestValidator: new apigateway.RequestValidator(
        this,
        'CreateUserValidator',
        {
          restApi: api,
          requestValidatorName: 'create-user-validator',
          validateRequestBody: true,
          validateRequestParameters: false,
        }
      ),
      requestModels: {
        'application/json': new apigateway.Model(this, 'CreateUserModel', {
          restApi: api,
          contentType: 'application/json',
          modelName: 'CreateUserModel',
          schema: {
            schema: apigateway.JsonSchemaVersion.DRAFT4,
            title: 'createUser',
            type: apigateway.JsonSchemaType.OBJECT,
            required: ['username', 'email', 'fullName'],
            properties: {
              username: { type: apigateway.JsonSchemaType.STRING },
              email: { type: apigateway.JsonSchemaType.STRING },
              fullName: { type: apigateway.JsonSchemaType.STRING },
              phoneNumber: { type: apigateway.JsonSchemaType.STRING },
              address: { type: apigateway.JsonSchemaType.OBJECT },
            },
          },
        }),
      },
    });

    // GET /users/{userId} - Get user by ID
    userById.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
    });

    // PUT /users/{userId} - Update user
    userById.addMethod('PUT', lambdaIntegration, {
      apiKeyRequired: true,
    });

    // DELETE /users/{userId} - Delete user
    userById.addMethod('DELETE', lambdaIntegration, {
      apiKeyRequired: true,
    });

    // GET /users/username/{username} - Get user by username
    userByUsername.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
    });

    // Create custom resource to fetch API key value
    const getApiKeyValue = new cr.AwsCustomResource(this, 'GetApiKeyValue', {
      onCreate: {
        service: 'APIGateway',
        action: 'getApiKey',
        parameters: {
          apiKey: apiKey.keyId,
          includeValue: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of(apiKey.keyId),
      },
      onUpdate: {
        service: 'APIGateway',
        action: 'getApiKey',
        parameters: {
          apiKey: apiKey.keyId,
          includeValue: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of(apiKey.keyId),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['apigateway:GET'],
          resources: [apiKey.keyArn],
        }),
      ]),
    });

    // Set public properties
    this.apiUrl = api.url;
    this.apiKeyId = apiKey.keyId;
    this.apiKeyValue = getApiKeyValue.getResponseField('value');
    this.tableName = userTable.tableName;
  }
}
