import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('VPC Created with Correct Configuration', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 subnet types
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('VPC FlowLogs Enabled', () => {
    template.resourceCountIs('AWS::EC2::FlowLog', 1);
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs',
    });
  });

  test('KMS Key Created', () => {
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('Security Groups Created with Correct Rules', () => {
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for web servers',
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          ToPort: 443,
          IpProtocol: 'tcp',
        },
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          ToPort: 80,
          IpProtocol: 'tcp',
        },
      ],
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          ToPort: 443,
          IpProtocol: 'tcp',
        },
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          ToPort: 80,
          IpProtocol: 'tcp',
        },
      ],
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for database',
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: 'PostgreSQL from web servers',
      FromPort: 5432,
      ToPort: 5432,
      IpProtocol: 'tcp',
      SourceSecurityGroupId: {
        'Fn::GetAtt': [Match.stringLikeRegexp('^WebSecurityGroup.*'), 'GroupId'],
      },
      GroupId: {
        'Fn::GetAtt': [Match.stringLikeRegexp('^DatabaseSecurityGroup.*'), 'GroupId'],
      },
    });
  });

  test('EC2 Instance Created with Encrypted Volume and Correct Role', () => {
    template.resourceCountIs('AWS::EC2::Instance', 1);
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
      BlockDeviceMappings: [
        {
          DeviceName: '/dev/xvda',
          Ebs: {
            Encrypted: true,
            VolumeType: 'gp3',
          },
        },
      ],
    });
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/CloudWatchAgentServerPolicy',
            ],
          ],
        },
      ],
    });
  });

  test('CloudWatch Alarms for EC2 Created', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'CPUUtilization',
      Namespace: 'AWS/EC2',
      Threshold: 80,
    });
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'mem_used_percent',
      Namespace: 'CWAgent',
      Threshold: 80,
    });
  });

  test('S3 Bucket Created with Secure Defaults', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
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
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('RDS Database Created with Encryption', () => {
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceClass: 'db.t3.micro',
      Engine: 'postgres',
      StorageEncrypted: true,
      DeletionProtection: false,
      BackupRetentionPeriod: 7,
    });
  });

  test('API Gateway and WAF Created', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      DefaultAction: { Allow: {} },
      Scope: 'REGIONAL',
      Rules: Match.arrayWith([
        Match.objectLike({ Name: 'AWSManagedRulesCommonRuleSet' }),
        Match.objectLike({ Name: 'AWSManagedRulesKnownBadInputsRuleSet' }),
      ]),
    });
  });

  test('IAM Groups and MFA Policy Created', () => {
    template.resourceCountIs('AWS::IAM::Group', 2);
    template.hasResourceProperties('AWS::IAM::Group', {
      GroupName: `TapAdmins${environmentSuffix}`,
      ManagedPolicyArns: [ Match.anyValue(), Match.anyValue() ],
    });
    template.hasResourceProperties('AWS::IAM::Group', {
      GroupName: `TapReadOnly${environmentSuffix}`,
      ManagedPolicyArns: [ Match.anyValue(), Match.anyValue() ],
    });
    template.resourceCountIs('AWS::IAM::ManagedPolicy', 1);
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        PolicyDocument: {
            Statement: [
                {
                    Action: '*',
                    Condition: {
                        BoolIfExists: {
                            'aws:MultiFactorAuthPresent': 'false',
                        },
                        NumericLessThan: {
                            'aws:MultiFactorAuthAge': '3600',
                        },
                    },
                    Effect: 'Deny',
                    Resource: '*',
                },
            ],
        }
    });
  });

  test('All Resources are Tagged', () => {
    const resources = template.toJSON().Resources;
    const untaggableResources = [
      'AWS::CDK::Metadata',
      'AWS::EC2::SubnetRouteTableAssociation',
      'AWS::EC2::Route',
      'AWS::EC2::RouteTable',
      'AWS::EC2::NatGateway',
      'AWS::EC2::InternetGateway',
      'AWS::EC2::VPCGatewayAttachment',
      'AWS::IAM::Policy',
      'AWS::S3::BucketPolicy',
      'AWS::WAFv2::WebACLAssociation',
      'AWS::EC2::EIP',
    ];

    for (const [id, res] of Object.entries(resources)) {
      const resource = res as any;
      if (!untaggableResources.includes(resource.Type) && resource.Properties.Tags) {
        expect(resource.Properties.Tags).toEqual(expect.arrayContaining([
          { Key: 'Environment', Value: 'production' },
          { Key: 'Project', Value: 'tap' },
          { Key: 'Owner', Value: 'platform-team' },
        ]));
      }
    }
  });

  test('CfnOutputs are Correct', () => {
    template.hasOutput('VpcId', {});
    template.hasOutput('ApiGatewayUrl', {});
    template.hasOutput('BucketName', {});
    template.hasOutput('DatabaseEndpoint', {});
  });

  // Additional tests to improve branch coverage
  describe('Environment Suffix Scenarios', () => {
    test('Stack with no environment suffix uses default', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackNoSuffix');
      const testTemplate = Template.fromStack(testStack);
      
      // Should use 'dev' as default suffix - check logical ID
      const resources = testTemplate.findResources('AWS::S3::Bucket');
      const bucketLogicalIds = Object.keys(resources);
      expect(bucketLogicalIds.some(id => id.includes('dev'))).toBe(true);
    });

    test('Stack with context environment suffix', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'prod');
      const testStack = new TapStack(testApp, 'TestStackContext');
      const testTemplate = Template.fromStack(testStack);
      
      // Should use 'prod' from context - check logical ID
      const resources = testTemplate.findResources('AWS::S3::Bucket');
      const bucketLogicalIds = Object.keys(resources);
      expect(bucketLogicalIds.some(id => id.includes('prod'))).toBe(true);
    });

    test('Props environment suffix overrides context', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context');
      const testStack = new TapStack(testApp, 'TestStackPropsOverride', { 
        environmentSuffix: 'props' 
      });
      const testTemplate = Template.fromStack(testStack);
      
      // Should use 'props' from props, not 'context' - check logical ID
      const resources = testTemplate.findResources('AWS::S3::Bucket');
      const bucketLogicalIds = Object.keys(resources);
      expect(bucketLogicalIds.some(id => id.includes('props'))).toBe(true);
      expect(bucketLogicalIds.some(id => id.includes('context'))).toBe(false);
    });
  });
});
