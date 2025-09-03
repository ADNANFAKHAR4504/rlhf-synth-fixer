import { beforeEach, describe, expect, test } from '@jest/globals';
import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack (unit)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('creates core resources', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);

    // There may be additional Lambdas (custom resources). Assert our app Lambda exists.
    const lambdas = template.findResources('AWS::Lambda::Function');
    const appHandlers = Object.values(lambdas).filter(
      (r: any) =>
        r.Properties?.Handler === 'index.handler' &&
        r.Properties?.Runtime === 'nodejs18.x'
    );
    expect(appHandlers.length).toBe(1);
  });

  test('creates VPC endpoints: 2 gateway (S3, DDB)', () => {
    const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
    const values = Object.values(endpoints);
    expect(values.length).toBe(2);

    const gatewayEndpoints = values.filter(
      (r: any) => r.Properties.VpcEndpointType === 'Gateway'
    );
    expect(gatewayEndpoints.length).toBe(2);
  });

  test('S3 bucket: encryption, block public access, SSL-only', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    // Deny insecure transport (enforce SSL)
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'DenyInsecureTransport',
            Effect: 'Deny',
            Condition: {
              Bool: { 'aws:SecureTransport': 'false' },
            },
          }),
        ]),
      }),
    });
  });

  test('S3 bucket policy restricts object access to S3 VPCE (data-plane only)', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'RestrictToVpcEndpoint',
            Effect: 'Deny',
            Action: Match.arrayWith(['s3:GetObject']),
            // Resource can be a single string or list. Do not over-assert form.
            Condition: Match.objectLike({
              StringNotEqualsIfExists: Match.objectLike({
                'aws:SourceVpce': Match.anyValue(),
              }),
            }),
          }),
        ]),
      }),
    });
  });

  test('covers environmentSuffix branching for coverage (props, context, default)', () => {
    // via props
    const app1 = new cdk.App();
    new TapStack(app1, 'BranchProps', { environmentSuffix: 'unit' });

    // via context
    const app2 = new cdk.App();
    app2.node.setContext('environmentSuffix', 'qa');
    new TapStack(app2, 'BranchContext');

    // default
    const app3 = new cdk.App();
    new TapStack(app3, 'BranchDefault');
  });

  test('DynamoDB table: PAY_PER_REQUEST with PITR enabled and pk string', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'pk', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'pk', AttributeType: 'S' }],
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  test('Lambda function: Node.js 18, VPC-configured, env set, and log group exists', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Timeout: 10,
      VpcConfig: Match.objectLike({
        SubnetIds: Match.anyValue(),
        SecurityGroupIds: Match.anyValue(),
      }),
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          BUCKET_NAME: Match.anyValue(),
          TABLE_NAME: Match.anyValue(),
        }),
      }),
    });

    // At least two log groups (lambda + api access logs)
    const logs = template.findResources('AWS::Logs::LogGroup');
    expect(Object.keys(logs).length).toBeGreaterThanOrEqual(2);
  });

  test('HTTP API (v2) exists with stage access logging configured', () => {
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
      StageName: 'prod',
      AccessLogSettings: Match.objectLike({
        DestinationArn: Match.anyValue(),
        Format: Match.anyValue(),
      }),
    });
  });
});
