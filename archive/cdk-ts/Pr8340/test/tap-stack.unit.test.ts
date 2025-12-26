import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('VPC Configuration', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    // Verify VPC with correct CIDR and DNS settings
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });

    // Verify subnet configuration
    template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private

    // NAT Gateways only deployed if not in LocalStack
    const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
    if (!isLocalStack) {
      template.resourceCountIs('AWS::EC2::NatGateway', 2); // One per AZ
    } else {
      template.resourceCountIs('AWS::EC2::NatGateway', 0); // None in LocalStack
    }
  });

  test('Security Groups Configuration', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    // Web Security Group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for web servers',
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
      ],
    });

    // SSH Security Group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for SSH access',
      SecurityGroupEgress: [
        {
          CidrIp: '255.255.255.255/32',
          Description: 'Disallow all traffic',
          FromPort: 252,
          IpProtocol: 'icmp',
          ToPort: 86,
        },
      ],
    });

    // RDS Security Group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for RDS instances',
      SecurityGroupEgress: [
        {
          CidrIp: '255.255.255.255/32',
          Description: 'Disallow all traffic',
          FromPort: 252,
          IpProtocol: 'icmp',
          ToPort: 86,
        },
      ],
    });
  });

  test('Encryption and Security', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    // KMS Key
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });

    // KMS Alias
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: Match.stringLikeRegexp('alias/infrastructure-key-test'),
    });
  });

  test('S3 Bucket Configuration', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
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
      LifecycleConfiguration: {
        Rules: [
          Match.objectLike({
            ExpirationInDays: 30,
            NoncurrentVersionExpiration: {
              NoncurrentDays: 7,
            },
            Status: 'Enabled',
          }),
        ],
      },
    }));
  });

  test('IAM Roles and Policies', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    // EC2 Role
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
      Description: 'IAM role for EC2 instances with least privilege',
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy')]),
          ]),
        }),
      ]),
    });

    // Lambda Role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
      Description: 'IAM role for Lambda functions with least privilege',
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('.*AWSLambdaBasicExecutionRole')]),
          ]),
        }),
      ]),
    });
  });

  test('RDS Database Configuration', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    // RDS Instance
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      Engine: 'mysql',
      EngineVersion: '8.0',
      StorageEncrypted: true,
      BackupRetentionPeriod: 7,
      MonitoringInterval: 60,
      EnableCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      DeletionProtection: false,
      AllocatedStorage: Match.anyValue(), // Accept either string or number
      MaxAllocatedStorage: 100,
    }));

    // DB Subnet Group
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: 'Subnet group for RDS instances in private subnets',
    });
  });

  test('Launch Template Configuration', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: Match.objectLike({
        InstanceType: 't3.micro',
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              DeleteOnTermination: true,
              Encrypted: true,
              VolumeSize: 20,
              VolumeType: 'gp3',
            },
          },
        ],
      }),
    });
  });

  test('Resource Tags', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    // Check VPC tags
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'CostCenter', Value: 'Infrastructure' },
        { Key: 'Environment', Value: 'test' },
        { Key: 'ManagedBy', Value: 'CDK' },
        { Key: 'Project', Value: 'SecureInfrastructure' },
      ]),
    });
  });

  test('CloudFormation Outputs', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    // Verify all outputs exist
    template.hasOutput('VPCId', {});
    template.hasOutput('LogsBucketName', {});
    template.hasOutput('DatabaseEndpoint', {});
    template.hasOutput('KMSKeyId', {});
    template.hasOutput('LaunchTemplateId', {});
    template.hasOutput('InstanceProfileArn', {});
    template.hasOutput('LambdaRoleArn', {});

    // Verify output export names
    template.hasOutput('VPCId', {
      Export: { Name: 'VPC-test' },
    });
  });

  describe('Environment Suffix Resolution', () => {
    test('uses default suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasOutput('VPCId', {
        Export: { Name: 'VPC-dev' },
      });
    });

    test('uses context suffix when provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      contextTemplate.hasOutput('VPCId', {
        Export: { Name: 'VPC-context-test' },
      });
    });

    test('uses props suffix when provided', () => {
      const propsApp = new cdk.App();
      const propsStack = new TapStack(propsApp, 'PropsStack', {
        environmentSuffix: 'props-test',
      });
      const propsTemplate = Template.fromStack(propsStack);
      propsTemplate.hasOutput('VPCId', {
        Export: { Name: 'VPC-props-test' },
      });
    });
  });

  test('Removal Policies', () => {
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    const template = Template.fromStack(stack);

    // Check S3 bucket has auto-delete objects enabled
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });

    // Check KMS key has removal policy
    template.hasResource('AWS::KMS::Key', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });

    // Check RDS has removal policy
    template.hasResource('AWS::RDS::DBInstance', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });

  describe('LocalStack Compatibility', () => {
    test('verifies LocalStack detection logic', () => {
      // Test the LocalStack detection based on current environment
      const isLocalStack =
        process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
        process.env.AWS_ENDPOINT_URL?.includes('4566');

      const compatApp = new cdk.App();
      const compatStack = new TapStack(compatApp, 'CompatTestStack', {
        environmentSuffix: 'compat',
      });

      const template = Template.fromStack(compatStack);

      // Verify NAT Gateway count matches LocalStack detection
      if (isLocalStack) {
        // In LocalStack, no NAT Gateways
        template.resourceCountIs('AWS::EC2::NatGateway', 0);
      } else {
        // In AWS, 2 NAT Gateways (one per AZ)
        template.resourceCountIs('AWS::EC2::NatGateway', 2);
      }

      // RDS Subnet Group always exists
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS instances in private subnets',
      });
    });

    test('verifies dual-environment support', () => {
      // This test verifies that the stack can be synthesized in both environments
      // The actual behavior depends on AWS_ENDPOINT_URL at module load time
      const dualApp = new cdk.App();
      const dualStack = new TapStack(dualApp, 'DualTestStack', {
        environmentSuffix: 'dual',
      });

      const template = Template.fromStack(dualStack);

      // Both environments have these core resources
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
        Engine: 'mysql',
      }));
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketEncryption: Match.anyValue(),
      }));
    });

    test('verifies complete resource inventory', () => {
      // Additional test to ensure all conditional resources are accounted for
      const invApp = new cdk.App();
      const invStack = new TapStack(invApp, 'InventoryStack', {
        environmentSuffix: 'inv',
      });

      const template = Template.fromStack(invStack);

      // Verify all security groups
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3); // Web, SSH, RDS

      // Verify IAM resources exist (includes EC2, Lambda, and CDK custom resource roles)
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);

      // Verify encryption resources
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);

      // Verify compute resources
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);

      // Verify storage and database resources
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });
  });
});