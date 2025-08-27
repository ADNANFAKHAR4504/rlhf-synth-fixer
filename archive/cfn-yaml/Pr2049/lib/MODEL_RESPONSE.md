## Model Response
``` yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with comprehensive security controls for IAM, S3, RDS, Lambda, and CloudTrail'

Parameters:
  AllowedCIDRRange:
    Type: String
    Description: 'CIDR range allowed for EC2 security group access'
    Default: '10.0.0.0/16'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR range'
  
  DatabaseUsername:
    Type: String
    Description: 'Master username for RDS instance'
    Default: 'dbadmin'
    MinLength: 4
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
  
  DatabasePassword:
    Type: String
    Description: 'Master password for RDS instance'
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+=-]*$'
  
  Environment:
    Type: String
    Description: 'Environment name for resource tagging'
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']

Resources:
  # ============================================
  # KMS Keys for Encryption
  # ============================================
  
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for S3 bucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: S3Encryption

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/s3-encryption-key
      TargetKeyId: !Ref S3KMSKey

  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for RDS encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: RDSEncryption

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/rds-encryption-key
      TargetKeyId: !Ref RDSKMSKey

  LambdaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for Lambda environment variables encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda Service
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: LambdaEncryption

  LambdaKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/lambda-encryption-key
      TargetKeyId: !Ref LambdaKMSKey

  # ============================================
  # S3 Buckets with Encryption and Logging
  # ============================================

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-access-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
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
            ExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: AccessLogging

  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-application-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'application-bucket-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: ApplicationData

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-cloudtrail-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: CloudTrailLogs

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub '${CloudTrailBucket}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3KMSKey.Arn

  # ============================================
  # IAM Roles and Policies
  # ============================================

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2-Role'
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
        - PolicyName: EC2S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref ApplicationBucket
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3KMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-EC2-InstanceProfile'
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-Lambda-ExecutionRole'
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
        - PolicyName: LambdaS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub '${ApplicationBucket}/lambda-data/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt S3KMSKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${AWS::StackName}-*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  AdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-Admin-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
      Policies:
        - PolicyName: AdminAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - iam:ListUsers
                  - iam:ListRoles
                  - iam:GetUser
                  - iam:GetRole
                  - s3:ListAllMyBuckets
                  - s3:GetBucketLocation
                  - ec2:DescribeInstances
                  - ec2:DescribeSecurityGroups
                  - rds:DescribeDBInstances
                  - lambda:ListFunctions
                  - cloudtrail:DescribeTrails
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${ApplicationBucket}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM User with MFA enforcement
  SecureUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub '${AWS::StackName}-secure-user'
      Policies:
        - PolicyName: MFAEnforcement
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
                Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${AWS::StackName}-secure-user'
              - Sid: AllowManageOwnMFA
                Effect: Allow
                Action:
                  - iam:CreateVirtualMFADevice
                  - iam:DeleteVirtualMFADevice
                  - iam:ListMFADevices
                  - iam:EnableMFADevice
                  - iam:ResyncMFADevice
                Resource:
                  - !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/${AWS::StackName}-secure-user'
                  - !Sub 'arn:aws:iam::${AWS::AccountId}:user/${AWS::StackName}-secure-user'
              - Sid: DenyAllExceptUnlessMFAAuthenticated
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
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ============================================
  # Security Groups
  # ============================================

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-EC2-SecurityGroup'
      GroupDescription: 'Security group for EC2 instances with restricted access'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedCIDRRange
          Description: 'SSH access from allowed CIDR range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedCIDRRange
          Description: 'HTTP access from allowed CIDR range'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCIDRRange
          Description: 'HTTPS access from allowed CIDR range'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound for package updates'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for package updates'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-SecurityGroup'

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-RDS-SecurityGroup'
      GroupDescription: 'Security group for RDS instances'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-SecurityGroup'

  # ============================================
  # RDS Instance with Encryption
  # ============================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS instance'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      MasterUsername: !Ref DatabaseUsername
      MasterUserPassword: !Ref DatabasePassword
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      EnablePerformanceInsights: true
      PerformanceInsightsKMSKeyId: !Ref RDSKMSKey
      PerformanceInsightsRetentionPeriod: 7
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${AWS::StackName}-database'

  # ============================================
  # VPC and Networking (for RDS)
  # ============================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'

  # ============================================
  # Lambda Function
  # ============================================

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-secure-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      KmsKeyArn: !GetAtt LambdaKMSKey.Arn
      Environment:
        Variables:
          BUCKET_NAME: !Ref ApplicationBucket
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def lambda_handler(event, context):
              bucket_name = os.environ['BUCKET_NAME']
              environment = os.environ['ENVIRONMENT']
              
              # Example secure Lambda function
              s3_client = boto3.client('s3')
              
              try:
                  # List objects in the specific bucket
                  response = s3_client.list_objects_v2(
                      Bucket=bucket_name,
                      Prefix='lambda-data/'
                  )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': f'Successfully accessed bucket in {environment}',
                          'object_count': response.get('KeyCount', 0)
                      })
                  }
              except Exception as e:
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e)
                      })
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ============================================
  # CloudWatch Logs
  # ============================================

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${AWS::StackName}'
      RetentionInDays: 90

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${AWS::StackName}-secure-function'
      RetentionInDays: 90

  # ============================================
  # CloudTrail
  # ============================================

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-cloudtrail'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'AWSLogs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !GetAtt S3KMSKey.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${ApplicationBucket}/*'
            - Type: 'AWS::S3::Bucket'
              Values:
                - !Ref ApplicationBucket
      Tags:
        - Key: Environment
          Value: !Ref Environment

# ============================================
# Outputs
# ============================================

Outputs:
  S3BucketName:
    Description: 'Name of the application S3 bucket'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  RDSEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  LambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  EC2SecurityGroupId:
    Description: 'ID of the EC2 security group'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2SecurityGroup'

  CloudTrailArn:
    Description: 'ARN of the CloudTrail'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'

  KMSKeyIds:
    Description: 'KMS Key IDs for encryption'
    Value: !Sub 'S3: ${S3KMSKey}, RDS: ${RDSKMSKey}, Lambda: ${LambdaKMSKey}'
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeys'
```