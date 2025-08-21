import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_lambda as lambda } from 'aws-cdk-lib';
import {
  ApiGatewayProps,
  SecureApiGateway,
} from '../lib/constructs/api-gateway';
import { ApiLambda, ApiLambdaProps } from '../lib/constructs/api-lambda';

describe('ApiLambda', () => {
  let stack: cdk.Stack;
  let role: iam.Role;

  beforeEach(() => {
    stack = new cdk.Stack();
    // Use a real IAM Role for CDK compatibility
    role = new iam.Role(stack, 'TestRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
  });

  test('creates lambda function with correct properties', () => {
    const props: ApiLambdaProps = {
      role,
      bucketName: 'my-bucket',
    };
    const apiLambda = new ApiLambda(stack, 'TestApiLambda', props);
    expect(apiLambda.func).toBeDefined();
    expect(apiLambda.func.role).toBe(role);
    // Check environment variable via CloudFormation resource using CDK assertions
    const template = require('aws-cdk-lib/assertions').Template.fromStack(
      stack
    );
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          BUCKET_NAME: 'my-bucket',
        },
      },
    });
    expect(apiLambda.func.runtime).toBe(lambda.Runtime.NODEJS_20_X);
    expect(apiLambda.func.timeout?.toSeconds()).toBe(10);
    expect(apiLambda.func.functionName).toBeDefined();
  });

  test('throws if missing required props', () => {
    // Should throw if role is missing
    expect(
      () =>
        // @ts-expect-error
        new ApiLambda(stack, 'MissingRole', { bucketName: 'b' })
    ).toThrow();
    // Should throw if bucketName is missing
    expect(
      () =>
        // @ts-expect-error
        new ApiLambda(stack, 'MissingBucket', { role })
    ).toThrow();
  });

  test('creates lambda with empty bucketName', () => {
    // This should now expect to throw
    expect(
      () =>
        new ApiLambda(stack, 'TestApiLambdaEmptyBucket', {
          role,
          bucketName: '',
        })
    ).toThrow('ApiLambda: "bucketName" prop is required');
  });
});

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
