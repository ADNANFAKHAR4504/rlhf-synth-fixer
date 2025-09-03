AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready secure AWS infrastructure following security best practices'

Parameters:

# AMI Parameters for reusability

PublicEC2AMI:
Type: AWS::EC2::Image::Id
Description: AMI ID for public EC2 instances
Default: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI (update as needed)

PrivateEC2AMI:
Type: AWS::EC2::Image::Id
Description: AMI ID for private EC2 instances
Default: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI (update as needed)

# SSH Access Control

AllowedSSHCIDR:
Type: String
Description: CIDR block allowed for SSH access (e.g., your office IP/32)
Default: 10.0.0.0/32
AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
ConstraintDescription: Must be a valid CIDR notation (e.g., 192.168.1.1/32)

# Database Configuration

DBUsername:
Type: String
Description: Database master username
Default: dbadmin
MinLength: 1
MaxLength: 16
AllowedPattern: '[a-zA-Z][a-zA-Z0-9]\*'
ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

DBPassword:
Type: String
Description: Database master password
NoEcho: true
MinLength: 8
MaxLength: 41
AllowedPattern: '[a-zA-Z0-9]\*'
ConstraintDescription: Must contain only alphanumeric characters

# Environment Tag

Environment:
Type: String
Description: Environment name
Default: production
AllowedValues: - development - staging - production

Resources:

# ==================== KMS Keys ====================

InfrastructureKMSKey:
Type: AWS::KMS::Key
Properties:
Description: KMS key for infrastructure encryption
KeyPolicy:
Statement: - Sid: Enable IAM User Permissions
Effect: Allow
Principal:
AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
Action: - kms:Encrypt - kms:Decrypt - kms:ReEncrypt* - kms:GenerateDataKey* - kms:CreateGrant - kms:DescribeKey
Resource: '\*'
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-infrastructure-key' - Key: Environment
Value: !Ref Environment

InfrastructureKMSKeyAlias:
Type: AWS::KMS::Alias
Properties:
AliasName: !Sub 'alias/${AWS::StackName}-infrastructure'
TargetKeyId: !Ref InfrastructureKMSKey

# ==================== VPC and Networking ====================

VPC:
Type: AWS::EC2::VPC
Properties:
CidrBlock: 10.0.0.0/16
EnableDnsHostnames: true
EnableDnsSupport: true
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-vpc' - Key: Environment
Value: !Ref Environment

# Internet Gateway

InternetGateway:
Type: AWS::EC2::InternetGateway
Properties:
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-igw' - Key: Environment
Value: !Ref Environment

InternetGatewayAttachment:
Type: AWS::EC2::VPCGatewayAttachment
Properties:
InternetGatewayId: !Ref InternetGateway
VpcId: !Ref VPC

# Public Subnets

PublicSubnet1:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
AvailabilityZone: !Select [0, !GetAZs '']
CidrBlock: 10.0.1.0/24
MapPublicIpOnLaunch: true
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-public-subnet-1' - Key: Environment
Value: !Ref Environment

PublicSubnet2:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
AvailabilityZone: !Select [1, !GetAZs '']
CidrBlock: 10.0.2.0/24
MapPublicIpOnLaunch: true
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-public-subnet-2' - Key: Environment
Value: !Ref Environment

# Private Subnets

PrivateSubnet1:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
AvailabilityZone: !Select [0, !GetAZs '']
CidrBlock: 10.0.3.0/24
MapPublicIpOnLaunch: false
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-private-subnet-1' - Key: Environment
Value: !Ref Environment

PrivateSubnet2:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
AvailabilityZone: !Select [1, !GetAZs '']
CidrBlock: 10.0.4.0/24
MapPublicIpOnLaunch: false
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-private-subnet-2' - Key: Environment
Value: !Ref Environment

# NAT Gateways for private subnet internet access

NatGateway1EIP:
Type: AWS::EC2::EIP
DependsOn: InternetGatewayAttachment
Properties:
Domain: vpc
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-nat-eip-1'

NatGateway2EIP:
Type: AWS::EC2::EIP
DependsOn: InternetGatewayAttachment
Properties:
Domain: vpc
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-nat-eip-2'

NatGateway1:
Type: AWS::EC2::NatGateway
Properties:
AllocationId: !GetAtt NatGateway1EIP.AllocationId
SubnetId: !Ref PublicSubnet1
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-nat-1'

NatGateway2:
Type: AWS::EC2::NatGateway
Properties:
AllocationId: !GetAtt NatGateway2EIP.AllocationId
SubnetId: !Ref PublicSubnet2
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-nat-2'

# Route Tables

PublicRouteTable:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref VPC
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-public-routes' - Key: Environment
Value: !Ref Environment

DefaultPublicRoute:
Type: AWS::EC2::Route
DependsOn: InternetGatewayAttachment
Properties:
RouteTableId: !Ref PublicRouteTable
DestinationCidrBlock: 0.0.0.0/0
GatewayId: !Ref InternetGateway

PublicSubnet1RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Properties:
RouteTableId: !Ref PublicRouteTable
SubnetId: !Ref PublicSubnet1

PublicSubnet2RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Properties:
RouteTableId: !Ref PublicRouteTable
SubnetId: !Ref PublicSubnet2

PrivateRouteTable1:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref VPC
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-private-routes-1' - Key: Environment
Value: !Ref Environment

DefaultPrivateRoute1:
Type: AWS::EC2::Route
Properties:
RouteTableId: !Ref PrivateRouteTable1
DestinationCidrBlock: 0.0.0.0/0
NatGatewayId: !Ref NatGateway1

PrivateSubnet1RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Properties:
RouteTableId: !Ref PrivateRouteTable1
SubnetId: !Ref PrivateSubnet1

PrivateRouteTable2:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref VPC
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-private-routes-2' - Key: Environment
Value: !Ref Environment

DefaultPrivateRoute2:
Type: AWS::EC2::Route
Properties:
RouteTableId: !Ref PrivateRouteTable2
DestinationCidrBlock: 0.0.0.0/0
NatGatewayId: !Ref NatGateway2

PrivateSubnet2RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Properties:
RouteTableId: !Ref PrivateRouteTable2
SubnetId: !Ref PrivateSubnet2

# ==================== Security Groups ====================

PublicSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub '${AWS::StackName}-public-sg'
      GroupDescription: Security group for public EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: SSH access from allowed IP
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-sg' - Key: Environment
Value: !Ref Environment

PrivateSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub '${AWS::StackName}-private-sg'
      GroupDescription: Security group for private EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref PublicSecurityGroup
          Description: SSH access from public instances
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref PublicSecurityGroup
          Description: HTTP access from public instances
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-sg' - Key: Environment
Value: !Ref Environment

DatabaseSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub '${AWS::StackName}-database-sg'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref PrivateSecurityGroup
          Description: MySQL access from private instances
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref PublicSecurityGroup
          Description: MySQL access from public instances
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-database-sg' - Key: Environment
Value: !Ref Environment

# ==================== IAM Roles and Policies ====================

EC2Role:
Type: AWS::IAM::Role
Properties:
RoleName: !Sub '${AWS::StackName}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ec2-role' - Key: Environment
Value: !Ref Environment

EC2InstanceProfile:
Type: AWS::IAM::InstanceProfile
Properties:
InstanceProfileName: !Sub '${AWS::StackName}-ec2-profile'
Roles: - !Ref EC2Role

LambdaExecutionRole:
Type: AWS::IAM::Role
Properties:
RoleName: !Sub '${AWS::StackName}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-lambda-role' - Key: Environment
Value: !Ref Environment

# IAM User with MFA enforced

SecureUser:
Type: AWS::IAM::User
Properties:
UserName: !Sub '${AWS::StackName}-secure-user'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/ReadOnlyAccess
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-user' - Key: Environment
Value: !Ref Environment

MFAEnforcementPolicy:
Type: AWS::IAM::Policy
Properties:
PolicyName: !Sub '${AWS::StackName}-mfa-enforcement'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - iam:GetAccountPasswordPolicy
              - iam:GetAccountSummary
              - iam:ListVirtualMFADevices
            Resource: '*'
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - iam:ChangePassword
              - iam:GetUser
            Resource: !Sub 'arn:aws:iam::*:user/${SecureUser}' - Sid: AllowManageOwnMFA
Effect: Allow
Action: - iam:CreateVirtualMFADevice - iam:DeleteVirtualMFADevice - iam:ListMFADevices - iam:EnableMFADevice - iam:ResyncMFADevice
Resource: - !Sub 'arn:aws:iam::_:mfa/${SecureUser}' - !Sub 'arn:aws:iam::_:user/${SecureUser}' - Sid: DenyAllExceptUnlessSignedInWithMFA
Effect: Deny
NotAction: - iam:CreateVirtualMFADevice - iam:EnableMFADevice - iam:GetUser - iam:ListMFADevices - iam:ListVirtualMFADevices - iam:ResyncMFADevice - sts:GetSessionToken
Resource: '\*'
Condition:
BoolIfExists:
'aws:MultiFactorAuthPresent': 'false'
Users: - !Ref SecureUser

# ==================== EC2 Instances ====================

PublicEC2Instance:
Type: AWS::EC2::Instance
Properties:
ImageId: !Ref PublicEC2AMI
InstanceType: t3.micro
SubnetId: !Ref PublicSubnet1
SecurityGroupIds: - !Ref PublicSecurityGroup
IamInstanceProfile: !Ref EC2InstanceProfile
UserData:
Fn::Base64: !Sub |
#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent # Configure CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-public-instance' - Key: Environment
Value: !Ref Environment

PrivateEC2Instance:
Type: AWS::EC2::Instance
Properties:
ImageId: !Ref PrivateEC2AMI
InstanceType: t3.micro
SubnetId: !Ref PrivateSubnet1
SecurityGroupIds: - !Ref PrivateSecurityGroup
IamInstanceProfile: !Ref EC2InstanceProfile
UserData:
Fn::Base64: !Sub |
#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent # Configure CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-private-instance' - Key: Environment
Value: !Ref Environment

# ==================== RDS Database ====================

DBSubnetGroup:
Type: AWS::RDS::DBSubnetGroup
Properties:
DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group' - Key: Environment
Value: !Ref Environment

DatabaseInstance:
Type: AWS::RDS::DBInstance
DeletionPolicy: Snapshot
Properties:
DBInstanceIdentifier: !Sub '${AWS::StackName}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref InfrastructureKMSKey
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      DeletionProtection: true
      MultiAZ: false
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-database' - Key: Environment
Value: !Ref Environment

# ==================== S3 Buckets ====================

SecureS3Bucket:
Type: AWS::S3::Bucket
Properties:
BucketName: !Sub '${AWS::StackName}-secure-bucket-${AWS::AccountId}'
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: AES256
BucketKeyEnabled: true
VersioningConfiguration:
Status: Enabled
LoggingConfiguration:
DestinationBucketName: !Ref LoggingBucket
LogFilePrefix: access-logs/
PublicAccessBlockConfiguration:
BlockPublicAcls: true
BlockPublicPolicy: true
IgnorePublicAcls: true
RestrictPublicBuckets: true
NotificationConfiguration:
CloudWatchConfigurations: - Event: s3:ObjectCreated:\*
CloudWatchConfiguration:
LogGroupName: !Ref S3LogGroup
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-secure-bucket' - Key: Environment
Value: !Ref Environment

LoggingBucket:
Type: AWS::S3::Bucket
Properties:
BucketName: !Sub '${AWS::StackName}-logging-bucket-${AWS::AccountId}'
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: AES256
BucketKeyEnabled: true
PublicAccessBlockConfiguration:
BlockPublicAcls: true
BlockPublicPolicy: true
IgnorePublicAcls: true
RestrictPublicBuckets: true
LifecycleConfiguration:
Rules: - Id: DeleteOldLogs
Status: Enabled
ExpirationInDays: 90
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-logging-bucket' - Key: Environment
Value: !Ref Environment

# ==================== Lambda Function ====================

SecurityMonitoringLambda:
Type: AWS::Lambda::Function
Properties:
FunctionName: !Sub '${AWS::StackName}-security-monitoring'
Runtime: python3.9
Handler: index.lambda_handler
Role: !GetAtt LambdaExecutionRole.Arn
Code:
ZipFile: |
import json
import boto3
import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info(f"Received event: {json.dumps(event)}")

              # Process security group change event
              if 'detail' in event and 'eventName' in event['detail']:
                  event_name = event['detail']['eventName']
                  if 'SecurityGroup' in event_name:
                      logger.warning(f"Security Group change detected: {event_name}")

                      # Send SNS notification
                      sns = boto3.client('sns')
                      message = f"Security Group change detected: {event_name}"

                      try:
                          response = sns.publish(
                              TopicArn=os.environ['SNS_TOPIC_ARN'],
                              Message=message,
                              Subject='Security Alert: Security Group Change'
                          )
                          logger.info(f"SNS notification sent: {response['MessageId']}")
                      except Exception as e:
                          logger.error(f"Failed to send SNS notification: {str(e)}")

              return {
                  'statusCode': 200,
                  'body': json.dumps('Event processed successfully')
              }
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SecurityAlertsTopic
      Timeout: 60
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-security-monitoring'
        - Key: Environment
          Value: !Ref Environment

# ==================== CloudWatch Logs ====================

LambdaLogGroup:
Type: AWS::Logs::LogGroup
Properties:
LogGroupName: !Sub '/aws/lambda/${SecurityMonitoringLambda}'
RetentionInDays: 14
KmsKeyId: !GetAtt InfrastructureKMSKey.Arn

S3LogGroup:
Type: AWS::Logs::LogGroup
Properties:
LogGroupName: !Sub '/aws/s3/${AWS::StackName}'
RetentionInDays: 30
KmsKeyId: !GetAtt InfrastructureKMSKey.Arn

# ==================== SNS Topic for Security Alerts ====================

SecurityAlertsTopic:
Type: AWS::SNS::Topic
Properties:
TopicName: !Sub '${AWS::StackName}-security-alerts'
      DisplayName: Security Alerts
      KmsMasterKeyId: !Ref InfrastructureKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-security-alerts' - Key: Environment
Value: !Ref Environment

# ==================== CloudTrail ====================

CloudTrail:
Type: AWS::CloudTrail::Trail
Properties:
TrailName: !Sub '${AWS::StackName}-cloudtrail'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: cloudtrail-logs/
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref InfrastructureKMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SecureS3Bucket}/\*'
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-cloudtrail' - Key: Environment
Value: !Ref Environment

CloudTrailBucket:
Type: AWS::S3::Bucket
Properties:
BucketName: !Sub '${AWS::StackName}-cloudtrail-${AWS::AccountId}'
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: AES256
BucketKeyEnabled: true
PublicAccessBlockConfiguration:
BlockPublicAcls: true
BlockPublicPolicy: true
IgnorePublicAcls: true
RestrictPublicBuckets: true
LifecycleConfiguration:
Rules: - Id: DeleteOldCloudTrailLogs
Status: Enabled
ExpirationInDays: 365
Tags: - Key: Name
Value: !Sub '${AWS::StackName}-cloudtrail-bucket' - Key: Environment
Value: !Ref Environment

CloudTrailBucketPolicy:
Type: AWS::S3::BucketPolicy
Properties:
Bucket: !Ref CloudTrailBucket
PolicyDocument:
Statement: - Sid: AWSCloudTrailAclCheck
Effect: Allow
Principal:
Service: cloudtrail.amazonaws.com
Action: s3:GetBucketAcl
Resource: !GetAtt CloudTrailBucket.Arn - Sid: AWSCloudTrailWrite
Effect: Allow
Principal:
Service: cloudtrail.amazonaws.com
Action: s3:PutObject
Resource: !Sub '${CloudTrailBucket.Arn}/cloudtrail-logs/\*'
Condition:
StringEquals:
's3:x-amz-acl': bucket-owner-full-control

# ==================== EventBridge Rule for Security Group Changes ====================

SecurityGroupChangeRule:
Type: AWS::Events::Rule
Properties:
Name: !Sub '${AWS::StackName}-sg-change-rule'
Description: Detect Security Group changes
EventPattern:
source: - aws.ec2
detail-type: - AWS API Call via CloudTrail
detail:
eventSource: - ec2.amazonaws.com
eventName: - AuthorizeSecurityGroupIngress - AuthorizeSecurityGroupEgress - RevokeSecurityGroupIngress - RevokeSecurityGroupEgress - CreateSecurityGroup - DeleteSecurityGroup
State: ENABLED
Targets: - Arn: !GetAtt SecurityMonitoringLambda.Arn
Id: SecurityMonitoringTarget

LambdaInvokePermission:
Type: AWS::Lambda::Permission
Properties:
FunctionName: !Ref SecurityMonitoringLambda
Action: lambda:InvokeFunction
Principal: events.amazonaws.com
SourceArn: !GetAtt SecurityGroupChangeRule.Arn

Outputs:
VPCId:
Description: VPC ID
Value: !Ref VPC
Export:
Name: !Sub '${AWS::StackName}-vpc-id'

PublicSubnet1Id:
Description: Public Subnet 1 ID
Value: !Ref PublicSubnet1
Export:
Name: !Sub '${AWS::StackName}-public-subnet-1-id'

PublicSubnet2Id:
Description: Public Subnet 2 ID
Value: !Ref PublicSubnet2
Export:
Name: !Sub '${AWS::StackName}-public-subnet-2-id'

PrivateSubnet1Id:
Description: Private Subnet 1 ID
Value: !Ref PrivateSubnet1
Export:
Name: !Sub '${AWS::StackName}-private-subnet-1-id'

PrivateSubnet2Id:
Description: Private Subnet 2 ID
Value: !Ref PrivateSubnet2
Export:
Name: !Sub '${AWS::StackName}-private-subnet-2-id'
