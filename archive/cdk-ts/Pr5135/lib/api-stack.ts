import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

interface ApiStackProps {
  loadBalancer: elbv2.ApplicationLoadBalancer;
  environmentSuffix: string;
}

export class ApiStack extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    // Create REST API
    this.api = new apigateway.RestApi(this, 'ContentApi', {
      restApiName: `StreamFlix Content API ${props.environmentSuffix}`,
      description: 'API for StreamFlix content metadata',
      deployOptions: {
        stageName: props.environmentSuffix,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create HTTP integration with ALB (public endpoint)
    const integration = new apigateway.HttpIntegration(
      `http://${props.loadBalancer.loadBalancerDnsName}/{proxy}`,
      {
        httpMethod: 'ANY',
        proxy: true,
        options: {
          requestParameters: {
            'integration.request.path.proxy': 'method.request.path.proxy',
          },
        },
      }
    );

    // Add proxy resource for all paths
    const proxyResource = this.api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', integration, {
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });

    // Add root path
    const rootIntegration = new apigateway.HttpIntegration(
      `http://${props.loadBalancer.loadBalancerDnsName}`,
      {
        httpMethod: 'ANY',
        proxy: true,
      }
    );
    this.api.root.addMethod('ANY', rootIntegration);

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });
  }
}
