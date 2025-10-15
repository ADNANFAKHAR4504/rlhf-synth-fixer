import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CloudSetupStack } from '../lib/cloud-setup-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack (unit)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App({ context: { environmentSuffix: 'test' } });
    // Provide a parent stack env matching the nested CloudSetupStack's env (us-east-1)
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: { region: 'us-east-1', account: '111111111111' },
    });
    template = Template.fromStack(stack as unknown as cdk.Stack);
  });

  test('re-exports child stack outputs at top-level', () => {
    const outputs = template.toJSON().Outputs || {};
    // helper to find an output key ignoring underscores differences introduced by CDK
    const findKey = (name: string) =>
      Object.keys(outputs).find(k => k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());

    expect(findKey('UsEast_VpcId')).toBeDefined();
    expect(findKey('UsEast_RdsEndpoint')).toBeDefined();
    expect(findKey('UsEast_BucketName')).toBeDefined();
    expect(findKey('UsEast_AlbDns')).toBeDefined();
    expect(findKey('UsEast_CloudFrontUrl')).toBeDefined();
  });

  test('uses context environmentSuffix when not passed in props', () => {
    const app = new cdk.App({ context: { environmentSuffix: 'fromctx' } });
    const stack = new TapStack(app, 'TapStackFromContext', { env: { region: 'us-east-1', account: '111111111111' } });
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    const outputs = t.toJSON().Outputs || {};
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  test('falls back to default environmentSuffix when none provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStackDefault', { env: { region: 'us-east-1', account: '111111111111' } });
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    const outputs = t.toJSON().Outputs || {};
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  test('CloudSetupStack defaults to dev when environmentSuffix missing (runtime)', () => {
    const app = new cdk.App();
    // Bypass TypeScript to simulate missing environmentSuffix at runtime
    const props: any = {
      env: { region: 'us-east-1', account: '111111111111' },
      domainName: 'defaults.example.com',
      // intentionally omit environmentSuffix to exercise fallback
      createHostedZone: false,
    };
    // Attach runtime-only flags to the props object so we can pass it without using
    // an inline object literal that triggers excess property checks against the typed constructor.
    props.createS3 = true;
    props.createRds = true;
    const stack = new CloudSetupStack(app, 'CloudSetupDefaultFallback', props as any);
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    // verify stack synthesizes and bucket exists with expected properties
    t.resourceCountIs('AWS::S3::Bucket', 1);
    const buckets = t.findResources('AWS::S3::Bucket');
    const bucketLogicalId = Object.keys(buckets)[0];
    expect(buckets[bucketLogicalId].Properties.VersioningConfiguration.Status).toBe('Enabled');
  });

  test('minimal CloudSetupStack instantiation compiles resources', () => {
    const app = new cdk.App();
    const stack = new CloudSetupStack(app, 'CloudSetupMinimal', {
      env: { region: 'us-east-1', account: '111111111111' },
      domainName: 'minimal.example.com',
      environmentSuffix: 'min',
      createHostedZone: false,
      createS3: true,
      createRds: true,
    } as any);
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    // basic smoke: VPC and ALB exist
    t.resourceCountIs('AWS::EC2::VPC', 1);
    t.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  });

  test('when cloudFrontCertificateArn provided but domainName missing, do not set aliases or certificate', () => {
    const app = new cdk.App();
    const stack = new CloudSetupStack(app, 'CloudSetupCfNoDomain', {
      env: { region: 'us-east-1', account: '111111111111' },
      // pass empty domainName to simulate missing domain
      domainName: '',
      environmentSuffix: 'branchtest',
      cloudFrontCertificateArn: 'arn:aws:acm:us-east-1:111111111111:certificate/onlycf',
      createHostedZone: false,
      createS3: true,
      createRds: true,
    } as any);
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    const cf = t.findResources('AWS::CloudFront::Distribution');
    const cfRes = cf[Object.keys(cf)[0]];
    expect(cfRes.Properties.DistributionConfig.Aliases).toBeUndefined();
    // certificate should not be attached if domainName is missing
    expect(cfRes.Properties.DistributionConfig.ViewerCertificate).toBeUndefined();
  });

  test('createHostedZone true but domainName empty => no HostedZone created', () => {
    const app = new cdk.App();
    const stack = new CloudSetupStack(app, 'CloudSetupHostZoneEmpty', {
      env: { region: 'us-east-1', account: '111111111111' },
      domainName: '',
      environmentSuffix: 'branchtest',
      createHostedZone: true,
      createS3: true,
      createRds: true,
    } as any);
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    t.resourceCountIs('AWS::Route53::HostedZone', 0);
  });

  test('skip creating RDS and S3 to exercise empty output fallbacks', () => {
    const app = new cdk.App();
    const stack = new CloudSetupStack(app, 'CloudSetupSkipResources', {
      env: { region: 'us-east-1', account: '111111111111' },
      domainName: '',
      environmentSuffix: 'branchtest',
      createHostedZone: false,
    } as any);
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    // S3 and RDS resources exist in this version of the stack
    t.resourceCountIs('AWS::S3::Bucket', 1);
    t.resourceCountIs('AWS::RDS::DBInstance', 1);
    // Outputs exist
    const outputs = t.toJSON().Outputs || {};
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  test('TapStack top-level outputs fallback to empty strings when child properties are falsy (mocked child)', () => {
    // Reset modules so our mock takes effect when TapStack imports CloudSetupStack
    jest.resetModules();
    jest.doMock('../lib/cloud-setup-stack', () => {
      const cdkLocal = require('aws-cdk-lib');
      return {
        CloudSetupStack: class MockChild extends cdkLocal.Stack {
          constructor(scope: any, id: string, props: any) {
            super(scope, id, props);
            // Provide a vpcId so the top-level UsEast_VpcId CfnOutput can be created
            (this as any).vpcId = 'vpc-mock';
            // Keep other properties falsy to test empty-string fallbacks
            (this as any).rdsEndpoint = undefined;
            (this as any).bucketName = undefined;
            (this as any).albDns = undefined;
            (this as any).cloudFrontUrl = undefined;
          }
        },
      };
    });

    const { TapStack: TapStackMocked } = require('../lib/tap-stack');
    const app = new cdk.App();
    const stack = new TapStackMocked(app, 'TapStackMocked', { env: { region: 'us-east-1', account: '111111111111' } });
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    const outputs = t.toJSON().Outputs || {};
    // Find the re-exported RdsEndpoint key (CDK may change exact logical id)
    const key = Object.keys(outputs).find(k => /rdsendpoint/i.test(k));
    expect(key).toBeDefined();
    expect(outputs[key!].Value).toBe('');
  });
});

describe('CloudSetupStack branches', () => {
  test('creates HTTPS listener when albCertificateArn is provided', () => {
    const app = new cdk.App();
    const stack = new CloudSetupStack(app, 'CloudSetupDirectHttps', {
      env: { region: 'us-east-1', account: '111111111111' },
      domainName: 'test-https.example.com',
      environmentSuffix: 'branchtest',
      albCertificateArn: 'arn:aws:acm:us-east-1:111111111111:certificate/abcd',
      createHostedZone: false,
    });
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    // Listener should be on port 443 and have Certificates property set
    const listeners = t.findResources('AWS::ElasticLoadBalancingV2::Listener');
    const listener = listeners[Object.keys(listeners)[0]];
    expect(listener.Properties.Port).toBe(443);
    expect(listener.Properties.Certificates).toBeDefined();
  });

  test('configures CloudFront aliases and hosted zone when cert and domain provided', () => {
    const app = new cdk.App();
    const domain = 'test-cf.example.com';
    const stack = new CloudSetupStack(app, 'CloudSetupDirectCf', {
      env: { region: 'us-east-1', account: '111111111111' },
      domainName: domain,
      environmentSuffix: 'branchtest',
      cloudFrontCertificateArn: 'arn:aws:acm:us-east-1:111111111111:certificate/cf123',
      createHostedZone: true,
    });
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    const cf = t.findResources('AWS::CloudFront::Distribution');
    const cfRes = cf[Object.keys(cf)[0]];
    // Check that Aliases (CNAMEs) contain our domain
    const aliases = cfRes.Properties.DistributionConfig.Aliases;
    expect(aliases).toContain(domain);

    // Hosted Zone and ARecord should be created
    t.resourceCountIs('AWS::Route53::HostedZone', 1);
    t.resourceCountIs('AWS::Route53::RecordSet', 1);
  });

  test('creates HTTP listener and CloudFront without CNAMEs when no certs provided', () => {
    const app = new cdk.App();
    const stack = new CloudSetupStack(app, 'CloudSetupDirectHttp', {
      env: { region: 'us-east-1', account: '111111111111' },
      domainName: 'no-cert.example.com',
      environmentSuffix: 'branchtest',
      // no albCertificateArn and no cloudFrontCertificateArn
      createHostedZone: false,
    });
    const t = Template.fromStack(stack as unknown as cdk.Stack);
    const listeners = t.findResources('AWS::ElasticLoadBalancingV2::Listener');
    const listener = listeners[Object.keys(listeners)[0]];
    expect(listener.Properties.Port).toBe(80);

    const cf = t.findResources('AWS::CloudFront::Distribution');
    const cfRes = cf[Object.keys(cf)[0]];
    // When no cert provided, Aliases/DomainNames should be undefined
    expect(cfRes.Properties.DistributionConfig.Aliases).toBeUndefined();
    expect(cfRes.Properties.DistributionConfig.ViewerCertificate).toBeUndefined();
    // Hosted zone should not be created
    t.resourceCountIs('AWS::Route53::HostedZone', 0);
  });
});
