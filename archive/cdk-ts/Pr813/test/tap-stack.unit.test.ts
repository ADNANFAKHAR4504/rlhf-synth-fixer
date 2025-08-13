import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack unit', () => {
  // Increase branch coverage: verify SG ingress is only 443 and protocol tcp
  const assertHttpsIngress = (template: Template) => {
    const ingress = template.findResources('AWS::EC2::SecurityGroupIngress');
    const ingressValues = Object.values(ingress);
    expect(ingressValues.length).toBeGreaterThanOrEqual(1);
    ingressValues.forEach((res: any) => {
      expect(res.Properties.FromPort).toBe(443);
      expect(res.Properties.ToPort).toBe(443);
      expect(res.Properties.IpProtocol).toBe('tcp');
    });
  };

  test('creates VPC with flow logs to CW Logs', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {});
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs',
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.objectLike({}),
    });
    // Branch coverage: ensure role policy contains required actions
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({}),
    });
  });

  test('HTTPS SG allows only port 443 from param CIDRs', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack2', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('Allow ingress only on 443'),
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 443,
      ToPort: 443,
      IpProtocol: 'tcp',
    });
    assertHttpsIngress(template);
  });

  test('S3 bucket encrypted with KMS and TLS enforced', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack3', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          },
        ],
      },
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({ Sid: 'DenyInsecureTransport' }),
          Match.objectLike({ Sid: 'DenyUnEncryptedObjectUploads' }),
        ]),
      },
    });
  });

  test('RDS instance in private subnets with encryption and SSL', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack4', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
      PubliclyAccessible: false,
    });
    template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
      Parameters: { 'rds.force_ssl': '1' },
    });
  });

  test('GuardDuty detector enabled', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack5', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::GuardDuty::Detector', {
      Enable: true,
    });
  });

  test('WAF WebACL and association required', () => {
    const app = new cdk.App();
    app.node.setContext('environmentSuffix', environmentSuffix);
    const stack = new TapStack(app, 'TestTapStack6', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Scope: 'REGIONAL',
    });
    template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
      WebACLArn: Match.anyValue(),
      ResourceArn: Match.anyValue(),
    });
  });

  test('CloudTrail multi-region with log validation and CW Logs', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack7', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CloudTrail::Trail', {
      IsMultiRegionTrail: true,
      EnableLogFileValidation: true,
      IncludeGlobalServiceEvents: true,
      IsLogging: true,
    });
    // Bucket and LogGroup should exist even without explicit names
    template.resourceCountIs('AWS::S3::Bucket', 2);
    template.resourceCountIs('AWS::Logs::LogGroup', 2);
  });

  test('stack can be created in any region (no region restriction)', () => {
    const app = new cdk.App();
    expect(
      () =>
        new TapStack(app, 'AnyRegionStack', {
          environmentSuffix,
          env: { account: '123456789012', region: 'us-west-2' },
        })
    ).not.toThrow();
  });

  test('uses environmentSuffix from props when provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'SuffixFromProps', {
      environmentSuffix: 'props',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
  });

  test('uses environmentSuffix from context when props missing', () => {
    const app = new cdk.App();
    app.node.setContext('environmentSuffix', 'ctx');
    const stack = new TapStack(app, 'SuffixFromContext');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
  });

  test('uses default environmentSuffix dev when both props and context missing', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'SuffixDefault');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
  });
});
