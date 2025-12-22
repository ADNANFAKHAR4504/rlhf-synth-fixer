```typescript
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';

export interface TapStackProps {
  environment: string;
  owner: string;
  costCenter: string;
  compliance: string;
}

export class TapStack extends Construct {
  public readonly lambdaFunction: lambda.Function;
  public readonly apiGateway: apigateway.RestApi;
  public readonly s3Bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    // Common tags for all resources
    const commonTags = {
      Environment: props.environment,
      Owner: props.owner,
      CostCenter: props.costCenter,
      Compliance: props.compliance,
      Project: 'TapStack'
    };

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'ServerlessKMSKey', {
      description: `${props.environment}-serverless-encryption-key`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // S3 Bucket with security best practices
    this.s3Bucket = new s3.Bucket(this, 'ServerlessBucket', {
      bucketName: `${props.environment}-serverless-data-bucket-${Date.now()}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: Duration.days(30),
          enabled: true
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30)
            }
          ],
          enabled: true
        }
      ],
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: RemovalPolicy.DESTROY
    });

    // Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${props.environment}-lambda-execution-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject'
              ],
              resources: [this.s3Bucket.arnForObjects('*')]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [this.s3Bucket.bucketArn]
            })
          ]
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:GenerateDataKey'
              ],
              resources: [kmsKey.keyArn]
            })
          ]
        })
      }
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${props.environment}-serverless-function`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // Lambda Function with security and monitoring
    this.lambdaFunction = new lambda.Function(this, 'ServerlessFunction', {
      functionName: `${props.environment}-serverless-function`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          try {
            // Example S3 operation
            const params = {
              Bucket: process.env.BUCKET_NAME,
              Key: 'test-file.txt',
              Body: JSON.stringify({ timestamp: new Date().toISOString(), data: event })
            };
            
            await s3.putObject(params).promise();
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Success',
                timestamp: new Date().toISOString()
              })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Internal Server Error',
                error: error.message
              })
            };
          }
        };
      `),
      role: lambdaRole,
      environment: {
        BUCKET_NAME: this.s3Bucket.bucketName,
        ENVIRONMENT: props.environment
      },
      timeout: Duration.seconds(30),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: lambdaLogGroup,
      deadLetterQueueEnabled: true,
      reservedConcurrentExecutions: 10
    });

    // CloudWatch Alarms for Lambda
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${props.environment}-lambda-error-alarm`,
      metric: this.lambdaFunction.metricErrors({
        period: Duration.minutes(5)
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `${props.environment}-lambda-duration-alarm`,
      metric: this.lambdaFunction.metricDuration({
        period: Duration.minutes(5)
      }),
      threshold: 25000, // 25 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // Cognito User Pool for API authentication
    const userPool = new cognito.UserPool(this, 'ApiUserPool', {
      userPoolName: `${props.environment}-api-user-pool`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'ApiUserPoolClient', {
      userPool,
      userPoolClientName: `${props.environment}-api-client`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true
      }
    });

    // API Gateway with security features
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${props.environment}-serverless-api`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY
    });

    this.apiGateway = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `${props.environment}-serverless-api`,
      description: 'Serverless API with security best practices',
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true
        }),
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:SecureTransport': 'true'
              }
            }
          })
        ]
      }),
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      }
    });

    // Cognito Authorizer
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: `${props.environment}-cognito-authorizer`
    });

    // API Key for additional security layer
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${props.environment}-api-key`,
      description: 'API Key for serverless API'
    });

    // Usage Plan with throttling
    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${props.environment}-usage-plan`,
      description: 'Usage plan for serverless API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH
      },
      apiStages: [
        {
          api: this.apiGateway,
          stage: this.apiGateway.deploymentStage
        }
      ]
    });

    usagePlan.addApiKey(apiKey);

    // Lambda integration with proper error handling
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
      proxy: true,
      allowTestInvoke: false,
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          }
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          }
        }
      ]
    });

    // API Gateway resource and method with authentication
    const dataResource = this.apiGateway.root.addResource('data');
    dataResource.addMethod('GET', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        }
      ]
    });

    dataResource.addMethod('POST', lambdaIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      apiKeyRequired: true
    });

    // CORS preflight
    dataResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
    });

    // WAF Web ACL for API Gateway protection
    const webAcl = new wafv2.CfnWebACL(this, 'ApiGatewayWebAcl', {
      name: `${props.environment}-api-gateway-waf`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP'
            }
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule'
          }
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric'
          }
        }
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${props.environment}ApiGatewayWebAcl`
      }
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: this.apiGateway.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn
    });

    // Grant Lambda permission to be invoked by API Gateway only
    this.lambdaFunction.addPermission('ApiGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: this.apiGateway.arnForExecuteApi('*', '*', '*')
    });

    // Apply tags to all resources
    Object.entries(commonTags).forEach(([key, value]) => {
      this.node.applyAspect({
        visit: (node) => {
          if (node.node.defaultChild) {
            const resource = node.node.defaultChild as any;
            if (resource.addPropertyOverride) {
              resource.addPropertyOverride('Tags', [
                ...(resource.tags || []),
                { Key: key, Value: value }
              ]);
            }
          }
        }
      });
    });
  }
}
```