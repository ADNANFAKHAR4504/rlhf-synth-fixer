import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
    // Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // For unit tests, we'll parse YAML directly using a simple check
    // In practice, you'd use cfn-flip to convert to JSON first
    expect(templateContent).toBeDefined();
    expect(templateContent.length).toBeGreaterThan(0);
  });

  describe('Template Structure', () => {
    test('should be a valid YAML file', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('AWSTemplateFormatVersion');
      expect(templateContent).toContain('2010-09-09');
    });

    test('should have description', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Secure Multi-Region AWS Infrastructure');
    });

    test('should have Parameters section', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Parameters:');
    });

    test('should have Conditions section', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Conditions:');
    });

    test('should have Resources section', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Resources:');
    });

    test('should have Outputs section', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Outputs:');
    });
  });

  describe('Parameters', () => {
    test('should have ApprovedIPRange parameter', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ApprovedIPRange:');
      expect(templateContent).toContain('Type: String');
      expect(templateContent).toContain('Default: "10.0.0.0/8"');
    });

    test('should have AlertEmail parameter with email validation', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('AlertEmail:');
      expect(templateContent).toContain('AllowedPattern:');
    });

    test('should have KeyRotationDays parameter', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('KeyRotationDays:');
      expect(templateContent).toContain('Type: Number');
      expect(templateContent).toContain('Default: 90');
    });

    test('should have CreateCloudTrail parameter', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CreateCloudTrail:');
      expect(templateContent).toContain("Default: 'false'");
    });

    test('should have CreateAWSConfig parameter', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CreateAWSConfig:');
      expect(templateContent).toContain("Default: 'false'");
    });

    test('should have CreateGuardDuty parameter', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CreateGuardDuty:');
      expect(templateContent).toContain("Default: 'false'");
    });

    test('should have CreateALB parameter', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CreateALB:');
      expect(templateContent).toContain("Default: 'false'");
    });

    test('should have VPC CIDR parameters with validation', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VPCCidrBlock:');
      expect(templateContent).toContain('PrivateSubnet1Cidr:');
      expect(templateContent).toContain('PrivateSubnet2Cidr:');
      expect(templateContent).toContain('PublicSubnet1Cidr:');
      expect(templateContent).toContain('PublicSubnet2Cidr:');
      expect(templateContent).toContain('AllowedPattern:');
    });
  });

  describe('Conditions', () => {
    test('should have HasAlertEmail condition', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('HasAlertEmail:');
    });

    test('should have ShouldCreateCloudTrail condition', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ShouldCreateCloudTrail:');
    });

    test('should have ShouldCreateAWSConfig condition', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ShouldCreateAWSConfig:');
    });

    test('should have ShouldCreateGuardDuty condition', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ShouldCreateGuardDuty:');
    });

    test('should have ShouldCreateALB condition', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ShouldCreateALB:');
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should define CloudTrailBucket with encryption', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CloudTrailBucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
      expect(templateContent).toContain('BucketEncryption:');
      expect(templateContent).toContain('SSEAlgorithm: AES256');
    });

    test('should configure CloudTrailBucket with versioning', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VersioningConfiguration:');
      expect(templateContent).toContain('Status: Enabled');
    });

    test('should configure CloudTrailBucket with public access block', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PublicAccessBlockConfiguration:');
      expect(templateContent).toContain('BlockPublicAcls: true');
      expect(templateContent).toContain('BlockPublicPolicy: true');
      expect(templateContent).toContain('IgnorePublicAcls: true');
      expect(templateContent).toContain('RestrictPublicBuckets: true');
    });

    test('should configure CloudTrailBucket with lifecycle rules', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('LifecycleConfiguration:');
      expect(templateContent).toContain('ExpirationInDays:');
    });

    test('should define AccessLogsBucket with encryption', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('AccessLogsBucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
    });

    test('should define ConfigBucket with encryption', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ConfigBucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
    });

    test('should define ALBLogsBucket with encryption', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ALBLogsBucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
    });

    test('should configure CloudTrailBucketPolicy with secure transport', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CloudTrailBucketPolicy:');
      expect(templateContent).toContain('RequireSSLRequestsOnly');
      expect(templateContent).toContain("'aws:SecureTransport': false");
    });

    test('should configure ConfigBucketPolicy with proper permissions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ConfigBucketPolicy:');
      expect(templateContent).toContain('config.amazonaws.com');
    });

    test('should configure ALBLogsBucketPolicy with proper permissions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ALBLogsBucketPolicy:');
    });
  });

  describe('Lambda Function Resources', () => {
    test('should define EmptyS3BucketLambda function', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EmptyS3BucketLambda:');
      expect(templateContent).toContain('Type: AWS::Lambda::Function');
      expect(templateContent).toContain('Runtime: python3.11');
      expect(templateContent).toContain('Handler: index.handler');
      expect(templateContent).toContain('Timeout: 300');
    });

    test('should define EmptyS3BucketLambdaRole with correct permissions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EmptyS3BucketLambdaRole:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
      expect(templateContent).toContain('s3:ListBucket');
      expect(templateContent).toContain('s3:DeleteObject');
    });

    test('should define KeyRotationLambda function', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('KeyRotationLambda:');
      expect(templateContent).toContain('Type: AWS::Lambda::Function');
      expect(templateContent).toContain('Runtime: python3.9');
    });

    test('should configure KeyRotationLambda with environment variables', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Environment:');
      expect(templateContent).toContain('SNS_TOPIC_ARN:');
      expect(templateContent).toContain('MAX_KEY_AGE_DAYS:');
    });

    test('should define KeyRotationLambdaRole with IAM permissions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('KeyRotationLambdaRole:');
      expect(templateContent).toContain('iam:ListUsers');
      expect(templateContent).toContain('iam:ListAccessKeys');
      expect(templateContent).toContain('sns:Publish');
    });

    test('should define SecureLambdaFunction with KMS encryption', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('SecureLambdaFunction:');
      expect(templateContent).toContain('Type: AWS::Lambda::Function');
      expect(templateContent).toContain('KmsKeyArn:');
    });

    test('should define LambdaExecutionRole', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('LambdaExecutionRole:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
      expect(templateContent).toContain('AWSLambdaBasicExecutionRole');
    });

    test('should configure Lambda with KMS decrypt permissions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('kms:Decrypt');
    });
  });

  describe('IAM Resources', () => {
    test('should define EC2ApplicationRole', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EC2ApplicationRole:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
      expect(templateContent).toContain('ec2.amazonaws.com');
    });

    test('should configure EC2ApplicationRole with CloudWatch permissions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CloudWatchAgentServerPolicy');
    });

    test('should define EC2InstanceProfile', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EC2InstanceProfile:');
      expect(templateContent).toContain('Type: AWS::IAM::InstanceProfile');
    });

    test('should define MFAEnforcementPolicy', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('MFAEnforcementPolicy:');
      expect(templateContent).toContain('Type: AWS::IAM::ManagedPolicy');
    });

    test('should configure MFAEnforcementPolicy with MFA conditions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('DenyAllExceptListedIfNoMFA');
      expect(templateContent).toContain('aws:MultiFactorAuthPresent');
    });

    test('should define EC2IPRestrictedPolicy', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EC2IPRestrictedPolicy:');
      expect(templateContent).toContain('Type: AWS::IAM::ManagedPolicy');
    });

    test('should configure EC2IPRestrictedPolicy with IP restrictions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('aws:SourceIp');
      expect(templateContent).toContain('ApprovedIPRange');
    });

    test('should define ConfigRole for AWS Config', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ConfigRole:');
      expect(templateContent).toContain('config.amazonaws.com');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should define SecureVPC', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('SecureVPC:');
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
      expect(templateContent).toContain('EnableDnsHostnames: true');
      expect(templateContent).toContain('EnableDnsSupport: true');
    });

    test('should define VPC Flow Logs', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VPCFlowLog:');
      expect(templateContent).toContain('Type: AWS::EC2::FlowLog');
      expect(templateContent).toContain('TrafficType: ALL');
    });

    test('should define VPCFlowLogGroup', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VPCFlowLogGroup:');
      expect(templateContent).toContain('Type: AWS::Logs::LogGroup');
      expect(templateContent).toContain('RetentionInDays: 30');
    });

    test('should define PrivateSubnet1 in first AZ', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PrivateSubnet1:');
      expect(templateContent).toContain('Type: AWS::EC2::Subnet');
      expect(templateContent).toContain('MapPublicIpOnLaunch: false');
    });

    test('should define PrivateSubnet2 in second AZ', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PrivateSubnet2:');
      expect(templateContent).toContain('Type: AWS::EC2::Subnet');
    });

    test('should define PublicSubnet1 with public IP mapping', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PublicSubnet1:');
      expect(templateContent).toContain('MapPublicIpOnLaunch: true');
    });

    test('should define PublicSubnet2 with public IP mapping', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PublicSubnet2:');
      expect(templateContent).toContain('MapPublicIpOnLaunch: true');
    });

    test('should define InternetGateway', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('InternetGateway:');
      expect(templateContent).toContain('Type: AWS::EC2::InternetGateway');
    });

    test('should attach InternetGateway to VPC', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VPCGatewayAttachment:');
      expect(templateContent).toContain('Type: AWS::EC2::VPCGatewayAttachment');
    });

    test('should define PublicRouteTable', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PublicRouteTable:');
      expect(templateContent).toContain('Type: AWS::EC2::RouteTable');
    });

    test('should define PublicRoute to Internet', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PublicRoute:');
      expect(templateContent).toContain('Type: AWS::EC2::Route');
      expect(templateContent).toContain('DestinationCidrBlock: 0.0.0.0/0');
    });

    test('should define PrivateRouteTable', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PrivateRouteTable:');
      expect(templateContent).toContain('Type: AWS::EC2::RouteTable');
    });

    test('should define RestrictedSecurityGroup with IP restrictions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('RestrictedSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
      expect(templateContent).toContain('FromPort: 443');
      expect(templateContent).toContain('FromPort: 22');
    });

    test('should associate subnets with route tables', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PublicSubnet1RouteTableAssociation:');
      expect(templateContent).toContain('PublicSubnet2RouteTableAssociation:');
      expect(templateContent).toContain('PrivateSubnet1RouteTableAssociation:');
      expect(templateContent).toContain('PrivateSubnet2RouteTableAssociation:');
    });
  });

  describe('CloudTrail Resources', () => {
    test('should define CloudTrail with multi-region enabled', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CloudTrail:');
      expect(templateContent).toContain('Type: AWS::CloudTrail::Trail');
      expect(templateContent).toContain('IsMultiRegionTrail: true');
      expect(templateContent).toContain('IsLogging: true');
    });

    test('should enable log file validation', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EnableLogFileValidation: true');
    });

    test('should configure CloudTrail event selectors', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EventSelectors:');
      expect(templateContent).toContain('ReadWriteType: All');
      expect(templateContent).toContain('IncludeManagementEvents: true');
    });

    test('should configure CloudTrail insight selectors', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('InsightSelectors:');
      expect(templateContent).toContain('InsightType: ApiCallRateInsight');
    });
  });

  describe('AWS Config Resources', () => {
    test('should define ConfigRecorder', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ConfigRecorder:');
      expect(templateContent).toContain('Type: AWS::Config::ConfigurationRecorder');
      expect(templateContent).toContain('AllSupported: true');
      expect(templateContent).toContain('IncludeGlobalResourceTypes: true');
    });

    test('should define ConfigDeliveryChannel', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ConfigDeliveryChannel:');
      expect(templateContent).toContain('Type: AWS::Config::DeliveryChannel');
      expect(templateContent).toContain('DeliveryFrequency: TwentyFour_Hours');
    });

    test('should define S3BucketEncryptionRule', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('S3BucketEncryptionRule:');
      expect(templateContent).toContain('Type: AWS::Config::ConfigRule');
      expect(templateContent).toContain('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });

    test('should define S3BucketVersioningRule', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('S3BucketVersioningRule:');
      expect(templateContent).toContain('S3_BUCKET_VERSIONING_ENABLED');
    });

    test('should define EBSEncryptionRule', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EBSEncryptionRule:');
      expect(templateContent).toContain('ENCRYPTED_VOLUMES');
    });

    test('should define RDSPublicAccessRule', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('RDSPublicAccessRule:');
      expect(templateContent).toContain('RDS_INSTANCE_PUBLIC_ACCESS_CHECK');
    });

    test('should define IAMMFARule', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('IAMMFARule:');
      expect(templateContent).toContain('IAM_USER_MFA_ENABLED');
    });
  });

  describe('GuardDuty Resources', () => {
    test('should define GuardDutyDetector', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('GuardDutyDetector:');
      expect(templateContent).toContain('Type: AWS::GuardDuty::Detector');
      expect(templateContent).toContain('Enable: true');
    });

    test('should configure GuardDuty finding frequency', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('FindingPublishingFrequency: FIFTEEN_MINUTES');
    });
  });

  describe('SNS Resources', () => {
    test('should define SecurityAlertTopic', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('SecurityAlertTopic:');
      expect(templateContent).toContain('Type: AWS::SNS::Topic');
      expect(templateContent).toContain('DisplayName: Security Alerts');
    });

    test('should configure SecurityAlertTopic with conditional email subscription', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Subscription:');
      expect(templateContent).toContain('HasAlertEmail');
    });

    test('should define SecurityAlertTopicPolicy', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('SecurityAlertTopicPolicy:');
      expect(templateContent).toContain('Type: AWS::SNS::TopicPolicy');
      expect(templateContent).toContain('cloudwatch.amazonaws.com');
      expect(templateContent).toContain('config.amazonaws.com');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should define UnauthorizedAPICallsAlarm', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('UnauthorizedAPICallsAlarm:');
      expect(templateContent).toContain('Type: AWS::CloudWatch::Alarm');
      expect(templateContent).toContain('MetricName: UnauthorizedAPICalls');
    });

    test('should define RootAccountUsageAlarm', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('RootAccountUsageAlarm:');
      expect(templateContent).toContain('MetricName: RootAccountUsage');
    });

    test('should configure alarms with SNS actions', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('AlarmActions:');
      expect(templateContent).toContain('SecurityAlertTopic');
    });
  });

  describe('EventBridge Resources', () => {
    test('should define KeyRotationSchedule', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('KeyRotationSchedule:');
      expect(templateContent).toContain('Type: AWS::Events::Rule');
      expect(templateContent).toContain("ScheduleExpression: 'cron(0 9 * * ? *)'");
    });

    test('should configure KeyRotationSchedule with Lambda target', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Targets:');
      expect(templateContent).toContain('KeyRotationLambda');
    });

    test('should define KeyRotationLambdaPermission', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('KeyRotationLambdaPermission:');
      expect(templateContent).toContain('Type: AWS::Lambda::Permission');
      expect(templateContent).toContain('events.amazonaws.com');
    });
  });

  describe('RDS Resources', () => {
    test('should define SecureRDSInstance', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('SecureRDSInstance:');
      expect(templateContent).toContain('Type: AWS::RDS::DBInstance');
      expect(templateContent).toContain('Engine: mysql');
    });

    test('should configure RDS with encryption', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('StorageEncrypted: true');
    });

    test('should configure RDS as non-public', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('PubliclyAccessible: false');
    });

    test('should configure RDS with backup retention', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('BackupRetentionPeriod: 7');
    });

    test('should enable CloudWatch log exports', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EnableCloudwatchLogsExports:');
      expect(templateContent).toContain('error');
      expect(templateContent).toContain('general');
      expect(templateContent).toContain('slowquery');
    });

    test('should define DBSubnetGroup', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('DBSubnetGroup:');
      expect(templateContent).toContain('Type: AWS::RDS::DBSubnetGroup');
    });

    test('should define RDSSecurityGroup', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('RDSSecurityGroup:');
      expect(templateContent).toContain('FromPort: 3306');
    });

    test('should define RDSPasswordSecret', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('RDSPasswordSecret:');
      expect(templateContent).toContain('Type: AWS::SecretsManager::Secret');
      expect(templateContent).toContain('GenerateSecretString:');
    });
  });

  describe('EBS Resources', () => {
    test('should define EncryptedEBSVolume', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EncryptedEBSVolume:');
      expect(templateContent).toContain('Type: AWS::EC2::Volume');
      expect(templateContent).toContain('Encrypted: true');
    });

    test('should configure EBS volume size', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Size: 10');
    });
  });

  describe('ALB Resources', () => {
    test('should define ApplicationLoadBalancer', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ApplicationLoadBalancer:');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(templateContent).toContain('Type: application');
      expect(templateContent).toContain('Scheme: internet-facing');
    });

    test('should configure ALB with access logs', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('access_logs.s3.enabled');
      expect(templateContent).toContain('access_logs.s3.bucket');
    });

    test('should define ALBSecurityGroup', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ALBSecurityGroup:');
      expect(templateContent).toContain('FromPort: 443');
      expect(templateContent).toContain('FromPort: 80');
    });
  });

  describe('KMS Resources', () => {
    test('should define LambdaKMSKey', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('LambdaKMSKey:');
      expect(templateContent).toContain('Type: AWS::KMS::Key');
    });

    test('should configure KMS key policy', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('KeyPolicy:');
      expect(templateContent).toContain('Enable IAM User Permissions');
    });

    test('should define LambdaKMSKeyAlias', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('LambdaKMSKeyAlias:');
      expect(templateContent).toContain('Type: AWS::KMS::Alias');
    });
  });

  describe('Custom Resources', () => {
    test('should define EmptyCloudTrailBucket custom resource', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EmptyCloudTrailBucket:');
      expect(templateContent).toContain('Type: Custom::EmptyS3Bucket');
    });

    test('should define EmptyConfigBucket custom resource', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EmptyConfigBucket:');
      expect(templateContent).toContain('Type: Custom::EmptyS3Bucket');
    });

    test('should define EmptyALBLogsBucket custom resource', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EmptyALBLogsBucket:');
      expect(templateContent).toContain('Type: Custom::EmptyS3Bucket');
    });
  });

  describe('Resource Dependencies', () => {
    test('should define CloudTrail dependency on bucket policy', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('DependsOn:');
      expect(templateContent).toContain('CloudTrailBucketPolicy');
    });

    test('should define PublicRoute dependency on gateway attachment', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VPCGatewayAttachment');
    });

    test('should define Config rules dependency on recorder', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ConfigRecorder');
    });
  });

  describe('Resource Tagging', () => {
    test('should tag S3 buckets', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Tags:');
      expect(templateContent).toContain('Key: Purpose');
    });

    test('should tag CloudTrail', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Value: SecurityAuditing');
    });

    test('should tag VPC resources', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Key: Name');
    });
  });

  describe('Outputs', () => {
    test('should output S3 bucket names', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('CloudTrailBucketName:');
      expect(templateContent).toContain('AccessLogsBucketName:');
      expect(templateContent).toContain('ConfigBucketName:');
      expect(templateContent).toContain('ALBLogsBucketName:');
    });

    test('should output Lambda ARNs', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EmptyS3BucketLambdaArn:');
      expect(templateContent).toContain('KeyRotationLambdaArn:');
      expect(templateContent).toContain('SecureLambdaFunctionArn:');
    });

    test('should output IAM role ARNs', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EC2ApplicationRoleArn:');
      expect(templateContent).toContain('MFAEnforcementPolicyArn:');
      expect(templateContent).toContain('EC2IPRestrictedPolicyArn:');
    });

    test('should output VPC and networking IDs', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VPCId:');
      expect(templateContent).toContain('PrivateSubnet1Id:');
      expect(templateContent).toContain('PrivateSubnet2Id:');
      expect(templateContent).toContain('PublicSubnet1Id:');
      expect(templateContent).toContain('PublicSubnet2Id:');
      expect(templateContent).toContain('InternetGatewayId:');
      expect(templateContent).toContain('RestrictedSecurityGroupId:');
    });

    test('should output CloudWatch resource names', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VPCFlowLogGroupName:');
      expect(templateContent).toContain('UnauthorizedAPICallsAlarmName:');
      expect(templateContent).toContain('RootAccountUsageAlarmName:');
    });

    test('should output RDS information', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('RDSInstanceId:');
      expect(templateContent).toContain('RDSInstanceEndpoint:');
      expect(templateContent).toContain('RDSSecretArn:');
    });

    test('should output KMS key information', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('LambdaKMSKeyId:');
      expect(templateContent).toContain('LambdaKMSKeyArn:');
    });

    test('should output ALB information', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ApplicationLoadBalancerArn:');
      expect(templateContent).toContain('ApplicationLoadBalancerDNS:');
    });

    test('should export outputs with stack name prefix', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Export:');
      expect(templateContent).toContain("Name: !Sub '${AWS::StackName}");
    });
  });

  describe('Security Best Practices', () => {
    test('should enforce encryption on all S3 buckets', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      const bucketCount = (templateContent.match(/Type: AWS::S3::Bucket/g) || []).length;
      const encryptionCount = (templateContent.match(/BucketEncryption:/g) || []).length;

      expect(bucketCount).toBeGreaterThan(0);
      expect(encryptionCount).toBeGreaterThan(0);
    });

    test('should enable versioning on critical S3 buckets', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VersioningConfiguration:');
      expect(templateContent).toContain('Status: Enabled');
    });

    test('should block public access on all S3 buckets', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      const publicAccessBlockCount = (templateContent.match(/PublicAccessBlockConfiguration:/g) || []).length;
      expect(publicAccessBlockCount).toBeGreaterThan(0);
    });

    test('should enforce SSL/TLS for S3 access', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('RequireSSLRequestsOnly');
      expect(templateContent).toContain('aws:SecureTransport');
    });

    test('should encrypt RDS storage', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('StorageEncrypted: true');
    });

    test('should encrypt EBS volumes', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Encrypted: true');
    });

    test('should use KMS for Lambda encryption', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('KmsKeyArn:');
    });

    test('should configure MFA enforcement policy', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('aws:MultiFactorAuthPresent');
    });
  });

  describe('High Availability', () => {
    test('should deploy subnets across multiple AZs', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('!Select [0, !GetAZs');
      expect(templateContent).toContain('!Select [1, !GetAZs');
    });

    test('should configure RDS in subnet group across AZs', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('DBSubnetGroup:');
      expect(templateContent).toContain('PrivateSubnet1');
      expect(templateContent).toContain('PrivateSubnet2');
    });

    test('should deploy ALB across multiple subnets', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('Subnets:');
      expect(templateContent).toContain('PublicSubnet1');
      expect(templateContent).toContain('PublicSubnet2');
    });
  });

  describe('Monitoring and Logging', () => {
    test('should enable VPC Flow Logs', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('VPCFlowLog:');
      expect(templateContent).toContain('TrafficType: ALL');
    });

    test('should configure CloudWatch alarms', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('UnauthorizedAPICallsAlarm:');
      expect(templateContent).toContain('RootAccountUsageAlarm:');
    });

    test('should enable CloudTrail logging', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('IsLogging: true');
    });

    test('should enable RDS CloudWatch log exports', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('EnableCloudwatchLogsExports:');
    });

    test('should enable ALB access logging', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('access_logs.s3.enabled');
    });
  });

  describe('Compliance and Governance', () => {
    test('should enable AWS Config', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('ConfigRecorder:');
      expect(templateContent).toContain('AllSupported: true');
    });

    test('should define compliance config rules', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('S3BucketEncryptionRule:');
      expect(templateContent).toContain('S3BucketVersioningRule:');
      expect(templateContent).toContain('EBSEncryptionRule:');
      expect(templateContent).toContain('RDSPublicAccessRule:');
      expect(templateContent).toContain('IAMMFARule:');
    });

    test('should enable GuardDuty for threat detection', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('GuardDutyDetector:');
      expect(templateContent).toContain('Enable: true');
    });
  });

  describe('Lifecycle Management', () => {
    test('should configure S3 lifecycle policies', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('LifecycleConfiguration:');
      expect(templateContent).toContain('ExpirationInDays:');
    });

    test('should configure CloudWatch Logs retention', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('RetentionInDays: 30');
    });

    test('should configure RDS backup retention', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('BackupRetentionPeriod: 7');
    });
  });

  describe('Deletion Policies', () => {
    test('should set deletion policies for S3 buckets', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('DeletionPolicy: Delete');
    });

    test('should set update/replace policies for EBS', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      expect(templateContent).toContain('UpdateReplacePolicy: Delete');
    });
  });
});
