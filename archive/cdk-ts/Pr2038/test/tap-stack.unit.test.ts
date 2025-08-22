import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: 'KMS key for TAP financial services app',
      });
    });

    test('should have deletion policy set to destroy', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create NAT gateways for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('should create EC2 security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: [
          {
            CidrIp: '10.0.0.0/16',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'SSH from VPC',
          },
          {
            CidrIp: '10.0.0.0/16',
            FromPort: 8080,
            ToPort: 8080,
            IpProtocol: 'tcp',
            Description: 'Application port from VPC',
          },
        ],
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
            Description: 'HTTPS outbound',
          },
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            Description: 'HTTP outbound',
          },
        ],
      });
    });

    test('should create RDS security group with PostgreSQL access from EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });

      // Check that RDS security group has ingress rule from EC2 security group
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'PostgreSQL from EC2',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 role with SSM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
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
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ],
      });
    });

    test('should create Lambda role with basic execution permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
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
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      });
    });

    test('should create IAM user group with least privilege policies', () => {
      template.hasResourceProperties('AWS::IAM::Group', Match.anyValue());

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeInstances',
                'ec2:DescribeImages',
                'ec2:DescribeSnapshots',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:ListBucket'],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });
  });

  describe('EC2 Launch Template', () => {
    test('should create launch template with encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro',
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                VolumeSize: 20,
                KmsKeyId: Match.anyValue(),
              },
            },
          ],
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('should create PostgreSQL database with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '15.8',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        PubliclyAccessible: false,
        MultiAZ: false,
        AllocatedStorage: '20',
      });
    });

    test('should create DB subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
        SubnetIds: Match.anyValue(),
      });
    });

    test('should have deletion policy set to destroy', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
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

    test('should have deletion policy set to destroy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with Python runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            BUCKET_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('should have inline code for Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp('.*Hello from Lambda.*'),
        },
      });
    });
  });

  describe('CloudFront and WAF', () => {
    test('should create WAF WebACL with managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'CLOUDFRONT',
        DefaultAction: {
          Allow: {},
        },
        Rules: [
          {
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 1,
            OverrideAction: {
              None: {},
            },
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
          },
          {
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 2,
            OverrideAction: {
              None: {},
            },
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
          },
        ],
      });
    });

    test('should create CloudFront distribution with S3 origin', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
            AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            CachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          },
          Enabled: true,
          PriceClass: 'PriceClass_100',
          WebACLId: Match.anyValue(),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });

      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
      });

      template.hasOutput('CloudFrontDomain', {
        Description: 'CloudFront Distribution Domain',
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      // Core infrastructure
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::Lambda::Function', 2); // 1 main function + 1 log retention function
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);

      // Security groups
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2); // EC2 + RDS

      // IAM resources
      template.resourceCountIs('AWS::IAM::Role', 3); // EC2 + Lambda + Log retention
      template.resourceCountIs('AWS::IAM::Group', 1);
    });
  });

  describe('Security Compliance', () => {
    test('should enforce encryption at rest for all storage', () => {
      // S3 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.anyValue(),
      });

      // RDS encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });

      // EBS encryption
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              Ebs: {
                Encrypted: true,
              },
            },
          ],
        },
      });
    });

    test('should block all public access to S3', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enforce HTTPS for CloudFront', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });
  });
});
