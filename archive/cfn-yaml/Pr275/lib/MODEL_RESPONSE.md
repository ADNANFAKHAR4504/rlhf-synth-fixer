```
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  A secure, compliant, and production-ready AWS infrastructure using CloudFormation.
  This template enforces encryption, MFA, and avoids hardcoded sensitive data.

Resources:
  # KMS Key for encrypting resources
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting S3 and EBS
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      EnableKeyRotation: true
    Metadata:
      Comment: KMS Key with rotation enabled

  # S3 Bucket with encryption and versioning
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: production
    Metadata:
      Comment: S3 Bucket encrypted with KMS and versioning enabled

  # IAM Role with MFA enforcement
  SecureEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              Bool:
                aws:MultiFactorAuthPresent: 'true'
      Policies:
        - PolicyName: SecureEC2Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
      Tags:
        - Key: Environment
          Value: production
    Metadata:
      Comment: IAM Role with MFA enforcement and least-privilege S3 access

  # SSM Parameter to store a secure value
  SecureSSMParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /secure/parameter
      Type: String
      Value: !Ref 'AWS::NoValue' # Value should be set via SSM Parameter Store
      Tags:
        - Key: Environment
          Value: production
    Metadata:
      Comment: SSM Parameter to store secure values

  # (Optional) EC2 Instance with encrypted EBS
  SecureEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0abcdef1234567890 # Example AMI ID, replace with a valid one
      IamInstanceProfile: !Ref SecureEC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/sdh
          Ebs:
            VolumeId: !Ref SecureEBSVolume
      Tags:
        - Key: Environment
          Value: production
    Metadata:
      Comment: EC2 Instance with encrypted EBS volume

  # IAM Instance Profile for EC2
  SecureEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref SecureEC2Role

  # Encrypted EBS Volume
  SecureEBSVolume:
    Type: AWS::EC2::Volume
    Properties:
      Size: 10
      Encrypted: true
      KmsKeyId: !Ref EncryptionKey
      Tags:
        - Key: Environment
          Value: production
    Metadata:
      Comment: Encrypted EBS Volume using KMS

  # Attach EBS Volume to EC2 Instance
  SecureVolumeAttachment:
    Type: AWS::EC2::VolumeAttachment
    Properties:
      InstanceId: !Ref SecureEC2Instance
      VolumeId: !Ref SecureEBSVolume
      Device: /dev/sdh

Outputs:
  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref SecureS3Bucket
  KMSKeyArn:
    Description: ARN of the KMS Key
    Value: !GetAtt EncryptionKey.Arn
  IAMRoleArn:
    Description: ARN of the IAM Role
    Value: !GetAtt SecureEC2Role.Arn
```