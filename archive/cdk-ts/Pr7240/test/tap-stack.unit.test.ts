import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { FailureRecoveryInfrastructure } from '../lib/failure-recovery-infrastructure';
import { MultiRegionDns } from '../lib/multi-region-dns';
import { TapStack } from '../lib/tap-stack';

const createStack = (id: string = 'TestStack', env?: cdk.Environment) => {
  const app = new cdk.App();
  return new cdk.Stack(app, id, { env });
};

describe('FailureRecoveryInfrastructure', () => {
  test('configures networking, security, and encryption resources', () => {
    const stack = createStack();

    new FailureRecoveryInfrastructure(stack, 'Infra', {
      environmentSuffix: 'blue',
      domainName: 'contoso.com',
      enableRoute53: false,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
      CidrBlock: '10.0.0.0/16',
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Environment', Value: 'blue' }),
        Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
      ]),
    }));

    template.resourceCountIs('AWS::KMS::Key', 2);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for Application Load Balancer',
    });
  });

  test('creates log bucket, lambda processor, database, and autoscaling resources', () => {
    const stack = createStack('InfraStack');

    new FailureRecoveryInfrastructure(stack, 'Infra', {
      environmentSuffix: 'green',
      domainName: 'contoso.com',
    });

    const template = Template.fromStack(stack);

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
      LifecycleConfiguration: Match.anyValue(),
      VersioningConfiguration: { Status: 'Enabled' },
    }));

    template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          LOG_BUCKET: Match.anyValue(),
          ENVIRONMENT: 'green',
        }),
      }),
    }));

    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: Match.stringLikeRegexp('mysql'),
      MultiAZ: true,
      StorageEncrypted: true,
    }));

    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', Match.objectLike({
      MinSize: '2',
      MaxSize: '10',
      DesiredCapacity: '2',
      LaunchTemplate: Match.anyValue(),
    }));

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', Match.objectLike({
      Scheme: 'internet-facing',
      Type: 'application',
    }));
  });

  test('optionally configures Route53 DNS when enabled', () => {
    const stack = createStack('DnsStack', { region: 'us-east-1', account: '000000000000' });

    const infra = new FailureRecoveryInfrastructure(stack, 'Infra', {
      environmentSuffix: 'dns',
      domainName: 'example.net',
      enableRoute53: true,
      createHostedZone: true,
      applicationSubdomain: 'app',
    });

    const template = Template.fromStack(stack);
    expect(infra.dns).toBeInstanceOf(MultiRegionDns);

    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'example.net.',
    });

    template.hasResourceProperties('AWS::Route53::HealthCheck', Match.objectLike({
      HealthCheckConfig: Match.objectLike({
        FullyQualifiedDomainName: Match.anyValue(),
        Type: 'HTTPS',
      }),
    }));
  });

  test('adds SNS email subscription when custom alert address provided', () => {
    const stack = createStack('AlertStack');

    new FailureRecoveryInfrastructure(stack, 'Infra', {
      environmentSuffix: 'alert',
      domainName: 'contoso.com',
      alertEmail: 'ops@contoso.com',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SNS::Subscription', Match.objectLike({
      Protocol: 'email',
      Endpoint: 'ops@contoso.com',
    }));
  });

  test('skips ACM certificate setup for default domain', () => {
    const stack = createStack('DefaultDomainStack');

    new FailureRecoveryInfrastructure(stack, 'Infra', {
      environmentSuffix: 'default',
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
  });
});

describe('MultiRegionDns', () => {
  const buildAlb = (scope: Construct) => {
    const vpc = new ec2.Vpc(scope, 'DnsVpc', { ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16') });
    return new elbv2.ApplicationLoadBalancer(scope, 'DnsAlb', {
      vpc,
      internetFacing: true,
    });
  };

  test('creates hosted zone and failover record in primary region', () => {
    const stack = createStack('DnsPrimary', { region: 'us-east-1', account: '000000000000' });

    new MultiRegionDns(stack, 'Dns', {
      environmentSuffix: 'primary',
      primaryRegion: 'us-east-1',
      domainName: 'contoso.net',
      applicationSubdomain: 'api',
      primaryAlb: buildAlb(stack),
      createHostedZone: true,
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'contoso.net.',
    });

    template.hasResourceProperties('AWS::Route53::RecordSet', Match.objectLike({
      Name: 'api.contoso.net.',
      Failover: 'PRIMARY',
    }));
  });

  test('emits instructions output when hosted zone lookup fails', () => {
    const stack = createStack('DnsFallback', { region: 'us-west-2', account: '000000000000' });

    const lookupSpy = jest
      .spyOn(route53.HostedZone, 'fromLookup')
      .mockImplementation(() => {
        throw new Error('not found');
      });

    const alb = buildAlb(stack);
    try {
      new MultiRegionDns(stack, 'Dns', {
        environmentSuffix: 'fallback',
        primaryRegion: 'us-west-2',
        domainName: 'fallback.net',
        primaryAlb: alb,
        createHostedZone: false,
      });

      const template = Template.fromStack(stack);

      const outputs = template.toJSON().Outputs;
      const instructionKey = Object.keys(outputs).find(key =>
        key.includes('Route53SetupInstructions')
      );
      expect(instructionKey).toBeDefined();
      expect(outputs[instructionKey!].Value).toContain('fallback.net');
    } finally {
      lookupSpy.mockRestore();
    }
  });

  test('skips hosted zone creation when stack region is secondary', () => {
    const stack = createStack('SecondaryRegion', { region: 'eu-west-1', account: '000000000000' });
    const alb = buildAlb(stack);

    new MultiRegionDns(stack, 'Dns', {
      environmentSuffix: 'secondary',
      primaryRegion: 'us-east-1',
      domainName: 'secondary.net',
      applicationSubdomain: 'app',
      primaryAlb: alb,
      createHostedZone: true,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Route53::HostedZone', 0);
    template.resourceCountIs('AWS::Route53::RecordSet', 0);
  });

  test('uses existing hosted zone when lookup succeeds', () => {
    const stack = createStack('LookupSuccess', { region: 'us-east-1', account: '000000000000' });
    const existingZone = route53.HostedZone.fromHostedZoneAttributes(stack, 'ExistingZone', {
      hostedZoneId: 'Z123456',
      zoneName: 'lookup.net',
    });
    const lookupSpy = jest
      .spyOn(route53.HostedZone, 'fromLookup')
      .mockReturnValue(existingZone);

    const alb = buildAlb(stack);
    try {
      new MultiRegionDns(stack, 'Dns', {
        environmentSuffix: 'lookup',
        primaryRegion: 'us-east-1',
        domainName: 'lookup.net',
        primaryAlb: alb,
        createHostedZone: false,
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Route53::RecordSet', Match.objectLike({
        Name: 'lookup.net.',
        Failover: 'PRIMARY',
      }));
    } finally {
      lookupSpy.mockRestore();
    }
  });

  test('sets record failover to secondary in non-primary region when zone exists', () => {
    const stack = createStack('SecondaryLookup', { region: 'eu-west-1', account: '000000000000' });
    const importedZone = route53.HostedZone.fromHostedZoneAttributes(stack, 'ImportedZone', {
      hostedZoneId: 'Z7654321',
      zoneName: 'secondary.net',
    });
    const lookupSpy = jest
      .spyOn(route53.HostedZone, 'fromLookup')
      .mockReturnValue(importedZone);

    const alb = buildAlb(stack);
    try {
      new MultiRegionDns(stack, 'Dns', {
        environmentSuffix: 'secondary',
        primaryRegion: 'us-east-1',
        domainName: 'secondary.net',
        primaryAlb: alb,
        createHostedZone: false,
      });

      const template = Template.fromStack(stack);
      const records = template.findResources('AWS::Route53::RecordSet');
      const record = Object.values(records)[0] as any;
      expect(record.Properties.Failover).toBe('SECONDARY');
    } finally {
      lookupSpy.mockRestore();
    }
  });
});

describe('TapStack', () => {
  test('instantiates failure recovery infrastructure with provided suffix', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStack', {
      environmentSuffix: 'purple',
    });

    const infra = stack.node.tryFindChild('FailureRecoveryInfrastructure');
    expect(infra).toBeInstanceOf(FailureRecoveryInfrastructure);
  });

  test('applies environment tags from context when suffix not provided', () => {
    const app = new cdk.App({
      context: { environmentSuffix: 'contextual' },
    });

    const stack = new TapStack(app, 'ContextualTapStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Environment', Value: 'contextual' }),
      ]),
    }));
  });

  test('falls back to dev suffix when neither props nor context provide value', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'DefaultSuffixStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Environment', Value: 'dev' }),
      ]),
    }));
  });
});
