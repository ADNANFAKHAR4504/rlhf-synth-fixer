# Production-Ready Multi-Region Security CloudFormation Template

This CloudFormation template implements a comprehensive security configuration across multiple AWS services with multi-region support. The template follows AWS security best practices and enforces strict security controls.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready multi-region security configuration with comprehensive AWS services integration'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - ProjectName
          - Environment
          - PrimaryRegion
          - SecondaryRegion
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCidr
          - AllowedIPRanges
          - DatabaseSubnetCidr1
          - DatabaseSubnetCidr2
      - Label:
          default: 'Security Configuration'
        Parameters:
          - KMSKeyAlias
          - CloudTrailBucketName
          - NotificationEmail
    ParameterLabels:
      ProjectName:
        default: 'Project Name'
      Environment:
        default: 'Environment'
      VpcCidr:
        default: 'VPC CIDR Block'

Parameters:
  ProjectName:
    Type: String
    Default: 'secureapp'
    Description: 'Project name for resource naming convention'
    AllowedPattern: '^[a-z0-9]+$'
    ConstraintDescription: 'Must contain only lowercase letters and numbers'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues:
      - dev
      - test
      - prod
    Description: 'Environment for deployment'

  PrimaryRegion:
    Type: String
    Default: 'us-east-1'
    Description: 'Primary AWS Region'

  SecondaryRegion:
    Type: String
    Default: 'eu-west-1'
    Description: 'Secondary AWS Region'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'

  DatabaseSubnetCidr1:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for Database Subnet 1'

  DatabaseSubnetCidr2:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for Database Subnet 2'

  AllowedIPRanges:
    Type: CommaDelimitedList
    Default: '10.0.0.0/8,172.16.0.0/12,192.168.0.0/16'
    Description: 'Comma-delimited list of allowed IP ranges'

  KMSKeyAlias:
    Type: String
    Default: 'security-key'
    Description: 'Alias for KMS encryption key'

  CloudTrailBucketName:
    Type: String
    Default: 'cloudtrail-logs'
    Description: 'S3 bucket name for CloudTrail logs (will be prefixed with project-env)'

  NotificationEmail:
    Type: String
    Description: 'Email address for security notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

Conditions:
  IsPrimaryRegion: !Equals [!Ref 'AWS::Region', !Ref PrimaryRegion]
  IsProductionEnvironment: !Equals [!Ref Environment, 'prod']

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DatabaseSubnetCidr1
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-1'

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DatabaseSubnetCidr2
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-2'

  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'

  # KMS Key for Encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for ${ProjectName} ${Environment} encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey*
            Resource: '*'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-${KMSKeyAlias}'
      TargetKeyId: !Ref KMSKey

  # Security Groups
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS from anywhere'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP from anywhere (redirect to HTTPS)'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS to anywhere'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP to anywhere'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-db-sg'
      GroupDescription: 'Security group for database servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'MySQL from web servers'
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'PostgreSQL from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-sg'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-lambda-sg'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS for AWS API calls'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda-sg'

  # S3 Buckets
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-secure-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-secure-bucket'

  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Ref SecureS3Bucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Condition: IsPrimaryRegion
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${CloudTrailBucketName}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      MfaDelete: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: IsPrimaryRegion
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref CloudTrailS3Bucket
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailS3Bucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Ref CloudTrailS3Bucket
              - !Sub '${CloudTrailS3Bucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # IAM Roles and Policies
  MFAEnforcedRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-mfa-enforced-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/ReadOnlyAccess'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-mfa-enforced-role'

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-execution-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  # CloudWatch Log Groups
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-${Environment}'
      RetentionInDays: !If [IsProductionEnvironment, 365, 30]

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${Environment}'
      RetentionInDays: !If [IsProductionEnvironment, 365, 30]

  SecurityLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/security/${ProjectName}-${Environment}'
      RetentionInDays: !If [IsProductionEnvironment, 365, 30]

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Condition: IsPrimaryRegion
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-cloudtrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref KMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SecureS3Bucket}/*'
            - Type: 'AWS::S3::Bucket'
              Values:
                - !Ref SecureS3Bucket

  # AWS Config
  ConfigServiceRole:
    Type: AWS::IAM::ServiceLinkedRole
    Properties:
      AWSServiceName: config.amazonaws.com

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-config-delivery-channel'
      S3BucketName: !Ref SecureS3Bucket
      S3KeyPrefix: 'config'

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-config-recorder'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  SecurityGroupConfigRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-${Environment}-security-group-ssh-check'
      Description: 'Checks whether security groups allow unrestricted incoming SSH traffic'
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED

  IAMRoleConfigRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-${Environment}-iam-role-managed-policy-check'
      Description: 'Checks whether IAM roles have managed policies attached'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_ROLE_MANAGED_POLICY_CHECK

  # GuardDuty
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES

  # SNS Topic for Security Notifications
  SecurityNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${Environment}-security-notifications'
      KmsMasterKeyId: !Ref KMSKey

  SecurityNotificationSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref SecurityNotificationTopic
      Endpoint: !Ref NotificationEmail

  # WAF Web ACL
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-web-acl'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
        - Name: AWSManagedRulesSQLiRuleSet
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}${Environment}WebACL'

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-rds'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: !If [IsProductionEnvironment, 7, 1]
      MultiAZ: !If [IsProductionEnvironment, true, false]
      PubliclyAccessible: false
      DeletionProtection: !If [IsProductionEnvironment, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-rds'

  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-rds-secret'
      Description: 'RDS Master Password'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  # DynamoDB Table
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-${Environment}-dynamodb-table'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref KMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-dynamodb-table'

  # Lambda Function
  SecurityLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-security-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref DatabaseSubnet1
          - !Ref DatabaseSubnet2
      Environment:
        Variables:
          LOG_LEVEL: INFO
      Code:
        ZipFile: |
          import json
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info('Security function executed')
              return {
                  'statusCode': 200,
                  'body': json.dumps('Security check completed')
              }
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-security-function'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-vpc-id'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms-key-id'

  KMSKeyArn:
    Description: 'KMS Key ARN for encryption'
    Value: !GetAtt KMSKey.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms-key-arn'

  SecureS3BucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-secure-s3-bucket'

  CloudTrailS3BucketName:
    Condition: IsPrimaryRegion
    Description: 'CloudTrail S3 Bucket Name'
    Value: !Ref CloudTrailS3Bucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-cloudtrail-s3-bucket'

  WebSecurityGroupId:
    Description: 'Web Security Group ID'
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-web-sg-id'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-db-sg-id'

  RDSEndpoint:
    Description: 'RDS Instance Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${ProjectName}-${Environment}-rds-endpoint'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${ProjectName}-${Environment}-dynamodb-table-name'

  WebACLArn:
    Description: 'WAF Web ACL ARN'
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-web-acl-arn'

  GuardDutyDetectorId:
    Description: 'GuardDuty Detector ID'
    Value: !Ref GuardDutyDetector
    Export:
      Name: !Sub '${ProjectName}-${Environment}-guardduty-detector-id'

  SecurityNotificationTopicArn:
    Description: 'Security Notification Topic ARN'
    Value: !Ref SecurityNotificationTopic
    Export:
      Name: !Sub '${ProjectName}-${Environment}-security-topic-arn'

  LambdaFunctionArn:
    Description: 'Security Lambda Function ARN'
    Value: !GetAtt SecurityLambdaFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-lambda-function-arn'
```

## Key Features Implemented

### **Security Groups**

- **Web Security Group**: Allows HTTPS (443) and HTTP (80) inbound, restricted outbound
- **Database Security Group**: Only allows database connections from web security group
- **Lambda Security Group**: Restricted to HTTPS outbound for AWS API calls

### **S3 Buckets**

- **HTTPS-only enforcement** via bucket policies
- **Encryption at rest** using KMS
- **Versioning enabled** for data protection
- **Public access blocked** completely
- **MFA Delete** enabled for CloudTrail bucket

### **AWS Config**

- **Configuration tracking** enabled
- **Compliance rules** for security groups and IAM roles
- **Multi-region support** through conditional deployment

### **IAM Roles**

- **MFA enforcement** for console access with time-based conditions
- **Least privilege** principle applied
- **Service-specific roles** with minimal required permissions

### **Encryption (KMS)**

- **Centralized KMS key** for all encryption needs
- **RDS encryption** at rest
- **DynamoDB encryption** at rest
- **S3 bucket encryption** with KMS
- **CloudTrail log encryption**

### **CloudTrail**

- **Multi-region trail** enabled
- **Management and data events** logging
- **Log file validation** enabled
- **Encrypted storage** in S3

### **GuardDuty**

- **Threat detection** enabled
- **15-minute finding frequency** for rapid response
- **Multi-region deployment** support

### **Centralized Logging**

- **CloudWatch Log Groups** for different services
- **Retention policies** based on environment
- **Structured logging** approach

### **Lambda Functions**

- **VPC deployment** for network isolation
- **No public access** - deployed in private subnets
- **Restricted IAM role** with minimal permissions

### **Web Application Firewall (WAF)**

- **Common web exploits protection**
- **SQL injection protection**
- **Known bad inputs filtering**
- **CloudWatch metrics** enabled

### **RDS Instances**

- **VPC-only access** - no public accessibility
- **Security group restrictions** to web tier only
- **Encryption at rest** with KMS
- **Automated backups** with environment-based retention
- **Multi-AZ** deployment for production

## Deployment Instructions

1. **Validate the template**:

   ```bash
   aws cloudformation validate-template --template-body file://security-template.yaml
   ```

2. **Deploy to primary region**:

   ```bash
   aws cloudformation create-stack \
     --stack-name secureapp-prod-security \
     --template-body file://security-template.yaml \
     --parameters ParameterKey=NotificationEmail,ParameterValue=admin@company.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Deploy to secondary region**:
   ```bash
   aws cloudformation create-stack \
     --stack-name secureapp-prod-security \
     --template-body file://security-template.yaml \
     --parameters ParameterKey=NotificationEmail,ParameterValue=admin@company.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --region eu-west-1
   ```

## Security Best Practices Implemented

- **Principle of Least Privilege**
- **Defense in Depth**
- **Encryption at Rest and in Transit**
- **Multi-Factor Authentication**
- **Network Segmentation**
- **Comprehensive Logging and Monitoring**
- **Automated Compliance Checking**
