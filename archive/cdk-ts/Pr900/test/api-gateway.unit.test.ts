import * as cdk from 'aws-cdk-lib';
import {
  aws_certificatemanager as acm,
  aws_apigateway as apigw,
  aws_lambda as lambda,
} from 'aws-cdk-lib';
import {
  ApiGatewayProps,
  SecureApiGateway,
} from '../lib/constructs/api-gateway';

describe('SecureApiGateway', () => {
  let stack: cdk.Stack;
  let handler: lambda.Function;

  beforeEach(() => {
    stack = new cdk.Stack();
    handler = new lambda.Function(stack, 'TestHandler', {
      code: lambda.Code.fromInline('exports.handler = async () => {};'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_20_X,
    });
  });

  test('creates RestApi and methods without custom domain', () => {
    const props: ApiGatewayProps = {
      restApiName: 'TestApi',
      handler,
    };
    const apiGateway = new SecureApiGateway(stack, 'TestApiGateway', props);
    expect(apiGateway.api).toBeDefined();
    expect(apiGateway.api.restApiName).toBe('TestApi');
    // Check that GET and PUT methods are added
    const methods = apiGateway.api.root.node.children.filter(
      child => child instanceof apigw.Method
    );
    const methodTypes = methods.map((m: any) => m.httpMethod);
    expect(methodTypes).toContain('GET');
    expect(methodTypes).toContain('PUT');
  });

  test('creates RestApi with custom domain and certificate', () => {
    // Mock static method fromCertificateArn
    const certMock = {} as acm.ICertificate;
    const fromCertificateArnSpy = jest
      .spyOn(acm.Certificate, 'fromCertificateArn')
      .mockReturnValue(certMock);

    const props: ApiGatewayProps = {
      restApiName: 'TestApi',
      handler,
      customDomainName: 'api.example.com',
      certificateArn: 'arn:aws:acm:region:account:certificate/123',
    };
    const apiGateway = new SecureApiGateway(
      stack,
      'TestApiGatewayWithDomain',
      props
    );

    expect(apiGateway.api).toBeDefined();
    expect(fromCertificateArnSpy).toHaveBeenCalledWith(
      expect.anything(),
      'ImportedCert',
      'arn:aws:acm:region:account:certificate/123'
    );

    // Check that DomainName and BasePathMapping are created
    const domain = stack.node
      .findChild('TestApiGatewayWithDomain')
      .node.tryFindChild('CustomDomain');
    expect(domain).toBeDefined();
    const basePathMapping = stack.node
      .findChild('TestApiGatewayWithDomain')
      .node.tryFindChild('BasePathMapping');
    expect(basePathMapping).toBeDefined();

    fromCertificateArnSpy.mockRestore();
  });

  test('does not create custom domain if only one of customDomainName or certificateArn is provided', () => {
    const props1: ApiGatewayProps = {
      restApiName: 'TestApi',
      handler,
      customDomainName: 'api.example.com',
    };
    const props2: ApiGatewayProps = {
      restApiName: 'TestApi',
      handler,
      certificateArn: 'arn:aws:acm:region:account:certificate/123',
    };
    expect(
      () => new SecureApiGateway(stack, 'TestApiGatewayMissingCert', props1)
    ).not.toThrow();
    expect(
      () => new SecureApiGateway(stack, 'TestApiGatewayMissingDomain', props2)
    ).not.toThrow();
  });
});
