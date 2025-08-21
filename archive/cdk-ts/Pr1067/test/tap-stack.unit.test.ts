import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('VPC is created with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has correct tag name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `migration-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('Creates exactly 2 public subnets', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(publicSubnets).length).toBe(2);
    });

    test('Creates exactly 2 private subnets', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBe(2);
    });

    test('Creates exactly 1 NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Creates VPC Gateway Attachment', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });
  });

  describe('Security Groups', () => {
    test('Web server security group allows HTTP traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `web-server-sg-${environmentSuffix}`,
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('Web server security group allows HTTPS traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `web-server-sg-${environmentSuffix}`,
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('Web server security group does NOT allow SSH traffic (using Session Manager instead)', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupName: `web-server-sg-${environmentSuffix}`,
        },
      });
      
      Object.values(securityGroups).forEach((sg: any) => {
        const ingressRules = sg.Properties?.SecurityGroupIngress || [];
        const sshRule = ingressRules.find((rule: any) => 
          rule.FromPort === 22 && rule.ToPort === 22
        );
        expect(sshRule).toBeUndefined();
      });
    });

    test('Database security group allows MySQL from web server', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `database-sg-${environmentSuffix}`,
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
          }),
        ]),
      });
    });

    test('Database security group restricts outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `database-sg-${environmentSuffix}`,
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '255.255.255.255/32',
          }),
        ]),
      });
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance is created with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `web-server-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('EC2 instance has user data script', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.objectLike({
          'Fn::Base64': Match.stringLikeRegexp('.*httpd.*'),
        }),
      });
    });

    test('EC2 instance has IAM instance profile', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        IamInstanceProfile: Match.objectLike({
          Ref: Match.anyValue(),
        }),
      });
    });
  });

  describe('IAM Roles', () => {
    test('EC2 role is created with S3 full access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ec2-s3-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonS3FullAccess.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Instance profile is created for EC2', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance is created with correct properties', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `migration-database-${environmentSuffix}`,
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        DeletionProtection: false,
        MultiAZ: false,
        PubliclyAccessible: false,
        EnablePerformanceInsights: false, // Not supported for t3.micro
      });
    });

    test('RDS instance has automated backups configured', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: true,
      });
    });

    test('RDS subnet group is created', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: `database-subnet-group-${environmentSuffix}`,
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('RDS credentials secret is created', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `migration-db-credentials-${environmentSuffix}`,
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"dbadmin"}',
        }),
      });
    });

    test('RDS secret attachment is created', () => {
      template.resourceCountIs('AWS::SecretsManager::SecretTargetAttachment', 1);
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket is created with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'AES256',
              }),
            }),
          ]),
        }),
        VersioningConfiguration: Match.objectLike({
          Status: 'Enabled',
        }),
      });
      
      // Verify bucket naming contains environment suffix
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(buckets)[0] as any;
      expect(bucketResource.Properties.BucketName).toMatchObject({
        'Fn::Join': [
          '',
          [
            `migration-app-logs-${environmentSuffix}-`,
            { Ref: 'AWS::AccountId' },
          ],
        ],
      });
    });

    test('S3 bucket has public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }),
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 90,
            }),
          ]),
        }),
      });
    });

    test('S3 bucket has auto-delete objects configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Session Manager Configuration', () => {
    test('Session Manager document is created', () => {
      template.hasResourceProperties('AWS::SSM::Document', {
        DocumentType: 'Session',
        DocumentFormat: 'JSON',
      });
    });

    test('Session Manager log group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ssm/session-manager-${environmentSuffix}`,
      });
    });

    test('EC2 role has SSM managed instance core policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ec2-s3-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('EC2 role has CloudWatch agent policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ec2-s3-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy.*'),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Application Insights', () => {
    test('Resource group is created for Application Insights', () => {
      template.hasResourceProperties('AWS::ResourceGroups::Group', {
        Name: `migration-resources-${environmentSuffix}`,
        Description: 'Resource group for migration application monitoring',
      });
    });

    test('Application Insights application is created', () => {
      template.hasResourceProperties('AWS::ApplicationInsights::Application', {
        AutoConfigurationEnabled: true,
        CWEMonitorEnabled: true,
        OpsCenterEnabled: true,
      });
    });

    test('Application log group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ec2/migration-app-${environmentSuffix}`,
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('VPC ID output is created', () => {
      template.hasOutput('VpcId', {
        Description: 'ID of the migration VPC',
      });
    });

    test('Web server instance ID output is created', () => {
      template.hasOutput('WebServerInstanceId', {
        Description: 'ID of the web server EC2 instance',
      });
    });

    test('Web server public IP output is created', () => {
      template.hasOutput('WebServerPublicIp', {
        Description: 'Public IP address of the web server',
      });
    });

    test('Database endpoint output is created', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('Logs bucket name output is created', () => {
      template.hasOutput('LogsBucketName', {
        Description: 'S3 bucket name for application logs',
      });
    });

    test('Database credentials secret output is created', () => {
      template.hasOutput('DatabaseCredentialsSecret', {
        Description: 'AWS Secrets Manager secret name for database credentials',
      });
    });

    test('Session Manager log group output is created', () => {
      template.hasOutput('SessionManagerLogGroupName', {
        Description: 'CloudWatch log group for Session Manager sessions',
      });
    });

    test('Application log group output is created', () => {
      template.hasOutput('ApplicationLogGroupName', {
        Description: 'CloudWatch log group for application logs',
      });
    });

    test('Application Insights resource group output is created', () => {
      template.hasOutput('ApplicationInsightsResourceGroupName', {
        Description: 'CloudWatch Application Insights resource group name',
      });
    });
  });

  describe('Resource Removal Policies', () => {
    test('RDS instance has DESTROY removal policy', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('S3 bucket has DESTROY removal policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('Database subnet group has DESTROY removal policy', () => {
      template.hasResource('AWS::RDS::DBSubnetGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Migration Requirements Validation', () => {
    test('Infrastructure supports multi-AZ deployment', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set<string>();
      
      Object.values(subnets).forEach((subnet: any) => {
        if (subnet.Properties?.AvailabilityZone) {
          azs.add(subnet.Properties.AvailabilityZone);
        }
      });
      
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Private subnets have NAT gateway routes', () => {
      const routes = template.findResources('AWS::EC2::Route', {
        Properties: {
          NatGatewayId: Match.anyValue(),
        },
      });
      expect(Object.keys(routes).length).toBeGreaterThanOrEqual(2);
    });

    test('All required security measures are in place', () => {
      // Check RDS encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });

      // Check S3 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.anyValue(),
        }),
      });

      // Check S3 public access blocking
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
        }),
      });
    });
  });
});