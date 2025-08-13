import {
  aws_certificatemanager as acm,
  aws_apigateway as apigw,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ApiGatewayProps {
  restApiName: string;
  handler: import('aws-cdk-lib').aws_lambda.IFunction;
  customDomainName?: string;
  certificateArn?: string; // Must be in same region as stack
}

export class SecureApiGateway extends Construct {
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.api = new apigw.RestApi(this, 'Api', {
      restApiName: props.restApiName,
      endpointConfiguration: { types: [apigw.EndpointType.REGIONAL] },
    });

    const integration = new apigw.LambdaIntegration(props.handler, {
      proxy: true,
    });
    this.api.root.addMethod('GET', integration);
    this.api.root.addMethod('PUT', integration);

    if (props.customDomainName && props.certificateArn) {
      const cert = acm.Certificate.fromCertificateArn(
        this,
        'ImportedCert',
        props.certificateArn
      );
      const domain = new apigw.DomainName(this, 'CustomDomain', {
        domainName: props.customDomainName,
        certificate: cert,
        securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        endpointType: apigw.EndpointType.REGIONAL,
      });
      new apigw.BasePathMapping(this, 'BasePathMapping', {
        domainName: domain,
        restApi: this.api,
      });
    }
  }
}
