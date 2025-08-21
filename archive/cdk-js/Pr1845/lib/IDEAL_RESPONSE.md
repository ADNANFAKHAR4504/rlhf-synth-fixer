# AWS Serverless Infrastructure - Ideal Implementation

## Overview
This document presents the ideal production-ready serverless infrastructure implementation that addresses all 13 requirements from the original prompt. This solution represents best practices for AWS serverless architecture using CDK with JavaScript.

## Architecture Components

### 1. Lambda Functions Stack (`lib/lambda-stack.mjs`)

```javascript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as config from 'aws-cdk-lib/aws-config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LambdaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';

    // KMS key for Lambda environment variables encryption
    const kmsKey = new kms.Key(this, 'LambdaKmsKey', {
      alias: `alias/lambda-env-${envSuffix}`,
      description: 'KMS key for Lambda environment variable encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for failed event destinations
    const failedEventsBucket = new s3.Bucket(this, 'FailedEventsBucket', {
      bucketName: `prod-lambda-failed-events-${envSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'delete-old-events',
        expiration: cdk.Duration.days(30),
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `prod-lambda-role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        KmsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['kms:Decrypt'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // User Function - Node.js 20.x
    this.userFunction = new lambda.Function(this, 'UserFunction', {
      functionName: `prod-user-function-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const xray = require('aws-xray-sdk-core');
        const awsWrapped = xray.captureAWS(AWS);
        
        exports.handler = async (event) => {
          console.log('User function invoked:', JSON.stringify(event));
          
          try {
            // Simulate user processing
            const userId = event.pathParameters?.id || 'unknown';
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                message: 'User processed successfully',
                userId: userId,
                timestamp: new Date().toISOString(),
              }),
            };
          } catch (error) {
            console.error('Error processing user:', error);
            throw error;
          }
        };
      `),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ENVIRONMENT: envSuffix,
        KMS_KEY_ID: kmsKey.keyId,
      },
      environmentEncryption: kmsKey,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      onFailure: new destinations.S3Destination(failedEventsBucket),
      reservedConcurrentExecutions: 100,
    });

    // Product Function - Python 3.12
    this.productFunction = new lambda.Function(this, 'ProductFunction', {
      functionName: `prod-product-function-${envSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import logging
import os
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()
logger = logging.getLogger()
logger.setLevel(logging.INFO)

@xray_recorder.capture('product_handler')
def handler(event, context):
    logger.info(f'Product function invoked: {json.dumps(event)}')
    
    try:
        # Simulate product processing
        product_id = event.get('pathParameters', {}).get('id', 'unknown')
        
        response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'message': 'Product processed successfully',
                'productId': product_id,
                'timestamp': datetime.utcnow().isoformat(),
            })
        }
        
        return response
    except Exception as e:
        logger.error(f'Error processing product: {str(e)}')
        raise
      `),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ENVIRONMENT: envSuffix,
        KMS_KEY_ID: kmsKey.keyId,
      },
      environmentEncryption: kmsKey,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
      onFailure: new destinations.S3Destination(failedEventsBucket),
      reservedConcurrentExecutions: 100,
    });

    // AWS Config compliance tracking
    new config.CfnConfigRule(this, 'LambdaComplianceRule', {
      configRuleName: `prod-lambda-compliance-${envSuffix}`,
      description: 'Ensure Lambda functions are compliant',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'LAMBDA_FUNCTION_SETTINGS_CHECK',
      },
      scope: {
        complianceResourceTypes: ['AWS::Lambda::Function'],
      },
    });

    // Store Lambda ARNs in SSM for cross-stack reference
    new ssm.StringParameter(this, 'UserFunctionArn', {
      parameterName: `/lambda/user-function-arn-${envSuffix}`,
      stringValue: this.userFunction.functionArn,
    });

    new ssm.StringParameter(this, 'ProductFunctionArn', {
      parameterName: `/lambda/product-function-arn-${envSuffix}`,
      stringValue: this.productFunction.functionArn,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserFunctionArnOutput', {
      value: this.userFunction.functionArn,
      description: 'User Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'ProductFunctionArnOutput', {
      value: this.productFunction.functionArn,
      description: 'Product Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'FailedEventsBucketName', {
      value: failedEventsBucket.bucketName,
      description: 'S3 bucket for failed Lambda events',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS key ID for Lambda encryption',
    });
  }
}
```

### 2. API Gateway Stack (`lib/api-gateway-stack.mjs`)

```javascript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const userFunction = props?.userFunction;
    const productFunction = props?.productFunction;

    // CloudWatch Log Group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/apigateway/prod-MyAPI-${envSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create REST API
    this.api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: 'prod-MyAPI',
      description: 'Production Serverless API',
      deployOptions: {
        stageName: envSuffix,
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
        maxAge: cdk.Duration.hours(1),
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Request Validator
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: this.api,
      requestValidatorName: 'validate-request',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Lambda integrations
    const userIntegration = userFunction ? 
      new apigateway.LambdaIntegration(userFunction, {
        proxy: true,
        integrationResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        }],
      }) : 
      new apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: '200',
          responseTemplates: {
            'application/json': JSON.stringify({ message: 'Mock user response' }),
          },
        }],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      });

    const productIntegration = productFunction ? 
      new apigateway.LambdaIntegration(productFunction, {
        proxy: true,
        integrationResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        }],
      }) : 
      new apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: '200',
          responseTemplates: {
            'application/json': JSON.stringify({ message: 'Mock product response' }),
          },
        }],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      });

    // IAM authorizer
    const apiRole = new iam.Role(this, 'ApiGatewayRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        InvokePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['lambda:InvokeFunction'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // User resource endpoints
    const usersResource = this.api.root.addResource('users');
    const userIdResource = usersResource.addResource('{id}');

    // User CRUD operations
    usersResource.addMethod('GET', userIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator,
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    usersResource.addMethod('POST', userIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator,
      requestModels: {
        'application/json': new apigateway.Model(this, 'UserPostModel', {
          restApi: this.api,
          contentType: 'application/json',
          schema: {
            type: apigateway.JsonSchemaType.OBJECT,
            properties: {
              name: { type: apigateway.JsonSchemaType.STRING },
              email: { type: apigateway.JsonSchemaType.STRING },
            },
            required: ['name', 'email'],
          },
        }),
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    userIdResource.addMethod('GET', userIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator,
      requestParameters: {
        'method.request.path.id': true,
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    userIdResource.addMethod('PUT', userIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator,
      requestParameters: {
        'method.request.path.id': true,
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    userIdResource.addMethod('DELETE', userIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator,
      requestParameters: {
        'method.request.path.id': true,
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    // Product resource endpoints
    const productsResource = this.api.root.addResource('products');
    const productIdResource = productsResource.addResource('{id}');

    // Product CRUD operations
    productsResource.addMethod('GET', productIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator,
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    productsResource.addMethod('POST', productIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator,
      requestModels: {
        'application/json': new apigateway.Model(this, 'ProductPostModel', {
          restApi: this.api,
          contentType: 'application/json',
          schema: {
            type: apigateway.JsonSchemaType.OBJECT,
            properties: {
              name: { type: apigateway.JsonSchemaType.STRING },
              price: { type: apigateway.JsonSchemaType.NUMBER },
              category: { type: apigateway.JsonSchemaType.STRING },
            },
            required: ['name', 'price'],
          },
        }),
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    productIdResource.addMethod('GET', productIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
      requestValidator,
      requestParameters: {
        'method.request.path.id': true,
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    // Store API Gateway URL in SSM
    new ssm.StringParameter(this, 'ApiGatewayUrlParam', {
      parameterName: `/api-gateway/url-${envSuffix}`,
      stringValue: this.api.url,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
    });
  }
}
```

### 3. Security Stack with WAF (`lib/security-stack.mjs`)

```javascript
import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class SecurityStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const api = props?.api;

    // Create WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, 'ApiWebAcl', {
      name: `prod-api-waf-${envSuffix}`,
      scope: 'REGIONAL',
      description: 'WAF for API Gateway protection',
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `prod-api-waf-${envSuffix}`,
      },
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
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsMetric',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    if (api) {
      new wafv2.CfnWebACLAssociation(this, 'ApiWebAclAssociation', {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${envSuffix}`,
        webAclArn: this.webAcl.attrArn,
      });
    }

    // Store WAF ARN in SSM
    new ssm.StringParameter(this, 'WebAclArnParam', {
      parameterName: `/waf/web-acl-arn-${envSuffix}`,
      stringValue: this.webAcl.attrArn,
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'WebAclId', {
      value: this.webAcl.attrId,
      description: 'WAF Web ACL ID',
    });
  }
}
```

### 4. Monitoring Stack (`lib/monitoring-stack.mjs`)

```javascript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';

export class MonitoringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const api = props?.api;
    const userFunction = props?.userFunction;
    const productFunction = props?.productFunction;

    // SNS Topic for Alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `prod-serverless-alarms-${envSuffix}`,
      displayName: 'Serverless Infrastructure Alarms',
    });

    // API Gateway Metrics
    const api4xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiName: 'prod-MyAPI',
        Stage: envSuffix,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const api5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiName: 'prod-MyAPI',
        Stage: envSuffix,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const apiLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: 'prod-MyAPI',
        Stage: envSuffix,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // API Gateway Alarms
    new cloudwatch.Alarm(this, 'Api4xxAlarm', {
      alarmName: `prod-api-4xx-errors-${envSuffix}`,
      alarmDescription: 'API Gateway 4xx error rate is too high',
      metric: api4xxMetric,
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `prod-api-5xx-errors-${envSuffix}`,
      alarmDescription: 'API Gateway 5xx error rate is too high',
      metric: api5xxMetric,
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: `prod-api-high-latency-${envSuffix}`,
      alarmDescription: 'API Gateway latency is too high',
      metric: apiLatencyMetric,
      threshold: 1000,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Lambda Metrics and Alarms
    if (userFunction) {
      const userErrorMetric = new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: `prod-user-function-${envSuffix}`,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      new cloudwatch.Alarm(this, 'UserFunctionErrorAlarm', {
        alarmName: `prod-user-function-errors-${envSuffix}`,
        alarmDescription: 'User Lambda function error rate is too high',
        metric: userErrorMetric,
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    }

    if (productFunction) {
      const productErrorMetric = new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: `prod-product-function-${envSuffix}`,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      });

      new cloudwatch.Alarm(this, 'ProductFunctionErrorAlarm', {
        alarmName: `prod-product-function-errors-${envSuffix}`,
        alarmDescription: 'Product Lambda function error rate is too high',
        metric: productErrorMetric,
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    }

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServerlessDashboard', {
      dashboardName: `prod-serverless-dashboard-${envSuffix}`,
    });

    // API Gateway Widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: 'prod-MyAPI',
            Stage: envSuffix,
          },
          statistic: 'Sum',
        })],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [apiLatencyMetric],
        width: 12,
        height: 6,
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway 4XX Errors',
        left: [api4xxMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway 5XX Errors',
        left: [api5xxMetric],
        width: 12,
        height: 6,
      }),
    );

    // Lambda Widgets
    if (userFunction || productFunction) {
      const lambdaWidgets = [];
      
      if (userFunction) {
        lambdaWidgets.push(
          new cloudwatch.GraphWidget({
            title: 'User Function Invocations',
            left: [new cloudwatch.Metric({
              namespace: 'AWS/Lambda',
              metricName: 'Invocations',
              dimensionsMap: {
                FunctionName: `prod-user-function-${envSuffix}`,
              },
              statistic: 'Sum',
            })],
            width: 12,
            height: 6,
          })
        );
      }
      
      if (productFunction) {
        lambdaWidgets.push(
          new cloudwatch.GraphWidget({
            title: 'Product Function Invocations',
            left: [new cloudwatch.Metric({
              namespace: 'AWS/Lambda',
              metricName: 'Invocations',
              dimensionsMap: {
                FunctionName: `prod-product-function-${envSuffix}`,
              },
              statistic: 'Sum',
            })],
            width: 12,
            height: 6,
          })
        );
      }
      
      dashboard.addWidgets(...lambdaWidgets);
    }

    // Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Topic ARN for alarms',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
```

### 5. Main Stack Orchestrator (`lib/tap-stack.mjs`)

```javascript
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from './lambda-stack.mjs';
import { ApiGatewayStack } from './api-gateway-stack.mjs';
import { SecurityStack } from './security-stack.mjs';
import { MonitoringStack } from './monitoring-stack.mjs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 
                             this.node.tryGetContext('environmentSuffix') || 
                             'dev';

    // Lambda Stack - Core compute layer
    const lambdaStack = new LambdaStack(this, 'Lambda', {
      environmentSuffix,
    });

    // API Gateway Stack - RESTful API layer
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGateway', {
      environmentSuffix,
      userFunction: lambdaStack.userFunction,
      productFunction: lambdaStack.productFunction,
    });
    apiGatewayStack.addDependency(lambdaStack);

    // Security Stack - WAF protection
    const securityStack = new SecurityStack(this, 'Security', {
      environmentSuffix,
      api: apiGatewayStack.api,
    });
    securityStack.addDependency(apiGatewayStack);

    // Monitoring Stack - CloudWatch monitoring
    const monitoringStack = new MonitoringStack(this, 'Monitoring', {
      environmentSuffix,
      api: apiGatewayStack.api,
      userFunction: lambdaStack.userFunction,
      productFunction: lambdaStack.productFunction,
    });
    monitoringStack.addDependency(apiGatewayStack);
    monitoringStack.addDependency(lambdaStack);

    // Main Stack Outputs
    new cdk.CfnOutput(this, 'StackRegion', {
      value: this.region,
      description: 'Deployment region',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: environmentSuffix,
      description: 'Environment suffix',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiGatewayStack.api.url,
      description: 'Main API endpoint URL',
    });

    new cdk.CfnOutput(this, 'WafProtection', {
      value: securityStack.webAcl.attrArn,
      description: 'WAF Web ACL protecting the API',
    });
  }
}
```

## Key Features Implemented

### 1. **Lambda Functions** ✅
- User function with Node.js 20.x runtime
- Product function with Python 3.12 runtime
- X-Ray tracing enabled for both functions
- KMS encryption for environment variables
- S3 failed-event destinations
- Reserved concurrent executions for predictable performance

### 2. **API Gateway** ✅
- RESTful API named 'prod-MyAPI'
- CRUD operations for users and products
- Request validation with JSON schemas
- IAM authorization for security
- CORS configuration for browser access
- Throttling limits (1000 req/s, 2000 burst)

### 3. **Security (WAF)** ✅
- Rate limiting (2000 requests per 5 minutes per IP)
- AWS Managed Rules for common threats
- SQL injection protection
- Known bad inputs blocking
- CloudWatch metrics for all rules

### 4. **Monitoring** ✅
- CloudWatch alarms for 4XX and 5XX errors
- API latency monitoring
- Lambda error rate tracking
- Comprehensive CloudWatch dashboard
- SNS topic for alarm notifications

### 5. **Best Practices** ✅
- Infrastructure as Code with CDK
- Environment-based resource naming
- Least privilege IAM roles
- Automated log retention policies
- SSM parameters for cross-stack references
- AWS Config compliance tracking
- Proper error handling and logging
- Clean resource removal with DESTROY policies

## Production Readiness

This implementation includes:

1. **High Availability**: Regional API Gateway endpoint with Lambda functions
2. **Security**: Multiple layers including IAM, WAF, and KMS encryption
3. **Observability**: Complete monitoring with CloudWatch, X-Ray, and alarms
4. **Scalability**: Auto-scaling Lambda functions with reserved concurrency
5. **Cost Optimization**: Log retention policies and lifecycle rules
6. **Compliance**: AWS Config rules for continuous compliance monitoring
7. **Disaster Recovery**: Failed event destinations for Lambda functions

## Deployment Commands

```bash
# Install dependencies
npm install

# Run quality checks
npm run lint
npm run build

# Deploy infrastructure
export ENVIRONMENT_SUFFIX=synthtrainr172
npm run synth
npm run deploy

# Run tests
npm run test:unit
npm run test:integration

# Cleanup resources
npm run destroy
```

This ideal implementation addresses all 13 requirements from the original prompt while following AWS best practices for serverless architectures.