# Serverless API Infrastructure with AWS CDK

Here's a production-ready serverless API implementation using AWS CDK with TypeScript that meets all your requirements:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // DynamoDB Table
    const dataTable = new dynamodb.Table(this, 'ServerlessDataTable', {
      tableName: `serverless-data-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Log Group for Lambda
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/serverless-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `serverless-api-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        DynamoDBPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [dataTable.tableArn],
            }),
          ],
        }),
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [logGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // VPC and Security Group for HTTPS-only traffic
    const vpc = new ec2.Vpc(this, 'ServerlessVpc', {
      vpcName: `serverless-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: vpc,
      securityGroupName: `serverless-lambda-sg-${environmentSuffix}`,
      description: 'Security group for Lambda function - HTTPS only',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic only'
    );

    // Add VPC endpoint for DynamoDB
    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Lambda Function
    const apiFunction = new lambda.Function(this, 'ServerlessApiFunction', {
      functionName: `serverless-api-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient, ScanCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const tableName = process.env.TABLE_NAME;
    
    try {
        const httpMethod = event.httpMethod;
        let body = {};
        
        // Parse body if present
        if (event.body) {
            try {
                body = JSON.parse(event.body);
            } catch (parseError) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        message: 'Bad Request', 
                        error: 'Invalid JSON in request body' 
                    })
                };
            }
        }
        
        let response;
        
        switch (httpMethod) {
            case 'GET':
                const scanResult = await dynamodb.send(new ScanCommand({ TableName: tableName }));
                response = {
                    Items: scanResult.Items ? scanResult.Items.map(item => unmarshall(item)) : [],
                    Count: scanResult.Count || 0
                };
                break;
            case 'POST':
                const item = {
                    id: Date.now().toString(),
                    ...body,
                    timestamp: new Date().toISOString()
                };
                await dynamodb.send(new PutItemCommand({
                    TableName: tableName,
                    Item: marshall(item)
                }));
                response = { message: 'Item created successfully', item };
                break;
            default:
                throw new Error(\`Unsupported method \${httpMethod}\`);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Internal server error', error: error.message })
        };
    }
};
      `),
      environment: {
        TABLE_NAME: dataTable.tableName,
      },
      role: lambdaRole,
      vpc: vpc,
      securityGroups: [securityGroup],
      logGroup: logGroup,
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `serverless-api-${environmentSuffix}`,
      description: 'Serverless API with X-Ray tracing',
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
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

    // API Key
    const apiKey = new apigateway.ApiKey(this, 'ServerlessApiKey', {
      apiKeyName: `serverless-api-key-${environmentSuffix}`,
      description: 'API Key for Serverless API',
    });

    // Usage Plan
    const usagePlan = new apigateway.UsagePlan(this, 'ServerlessUsagePlan', {
      name: `serverless-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for Serverless API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      api: api,
      stage: api.deploymentStage,
    });

    // API Integration
    const integration = new apigateway.LambdaIntegration(apiFunction, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }',
      },
    });

    // API Methods
    const dataResource = api.root.addResource('data');

    dataResource.addMethod('GET', integration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    dataResource.addMethod('POST', integration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Tags for all resources
    cdk.Tags.of(this).add('Project', 'ServerlessApp');
    cdk.Tags.of(dataTable).add('Project', 'ServerlessApp');
    cdk.Tags.of(apiFunction).add('Project', 'ServerlessApp');
    cdk.Tags.of(api).add('Project', 'ServerlessApp');
    cdk.Tags.of(logGroup).add('Project', 'ServerlessApp');
    cdk.Tags.of(vpc).add('Project', 'ServerlessApp');
    cdk.Tags.of(securityGroup).add('Project', 'ServerlessApp');

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: dataTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiFunction.functionName,
      description: 'Lambda function name',
    });
  }
}
```

## Key Improvements

This production-ready implementation includes:

### 1. **Modern Runtime and SDK**
- Uses Node.js 20.x runtime (latest LTS)
- Implements AWS SDK v3 for better performance and smaller bundle sizes
- Proper error handling for JSON parsing

### 2. **Security Best Practices**
- Least privilege IAM policies with specific actions and resources
- VPC isolation with private subnets
- Security group allowing only HTTPS traffic
- API key authentication for all endpoints
- CORS properly configured

### 3. **Infrastructure as Code Best Practices**
- Environment suffix for multi-environment deployments
- All resources have DESTROY removal policy for clean teardown
- Consistent naming conventions with environment suffix
- Comprehensive tagging for cost tracking

### 4. **Observability and Monitoring**
- X-Ray tracing enabled for Lambda and API Gateway
- CloudWatch Logs with 7-day retention
- Detailed logging in Lambda function
- API Gateway logging with INFO level

### 5. **Performance Optimizations**
- DynamoDB with PAY_PER_REQUEST billing mode
- VPC endpoint for DynamoDB to avoid internet gateway costs
- No NAT Gateway needed (using isolated subnets)
- Appropriate Lambda memory and timeout settings

### 6. **API Features**
- RESTful endpoints with GET and POST methods
- Rate limiting (100 req/s, burst 200)
- Monthly quota (10,000 requests)
- Proper error responses with appropriate status codes
- CORS support for browser-based clients

### 7. **Deployment Considerations**
- Stack outputs for easy integration
- No hardcoded values
- Clean separation of concerns
- Extensible architecture

This implementation is production-ready, secure, scalable, and follows AWS best practices for serverless architectures.