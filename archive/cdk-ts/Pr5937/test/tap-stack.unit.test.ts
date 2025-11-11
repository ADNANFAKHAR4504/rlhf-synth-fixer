import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { CloudSetupStack } from '../lib/cloud-setup-stack';
import { TapStack } from '../lib/tap-stack';

const FIXED_NOW = 1_700_000_000_000;

const createStack = (id: string = 'TestStack') => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, id);
  return { app, stack };
};

describe('CloudSetupStack', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('creates default infrastructure when no existing VPC is supplied', () => {
    const { stack } = createStack();
    new CloudSetupStack(stack, 'Subject', {
      domainName: 'example.com',
      environmentSuffix: 'blue',
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });

    template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: Match.objectLike({
              SSEAlgorithm: 'aws:kms',
            }),
          }),
        ]),
      }),
    }));

    template.resourceCountIs('Custom::S3BucketNotifications', 1);

    template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
      Description: 'Processes S3 events and creates object summaries',
      Runtime: 'nodejs18.x',
      Timeout: 300,
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          BUCKET_NAME: Match.anyValue(),
          LOG_GROUP_NAME: Match.stringLikeRegexp('/aws/lambda/'),
        }),
      }),
    }));

    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'mysql',
      MultiAZ: true,
      StorageEncrypted: true,
      EnablePerformanceInsights: Match.absent(),
    }));

    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', Match.objectLike({
      MinSize: '2',
      MaxSize: '4',
      DesiredCapacity: '2',
    }));

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.stringLikeRegexp('/aws/ecs/cloud-setup-'),
      RetentionInDays: 7,
    });

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      Threshold: 70,
      EvaluationPeriods: 2,
    });
  });

  test('reuses an existing VPC when an identifier is provided', () => {
    const { stack } = createStack('ReuseStack');
    const existingVpc = new ec2.Vpc(stack, 'PreExistingVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
    });

    const spy = jest
      .spyOn(ec2.Vpc, 'fromLookup')
      .mockImplementation(() => existingVpc);

    new CloudSetupStack(stack, 'ReuseSubject', {
      domainName: 'reuse.example.com',
      environmentSuffix: 'reuse',
      existingVpcId: 'vpc-123abc',
    });

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^existing-vpc-/),
      expect.objectContaining({ vpcId: 'vpc-123abc' })
    );

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('configures HTTPS listener when ALB certificate is supplied', () => {
    const { stack } = createStack('HttpsStack');

    new CloudSetupStack(stack, 'HttpsSubject', {
      domainName: 'secure.example.com',
      environmentSuffix: 'secure',
      albCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::Listener',
      Match.objectLike({
        Port: 443,
        Protocol: 'HTTPS',
      })
    );
  });

  test('configures CloudFront custom domain and hosted zone when requested', () => {
    const { stack } = createStack('HostedZoneStack');

    const subject = new CloudSetupStack(stack, 'HostedZoneSubject', {
      domainName: 'app.example.com',
      environmentSuffix: 'zoned',
      cloudFrontCertificateArn:
        'arn:aws:acm:us-east-1:123456789012:certificate/cf-cert',
      createHostedZone: true,
    });

    expect(subject.cloudFrontUrl).toMatch(/^https:\/\/.+/);

    const template = Template.fromStack(stack);
    template.hasResourceProperties(
      'AWS::CloudFront::Distribution',
      Match.objectLike({
        DistributionConfig: Match.objectLike({
          Aliases: ['app.example.com'],
          PriceClass: 'PriceClass_100',
        }),
      })
    );

    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'app.example.com.',
    });

    template.hasResourceProperties('AWS::Route53::RecordSet', Match.objectLike({
      Name: 'app.example.com.',
      Type: 'A',
      AliasTarget: Match.objectLike({
        HostedZoneId: Match.anyValue(),
      }),
    }));
  });

  test('exposes lambda and database metadata via public properties', () => {
    const { stack } = createStack('MetadataStack');
    const subject = new CloudSetupStack(stack, 'MetadataSubject', {
      domainName: 'meta.example.com',
      environmentSuffix: 'meta',
    });

    expect(subject.vpcId).toBeDefined();
    expect(subject.lambdaFunctionName).toBeTruthy();
    expect(subject.lambdaLogGroupName).toContain('/aws/lambda/');
    expect(subject.rdsSecurityGroupId).toBeDefined();
    expect(subject.rdsEndpoint).toBeDefined();
    expect(subject.bucketName).toBeTruthy();
  });

  test('falls back to dev suffix when environment suffix is empty', () => {
    const { stack } = createStack('DefaultSuffixStack');
    const subject = new CloudSetupStack(stack, 'DefaultSubject', {
      domainName: 'defaults.example.com',
      environmentSuffix: '',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'dev' }),
      ]),
    }));
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: `cloud-setup-dev-${Math.floor(FIXED_NOW / 1000)}`,
    });

    expect(subject.lambdaFunctionName).toBeDefined();
  });

  test('creates HTTP listener when no certificate ARN is provided', () => {
    const { stack } = createStack('HttpListenerStack');
    new CloudSetupStack(stack, 'HttpSubject', {
      domainName: 'nocert.example.com',
      environmentSuffix: 'http',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('omits CloudFront aliases when no certificate ARN is supplied', () => {
    const { stack } = createStack('EdgeDefaults');
    new CloudSetupStack(stack, 'EdgeSubject', {
      domainName: 'edge.example.com',
      environmentSuffix: 'edge',
    });

    const template = Template.fromStack(stack);
    const distributions = template.findResources('AWS::CloudFront::Distribution');
    const distribution = Object.values(distributions)[0] as any;
    expect(
      distribution.Properties.DistributionConfig.Aliases
    ).toBeUndefined();
  });
});

describe('TapStack', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('synthesizes outputs for the embedded CloudSetup construct', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStackUnderTest', {
      environmentSuffix: 'stage',
    });

    const template = Template.fromStack(stack);
    const outputs = template.toJSON().Outputs;
    expect(outputs).toHaveProperty('UsEastVpcId');
    expect(outputs).toHaveProperty('UsEastRdsEndpoint');
    expect(outputs).toHaveProperty('UsEastBucketName');
    expect(outputs).toHaveProperty('UsEastAlbDns');
    expect(outputs).toHaveProperty('UsEastCloudFrontUrl');
    expect(outputs).toHaveProperty('UsEastLambdaFunctionName');
    expect(outputs).toHaveProperty('UsEastLambdaLogGroup');
    expect(outputs).toHaveProperty('UsEastRdsSecurityGroupId');
  });

  test('reads environment suffix from context when not provided explicitly', () => {
    const app = new cdk.App();
    app.node.setContext('environmentSuffix', 'contextual');

    const stack = new TapStack(app, 'ContextualStack');
    const child = stack.node.tryFindChild('CloudSetupUsEast1-contextual');
    expect(child).toBeDefined();
  });

  test('forwards existing VPC lookups through to CloudSetupStack', () => {
    const app = new cdk.App();

    const lookupSpy = jest
      .spyOn(ec2.Vpc, 'fromLookup')
      .mockImplementation((scope, _id, options) =>
        new ec2.Vpc(scope as Construct, `LookupVpc-${options.vpcId}`, {
          ipAddresses: ec2.IpAddresses.cidr('10.2.0.0/16'),
          maxAzs: 2,
          natGateways: 1,
        })
      );

    new TapStack(app, 'TapStackWithExisting', {
      environmentSuffix: 'reuse',
      existingVpcId: 'vpc-lookup-001',
    });

    expect(lookupSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringMatching(/^existing-vpc-/),
      expect.objectContaining({ vpcId: 'vpc-lookup-001' })
    );
  });

  test('falls back to dev suffix when neither props nor context provide value', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'DefaultTapStack');
    const child = stack.node.tryFindChild('CloudSetupUsEast1-dev');
    expect(child).toBeDefined();
  });
});

describe('TapStack branch coverage with mocked CloudSetupStack', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    jest.dontMock('../lib/cloud-setup-stack');
  });

  test('falls back to empty outputs and emits WAF skipped note when child reports it', () => {
    jest.resetModules();
    jest.doMock('../lib/cloud-setup-stack', () => {
      const { Construct } = require('constructs');
      class StubCloudSetup extends Construct {
        public readonly vpcId = 'vpc-123456';
        public readonly wafWasSkipped = true;
        public readonly rdsEndpoint = undefined;
        public readonly bucketName = undefined;
        public readonly albDns = undefined;
        public readonly cloudFrontUrl = undefined;
        public readonly lambdaFunctionName = undefined;
        public readonly lambdaLogGroupName = undefined;
        public readonly rdsSecurityGroupId = undefined;
        constructor(scope: Construct, id: string) {
          super(scope, id);
        }
      }
      return { CloudSetupStack: StubCloudSetup };
    });

    jest.isolateModules(() => {
      const cdk = require('aws-cdk-lib');
      const { Template } = require('aws-cdk-lib/assertions');
      const { TapStack: MockedTapStack } = require('../lib/tap-stack');

      jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
      const app = new cdk.App();
      const stack = new MockedTapStack(app, 'MockedTapStack');
      const template = Template.fromStack(stack);
      const outputs = template.toJSON().Outputs;

      expect(outputs).toHaveProperty('UsEastRdsEndpoint', {
        Value: '',
      });
      expect(outputs).toHaveProperty('UsEastBucketName', {
        Value: '',
      });
      expect(outputs).toHaveProperty('UsEastVpcId', {
        Value: 'vpc-123456',
      });
    });
  });
});
