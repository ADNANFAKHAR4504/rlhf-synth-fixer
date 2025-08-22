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
    createIfNotExists: true,
    existingVpcId: 'vpc-12345678',
    existingS3Bucket: 'test-logs-bucket',
    sshCidrBlock: '10.0.0.0/8',
    trustedOutboundCidrs: ['10.0.0.0/8'],
    environment: 'Production'
  };

  // ------------------ Happy path ------------------
  describe('Happy path', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, stackName, { env, environmentSuffix, config: baseConfig });
      template = Template.fromStack(stack);
    });

    test('Creates EC2 instances with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro'
      });
    });

    test('Creates exactly 2 EC2 instances', () => {
      // Find all resources of type AWS::EC2::Instance
      const ec2Instances = template.findResources('AWS::EC2::Instance');

      // Assert that there are exactly 2 instances
      expect(Object.keys(ec2Instances)).toHaveLength(2);

      // Optional: check that both are t2.micro
      Object.values(ec2Instances).forEach((instance) => {
        expect(instance.Properties.InstanceType).toBe('t2.micro');
      });
    });

    test('Security group has correct ingress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sg = Object.values(securityGroups)[0].Properties;

      // Ingress rules
      const ingressRules = sg.SecurityGroupIngress;
      expect(ingressRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          }),
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '10.0.0.0/8'
          })
        ])
      );
    });

    test('Security group has correct egress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sg = Object.values(securityGroups)[0].Properties;

      const egressRules = sg.SecurityGroupEgress;

      // Check trusted outbound CIDR
      expect(egressRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: '-1',
            CidrIp: '10.0.0.0/8'
          }),
          // HTTPS to AWS services (SSM/CloudWatch)
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          })
        ])
      );
    });

    test('Only one security group is created', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(sgResources)).toHaveLength(1);
    });

    test('Creates IAM role with trust policy for EC2', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Roles = Object.values(roles).filter(r => {
        const statements = r.Properties.AssumeRolePolicyDocument.Statement;
        return statements.some(s => s.Principal?.Service === 'ec2.amazonaws.com');
      });

      expect(ec2Roles.length).toBeGreaterThan(0);
      ec2Roles.forEach(role => {
        const statements = role.Properties.AssumeRolePolicyDocument.Statement;
        expect(statements).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Principal: expect.objectContaining({ Service: 'ec2.amazonaws.com' })
            })
          ])
        );
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
      const expectedOutputs = [
        'Instance1Id',
        'Instance1PrivateIP',
        'SecurityGroupId',
        'LogGroupName'
      ];
      expectedOutputs.forEach(name => {
        const outputKey = Object.keys(outputs).find(k => k.endsWith(name));
        expect(outputKey).toBeDefined();
      });
    });
  });

  //------------------createIfNotExists = true ------------------
  describe('createIfNotExists = true', () => {
    test('Creates a new VPC if existingVpcId missing', () => {
      app = new cdk.App();
      const config = { ...baseConfig, existingVpcId: undefined };
      stack = new TapStack(app, stackName, { env, environmentSuffix, config, createIfNotExists: true });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Creates a new S3 bucket if existingS3Bucket missing', () => {
      app = new cdk.App();
      const config = { ...baseConfig, existingS3Bucket: undefined };
      stack = new TapStack(app, stackName, { env, environmentSuffix, config, createIfNotExists: true });
      template = Template.fromStack(stack);

      // Exactly 1 bucket
      template.resourceCountIs('AWS::S3::Bucket', 1);

      // Encryption check
      const bucketResources = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(bucketResources)[0];

      expect(bucket.Properties).toHaveProperty('BucketEncryption');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ServerSideEncryptionByDefault: expect.objectContaining({
              SSEAlgorithm: 'AES256'
            })
          })
        ])
      );
    });
  });

  //------------------createIfNotExists = false ------------------
  describe('createIfNotExists = false', () => {
    test('Throws if existingVpcId missing', () => {
      app = new cdk.App();
      const config = { ...baseConfig, existingVpcId: undefined, createIfNotExists: false };
      expect(() => {
        new TapStack(app, stackName, { env, environmentSuffix, config });
      }).toThrow(/VPC ID must be provided/);
    });

    test('Throws if existingS3Bucket missing', () => {
      app = new cdk.App();
      const config = { ...baseConfig, existingS3Bucket: undefined, createIfNotExists: false };
      expect(() => {
        new TapStack(app, stackName, { env, environmentSuffix, config });
      }).toThrow(/S3 bucket must be provided/);
    });
  });

  // ------------------ Invalid configuration ------------------
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
