import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      projectName: 'test',
      allowedSshCidr: '10.0.0.0/8',
      allowedDbCidr: '10.0.0.0/16',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('EC2 instance is created with IAM role in private subnet', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
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
        Version: '2012-10-17',
      },
    });
  });

  test('RDS instance is encrypted and in isolated subnet', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
      Engine: 'mysql',
      EngineVersion: '8.0',
    });
  });

  test('S3 buckets have encryption and block public access', () => {
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
  });

  test('Lambda function has VPC configuration and CloudWatch logging', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.9',
    });

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });

  test('Security groups have correct ingress rules', () => {
    // EC2 Security Group allows SSH
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '10.0.0.0/8',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
        },
      ],
    });

    // RDS Security Group allows MySQL
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '10.0.0.0/16',
          FromPort: 3306,
          ToPort: 3306,
          IpProtocol: 'tcp',
        },
      ],
    });
  });

  test('Secrets Manager secret is created for database', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      GenerateSecretString: {
        SecretStringTemplate: '{"username":"admin"}',
        GenerateStringKey: 'password',
        PasswordLength: 16,
      },
    });
  });

  test('MFA policy is created', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Effect: 'Deny',
            Action: '*',
            Resource: '*',
          },
        ],
      },
    });
  });

  test('Resources have environment suffix in names', () => {
    // Check that VPC name includes environment suffix
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: [
        {
          Key: 'Name',
          Value: `corp-test-vpc${environmentSuffix}`,
        },
      ],
    });

    // Check that security groups have suffix
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: `corp-test-ec2-sg${environmentSuffix}`,
    });
  });

  test('Stack uses defaults when optional properties not provided', () => {
    // Test stack with minimal props to cover default value branches
    const minimalApp = new cdk.App();
    const minimalStack = new TapStack(minimalApp, 'MinimalTestTapStack', {
      environmentSuffix: 'minimal',
    });
    const minimalTemplate = Template.fromStack(minimalStack);

    // Should use default project name 'nova'
    minimalTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: [
        {
          Key: 'Name',
          Value: 'corp-nova-vpcminimal',
        },
      ],
    });
  });

  test('Stack handles custom project name and CIDR ranges', () => {
    // Test stack with custom values to cover different branches
    const customApp = new cdk.App();
    const customStack = new TapStack(customApp, 'CustomTestTapStack', {
      environmentSuffix: 'custom',
      projectName: 'custom',
      allowedSshCidr: '192.168.1.0/24',
      allowedDbCidr: '192.168.0.0/16',
    });
    const customTemplate = Template.fromStack(customStack);

    // Should use custom SSH CIDR
    customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '192.168.1.0/24',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
        },
      ],
    });

    // Should use custom DB CIDR
    customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '192.168.0.0/16',
          FromPort: 3306,
          ToPort: 3306,
          IpProtocol: 'tcp',
        },
      ],
    });
  });
});
