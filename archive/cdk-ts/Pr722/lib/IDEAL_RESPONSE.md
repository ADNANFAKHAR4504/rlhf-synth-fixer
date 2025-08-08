I'll help you create a serverless infrastructure using AWS CDK with TypeScript for a RESTful API. Here's the complete, production-ready solution:

## bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDbStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';

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

    // Create DynamoDB stack
    const dynamoDbStack = new DynamoDbStack(
      this,
      `DynamoDbStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: {
          account: this.account,
          region: 'us-west-2',
        },
      }
    );

    // Create Lambda stack
    const lambdaStack = new LambdaStack(
      this,
      `LambdaStack-${environmentSuffix}`,
      {
        environmentSuffix,
        usersTable: dynamoDbStack.usersTable,
        env: {
          account: this.account,
          region: 'us-west-2',
        },
      }
    );

    // Lambda stack depends on DynamoDB stack
    lambdaStack.addDependency(dynamoDbStack);

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(
      this,
      `ApiGatewayStack-${environmentSuffix}`,
      {
        environmentSuffix,
        createUserFunction: lambdaStack.createUserFunction,
        getUserFunction: lambdaStack.getUserFunction,
        deleteUserFunction: lambdaStack.deleteUserFunction,
        env: {
          account: this.account,
          region: 'us-west-2',
        },
      }
    );

    // API Gateway stack depends on Lambda stack
    apiGatewayStack.addDependency(lambdaStack);

    // Add tags for resource management
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'UserManagementAPI');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```

## lib/dynamodb-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface DynamoDbStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DynamoDbStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDbStackProps) {
    super(scope, id, props);

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `Users-${props.environmentSuffix}`,
      partitionKey: {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.environmentSuffix === 'prod',
      },
    });

    // Apply resource-based policy for enhanced access control
    this.usersTable.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem',
        ],
        resources: [this.usersTable.tableArn],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': cdk.Stack.of(this).account,
          },
        },
      })
    );

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      exportName: `UsersTableName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'UsersTableArn', {
      value: this.usersTable.tableArn,
      exportName: `UsersTableArn-${props.environmentSuffix}`,
    });
  }
}
```

## lib/lambda-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
  usersTable: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
  public readonly createUserFunction: lambda.Function;
  public readonly getUserFunction: lambda.Function;
  public readonly deleteUserFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const commonEnvironment = {
      TABLE_NAME: props.usersTable.tableName,
      REGION: this.region,
    };

    // Create User Lambda
    this.createUserFunction = new lambda.Function(this, 'CreateUserFunction', {
      functionName: `CreateUser-${props.environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${props.usersTable.tableName}')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        user_id = str(uuid.uuid4())
        user_data = {
            'UserId': user_id,
            'Name': body.get('name', ''),
            'Email': body.get('email', ''),
            'CreatedAt': datetime.utcnow().isoformat()
        }
        
        table.put_item(Item=user_data)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'User created successfully',
                'userId': user_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Get User Lambda
    this.getUserFunction = new lambda.Function(this, 'GetUserFunction', {
      functionName: `GetUser-${props.environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${props.usersTable.tableName}')

def lambda_handler(event, context):
    try:
        user_id = event['pathParameters']['userId']
        
        response = table.get_item(
            Key={'UserId': user_id}
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'User not found'
                })
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response['Item'], default=str)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Delete User Lambda
    this.deleteUserFunction = new lambda.Function(this, 'DeleteUserFunction', {
      functionName: `DeleteUser-${props.environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${props.usersTable.tableName}')

def lambda_handler(event, context):
    try:
        user_id = event['pathParameters']['userId']
        
        # Check if user exists first
        response = table.get_item(
            Key={'UserId': user_id}
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'User not found'
                })
            }
        
        # Delete the user
        table.delete_item(
            Key={'UserId': user_id}
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'User deleted successfully'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Grant permissions to Lambda functions
    props.usersTable.grantReadWriteData(this.createUserFunction);
    props.usersTable.grantReadData(this.getUserFunction);
    props.usersTable.grantReadWriteData(this.deleteUserFunction);

    // Outputs
    new cdk.CfnOutput(this, 'CreateUserFunctionArn', {
      value: this.createUserFunction.functionArn,
      exportName: `CreateUserFunctionArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'GetUserFunctionArn', {
      value: this.getUserFunction.functionArn,
      exportName: `GetUserFunctionArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeleteUserFunctionArn', {
      value: this.deleteUserFunction.functionArn,
      exportName: `DeleteUserFunctionArn-${props.environmentSuffix}`,
    });
  }
}
```

## lib/api-gateway-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  environmentSuffix: string;
  createUserFunction: lambda.Function;
  getUserFunction: lambda.Function;
  deleteUserFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Create REST API
    this.api = new apigateway.RestApi(this, 'UserApi', {
      restApiName: `User-API-${props.environmentSuffix}`,
      description: `User management API for ${props.environmentSuffix} environment`,
      deployOptions: {
        stageName: props.environmentSuffix,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
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

    // Create users resource
    const usersResource = this.api.root.addResource('users');

    // POST /users - Create user
    usersResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.createUserFunction, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '201',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        methodResponses: [
          {
            statusCode: '201',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );

    // Create {userId} resource
    const userResource = usersResource.addResource('{userId}');

    // GET /users/{userId} - Get user
    userResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(props.getUserFunction, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );

    // DELETE /users/{userId} - Delete user
    userResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(props.deleteUserFunction, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      exportName: `ApiGatewayUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.api.restApiId,
      exportName: `ApiGatewayId-${props.environmentSuffix}`,
    });
  }
}
```

This solution provides:

1. **Stage-based deployment**: Uses environment suffix (dev/test/prod) to create separate, isolated stacks
2. **DynamoDB with best practices**: 
   - On-demand billing mode for cost efficiency
   - Resource-based policies for enhanced security
   - Point-in-time recovery for production environments
   - DESTROY removal policy for all environments to ensure clean teardown
3. **Lambda functions**: 
   - Python 3.8 runtime with inline code
   - Proper handler configuration (index.lambda_handler)
   - Comprehensive error handling
   - CORS headers in all responses
4. **API Gateway**: 
   - RESTful endpoints with proper HTTP methods
   - CORS configuration for cross-origin requests
   - Throttling and rate limiting
   - CloudWatch logging and metrics
5. **Security**: 
   - IAM roles and policies following least privilege principle
   - Resource-based policies for DynamoDB access
   - Proper Lambda permissions for API Gateway
6. **Region targeting**: All resources explicitly deployed to us-west-2
7. **Clean architecture**: Modular stack design with clear separation of concerns

Deploy different environments using:
- `cdk deploy --context environmentSuffix=dev`
- `cdk deploy --context environmentSuffix=test`  
- `cdk deploy --context environmentSuffix=prod`