import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.CDK_DEFAULT_ACCOUNT === '000000000000';

export interface TapStackProps extends cdk.StackProps {
  environment: string;
  owner: string;
  costCenter: string;
  compliance: string;
}

export class TapStack extends cdk.Stack {
  public readonly lambdaFunction: lambda.Function;
  public readonly apiGateway: apigateway.RestApi;
  public readonly s3Bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Common tags for all resources
    const commonTags = {
      Environment: props.environment,
      Owner: props.owner,
      CostCenter: props.costCenter,
      Compliance: props.compliance,
      Project: 'TapStack',
    };

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'TapKMSKey', {
      description: `${props.environment}-tap-encryption-key`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // S3 Bucket with security best practices
    this.s3Bucket = new s3.Bucket(this, 'TapBucket', {
      bucketName: `${props.environment}-tap-data-bucket`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: Duration.days(30),
          enabled: true,
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
          ],
          enabled: true,
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${props.environment}-lambda-execution-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [this.s3Bucket.arnForObjects('*')],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [this.s3Bucket.bucketArn],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${props.environment}-tap-function`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Lambda Function with security and monitoring
    this.lambdaFunction = new lambda.Function(this, 'TapFunction', {
      functionName: `${props.environment}-tap-function`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');

        // Configure S3 client for LocalStack compatibility
        const endpoint = process.env.AWS_ENDPOINT_URL || process.env.LOCALSTACK_HOSTNAME ? 'http://localhost:4566' : undefined;
        const s3Config = endpoint ? {
          endpoint: endpoint,
          s3ForcePathStyle: true,
          accessKeyId: 'test',
          secretAccessKey: 'test',
          region: process.env.AWS_REGION || 'us-east-1'
        } : {};

        const s3 = new AWS.S3(s3Config);

        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          console.log('Endpoint:', endpoint || 'AWS');

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
        ENVIRONMENT: props.environment,
      },
      timeout: Duration.seconds(30),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: lambdaLogGroup,
      deadLetterQueueEnabled: true,
    });

    // CloudWatch Alarms for Lambda
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${props.environment}-lambda-error-alarm`,
      metric: this.lambdaFunction.metricErrors({
        period: Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `${props.environment}-lambda-duration-alarm`,
      metric: this.lambdaFunction.metricDuration({
        period: Duration.minutes(5),
      }),
      threshold: 25000, // 25 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Cognito User Pool for API authentication
    const userPool = new cognito.UserPool(this, 'ApiUserPool', {
      userPoolName: `${props.environment}-api-user-pool`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create user pool client for API authentication
    new cognito.UserPoolClient(this, 'ApiUserPoolClient', {
      userPool,
      userPoolClientName: `${props.environment}-api-client`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // API Gateway with security features
    new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${props.environment}-tap-api`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.apiGateway = new apigateway.RestApi(this, 'TapApi', {
      restApiName: `${props.environment}-tap-api`,
      description: 'TAP API with security best practices',
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        tracingEnabled: true,
        metricsEnabled: true,
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
                'aws:SecureTransport': 'true',
              },
            },
          }),
        ],
      }),
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Cognito Authorizer (conditional for LocalStack compatibility)
    const cognitoAuthorizer = isLocalStack
      ? undefined
      : new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
          cognitoUserPools: [userPool],
          authorizerName: `${props.environment}-cognito-authorizer`,
        });

    // API Key for additional security layer
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${props.environment}-api-key`,
      description: 'API Key for TAP API',
    });

    // Usage Plan with throttling
    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${props.environment}-usage-plan`,
      description: 'Usage plan for TAP API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
      apiStages: [
        {
          api: this.apiGateway,
          stage: this.apiGateway.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey);

    // Lambda integration with proper error handling
    const lambdaIntegration = new apigateway.LambdaIntegration(
      this.lambdaFunction,
      {
        proxy: true,
        allowTestInvoke: false,
        integrationResponses: [
          {
            statusCode: '200',
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
      }
    );

    // Request validator for API Gateway
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: this.apiGateway,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Request model for POST method
    const requestModel = new apigateway.Model(this, 'RequestModel', {
      restApi: this.apiGateway,
      contentType: 'application/json',
      modelName: 'DataRequestModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          data: { type: apigateway.JsonSchemaType.STRING },
          metadata: { type: apigateway.JsonSchemaType.OBJECT },
        },
        required: ['data'],
      },
    });

    // API Gateway resource and method with authentication
    const dataResource = this.apiGateway.root.addResource('data');

    // Configure method options based on environment
    const getMethodOptions: apigateway.MethodOptions =
      !isLocalStack && cognitoAuthorizer
        ? {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            apiKeyRequired: true,
            methodResponses: [
              {
                statusCode: '200',
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
        : {
            apiKeyRequired: true,
            methodResponses: [
              {
                statusCode: '200',
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
          };

    const postMethodOptions: apigateway.MethodOptions =
      !isLocalStack && cognitoAuthorizer
        ? {
            authorizer: cognitoAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            apiKeyRequired: true,
            requestValidator: requestValidator,
            requestModels: {
              'application/json': requestModel,
            },
            methodResponses: [
              {
                statusCode: '200',
                responseParameters: {
                  'method.response.header.Access-Control-Allow-Origin': true,
                },
              },
              {
                statusCode: '400',
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
        : {
            apiKeyRequired: true,
            requestValidator: requestValidator,
            requestModels: {
              'application/json': requestModel,
            },
            methodResponses: [
              {
                statusCode: '200',
                responseParameters: {
                  'method.response.header.Access-Control-Allow-Origin': true,
                },
              },
              {
                statusCode: '400',
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
          };

    dataResource.addMethod('GET', lambdaIntegration, getMethodOptions);
    dataResource.addMethod('POST', lambdaIntegration, postMethodOptions);

    // CORS preflight
    dataResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
      ],
    });

    // WAF Web ACL for API Gateway protection (conditionally created for AWS only)
    // Note: WAF is not fully supported in LocalStack Community edition
    if (!isLocalStack) {
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
                aggregateKeyType: 'IP',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 2,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `${props.environment}ApiGatewayWebAcl`,
        },
      });

      // Associate WAF with API Gateway
      new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
        resourceArn: this.apiGateway.deploymentStage.stageArn,
        webAclArn: webAcl.attrArn,
      });
    }

    // Grant Lambda permission to be invoked by API Gateway only
    this.lambdaFunction.addPermission('ApiGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: this.apiGateway.arnForExecuteApi('*', '/*'),
    });

    // Apply tags to all resources
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
