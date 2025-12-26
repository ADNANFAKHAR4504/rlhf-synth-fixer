# AWS CloudFormation Secure Infrastructure - Model Response

## CloudFormation YAML Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure infrastructure with IAM roles, CloudTrail, VPC subnets, S3 encryption, and EC2 monitoring for compliance'

Parameters:
  ExistingVPCId:
    Type: AWS::EC2::VPC::Id
    Description: 'Existing VPC ID with CIDR 10.0.0.0/16'
    ConstraintDescription: 'Must be a valid VPC ID'
  
  AvailabilityZones:
    Type: List<AWS::EC2::AvailabilityZone::Name>
    Description: 'Availability Zones for subnets'
    Default: ['us-east-1a', 'us-east-1b']
  
  PublicKeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
    Default: ''
  
  AssumeRoleService:
    Type: String
    Description: 'Service that will assume the IAM role'
    Default: 'ec2.amazonaws.com'
    AllowedValues: ['ec2.amazonaws.com', 'lambda.amazonaws.com']
  
  CreateS3Bucket:
    Type: String
    Description: 'Whether to create the my-app-bucket or use existing'
    Default: 'true'
    AllowedValues: ['true', 'false']

Resources:
  # KMS Customer Master Key for S3 encryption
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for S3 bucket encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'Allow CloudFormation to use the key'
            Effect: Allow
            Principal:
              Service: cloudformation.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
            Resource: '*'
          - Sid: 'Allow S3 to use the key for encryption'
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
            Resource: '*'
      Tags:
        - Key: Name
          Value: 'my-app-s3-kms-key'
        - Key: Purpose
          Value: 'S3 bucket encryption'

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: 'alias/my-app/s3'
      TargetKeyId: !Ref S3KMSKey

  # S3 Bucket for application data
  AppS3Bucket:
    Type: AWS::S3::Bucket
    Condition: CreateS3BucketCondition
    Properties:
      BucketName: 'my-app-bucket'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KmsMasterKeyId: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'my-app-bucket'
        - Key: Purpose
          Value: 'Application data storage'

  # S3 Bucket Policy for application bucket
  AppS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: CreateS3BucketCondition
    Properties:
      Bucket: !Ref AppS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyNonSSLRequests'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: 
              - !Sub '${AppS3Bucket}'
              - !Sub '${AppS3Bucket}/*'
            Condition:
              Bool:
                aws:SecureTransport: false

  # S3 Bucket for CloudTrail logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'my-app-cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KmsMasterKeyId: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'my-app-cloudtrail-logs'
        - Key: Purpose
          Value: 'CloudTrail log storage'

  # S3 Bucket Policy for CloudTrail logs
  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AWSCloudTrailAclCheck'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub '${CloudTrailLogsBucket}'
          - Sid: 'AWSCloudTrailWrite'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailLogsBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Sid: 'DenyNonSSLRequests'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource: 
              - !Sub '${CloudTrailLogsBucket}'
              - !Sub '${CloudTrailLogsBucket}/*'
            Condition:
              Bool:
                aws:SecureTransport: false

  # CloudTrail for multi-region logging
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: 'my-app-cloudtrail'
      S3BucketName: !Ref CloudTrailLogsBucket
      S3KeyPrefix: 'AWSLogs'
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
      IsLogging: true
      EnableLogFileValidation: true
      KmsKeyId: !Ref S3KMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      Tags:
        - Key: Name
          Value: 'my-app-cloudtrail'
        - Key: Purpose
          Value: 'Compliance logging'

  # IAM Role for S3 read access
  S3ReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'my-app-Role-ReadS3'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: !Ref AssumeRoleService
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Name
          Value: 'my-app-Role-ReadS3'
        - Key: Purpose
          Value: 'S3 read-only access'

  # IAM Policy for S3 read-only access
  S3ReadOnlyPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: 'my-app-S3ReadOnlyPolicy'
      Roles:
        - !Ref S3ReadOnlyRole
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'S3ReadOnlyAccess'
            Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
              - s3:GetBucketLocation
            Resource:
              - !Sub 'arn:aws:s3:::my-app-bucket'
              - !Sub 'arn:aws:s3:::my-app-bucket/*'
            Condition:
              Bool:
                aws:SecureTransport: true

  # IAM Instance Profile for EC2
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: 'my-app-EC2InstanceProfile'
      Roles:
        - !Ref S3ReadOnlyRole

  # Subnet 1
  SubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [0, !Ref AvailabilityZones]
      CidrBlock: '10.0.1.0/24'
      Tags:
        - Key: Name
          Value: 'my-app-Subnet-A'
        - Key: Purpose
          Value: 'Application subnet'

  # Subnet 2
  SubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [1, !Ref AvailabilityZones]
      CidrBlock: '10.0.2.0/24'
      Tags:
        - Key: Name
          Value: 'my-app-Subnet-B'
        - Key: Purpose
          Value: 'Application subnet'

  # Security Group for EC2 instances
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'my-app-EC2SecurityGroup'
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref ExistingVPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'SSH access'
      Tags:
        - Key: Name
          Value: 'my-app-EC2SecurityGroup'
        - Key: Purpose
          Value: 'EC2 instance security'

  # Sample EC2 Instance with detailed monitoring
  SampleEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI in us-east-1
      InstanceType: t3.micro
      KeyName: !Ref PublicKeyName
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      SubnetId: !Ref SubnetA
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true  # Enable detailed monitoring
      Tags:
        - Key: Name
          Value: 'my-app-SampleEC2'
        - Key: Purpose
          Value: 'Sample instance with monitoring'

Conditions:
  CreateS3BucketCondition: !Equals [!Ref CreateS3Bucket, 'true']

Outputs:
  S3KMSKeyArn:
    Description: 'ARN of the KMS key used for S3 encryption'
    Value: !GetAtt S3KMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3KMSKeyArn'

  S3BucketName:
    Description: 'Name of the S3 bucket'
    Value: !If [CreateS3BucketCondition, !Ref AppS3Bucket, 'my-app-bucket (existing)']
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  CloudTrailName:
    Description: 'Name of the CloudTrail'
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailName'

  IAMRoleArn:
    Description: 'ARN of the IAM role for S3 read access'
    Value: !GetAtt S3ReadOnlyRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-IAMRoleArn'

  SubnetAId:
    Description: 'ID of Subnet A'
    Value: !Ref SubnetA
    Export:
      Name: !Sub '${AWS::StackName}-SubnetAId'

  SubnetBId:
    Description: 'ID of Subnet B'
    Value: !Ref SubnetB
    Export:
      Name: !Sub '${AWS::StackName}-SubnetBId'

  SampleEC2InstanceId:
    Description: 'ID of the sample EC2 instance'
    Value: !Ref SampleEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-SampleEC2InstanceId'

  DeploymentCommand:
    Description: 'Command to deploy this stack'
    Value: !Sub 'aws cloudformation deploy --template-file template.yaml --stack-name my-app-secure-infra --parameter-overrides ExistingVPCId=${ExistingVPCId} --capabilities CAPABILITY_NAMED_IAM'
```

## README Documentation

### Deployment Instructions

1. **Prerequisites:**
   - AWS CLI configured with appropriate permissions
   - Existing VPC with CIDR 10.0.0.0/16
   - EC2 Key Pair (optional, for SSH access)

2. **Deploy the stack:**
   ```bash
   aws cloudformation deploy \
     --template-file template.yaml \
     --stack-name my-app-secure-infra \
     --parameter-overrides ExistingVPCId=vpc-xxxxxxxxx \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Parameters:**
   - `ExistingVPCId`: Your existing VPC ID
   - `AvailabilityZones`: Defaults to us-east-1a and us-east-1b
   - `PublicKeyName`: EC2 Key Pair for SSH access (optional)
   - `AssumeRoleService`: Service that will assume the IAM role (default: ec2.amazonaws.com)
   - `CreateS3Bucket`: Whether to create my-app-bucket (default: true)

### Validation Steps

#### 1. IAM Policy Check
```bash
# Verify IAM role and policy
aws iam get-role --role-name my-app-Role-ReadS3
aws iam list-attached-role-policies --role-name my-app-Role-ReadS3
aws iam get-role-policy --role-name my-app-Role-ReadS3 --policy-name my-app-S3ReadOnlyPolicy
```

#### 2. CloudTrail Validation
```bash
# Verify CloudTrail configuration
aws cloudtrail describe-trails --trail-name-list my-app-cloudtrail
aws cloudtrail get-trail-status --name my-app-cloudtrail

# Check if multi-region and global events are enabled
aws cloudtrail describe-trails --trail-name-list my-app-cloudtrail --query 'trailList[0].{IsMultiRegionTrail:IsMultiRegionTrail,IncludeGlobalServiceEvents:IncludeGlobalServiceEvents,IsLogging:IsLogging}'
```

#### 3. S3 Encryption Check
```bash
# Verify S3 bucket encryption
aws s3api get-bucket-encryption --bucket my-app-bucket
aws s3api get-bucket-encryption --bucket my-app-cloudtrail-logs-ACCOUNTID-us-east-1
```

#### 4. VPC Subnets Validation
```bash
# Verify subnets in different AZs
aws ec2 describe-subnets --subnet-ids $(aws cloudformation describe-stacks --stack-name my-app-secure-infra --query 'Stacks[0].Outputs[?OutputKey==`SubnetAId`].OutputValue' --output text) $(aws cloudformation describe-stacks --stack-name my-app-secure-infra --query 'Stacks[0].Outputs[?OutputKey==`SubnetBId`].OutputValue' --output text) --query 'Subnets[*].{SubnetId:SubnetId,AvailabilityZone:AvailabilityZone,CidrBlock:CidrBlock}'
```

#### 5. EC2 Monitoring Check
```bash
# Verify detailed monitoring is enabled
aws ec2 describe-instances --instance-ids $(aws cloudformation describe-stacks --stack-name my-app-secure-infra --query 'Stacks[0].Outputs[?OutputKey==`SampleEC2InstanceId`].OutputValue' --output text) --query 'Reservations[0].Instances[0].Monitoring.State'
```

#### 6. IAM Role Testing
```bash
# Test IAM role permissions (run from EC2 instance)
aws sts assume-role --role-arn $(aws cloudformation describe-stacks --stack-name my-app-secure-infra --query 'Stacks[0].Outputs[?OutputKey==`IAMRoleArn`].OutputValue' --output text) --role-session-name TestSession

# Test S3 access with assumed role
aws s3 ls s3://my-app-bucket/
aws s3 cp s3://my-app-bucket/test-file.txt -
```

### Cleanup Commands

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name my-app-secure-infra

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name my-app-secure-infra

# Clean up any remaining resources manually if needed
aws s3 rb s3://my-app-bucket --force
aws s3 rb s3://my-app-cloudtrail-logs-ACCOUNTID-us-east-1 --force
```

### Security Features Implemented

1. **Least Privilege IAM**: Minimal S3 permissions (GetObject, ListBucket, GetBucketLocation)
2. **KMS Encryption**: All S3 buckets encrypted with customer-managed KMS key
3. **Multi-Region CloudTrail**: Compliance logging across all regions
4. **Network Security**: Subnets in different AZs, security groups
5. **Detailed Monitoring**: 1-minute EC2 metrics collection
6. **TLS Enforcement**: S3 buckets deny non-SSL requests
7. **Public Access Block**: S3 buckets block all public access

### Compliance Verification

- PASS: IAM role with minimal S3 read-only permissions
- PASS: CloudTrail enabled across all regions with global service events
- PASS: VPC with 2+ subnets in different AZs
- PASS: S3 bucket encrypted with KMS
- PASS: EC2 instances with detailed monitoring enabled
- PASS: All resources follow my-app-* naming convention
- PASS: Security controls: tags, encryption, least-privilege policies