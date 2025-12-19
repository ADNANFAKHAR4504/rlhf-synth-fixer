I'll fix all the linting and deployment errors. The main issues are with S3 lifecycle configuration syntax and CloudTrail properties. Here's the corrected template:

## Fixed CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS infrastructure with S3 encryption, IAM least privilege, CloudTrail, and VPC Flow Logs'

Parameters:
  ProjectName:
    Type: String
    Default: 'myproj'
    Description: 'Project name for resource naming convention'
    AllowedPattern: '^[a-z0-9]+$'
    ConstraintDescription: 'Must contain only lowercase letters and numbers'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
    Description: 'Environment name for resource naming convention'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

Resources:
  # Random string generator for unique naming
  RandomString:
    Type: 'AWS::CloudFormation::CustomResource'
    Properties:
      ServiceToken: !GetAtt RandomStringFunction.Arn

  RandomStringFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-random-generator'
      Runtime: 'python3.9'
      Handler: 'index.handler'
      Role: !GetAtt RandomStringLambdaRole.Arn
      Code:
        ZipFile: |
          import json
          import random
          import string
          import cfnresponse

          def handler(event, context):
              try:
                  if event['RequestType'] == 'Create':
                      random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {'RandomString': random_string})
                  else:
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})

  RandomStringLambdaRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-random-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'

  # S3 Bucket for CloudTrail Logs (Central Logging)
  CloudTrailLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-cloudtrail-logs-${RandomString.RandomString}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
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
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER

  # S3 Bucket for VPC Flow Logs
  VpcFlowLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-vpc-flowlogs-${RandomString.RandomString}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
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
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA

  # CloudTrail Bucket Policy
  CloudTrailBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*'

  # IAM Role for CloudTrail
  CloudTrailRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-cloudtrail-role-${RandomString.RandomString}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:aws:logs:*:${AWS::AccountId}:log-group:/aws/cloudtrail/*'

  # CloudTrail (Multi-region)
  GlobalCloudTrail:
    Type: 'AWS::CloudTrail::Trail'
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-global-trail-${RandomString.RandomString}'
      S3BucketName: !Ref CloudTrailLogsBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - 'arn:aws:s3:::*/*'

  # VPC
  SecureVpc:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-${RandomString.RandomString}'

  # Public Subnet
  PublicSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref SecureVpc
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-${RandomString.RandomString}'

  # Private Subnet
  PrivateSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref SecureVpc
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-${RandomString.RandomString}'

  # Internet Gateway
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw-${RandomString.RandomString}'

  AttachGateway:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref SecureVpc
      InternetGatewayId: !Ref InternetGateway

  # IAM Role for VPC Flow Logs
  VpcFlowLogsRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-flowlogs-role-${RandomString.RandomString}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: VpcFlowLogsDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketLocation'
                  - 's3:ListBucket'
                Resource: !GetAtt VpcFlowLogsBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${VpcFlowLogsBucket.Arn}/*'

  # VPC Flow Logs
  VpcFlowLogs:
    Type: 'AWS::EC2::FlowLog'
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref SecureVpc
      TrafficType: 'ALL'
      LogDestinationType: 's3'
      LogDestination: !Sub '${VpcFlowLogsBucket.Arn}/vpc-flow-logs/'
      LogFormat: '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action}'
      MaxAggregationInterval: 60
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-flowlogs-${RandomString.RandomString}'

  # IAM Role for EC2 instances (example of least privilege)
  Ec2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-ec2-role-${RandomString.RandomString}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: S3ReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource:
                  - !Sub '${CloudTrailLogsBucket.Arn}/*'
                  - !Sub '${VpcFlowLogsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt CloudTrailLogsBucket.Arn
                  - !GetAtt VpcFlowLogsBucket.Arn
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'

  Ec2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-ec2-profile-${RandomString.RandomString}'
      Roles:
        - !Ref Ec2InstanceRole

Outputs:
  CloudTrailBucketName:
    Description: 'Name of the CloudTrail logs S3 bucket'
    Value: !Ref CloudTrailLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailBucket'

  VpcFlowLogsBucketName:
    Description: 'Name of the VPC Flow Logs S3 bucket'
    Value: !Ref VpcFlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-VpcFlowLogsBucket'

  VpcId:
    Description: 'VPC ID'
    Value: !Ref SecureVpc
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt GlobalCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'

  RandomString:
    Description: 'Generated random string for resource naming'
    Value: !GetAtt RandomString.RandomString
```

## Key Fixes Made

### 1. **S3 Lifecycle Configuration Syntax**

**Before (Incorrect):**

```yaml
- Id: TransitionToIA
  Status: Enabled
  TransitionInDays: 30 # ❌ Wrong property
  StorageClass: STANDARD_IA # ❌ Wrong property
```

**After (Correct):**

```yaml
- Id: TransitionToIA
  Status: Enabled
  Transitions: # ✅ Correct property
    - TransitionInDays: 30
      StorageClass: STANDARD_IA
```

### 2. **CloudTrail Required Property**

**Before (Missing):**

```yaml
GlobalCloudTrail:
  Type: 'AWS::CloudTrail::Trail'
  Properties:
    # Missing IsLogging property
```

**After (Added):**

```yaml
GlobalCloudTrail:
  Type: 'AWS::CloudTrail::Trail'
  Properties:
    IsLogging: true # ✅ Required property added
```

### 3. **CloudTrail EventSelectors DataResources**

**Before (Invalid):**

```yaml
DataResources:
  - Type: 'AWS::S3::Bucket' # ❌ Not supported for this type
    Values:
      - 'arn:aws:s3:::*'
```

**After (Fixed):**

```yaml
DataResources:
  - Type: 'AWS::S3::Object' # ✅ Correct type
    Values:
      - 'arn:aws:s3:::*/*' # ✅ Correct format
```

## Validation Commands

Before deploying, validate the template:

```bash
# Validate template syntax
aws cloudformation validate-template --template-body file://secure-infrastructure.yaml

# Lint with cfn-lint (if installed)
cfn-lint secure-infrastructure.yaml

# Deploy with validation
aws cloudformation create-stack \
  --stack-name secure-infrastructure \
  --template-body file://secure-infrastructure.yaml \
  --parameters ParameterKey=ProjectName,ParameterValue=myproj \
               ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM
```

## Updated README Section

Add this troubleshooting section to the README:

````markdown
## Common Linting Errors and Fixes

### S3 Lifecycle Configuration

- **Error**: `TransitionInDays was unexpected`
- **Fix**: Use `Transitions` array instead of direct properties
- **Correct Format**:
  ```yaml
  Transitions:
    - TransitionInDays: 30
      StorageClass: STANDARD_IA
  ```
````

### CloudTrail Configuration

- **Error**: `'IsLogging' is a required property`
- **Fix**: Add `IsLogging: true` to CloudTrail properties

### EventSelectors DataResources

- **Error**: `'AWS::S3::Bucket' is not one of [supported types]`
- **Fix**: Use `AWS::S3::Object` instead of `AWS::S3::Bucket`

## Pre-Deployment Checklist

- [ ] Template passes `aws cloudformation validate-template`
- [ ] Template passes `cfn-lint` (if available)
- [ ] All required IAM capabilities specified
- [ ] Parameter values follow naming conventions
- [ ] Target region supports all required services

```

The template is now fixed and should pass both linting and deployment without errors. All the security requirements remain intact while fixing the syntax issues.
```
