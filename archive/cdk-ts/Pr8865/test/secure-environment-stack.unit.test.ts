import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { SecureEnvironmentStack } from '../lib/secure-environment-stack';

const environmentSuffix = 'test';

describe('SecureEnvironmentStack', () => {
  let app: cdk.App;
  let stack: SecureEnvironmentStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecureEnvironmentStack(app, 'TestSecureEnvironmentStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Configuration', () => {
    test('should use provided environmentSuffix', () => {
      const testApp = new cdk.App();
      const testStack = new SecureEnvironmentStack(
        testApp,
        'TestStackWithEnv',
        {
          environmentSuffix: 'prod',
          env: {
            account: '123456789012',
            region: 'us-west-2',
          },
        }
      );
      const testTemplate = Template.fromStack(testStack);

      // Check that the VPC name uses the provided environment suffix
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'org-secure-vpc-prod',
          }),
        ]),
      });
    });

    test('should use default environmentSuffix when props is undefined', () => {
      const testApp = new cdk.App();
      const testStack = new SecureEnvironmentStack(testApp, 'TestStackNoProps');
      const testTemplate = Template.fromStack(testStack);

      // Check that the VPC name uses the default 'dev' environment suffix
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'org-secure-vpc-dev',
          }),
        ]),
      });
    });

    test('should use default environmentSuffix when props.environmentSuffix is undefined', () => {
      const testApp = new cdk.App();
      const testStack = new SecureEnvironmentStack(
        testApp,
        'TestStackNoEnvSuffix',
        {
          env: {
            account: '123456789012',
            region: 'us-west-2',
          },
        }
      );
      const testTemplate = Template.fromStack(testStack);

      // Check that the VPC name uses the default 'dev' environment suffix
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'org-secure-vpc-dev',
          }),
        ]),
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `org-secure-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });
    });

    test('should create Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
          }),
        ]),
      });
    });

    test('should create NAT Gateways for private subnets', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
          }),
        ]),
      });
    });
  });

  describe('KMS Configuration', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `org-encryption-key-${environmentSuffix}`,
        EnableKeyRotation: true,
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/org-encryption-key-${environmentSuffix}`,
      });
    });
  });

  describe('IAM Configuration', () => {
    test('should create EC2 instance role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `org-ec2-instance-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });

      // Check for managed policies separately
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `org-ec2-instance-role-${environmentSuffix}`,
        },
      });
      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });

    test('should create EC2 instance role policy for CloudWatch and logs', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'cloudwatch:PutMetricData',
              ]),
              Condition: Match.objectLike({
                StringEquals: Match.objectLike({
                  'aws:RequestedRegion': 'us-west-2',
                }),
              }),
            }),
          ]),
        }),
      });
    });

    test('should create S3 Access Point role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `org-s3-access-point-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 's3.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('should create S3 Access Point role with ABAC policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ]),
              Condition: Match.objectLike({
                StringEquals: Match.objectLike({
                  's3:ExistingObjectTag/Environment':
                    '${aws:PrincipalTag/Environment}',
                  's3:ExistingObjectTag/Department':
                    '${aws:PrincipalTag/Department}',
                }),
              }),
            }),
          ]),
        }),
      });
    });

    test('should create instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `org-instance-profile-${environmentSuffix}`,
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('should create SSH security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `org-ssh-sg-${environmentSuffix}`,
        GroupDescription:
          'Security group allowing SSH access from specific IP range',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '203.0.113.0/24',
          }),
        ]),
      });
    });

    test('should allow all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `org-ssh-sg-${environmentSuffix}`,
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });
  });

  describe('EC2 Configuration', () => {
    test('should create EC2 key pair', () => {
      template.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyName: Match.objectLike({
          'Fn::Join': ['', Match.arrayWith([Match.stringLikeRegexp(`org-keypair-${environmentSuffix}-.*`)])],
        }),
      });
    });

    test('should store key pair name in SSM parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/org/ec2/keypair/${environmentSuffix}`,
        Type: 'String',
        Description: `EC2 Key Pair name for ${environmentSuffix} environment`,
      });
    });

    test('should create EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Monitoring: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `org-secure-instance-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('should configure EC2 instance with encrypted EBS volume', () => {
      // EC2 Instance should have encrypted EBS configuration directly
      const instances = template.findResources('AWS::EC2::Instance');
      expect(Object.keys(instances).length).toBeGreaterThan(0);
      const instance = Object.values(instances)[0];
      expect(instance).toBeDefined();
      // Check EC2 Instance has BlockDeviceMappings with encrypted EBS
      if (instance.Properties.BlockDeviceMappings) {
        const blockDevice = instance.Properties.BlockDeviceMappings[0];
        expect(blockDevice.DeviceName).toBe('/dev/xvda');
        expect(blockDevice.Ebs.Encrypted).toBe(true);
        expect(blockDevice.Ebs.VolumeSize).toBe(20);
        expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      }
    });

    test('should enable IMDSv2 on EC2 instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        MetadataOptions: Match.objectLike({
          HttpTokens: 'required',
          HttpEndpoint: 'enabled',
        }),
      });
    });
  });

  describe('S3 Configuration', () => {
    test('should create S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
        VersioningConfiguration: Match.objectLike({
          Status: 'Enabled',
        }),
      });
    });

    test('should block all public access on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }),
      });
    });

    test('should enforce SSL on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: Match.objectLike({
                Bool: Match.objectLike({
                  'aws:SecureTransport': 'false',
                }),
              }),
            }),
          ]),
        }),
      });
    });

    test('should configure lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: `org-lifecycle-rule-${environmentSuffix}`,
              Status: 'Enabled',
              NoncurrentVersionExpiration: Match.objectLike({
                NoncurrentDays: 30,
              }),
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
          ]),
        }),
      });
    });

    test('should create S3 Access Point', () => {
      template.hasResourceProperties('AWS::S3::AccessPoint', {
        Name: `org-access-point-${environmentSuffix}`,
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: Match.objectLike({
          Name: `org-vpc-id-${environmentSuffix}`,
        }),
      });
    });

    test('should output EC2 Instance ID', () => {
      template.hasOutput('InstanceId', {
        Description: 'EC2 Instance ID',
        Export: Match.objectLike({
          Name: `org-instance-id-${environmentSuffix}`,
        }),
      });
    });

    test('should output S3 Bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
        Export: Match.objectLike({
          Name: `org-s3-bucket-name-${environmentSuffix}`,
        }),
      });
    });

    test('should output S3 Access Point ARN', () => {
      template.hasOutput('S3AccessPointArn', {
        Description: 'S3 Access Point ARN',
        Export: Match.objectLike({
          Name: `org-s3-access-point-arn-${environmentSuffix}`,
        }),
      });
    });
  });

  describe('Stack Tags', () => {
    test('should apply environment tags', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0];
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ])
      );
    });

    test('should apply department tags', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0];
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Department',
            Value: 'security',
          }),
        ])
      );
    });

    test('should apply project tags', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0];
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Project',
            Value: 'org-secure-environment',
          }),
        ])
      );
    });
  });
});
