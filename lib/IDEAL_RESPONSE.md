```yaml
# CloudFormation Template - Secure AWS Infrastructure
# Region: us-west-2
# Features: S3 buckets with encryption, EC2 instances with monitoring, IAM roles with least privilege

AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with S3 buckets, EC2 instances, and IAM roles - us-west-2 region'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

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

  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Mappings:
  RegionMap:
    us-west-2:
      AMI: 'ami-0c2d3e23b7e8d8b5a' # Amazon Linux 2023 AMI

Resources:
  # S3 Bucket for Secure Data Storage
  SecureDataBucket:
    Type: 'AWS::S3::Bucket'
    DeletionPolicy: Delete  # Ensures bucket can be destroyed
    Properties:
      BucketName: !Sub '${Project}-secure-data-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'  # AWS managed keys (SSE-S3)
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

  # S3 Bucket for Application Logs
  LogsBucket:
    Type: 'AWS::S3::Bucket'
    DeletionPolicy: Delete  # Ensures bucket can be destroyed
    Properties:
      BucketName: !Sub '${Project}-logs-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'  # AWS managed keys (SSE-S3)
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

  # IAM Role for EC2 Instances - Least Privilege
  EC2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${Project}-ec2-role-${EnvironmentSuffix}'
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
              # Read/Write access to SecureDataBucket
              - Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${SecureDataBucket.Arn}/*'
              # List bucket permission for SecureDataBucket
              - Effect: 'Allow'
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt SecureDataBucket.Arn
              # Write-only access to LogsBucket
              - Effect: 'Allow'
                Action:
                  - 's3:PutObject'
                Resource:
                  - !Sub '${LogsBucket.Arn}/*'
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
      InstanceProfileName: !Sub '${Project}-ec2-profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2InstanceRole

  # Security Group for EC2 - Minimal Access
  EC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: !Sub '${Project}-ec2-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for EC2 instances with minimal access'
      SecurityGroupIngress:
        # SSH restricted to private networks only
        - IpProtocol: 'tcp'
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/8'
          Description: 'SSH access from private networks'
        # HTTP access
        - IpProtocol: 'tcp'
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access'
        # HTTPS access
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

  # EC2 Instance with CloudWatch Monitoring
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
          # Configure CloudWatch agent for monitoring
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -c default -s
      Tags:
        - Key: 'Name'
          Value: !Sub '${Project}-web-server-${EnvironmentSuffix}'
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Project'
          Value: !Ref Project
        - Key: 'Owner'
          Value: !Ref Owner

  # IAM Role for Application Services (Lambda) - Read-Only Access
  ApplicationServiceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${Project}-app-service-role-${EnvironmentSuffix}'
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
              # Read-only access to SecureDataBucket
              - Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt SecureDataBucket.Arn
                  - !Sub '${SecureDataBucket.Arn}/*'
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

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Key Features and Compliance

### 1. **Region Constraint (us-west-2)**
- Template configured for us-west-2 region
- Region-specific AMI mapping included
- All resources will be created in the specified region when deployed

### 2. **Mandatory Tagging Policy**
- All resources include the three mandatory tags: Environment, Project, and Owner
- Tags are parameterized for flexibility
- Consistent tagging across all taggable resources

### 3. **Least Privilege IAM Permissions**
- **EC2InstanceRole**: Limited to specific S3 bucket operations and CloudWatch
- **ApplicationServiceRole**: Read-only access to the secure data bucket
- No overly broad permissions or wildcards in resource ARNs
- Separate roles for different service types (EC2 vs Lambda)

### 4. **S3 Encryption (SSE-S3)**
- Both S3 buckets configured with AES256 encryption (AWS managed keys)
- BucketKeyEnabled for cost optimization
- Public access completely blocked on all buckets

### 5. **Environment Isolation**
- EnvironmentSuffix parameter ensures unique resource names
- Prevents conflicts between multiple deployments
- All resource names include the environment suffix

### 6. **Security Best Practices**
- Security groups with minimal required access
- SSH restricted to private networks only (10.0.0.0/8)
- S3 bucket versioning enabled for data protection
- Lifecycle policies for log retention management
- CloudWatch agent installation for monitoring

### 7. **Deployment and Cleanup**
- DeletionPolicy set to Delete for all S3 buckets
- No Retain policies that would prevent cleanup
- All resources can be safely destroyed

### 8. **Infrastructure Components**
- **Networking**: Security group with controlled ingress/egress
- **Storage**: Two S3 buckets with different access patterns
- **Compute**: EC2 instance with monitoring capabilities
- **Identity**: Two IAM roles following least privilege principle
- **Monitoring**: CloudWatch agent configured on EC2 instances

## Deployment Instructions

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=pr1403
export AWS_REGION=us-west-2

# Deploy the stack
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --region ${AWS_REGION}

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --region ${AWS_REGION} \
  --query 'Stacks[0].Outputs'
```

## Cleanup Instructions

```bash
# Empty S3 buckets first
aws s3 rm s3://secure-infrastructure-secure-data-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID} --recursive
aws s3 rm s3://secure-infrastructure-logs-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID} --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --region ${AWS_REGION}
```

This template provides a secure, compliant, and maintainable infrastructure foundation that meets all specified requirements while following AWS best practices.