import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class ApiStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;
    const dataStream = props.dataStream;

    // Lambda function for API backend
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `healthtech-api-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Request:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              message: 'HealthTech API - Patient Data Processing',
              timestamp: new Date().toISOString(),
              environment: '${environmentSuffix}',
            }),
          };
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        KINESIS_STREAM_NAME: dataStream.streamName,
        ENVIRONMENT: environmentSuffix,
      },
    });

    // Grant Lambda permission to write to Kinesis
    dataStream.grantWrite(apiFunction);

    // CloudWatch Logs for Lambda
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/healthtech-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // API Gateway with CloudWatch logging
    const logGroupApi = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/healthtech-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.api = new apigateway.RestApi(this, 'HealthTechApi', {
      restApiName: `healthtech-api-${environmentSuffix}`,
      description: 'API Gateway for HealthTech external integrations',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroupApi),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Key for authentication
    const apiKey = this.api.addApiKey('ApiKey', {
      apiKeyName: `healthtech-api-key-${environmentSuffix}`,
    });

    const usagePlan = this.api.addUsagePlan('UsagePlan', {
      name: `healthtech-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 2000,
        burstLimit: 5000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // API resources
    const dataResource = this.api.root.addResource('data');
    const healthResource = this.api.root.addResource('health');

    // Integrate Lambda with API Gateway
    const integration = new apigateway.LambdaIntegration(apiFunction);

    dataResource.addMethod('POST', integration, {
      apiKeyRequired: true,
    });

    healthResource.addMethod('GET', integration);

    // Export API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      exportName: `healthtech-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      exportName: `healthtech-api-key-id-${environmentSuffix}`,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
