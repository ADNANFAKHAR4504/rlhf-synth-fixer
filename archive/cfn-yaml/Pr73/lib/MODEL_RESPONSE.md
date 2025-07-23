# Enterprise-Level AWS CloudFormation Template

Below is a comprehensive CloudFormation template that addresses all the specified requirements for enterprise-level infrastructure deployment. This template is designed to be robust, secure, and consistent across multiple regions and environments.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Enterprise-level infrastructure with multi-region support, SSM parameter integration, strict S3 access control, standardized tagging, ALB configuration, KMS encryption, and least privilege IAM roles'

Parameters:
  # Environment and cost center parameters for standardized tagging
  Environment:
    Description: Environment name (e.g., dev, test, prod)
    Type: String
    AllowedValues:
      - dev
      - test
      - prod
    Default: dev

  CostCenter:
    Description: Cost center for resource billing
    Type: String
    Default: 'CC-123456'

  # SSM Parameter paths for dynamic configuration
  VpcIdParameter:
    Description: SSM Parameter Store path for VPC ID
    Type: String
    Default: '/network/vpc-id'

  SubnetIdsParameter:
    Description: SSM Parameter Store path for comma-separated list of subnet IDs
    Type: String
    Default: '/network/subnet-ids'

  SecurityGroupIdParameter:
    Description: SSM Parameter Store path for security group ID
    Type: String
    Default: '/network/security-group-id'

  # EC2 instance configuration
  InstanceType:
    Description: EC2 instance type
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium

  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instance
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be the name of an existing EC2 KeyPair

  # S3 bucket configuration
  S3BucketName:
    Description: Name for the S3 bucket (must be globally unique)
    Type: String
    Default: 'enterprise-bucket-example'

Conditions:
  IsProd: !Equals [!Ref Environment, 'prod']

Resources:
  #############################################
  # KMS Key for S3 Encryption
  #############################################
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 bucket encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: environment
          Value: !Ref Environment
        - Key: costCenter
          Value: !Ref CostCenter

  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-s3-encryption-key'
      TargetKeyId: !Ref S3EncryptionKey

  #############################################
  # VPC Endpoint for S3 Access
  #############################################
  S3VpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:ListBucket'
            Resource:
              - !Sub 'arn:aws:s3:::${S3BucketName}'
              - !Sub 'arn:aws:s3:::${S3BucketName}/*'
      RouteTableIds:
        - !ImportValue 'RouteTableId'  # Assuming route table ID is exported from another stack
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcId: '{{resolve:ssm:${VpcIdParameter}}}'
      VpcEndpointType: Gateway
      Tags:
        - Key: environment
          Value: !Ref Environment
        - Key: costCenter
          Value: !Ref CostCenter

  #############################################
  # S3 Bucket with VPC Restriction and KMS Encryption
  #############################################
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${S3BucketName}-${AWS::Region}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3EncryptionKey.Arn
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: environment
          Value: !Ref Environment
        - Key: costCenter
          Value: !Ref CostCenter

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowVPCEndpointAccess
            Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:ListBucket'
            Resource:
              - !Sub 'arn:aws:s3:::${S3Bucket}'
              - !Sub 'arn:aws:s3:::${S3Bucket}/*'
            Condition:
              StringEquals:
                aws:sourceVpc: '{{resolve:ssm:${VpcIdParameter}}}'
          - Sid: DenyNonSSLAccess
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${S3Bucket}'
              - !Sub 'arn:aws:s3:::${S3Bucket}/*'
            Condition:
              Bool:
                aws:SecureTransport: false
          - Sid: EnforceKMSEncryption
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  #############################################
  # IAM Role for EC2 with Least Privilege
  #############################################
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'  # For SSM Session Manager access
      Tags:
        - Key: environment
          Value: !Ref Environment
        - Key: costCenter
          Value: !Ref CostCenter

  EC2S3AccessPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${Environment}-ec2-s3-access'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:ListBucket'
            Resource:
              - !Sub 'arn:aws:s3:::${S3Bucket}'
              - !Sub 'arn:aws:s3:::${S3Bucket}/*'
          - Effect: Allow
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
            Resource: !GetAtt S3EncryptionKey.Arn
      Roles:
        - !Ref EC2Role

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  #############################################
  # EC2 Instance (Placeholder for demonstration)
  #############################################
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]  # Defined in Mappings section
      SubnetId: !Select [0, !Split [',', '{{resolve:ssm:${SubnetIdsParameter}}}']]
      SecurityGroupIds:
        - '{{resolve:ssm:${SecurityGroupIdParameter}}}'
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          yum update -y
          yum install -y aws-cli
          echo "Instance initialized in ${Environment} environment" > /tmp/init.log
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-example-instance'
        - Key: environment
          Value: !Ref Environment
        - Key: costCenter
          Value: !Ref CostCenter

  #############################################
  # Application Load Balancer with Cross-Zone Load Balancing
  #############################################
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-application-lb'
      Scheme: internal
      Type: application
      Subnets: !Split [',', '{{resolve:ssm:${SubnetIdsParameter}}}']
      SecurityGroups:
        - '{{resolve:ssm:${SecurityGroupIdParameter}}}'
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http.drop_invalid_header_fields.enabled
          Value: 'true'
        - Key: load_balancing.cross_zone.enabled
          Value: 'true'  # Enable cross-zone load balancing
      Tags:
        - Key: environment
          Value: !Ref Environment
        - Key: costCenter
          Value: !Ref CostCenter

  # Target Group for the Load Balancer
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-target-group'
      Port: 80
      Protocol: HTTP
      TargetType: instance
      VpcId: '{{resolve:ssm:${VpcIdParameter}}}'
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Targets:
        - Id: !Ref EC2Instance
          Port: 80
      Tags:
        - Key: environment
          Value: !Ref Environment
        - Key: costCenter
          Value: !Ref CostCenter

  # Listener for the Load Balancer
  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref LoadBalancer
      Port: 80
      Protocol: HTTP

Mappings:
  # AMI mappings for different regions
  RegionMap:
    us-east-1:
      AMI: ami-0c55b159cbfafe1f0
    us-west-2:
      AMI: ami-0892d3c7ee96c0bf7
    eu-west-1:
      AMI: ami-0ea3405d2d2522162
    ap-southeast-1:
      AMI: ami-0b8cf0f359b1335e1

Outputs:
  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  S3BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketArn'

  KMSKeyArn:
    Description: ARN of the KMS key used for S3 encryption
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  EC2RoleArn:
    Description: ARN of the EC2 IAM Role
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2RoleArn'

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt LoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  EC2InstanceId:
    Description: ID of the EC2 instance
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceId'
```

## Template Explanation

This CloudFormation template addresses all the specified requirements:

### 1. Multi-Region Deployment Readiness

- The template includes a `RegionMap` that provides region-specific AMI IDs
- Resources are designed to be region-agnostic with dynamic configuration
- S3 bucket names include the region to ensure global uniqueness
- The template can be deployed to multiple regions without modification

### 2. Dynamic Configuration Management with AWS Systems Manager Parameter Store

- The template uses SSM Parameter Store to retrieve:
  - VPC ID: `{{resolve:ssm:${VpcIdParameter}}}`
  - Subnet IDs: `{{resolve:ssm:${SubnetIdsParameter}}}`
  - Security Group ID: `{{resolve:ssm:${SecurityGroupIdParameter}}}`
- This allows the same template to be used across different environments without modification

### 3. Strict S3 Access Control (VPC Restriction)

- Creates an S3 VPC Endpoint to allow private access from the VPC
- Implements an S3 bucket policy that:
  - Restricts access to the specified VPC using the `aws:sourceVpc` condition
  - Denies non-SSL access
  - Enforces KMS encryption for all objects

### 4. Standardized Resource Tagging

- All resources include `environment` and `costCenter` tags
- These tags are defined as parameters to allow dynamic assignment during stack deployment
- Consistent tagging is applied to all resources: KMS keys, S3 buckets, EC2 instances, IAM roles, and the load balancer

### 5. Application Load Balancer (ALB) Configuration

- Configures an ALB with cross-zone load balancing explicitly enabled:
  ```yaml
  LoadBalancerAttributes:
    - Key: load_balancing.cross_zone.enabled
      Value: 'true'
  ```
- Includes a target group and listener for the EC2 instance

### 6. KMS Encryption for S3 Data

- Creates a customer-managed KMS key with appropriate permissions
- Configures the S3 bucket to use this KMS key for server-side encryption
- Enforces encryption through the bucket policy

### 7. Least Privilege IAM Roles

- Creates an IAM role for EC2 with only the necessary permissions:
  - SSM access for management
  - Specific S3 actions (GetObject, PutObject, ListBucket) only on the created S3 bucket
  - KMS permissions limited to Decrypt and GenerateDataKey operations on the specific KMS key

This template provides a robust foundation for enterprise-level infrastructure deployment that adheres to best practices for security, consistency, and manageability across multiple regions and environments.Insert here the Model Response that failed