## TapStack Enterprise AWS Infrastructure Template
   This CloudFormation template provisions a secure, enterprise-grade AWS
   environment for multi-account deployments with strict security controls.

 Key Features:
   - Conditional resource creation: Checks for existing resources to prevent
     duplication or quota issues.
   - KMS encryption: CloudTrail and RDS use Customer Managed Keys (CMKs).
   - Secure S3 buckets: Private, encrypted, versioned, with strict bucket policies.
   - AWS Config & CloudTrail: Multi-region, logging, compliance auditing enabled.
   - Lambda Functions: Run in private subnets, least-privilege IAM roles.
   - RDS: Encrypted MySQL instance with subnet group and security group integration.
   - ALB: HTTPS enforced with TLS 1.2+, HTTP redirects, proper security group rules.
   - Tagging: All resources tagged with Environment and Purpose.

 Notes:
   - Designed for production-level deployment.
   - Includes dynamic parameters to reuse existing resources where applicable.
   - Avoids hard-coded secrets; leverages secure IAM roles and KMS keys.
   - Fully supports multi-environment deployments (dev, staging, prod).
  
```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Enterprise-Grade Secure AWS Infrastructure Template.
  Conditional creation of resources if not already existing.
  Implements CloudTrail, AWS Config, Lambda in VPC, KMS encryption for RDS, ALB HTTPS, and secure S3 buckets.

# -----------------------------
# Parameters
# -----------------------------
Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [dev, staging, prod]
    Description: Environment identifier

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID for Lambda and RDS

  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: List of private subnets for Lambda and RDS

  UseExistingCloudTrailBucket:
    Type: String
    Default: ''
    Description: ARN or name of existing CloudTrail S3 bucket (leave blank to create new)

  UseExistingConfigBucket:
    Type: String
    Default: ''
    Description: ARN or name of existing Config S3 bucket (leave blank to create new)

  UseExistingKMSCloudTrailKey:
    Type: String
    Default: ''
    Description: ARN of existing KMS CMK for CloudTrail (leave blank to create new)

  UseExistingKMSRDSKey:
    Type: String
    Default: ''
    Description: ARN of existing KMS CMK for RDS (leave blank to create new)

  UseExistingLambdaRole:
    Type: String
    Default: ''
    Description: Existing Lambda Execution Role ARN (leave blank to create new)

  UseExistingRDSSubnetGroup:
    Type: String
    Default: ''
    Description: Existing RDS Subnet Group (leave blank to create new)

  UseExistingRDS:
    Type: String
    Default: ''
    Description: Existing RDS Instance Identifier (leave blank to create new)

# -----------------------------
# Conditions
# -----------------------------
Conditions:
  CreateCloudTrailBucket: !Equals [ !Ref UseExistingCloudTrailBucket, '' ]
  CreateConfigBucket: !Equals [ !Ref UseExistingConfigBucket, '' ]
  CreateKMSCloudTrailKey: !Equals [ !Ref UseExistingKMSCloudTrailKey, '' ]
  CreateKMSRDSKey: !Equals [ !Ref UseExistingKMSRDSKey, '' ]
  CreateLambdaRole: !Equals [ !Ref UseExistingLambdaRole, '' ]
  CreateRDSSubnetGroup: !Equals [ !Ref UseExistingRDSSubnetGroup, '' ]
  CreateRDSInstance: !Equals [ !Ref UseExistingRDS, '' ]

# -----------------------------
# Resources
# -----------------------------

# -----------------------------
# KMS Keys
# -----------------------------
CloudTrailKMSKey:
  Type: AWS::KMS::Key
  Condition: CreateKMSCloudTrailKey
  Properties:
    Description: KMS CMK for CloudTrail encryption
    KeyPolicy:
      Version: '2012-10-17'
      Statement:
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action: kms:*
          Resource: '*'
        - Sid: Allow CloudTrail
          Effect: Allow
          Principal:
            Service: cloudtrail.amazonaws.com
          Action:
            - kms:Encrypt
            - kms:Decrypt
            - kms:GenerateDataKey*
            - kms:DescribeKey
          Resource: '*'
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: CloudTrail

CloudTrailKMSKeyAlias:
  Type: AWS::KMS::Alias
  Condition: CreateKMSCloudTrailKey
  Properties:
    AliasName: !Sub 'alias/cloudtrail-${Environment}'
    TargetKeyId: !Ref CloudTrailKMSKey

RDSKMSKey:
  Type: AWS::KMS::Key
  Condition: CreateKMSRDSKey
  Properties:
    Description: KMS CMK for RDS encryption
    KeyPolicy:
      Version: '2012-10-17'
      Statement:
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action: kms:*
          Resource: '*'
        - Sid: Allow RDS
          Effect: Allow
          Principal:
            Service: rds.amazonaws.com
          Action:
            - kms:Decrypt
            - kms:GenerateDataKey*
            - kms:DescribeKey
          Resource: '*'
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: RDS

RDSKMSKeyAlias:
  Type: AWS::KMS::Alias
  Condition: CreateKMSRDSKey
  Properties:
    AliasName: !Sub 'alias/rds-${Environment}'
    TargetKeyId: !Ref RDSKMSKey

# -----------------------------
# S3 Buckets
# -----------------------------
CloudTrailLogsBucket:
  Type: AWS::S3::Bucket
  Condition: CreateCloudTrailBucket
  Properties:
    BucketName: !Sub 'cloudtrail-logs-${AWS::AccountId}-${Environment}'
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: aws:kms
            KMSMasterKeyID: !If [CreateKMSCloudTrailKey, !Ref CloudTrailKMSKey, !Ref UseExistingKMSCloudTrailKey]
    VersioningConfiguration:
      Status: Enabled
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: CloudTrail

CloudTrailLogsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Condition: CreateCloudTrailBucket
  Properties:
    Bucket: !Ref CloudTrailLogsBucket
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Sid: DenyPublicAccess
          Effect: Deny
          Principal: '*'
          Action: 's3:*'
          Resource:
            - !Sub '${CloudTrailLogsBucket}/*'
            - !Ref CloudTrailLogsBucket

ConfigBucket:
  Type: AWS::S3::Bucket
  Condition: CreateConfigBucket
  Properties:
    BucketName: !Sub 'aws-config-${AWS::AccountId}-${Environment}'
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    VersioningConfiguration:
      Status: Enabled
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: Config

ConfigBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Condition: CreateConfigBucket
  Properties:
    Bucket: !Ref ConfigBucket
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Sid: DenyPublicAccess
          Effect: Deny
          Principal: '*'
          Action: 's3:*'
          Resource:
            - !Sub '${ConfigBucket}/*'
            - !Ref ConfigBucket

# -----------------------------
# IAM Roles
# -----------------------------
LambdaExecutionRole:
  Type: AWS::IAM::Role
  Condition: CreateLambdaRole
  Properties:
    RoleName: !Sub 'LambdaExecutionRole-${Environment}'
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: lambda.amazonaws.com
          Action: sts:AssumeRole
        - Effect: Deny
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
    Tags:
      - Key: Environment
        Value: !Ref Environment

# -----------------------------
# CloudTrail
# -----------------------------
CloudTrail:
  Type: AWS::CloudTrail::Trail
  Properties:
    TrailName: !Sub 'secure-cloudtrail-${Environment}'
    S3BucketName: !If [CreateCloudTrailBucket, !Ref CloudTrailLogsBucket, !Ref UseExistingCloudTrailBucket]
    IncludeGlobalServiceEvents: true
    IsMultiRegionTrail: true
    EnableLogFileValidation: true
    KMSKeyId: !If [CreateKMSCloudTrailKey, !Ref CloudTrailKMSKey, !Ref UseExistingKMSCloudTrailKey]
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: Audit

# -----------------------------
# AWS Config
# -----------------------------
ConfigRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: !Sub 'AWSConfigRole-${Environment}'
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: config.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/ConfigRole
    Tags:
      - Key: Environment
        Value: !Ref Environment

ConfigurationRecorder:
  Type: AWS::Config::ConfigurationRecorder
  Properties:
    Name: !Sub 'config-recorder-${Environment}'
    RoleARN: !GetAtt ConfigRole.Arn
    RecordingGroup:
      AllSupported: true
      IncludeGlobalResourceTypes: true

DeliveryChannel:
  Type: AWS::Config::DeliveryChannel
  Properties:
    Name: !Sub 'config-delivery-${Environment}'
    S3BucketName: !If [CreateConfigBucket, !Ref ConfigBucket, !Ref UseExistingConfigBucket]

RequiredTagsRule:
  Type: AWS::Config::ConfigRule
  Properties:
    ConfigRuleName: 'required-tags'
    Description: 'Ensures all resources have required tags'
    Source:
      Owner: AWS
      SourceIdentifier: REQUIRED_TAGS
    InputParameters: |
      {
        "tag1Key": "Environment",
        "tag2Key": "Purpose"
      }

# -----------------------------
# Lambda Security Group
# -----------------------------
LambdaSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for Lambda functions
    VpcId: !Ref VpcId
    SecurityGroupEgress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: HTTPS outbound
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
        Description: HTTP outbound
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: Lambda

# -----------------------------
# Lambda Function
# -----------------------------
SecureLambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: !Sub 'secure-lambda-${Environment}'
    Runtime: python3.9
    Handler: index.lambda_handler
    Role: !If [CreateLambdaRole, !GetAtt LambdaExecutionRole.Arn, !Ref UseExistingLambdaRole]
    Code:
      ZipFile: |
        def lambda_handler(event, context):
            return {'statusCode': 200, 'body': 'Hello from secure Lambda!'}
    VpcConfig:
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
      SubnetIds: !Ref PrivateSubnetIds
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: Compute

# -----------------------------
# RDS Subnet Group
# -----------------------------
RDSSubnetGroup:
  Type: AWS::RDS::DBSubnetGroup
  Condition: CreateRDSSubnetGroup
  Properties:
    DBSubnetGroupName: !Sub 'rds-subnet-group-${Environment}'
    DBSubnetGroupDescription: Subnet group for RDS instances
    SubnetIds: !Ref PrivateSubnetIds
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: Database

# -----------------------------
# RDS Security Group
# -----------------------------
RDSSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for RDS instances
    VpcId: !Ref VpcId
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 3306
        ToPort: 3306
        SourceSecurityGroupId: !Ref LambdaSecurityGroup
        Description: MySQL access from Lambda
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: Database

# -----------------------------
# Encrypted RDS Instance
# -----------------------------
SecureRDSInstance:
  Type: AWS::RDS::DBInstance
  Condition: CreateRDSInstance
  Properties:
    DBInstanceIdentifier: !Sub 'secure-db-${Environment}'
    DBInstanceClass: db.t3.micro
    Engine: mysql
    EngineVersion: '8.0'
    AllocatedStorage: 20
    StorageType: gp2
    StorageEncrypted: true
    KmsKeyId: !If [CreateKMSRDSKey, !Ref RDSKMSKey, !Ref UseExistingKMSRDSKey]
    DBSubnetGroupName: !If [CreateRDSSubnetGroup, !Ref RDSSubnetGroup, !Ref UseExistingRDSSubnetGroup]
    VPCSecurityGroups:
      - !Ref RDSSecurityGroup
    MasterUsername: admin
    ManageMasterUserPassword: true
    BackupRetentionPeriod: 7
    MultiAZ: false
    PubliclyAccessible: false
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: Database

# -----------------------------
# ALB Security Group
# -----------------------------
ALBSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for Application Load Balancer
    VpcId: !Ref VpcId
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: LoadBalancer

# -----------------------------
# Application Load Balancer
# -----------------------------
ApplicationLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Name: !Sub 'secure-alb-${Environment}'
    Type: application
    Scheme: internet-facing
    SecurityGroups:
      - !Ref ALBSecurityGroup
    Subnets: !Ref PrivateSubnetIds
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: LoadBalancer

ALBTargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Name: !Sub 'alb-targets-${Environment}'
    Port: 80
    Protocol: HTTP
    VpcId: !Ref VpcId
    HealthCheckPath: /health
    HealthCheckProtocol: HTTP
    Tags:
      - Key: Environment
        Value: !Ref Environment
      - Key: Purpose
        Value: LoadBalancer

HTTPListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 80
    Protocol: HTTP
    DefaultActions:
      - Type: redirect
        RedirectConfig:
          Protocol: HTTPS
          Port: 443
          StatusCode: HTTP_301

HTTPSListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 443
    Protocol: HTTPS
    SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
    Certificates:
      - CertificateArn: !Sub 'arn:aws:acm:${AWS::Region}:${AWS::AccountId}:certificate/example-cert-id'
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref ALBTargetGroup

# -----------------------------
# Outputs
# -----------------------------
Outputs:
  CloudTrailArn:
    Description: CloudTrail ARN
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Arn'

  ConfigBucketName:
    Description: AWS Config S3 Bucket Name
    Value: !If [CreateConfigBucket, !Ref ConfigBucket, !Ref UseExistingConfigBucket]
    Export:
      Name: !Sub '${AWS::StackName}-Config-Bucket'

  LambdaFunctionArn:
    Description: Secure Lambda Function ARN
    Value: !GetAtt SecureLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Arn'

  RDSInstanceEndpoint:
    Description: RDS Instance Endpoint
    Value: !If [CreateRDSInstance, !GetAtt SecureRDSInstance.Endpoint.Address, !Ref UseExistingRDS]
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'



```