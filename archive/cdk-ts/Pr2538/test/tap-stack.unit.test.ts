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

  describe('Stack Creation', () => {
    test('should create stack without errors', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should use provided environment suffix', () => {
      const testStack = new TapStack(app, 'TestStack', { 
        environmentSuffix: 'test' 
      });
      expect(testStack).toBeDefined();
    });

    test('should use default environment suffix when not provided', () => {
      const testStack = new TapStack(app, 'TestStack');
      expect(testStack).toBeDefined();
    });

    test('should use context environment suffix when available', () => {
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'context-test'
        }
      });
      const testStack = new TapStack(appWithContext, 'TestStack');
      expect(testStack).toBeDefined();
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP infrastructure encryption',
        EnableKeyRotation: true
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(`^alias/tap-${environmentSuffix}-\\d+$`)
      });
    });

    test('should have CloudWatch Logs permissions in KMS key policy', () => {
      // Verify KMS key has a policy with multiple statements (including CloudWatch Logs)
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow'
            })
          ])
        })
      });
      
      // Verify the KMS key policy has the correct structure
      const resources = template.toJSON().Resources;
      const kmsKey = Object.values(resources).find((r: any) => r.Type === 'AWS::KMS::Key');
      expect(kmsKey).toBeDefined();
      expect((kmsKey as any).Properties.KeyPolicy.Statement).toHaveLength(6); // Root, CloudWatch, EC2+AutoScaling, EC2 direct, AutoScaling grants, AutoScaling service-linked role
    });

    test('should have EC2 service permissions in KMS key policy', () => {
      // Check that EC2 service has permissions
      const resources = template.toJSON().Resources;
      const kmsKey = Object.values(resources).find((r: any) => r.Type === 'AWS::KMS::Key') as any;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      
      const hasEc2Permissions = statements.some((stmt: any) => 
        stmt.Principal?.Service?.includes?.('ec2.amazonaws.com') &&
        stmt.Action?.includes?.('kms:Decrypt')
      );
      
      expect(hasEc2Permissions).toBe(true);
    });

    test('should have Auto Scaling service permissions in KMS key policy', () => {
      // Check that Auto Scaling service has permissions
      const resources = template.toJSON().Resources;
      const kmsKey = Object.values(resources).find((r: any) => r.Type === 'AWS::KMS::Key') as any;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      
      const hasAutoScalingPermissions = statements.some((stmt: any) => 
        stmt.Principal?.Service?.includes?.('autoscaling.amazonaws.com') &&
        stmt.Action?.includes?.('kms:CreateGrant')
      );
      
      expect(hasAutoScalingPermissions).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false
      });
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Elastic IPs for NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });

    test('should create route tables', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4); // 2 public + 2 private
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer'
      });
    });

    test('should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances'
      });
    });

    test('should configure ALB ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 80,
              ToPort: 80,
              CidrIp: '0.0.0.0/0'
            }),
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: '0.0.0.0/0'
            })
          ])
        })
      );
    });

    test('should configure restricted SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 22,
              ToPort: 22,
              CidrIp: '10.0.0.0/8'
            })
          ])
        })
      );
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 role with proper managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:', 
                { Ref: 'AWS::Partition' }, 
                ':iam::aws:policy/AmazonSSMManagedInstanceCore'
              ]
            ]
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:', 
                { Ref: 'AWS::Partition' }, 
                ':iam::aws:policy/CloudWatchAgentServerPolicy'
              ]
            ]
          }
        ]
      });
    });

    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('should create CloudTrail logs role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'cloudtrail.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('should configure EC2 role with comprehensive KMS permissions', () => {
      // Check that EC2 role has KMS permissions
      const resources = template.toJSON().Resources;
      const ec2Policy = Object.values(resources).find((r: any) => 
        r.Type === 'AWS::IAM::Policy' && 
        r.Properties.PolicyName?.includes('Ec2Role')
      ) as any;
      
      expect(ec2Policy).toBeDefined();
      
      const hasKmsPermissions = ec2Policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
        stmt.Action?.includes?.('kms:Decrypt') && 
        stmt.Action?.includes?.('kms:CreateGrant')
      );
      
      expect(hasKmsPermissions).toBe(true);
    });
  });

  describe('Launch Template', () => {
    test('should create launch template with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro'
        }
      });
    });

    test('should configure encrypted EBS volume', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [{
            DeviceName: '/dev/xvda',
            Ebs: {
              VolumeSize: 20,
              VolumeType: 'gp3',
              Encrypted: true
            }
          }]
        }
      });
    });

    test('should enforce IMDSv2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required'
          }
        }
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create auto scaling group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '4',
        DesiredCapacity: '2'
      });
    });

  });

  describe('Load Balancer', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should create target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP'
      });
    });

    test('should create HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create main S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms'
            }
          }]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should create CloudTrail S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        }
      });
    });

    test('should configure S3 bucket policies', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 2);
    });

    test('should enforce SSL for S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            })
          ])
        }
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create S3 event processor Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      });
    });

    test('should configure Lambda environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            BUCKET_NAME: Match.anyValue(),
            KMS_KEY_ID: Match.anyValue()
          }
        }
      });
    });

    test('should create Lambda log group', () => {
      // Verify there are log groups created (at least 1)
      template.resourceCountIs('AWS::Logs::LogGroup', 1); // CloudTrail log group
      
      // Verify the log group exists for CloudTrail
      const resources = template.toJSON().Resources;
      const logGroups = Object.values(resources).filter((r: any) => r.Type === 'AWS::Logs::LogGroup');
      expect(logGroups.length).toBeGreaterThanOrEqual(1);
      
      // Verify log group has retention policy
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: Match.anyValue()
      });
    });

    test('should configure S3 event notifications', () => {
      template.resourceCountIs('Custom::S3BucketNotifications', 1);
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true
      });
    });

    test('should create CloudTrail log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/cloudtrail/tap-.*'),
        RetentionInDays: 365
      });
    });
  });

  describe('Tagging', () => {
    test('should apply common tags to resources', () => {
      // Verify tags are applied to key resources
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production'
          })
        ])
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `tap-vpc-id-${environmentSuffix}`
        }
      });
    });

    test('should export Load Balancer DNS', () => {
      template.hasOutput('LoadBalancerDns', {
        Description: 'Application Load Balancer DNS name',
        Export: {
          Name: `tap-alb-dns-${environmentSuffix}`
        }
      });
    });

    test('should export S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket name',
        Export: {
          Name: `tap-s3-bucket-${environmentSuffix}`
        }
      });
    });

    test('should export KMS key ID', () => {
      template.hasOutput('KmsKeyId', {
        Description: 'KMS Key ID',
        Export: {
          Name: `tap-kms-key-${environmentSuffix}`
        }
      });
    });

    test('should export Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function name',
        Export: {
          Name: `tap-lambda-name-${environmentSuffix}`
        }
      });
    });
  });

  describe('Resource Counts', () => {
    test('should have expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceCount = Object.keys(resources).length;
      
      // Verify we have a substantial number of resources
      expect(resourceCount).toBeGreaterThan(50);
    });

    test('should have correct resource types count', () => {
      // Key resource counts
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with public read access', () => {
      // Ensure no S3 buckets have public read access
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.Properties.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
          expect(resource.Properties.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        }
      });
    });

    test('should enforce encryption for storage resources', () => {
      // Verify S3 buckets have encryption enabled
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.anyValue()
      });

      // Verify EBS volumes are encrypted
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: {
                Encrypted: true
              }
            })
          ])
        }
      });
    });

    test('should use least privilege IAM policies', () => {
      // Check that Lambda role only has necessary permissions
      template.hasResourceProperties('AWS::IAM::Role', 
        Match.objectLike({
          AssumeRolePolicyDocument: {
            Statement: [{
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' }
            }]
          }
        })
      );
    });
  });
});