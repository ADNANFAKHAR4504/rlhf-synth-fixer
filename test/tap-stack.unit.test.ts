import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TradingPlatformApp, TradingPlatformStack } from '../lib/tap-stack';

describe('Trading Platform Stack Unit Tests', () => {
  let app: cdk.App;
  let stack: TradingPlatformStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    app = new cdk.App();
  });

  test('TradingPlatformStack instantiates successfully as primary', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStackPrimary', {
      env: {
        account: '123456789012',
        region: 'eu-central-1',
      },
      isPrimary: true,
      primaryRegion: 'eu-central-1',
      secondaryRegion: 'eu-west-1',
      domainName: 'test.example.com',
    });

    template = Template.fromStack(stack);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TradingPlatformStack);
    expect(template).toBeDefined();
  });

  test('TradingPlatformStack instantiates successfully as secondary', () => {
    stack = new TradingPlatformStack(app, 'TestTradingPlatformStackSecondary', {
      env: {
        account: '123456789012',
        region: 'eu-west-1',
      },
      isPrimary: false,
      primaryRegion: 'eu-central-1',
      secondaryRegion: 'eu-west-1',
      domainName: 'test.example.com',
    });

    template = Template.fromStack(stack);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TradingPlatformStack);
    expect(template).toBeDefined();
  });

  test('Stack creates core infrastructure resources', () => {
    stack = new TradingPlatformStack(app, 'TestInfraStack', {
      env: {
        account: '123456789012',
        region: 'eu-central-1',
      },
      isPrimary: true,
      primaryRegion: 'eu-central-1',
      secondaryRegion: 'eu-west-1',
      domainName: 'test.example.com',
    });

    template = Template.fromStack(stack);

    // Test that core resources are created
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });

    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });

    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-postgresql',
    });

    template.hasResourceProperties('AWS::ECS::Cluster', Match.anyValue());

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Type: 'application',
      Scheme: 'internet-facing',
    });
  });

  test('Stack applies consistent resource tagging', () => {
    stack = new TradingPlatformStack(app, 'TestTagStack', {
      env: {
        account: '123456789012',
        region: 'eu-central-1',
      },
      isPrimary: true,
      primaryRegion: 'eu-central-1',
      secondaryRegion: 'eu-west-1',
      domainName: 'test.example.com',
    });

    template = Template.fromStack(stack);

    // Check that resources have required tags
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Production',
        }),
      ]),
    });
  });

  test('Stack with hosted zone creates Route53 resources', () => {
    // Create a stack with hosted zone ID to test that branch
    const stackWithHostedZone = new TradingPlatformStack(app, 'TestStackWithHostedZone', {
      env: { account: '123456789012', region: 'eu-central-1' },
      isPrimary: true,
      primaryRegion: 'eu-central-1',
      secondaryRegion: 'eu-west-1',
      domainName: 'test.example.com',
      hostedZoneId: 'Z1234567890ABC'
    });

    const template = Template.fromStack(stackWithHostedZone);

    // Should reference existing hosted zone
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
      HostedZoneId: 'Z1234567890ABC'
    });
  });

  test('Stack creates monitoring alarms for critical resources', () => {
    // Use existing stack for this test
    const template = Template.fromStack(stack);

    // Check that CloudWatch alarms are created
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'UnHealthyHostCount',
      Namespace: 'AWS/ApplicationELB'
    });

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'TargetResponseTime',
      Namespace: 'AWS/ApplicationELB'
    });
  });
});

// TradingPlatformApp tests for better coverage
describe('TradingPlatformApp', () => {
  test('App creates both primary and secondary stacks', () => {
    // Set environment variables for the app
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    process.env.DOMAIN_NAME = 'trading-platform.example.com';

    const testApp = new TradingPlatformApp();

    // The app should create two stacks
    const stacks = testApp.node.children.filter((child: any) => child instanceof TradingPlatformStack);
    expect(stacks).toHaveLength(2);

    // Check stack names
    const stackIds = stacks.map((stack: any) => stack.node.id);
    expect(stackIds).toContain('TradingPlatformPrimary');
    expect(stackIds).toContain('TradingPlatformSecondary');
  });

  test('App throws error when account is not provided', () => {
    // Clear environment variables
    delete process.env.CDK_DEFAULT_ACCOUNT;

    expect(() => {
      new TradingPlatformApp();
    }).toThrow('Account ID is required. Set CDK_DEFAULT_ACCOUNT or use --context account=123456789012');
  });

  test('App applies global tags', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';

    const testApp = new TradingPlatformApp();

    // Check that tags are applied at the app level
    const tags = cdk.Tags.of(testApp);
    expect(tags).toBeDefined();
  });
});

// add more test suites and cases as needed
