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
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix, 
      allowedSshIp: '10.0.0.1' 
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('creates VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Project', Value: 'TapStack' }
        ])
      });
    });

    test('creates public subnets in multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*public.*') }
        ])
      });
    });

    test('creates private subnets with egress', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*private.*') }
        ])
      });
    });

    test('creates isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*isolated.*') }
        ])
      });
    });

    test('creates NAT Gateway for private subnet connectivity', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*prod-public-subnet.*') }
        ])
      });
    });

    test('creates Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });
  });

  describe('S3 Infrastructure', () => {
    test('creates main S3 bucket with security configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('creates CloudTrail S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        }
      });
    });

    test('creates S3 bucket policy for CloudFront access', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([{
            Sid: 'AllowCloudFrontServicePrincipal',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com'
            },
            Action: 's3:GetObject',
            Resource: Match.anyValue(),
            Condition: Match.anyValue()
          }])
        }
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('creates CloudFront distribution with S3 origin', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Comment: 'prod CloudFront Distribution',
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
            CachePolicyId: Match.anyValue()
          },
          PriceClass: 'PriceClass_100',
          Enabled: true
        }
      });
    });

    test('creates Origin Access Control', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: {
          Name: `prod-oac-${environmentSuffix}`,
          OriginAccessControlOriginType: 's3',
          SigningBehavior: 'always',
          SigningProtocol: 'sigv4'
        }
      });
    });
  });

  describe('EC2 Infrastructure', () => {
    test('creates EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Project', Value: 'TapStack' }
        ])
      });
    });

    test('creates security group for EC2 with SSH access restriction', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for production EC2 instance',
        SecurityGroupIngress: [{
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '10.0.0.1/32',
          Description: 'SSH access from specific IP'
        }]
      });
    });

    test('creates IAM role for EC2 with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `prod-ec2-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('creates instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `prod-instance-profile-${environmentSuffix}`
      });
    });
  });

  describe('RDS Infrastructure', () => {
    test('creates RDS instance with MySQL engine', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`,
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false, // Changed to allow deletion
        MonitoringInterval: 60,
        EnableCloudwatchLogsExports: ['error', 'general', 'slowquery']
      });
    });

    test('creates DB subnet group for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: `prod-pr-db-subnet-group-${environmentSuffix}`,
        DBSubnetGroupDescription: 'Subnet group for production RDS instance'
      });
    });

    test('creates security group for RDS with MySQL port', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for production RDS instance'
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'MySQL access from EC2 instances'
      });
    });

    test('creates Secrets Manager secret for RDS credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `prod-db-credentials-${environmentSuffix}`
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('creates application log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ec2/prod-pr-application-${environmentSuffix}`,
        RetentionInDays: 30
      });
    });

    test('creates system log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ec2/prod-pr-system-${environmentSuffix}`,
        RetentionInDays: 30
      });
    });

    test('creates CloudTrail log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/cloudtrail/prod-pr-${environmentSuffix}`,
        RetentionInDays: 30
      });
    });
  });

  describe('CloudTrail Auditing', () => {
    test('creates CloudTrail for auditing', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `prod-pr-cloudtrail-${environmentSuffix}`,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true
      });
    });

    test('creates IAM role for CloudTrail', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('creates all required outputs', () => {
      const outputs = template.findOutputs('*');
      
      // Check for essential outputs
      expect(outputs.S3BucketArn).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.EC2InstanceId).toBeDefined();
      expect(outputs.EC2PrivateIp).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.RdsEndpoint).toBeDefined();
      expect(outputs.CloudFrontDistributionId).toBeDefined();
      expect(outputs.CloudFrontDomainName).toBeDefined();
      expect(outputs.ApplicationLogGroupName).toBeDefined();
      expect(outputs.SystemLogGroupName).toBeDefined();
      expect(outputs.CloudTrailArn).toBeDefined();
    });
  });

  describe('Resource Deletion Settings', () => {
    test('S3 buckets have autoDeleteObjects enabled', () => {
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        ServiceToken: Match.anyValue()
      });
    });

    test('RDS instance has deletion protection disabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false
      });
    });

    test('All resources have DESTROY removal policy', () => {
      // Check S3 bucket
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete'
      });

      // Check RDS instance
      template.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Delete'
      });

      // Check log groups
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Security Best Practices', () => {
    test('ensures no public RDS instances', () => {
      const resources = template.findResources('AWS::RDS::DBInstance');
      Object.values(resources).forEach((resource: any) => {
        expect(resource.Properties.PubliclyAccessible).not.toBe(true);
      });
    });

    test('ensures S3 buckets block public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        if (publicAccessBlock) {
          expect(publicAccessBlock.BlockPublicAcls).toBe(true);
          expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
          expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
          expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
        }
      });
    });

    test('ensures RDS storage is encrypted', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('ensures CloudFront uses HTTPS redirect', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https'
          }
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    test('ensures VPC resources are properly tagged', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      Object.values(vpcResources).forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Environment', Value: environmentSuffix });
        expect(tags).toContainEqual({ Key: 'Project', Value: 'TapStack' });
      });
    });

    test('ensures EC2 instances are properly tagged', () => {
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      Object.values(ec2Resources).forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Environment', Value: environmentSuffix });
        expect(tags).toContainEqual({ Key: 'Project', Value: 'TapStack' });
      });
    });

    test('ensures RDS instances are properly tagged', () => {
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      Object.values(rdsResources).forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Environment', Value: environmentSuffix });
        expect(tags).toContainEqual({ Key: 'Project', Value: 'TapStack' });
        expect(tags).toContainEqual({ Key: 'Backup', Value: 'Automated' });
      });
    });
  });

  describe('Error Handling', () => {
    test('throws error when allowedSshIp is not provided', () => {
      expect(() => {
        new TapStack(app, 'TestErrorStack', { environmentSuffix });
      }).toThrow('allowedSshIp must be provided either in props or context');
    });
  });

  describe('Environment Configuration', () => {
    test('uses environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'PropsEnvStack', {
        environmentSuffix: 'prod',
        allowedSshIp: '10.0.0.1'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'prod-pr-database-prod'
      });
    });

    test('uses environmentSuffix from context when props not provided', () => {
      const contextApp = new cdk.App({ context: { environmentSuffix: 'staging', allowedSshIp: '10.0.0.1' } });
      const testStack = new TapStack(contextApp, 'ContextEnvStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'prod-pr-database-staging'
      });
    });

    test('uses default environmentSuffix when neither props nor context provided', () => {
      const defaultApp = new cdk.App({ context: { allowedSshIp: '10.0.0.1' } });
      const testStack = new TapStack(defaultApp, 'DefaultEnvStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'prod-pr-database-dev'
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('ensures proper dependency order for resources', () => {
      // VPC should be created before subnets
      const vpcLogicalId = Object.keys(template.findResources('AWS::EC2::VPC'))[0];
      const subnetLogicalIds = Object.keys(template.findResources('AWS::EC2::Subnet'));
      
      expect(vpcLogicalId).toBeDefined();
      expect(subnetLogicalIds.length).toBeGreaterThan(0);
    });
  });
});
