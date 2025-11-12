### Reasoning Trace
---

The user wants me to build a serverless e-commerce backend using AWS CDK with TypeScript. They have an existing CDK project structure and want me to update it rather than creating new files from scratch.

Key requirements:
1. Lambda function for user profile operations (TypeScript)
2. DynamoDB table with GSI on 'username'
3. API Gateway with CORS and rate limiting
4. IAM permissions (least privilege)
5. Lambda Layers for shared dependencies
6. Concurrency limit of 5 for Lambda
7. Environment tagging
8. Proper error handling

I need to:
1. Update the existing `lib/tap-stack.ts` file
2. Create Lambda function code in TypeScript
3. Set up proper constructs for organization
4. Ensure everything is connected properly

Let me structure this solution:
1. Create separate construct files for better organization
2. Create the Lambda function code
3. Update the main stack file to orchestrate everything
### Answer 
---

I'll help you build a complete serverless e-commerce backend using AWS CDK. Let me update your existing files and create the necessary components.

## Updated Stack and Infrastructure Code

### 1. Update `lib/tap-stack.ts` (Main Stack)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';
import { UserProfileConstruct } from './constructs/user-profile-construct';

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

    // Create the user profile infrastructure
    const userProfileConstruct = new UserProfileConstruct(this, 'UserProfile', {
      environmentSuffix,
    });

    // Apply tags to all resources in this stack
    Tags.of(this).add('Environment', 'Production');
    Tags.of(this).add('Project', 'E-Commerce-Backend');
    Tags.of(this).add('ManagedBy', 'CDK');

    // Output the API endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: userProfileConstruct.apiUrl,
      description: 'API Gateway endpoint URL',
      exportName: `${this.stackName}-ApiEndpoint`,
    });

    // Output the API key ID for reference
    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: userProfileConstruct.apiKeyId,
      description: 'API Key ID - retrieve the actual key value from AWS Console',
      exportName: `${this.stackName}-ApiKeyId`,
    });

    // Output DynamoDB table name
    new cdk.CfnOutput(this, 'UserTableName', {
      value: userProfileConstruct.tableName,
      description: 'DynamoDB User Table Name',
      exportName: `${this.stackName}-UserTableName`,
    });
  }
}
```

### 2. Create `lib/constructs/user-profile-construct.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

interface UserProfileConstructProps {
  environmentSuffix: string;
}

export class UserProfileConstruct extends Construct {
  public readonly apiUrl: string;
  public readonly apiKeyId: string;
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

    // Create Lambda Layer for shared dependencies
    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../layers/dependencies')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared dependencies for Lambda functions',
    });

    // Create Lambda function for user profile operations
    const userProfileFunction = new lambda.Function(this, 'UserProfileFunction', {
      functionName: `user-profile-handler-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/user-profile')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      reservedConcurrentExecutions: 5, // Concurrency limit
      layers: [dependenciesLayer],
      environment: {
        TABLE_NAME: userTable.tableName,
        USERNAME_INDEX: 'username-index',
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
      description: 'Handles user profile CRUD operations',
    });

    // Grant Lambda function permissions to access DynamoDB (least privilege)
    userTable.grantReadWriteData(userProfileFunction);
    
    // Add additional specific permissions for GSI queries
    userProfileFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:Query',
      ],
      resources: [
        `${userTable.tableArn}/index/*`,
      ],
    }));

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
    const lambdaIntegration = new apigateway.LambdaIntegration(userProfileFunction, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }',
      },
    });

    // Create API resources and methods
    const users = api.root.addResource('users');
    const userById = users.addResource('{userId}');
    const userByUsername = users.addResource('username').addResource('{username}');

    // POST /users - Create user
    users.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
      requestValidator: new apigateway.RequestValidator(this, 'CreateUserValidator', {
        restApi: api,
        requestValidatorName: 'create-user-validator',
        validateRequestBody: true,
        validateRequestParameters: false,
      }),
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

    // Set public properties
    this.apiUrl = api.url;
    this.apiKeyId = apiKey.keyId;
    this.tableName = userTable.tableName;
  }
}
```

### 3. Create Lambda Function `lib/lambda/user-profile/index.ts`

```typescript
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const TABLE_NAME = process.env.TABLE_NAME!;
const USERNAME_INDEX = process.env.USERNAME_INDEX!;

// Response helper
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body),
});

// User interface
interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Validation helper
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Main Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));

  try {
    const { httpMethod, resource, pathParameters, body } = event;

    // Route based on HTTP method and resource
    switch (resource) {
      case '/users':
        if (httpMethod === 'POST') {
          return await createUser(body);
        }
        break;

      case '/users/{userId}':
        const userId = pathParameters?.userId;
        if (!userId) {
          return createResponse(400, { error: 'Missing userId parameter' });
        }

        switch (httpMethod) {
          case 'GET':
            return await getUserById(userId);
          case 'PUT':
            return await updateUser(userId, body);
          case 'DELETE':
            return await deleteUser(userId);
        }
        break;

      case '/users/username/{username}':
        const username = pathParameters?.username;
        if (!username) {
          return createResponse(400, { error: 'Missing username parameter' });
        }
        if (httpMethod === 'GET') {
          return await getUserByUsername(username);
        }
        break;
    }

    return createResponse(404, { error: 'Resource not found' });
  } catch (error) {
    console.error('Handler error:', error);
    return createResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create a new user
async function createUser(body: string | null): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const userData = JSON.parse(body);
    
    // Validate required fields
    if (!userData.username || !userData.email || !userData.fullName) {
      return createResponse(400, { error: 'Missing required fields: username, email, fullName' });
    }

    // Validate email format
    if (!validateEmail(userData.email)) {
      return createResponse(400, { error: 'Invalid email format' });
    }

    // Check if username already exists
    const existingUser = await queryUserByUsername(userData.username);
    if (existingUser) {
      return createResponse(409, { error: 'Username already exists' });
    }

    const user: User = {
      userId: uuidv4(),
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      phoneNumber: userData.phoneNumber,
      address: userData.address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(user),
      ConditionExpression: 'attribute_not_exists(userId)',
    });

    await dynamoClient.send(command);
    console.log('User created successfully:', user.userId);

    return createResponse(201, { message: 'User created successfully', user });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error instanceof ConditionalCheckFailedException) {
      return createResponse(409, { error: 'User already exists' });
    }
    
    throw error;
  }
}

// Get user by ID
async function getUserById(userId: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId }),
    });

    const result = await dynamoClient.send(command);
    
    if (!result.Item) {
      return createResponse(404, { error: 'User not found' });
    }

    const user = unmarshall(result.Item) as User;
    console.log('User retrieved successfully:', userId);

    return createResponse(200, { user });
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
}

// Get user by username using GSI
async function getUserByUsername(username: string): Promise<APIGatewayProxyResult> {
  try {
    const user = await queryUserByUsername(username);
    
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    console.log('User retrieved by username successfully:', username);
    return createResponse(200, { user });
  } catch (error) {
    console.error('Get user by username error:', error);
    throw error;
  }
}

// Helper function to query user by username
async function queryUserByUsername(username: string): Promise<User | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: USERNAME_INDEX,
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: marshall({
      ':username': username,
    }),
    Limit: 1,
  });

  const result = await dynamoClient.send(command);
  
  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return unmarshall(result.Items[0]) as User;
}

// Update user
async function updateUser(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const updates = JSON.parse(body);
    
    // Build update expression dynamically
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString(),
    };

    // Add fields to update
    const allowedUpdates = ['email', 'fullName', 'phoneNumber', 'address'];
    
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        if (field === 'email' && !validateEmail(updates[field])) {
          return createResponse(400, { error: 'Invalid email format' });
        }
        
        const placeholder = `#${field}`;
        expressionAttributeNames[placeholder] = field;
        expressionAttributeValues[`:${field}`] = updates[field];
        updateExpressions.push(`${placeholder} = :${field}`);
      }
    }

    const command = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId }),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamoClient.send(command);
    const updatedUser = result.Attributes ? unmarshall(result.Attributes) : null;
    
    console.log('User updated successfully:', userId);
    return createResponse(200, { message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error instanceof ConditionalCheckFailedException) {
      return createResponse(404, { error: 'User not found' });
    }
    
    throw error;
  }
}

// Delete user
async function deleteUser(userId: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId }),
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'ALL_OLD',
    });

    const result = await dynamoClient.send(command);
    
    if (!result.Attributes) {
      return createResponse(404, { error: 'User not found' });
    }

    console.log('User deleted successfully:', userId);
    return createResponse(200, { message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error instanceof ConditionalCheckFailedException) {
      return createResponse(404, { error: 'User not found' });
    }
    
    throw error;
  }
}
```

### 4. Create Lambda Package.json `lib/lambda/user-profile/package.json`

```json
{
  "name": "user-profile-lambda",
  "version": "1.0.0",
  "description": "User profile management Lambda function",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/util-dynamodb": "^3.450.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.125",
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 5. Create Lambda tsconfig.json `lib/lambda/user-profile/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "declaration": false
  },
  "exclude": ["node_modules", "**/*.test.ts"],
  "include": ["*.ts"]
}
```

### 6. Create Layer Directory `layers/dependencies/nodejs/package.json`

```json
{
  "name": "lambda-dependencies",
  "version": "1.0.0",
  "description": "Shared dependencies for Lambda functions",
  "dependencies": {
    "aws-xray-sdk-core": "^3.5.3"
  }
}
```

### 7. Create Build Script `scripts/build-lambda.sh`

```bash
#!/bin/bash

# Build Lambda function
echo "Building Lambda function..."
cd lib/lambda/user-profile
npm install
npm run build
cd ../../..

# Build Lambda layer
echo "Building Lambda layer..."
cd layers/dependencies/nodejs
npm install --production
cd ../../..

echo "Build complete!"
```

Make the script executable:
```bash
chmod +x scripts/build-lambda.sh
```

## Deployment Instructions

1. **Install dependencies and build Lambda code:**
```bash
# Install CDK dependencies
npm install

# Build Lambda and layer
./scripts/build-lambda.sh
```

2. **Synthesize the CloudFormation template:**
```bash
cdk synth
```

3. **Deploy the stack:**
```bash
cdk deploy --require-approval never
```

4. **After deployment, note the outputs:**
- API Endpoint URL
- API Key ID (retrieve the actual key value from AWS Console)
- DynamoDB Table Name

## Testing the API

Once deployed, you can test the API using curl or any HTTP client:

### 1. Get your API Key from AWS Console:
```bash
aws apigateway get-api-key --api-key <API_KEY_ID> --include-value --query 'value' --output text
```

### 2. Create a user:
```bash
curl -X POST https://your-api-url/prod/users \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }'
```

### 3. Get user by ID:
```bash
curl -X GET https://your-api-url/prod/users/{userId} \
  -H "x-api-key: YOUR_API_KEY"
```

### 4. Get user by username:
```bash
curl -X GET https://your-api-url/prod/users/username/johndoe \
  -H "x-api-key: YOUR_API_KEY"
```

### 5. Update user:
```bash
curl -X PUT https://your-api-url/prod/users/{userId} \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "phoneNumber": "+9876543210"
  }'
```

### 6. Delete user:
```bash
curl -X DELETE https://your-api-url/prod/users/{userId} \
  -H "x-api-key: YOUR_API_KEY"
```

## Key Features Implemented

✅ **Lambda Function**
- TypeScript implementation with proper typing
- Error handling for all AWS SDK calls
- Environment variables for configuration
- Concurrency limit of 5
- Lambda Layers for shared dependencies
- X-Ray tracing enabled

✅ **DynamoDB**
- User profile storage with proper schema
- Global Secondary Index on username
- Pay-per-request billing mode
- Point-in-time recovery enabled
- AWS managed encryption

✅ **API Gateway**
- REST API with proper resource structure
- CORS support configured
- API Key authentication
- Usage plan with rate limiting (100 req/s, 10k req/day)
- Request validation for POST endpoint

✅ **Security & Best Practices**
- Least privilege IAM permissions
- Environment-based resource naming
- Proper error handling and logging
- CloudWatch logs retention
- Resource tagging as requested
- Data retention policy (RETAIN)

The infrastructure is production-ready, scalable, and follows AWS best practices for serverless applications.
