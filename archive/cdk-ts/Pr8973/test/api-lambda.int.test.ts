import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import {
  ApiGatewayProps,
  SecureApiGateway,
} from '../lib/constructs/api-gateway';
import { ApiLambda, ApiLambdaProps } from '../lib/constructs/api-lambda';

describe('ApiLambda & SecureApiGateway Integration', () => {
  let stack: cdk.Stack;
  let role: iam.Role;

  beforeEach(() => {
    stack = new cdk.Stack();
    role = new iam.Role(stack, 'IntegrationRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
  });

  test('synthesizes Lambda function and API Gateway with all expected resources', () => {
    // Lambda
    const lambdaProps: ApiLambdaProps = {
      role,
      bucketName: 'integration-bucket',
    };
    const apiLambda = new ApiLambda(stack, 'IntegrationApiLambda', lambdaProps);

    // API Gateway
    const apiGatewayProps: ApiGatewayProps = {
      restApiName: 'IntegrationApi',
      handler: apiLambda.func,
    };
    new SecureApiGateway(stack, 'IntegrationApiGateway', apiGatewayProps);

    const template = Template.fromStack(stack);

    // Lambda Function
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs20.x',
      Environment: {
        Variables: {
          BUCKET_NAME: 'integration-bucket',
        },
      },
      Timeout: 10,
    });

    // IAM Role
    const roles = template.findResources('AWS::IAM::Role');
    const roleProps = Object.values(roles)
      .map((r: any) => r.Properties)
      .find(
        (props: any) =>
          Array.isArray(props.AssumeRolePolicyDocument?.Statement) &&
          props.AssumeRolePolicyDocument.Statement.some(
            (stmt: any) =>
              stmt.Principal?.Service === 'lambda.amazonaws.com' ||
              (Array.isArray(stmt.Principal?.Service) &&
                stmt.Principal.Service.includes('lambda.amazonaws.com'))
          )
      );
    expect(roleProps).toBeDefined();
    expect(roleProps.AssumeRolePolicyDocument.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }),
      ])
    );

    // API Gateway
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'IntegrationApi',
    });
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
    });
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'PUT',
    });
  });
});
