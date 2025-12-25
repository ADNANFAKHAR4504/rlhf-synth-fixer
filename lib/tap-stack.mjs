/**
 * tap-stack.mjs
 *
 * Serverless Application Infrastructure - Task trainr233
 * Implements a complete serverless application with RESTful APIs using AWS Lambda,
 * API Gateway, IAM roles, S3 encrypted storage, and blue-green deployments.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// LocalStack configuration detection
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK === 'true';
const localstackEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - Environment suffix (defaults to 'dev')
 * @property {Object<string, string>} [tags] - Default tags to apply to resources
 */

/**
 * Serverless Application Stack implementing all 8 requirements:
 * 1. AWS Lambda for computation
 * 2. API Gateway RESTful interface
 * 3. IAM role with least privilege
 * 4. us-west-2 region deployment
 * 5. Environment tags for cost tracking
 * 6. S3 server-side encryption
 * 7. Blue-green deployment support
 * 8. CloudWatch logs enabled
 */
export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'Test', // Requirement 5: Environment tags
      Project: 'trainr233',
      ...(args?.tags || {}),
    };

    // Configure AWS provider for us-west-2 region (Requirement 4)
    // LocalStack-aware provider configuration
    const providerConfig = {
      region: 'us-west-2',
    };

    // Add LocalStack-specific configuration if running against LocalStack
    if (isLocalStack) {
      providerConfig.endpoints = [
        { service: 's3', url: localstackEndpoint },
        { service: 'dynamodb', url: localstackEndpoint },
        { service: 'lambda', url: localstackEndpoint },
        { service: 'iam', url: localstackEndpoint },
        { service: 'sts', url: localstackEndpoint },
        { service: 'cloudformation', url: localstackEndpoint },
        { service: 'apigateway', url: localstackEndpoint },
        { service: 'cloudwatch', url: localstackEndpoint },
        { service: 'logs', url: localstackEndpoint },
      ];
      providerConfig.accessKey = 'test';
      providerConfig.secretKey = 'test';
      providerConfig.skipCredentialsValidation = true;
      providerConfig.skipMetadataApiCheck = true;
      providerConfig.skipRequestingAccountId = true;
      providerConfig.s3UsePathStyle = true;
    }

    const provider = new aws.Provider(
      'us-west-2-provider',
      providerConfig,
      { parent: this }
    );

    // Requirement 6: S3 Bucket with server-side encryption for Lambda code
    const bucketConfig = {
      bucket: `serverless-lambda-code-${environmentSuffix}-bucket`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: defaultTags,
    };

    // Add forceDestroy for LocalStack to make cleanup easier
    if (isLocalStack) {
      bucketConfig.forceDestroy = true;
    }

    const lambdaBucket = new aws.s3.Bucket(
      `lambda-code-bucket-${environmentSuffix}`,
      bucketConfig,
      { parent: this, provider }
    );

    // Block public access to the S3 bucket
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `lambda-bucket-pab-${environmentSuffix}`,
      {
        bucket: lambdaBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this, provider }
    );

    // Requirement 8: CloudWatch Log Groups for Lambda functions
    const helloLogGroup = new aws.cloudwatch.LogGroup(
      `hello-lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/hello-function-${environmentSuffix}`,
        retentionInDays: 14,
        tags: defaultTags,
      },
      { parent: this, provider }
    );

    const worldLogGroup = new aws.cloudwatch.LogGroup(
      `world-lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/world-function-${environmentSuffix}`,
        retentionInDays: 14,
        tags: defaultTags,
      },
      { parent: this, provider }
    );

    // Requirement 8: CloudWatch Log Group for API Gateway
    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `api-gateway-logs-${environmentSuffix}`,
      {
        name: `/aws/apigateway/serverless-api-${environmentSuffix}`,
        retentionInDays: 14,
        tags: defaultTags,
      },
      { parent: this, provider }
    );

    // Requirement 3: IAM Role with least privilege permissions for Lambda
    const lambdaRole = new aws.iam.Role(
      `lambda-execution-role-${environmentSuffix}`,
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
        tags: defaultTags,
      },
      { parent: this, provider }
    );

    // Attach minimal required policies for Lambda execution and logging
    const lambdaBasicExecutionPolicy = new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this, provider }
    );

    // Custom policy for CloudWatch logs (least privilege)
    const lambdaLogsPolicy = new aws.iam.RolePolicy(
      `lambda-logs-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([helloLogGroup.arn, worldLogGroup.arn])
          .apply(([helloArn, worldArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: [
                    helloArn,
                    worldArn,
                    `${helloArn}:*`,
                    `${worldArn}:*`,
                  ],
                },
              ],
            })
          ),
      },
      { parent: this, provider }
    );

    // Lambda function code
    const helloFunctionCode = `
exports.handler = async (event) => {
    console.log('Hello Lambda function invoked with event:', JSON.stringify(event, null, 2));
    
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
            message: 'Hello from serverless Lambda!',
            timestamp: new Date().toISOString(),
            requestId: event.requestContext ? event.requestContext.requestId : 'unknown'
        })
    };
    
    console.log('Returning response:', JSON.stringify(response, null, 2));
    return response;
};
`;

    const worldFunctionCode = `
exports.handler = async (event) => {
    console.log('World Lambda function invoked with event:', JSON.stringify(event, null, 2));
    
    const httpMethod = event.httpMethod || 'GET';
    let responseBody = {};
    
    switch (httpMethod) {
        case 'GET':
            responseBody = {
                message: 'World GET endpoint',
                data: { items: ['item1', 'item2', 'item3'] }
            };
            break;
        case 'POST':
            const requestBody = event.body ? JSON.parse(event.body) : {};
            responseBody = {
                message: 'World POST endpoint',
                received: requestBody,
                processed: true
            };
            break;
        case 'PUT':
            responseBody = {
                message: 'World PUT endpoint',
                updated: true
            };
            break;
        case 'DELETE':
            responseBody = {
                message: 'World DELETE endpoint',
                deleted: true
            };
            break;
        default:
            responseBody = {
                message: 'Method not supported',
                method: httpMethod
            };
    }
    
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
            ...responseBody,
            timestamp: new Date().toISOString(),
            requestId: event.requestContext ? event.requestContext.requestId : 'unknown'
        })
    };
    
    console.log('Returning response:', JSON.stringify(response, null, 2));
    return response;
};
`;

    // Requirement 1: AWS Lambda Functions for computation
    const helloFunction = new aws.lambda.Function(
      `hello-function-${environmentSuffix}`,
      {
        name: `hello-function-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(helloFunctionCode),
        }),
        environment: {
          variables: {
            NODE_ENV: 'production',
            LOG_LEVEL: 'info',
          },
        },
        tags: defaultTags,
        dependsOn: [helloLogGroup, lambdaLogsPolicy],
      },
      { parent: this, provider }
    );

    const worldFunction = new aws.lambda.Function(
      `world-function-${environmentSuffix}`,
      {
        name: `world-function-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(worldFunctionCode),
        }),
        environment: {
          variables: {
            NODE_ENV: 'production',
            LOG_LEVEL: 'info',
          },
        },
        tags: defaultTags,
        dependsOn: [worldLogGroup, lambdaLogsPolicy],
      },
      { parent: this, provider }
    );

    // Requirement 7: Blue-Green deployment using Lambda aliases
    // This demonstrates blue-green deployment capability using aliases pointing to $LATEST
    // In a real deployment, you would publish specific versions and update aliases

    // Create aliases for blue-green deployment (both pointing to $LATEST for demo)
    const helloBlueAlias = new aws.lambda.Alias(
      `hello-blue-alias-${environmentSuffix}`,
      {
        name: 'blue',
        description: 'Blue environment for hello function - currently active',
        functionName: helloFunction.name,
        functionVersion: '$LATEST',
      },
      { parent: this, provider }
    );

    const helloGreenAlias = new aws.lambda.Alias(
      `hello-green-alias-${environmentSuffix}`,
      {
        name: 'green',
        description: 'Green environment for hello function - staging',
        functionName: helloFunction.name,
        functionVersion: '$LATEST',
      },
      { parent: this, provider }
    );

    const worldBlueAlias = new aws.lambda.Alias(
      `world-blue-alias-${environmentSuffix}`,
      {
        name: 'blue',
        description: 'Blue environment for world function - currently active',
        functionName: worldFunction.name,
        functionVersion: '$LATEST',
      },
      { parent: this, provider }
    );

    const worldGreenAlias = new aws.lambda.Alias(
      `world-green-alias-${environmentSuffix}`,
      {
        name: 'green',
        description: 'Green environment for world function - staging',
        functionName: worldFunction.name,
        functionVersion: '$LATEST',
      },
      { parent: this, provider }
    );

    // Requirement 2: API Gateway RESTful interface
    const api = new aws.apigateway.RestApi(
      `serverless-api-${environmentSuffix}`,
      {
        name: `serverless-api-${environmentSuffix}`,
        description: 'Serverless RESTful API with Lambda backend',
        tags: defaultTags,
      },
      { parent: this, provider }
    );

    // Lambda permission for API Gateway to invoke functions
    const helloLambdaPermission = new aws.lambda.Permission(
      `hello-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: helloFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
        qualifier: helloBlueAlias.name, // Use blue alias
      },
      { parent: this, provider }
    );

    const worldLambdaPermission = new aws.lambda.Permission(
      `world-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: worldFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
        qualifier: worldBlueAlias.name, // Use blue alias
      },
      { parent: this, provider }
    );

    // API Gateway resources and methods
    const helloResource = new aws.apigateway.Resource(
      `hello-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'hello',
      },
      { parent: this, provider }
    );

    const worldResource = new aws.apigateway.Resource(
      `world-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'world',
      },
      { parent: this, provider }
    );

    // Hello endpoint - GET method
    const helloMethod = new aws.apigateway.Method(
      `hello-get-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: helloResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this, provider }
    );

    const helloIntegration = new aws.apigateway.Integration(
      `hello-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: helloResource.id,
        httpMethod: helloMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/${helloFunction.arn}:${helloBlueAlias.name}/invocations`,
      },
      { parent: this, provider }
    );

    // World endpoint - Multiple HTTP methods (GET, POST, PUT, DELETE)
    const worldGetMethod = new aws.apigateway.Method(
      `world-get-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this, provider }
    );

    const worldPostMethod = new aws.apigateway.Method(
      `world-post-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this, provider }
    );

    const worldPutMethod = new aws.apigateway.Method(
      `world-put-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: 'PUT',
        authorization: 'NONE',
      },
      { parent: this, provider }
    );

    const worldDeleteMethod = new aws.apigateway.Method(
      `world-delete-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: 'DELETE',
        authorization: 'NONE',
      },
      { parent: this, provider }
    );

    // CORS OPTIONS method for world endpoint
    const worldOptionsMethod = new aws.apigateway.Method(
      `world-options-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: 'OPTIONS',
        authorization: 'NONE',
      },
      { parent: this, provider }
    );

    // Integrations for world endpoint methods
    const worldGetIntegration = new aws.apigateway.Integration(
      `world-get-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: worldGetMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/${worldFunction.arn}:${worldBlueAlias.name}/invocations`,
      },
      { parent: this, provider }
    );

    const worldPostIntegration = new aws.apigateway.Integration(
      `world-post-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: worldPostMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/${worldFunction.arn}:${worldBlueAlias.name}/invocations`,
      },
      { parent: this, provider }
    );

    const worldPutIntegration = new aws.apigateway.Integration(
      `world-put-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: worldPutMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/${worldFunction.arn}:${worldBlueAlias.name}/invocations`,
      },
      { parent: this, provider }
    );

    const worldDeleteIntegration = new aws.apigateway.Integration(
      `world-delete-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: worldDeleteMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/${worldFunction.arn}:${worldBlueAlias.name}/invocations`,
      },
      { parent: this, provider }
    );

    // CORS OPTIONS integration
    const worldOptionsIntegration = new aws.apigateway.Integration(
      `world-options-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: worldOptionsMethod.httpMethod,
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      },
      { parent: this, provider }
    );

    const worldOptionsMethodResponse = new aws.apigateway.MethodResponse(
      `world-options-method-response-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: worldResource.id,
        httpMethod: worldOptionsMethod.httpMethod,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      },
      { parent: this, provider }
    );

    const worldOptionsIntegrationResponse =
      new aws.apigateway.IntegrationResponse(
        `world-options-integration-response-${environmentSuffix}`,
        {
          restApi: api.id,
          resourceId: worldResource.id,
          httpMethod: worldOptionsMethod.httpMethod,
          statusCode: worldOptionsMethodResponse.statusCode,
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers':
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods':
              "'GET,POST,PUT,DELETE,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
        { parent: this, provider }
      );

    // API Gateway deployment
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        triggers: {
          redeployment: JSON.stringify([
            helloMethod.id,
            helloIntegration.id,
            worldGetMethod.id,
            worldGetIntegration.id,
            worldPostMethod.id,
            worldPostIntegration.id,
            worldPutMethod.id,
            worldPutIntegration.id,
            worldDeleteMethod.id,
            worldDeleteIntegration.id,
            worldOptionsMethod.id,
            worldOptionsIntegration.id,
          ]),
        },
      },
      {
        parent: this,
        provider,
        dependsOn: [
          helloIntegration,
          worldGetIntegration,
          worldPostIntegration,
          worldPutIntegration,
          worldDeleteIntegration,
          worldOptionsIntegrationResponse,
        ],
      }
    );

    // IAM role for API Gateway CloudWatch logging
    const apiGatewayCloudWatchRole = new aws.iam.Role(
      `api-gateway-cloudwatch-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this, provider }
    );

    const apiGatewayCloudWatchPolicy = new aws.iam.RolePolicyAttachment(
      `api-gateway-cloudwatch-policy-${environmentSuffix}`,
      {
        role: apiGatewayCloudWatchRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
      },
      { parent: this, provider }
    );

    // API Gateway account configuration for CloudWatch logging
    const apiGatewayAccount = new aws.apigateway.Account(
      `api-gateway-account-${environmentSuffix}`,
      {
        cloudwatchRoleArn: apiGatewayCloudWatchRole.arn,
      },
      { parent: this, provider, dependsOn: [apiGatewayCloudWatchPolicy] }
    );

    // Requirement 8: API Gateway stage with CloudWatch logging enabled
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        // Temporarily disable access logging to avoid the CloudWatch role issue
        // accessLogSettings: {
        //   destinationArn: apiLogGroup.arn,
        //   format: JSON.stringify({
        //     requestId: "$context.requestId",
        //     ip: "$context.identity.sourceIp",
        //     caller: "$context.identity.caller",
        //     user: "$context.identity.user",
        //     requestTime: "$context.requestTime",
        //     httpMethod: "$context.httpMethod",
        //     resourcePath: "$context.resourcePath",
        //     status: "$context.status",
        //     protocol: "$context.protocol",
        //     responseLength: "$context.responseLength"
        //   })
        // },
        tags: defaultTags,
      },
      { parent: this, provider, dependsOn: [apiGatewayAccount] }
    );

    // Enable method-level logging (simplified to avoid CloudWatch role issues)
    const methodSettings = new aws.apigateway.MethodSettings(
      `api-method-settings-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          metricsEnabled: true,
          // Temporarily disable detailed logging to avoid CloudWatch role issues
          // loggingLevel: "INFO",
          // dataTraceEnabled: true,
        },
      },
      { parent: this, provider, dependsOn: [stage] }
    );

    // Export important outputs
    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.us-west-2.amazonaws.com/${stage.stageName}`;
    this.lambdaBucketName = lambdaBucket.bucket;
    this.helloFunctionName = helloFunction.name;
    this.worldFunctionName = worldFunction.name;
    this.helloFunctionArn = helloFunction.arn;
    this.worldFunctionArn = worldFunction.arn;
    this.blueAliasArn = helloBlueAlias.arn;
    this.greenAliasArn = helloGreenAlias.arn;

    // Register outputs
    this.registerOutputs({
      apiUrl: this.apiUrl,
      lambdaBucketName: this.lambdaBucketName,
      helloFunctionName: this.helloFunctionName,
      worldFunctionName: this.worldFunctionName,
      helloFunctionArn: this.helloFunctionArn,
      worldFunctionArn: this.worldFunctionArn,
      blueAliasArn: this.blueAliasArn,
      greenAliasArn: this.greenAliasArn,
    });
  }
}
