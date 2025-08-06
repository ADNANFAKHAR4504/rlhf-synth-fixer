import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecurityConfigStack } from '../lib/security-config-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('SecurityConfigStack', () => {
  const defaultProps = {
    approvedSshCidr: '203.0.113.0/24',
    alarmEmail: 'security-team@example.com',
    testing: true
  };

  let app: App;

  beforeEach(() => {
    app = new App();
  });

  it('should create resources with dummy VPC in testing mode', () => {
    const stack = new SecurityConfigStack(app, 'TestSecurityConfigStack', defaultProps);
    const template = Template.fromStack(stack);

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

    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'Security Alarm Topic',
    });

    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      Endpoint: defaultProps.alarmEmail,
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: defaultProps.approvedSshCidr,
        },
      ],
    });

    template.hasResourceProperties('AWS::CloudTrail::Trail', {
      IsMultiRegionTrail: true,
      EnableLogFileValidation: true,
      IncludeGlobalServiceEvents: true,
      IsLogging: true,
    });

    template.hasResource('AWS::EC2::Instance', {});
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'CPUUtilization',
      Namespace: 'AWS/EC2',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 80,
      EvaluationPeriods: 1,
      AlarmDescription: 'Alarm if EC2 instance CPU exceeds 80%',
    });
  });

  it('should hit the fromLookup branch when testing is false', () => {
    // Mock fromLookup to return a dummy VPC construct in the stack scope
    jest.spyOn(ec2.Vpc, 'fromLookup').mockImplementation(
      (scope: any, id: string) => new ec2.Vpc(scope, id, { maxAzs: 1 })
    );

    const stack = new SecurityConfigStack(app, 'ProdSecurityConfigStack', {
      approvedSshCidr: '198.51.100.0/24',
      alarmEmail: 'prod-team@example.com',
      // testing: undefined or false
    });

    const template = Template.fromStack(stack);

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

    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      Endpoint: 'prod-team@example.com',
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '198.51.100.0/24',
        },
      ],
    });
  });
});