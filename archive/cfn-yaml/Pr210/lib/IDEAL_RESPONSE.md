# CloudFormation Template - VPC, S3, and IAM Infrastructure

This template creates a production-ready AWS infrastructure with VPC, S3, and IAM components for secure cloud deployment in us-east-1.

## Features

1. Creates a VPC with CIDR `10.0.0.0/16` with DNS support enabled
2. Includes Internet Gateway attached to VPC for connectivity
3. Creates a private S3 bucket with:
   - AES256 encryption with bucket key enabled
   - Versioning enabled for data protection
   - All public access blocked
   - Lifecycle rules for incomplete multipart uploads
4. Creates an IAM role with least privilege for S3 read-only access
5. Uses parameters for environment and project name
6. Comprehensive tagging across all resources
7. Exports outputs for integration with other stacks

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready AWS infrastructure template with VPC, S3, and IAM components for secure cloud deployment in us-east-1'

# Template Parameters for flexibility and customization
Parameters:
  # Environment parameter for different deployment stages
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - stage
      - prod
    Description: 'Environment name for resource tagging and naming conventions'
    ConstraintDescription: 'Must be one of: dev, stage, prod'

  # Project name parameter for resource naming and tagging
  ProjectName:
    Type: String
    Default: myproject
    MinLength: 3
    MaxLength: 20
    AllowedPattern: '^[a-z0-9]+$'
    Description: 'Project name used for resource naming (lowercase alphanumeric only)'
    ConstraintDescription: 'Must be 3-20 characters, lowercase letters and numbers only'

# AWS Resources definition
Resources:
  # VPC Configuration with specified CIDR block
  ProjectVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: 'Main VPC for project infrastructure'

  # Internet Gateway for VPC internet access
  ProjectInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: 'Internet gateway for VPC connectivity'

  # Attach Internet Gateway to VPC
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProjectVPC
      InternetGatewayId: !Ref ProjectInternetGateway

  # S3 Bucket with security configurations
  ProjectS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      # Enable versioning for data protection
      VersioningConfiguration:
        Status: Enabled
      # Configure server-side encryption with AES256
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      # Block all public access for security
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Configure lifecycle rules for cost optimization
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-storage'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: 'Primary storage bucket for project data'

  # IAM Role for S3 read-only access (Compatible with CAPABILITY_IAM)
  S3ReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      # Trust policy - allows EC2 instances to assume this role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action: sts:AssumeRole
      # Inline policy for S3 read-only access
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Allow listing bucket contents
              - Effect: Allow
                Action:
                  - s3:ListBucket
                  - s3:GetBucketLocation
                Resource: !GetAtt ProjectS3Bucket.Arn
              # Allow reading objects from the bucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${ProjectS3Bucket.Arn}/*'
              # Deny any write operations for security (explicit deny for least privilege)
              - Effect: Deny
                Action:
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:PutObjectAcl
                  - s3:DeleteObjectVersion
                Resource: !Sub '${ProjectS3Bucket.Arn}/*'
      # Maximum session duration for security
      MaxSessionDuration: 3600
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-s3-readonly-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: 'Read-only access to project S3 bucket'

  # Instance Profile for EC2 instances to use the IAM role
  S3ReadOnlyInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref S3ReadOnlyRole

# Template Outputs for reference and integration
Outputs:
  # VPC Information
  VPCId:
    Description: 'VPC ID for the created VPC'
    Value: !Ref ProjectVPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPC-ID'

  VPCCidrBlock:
    Description: 'CIDR block of the created VPC'
    Value: !GetAtt ProjectVPC.CidrBlock
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPC-CIDR'

  # S3 Bucket Information
  S3BucketName:
    Description: 'Name of the created S3 bucket'
    Value: !Ref ProjectS3Bucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-S3-Bucket-Name'

  S3BucketArn:
    Description: 'ARN of the created S3 bucket'
    Value: !GetAtt ProjectS3Bucket.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-S3-Bucket-ARN'

  S3BucketDomainName:
    Description: 'Domain name of the S3 bucket'
    Value: !GetAtt ProjectS3Bucket.DomainName
    Export:
      Name: !Sub '${ProjectName}-${Environment}-S3-Bucket-Domain'

  # IAM Role Information
  IAMRoleArn:
    Description: 'ARN of the S3 read-only IAM role'
    Value: !GetAtt S3ReadOnlyRole.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-IAM-Role-ARN'

  IAMRoleName:
    Description: 'Name of the S3 read-only IAM role'
    Value: !Ref S3ReadOnlyRole
    Export:
      Name: !Sub '${ProjectName}-${Environment}-IAM-Role-Name'

  InstanceProfileArn:
    Description: 'ARN of the instance profile for EC2 instances'
    Value: !GetAtt S3ReadOnlyInstanceProfile.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-Instance-Profile-ARN'

  # Deployment Information
  StackRegion:
    Description: 'AWS region where the stack is deployed'
    Value: !Ref 'AWS::Region'

  StackName:
    Description: 'Name of the CloudFormation stack'
    Value: !Ref 'AWS::StackName'

  TemplateVersion:
    Description: 'CloudFormation template version'
    Value: 'v1.1'
```

## Architecture Overview

This template creates a secure and scalable AWS infrastructure with:

1. **VPC (10.0.0.0/16)**: Main network infrastructure with DNS support
2. **Internet Gateway**: Provides internet connectivity for VPC resources
3. **S3 Bucket**: Secure storage with:
   - Server-side encryption (AES256)
   - Versioning enabled
   - Public access completely blocked
   - Lifecycle rules for cost optimization
4. **IAM Role**: EC2-assumable role with:
   - Read-only access to S3 bucket
   - Explicit deny on write operations (defense in depth)
   - Instance profile for EC2 integration
5. **Comprehensive Tagging**: All resources tagged with Environment, Project, and Purpose
6. **Parameterization**: Flexible deployment across different environments
7. **Export Values**: All critical resource IDs and ARNs exported for cross-stack references