import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack (unit)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix,
      },
    });
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('creates VPC with public and private subnets', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false,
    });
  });

  test('creates S3 bucket with SSE-S3 and blocks public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.anyValue(),
      }),
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('creates Bastion with EIP and SSM role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: Match.objectLike({
              Service: Match.anyValue(),
            }),
          }),
        ]),
      }),
      ManagedPolicyArns: Match.anyValue(),
    });
    template.resourceCountIs('AWS::EC2::Instance', 1);
    template.resourceCountIs('AWS::EC2::EIPAssociation', 1);
  });

  test('creates RDS instance in private subnets, encrypted, Multi-AZ', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      MultiAZ: true,
      StorageEncrypted: true,
      PubliclyAccessible: false,
      DeletionProtection: false,
    });
  });

  test('creates internet-facing ALB with HTTP listener', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Scheme: 'internet-facing',
        Type: 'application',
      }
    );
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('creates DynamoDB table with PITR', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  test('exposes useful CloudFormation outputs', () => {
    const anyOutput = Match.objectLike({ Value: Match.anyValue() });
    template.hasOutput('VpcId', anyOutput);
    template.hasOutput('PublicSubnetIds', anyOutput);
    template.hasOutput('PrivateSubnetIds', anyOutput);
    template.hasOutput('AppBucketName', anyOutput);
    template.hasOutput('BastionInstanceId', anyOutput);
    template.hasOutput('AlbDnsName', anyOutput);
    template.hasOutput('DbEndpointAddress', anyOutput);
    template.hasOutput('DynamoTableName', anyOutput);
  });

  test('region guard does not throw when region is us-east-1', () => {
    const app2 = new cdk.App();
    expect(
      () =>
        new TapStack(app2, 'TestTapStackUse1', {
          environmentSuffix,
          env: { account: '123456789012', region: 'us-east-1' },
        })
    ).not.toThrow();
  });

  test('region guard throws when region is not us-east-1', () => {
    const app3 = new cdk.App();
    expect(
      () =>
        new TapStack(app3, 'TestTapStackUsw2', {
          environmentSuffix,
          env: { account: '123456789012', region: 'us-west-2' },
        })
    ).toThrow(/must be deployed to us-east-1/);
  });

  test('falls back to dev environmentSuffix when not provided', () => {
    const app4 = new cdk.App();
    const stack4 = new TapStack(app4, 'NoSuffixStack');
    const t4 = Template.fromStack(stack4);
    t4.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Component',
          Value: Match.stringLikeRegexp('vpc-dev$'),
        }),
      ]),
    });
  });
});
