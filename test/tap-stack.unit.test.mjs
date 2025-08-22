import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;
  let stackName;
  let env;

  beforeEach(() => {
    jest.clearAllMocks();
    env = { account: '111111111111', region: 'us-east-1' };
    stackName = `TapStack${environmentSuffix}`;
  });

  const baseConfig = {
    vpcId: 'vpc-12345678',
    existingS3Bucket: 'test-logs-bucket',
    sshCidrBlock: '10.0.0.0/8',
    trustedOutboundCidrs: ['10.0.0.0/8'],
    environment: 'Production'
  };

  describe('Happy path', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, stackName, { env, environmentSuffix, config: baseConfig });
      template = Template.fromStack(stack);
    });

    test('Creates EC2 instances with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro',
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: { Encrypted: true, VolumeType: 'gp3' }
          }
        ]
      });
    });

    test('Creates security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
          expect.objectContaining({ FromPort: 22, ToPort: 22, CidrIp: '10.0.0.0/8' })
        ])
      });
    });

    test('Creates IAM role with trust policy for EC2', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' }
            })
          ])
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
      const resources = template.findResources('*');
      Object.values(resources).forEach(r => {
        expect(r.Properties?.Tags).toEqual(
          expect.arrayContaining([{ Key: 'Environment', Value: 'Production' }])
        );
      });
    });

    test('Outputs include EC2, SecurityGroup and LogGroup', () => {
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty(`${stackName}-Instance1Id`);
      expect(outputs).toHaveProperty(`${stackName}-Instance1PrivateIP`);
      expect(outputs).toHaveProperty(`${stackName}-SecurityGroupId`);
      expect(outputs).toHaveProperty(`${stackName}-LogGroupName`);
    });
  });

  describe('createIfNotExists = true', () => {
    test('Creates a new VPC if vpcId missing', () => {
      app = new cdk.App();
      const config = { ...baseConfig, vpcId: undefined };
      stack = new TapStack(app, stackName, { env, environmentSuffix, config, createIfNotExists: true });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Creates a new S3 bucket if existingS3Bucket missing', () => {
      app = new cdk.App();
      const config = { ...baseConfig, existingS3Bucket: undefined };
      stack = new TapStack(app, stackName, { env, environmentSuffix, config, createIfNotExists: true });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: expect.any(Object)
      });
    });
  });

  describe('createIfNotExists = false', () => {
    test('Throws if vpcId missing', () => {
      app = new cdk.App();
      const config = { ...baseConfig, vpcId: undefined };
      expect(() => {
        new TapStack(app, stackName, { env, environmentSuffix, config, createIfNotExists: false });
      }).toThrow(/VPC ID must be provided/);
    });

    test('Throws if existingS3Bucket missing', () => {
      app = new cdk.App();
      const config = { ...baseConfig, existingS3Bucket: undefined };
      expect(() => {
        new TapStack(app, stackName, { env, environmentSuffix, config, createIfNotExists: false });
      }).toThrow(/S3 bucket must be provided/);
    });
  });

  describe('Invalid configuration', () => {
    test('Throws if environment not found in cdk.json context', () => {
      app = new cdk.App({
        context: { environments: { dev: undefined } }
      });
      expect(() => {
        new TapStack(app, stackName, { env, environmentSuffix: 'qa', config: {} });
      }).toThrow(/No configuration found/);
    });
  });
});
