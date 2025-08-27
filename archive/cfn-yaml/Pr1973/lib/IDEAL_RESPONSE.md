```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade multi-account security CloudFormation template with advanced AWS security measures'

Parameters:
VpcCidr:
Type: String
Default: '10.0.0.0/16'
Description: 'CIDR block for the VPC'
AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
ExistingVpcId:
Type: String
Default: ''
Description: 'ID of an existing VPC to use (leave blank to create a new one). Note: If you set this to an existing VPC, CloudFormation will NOT delete it when the stack is deleted. You must manage its deletion manually.'

PublicSubnetCidr:
Type: String
Default: '10.0.1.0/24'
Description: 'CIDR block for the public subnet'

PublicSubnet2Cidr:
Type: String
Default: '10.0.4.0/24'
Description: 'CIDR block for the second public subnet'

PrivateSubnetCidr:
Type: String
Default: '10.0.2.0/24'
Description: 'CIDR block for the private subnet'

PrivateSubnet2Cidr:
Type: String
Default: '10.0.3.0/24'
Description: 'CIDR block for the second private subnet'

Environment:
Type: String
Default: 'production'
AllowedValues: ['development', 'staging', 'production']
Description: 'Environment name'

KmsKeyId:
Type: String
Description: 'KMS Key ID for encryption (optional - will create new if not provided)'
Default: ''

MasterAccountId:
Type: String
Description: 'The master account ID for centralized monitoring. Must be a 12-digit AWS account ID. Leave blank if not used.'
Default: ''
AllowedPattern: '^(|\d{12})$'
ConstraintDescription: 'Must be blank or a 12-digit AWS account ID'
CreateSecurityHub:
Type: String
Default: 'false'
AllowedValues: ['true', 'false']
Description: 'Set to true if the account is not already subscribed to Security Hub.'

OrganizationalId:
Type: String
Description: 'The organizational ID if AWS Organizations is enabled'
Default: ''

MemberAccountIds:
Type: CommaDelimitedList
Description: 'List of member account IDs for AWS Config aggregator'
Default: ''

CertificateArn:
Type: String
Description: 'ARN of the SSL certificate for the load balancer. Set to a valid ARN to enable HTTPS. If not set or set to "use-existing", HTTPS listener will not be created.'
Default: 'use-existing'

DBInstanceIdentifier:
Type: String
Default: 'security-db'
Description: 'RDS instance identifier'

DBEngine:
Type: String
Default: 'mysql'
AllowedValues: ['mysql', 'postgres', 'oracle-ee', 'sqlserver-ee']
Description: 'RDS engine type'

DBEngineVersion:
Type: String
Default: '8.0'
Description: 'RDS engine version'

DBInstanceClass:
Type: String
Default: 'db.t3.micro'
Description: 'RDS instance class'

DBAllocatedStorage:
Type: Number
Default: 20
Description: 'RDS allocated storage in GB'

DBBackupRetentionPeriod:
Type: Number
Default: 7
Description: 'RDS backup retention period in days'
MinValue: 7
MaxValue: 35

ExistingEC2InstanceRoleArn:
Type: String
Default: ''
Description: 'ARN of an existing IAM Role for EC2 instances (leave blank to create a new one)'
ExistingAccessKeyRotationRoleArn:
Type: String
Default: ''
Description: 'ARN of an existing IAM Role for Access Key Rotation Lambda (leave blank to create a new one)'
ExistingConfigDeliveryChannelName:
Type: String
Default: 'use-existing'
Description: 'Name of an existing AWS Config Delivery Channel. To create a new one, set this to blank (""), otherwise the template will NOT create a delivery channel.'
ExistingConfigRecorderName:
Type: String
Default: 'use-existing'
Description: 'Name of an existing AWS Config Configuration Recorder. To create a new one, set this to blank (""), otherwise the template will NOT create a configuration recorder.'
ExistingRDSSubnetGroupName:
Type: String
Default: ''
Description: |
Name of an existing RDS DBSubnetGroup. Leave blank to create a new one.
If you see an error that the subnet group already exists, set this to the actual existing DBSubnetGroup name (e.g., 'rds-subnet-group-production').
Note: If you set this to an existing group, CloudFormation will NOT delete it when the stack is deleted. You must manage its deletion manually.
ExistingCloudTrailLogsBucketName:
Type: String
Default: ''
Description: 'Name of an existing S3 bucket for CloudTrail logs. To create a new one, leave blank. If using an existing bucket, set this to the actual bucket name.'
ExistingInternetGatewayId:
Type: String
Default: ''
Description: 'ID of an existing Internet Gateway to attach to the VPC. Leave blank to create a new one. Note: If you set this to an existing IGW, CloudFormation will NOT delete it when the stack is deleted. You must manage its deletion manually.'

Conditions:
CreateKmsKey: !Equals [!Ref KmsKeyId, '']
IsMasterAccount:
!And [
!Not [!Equals [!Ref MasterAccountId, '']],
!Equals [!Ref AWS::AccountId, !Ref MasterAccountId],
]
HasOrganizationalId: !Not [!Equals [!Ref OrganizationalId, '']]
HasMemberAccounts: !Not [!Equals [!Join ['', !Ref MemberAccountIds], '']]
UseOrganizationalConfig:
!And [!Condition IsMasterAccount, !Condition HasOrganizationalId]
UseAccountBasedConfig:
!And [
!Condition IsMasterAccount,
!Condition HasMemberAccounts,
!Not [!Condition HasOrganizationalId],
]
CreateVpc: !Equals [!Ref ExistingVpcId, '']
CreateSecurityHubCondition: !Equals [!Ref CreateSecurityHub, 'true']
HasValidMasterAccountId: !Not [!Equals [!Ref MasterAccountId, '']]
CreateEC2InstanceRole: !Equals [!Ref ExistingEC2InstanceRoleArn, '']
CreateAccessKeyRotationRole:
!Equals [!Ref ExistingAccessKeyRotationRoleArn, '']
CreateConfigDeliveryChannel:
!Equals [!Ref ExistingConfigDeliveryChannelName, '']
CreateConfigRecorder:
!Equals [!Ref ExistingConfigRecorderName, 'use-existing']
CreateConfigDeliveryChannelAndRecorder:
!And [
!Condition CreateConfigDeliveryChannel,
!Condition CreateConfigRecorder,
]
CreateConfigRules: !Condition CreateConfigDeliveryChannelAndRecorder
HasValidCertificateArn:
!And [
!Not [!Equals [!Ref CertificateArn, '']],
!Not [!Equals [!Ref CertificateArn, 'use-existing']],
]
CreateRDSSubnetGroup: !Equals [!Ref ExistingRDSSubnetGroupName, '']
CreateCloudTrailLogsBucket:
!Equals [!Ref ExistingCloudTrailLogsBucketName, '']
CreateInternetGateway: !Equals [!Ref ExistingInternetGatewayId, '']

Resources:

# KMS Key for Encryption with cross-account access

SecurityKmsKey:
Type: AWS::KMS::Key
Condition: CreateKmsKey
Properties:
Description: !Sub 'KMS Key for security services encryption in ${Environment}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
Action: 'kms:_'
Resource: '_' - Sid: AllowCloudTrailToEncryptLogs
Effect: Allow
Principal:
Service: cloudtrail.amazonaws.com
Action: - kms:GenerateDataKey* - kms:DescribeKey
Resource: '*' - Sid: AllowConfigToUseTheKey
Effect: Allow
Principal:
Service: config.amazonaws.com
Action: - kms:GenerateDataKey* - kms:DescribeKey
Resource: '*' - !If - HasValidMasterAccountId - Sid: AllowMasterAccountAccess
Effect: Allow
Principal:
AWS: !Sub 'arn:aws:iam::${MasterAccountId}:root'
Action: - kms:DescribeKey - kms:GenerateDataKey* - kms:Decrypt
Resource: '*'
Condition:
StringEquals:
kms:CallerAccount: !Ref MasterAccountId - !Ref 'AWS::NoValue'

SecurityKmsKeyAlias:
Type: AWS::KMS::Alias
Condition: CreateKmsKey
Properties:
AliasName: !Sub 'alias/security-${Environment}'
TargetKeyId: !Ref SecurityKmsKey

# VPC Configuration

SecurityVpc:
Type: AWS::EC2::VPC
Condition: CreateVpc
Properties:
CidrBlock: !Ref VpcCidr
EnableDnsHostnames: true
EnableDnsSupport: true
Tags: - Key: Name
Value: !Sub 'Security-VPC-${Environment}' - Key: Environment
Value: !Ref Environment
DeletionPolicy: Retain
UpdateReplacePolicy: Retain

PublicSubnet:
Type: AWS::EC2::Subnet
Properties:
VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
CidrBlock: !Ref PublicSubnetCidr
AvailabilityZone: !Select [0, !GetAZs '']
MapPublicIpOnLaunch: true
Tags: - Key: Name
Value: !Sub 'Public-Subnet-${Environment}' - Key: Type
Value: 'Public'

PublicSubnet2:
Type: AWS::EC2::Subnet
Properties:
VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
CidrBlock: !Ref PublicSubnet2Cidr
AvailabilityZone: !Select [1, !GetAZs '']
MapPublicIpOnLaunch: true
Tags: - Key: Name
Value: !Sub 'Public-Subnet-2-${Environment}' - Key: Type
Value: 'Public'

PrivateSubnet:
Type: AWS::EC2::Subnet
Properties:
VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
CidrBlock: !Ref PrivateSubnetCidr
AvailabilityZone: !Select [0, !GetAZs '']
Tags: - Key: Name
Value: !Sub 'Private-Subnet-${Environment}' - Key: Type
Value: 'Private'

PrivateSubnet2:
Type: AWS::EC2::Subnet
Properties:
VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
CidrBlock: !Ref PrivateSubnet2Cidr
AvailabilityZone: !Select [1, !GetAZs '']
Tags: - Key: Name
Value: !Sub 'Private-Subnet-2-${Environment}' - Key: Type
Value: 'Private'

InternetGateway:
Type: AWS::EC2::InternetGateway
Condition: CreateInternetGateway
Properties:
Tags: - Key: Name
Value: !Sub 'IGW-${Environment}'
DeletionPolicy: Retain
UpdateReplacePolicy: Retain

AttachGateway:
Type: AWS::EC2::VPCGatewayAttachment
Condition: CreateInternetGateway
Properties:
VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
InternetGatewayId: !Ref InternetGateway

PublicRouteTable:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
Tags: - Key: Name
Value: !Sub 'Public-RT-${Environment}'

PublicRoute:
Type: AWS::EC2::Route
Condition: CreateInternetGateway
DependsOn: AttachGateway
Properties:
RouteTableId: !Ref PublicRouteTable
DestinationCidrBlock: '0.0.0.0/0'
GatewayId: !Ref InternetGateway

PublicSubnetRouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Condition: CreateVpc
Properties:
SubnetId: !Ref PublicSubnet
RouteTableId: !Ref PublicRouteTable

PublicSubnet2RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Condition: CreateVpc
Properties:
SubnetId: !Ref PublicSubnet2
RouteTableId: !Ref PublicRouteTable

# S3 Bucket for CloudTrail Logs with cross-account policies

CloudTrailLogsBucket:
Type: AWS::S3::Bucket
Condition: CreateCloudTrailLogsBucket
Properties:
BucketName: !Sub 'cloudtrail-logs-${AWS::AccountId}-${Environment}'
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: aws:kms
KMSMasterKeyID: !If - CreateKmsKey - !Ref SecurityKmsKey - !Ref KmsKeyId
PublicAccessBlockConfiguration:
BlockPublicAcls: true
BlockPublicPolicy: true
IgnorePublicAcls: true
RestrictPublicBuckets: true
VersioningConfiguration:
Status: Enabled
LifecycleConfiguration:
Rules: - Id: DeleteOldLogs
Status: Enabled
ExpirationInDays: 2555
NoncurrentVersionExpirationInDays: 30
DeletionPolicy: Retain
UpdateReplacePolicy: Retain

CloudTrailLogsBucketPolicy:
Type: AWS::S3::BucketPolicy
Properties:
Bucket:
!If [
CreateCloudTrailLogsBucket,
!Ref CloudTrailLogsBucket,
!Ref ExistingCloudTrailLogsBucketName,
]
PolicyDocument:
Version: '2012-10-17'
Statement: - Sid: AWSCloudTrailAclCheck
Effect: Allow
Principal:
Service: cloudtrail.amazonaws.com
Action: s3:GetBucketAcl
Resource:
!If [
CreateCloudTrailLogsBucket,
!GetAtt CloudTrailLogsBucket.Arn,
!Sub 'arn:aws:s3:::${ExistingCloudTrailLogsBucketName}',
] - Sid: AWSCloudTrailWrite
Effect: Allow
Principal:
Service: cloudtrail.amazonaws.com
Action: s3:PutObject
Resource:
!If [
CreateCloudTrailLogsBucket,
!Sub '${CloudTrailLogsBucket.Arn}/*',
!Sub 'arn:aws:s3:::${ExistingCloudTrailLogsBucketName}/*',
]
Condition:
StringEquals:
's3:x-amz-acl': bucket-owner-full-control - !If [
HasValidMasterAccountId,
{
Sid: AllowMasterAccountRead,
Effect: Allow,
Principal: { AWS: !Sub 'arn:aws:iam::${MasterAccountId}:root' },
                Action: [s3:GetObject, s3:ListBucket],
                Resource:
                  [
                    !If [
                      CreateCloudTrailLogsBucket,
                      !GetAtt CloudTrailLogsBucket.Arn,
                      !Sub 'arn:aws:s3:::${ExistingCloudTrailLogsBucketName}',
],
!If [
CreateCloudTrailLogsBucket,
!Sub '${CloudTrailLogsBucket.Arn}/*',
!Sub 'arn:aws:s3:::${ExistingCloudTrailLogsBucketName}/*',
],
],
Condition:
{
StringEquals:
{ aws:PrincipalAccount: !Ref MasterAccountId },
},
},
!Ref 'AWS::NoValue',
]

# CloudTrail Configuration with organization trail support

SecurityCloudTrail:
Type: AWS::CloudTrail::Trail
DependsOn: CloudTrailLogsBucketPolicy
Properties:
TrailName: !Sub 'SecurityTrail-${Environment}'
S3BucketName:
!If [
CreateCloudTrailLogsBucket,
!Ref CloudTrailLogsBucket,
!Ref ExistingCloudTrailLogsBucketName,
]
IncludeGlobalServiceEvents: true
IsMultiRegionTrail: true
EnableLogFileValidation: true
IsLogging: true
KMSKeyId: !If - CreateKmsKey - !Ref SecurityKmsKey - !Ref KmsKeyId
EventSelectors: - ReadWriteType: All
IncludeManagementEvents: true
IsOrganizationTrail: !If [HasOrganizationalId, true, !Ref 'AWS::NoValue']

# IAM Roles with Least Privilege

EC2InstanceRole:
Type: AWS::IAM::Role
Condition: CreateEC2InstanceRole
Properties:
RoleName: !Sub 'EC2-SecurityRole-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: 'EC2LeastPrivilegePolicy'
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
                Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:_' - Effect: Allow
Action: - logs:CreateLogGroup - logs:CreateLogStream - logs:PutLogEvents - logs:DescribeLogStreams
Resource: '_'

EC2InstanceProfile:
Type: AWS::IAM::InstanceProfile
Properties:
Roles: - !If [
CreateEC2InstanceRole,
!Ref EC2InstanceRole,
!Ref ExistingEC2InstanceRoleArn,
]

# Lambda Role for Access Key Rotation

AccessKeyRotationRole:
Type: AWS::IAM::Role
Condition: CreateAccessKeyRotationRole
Properties:
RoleName: !Sub 'AccessKeyRotation-${Environment}'
AssumeRolePolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Principal:
Service: lambda.amazonaws.com
Action: sts:AssumeRole
Policies: - PolicyName: 'AccessKeyRotationPolicy'
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - iam:ListUsers - iam:ListAccessKeys - iam:GetAccessKeyLastUsed - iam:UpdateAccessKey - iam:DeleteAccessKey
Resource: '_' - Effect: Allow
Action: - sns:Publish
Resource: !Ref SecurityNotificationTopic - PolicyName: 'LambdaBasicExecution'
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - logs:CreateLogGroup - logs:CreateLogStream - logs:PutLogEvents
Resource: '_'

# SNS Topic for Security Notifications

SecurityNotificationTopic:
Type: AWS::SNS::Topic
Properties:
TopicName: !Sub 'SecurityNotifications-${Environment}'
KmsMasterKeyId: !If - CreateKmsKey - !Ref SecurityKmsKey - !Ref KmsKeyId

# Lambda Function for Access Key Rotation with improved logic

AccessKeyRotationFunction:
Type: AWS::Lambda::Function
Properties:
FunctionName: !Sub 'AccessKeyRotation-${Environment}'
Runtime: python3.9
Handler: index.lambda_handler
Role:
!If [
CreateAccessKeyRotationRole,
!GetAtt AccessKeyRotationRole.Arn,
!Ref ExistingAccessKeyRotationRoleArn,
]
Timeout: 300
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

                              # Check if user has no active keys
                              active_keys = [k for k in keys['AccessKeyMetadata'] if k['Status'] == 'Active' and k['AccessKeyId'] != key_id]
                              if not active_keys:
                                  # Create a new access key
                                  new_key = iam.create_access_key(UserName=username)
                                  message = f"Access key {key_id} for user {username} has been disabled due to age (>90 days). A new access key has been created. Please retrieve it from the IAM console."
                              else:
                                  message = f"Access key {key_id} for user {username} has been disabled due to age (>90 days). Please ensure you have active keys."

                              # Send notification
                              sns.publish(
                                  TopicArn=os.environ['SNS_TOPIC_ARN'],
                                  Message=message,
                                  Subject='Access Key Rotation Alert'
                              )

              return {
                  'statusCode': 200,
                  'body': json.dumps('Access key rotation check completed')
              }

AccessKeyRotationSchedule:
Type: AWS::Events::Rule
Properties:
Name: !Sub 'AccessKeyRotationSchedule-${Environment}'
Description: 'Trigger access key rotation check daily'
ScheduleExpression: 'rate(1 day)'
State: ENABLED
Targets: - Arn: !GetAtt AccessKeyRotationFunction.Arn
Id: 'AccessKeyRotationTarget'

AccessKeyRotationPermission:
Type: AWS::Lambda::Permission
Properties:
FunctionName: !Ref AccessKeyRotationFunction
Action: lambda:InvokeFunction
Principal: events.amazonaws.com
SourceArn: !GetAtt AccessKeyRotationSchedule.Arn

# AWS Config Configuration

ConfigBucket:
Type: AWS::S3::Bucket
Properties:
BucketName: !Sub 'aws-config-${AWS::AccountId}-${Environment}'
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: aws:kms
KMSMasterKeyID: !If - CreateKmsKey - !Ref SecurityKmsKey - !Ref KmsKeyId
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
Statement: - Sid: AWSConfigBucketPermissionsCheck
Effect: Allow
Principal:
Service: config.amazonaws.com
Action: s3:GetBucketAcl
Resource: !GetAtt ConfigBucket.Arn - Sid: AWSConfigBucketExistenceCheck
Effect: Allow
Principal:
Service: config.amazonaws.com
Action: s3:ListBucket
Resource: !GetAtt ConfigBucket.Arn - Sid: AWSConfigBucketDelivery
Effect: Allow
Principal:
Service: config.amazonaws.com
Action: s3:PutObject
Resource: !Sub '${ConfigBucket.Arn}/\*'
Condition:
StringEquals:
's3:x-amz-acl': bucket-owner-full-control

ConfigRole:
Type: AWS::IAM::Role
Properties:
AssumeRolePolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Principal:
Service: config.amazonaws.com
Action: sts:AssumeRole
Policies: - PolicyName: ConfigS3Policy
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - s3:GetBucketAcl - s3:ListBucket
Resource: !GetAtt ConfigBucket.Arn - Effect: Allow
Action: - s3:PutObject - s3:GetBucketAcl
Resource: !Sub '${ConfigBucket.Arn}/\*'

ConfigDeliveryChannel:
Type: AWS::Config::DeliveryChannel
Condition: CreateConfigDeliveryChannelAndRecorder
Properties:
Name: !Sub 'SecurityDeliveryChannel-${Environment}'
S3BucketName: !Ref ConfigBucket

ConfigurationRecorder:
Type: AWS::Config::ConfigurationRecorder
Condition: CreateConfigRecorder
Properties:
Name: !Sub 'SecurityRecorder-${Environment}'
RoleARN: !GetAtt ConfigRole.Arn
RecordingGroup:
AllSupported: true
IncludeGlobalResourceTypes: true

# Config Rules for Security Group Monitoring and EBS Encryption

SecurityGroupConfigRule:
Type: AWS::Config::ConfigRule
Condition: CreateConfigRules
Properties:
ConfigRuleName: !Sub 'security-group-ssh-check-${Environment}'
Description: 'Checks whether security groups allow unrestricted incoming SSH traffic'
Source:
Owner: AWS
SourceIdentifier: 'INCOMING_SSH_DISABLED'
Scope:
ComplianceResourceTypes: - 'AWS::EC2::SecurityGroup'

EBSEncryptionConfigRule:
Type: AWS::Config::ConfigRule
Condition: CreateConfigRules
Properties:
ConfigRuleName: !Sub 'ebs-encryption-by-default-${Environment}'
Description: 'Checks whether EBS encryption is enabled by default for the account'
Source:
Owner: AWS
SourceIdentifier: 'EC2_EBS_ENCRYPTION_BY_DEFAULT'
Scope:
ComplianceResourceTypes: - 'AWS::EC2::Volume'

# Config Aggregator for Multi-Account Monitoring

ConfigAggregatorRole:
Type: AWS::IAM::Role
Condition: UseOrganizationalConfig
Properties:
AssumeRolePolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Principal:
Service: config.amazonaws.com
Action: sts:AssumeRole
Path: /
Policies: - PolicyName: ConfigAggregatorPolicy
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - config:PutConfigurationAggregator - config:DescribeConfigurationAggregators - config:DeleteConfigurationAggregator
Resource: '_' - Effect: Allow
Action: - organizations:DescribeOrganization
Resource: '_'

ConfigAggregator:
Type: AWS::Config::ConfigurationAggregator
Condition: IsMasterAccount
Properties:
ConfigurationAggregatorName: !Sub 'SecurityAggregator-${Environment}'
OrganizationAggregationSource: !If - HasOrganizationalId - RoleArn: !GetAtt ConfigAggregatorRole.Arn
AllAwsRegions: true - !Ref 'AWS::NoValue'
AccountAggregationSources: !If - UseAccountBasedConfig - - AccountIds: !Ref MemberAccountIds
AllAwsRegions: true - !Ref 'AWS::NoValue'

# MFA Enforcement Policy with precise actions

MFAEnforcementPolicy:
Type: AWS::IAM::ManagedPolicy
Properties:
ManagedPolicyName: !Sub 'MFAEnforcement-${Environment}'
Description: 'Enforces MFA for all IAM users'
PolicyDocument:
Version: '2012-10-17'
Statement: - Sid: AllowViewAccountInfo
Effect: Allow
Action: - iam:GetAccountPasswordPolicy - iam:ListVirtualMFADevices - iam:GetUser - iam:ListMFADevices
Resource: '_' - Sid: AllowManageOwnCredentials
Effect: Allow
Action: - iam:ChangePassword - iam:CreateVirtualMFADevice - iam:DeleteVirtualMFADevice - iam:EnableMFADevice - iam:ResyncMFADevice
Resource: '_' - Sid: DenyAccessWithoutMFA
Effect: Deny
Action: - ec2:_ - s3:_ - rds:_ - lambda:_ - cloudformation:_ # Add other actions that require MFA
Resource: '_'
Condition:
BoolIfExists:
'aws:MultiFactorAuthPresent': 'false'

# Security Hub with standards enabled

SecurityHub:
Type: AWS::SecurityHub::Hub
Condition: CreateSecurityHubCondition
Properties:
EnableDefaultStandards: true

# Systems Manager Parameter for Database Password

DatabasePasswordParameter:
Type: AWS::SSM::Parameter
Properties:
Name: !Sub '/secure/${Environment}/database/password'
Type: String
Value: 'ChangeMe123!'
Description: 'Database master password'

# Database Secret in Secrets Manager

DatabaseSecret:
Type: AWS::SecretsManager::Secret
Properties:
Name: !Sub 'database-credentials-${Environment}'
Description: 'Database master credentials'
GenerateSecretString:
SecretStringTemplate: '{"username": "admin"}'
GenerateStringKey: 'password'
PasswordLength: 32
ExcludeCharacters: '"@/\\'
KmsKeyId: !If [CreateKmsKey, !Ref SecurityKmsKey, !Ref KmsKeyId]

# RDS Subnet Group

RDSSubnetGroup:
Type: AWS::RDS::DBSubnetGroup
Condition: CreateRDSSubnetGroup
Properties:
DBSubnetGroupName: !Sub 'rds-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds:
        - !Ref PrivateSubnet
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'RDS-SubnetGroup-${Environment}'
DeletionPolicy: Retain
UpdateReplacePolicy: Retain

# RDS Security Group

RDSSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub 'RDS-SecurityGroup-${Environment}'
      GroupDescription: 'Security group for RDS instances'
      VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'RDS-SG-${Environment}'
DeletionPolicy: Retain
UpdateReplacePolicy: Retain

# RDS Instance with backup retention

RDSInstance:
Type: AWS::RDS::DBInstance
Properties:
DBInstanceIdentifier: !Ref DBInstanceIdentifier
Engine: !Ref DBEngine
EngineVersion: !Ref DBEngineVersion
DBInstanceClass: !Ref DBInstanceClass
AllocatedStorage: !Ref DBAllocatedStorage
BackupRetentionPeriod: !Ref DBBackupRetentionPeriod
MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}::username}}'
MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}::password}}'
DBSubnetGroupName:
!If [
CreateRDSSubnetGroup,
!Ref RDSSubnetGroup,
!Ref ExistingRDSSubnetGroupName,
]
VPCSecurityGroups: - !Ref RDSSecurityGroup
StorageEncrypted: true
KmsKeyId: !If - CreateKmsKey - !Ref SecurityKmsKey - !Ref KmsKeyId
Tags: - Key: Name
Value: !Sub 'RDS-Instance-${Environment}'
DeletionPolicy: Retain
UpdateReplacePolicy: Retain

# EC2 Security Group

EC2SecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub 'EC2-SecurityGroup-${Environment}'
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
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

# Application Load Balancer with TLS enforcement

ApplicationLoadBalancer:
Type: AWS::ElasticLoadBalancingV2::LoadBalancer
Properties:
Name: !Sub 'ALB-${Environment}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'ALB-${Environment}'

ALBSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub 'ALB-SecurityGroup-${Environment}'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
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

HTTPSListener:
Type: AWS::ElasticLoadBalancingV2::Listener
Condition: HasValidCertificateArn
Properties:
DefaultActions: - Type: fixed-response
FixedResponseConfig:
StatusCode: 200
ContentType: text/plain
MessageBody: 'Secure connection established'
LoadBalancerArn: !Ref ApplicationLoadBalancer
Port: 443
Protocol: HTTPS
Certificates: - CertificateArn: !Ref CertificateArn

HTTPListener:
Type: AWS::ElasticLoadBalancingV2::Listener
Properties:
DefaultActions: - Type: redirect
RedirectConfig:
Protocol: HTTPS
Port: 443
StatusCode: HTTP_301
LoadBalancerArn: !Ref ApplicationLoadBalancer
Port: 80
Protocol: HTTP

Outputs:
VpcId:
Description: 'VPC ID'
Value: !If [CreateVpc, !Ref SecurityVpc, !Ref ExistingVpcId]
Export:
Name: !Sub '${AWS::StackName}-VPC-ID'

PublicSubnetId:
Description: 'Public Subnet ID'
Value: !Ref PublicSubnet
Export:
Name: !Sub '${AWS::StackName}-Public-Subnet-ID'

PublicSubnet2Id:
Description: 'Second Public Subnet ID'
Value: !Ref PublicSubnet2
Export:
Name: !Sub '${AWS::StackName}-Public-Subnet-2-ID'

PrivateSubnetId:
Description: 'Private Subnet ID'
Value: !Ref PrivateSubnet
Export:
Name: !Sub '${AWS::StackName}-Private-Subnet-ID'

PrivateSubnet2Id:
Description: 'Second Private Subnet ID'
Value: !Ref PrivateSubnet2
Export:
Name: !Sub '${AWS::StackName}-Private-Subnet-2-ID'

CloudTrailBucketName:
Description: 'CloudTrail S3 Bucket Name'
Value:
!If [
CreateCloudTrailLogsBucket,
!Ref CloudTrailLogsBucket,
!Ref ExistingCloudTrailLogsBucketName,
]
Export:
Name: !Sub '${AWS::StackName}-CloudTrail-Bucket'

SecurityHubArn:
Description: 'Security Hub ARN'
Value:
!If [CreateSecurityHubCondition, !Ref SecurityHub, 'Already subscribed']
Export:
Name: !Sub '${AWS::StackName}-SecurityHub-ARN'

KmsKeyId:
Description: 'KMS Key ID for encryption'
Value: !If - CreateKmsKey - !Ref SecurityKmsKey - !Ref KmsKeyId
Export:
Name: !Sub '${AWS::StackName}-KMS-Key-ID'

EC2InstanceRoleArn:
Description: 'EC2 Instance Role ARN'
Value:
!If [
CreateEC2InstanceRole,
!GetAtt EC2InstanceRole.Arn,
!Ref ExistingEC2InstanceRoleArn,
]
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

DatabaseSecretArn:
Description: 'Database credentials secret ARN'
Value: !Ref DatabaseSecret
Export:
Name: !Sub '${AWS::StackName}-Database-Secret-ARN'

RDSInstanceEndpoint:
Description: 'RDS instance endpoint'
Value: !GetAtt RDSInstance.Endpoint.Address
Export:
Name: !Sub '${AWS::StackName}-RDS-Endpoint'

ConfigAggregatorName:
Description: 'AWS Config Aggregator Name'
Value: !If - IsMasterAccount - !Ref ConfigAggregator - 'Not applicable'
Export:
Name: !Sub '${AWS::StackName}-Config-Aggregator'

MFAPolicyArn:
Description: 'MFA Enforcement Policy ARN'
Value: !Ref MFAEnforcementPolicy
Export:
Name: !Sub '${AWS::StackName}-MFA-Policy-ARN'

ConfigDeliveryChannelName:
Description: 'AWS Config Delivery Channel Name'
Value:
!If [
CreateConfigDeliveryChannelAndRecorder,
!Ref ConfigDeliveryChannel,
!Ref ExistingConfigDeliveryChannelName,
]
Export:
Name: !Sub '${AWS::StackName}-Config-Delivery-Channel-Name'

ConfigRecorderName:
Description: 'AWS Config Configuration Recorder Name'
Value:
!If [
CreateConfigRecorder,
!Ref ConfigurationRecorder,
!Ref ExistingConfigRecorderName,
]
Export:
Name: !Sub '${AWS::StackName}-Config-Recorder-Name'
```
