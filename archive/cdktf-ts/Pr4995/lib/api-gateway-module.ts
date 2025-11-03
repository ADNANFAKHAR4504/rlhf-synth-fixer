import { Construct } from 'constructs';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
import { Apigatewayv2Stage } from '@cdktf/provider-aws/lib/apigatewayv2-stage';
import { Apigatewayv2VpcLink } from '@cdktf/provider-aws/lib/apigatewayv2-vpc-link';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { TerraformOutput } from 'cdktf';

interface ApiGatewayModuleProps {
  environmentSuffix: string;
  ecsServiceArn: string;
  vpcLinkSubnetIds: string[];
  apiSecretArn: string;
}

export class ApiGatewayModule extends Construct {
  public readonly apiEndpoint: string;

  constructor(scope: Construct, id: string, props: ApiGatewayModuleProps) {
    super(scope, id);

    const { environmentSuffix, vpcLinkSubnetIds } = props;

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new CloudwatchLogGroup(this, 'api-log-group', {
      name: `/aws/apigateway/manufacturing-api-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `manufacturing-api-logs-${environmentSuffix}`,
      },
    });

    // Create VPC Link for private integration
    // Note: VPC Link is created but not yet connected to any integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vpcLink = new Apigatewayv2VpcLink(this, 'vpc-link', {
      name: `manufacturing-vpc-link-${environmentSuffix}`,
      subnetIds: vpcLinkSubnetIds,
      securityGroupIds: [],
      tags: {
        Name: `manufacturing-vpc-link-${environmentSuffix}`,
      },
    });

    // Create HTTP API
    const api = new Apigatewayv2Api(this, 'api', {
      name: `manufacturing-api-${environmentSuffix}`,
      protocolType: 'HTTP',
      description:
        'API Gateway for manufacturing data pipeline external integrations',
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: 300,
      },
      tags: {
        Name: `manufacturing-api-${environmentSuffix}`,
      },
    });

    // Note: Integration and routes would be configured once ECS service has a load balancer
    // For now, API Gateway is created without integration

    // Create Stage
    const stage = new Apigatewayv2Stage(this, 'stage', {
      apiId: api.id,
      name: environmentSuffix,
      autoDeploy: true,
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
        Name: `manufacturing-api-stage-${environmentSuffix}`,
      },
    });

    this.apiEndpoint = `${api.apiEndpoint}/${stage.name}`;

    new TerraformOutput(this, 'api-endpoint', {
      value: this.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'api-id', {
      value: api.id,
      description: 'API Gateway ID',
    });
  }
}
