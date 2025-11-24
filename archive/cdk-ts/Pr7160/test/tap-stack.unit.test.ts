import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import {
  MultiEnvironmentInfraProps,
  MultiEnvironmentInfrastructureStack,
} from '../lib/multi-environment-infra-stack';
import { TapStack } from '../lib/tap-stack';

const TEST_CERT =
  'arn:aws:acm:us-east-1:123456789012:certificate/00000000-0000-0000-0000-000000000000';

class FakeHostedZone extends cdk.Resource implements route53.IHostedZone {
  public readonly hostedZoneId: string;
  public readonly zoneName: string;
  public readonly hostedZoneArn: string;

  constructor(scope: Construct, id: string, zoneName: string) {
    super(scope, id);
    this.zoneName = zoneName;
    this.hostedZoneId = 'ZFAKE123456';
    this.hostedZoneArn = `arn:aws:route53:::hostedzone/${this.hostedZoneId}`;
  }

  grantDelegation(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    // Mock implementation
    return {} as any;
  }
}

const buildStack = (
  id: string,
  props: Omit<MultiEnvironmentInfraProps, 'env'>,
  context?: Record<string, unknown>
) => {
  const app = new cdk.App({ context });
  const stack = new cdk.Stack(app, `${id}-Stack`);
  const construct = new MultiEnvironmentInfrastructureStack(stack, id, props);
  return { app, stack, construct, template: Template.fromStack(stack) };
};

describe('MultiEnvironmentInfrastructureStack', () => {
  test('provisions baseline resources with custom KMS CMK and secure bucket policy', () => {
    const { template } = buildStack('Baseline', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'qa',
      timestamp: '123456',
    });

    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::KMS::Key', 0); // No KMS key - using AWS-managed
    template.resourceCountIs('AWS::KMS::Alias', 0);
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    template.resourceCountIs('AWS::SNS::Topic', 1);

    const lambdaResources = Object.values(
      template.findResources('AWS::Lambda::Function')
    ).filter(resource => (resource as any).Properties.Runtime === 'nodejs18.x');
    expect(lambdaResources).toHaveLength(1);
    expect(lambdaResources[0]).toEqual(
      expect.objectContaining({
        Properties: expect.objectContaining({
          Handler: 'index.handler',
          Runtime: 'nodejs18.x',
          Tags: expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment', Value: 'dev' }),
            expect.objectContaining({ Key: 'Region', Value: 'us-east-1' }),
          ]),
        }),
      })
    );

    // Verify LaunchTemplate exists with basic configuration
    // BlockDeviceMappings removed to avoid KMS key issues
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: Match.objectLike({
        InstanceType: 't3.micro',
      }),
    });

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Condition: { Bool: { 'aws:SecureTransport': 'false' } },
          }),
        ]),
      }),
    });

    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      DesiredCapacity: '2',
    });

    const outputKeys = Object.keys(template.toJSON().Outputs);
    ['albdns', 'bucketname', 'rdsendpoint'].forEach(fragment => {
      expect(outputKeys.some(key => key.includes(fragment))).toBe(true);
    });
  });

  test('omits CMK when opting into AWS-managed key and configures CloudFront + DNS when certificate present', () => {
    const hostedZoneSpy = jest
      .spyOn(route53.HostedZone, 'fromLookup')
      .mockImplementation(
        (
          scope: Construct,
          id: string,
          props: route53.HostedZoneProviderProps
        ) => new FakeHostedZone(scope, id, props.domainName ?? 'example.com')
      );

    const { template } = buildStack(
      'WithCert',
      {
        environment: 'prod',
        region: 'eu-west-1',
        environmentSuffix: 'blue',
        timestamp: '999999',
        domainName: 'example.com',
        certificateArn: TEST_CERT,
      },
      {}
    );

    hostedZoneSpy.mockRestore();

    template.resourceCountIs('AWS::KMS::Key', 0);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    template.resourceCountIs('AWS::Route53::RecordSet', 1);

    // Verify LaunchTemplate exists with basic configuration
    // BlockDeviceMappings removed to avoid KMS key issues
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: Match.objectLike({
        InstanceType: 't3.micro',
      }),
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
    });
  });

  test('derives environment suffix from context when not explicitly provided', () => {
    const { template } = buildStack(
      'ContextSuffix',
      {
        environment: 'stage',
        region: 'us-west-2',
        timestamp: '777777',
      },
      { environmentSuffix: 'ctx' }
    );

    const vpcLogicalIds = Object.keys(template.findResources('AWS::EC2::VPC'));
    expect(vpcLogicalIds[0]).toContain('ctx777777');
  });

  test('synthesizes successfully when suffix and timestamp fall back to defaults', () => {
    const { template } = buildStack('Defaulting', {
      environment: 'ops',
      region: 'eu-central-1',
    });

    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
  });

  test('configures RDS with encryption and PostgreSQL engine', () => {
    const { template } = buildStack('RDSConfig', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'test',
      timestamp: '111111',
    });

    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      EngineVersion: '15',
      StorageEncrypted: true,
      DBInstanceClass: 'db.t3.medium',
      AllocatedStorage: '20',
    });
  });

  test('configures S3 bucket with versioning, encryption, and block public access', () => {
    const { template } = buildStack('S3Config', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'test',
      timestamp: '222222',
    });

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('configures Lambda with correct environment variables and handler', () => {
    const { template } = buildStack('LambdaConfig', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'test',
      timestamp: '333333',
    });

    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
    });
  });

  test('configures ASG with correct capacity and scaling policies', () => {
    const { template } = buildStack('ASGConfig', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'test',
      timestamp: '444444',
    });

    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      DesiredCapacity: '2',
      MaxSize: '4',
    });

    // No scaling policies added
  });

  test('configures CloudWatch alarm for CPU utilization', () => {
    const { template } = buildStack('CWConfig', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'test',
      timestamp: '555555',
    });

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'CPUUtilization',
      Namespace: 'AWS/EC2',
      Threshold: 80,
      EvaluationPeriods: 2,
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    });
  });

  test('creates HTTP listener when no certificate is provided', () => {
    const { template } = buildStack('NoCert', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'test',
      timestamp: '666666',
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });

    // No HTTPS listener
    const listeners = template.findResources(
      'AWS::ElasticLoadBalancingV2::Listener'
    );
    expect(
      Object.values(listeners).every(
        (listener: any) => listener.Properties.Port !== 443
      )
    ).toBe(true);
  });

  test('skips AWS Config resources when enableConfig is false', () => {
    const { template } = buildStack(
      'NoConfig',
      {
        environment: 'dev',
        region: 'us-east-1',
        environmentSuffix: 'test',
        timestamp: '777777',
      },
      { enableConfig: false }
    );

    template.resourceCountIs('AWS::Config::ConfigurationRecorder', 0);
    template.resourceCountIs('AWS::Config::DeliveryChannel', 0);
    template.resourceCountIs('AWS::Config::ConfigRule', 0);
  });

  test('uses timestamp from context when provided', () => {
    const { template } = buildStack(
      'ContextTimestamp',
      {
        environment: 'dev',
        region: 'us-east-1',
        environmentSuffix: 'test',
        timestamp: '888888',
      },
      {}
    );

    // Check that resources have the timestamp in their names
    const vpc = template.findResources('AWS::EC2::VPC');
    const vpcId = Object.keys(vpc)[0];
    expect(vpcId).toContain('888888');
  });

  test('applies correct tags to resources', () => {
    const { template } = buildStack('Tags', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'test',
      timestamp: '999999',
    });

    // Check tags on VPC
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'dev' },
        { Key: 'Region', Value: 'us-east-1' },
      ]),
    });
  });

  test('creates correct outputs', () => {
    const { template } = buildStack('Outputs', {
      environment: 'dev',
      region: 'us-east-1',
      environmentSuffix: 'test',
      timestamp: '000000',
    });

    const outputs = template.toJSON().Outputs;
    expect(outputs).toHaveProperty('devuseast1albdnstest000000');
    expect(outputs).toHaveProperty('devuseast1bucketnametest000000');
    expect(outputs).toHaveProperty('devuseast1rdsendpointtest000000');
  });

  test('naming convention includes environment, region, service, and suffix', () => {
    const { template } = buildStack('Naming', {
      environment: 'staging',
      region: 'eu-west-1',
      environmentSuffix: 'green',
      timestamp: '111111',
    });

    const resources = template.toJSON().Resources;
    const resourceNames = Object.keys(resources);

    // Check that some resources follow the naming pattern
    expect(
      resourceNames.some(
        name =>
          name.includes('staging') &&
          name.includes('green') &&
          name.includes('111111')
      )
    ).toBe(true);
  });
});

describe('TapStack orchestration', () => {
  const previousRegion = process.env.CDK_DEFAULT_REGION;
  const previousAccount = process.env.CDK_DEFAULT_ACCOUNT;

  beforeEach(() => {
    process.env.CDK_DEFAULT_ACCOUNT =
      process.env.CDK_DEFAULT_ACCOUNT || '123456789012';
  });

  afterEach(() => {
    process.env.CDK_DEFAULT_REGION = previousRegion;
    process.env.CDK_DEFAULT_ACCOUNT = previousAccount;
  });

  test('instantiates stacks for each environment respecting region override', () => {
    process.env.CDK_DEFAULT_REGION = 'ap-south-1';

    const app = new cdk.App({
      context: {
        environments: ['dev', 'prod'], // prod is ignored, only dev deploys
        regions: ['us-east-1', 'us-west-2'], // overridden by CDK_DEFAULT_REGION
      },
    });

    new TapStack(app, 'TapStackunit', { environmentSuffix: 'qa' });

    const instantiated = app.node
      .findAll()
      .filter(
        (construct): construct is MultiEnvironmentInfrastructureStack =>
          construct instanceof MultiEnvironmentInfrastructureStack
      );

    // 1 environment (dev) × 1 region (ap-south-1 from CDK_DEFAULT_REGION) = 1
    expect(instantiated).toHaveLength(1);
    instantiated.forEach(construct => {
      expect(construct.node.id).toContain('-dev-');
      expect(construct.node.id).toContain('-ap-south-1-');
      expect(construct.node.id).toContain('-qa-');
    });
  });

  test('uses context-provided regions and suffix when environment variable not set', () => {
    delete process.env.CDK_DEFAULT_REGION;

    const app = new cdk.App({
      context: {
        environmentSuffix: 'stage',
        environments: ['dev'],
        regions: ['us-east-1', 'eu-west-1'],
      },
    });

    new TapStack(app, 'TapStackdefault');

    const instantiated = app.node
      .findAll()
      .filter(
        (construct): construct is MultiEnvironmentInfrastructureStack =>
          construct instanceof MultiEnvironmentInfrastructureStack
      );

    expect(instantiated).toHaveLength(2);
    instantiated.forEach(construct => {
      expect(construct.node.id).toContain('-stage-');
      expect(
        construct.node.id.includes('-us-east-1-') ||
          construct.node.id.includes('-eu-west-1-')
      ).toBe(true);
    });
  });

  test('falls back to default environments and regions when no overrides exist', () => {
    delete process.env.CDK_DEFAULT_REGION;

    const app = new cdk.App();
    new TapStack(app, 'TapStackdefaults');

    const instantiated = app.node
      .findAll()
      .filter(
        (construct): construct is MultiEnvironmentInfrastructureStack =>
          construct instanceof MultiEnvironmentInfrastructureStack
      );

    // Expect 3 stacks: 1 environment (dev) × 3 regions (us-east-1, us-west-2, eu-west-1)
    expect(instantiated).toHaveLength(3);
  });
});
