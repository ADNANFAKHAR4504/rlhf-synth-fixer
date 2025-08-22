/**
 * Unit tests for TapStack CloudFormation template
 * Tests the security-focused infrastructure components
 */

import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

  beforeAll(() => {
    // Load the JSON version from lib directory
    const jsonPath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(jsonPath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Security Configuration as Code');
    });

    test('should have required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.TrustedCidrBlock).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.NotificationEmail).toBeDefined();
    });

    test('should have outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.SecurityGroupId).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.SNSTopicArn).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('EC2 security group should be restrictive', () => {
      const ec2SecurityGroup = template.Resources.EC2SecurityGroup;
      expect(ec2SecurityGroup).toBeDefined();
      expect(ec2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = ec2SecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(22);
      expect(ingress[0].ToPort).toBe(22);
      expect(ingress[0].CidrIp).toBeDefined();
      expect(ingress[0].CidrIp.Ref).toBe('TrustedCidrBlock');
    });

    test('RDS security group should only allow access from EC2 security group', () => {
      const rdsSecurityGroup = template.Resources.RDSSecurityGroup;
      expect(rdsSecurityGroup).toBeDefined();
      expect(rdsSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = rdsSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toBeDefined();
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe('EC2SecurityGroup');
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
    });
  });

  describe('S3 Buckets', () => {
    test('SecureS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('SecureS3Bucket should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess).toBeDefined();
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('SecureS3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('LoggingS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.LoggingS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket policy should deny insecure connections', () => {
      const policy = template.Resources.SecureS3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyInsecure = statements.find((s: any) => s.Sid === 'DenyInsecureConnections');
      
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('S3 bucket policy should deny unencrypted uploads', () => {
      const policy = template.Resources.SecureS3BucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyUnencrypted = statements.find((s: any) => s.Sid === 'DenyUnEncryptedObjectUploads');
      
      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted.Effect).toBe('Deny');
      expect(denyUnencrypted.Action).toBe('s3:PutObject');
      expect(denyUnencrypted.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('AES256');
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should be in private subnet', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toBeDefined();
      expect(subnetIds.length).toBe(2);
    });

    test('RDS instance should not be publicly accessible', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance).toBeDefined();
      expect(rdsInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS instance should have encryption enabled', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS instance should have backup enabled', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('RDS instance should not have deletion protection for testing', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.DeletionProtection).toBe(false);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 role should follow least privilege principle', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      
      const policies = ec2Role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);
      
      // Check S3 access is read-only
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3ReadOnlyAccess');
      expect(s3Policy).toBeDefined();
      const s3Actions = s3Policy.PolicyDocument.Statement[0].Action;
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:ListBucket');
      expect(s3Actions).not.toContain('s3:PutObject');
      expect(s3Actions).not.toContain('s3:DeleteObject');
    });

    test('EC2 role should have SSM managed policy', () => {
      const ec2Role = template.Resources.EC2Role;
      const managedPolicies = ec2Role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('RDS monitoring role should exist', () => {
      const rdsRole = template.Resources.RDSMonitoringRole;
      expect(rdsRole).toBeDefined();
      expect(rdsRole.Type).toBe('AWS::IAM::Role');
      
      const managedPolicies = rdsRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole');
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic should be configured for security alerts', () => {
      const snsTopic = template.Resources.SecurityAlertsTopic;
      expect(snsTopic).toBeDefined();
      expect(snsTopic.Type).toBe('AWS::SNS::Topic');
      expect(snsTopic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('SNS topic should have a subscription', () => {
      const subscription = template.Resources.SecurityAlertsSubscription;
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.TopicArn).toBeDefined();
      expect(subscription.Properties.TopicArn.Ref).toBe('SecurityAlertsTopic');
    });

    test('SNS topic policy should allow S3 to publish', () => {
      const topicPolicy = template.Resources.SecurityAlertsTopicPolicy;
      expect(topicPolicy).toBeDefined();
      expect(topicPolicy.Type).toBe('AWS::SNS::TopicPolicy');
      
      const statements = topicPolicy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) => s.Sid === 'AllowS3ToPublish');
      
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
      expect(s3Statement.Action).toContain('SNS:Publish');
    });
  });

  describe('Network Configuration', () => {
    test('VPC should be configured', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have route tables configured', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      
      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toBeDefined();
      expect(publicRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
    });
  });

  describe('Monitoring and Logging', () => {
    test('CloudWatch log group should be configured', () => {
      const logGroup = template.Resources.SecurityLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('Resource Naming', () => {
    test('all resources requiring EnvironmentSuffix should use it', () => {
      const resourcesToCheck = [
        'EC2SecurityGroup',
        'RDSSecurityGroup',
        'EC2Role',
        'EC2InstanceProfile',
        'RDSMonitoringRole',
        'SecurityAlertsTopic',
        'DBSubnetGroup',
        'RDSInstance'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const props = JSON.stringify(resource.Properties);
          expect(props).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });
});