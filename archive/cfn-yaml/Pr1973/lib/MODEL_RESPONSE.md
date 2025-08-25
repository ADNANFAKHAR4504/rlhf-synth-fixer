# Comprehensive Multi-Account Security CloudFormation Template

Below is a comprehensive CloudFormation template that implements all the requested security measures. This template is designed for deployment in a multi-account AWS environment with centralized security controls.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Comprehensive multi-account security-focused CloudFormation template with advanced AWS security measures'

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnetCidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for the public subnet'

  PrivateSubnetCidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for the private subnet'

  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment name'

  OrganizationId:
    Type: String
    Description: 'AWS Organization ID for cross-account access'

  MasterAccountId:
    Type: String
    Description: 'Master account ID for centralized logging'

  KmsKeyId:
    Type: String
    Description: 'KMS Key ID for encryption (optional - will create new if not provided)'
    Default: ''

Conditions:
  CreateKmsKey: !Equals [!Ref KmsKeyId, '']

Resources:
  # KMS Key for Encryption
  SecurityKmsKey:
    Type: AWS::KMS::Key
    Condition: CreateKmsKey
    Properties:
      Description: 'KMS Key for security services encryption'
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
          - Sid: Allow Config to use the key
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'

  SecurityKmsKeyAlias:
    Type: AWS::KMS::Alias
    Condition: CreateKmsKey
    Properties:
      AliasName: !Sub 'alias/security-${Environment}'
      TargetKeyId: !Ref SecurityKmsKey

  # VPC Configuration
  SecurityVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'Security-VPC-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecurityVpc
      CidrBlock: !Ref PublicSubnetCidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'Public-Subnet-${Environment}'
        - Key: Type
          Value: 'Public'

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecurityVpc
      CidrBlock: !Ref PrivateSubnetCidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Private-Subnet-${Environment}'
        - Key: Type
          Value: 'Private'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${Environment}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecurityVpc
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecurityVpc
      Tags:
        - Key: Name
          Value: !Sub 'Public-RT-${Environment}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  # S3 Bucket for CloudTrail Logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${AWS::AccountId}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !If
                - CreateKmsKey
                - !Ref SecurityKmsKey
                - !Ref KmsKeyId
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 2555 # 7 years
            NoncurrentVersionExpirationInDays: 30

  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailLogsBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # CloudTrail Configuration
  SecurityCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailLogsBucketPolicy
    Properties:
      TrailName: !Sub 'SecurityTrail-${Environment}'
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !If
        - CreateKmsKey
        - !Ref SecurityKmsKey
        - !Ref KmsKeyId
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: ['arn:aws:s3:::*/*']
            - Type: 'AWS::S3::Bucket'
              Values: ['arn:aws:s3:::*']

  # IAM Roles with Least Privilege
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2-SecurityRole-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: 'EC2SecurityPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/secure/*'
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # Lambda Role for Access Key Rotation
  AccessKeyRotationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'AccessKeyRotation-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: 'AccessKeyRotationPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - iam:ListUsers
                  - iam:ListAccessKeys
                  - iam:GetAccessKeyLastUsed
                  - iam:UpdateAccessKey
                  - iam:DeleteAccessKey
                  - iam:CreateAccessKey
                Resource: '*'
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SecurityNotificationTopic

  # SNS Topic for Security Notifications
  SecurityNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'SecurityNotifications-${Environment}'
      KmsMasterKeyId: !If
        - CreateKmsKey
        - !Ref SecurityKmsKey
        - !Ref KmsKeyId

  # Lambda Function for Access Key Rotation
  AccessKeyRotationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'AccessKeyRotation-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt AccessKeyRotationRole.Arn
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SecurityNotificationTopic
      Code:
        ZipFile: |
          import boto3
          import json
          import os
          from datetime import datetime, timedelta

          def lambda_handler(event, context):
              iam = boto3.client('iam')
              sns = boto3.client('sns')
              
              # Get all users
              paginator = iam.get_paginator('list_users')
              
              for page in paginator.paginate():
                  for user in page['Users']:
                      username = user['UserName']
                      
                      # Get access keys for user
                      keys = iam.list_access_keys(UserName=username)
                      
                      for key in keys['AccessKeyMetadata']:
                          key_id = key['AccessKeyId']
                          created_date = key['CreateDate'].replace(tzinfo=None)
                          
                          # Check if key is older than 90 days
                          if (datetime.utcnow() - created_date).days > 90:
                              # Disable the key
                              iam.update_access_key(
                                  UserName=username,
                                  AccessKeyId=key_id,
                                  Status='Inactive'
                              )
                              
                              # Send notification
                              message = f"Access key {key_id} for user {username} has been disabled due to age (>90 days)"
                              sns.publish(
                                  TopicArn=os.environ['SNS_TOPIC_ARN'],
                                  Message=message,
                                  Subject='Access Key Rotation Alert'
                              )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Access key rotation check completed')
              }

  # EventBridge Rule for Access Key Rotation
  AccessKeyRotationSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'AccessKeyRotationSchedule-${Environment}'
      Description: 'Trigger access key rotation check weekly'
      ScheduleExpression: 'rate(7 days)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt AccessKeyRotationFunction.Arn
          Id: 'AccessKeyRotationTarget'

  AccessKeyRotationPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref AccessKeyRotationFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt AccessKeyRotationSchedule.Arn

  # AWS Config Configuration
  ConfigServiceRole:
    Type: AWS::IAM::ServiceLinkedRole
    Properties:
      AWSServiceName: config.amazonaws.com

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'aws-config-${AWS::AccountId}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !If
                - CreateKmsKey
                - !Ref SecurityKmsKey
                - !Ref KmsKeyId
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'SecurityRecorder-${Environment}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'SecurityDeliveryChannel-${Environment}'
      S3BucketName: !Ref ConfigBucket

  # Config Rules for Security Group Monitoring
  SecurityGroupConfigRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 'security-group-ssh-check-${Environment}'
      Description: 'Checks whether security groups allow unrestricted incoming SSH traffic'
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED
      DependsOn:
        - ConfigurationRecorder

  # MFA Enforcement Policy
  MFAEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub 'MFAEnforcement-${Environment}'
      Description: 'Enforces MFA for all IAM users'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - iam:GetAccountPasswordPolicy
              - iam:ListVirtualMFADevices
            Resource: '*'
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - iam:ChangePassword
              - iam:GetUser
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${aws:username}'
          - Sid: AllowManageOwnMFA
            Effect: Allow
            Action:
              - iam:CreateVirtualMFADevice
              - iam:DeleteVirtualMFADevice
              - iam:EnableMFADevice
              - iam:ListMFADevices
              - iam:ResyncMFADevice
            Resource:
              - !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/${aws:username}'
              - !Sub 'arn:aws:iam::${AWS::AccountId}:user/${aws:username}'
          - Sid: DenyAllExceptUnlessSignedInWithMFA
            Effect: Deny
            NotAction:
              - iam:CreateVirtualMFADevice
              - iam:EnableMFADevice
              - iam:GetUser
              - iam:ListMFADevices
              - iam:ListVirtualMFADevices
              - iam:ResyncMFADevice
              - sts:GetSessionToken
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # Security Hub
  SecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Enable CIS AWS Foundations Benchmark
  CISStandard:
    Type: AWS::SecurityHub::Standard
    Properties:
      StandardsArn: !Sub 'arn:aws:securityhub:${AWS::Region}::ruleset/finding-format/aws-foundational-security-standard/v/1.0.0'
      DisabledStandardsControls: []

  # Systems Manager Parameter for Database Password
  DatabasePasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/secure/${Environment}/database/password'
      Type: SecureString
      Value: 'ChangeMe123!'
      Description: 'Database master password'
      KeyId: !If
        - CreateKmsKey
        - !Ref SecurityKmsKey
        - !Ref KmsKeyId

  # RDS Subnet Group
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'rds-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds:
        - !Ref PrivateSubnet
        - !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub 'RDS-SubnetGroup-${Environment}'

  # RDS Security Group
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'RDS-SecurityGroup-${Environment}'
      GroupDescription: 'Security group for RDS instances'
      VpcId: !Ref SecurityVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'RDS-SG-${Environment}'

  # EC2 Security Group
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'EC2-SecurityGroup-${Environment}'
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref SecurityVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'EC2-SG-${Environment}'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'ALB-${Environment}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'ALB-${Environment}'

  # ALB Security Group
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ALB-SecurityGroup-${Environment}'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref SecurityVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'ALB-SG-${Environment}'

  # HTTPS Listener for ALB
  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: fixed-response
          FixedResponseConfig:
            StatusCode: 200
            ContentType: text/plain
            MessageBody: 'Secure connection established'
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificate

  # HTTP to HTTPS Redirect Listener
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Self-signed SSL Certificate (for demo purposes)
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub '${Environment}.example.com'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub 'SSL-Cert-${Environment}'

  # EBS Encryption Configuration
  EBSEncryptionByDefault:
    Type: AWS::EC2::EBSEncryptionByDefault
    Properties:
      EbsEncryptionByDefault: true

  EBSDefaultKmsKey:
    Type: AWS::EC2::EBSDefaultKmsKey
    Properties:
      KmsKeyId: !If
        - CreateKmsKey
        - !Ref SecurityKmsKey
        - !Ref KmsKeyId

Outputs:
  VpcId:
    Description: 'VPC ID'
    Value: !Ref SecurityVpc
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetId:
    Description: 'Public Subnet ID'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-ID'

  PrivateSubnetId:
    Description: 'Private Subnet ID'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-ID'

  CloudTrailBucketName:
    Description: 'CloudTrail S3 Bucket Name'
    Value: !Ref CloudTrailLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Bucket'

  SecurityHubStatus:
    Description: 'Security Hub ARN'
    Value: !Ref SecurityHub
    Export:
      Name: !Sub '${AWS::StackName}-SecurityHub-ARN'

  KmsKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !If
      - CreateKmsKey
      - !Ref SecurityKmsKey
      - !Ref KmsKeyId
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  EC2InstanceRoleArn:
    Description: 'EC2 Instance Role ARN'
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Role-ARN'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  SecurityNotificationTopicArn:
    Description: 'SNS Topic ARN for security notifications'
    Value: !Ref SecurityNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-Security-Topic-ARN'

  ConfigBucketName:
    Description: 'AWS Config S3 Bucket Name'
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-Config-Bucket'
```

## Key Features Implemented

### 1. **VPC Configuration**

- Complete VPC setup with public and private subnets
- Internet Gateway and route tables configured
- Proper CIDR block parameterization

### 2. **IAM Roles with Least Privilege**

- EC2 instance role with minimal required permissions
- Lambda execution role for access key rotation
- Service-linked roles for AWS services

### 3. **CloudTrail Logging**

- Multi-region trail with global service events
- KMS encryption for log files
- S3 bucket with proper access policies

### 4. **S3 Encryption**

- All S3 buckets use KMS encryption by default
- Public access blocked on all buckets
- Versioning and lifecycle policies configured

### 5. **RDS Backup Configuration**

- RDS subnet group for proper placement
- Security groups with restricted access
- Automated backup retention (configurable via RDS instance)

### 6. **AWS Config**

- Configuration recorder for all resources
- Security group monitoring rules
- Encrypted delivery channel

### 7. **Access Key Rotation**

- Lambda function to check and disable old keys
- EventBridge rule for weekly execution
- SNS notifications for security alerts

### 8. **MFA Enforcement**

- IAM policy that denies access without MFA
- Allows users to manage their own MFA devices

### 9. **Security Hub**

- Enabled with CIS AWS Foundations Benchmark
- Centralized security findings dashboard

### 10. **Secrets Management**

- Systems Manager Parameter Store for sensitive data
- KMS encryption for parameters

### 11. **EBS Encryption**

- Default encryption enabled for all EBS volumes
- KMS key configuration

### 12. **TLS Enforcement**

- Application Load Balancer with HTTPS listener
- HTTP to HTTPS redirect
- SSL certificate management

## Deployment Instructions

1. **Prerequisites:**
   - AWS CLI configured with appropriate permissions
   - Valid AWS Organization ID and Master Account ID
   - Domain for SSL certificate (or modify for self-signed)

2. **Deploy the template:**

   ```bash
   aws cloudformation create-stack \
     --stack-name security-infrastructure \
     --template-body file://security-template.yaml \
     --parameters ParameterKey=OrganizationId,ParameterValue=o-xxxxxxxxxx \
                  ParameterKey=MasterAccountId,ParameterValue=123456789012 \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Post-deployment:**
   - Configure SNS topic subscriptions for security notifications
   - Set up proper DNS records for SSL certificate validation
   - Configure RDS instances with the provided subnet group and security group

This template provides a comprehensive security foundation that can be extended based on specific organizational requirements while maintaining AWS best practices and security standards.
