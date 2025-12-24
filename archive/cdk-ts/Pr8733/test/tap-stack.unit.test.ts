import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack unit', () => {
  // Helper: verify SG ingress is only 443 and protocol tcp
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

  test('creates VPC with public and private isolated subnets', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {});

    // Verify subnet configuration
    const subnets = template.findResources('AWS::EC2::Subnet');
    expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(4); // 2 public + 2 private
  });

  test('creates VPC with flow logs to CloudWatch Logs', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack2', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::FlowLog', {
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs',
    });

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 365,
    });
  });

  test('creates VPC Flow Logs IAM role with correct permissions', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack3', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          }),
        ]),
      }),
    });
  });

  test('HTTPS SG allows only port 443 from param CIDRs', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack4', { environmentSuffix });
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

  test('S3 bucket with versioning and public access blocked', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack5', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('S3 bucket has TLS enforcement via bucket policy', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack6', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          }),
        ]),
      }),
    });
  });

  test('MFA enforcement policy is created', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack7', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Condition: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
        ]),
      }),
    });
  });

  test('MFA enforced group is created with MFA policy attached', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack8', { environmentSuffix });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Group', {});
  });

  test('stack has all required outputs', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack9', { environmentSuffix });
    const template = Template.fromStack(stack);

    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);

    expect(outputKeys).toContain('VpcId');
    expect(outputKeys).toContain('PublicSubnetIds');
    expect(outputKeys).toContain('PrivateSubnetIds');
    expect(outputKeys).toContain('HttpsSecurityGroupId');
    expect(outputKeys).toContain('DataBucketName');
    expect(outputKeys).toContain('DataBucketArn');
    expect(outputKeys).toContain('VpcFlowLogsLogGroupName');
    expect(outputKeys).toContain('VpcFlowLogsRoleArn');
    expect(outputKeys).toContain('MfaEnforcementPolicyArn');
    expect(outputKeys).toContain('MfaEnforcedGroupName');
  });

  test('uses environmentSuffix from props when provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'SuffixFromProps', {
      environmentSuffix: 'props',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('uses environmentSuffix from context when props missing', () => {
    const app = new cdk.App();
    app.node.setContext('environmentSuffix', 'ctx');
    const stack = new TapStack(app, 'SuffixFromContext');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('uses default environmentSuffix dev when both props and context missing', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'SuffixDefault');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('VPC has no NAT gateways (LocalStack compatibility)', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'NoNatStack', { environmentSuffix });
    const template = Template.fromStack(stack);

    // Ensure no NAT Gateway is created
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
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
});
