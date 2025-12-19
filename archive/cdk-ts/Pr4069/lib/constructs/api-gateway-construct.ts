import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import {
  IApiGatewayConfig,
  ICustomDomainConfig,
} from '../config/environment-config';

export interface ApiGatewayConstructProps {
  environment: string;
  lambdaFunctions: { [key: string]: lambda.Function };
  userPool: cognito.UserPool;
  config: IApiGatewayConfig;
  domainConfig?: ICustomDomainConfig;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly customDomainName?: string;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'Authorizer',
      {
        cognitoUserPools: [props.userPool],
        authorizerName: `${props.environment}-authorizer`,
        identitySource: 'method.request.header.Authorization',
      }
    );

    const logGroup = new cdk.aws_logs.LogGroup(this, 'ApiGatewayLogGroup', {
      retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    });

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${props.environment}-api`,
      deployOptions: {
        stageName: props.config.stageName,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: props.environment !== 'production',
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.clf(),
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
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${props.environment}-usage-plan`,
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: props.config.throttleRateLimit,
        burstLimit: props.config.throttleBurstLimit,
      },
      quota: props.config.quotaLimit
        ? {
            limit: props.config.quotaLimit,
            period: apigateway.Period[props.config.quotaPeriod!],
          }
        : undefined,
    });

    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${props.environment}-api-key`,
    });

    usagePlan.addApiKey(apiKey);

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      const resource = this.api.root.addResource(name.toLowerCase());
      const integration = new apigateway.LambdaIntegration(fn, {
        proxy: true,
      });

      resource.addMethod('GET', integration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
        apiKeyRequired: true,
      });

      resource.addMethod('POST', integration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
        apiKeyRequired: true,
      });
    });

    if (props.domainConfig) {
      const domainName = new apigateway.DomainName(this, 'CustomDomain', {
        domainName: props.domainConfig.domainName,
        certificate: certificatemanager.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.domainConfig.certificateArn
        ),
        endpointType: apigateway.EndpointType.REGIONAL,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      });

      domainName.addBasePathMapping(this.api, {
        basePath: props.environment === 'production' ? '' : props.environment,
      });

      this.customDomainName = props.domainConfig.domainName;

      new cdk.CfnOutput(this, 'ApiKeyId', {
        value: apiKey.keyId,
        description: 'API Key ID',
      });
    }

    cdk.Tags.of(this.api).add('Name', `${props.environment}-api`);
  }
}
