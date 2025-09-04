import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let templateContent: string;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation template format', () => {
      expect(templateContent).toBeDefined();
      expect(templateContent).toContain('AWSTemplateFormatVersion: "2010-09-09"');
      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Parameters:');
      expect(templateContent).toContain('Conditions:');
      expect(templateContent).toContain('Resources:');
      expect(templateContent).toContain('Outputs:');
    });

    test('should have required parameters', () => {
      expect(templateContent).toContain('EnvironmentSuffix:');
      expect(templateContent).toContain('EnvironmentName:');
      expect(templateContent).toContain('ProjectName:');
      expect(templateContent).toContain('KeyPairName:');
      expect(templateContent).toContain('ExistingVPCId:');
      expect(templateContent).toContain('InstanceType:');
      expect(templateContent).toContain('DBInstanceClass:');
      expect(templateContent).toContain('DBUsername:');
    });

    test('should have conditions for optional parameters', () => {
      expect(templateContent).toContain('Conditions:');
      expect(templateContent).toContain('HasKeyPair:');
      expect(templateContent).toContain('!Not');
      expect(templateContent).toContain('!Equals');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should use existing VPC', () => {
      expect(templateContent).toContain('ExistingVPCId');
      expect(templateContent).toContain('vpc-05ddc543c44b25690');
      expect(templateContent).toContain('VpcId: !Ref ExistingVPCId');
    });

    test('should use existing Internet Gateway', () => {
      expect(templateContent).toContain('ExistingInternetGatewayId');
      expect(templateContent).toContain('igw-0fcffd108e58e6be9');
      expect(templateContent).toContain('GatewayId: !Ref ExistingInternetGatewayId');
    });

    test('should create public subnets', () => {
      expect(templateContent).toContain('PublicSubnet1:');
      expect(templateContent).toContain('PublicSubnet2:');
      expect(templateContent).toContain('MapPublicIpOnLaunch: true');
    });

    test('should create private subnets', () => {
      expect(templateContent).toContain('PrivateSubnet1:');
      expect(templateContent).toContain('PrivateSubnet2:');
    });



    test('should have v2 naming convention', () => {
      expect(templateContent).toContain('securewebapp-v2');
      expect(templateContent).toContain('dev-v2');
    });

    test('should create NAT Gateway', () => {
      expect(templateContent).toContain('Type: AWS::EC2::NatGateway');
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      expect(templateContent).toContain('ALBSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should create web server security group', () => {
      expect(templateContent).toContain('WebServerSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should create database security group', () => {
      expect(templateContent).toContain('DatabaseSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key for encryption', () => {
      expect(templateContent).toContain('KMSKey:');
      expect(templateContent).toContain('Type: AWS::KMS::Key');
    });

    test('should create KMS key alias', () => {
      expect(templateContent).toContain('KMSKeyAlias:');
      expect(templateContent).toContain('Type: AWS::KMS::Alias');
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with encryption', () => {
      expect(templateContent).toContain('ApplicationBucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
      expect(templateContent).toContain('BucketEncryption:');
      expect(templateContent).toContain('PublicAccessBlockConfiguration:');
    });

    test('should have proper S3 bucket security configuration', () => {
      expect(templateContent).toContain('BlockPublicAcls: true');
      expect(templateContent).toContain('BlockPublicPolicy: true');
      expect(templateContent).toContain('IgnorePublicAcls: true');
      expect(templateContent).toContain('RestrictPublicBuckets: true');
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail with S3 logging', () => {
      expect(templateContent).toContain('CloudTrail:');
      expect(templateContent).toContain('Type: AWS::CloudTrail::Trail');
      expect(templateContent).toContain('IncludeGlobalServiceEvents: true');
      expect(templateContent).toContain('IsMultiRegionTrail: false');
      expect(templateContent).toContain('IsLogging: true');
      expect(templateContent).toContain('EnableLogFileValidation: true');
    });

    test('should have proper CloudTrail event selectors', () => {
      expect(templateContent).toContain('EventSelectors:');
      expect(templateContent).toContain('ReadWriteType: All');
      expect(templateContent).toContain('IncludeManagementEvents: true');
    });

    test('should have separate CloudTrail bucket', () => {
      expect(templateContent).toContain('CloudTrailBucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
    });

    test('should have CloudTrail bucket policy', () => {
      expect(templateContent).toContain('CloudTrailBucketPolicy:');
      expect(templateContent).toContain('Type: AWS::S3::BucketPolicy');
      expect(templateContent).toContain('AWSCloudTrailAclCheck');
      expect(templateContent).toContain('AWSCloudTrailWrite');
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role', () => {
      expect(templateContent).toContain('EC2InstanceRole:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
      expect(templateContent).toContain('ec2.amazonaws.com');
    });

    test('should create EC2 instance profile', () => {
      expect(templateContent).toContain('EC2InstanceProfile:');
      expect(templateContent).toContain('Type: AWS::IAM::InstanceProfile');
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance with encryption', () => {
      expect(templateContent).toContain('Database:');
      expect(templateContent).toContain('Type: AWS::RDS::DBInstance');
      expect(templateContent).toContain('StorageEncrypted: true');
      expect(templateContent).toContain('MultiAZ: true');
      expect(templateContent).toContain('DeletionProtection: false');
    });

    test('should create database secret', () => {
      expect(templateContent).toContain('DatabaseSecret:');
      expect(templateContent).toContain('Type: AWS::SecretsManager::Secret');
      expect(templateContent).toContain('GenerateSecretString:');
      expect(templateContent).toContain('PasswordLength: 32');
    });

    test('should create RDS subnet group', () => {
      expect(templateContent).toContain('DBSubnetGroup:');
      expect(templateContent).toContain('Type: AWS::RDS::DBSubnetGroup');
    });

    test('should create RDS parameter group', () => {
      expect(templateContent).toContain('DBParameterGroup:');
      expect(templateContent).toContain('Type: AWS::RDS::DBParameterGroup');
      expect(templateContent).toContain('Family: mysql8.0');
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      expect(templateContent).toContain('ApplicationLoadBalancer:');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(templateContent).toContain('Scheme: internet-facing');
      expect(templateContent).toContain('Type: application');
    });

    test('should create target group', () => {
      expect(templateContent).toContain('ALBTargetGroup:');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(templateContent).toContain('HealthCheckPath: /health');
    });

    test('should create ALB listener', () => {
      expect(templateContent).toContain('ALBListener:');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::Listener');
      expect(templateContent).toContain('Port: 80');
      expect(templateContent).toContain('Protocol: HTTP');
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create launch template', () => {
      expect(templateContent).toContain('LaunchTemplate:');
      expect(templateContent).toContain('Type: AWS::EC2::LaunchTemplate');
    });

    test('should create auto scaling group', () => {
      expect(templateContent).toContain('AutoScalingGroup:');
      expect(templateContent).toContain('Type: AWS::AutoScaling::AutoScalingGroup');
      expect(templateContent).toContain('HealthCheckType: ELB');
    });

    test('should create scaling policies', () => {
      expect(templateContent).toContain('ScaleUpPolicy:');
      expect(templateContent).toContain('ScaleDownPolicy:');
      expect(templateContent).toContain('Type: AWS::AutoScaling::ScalingPolicy');
    });

    test('should tag EC2 instances with Environment:Production', () => {
      // Check in launch template TagSpecifications
      const tagSection = templateContent.substring(
        templateContent.indexOf('TagSpecifications:'),
        templateContent.indexOf('AutoScalingGroup:')
      );
      expect(tagSection).toContain('Key: Environment');
      expect(tagSection).toContain('Value: Production');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create high CPU alarm', () => {
      expect(templateContent).toContain('HighCPUAlarm:');
      expect(templateContent).toContain('Type: AWS::CloudWatch::Alarm');
      expect(templateContent).toContain('Threshold: 70');
    });

    test('should create low CPU alarm', () => {
      expect(templateContent).toContain('LowCPUAlarm:');
      expect(templateContent).toContain('Type: AWS::CloudWatch::Alarm');
      expect(templateContent).toContain('Threshold: 30');
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      expect(templateContent).toContain('VPCId:');
      expect(templateContent).toContain('Export:');
    });

    test('should export ALB DNS name', () => {
      expect(templateContent).toContain('ApplicationLoadBalancerDNS:');
      expect(templateContent).toContain('Export:');
    });

    test('should export database endpoint', () => {
      expect(templateContent).toContain('DatabaseEndpoint:');
      expect(templateContent).toContain('Export:');
    });

    test('should export S3 bucket name', () => {
      expect(templateContent).toContain('S3BucketName:');
      expect(templateContent).toContain('Export:');
    });

    test('should export CloudTrail name', () => {
      expect(templateContent).toContain('CloudTrailName:');
      expect(templateContent).toContain('Export:');
    });

    test('should export KMS key ID', () => {
      expect(templateContent).toContain('KMSKeyId:');
      expect(templateContent).toContain('Export:');
    });
  });

  describe('Security and Compliance', () => {
    test('should have RDS encryption enabled', () => {
      expect(templateContent).toContain('StorageEncrypted: true');
      expect(templateContent).toContain('KmsKeyId: !Ref KMSKey');
    });

    test('should have S3 bucket encryption', () => {
      expect(templateContent).toContain('BucketEncryption:');
      expect(templateContent).toContain('ServerSideEncryptionConfiguration:');
    });

    test('should have CloudTrail logging', () => {
      expect(templateContent).toContain('IsLogging: true');
      expect(templateContent).toContain('S3BucketName: !Ref CloudTrailBucket');
    });

    test('should have IAM roles with least privilege', () => {
      expect(templateContent).toContain('Policies:');
      expect(templateContent).toContain('PolicyName: S3AccessPolicy');
    });

    test('should have security groups with restricted access', () => {
      expect(templateContent).toContain('SecurityGroupIngress:');
    });
  });

  describe('Resource Counts', () => {
    test('should have expected number of subnets', () => {
      const subnetMatches = (templateContent.match(/Type: AWS::EC2::Subnet/g) || []).length;
      expect(subnetMatches).toBeGreaterThanOrEqual(4); // At least 2 public + 2 private
    });

    test('should have expected number of security groups', () => {
      const sgMatches = (templateContent.match(/Type: AWS::EC2::SecurityGroup/g) || []).length;
      expect(sgMatches).toBe(3); // ALB, WebServer, Database
    });

    test('should have expected number of route tables', () => {
      const rtMatches = (templateContent.match(/Type: AWS::EC2::RouteTable/g) || []).length;
      expect(rtMatches).toBe(2); // Public and Private
    });
  });

  describe('Template Validation', () => {
    test('should not contain hardcoded credentials', () => {
      expect(templateContent).not.toContain('AKIA');
      expect(templateContent).not.toContain('sk_');
      expect(templateContent).not.toContain('password: "');
    });

    test('should use parameter references for configurable values', () => {
      expect(templateContent).toContain('EnvironmentSuffix');
      expect(templateContent).toContain('!Ref EnvironmentName');
      expect(templateContent).toContain('ProjectName');
      expect(templateContent).toContain('!Ref ExistingVPCId');
    });

    test('should have proper resource naming with environment suffix', () => {
      expect(templateContent).toContain('!Sub "${ProjectName}-${EnvironmentSuffix}');
      expect(templateContent).toContain('!Ref EnvironmentName');
    });
  });
});
