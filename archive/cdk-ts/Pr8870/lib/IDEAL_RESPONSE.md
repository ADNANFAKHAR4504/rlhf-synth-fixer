# Secure Web Application Infrastructure - CDK TypeScript

I'll create a comprehensive secure web application infrastructure using CDK TypeScript with all the security best practices you've requested.

## File: lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: SecurityStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'SecurityKMSKey', {
      description: 'KMS Key for secure web application',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // S3 Bucket with security features
    const s3Bucket = new s3.Bucket(this, 'SecureS3Bucket', {
      bucketName: `secure-web-app-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // DynamoDB Table with on-demand capacity
    const dynamoTable = new dynamodb.Table(this, 'SecureDataTable', {
      tableName: `secure-data-table-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                dynamoTable.tableArn,
                `${dynamoTable.tableArn}/index/*`,
              ],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`${s3Bucket.bucketArn}/*`],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey',
                'kms:GenerateDataKeyWithoutPlaintext',
              ],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Lambda function for backend processing
    const backendFunction = new lambda.Function(this, 'BackendFunction', {
      functionName: `secure-backend-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const s3 = new AWS.S3();
        
        exports.handler = async (event) => {
          console.log('Request:', JSON.stringify(event));
          
          try {
            const method = event.httpMethod;
            const path = event.path;
            
            if (method === 'GET' && path === '/health') {
              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
              };
            }
            
            if (method === 'POST' && path === '/data') {
              const body = JSON.parse(event.body);
              const item = {
                id: Date.now().toString(),
                data: body.data,
                timestamp: new Date().toISOString(),
              };
              
              await dynamodb.put({
                TableName: process.env.TABLE_NAME,
                Item: item,
              }).promise();
              
              return {
                statusCode: 201,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ message: 'Data created successfully', id: item.id }),
              };
            }
            
            return {
              statusCode: 404,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ error: 'Not found' }),
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ error: 'Internal server error' }),
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        BUCKET_NAME: s3Bucket.bucketName,
        KMS_KEY_ID: kmsKey.keyId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/secure-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // API Gateway with security features
    const api = new apigateway.RestApi(this, 'SecureAPI', {
      restApiName: `secure-web-api-${environmentSuffix}`,
      description: 'Secure Web Application API',
      deployOptions: {
        stageName: 'prod',
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
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

    // API Key for authentication
    const apiKey = new apigateway.ApiKey(this, 'SecureApiKey', {
      apiKeyName: `secure-api-key-${environmentSuffix}`,
      description: 'API Key for secure web application',
    });

    // Usage Plan
    const usagePlan = new apigateway.UsagePlan(this, 'SecureUsagePlan', {
      name: `secure-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for secure API',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      api,
      stage: api.deploymentStage,
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      backendFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // API Resources and Methods
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
    });

    const dataResource = api.root.addResource('data');
    dataResource.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
    });

    // WAF Web ACL for API Gateway protection
    const webAcl = new wafv2.CfnWebACL(this, 'SecureWebACL', {
      name: `secure-web-acl-${environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'Web ACL for secure API Gateway',
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
        },
        {
          name: 'AWSManagedRulesAmazonIpReputationList',
          priority: 3,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'IpReputationListMetric',
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
        },
        {
          name: 'RateLimitRule',
          priority: 4,
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRuleMetric',
          },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SecureWebACLMetric',
      },
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`,
      webAclArn: webAcl.attrArn,
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureWebApp');
    cdk.Tags.of(this).add('Owner', 'DevSecOps');

    // Output important information
    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'APIKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';

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

    // Create the security stack with all secure web application components
    new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
      env: props?.env,
    });
  }
}
```

This infrastructure provides:

1. **API Gateway** with API key authentication, CloudWatch logging, CORS support, and comprehensive access logging
2. **Lambda functions** with least privilege IAM roles and proper error handling
3. **DynamoDB table** with on-demand capacity, customer-managed encryption, and point-in-time recovery
4. **S3 bucket** with versioning, KMS encryption, SSL enforcement, and lifecycle policies
5. **KMS keys** with key rotation enabled for encrypting sensitive data
6. **WAF protection** with multiple managed rule sets protecting against common web exploits, IP reputation filtering, and rate limiting
7. **Comprehensive security** including least privilege access, encryption at rest and in transit, and proper resource isolation
8. **Production tagging** for all resources with 'Environment: Production'
9. **Monitoring and logging** with CloudWatch integration and detailed access logs
10. **Latest AWS features** including modern CDK constructs and security best practices

The infrastructure follows AWS security best practices with defense in depth, encryption everywhere, and proper access controls.