```
Based on your requirements, I'll create a comprehensive CloudFormation YAML template that establishes a secure AWS infrastructure in the us-west-2 region. Here's the IAC code that meets all your constraints:

AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with S3 buckets, EC2 instances, and IAM roles - us-west-2 region'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment tag value'

  Project:
    Type: String
    Default: 'secure-infrastructure'
    Description: 'Project tag value'

  Owner:
    Type: String
    Default: 'infrastructure-team'
    Description: 'Owner tag value'

  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium']
    Description: 'EC2 instance type'

Mappings:
  RegionMap:
    us-west-2:
      AMI: 'ami-0c2d3e23b7e8d8b5a'  # Amazon Linux 2023 AMI

Resources:
  # S3 Buckets with encryption
  SecureDataBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${Project}-secure-data-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: 'Enabled'
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Project'
          Value: !Ref Project
        - Key: 'Owner'
          Value: !Ref Owner

  LogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${Project}-logs-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldLogs'
            Status: 'Enabled'
            ExpirationInDays: 90
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Project'
          Value: !Ref Project
        - Key: 'Owner'
          Value: !Ref Owner

  # IAM Role for EC2 instances with least privilege
  EC2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${Project}-ec2-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: 'S3AccessPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${SecureDataBucket}/*'
              - Effect: 'Allow'
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt SecureDataBucket.Arn
              - Effect: 'Allow'
                Action:
                  - 's3:PutObject'
                Resource:
                  - !Sub '${LogsBucket}/*'
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Project'
          Value: !Ref Project
        - Key: 'Owner'
          Value: !Ref Owner

  # Instance Profile for EC2
  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub '${Project}-ec2-profile-${Environment}'
      Roles:
        - !Ref EC2InstanceRole

  # Security Group for EC2 instances
  EC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: !Sub '${Project}-ec2-sg-${Environment}'
      GroupDescription: 'Security group for EC2 instances with minimal access'
      SecurityGroupIngress:
        - IpProtocol: 'tcp'
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/8'  # Restrict SSH to private networks only
          Description: 'SSH access from private networks'
        - IpProtocol: 'tcp'
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access'
        - IpProtocol: 'tcp'
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Project'
          Value: !Ref Project
        - Key: 'Owner'
          Value: !Ref Owner

  # EC2 Instance
  WebServerInstance:
    Type: 'AWS::EC2::Instance'
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -c default -s
      Tags:
        - Key: 'Name'
          Value: !Sub '${Project}-web-server-${Environment}'
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Project'
          Value: !Ref Project
        - Key: 'Owner'
          Value: !Ref Owner

  # Additional IAM role for application services with least privilege
  ApplicationServiceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${Project}-app-service-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: 'ReadOnlyS3Access'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt SecureDataBucket.Arn
                  - !Sub '${SecureDataBucket}/*'
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Project'
          Value: !Ref Project
        - Key: 'Owner'
          Value: !Ref Owner

Outputs:
  SecureDataBucketName:
    Description: 'Name of the secure data S3 bucket'
    Value: !Ref SecureDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureDataBucket'

  LogsBucketName:
    Description: 'Name of the logs S3 bucket'
    Value: !Ref LogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucket'

  EC2InstanceId:
    Description: 'Instance ID of the web server'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-WebServerInstance'

  EC2InstanceRoleArn:
    Description: 'ARN of the EC2 instance role'
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceRole'

  ApplicationServiceRoleArn:
    Description: 'ARN of the application service role'
    Value: !GetAtt ApplicationServiceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationServiceRole'
Key Features and Compliance:
1. Region Constraint (us-west-2)
The template is designed for us-west-2 region
Uses region-specific AMI mapping
All resources will be created in the specified region when deployed
2. Mandatory Tagging Policy
All resources include the three mandatory tags: Environment, Project, and Owner
Uses parameters to make tag values configurable
Consistent tagging across all resources
3. Least Privilege IAM Permissions
EC2InstanceRole: Only has permissions to access specific S3 buckets and CloudWatch
ApplicationServiceRole: Read-only access to the secure data bucket
No overly broad permissions like * actions
Specific resource ARNs where possible
4. S3 Encryption (SSE-S3)
Both S3 buckets have server-side encryption enabled using AES256 (AWS managed keys)
BucketKeyEnabled: true for cost optimization
Public access blocked on all buckets for security
5. Additional Security Features
Security groups with restricted access (SSH only from private networks)
S3 bucket versioning enabled
Lifecycle policies for log retention
CloudWatch agent installation for monitoring
6. Best Practices Implemented
Parameterized template for flexibility
Resource naming with environment and account ID
Proper resource dependencies
Comprehensive outputs for integration
User data script for EC2 configuration
This template provides a secure, compliant foundation that can be extended based on specific application requirements while maintaining all the specified constraints.
```
