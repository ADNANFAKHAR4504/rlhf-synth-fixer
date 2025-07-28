Below is a YAML-formatted AWS CloudFormation template that accomplishes the tasks outlined. This template ensures that the S3 bucket is private, versioned, and encrypted. It also sets up an IAM role for EC2 with necessary permissions, configures CloudTrail, deploys a VPC with subnets, and implements security groups with restricted SSH access.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation template to set up a secure infrastructure as per AWS CIS Foundations Benchmark.

Resources:
  # S3 Bucket for logs
  LogBucket:
    Type: AWS::S3::Bucket
    Properties: 
      BucketName: !Sub 'log-bucket-${AWS::Region}-${AWS::AccountId}'
      AccessControl: Private
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # IAM Role for EC2
  EC2Role:
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
        - PolicyName: S3WriteAccess
          PolicyDocument: 
            Version: '2012-10-17'
            Statement: 
              - Effect: Allow
                Action: 
                  - s3:PutObject
                Resource: 
                  - !Sub 'arn:aws:s3:::log-bucket-${AWS::Region}-${AWS::AccountId}/*'

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties: 
      IsLogging: true
      IsMultiRegionTrail: true
      S3BucketName: !Ref LogBucket
      EnableLogFileValidation: true

  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties: 
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags: 
        - Key: Name
          Value: MainVPC

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags: 
        - Key: Name
          Value: PublicSubnet1

  # Public Subnet 2
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags: 
        - Key: Name
          Value: PublicSubnet2

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      Tags: 
        - Key: Name
          Value: PrivateSubnet1

  # Private Subnet 2
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      Tags: 
        - Key: Name
          Value: PrivateSubnet2

  # Security Group
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties: 
      GroupDescription: Allow SSH from limited IP range
      VpcId: !Ref VPC
      SecurityGroupIngress: 
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 192.0.2.0/24

Outputs:
  LogBucketName:
    Description: The name of the S3 bucket for logs
    Value: !Ref LogBucket
  EC2RoleArn:
    Description: The ARN of the IAM role for EC2
    Value: !GetAtt EC2Role.Arn
  VPCId:
    Description: The ID of the VPC
    Value: !Ref VPC
```

This template includes:

1. An S3 bucket with private access, versioning, and encryption.
2. An IAM role for EC2 with permissions to write logs to the S3 bucket.
3. A CloudTrail configuration that logs to the S3 bucket, is multi-region, and has log file validation enabled.
4. A VPC with public and private subnets across two availability zones.
5. A security group that restricts SSH access to a specified IP range.

Ensure that you replace `192.0.2.0/24` with the actual IP range you want to allow SSH access from. Save this template as `security_cis_benchmark.yaml` and deploy it using AWS CloudFormation.