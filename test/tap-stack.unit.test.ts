import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-1'
      }
    });
    template = Template.fromStack(stack);
  });
  
  describe('Stack Configuration', () => {
    test('should use default environment suffix when not provided', () => {
      const newApp = new cdk.App();
      const stackWithoutSuffix = new TapStack(newApp, 'TestStackNoSuffix', {
        env: {
          account: '123456789012',
          region: 'us-west-1'
        }
      });
      const templateNoSuffix = Template.fromStack(stackWithoutSuffix);
      
      // Check that the default 'dev' suffix is used in the log group name
      templateNoSuffix.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/security/dev'
      });
    });
    
    test('should use provided environment suffix', () => {
      const newApp = new cdk.App();
      const customSuffix = 'production';
      const stackWithSuffix = new TapStack(newApp, 'TestStackCustomSuffix', {
        environmentSuffix: customSuffix,
        env: {
          account: '123456789012',
          region: 'us-west-1'
        }
      });
      const templateCustom = Template.fromStack(stackWithSuffix);
      
      // Check that the custom suffix is used
      templateCustom.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/security/${customSuffix}`
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create a VPC with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' }
        ])
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      // Verify public subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Public' }
        ])
      });

      // Verify private subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Private' }
        ])
      });
    });

    test('should create NAT Gateway for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Bucket Security', () => {
    test('should create S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should enable server-side encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('should enable versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should enforce SSL through bucket policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
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

    test('should include environment suffix in bucket name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`secure-production-bucket-${environmentSuffix}`)
      });
    });

    test('should configure lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            {
              Id: 'DeleteIncompleteMultipartUploads',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7
              },
              Status: 'Enabled'
            }
          ])
        }
      });
    });
  });

  describe('EC2 Security', () => {
    test('should create EC2 instance in private subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SubnetId: Match.anyValue(),
        InstanceType: 't3.micro'
      });
    });

    test('should create security group allowing only HTTPS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group allowing only HTTPS traffic',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS inbound traffic'
          }
        ]
      });
    });

    test('should require IMDSv2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required'
          }
        }
      });
    });

    test('should create IAM role for EC2 with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ])
        },
        Description: 'Secure role for EC2 instances with minimal permissions'
      });
    });

    test('should attach CloudWatch Agent policy to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('CloudWatchAgentServerPolicy')
              ])
            ])
          })
        ])
      });
    });

    test('should grant minimal S3 permissions to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject'],
              Resource: Match.anyValue()
            }
          ])
        }
      });
    });

    test('should create instance profile', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2); // One explicit + one from CDK
    });
  });

  describe('Logging and Monitoring', () => {
    test('should create CloudWatch log group with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/security/${environmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('should grant CloudWatch Logs permissions to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ]),
              Resource: Match.anyValue()
            }
          ])
        }
      });
    });

    test('should enable GuardDuty', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES'
      });
    });

    test('should enable GuardDuty S3 logs monitoring', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        DataSources: {
          S3Logs: {
            Enable: true
          }
        }
      });
    });

    test('should enable GuardDuty malware protection', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        DataSources: {
          MalwareProtection: {
            ScanEc2InstanceWithFindings: {
              EbsVolumes: true
            }
          }
        }
      });
    });

    test('should create IAM Access Analyzer', () => {
      template.hasResourceProperties('AWS::AccessAnalyzer::Analyzer', {
        Type: 'ACCOUNT',
        AnalyzerName: `security-analyzer-${environmentSuffix}`
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all resources with Environment: Production', () => {
      // Check VPC tagging
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' }
        ])
      });

      // Check S3 bucket tagging
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' }
        ])
      });

      // Check EC2 instance tagging
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' }
        ])
      });
    });

    test('should include Project and ManagedBy tags', () => {
      // Check that VPC has both Project and ManagedBy tags
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpcResourceId = Object.keys(vpcResources)[0];
      const vpcTags = vpcResources[vpcResourceId].Properties.Tags;
      
      const hasProjectTag = vpcTags.some((tag: any) => 
        tag.Key === 'Project' && tag.Value === 'SecurityConfiguration'
      );
      const hasManagedByTag = vpcTags.some((tag: any) => 
        tag.Key === 'ManagedBy' && tag.Value === 'CDK'
      );
      
      expect(hasProjectTag).toBe(true);
      expect(hasManagedByTag).toBe(true);
    });
  });

  describe('Stack Outputs', () => {
    test('should output S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Name of the secure S3 bucket'
      });
    });

    test('should output EC2 instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'ID of the secure EC2 instance'
      });
    });

    test('should output CloudWatch log group name', () => {
      template.hasOutput('LogGroupName', {
        Description: 'CloudWatch Log Group name'
      });
    });

    test('should output GuardDuty detector ID', () => {
      template.hasOutput('GuardDutyDetectorId', {
        Description: 'GuardDuty Detector ID'
      });
    });
  });

  describe('Removal Policies', () => {
    test('should set DESTROY removal policy for S3 bucket', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });

    test('should set DESTROY removal policy for log group', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });
  });
});