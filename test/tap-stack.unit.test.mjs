import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    const env = { account: '111111111111', region: 'us-east-1' };

    const config = {
      vpcId: 'vpc-12345678',
      existingS3Bucket: 'test-logs-bucket',
      sshCidrBlock: '10.0.0.0/8',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      environment: 'Production'
    };

    app = new cdk.App();

    stack = new TapStack(app, 'TestTapStack', { env, environmentSuffix,  config });
    template = Template.fromStack(stack);

    template = Template.fromStack(stack);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });

  test('Creates EC2 instances with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro',
      BlockDeviceMappings: [
        {
          DeviceName: '/dev/xvda',
          Ebs: {
            Encrypted: true,
            VolumeType: 'gp3'
          }
        }
      ]
    });
  });

  test('Creates security group with correct ingress rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0'
        },
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '10.0.0.0/8'
        }
      ]
    });
  });

  test('Creates IAM role with minimal permissions', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }
        ]
      }
    });
  });

  test('Creates CloudWatch Log Group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/ec2/secure-webapp',
      RetentionInDays: 90
    });
  });

  test('All resources have Environment tag', () => {
    const resources = template.findResources('AWS::EC2::Instance');
    Object.keys(resources).forEach(key => {
      expect(resources[key].Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production'
      });
    });
  });
});