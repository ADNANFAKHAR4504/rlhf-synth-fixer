```
AWSTemplateFormatVersion: '2010-09-09'
Description: Secure AWS infrastructure for a web application adhering to enterprise security and compliance.

Resources:
  # KMS Key for encrypting sensitive data
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting sensitive application data
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
           Resource: '*'

  # S3 Bucket for storing logs
  LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # S3 Bucket Policy to restrict access
  LogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Deny
            Principal: '*'
            Action: s3:*
            Resource:
              - !Sub arn:aws:s3:::${LogBucket}
              - !Sub arn:aws:s3:::${LogBucket}/*
            Condition:
              Bool:
                aws:SecureTransport: 'false'

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub arn:aws:s3:::${LogBucket}
                  - !Sub arn:aws:s3:::${LogBucket}/*

  # IAM User with restricted access
  RestrictedUser:
    Type: AWS::IAM::User
    Properties:
      UserName: RestrictedAppUser
      Policies:
        - PolicyName: S3ListPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: s3:ListBucket
                Resource: !Sub arn:aws:s3:::${LogBucket}

  # CloudTrail to monitor IAM changes
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      IsLogging: true
      S3BucketName: !Ref LogBucket
      KmsKeyId: !Ref EncryptionKey
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::IAM::Role
            - Type: AWS::IAM::Policy

  # Security Group for EC2
  WebAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable HTTP and HTTPS access
      VpcId: vpc-xxxxxxxx # Replace with your VPC ID
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0

  # EventBridge Rule for rotating credentials
  RotateCredentialsRule:
    Type: AWS::Events::Rule
    Properties:
      Description: Rotate IAM user credentials every 30 days
      ScheduleExpression: rate(30 days)
      Targets:
        - Arn: !GetAtt RotateCredentialsLambda.Arn
          Id: RotateCredentials

  # Lambda function to rotate credentials
  RotateCredentialsLambda:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log("Rotate credentials logic here");
          };
      Runtime: nodejs14.x
      Timeout: 30

  # IAM Role for Lambda execution
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: RotateCredentialsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - iam:UpdateAccessKey
                  - iam:DeleteAccessKey
                  - iam:CreateAccessKey
                Resource: !Sub arn:aws:iam::${AWS::AccountId}:user/RestrictedAppUser

Outputs:
  LogBucketName:
    Description: Name of the S3 bucket for logs
    Value: !Ref LogBucket
```
