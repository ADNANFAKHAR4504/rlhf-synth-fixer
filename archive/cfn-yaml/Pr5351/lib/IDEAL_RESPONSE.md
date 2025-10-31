# CloudFormation Security Compliance Template

This comprehensive CloudFormation template enforces encryption and compliance requirements across AWS accounts, implementing security best practices for S3, EBS, IAM, and AWS Config services.

## Reference Architecture

```
+------------------------------------------------------+
|                  AWS Account                          |
+------------------------------------------------------+
|                                                      |
|  +----------------+    +-------------------------+    |
|  |   KMS Keys     |    |       IAM MFA          |    |
|  | +-----------+  |    | +-------------------+  |    |
|  | | S3 Key    |  |    | | MFARequiredPolicy |  |    |
|  | +-----------+  |    | +-------------------+  |    |
|  | | EBS Key   |  |    | | AllUsersGroup     |  |    |
|  | +-----------+  |    | +-------------------+  |    |
|  +----------------+    +-------------------------+    |
|         |  |                       |                  |
|         |  +--------------------+  |                  |
|         v                       v  v                  |
|  +----------------+    +-------------------------+    |
|  | S3 Resources   |    | EBS Configuration      |    |
|  | +-----------+  |    | +-------------------+  |    |
|  | | Bucket    |  |    | | Lambda Function   |  |    |
|  | +-----------+  |    | +-------------------+  |    |
|  | | Bucket    |  |    | | Custom Resource   |  |    |
|  | | Policy    |  |    | | Encryption        |  |    |
|  | +-----------+  |    | +-------------------+  |    |
|  +----------------+    +-------------------------+    |
|                                                      |
|  +----------------------------------------------+    |
|  |               AWS Config                     |    |
|  |                                              |    |
|  |  +----------------+   +------------------+   |    |
|  |  | Config Recorder |   | Delivery Channel |   |    |
|  |  +----------------+   +------------------+   |    |
|  |                                              |    |
|  |  +-------------------+  +-----------------+  |    |
|  |  | S3 Encryption Rule |  | EBS Encryption  |  |    |
|  |  +-------------------+  | Rule             |  |    |
|  |                         +-----------------+  |    |
|  +----------------------------------------------+    |
|                                                      |
+------------------------------------------------------+
```

## Security and Compliance Implementation

### Core Components

1. **KMS Encryption Keys**
   - Customer-managed keys for S3 and EBS encryption
   - Automatic key rotation enabled
   - Environment-specific aliases with suffix

2. **S3 Bucket Security**
   - Default KMS encryption enforced
   - Bucket policy denying unencrypted uploads
   - Public access completely blocked
   - Versioning enabled for data protection

3. **EBS Default Encryption**
   - Account-level encryption enforcement via Lambda custom resource
   - Customer-managed KMS key integration
   - Automatic encryption for all new volumes

4. **IAM MFA Policy**
   - Comprehensive policy requiring MFA for privileged operations
   - Self-service MFA device management
   - Applied to all users via IAM group

5. **AWS Config Compliance**
   - Configuration recorder for resource monitoring
   - Managed rules for S3 and EBS encryption validation
   - Encrypted delivery channel for compliance data

## CloudFormation YAML Template

```yaml
# filename: TapStack.yml
AWSTemplateFormatVersion: "2010-09-09"
Description: Security and compliance template enforcing encryption and MFA requirements

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  #----------------------------------------
  # KMS Keys for Encryption
  #----------------------------------------
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 bucket encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: "*"
          - Sid: Allow use of the key
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: "*"
      Tags:
        - Key: Purpose
          Value: S3Encryption
        - Key: Environment
          Value: Production
        - Key: ComplianceControl
          Value: DataEncryption

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/s3-encryption-key-${EnvironmentSuffix}
      TargetKeyId: !Ref S3KMSKey

  EBSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for EBS volume encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: "*"
          - Sid: Allow use of the key
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: "*"
      Tags:
        - Key: Purpose
          Value: EBSEncryption
        - Key: Environment
          Value: Production
        - Key: ComplianceControl
          Value: DataEncryption

  EBSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/ebs-encryption-key-${EnvironmentSuffix}
      TargetKeyId: !Ref EBSKMSKey

  #----------------------------------------
  # S3 Bucket with Encryption Enforcement
  #----------------------------------------
  EncryptedS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3KMSKey.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Purpose
          Value: SecureStorage
        - Key: Environment
          Value: Production
        - Key: ComplianceControl
          Value: EncryptedStorage

  EncryptedS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref EncryptedS3Bucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: "*"
            Action: s3:PutObject
            Resource: !Sub ${EncryptedS3Bucket.Arn}/*
            Condition:
              "Null":
                s3:x-amz-server-side-encryption: "true"
          - Sid: DenyIncorrectEncryptionHeader
            Effect: Deny
            Principal: "*"
            Action: s3:PutObject
            Resource: !Sub ${EncryptedS3Bucket.Arn}/*
            Condition:
              StringNotEquals:
                s3:x-amz-server-side-encryption: aws:kms
          - Sid: DenyIncorrectKMSKey
            Effect: Deny
            Principal: "*"
            Action: s3:PutObject
            Resource: !Sub ${EncryptedS3Bucket.Arn}/*
            Condition:
              StringNotLike:
                s3:x-amz-server-side-encryption-aws-kms-key-id: !GetAtt S3KMSKey.Arn

  #----------------------------------------
  # EBS Encryption Lambda Custom Resource
  #----------------------------------------
  EBSEncryptionLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: EC2Permissions
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - ec2:EnableEbsEncryptionByDefault
                  - ec2:GetEbsEncryptionByDefault
                  - ec2:ModifyEbsDefaultKmsKeyId
                  - ec2:GetEbsDefaultKmsKeyId
                Resource: "*"
              - Effect: Allow
                Action: kms:DescribeKey
                Resource: !GetAtt EBSKMSKey.Arn

  EBSEncryptionLambda:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt EBSEncryptionLambdaRole.Arn
      Runtime: python3.12
      Timeout: 30
      Code:
        ZipFile: |
          import boto3
          import cfnresponse
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def handler(event, context):
            logger.info('Received event: %s', event)
            status = cfnresponse.SUCCESS

            try:
              if event['RequestType'] in ['Create', 'Update']:
                ec2 = boto3.client('ec2')
                kms_key_id = event['ResourceProperties']['KmsKeyId']

                # Enable EBS encryption by default
                logger.info('Enabling EBS encryption by default')
                ec2.enable_ebs_encryption_by_default()

                # Set the default KMS key for EBS
                logger.info('Setting default KMS key to: %s', kms_key_id)
                ec2.modify_ebs_default_kms_key_id(KmsKeyId=kms_key_id)

                # Verify settings were applied
                encryption_enabled = ec2.get_ebs_encryption_by_default()['EbsEncryptionByDefault']
                default_key = ec2.get_ebs_default_kms_key_id()['KmsKeyId']

                logger.info('EBS encryption by default: %s', encryption_enabled)
                logger.info('Default KMS key: %s', default_key)

                # Return attributes in the response
                attributes = {
                  'EbsEncryptionEnabled': str(encryption_enabled),
                  'DefaultKmsKeyId': default_key
                }

                cfnresponse.send(event, context, status, attributes)

              elif event['RequestType'] == 'Delete':
                # We don't disable encryption on delete, just report success
                logger.info('Delete request - not disabling encryption for security reasons')
                cfnresponse.send(event, context, status, {})

            except Exception as e:
              logger.error('Error: %s', str(e))
              status = cfnresponse.FAILED
              cfnresponse.send(event, context, status, {})
      Tags:
        - Key: Purpose
          Value: EBSEncryption
        - Key: Environment
          Value: Production

  EBSEncryptionCustomResource:
    Type: Custom::EBSEncryption
    Properties:
      ServiceToken: !GetAtt EBSEncryptionLambda.Arn
      KmsKeyId: !Ref EBSKMSKey

  #----------------------------------------
  # IAM MFA Policy Configuration
  #----------------------------------------
  MFARequiredPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      Description: Policy requiring MFA for privileged actions
      ManagedPolicyName: !Sub RequireMFAForPrivilegedActions-${EnvironmentSuffix}
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - iam:GetAccountPasswordPolicy
              - iam:GetAccountSummary
              - iam:ListVirtualMFADevices
            Resource: "*"
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - iam:ChangePassword
              - iam:GetUser
            Resource: arn:aws:iam::*:user/${aws:username}
          - Sid: AllowManageOwnVirtualMFADevice
            Effect: Allow
            Action:
              - iam:CreateVirtualMFADevice
              - iam:DeleteVirtualMFADevice
            Resource: arn:aws:iam::*:mfa/${aws:username}
          - Sid: AllowManageOwnUserMFA
            Effect: Allow
            Action:
              - iam:DeactivateMFADevice
              - iam:EnableMFADevice
              - iam:ListMFADevices
              - iam:ResyncMFADevice
            Resource: arn:aws:iam::*:user/${aws:username}
          - Sid: DenyAllExceptListedIfNoMFA
            Effect: Deny
            NotAction:
              - iam:ChangePassword
              - iam:CreateVirtualMFADevice
              - iam:EnableMFADevice
              - iam:GetUser
              - iam:ListMFADevices
              - iam:ListVirtualMFADevices
              - iam:ResyncMFADevice
              - sts:GetSessionToken
            Resource: "*"
            Condition:
              BoolIfExists:
                aws:MultiFactorAuthPresent: "false"

  AllUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub AllUsers-${EnvironmentSuffix}
      ManagedPolicyArns:
        - !Ref MFARequiredPolicy
      Path: /

  #----------------------------------------
  # AWS Config Setup
  #----------------------------------------
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
      Path: /
      Tags:
        - Key: Purpose
          Value: ComplianceMonitoring
        - Key: Environment
          Value: Production

  ConfigBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3KMSKey.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Purpose
          Value: ConfigStorage
        - Key: Environment
          Value: Production
        - Key: ComplianceControl
          Value: ComplianceData

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub arn:aws:s3:::${ConfigBucket}
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub arn:aws:s3:::${ConfigBucket}/config/AWSLogs/${AWS::AccountId}/Config/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub DefaultRecorder-${EnvironmentSuffix}
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
      RoleARN: !GetAtt ConfigRole.Arn

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: One_Hour
      S3BucketName: !Ref ConfigBucket
      S3KeyPrefix: config

  #----------------------------------------
  # AWS Config Rules
  #----------------------------------------
  S3EncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn:
      - ConfigRecorder
      - ConfigDeliveryChannel
    Properties:
      ConfigRuleName: !Sub s3-bucket-server-side-encryption-enabled-${EnvironmentSuffix}
      Description: Checks if S3 buckets have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket

  EBSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn:
      - ConfigRecorder
      - ConfigDeliveryChannel
    Properties:
      ConfigRuleName: !Sub encrypted-volumes-${EnvironmentSuffix}
      Description: Checks if EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Volume

Outputs:
  S3KMSKeyArn:
    Description: ARN of the KMS key for S3 encryption
    Value: !GetAtt S3KMSKey.Arn
    Export:
      Name: !Sub ${AWS::StackName}-S3KMSKeyArn

  EBSKMSKeyArn:
    Description: ARN of the KMS key for EBS encryption
    Value: !GetAtt EBSKMSKey.Arn
    Export:
      Name: !Sub ${AWS::StackName}-EBSKMSKeyArn

  EncryptedS3BucketName:
    Description: Name of the encrypted S3 bucket
    Value: !Ref EncryptedS3Bucket
    Export:
      Name: !Sub ${AWS::StackName}-EncryptedS3BucketName

  MFARequiredPolicyArn:
    Description: ARN of the IAM policy requiring MFA for privileged actions
    Value: !Ref MFARequiredPolicy
    Export:
      Name: !Sub ${AWS::StackName}-MFARequiredPolicyArn

  ConfigBucketName:
    Description: Name of the bucket storing AWS Config data
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub ${AWS::StackName}-ConfigBucketName
```

## CloudFormation JSON Template

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Security and compliance template enforcing encryption and MFA requirements",
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Environment Configuration"
                    },
                    "Parameters": [
                        "EnvironmentSuffix"
                    ]
                }
            ]
        }
    },
    "Parameters": {
        "EnvironmentSuffix": {
            "Type": "String",
            "Default": "dev",
            "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
            "AllowedPattern": "^[a-zA-Z0-9]+$",
            "ConstraintDescription": "Must contain only alphanumeric characters"
        }
    },
    "Resources": {
        "S3KMSKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": "KMS key for S3 bucket encryption",
                "EnableKeyRotation": true,
                "KeyPolicy": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Allow administration of the key",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow use of the key",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": [
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Purpose",
                        "Value": "S3Encryption"
                    },
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    },
                    {
                        "Key": "ComplianceControl",
                        "Value": "DataEncryption"
                    }
                ]
            }
        }
    }
}
```

## AWS Region Configuration

```
eu-west-1
```

## Infrastructure Features

### Security Controls
- **Encryption at Rest**: All storage encrypted with customer-managed KMS keys
- **MFA Enforcement**: Required for all privileged IAM operations
- **Access Control**: S3 public access completely blocked
- **Compliance Monitoring**: Continuous validation via AWS Config

### Environment Isolation
- **Environment Suffix**: Parameterized resource naming for multi-environment support
- **Unique Resources**: All named resources include environment suffix
- **Cost Optimization**: Delete policies for QA environments

### Operational Excellence
- **Monitoring**: AWS Config rules for continuous compliance validation
- **Logging**: Configuration changes tracked and stored securely
- **Automation**: Lambda-based custom resource for EBS encryption
- **Tagging**: Consistent resource tagging for governance

This template provides a comprehensive security baseline that enforces encryption across S3 and EBS services while requiring MFA for privileged operations and maintaining continuous compliance monitoring through AWS Config.