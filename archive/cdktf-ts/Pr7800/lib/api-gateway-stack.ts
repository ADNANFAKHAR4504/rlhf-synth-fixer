import { Construct } from 'constructs';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayUsagePlan } from '@cdktf/provider-aws/lib/api-gateway-usage-plan';
import { ApiGatewayApiKey } from '@cdktf/provider-aws/lib/api-gateway-api-key';
import { ApiGatewayUsagePlanKey } from '@cdktf/provider-aws/lib/api-gateway-usage-plan-key';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';

export interface ApiGatewayStackProps {
  environmentSuffix: string;
  lambdaFunction: LambdaFunction;
}

export class ApiGatewayStack extends Construct {
  public readonly restApi: ApiGatewayRestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id);

    const { environmentSuffix, lambdaFunction } = props;

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new CloudwatchLogGroup(this, 'api-log-group', {
      name: `/aws/apigateway/trading-api-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `trading-api-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create REST API
    this.restApi = new ApiGatewayRestApi(this, 'rest-api', {
      name: `trading-api-${environmentSuffix}`,
      description: 'Trading Analytics Platform API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `trading-api-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // Create resource
    const processResource = new ApiGatewayResource(this, 'process-resource', {
      restApiId: this.restApi.id,
      parentId: this.restApi.rootResourceId,
      pathPart: 'process',
    });

    // Create method
    const processMethod = new ApiGatewayMethod(this, 'process-method', {
      restApiId: this.restApi.id,
      resourceId: processResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
      apiKeyRequired: true,
    });

    // Create integration
    const integration = new ApiGatewayIntegration(this, 'lambda-integration', {
      restApiId: this.restApi.id,
      resourceId: processResource.id,
      httpMethod: processMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: lambdaFunction.invokeArn,
    });

    // Grant API Gateway permission to invoke Lambda
    new LambdaPermission(this, 'api-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.restApi.executionArn}/*/*`,
    });

    // Create deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: this.restApi.id,
      dependsOn: [processMethod, integration],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // Create stage
    const stage = new ApiGatewayStage(this, 'api-stage', {
      restApiId: this.restApi.id,
      deploymentId: deployment.id,
      stageName: environmentSuffix,
      xrayTracingEnabled: true,
      accessLogSettings: {
        destinationArn: apiLogGroup.arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
        }),
      },
      tags: {
        Name: `trading-api-stage-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Configure method settings for throttling
    new ApiGatewayMethodSettings(this, 'method-settings', {
      restApiId: this.restApi.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 1000,
        loggingLevel: 'INFO',
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Create usage plan
    const usagePlan = new ApiGatewayUsagePlan(this, 'usage-plan', {
      name: `trading-usage-plan-${environmentSuffix}`,
      description: 'Usage plan with 1000 RPS throttling per API key',
      throttleSettings: {
        burstLimit: 1000,
        rateLimit: 1000,
      },
      apiStages: [
        {
          apiId: this.restApi.id,
          stage: stage.stageName,
        },
      ],
      tags: {
        Name: `trading-usage-plan-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create API key
    const apiKey = new ApiGatewayApiKey(this, 'api-key', {
      name: `trading-api-key-${environmentSuffix}`,
      description: 'API key for trading analytics platform',
      enabled: true,
      tags: {
        Name: `trading-api-key-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Associate API key with usage plan
    new ApiGatewayUsagePlanKey(this, 'usage-plan-key', {
      keyId: apiKey.id,
      keyType: 'API_KEY',
      usagePlanId: usagePlan.id,
    });

    this.apiUrl = stage.invokeUrl;
  }
}
