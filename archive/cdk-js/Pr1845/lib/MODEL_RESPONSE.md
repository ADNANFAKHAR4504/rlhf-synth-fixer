# AWS Serverless Infrastructure Response

I'll help you create a comprehensive serverless infrastructure using CDK JavaScript. Here's the implementation with all the required components:

## lib/lambda-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class LambdaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';

    // KMS Key for encryption
    this.encryptionKey = new kms.Key(this, 'LambdaEncryptionKey', {
      description: 'KMS key for Lambda environment variables encryption',
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for failed events
    this.failedEventsBucket = new s3.Bucket(this, 'FailedEventsBucket', {
      bucketName: `prod-lambda-failed-events-${envSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `prod-lambda-execution-role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        S3FailedEventsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject', 's3:PutObjectAcl'],
              resources: [this.failedEventsBucket.arnForObjects('*')],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:DescribeKey'],
              resources: [this.encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    // User Management Lambda Function
    this.userFunction = new lambda.Function(this, 'UserFunction', {
      functionName: `prod-user-function-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('Processing user request:', JSON.stringify(event));
          
          try {
            const httpMethod = event.httpMethod;
            const pathParameters = event.pathParameters;
            
            let response;
            
            switch (httpMethod) {
              case 'GET':
                response = await getUser(pathParameters);
                break;
              case 'POST':
                response = await createUser(JSON.parse(event.body));
                break;
              case 'PUT':
                response = await updateUser(pathParameters, JSON.parse(event.body));
                break;
              case 'DELETE':
                response = await deleteUser(pathParameters);
                break;
              default:
                throw new Error('Unsupported HTTP method');
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
            console.error('Error processing request:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
        
        async function getUser(pathParameters) {
          return { userId: pathParameters?.id, action: 'get', timestamp: new Date().toISOString() };
        }
        
        async function createUser(userData) {
          return { userId: 'new-id', action: 'create', data: userData, timestamp: new Date().toISOString() };
        }
        
        async function updateUser(pathParameters, userData) {
          return { userId: pathParameters?.id, action: 'update', data: userData, timestamp: new Date().toISOString() };
        }
        
        async function deleteUser(pathParameters) {
          return { userId: pathParameters?.id, action: 'delete', timestamp: new Date().toISOString() };
        }
      `),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        ENVIRONMENT: envSuffix,
        LOG_LEVEL: 'ERROR',
      },
      deadLetterQueue: undefined,
      deadLetterQueueEnabled: false,
      onFailure: new lambda.S3OnFailureDestination(this.failedEventsBucket),
      logGroup: new logs.LogGroup(this, 'UserFunctionLogGroup', {
        logGroupName: `/aws/lambda/prod-user-function-${envSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Product Management Lambda Function
    this.productFunction = new lambda.Function(this, 'ProductFunction', {
      functionName: `prod-product-function-${envSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.ERROR)

def handler(event, context):
    logger.info(f"Processing product request: {json.dumps(event)}")
    
    try:
        http_method = event.get('httpMethod')
        path_parameters = event.get('pathParameters', {})
        
        if http_method == 'GET':
            response = get_product(path_parameters)
        elif http_method == 'POST':
            response = create_product(json.loads(event['body']))
        elif http_method == 'PUT':
            response = update_product(path_parameters, json.loads(event['body']))
        elif http_method == 'DELETE':
            response = delete_product(path_parameters)
        else:
            raise ValueError('Unsupported HTTP method')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response)
        }
        
    except Exception as error:
        logger.error(f"Error processing request: {str(error)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }

def get_product(path_parameters):
    return {
        'productId': path_parameters.get('id'),
        'action': 'get',
        'timestamp': datetime.now().isoformat()
    }

def create_product(product_data):
    return {
        'productId': 'new-product-id',
        'action': 'create',
        'data': product_data,
        'timestamp': datetime.now().isoformat()
    }

def update_product(path_parameters, product_data):
    return {
        'productId': path_parameters.get('id'),
        'action': 'update',
        'data': product_data,
        'timestamp': datetime.now().isoformat()
    }

def delete_product(path_parameters):
    return {
        'productId': path_parameters.get('id'),
        'action': 'delete',
        'timestamp': datetime.now().isoformat()
    }
      `),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        ENVIRONMENT: envSuffix,
        LOG_LEVEL: 'ERROR',
      },
      deadLetterQueue: undefined,
      deadLetterQueueEnabled: false,
      onFailure: new lambda.S3OnFailureDestination(this.failedEventsBucket),
      logGroup: new logs.LogGroup(this, 'ProductFunctionLogGroup', {
        logGroupName: `/aws/lambda/prod-product-function-${envSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Apply KMS encryption to environment variables
    [this.userFunction, this.productFunction].forEach(func => {
      func.addEnvironment('KMS_KEY_ID', this.encryptionKey.keyId);
    });

    // Create aliases for versioning
    this.userFunctionAlias = new lambda.Alias(this, 'UserFunctionAlias', {
      aliasName: 'LIVE',
      version: this.userFunction.currentVersion,
    });

    this.productFunctionAlias = new lambda.Alias(this, 'ProductFunctionAlias', {
      aliasName: 'LIVE',
      version: this.productFunction.currentVersion,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserFunctionArn', {
      value: this.userFunction.functionArn,
      description: 'User Function ARN',
    });

    new cdk.CfnOutput(this, 'ProductFunctionArn', {
      value: this.productFunction.functionArn,
      description: 'Product Function ARN',
    });

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: this.encryptionKey.keyId,
      description: 'KMS Encryption Key ID',
    });
  }
}
```

## lib/api-gateway-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const { userFunction, productFunction } = props;

    // API Gateway Execution Role
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
      roleName: `prod-apigateway-role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
      ],
      inlinePolicies: {
        LambdaInvokePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: [userFunction.functionArn, productFunction.functionArn],
            }),
          ],
        }),
      },
    });

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: 'prod-MyAPI',
      description: 'Production Serverless API',
      deployOptions: {
        stageName: envSuffix,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Request validator
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: this.api,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Lambda integrations
    const userIntegration = new apigateway.LambdaIntegration(userFunction, {
      proxy: true,
      allowTestInvoke: false,
    });

    const productIntegration = new apigateway.LambdaIntegration(productFunction, {
      proxy: true,
      allowTestInvoke: false,
    });

    // API Resources and Methods
    const usersResource = this.api.root.addResource('users');
    const userResource = usersResource.addResource('{id}');
    
    usersResource.addMethod('GET', userIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });
    usersResource.addMethod('POST', userIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });
    userResource.addMethod('GET', userIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });
    userResource.addMethod('PUT', userIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });
    userResource.addMethod('DELETE', userIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });

    const productsResource = this.api.root.addResource('products');
    const productResource = productsResource.addResource('{id}');
    
    productsResource.addMethod('GET', productIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });
    productsResource.addMethod('POST', productIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });
    productResource.addMethod('GET', productIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });
    productResource.addMethod('PUT', productIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
    });
    productResource.addMethod('DELETE', productIntegration, {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.AWS_IAM,
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

## lib/security-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class SecurityStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const { api } = props;

    // WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, 'ApiGatewayWebAcl', {
      name: `prod-api-waf-${envSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF for API Gateway protection',
      rules: [
        {
          name: 'IPWhitelistRule',
          priority: 1,
          statement: {
            ipSetReferenceStatement: {
              arn: this.createIPSet(),
            },
          },
          action: { allow: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'IPWhitelistRule',
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
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 4,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `prod-api-waf-${envSuffix}`,
      },
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${envSuffix}`,
      webAclArn: this.webAcl.attrArn,
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }

  createIPSet() {
    const ipSet = new wafv2.CfnIPSet(this, 'AllowedIPSet', {
      name: `prod-allowed-ips-${this.stackName}`,
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: [
        '10.0.0.0/16',
        '172.16.0.0/12',
        '192.168.0.0/16',
      ],
      description: 'Allowed IP ranges for API access',
    });

    return ipSet.attrArn;
  }
}
```

## lib/monitoring-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';

export class MonitoringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const { userFunction, productFunction, api } = props;

    // SNS Topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `prod-serverless-alarms-${envSuffix}`,
      displayName: 'Serverless Infrastructure Alarms',
    });

    // Lambda Error Rate Alarms
    const userFunctionErrorAlarm = new cloudwatch.Alarm(this, 'UserFunctionErrorAlarm', {
      alarmName: `prod-user-function-errors-${envSuffix}`,
      alarmDescription: 'User function error rate is too high',
      metric: userFunction.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: cloudwatch.Statistic.SUM,
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const productFunctionErrorAlarm = new cloudwatch.Alarm(this, 'ProductFunctionErrorAlarm', {
      alarmName: `prod-product-function-errors-${envSuffix}`,
      alarmDescription: 'Product function error rate is too high',
      metric: productFunction.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: cloudwatch.Statistic.SUM,
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Lambda Duration Alarms
    const userFunctionDurationAlarm = new cloudwatch.Alarm(this, 'UserFunctionDurationAlarm', {
      alarmName: `prod-user-function-duration-${envSuffix}`,
      alarmDescription: 'User function duration is too high',
      metric: userFunction.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: cloudwatch.Statistic.AVERAGE,
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // API Gateway Alarms
    const apiGateway4xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      alarmName: `prod-api-4xx-errors-${envSuffix}`,
      alarmDescription: 'API Gateway 4xx error rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: 'prod-MyAPI',
          Stage: envSuffix,
        },
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
    });

    const apiGateway5xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: `prod-api-5xx-errors-${envSuffix}`,
      alarmDescription: 'API Gateway 5xx error rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: 'prod-MyAPI',
          Stage: envSuffix,
        },
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
    });

    // Add SNS actions to alarms
    [userFunctionErrorAlarm, productFunctionErrorAlarm, userFunctionDurationAlarm, apiGateway4xxAlarm, apiGateway5xxAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    });

    // AWS Config Configuration Recorder
    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: `prod-config-role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    // Config Delivery Channel (S3 bucket for Config)
    const configBucket = new cdk.aws_s3.Bucket(this, 'ConfigBucket', {
      bucketName: `prod-config-bucket-${envSuffix}-${this.account}`,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const configDeliveryChannel = new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      name: `prod-config-delivery-channel-${envSuffix}`,
      s3BucketName: configBucket.bucketName,
    });

    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: `prod-config-recorder-${envSuffix}`,
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: false,
        includeGlobalResourceTypes: false,
        resourceTypes: ['AWS::Lambda::Function'],
      },
    });

    // Lambda function compliance rule
    new config.CfnConfigRule(this, 'LambdaFunctionSettingsRule', {
      configRuleName: `prod-lambda-function-settings-${envSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'LAMBDA_FUNCTION_SETTINGS_CHECK',
      },
      inputParameters: JSON.stringify({
        runtime: 'nodejs20.x,python3.12',
        timeout: '30',
      }),
      dependsOn: [configRecorder],
    });

    // Custom Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServerlessDashboard', {
      dashboardName: `prod-serverless-dashboard-${envSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Invocations',
            left: [
              userFunction.metricInvocations(),
              productFunction.metricInvocations(),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Errors',
            left: [
              userFunction.metricErrors(),
              productFunction.metricErrors(),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'API Gateway Requests',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
                dimensionsMap: {
                  ApiName: 'prod-MyAPI',
                  Stage: envSuffix,
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway Latency',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Latency',
                dimensionsMap: {
                  ApiName: 'prod-MyAPI',
                  Stage: envSuffix,
                },
                statistic: cloudwatch.Statistic.AVERAGE,
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });

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

## lib/tap-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from './lambda-stack.mjs';
import { ApiGatewayStack } from './api-gateway-stack.mjs';
import { SecurityStack } from './security-stack.mjs';
import { MonitoringStack } from './monitoring-stack.mjs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Lambda Stack - contains all Lambda functions and related resources
    const lambdaStack = new LambdaStack(scope, `LambdaStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-lambda-stack-${environmentSuffix}`,
    });

    // API Gateway Stack - handles API routing and integration
    const apiGatewayStack = new ApiGatewayStack(scope, `ApiGatewayStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-api-gateway-stack-${environmentSuffix}`,
      userFunction: lambdaStack.userFunction,
      productFunction: lambdaStack.productFunction,
    });

    // Security Stack - handles WAF and security policies
    const securityStack = new SecurityStack(scope, `SecurityStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-security-stack-${environmentSuffix}`,
      api: apiGatewayStack.api,
    });

    // Monitoring Stack - handles CloudWatch, alarms, and Config
    const monitoringStack = new MonitoringStack(scope, `MonitoringStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
      stackName: `prod-monitoring-stack-${environmentSuffix}`,
      userFunction: lambdaStack.userFunction,
      productFunction: lambdaStack.productFunction,
      api: apiGatewayStack.api,
    });

    // Stack dependencies
    apiGatewayStack.addDependency(lambdaStack);
    securityStack.addDependency(apiGatewayStack);
    monitoringStack.addDependency(lambdaStack);
    monitoringStack.addDependency(apiGatewayStack);

    // Global outputs
    new cdk.CfnOutput(this, 'StackRegion', {
      value: this.region,
      description: 'Deployment region',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: environmentSuffix,
      description: 'Environment suffix',
    });
  }
}
```