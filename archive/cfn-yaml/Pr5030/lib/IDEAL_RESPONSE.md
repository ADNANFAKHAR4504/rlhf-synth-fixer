```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Secure AWS Foundation - Single Stack with WAF, KMS, S3, Lambda, API Gateway (lint/runtime + delete-path fixes)"

Parameters:
  ProjectPrefix:
    Type: String
    Default: "secfnd"
    Description: Project prefix for naming
    MinLength: 3
    MaxLength: 10

  Environment:
    Type: String
    Default: "prod"
    AllowedValues: ["dev", "staging", "prod"]
    Description: Environment name

  AllowedCIDR:
    Type: String
    Default: "10.0.0.0/8"
    Description: CIDR block allowed for internal traffic

  CentralLogBucketNameParam:
    Type: String
    Default: ""
    Description: Central logging bucket name (auto-generated if empty)

  KmsKeyAliasParam:
    Type: String
    Default: "app-encryption-key"
    Description: KMS key alias

  EnableWAF:
    Type: String
    Default: "true"
    AllowedValues: ["true", "false"]
    Description: Enable WAF protection

  OwnerTag:
    Type: String
    Default: "platform-team"
    Description: Owner tag value

  CostCenterTag:
    Type: String
    Default: "engineering"
    Description: Cost center tag value

Conditions:
  CreateWAF: !Equals [!Ref EnableWAF, "true"]
  GenerateCentralLogBucket: !Equals [!Ref CentralLogBucketNameParam, ""]

Mappings:
  SubnetConfig:
    VPC:
      CIDR: "10.0.0.0/16"
    PublicSubnetAZ1:
      CIDR: "10.0.1.0/24"
    PublicSubnetAZ2:
      CIDR: "10.0.2.0/24"
    PublicSubnetAZ3:
      CIDR: "10.0.3.0/24"
    PrivateSubnetAZ1:
      CIDR: "10.0.11.0/24"
    PrivateSubnetAZ2:
      CIDR: "10.0.12.0/24"
    PrivateSubnetAZ3:
      CIDR: "10.0.13.0/24"

Resources:
  # ===== NETWORKING =====
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-vpc"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # Public Subnets
  PublicSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetAZ1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-public-az1"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PublicSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetAZ2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-public-az2"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PublicSubnetAZ3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs ""]
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetAZ3, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-public-az3"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # Private Subnets
  PrivateSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetAZ1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-private-az1"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PrivateSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetAZ2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-private-az2"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PrivateSubnetAZ3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs ""]
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetAZ3, CIDR]
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-private-az3"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-igw"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # NACLs - strict but functional
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-public-nacl"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PublicNaclEntryInHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange: { From: 80, To: 80 }

  PublicNaclEntryInHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange: { From: 443, To: 443 }

  PublicNaclEntryInEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 200
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange: { From: 1024, To: 65535 }

  PublicNaclEntryOutHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true
      PortRange: { From: 80, To: 80 }

  PublicNaclEntryOutHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true
      PortRange: { From: 443, To: 443 }

  PublicNaclEntryOutEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 200
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true
      PortRange: { From: 1024, To: 65535 }

  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-private-nacl"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # --- W2001 fix: use AllowedCIDR ---
  PrivateNaclEntryInVPC:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref AllowedCIDR

  PrivateNaclEntryOutVPC:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref AllowedCIDR
      Egress: true

  PrivateNaclEntryOutHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 200
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true
      PortRange: { From: 443, To: 443 }

  PublicSubnetAZ1NaclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnetAZ1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnetAZ2NaclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnetAZ2
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnetAZ3NaclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnetAZ3
      NetworkAclId: !Ref PublicNetworkAcl

  PrivateSubnetAZ1NaclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetAZ1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnetAZ2NaclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetAZ2
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnetAZ3NaclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetAZ3
      NetworkAclId: !Ref PrivateNetworkAcl

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${ProjectPrefix}-${Environment}-public-rt"
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetAZ1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetAZ1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetAZ2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetAZ2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetAZ3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetAZ3
      RouteTableId: !Ref PublicRouteTable

  # ===== S3 CENTRAL LOGGING BUCKET =====
  CentralLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - GenerateCentralLogBucket
        - !Sub "${ProjectPrefix}-${Environment}-central-logs-${AWS::AccountId}"
        - !Ref CentralLogBucketNameParam
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault: { SSEAlgorithm: AES256 }
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  CentralLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CentralLogBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: s3:GetBucketAcl
            Resource: !GetAtt CentralLogBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: s3:PutObject
            Resource: !Sub "${CentralLogBucket.Arn}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"
          - Sid: S3ServerAccessLogsPolicy
            Effect: Allow
            Principal: { Service: logging.s3.amazonaws.com }
            Action: s3:PutObject
            Resource: !Sub "${CentralLogBucket.Arn}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"

  # ===== CUSTOM RESOURCE LAMBDA =====
  CustomResourceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Ref CustomResourceManagedPolicy
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  CustomResourceManagedPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: "*"
          - Effect: Allow
            Action:
              - kms:CreateKey
              - kms:CreateAlias
              - kms:UpdateAlias
              - kms:DescribeKey
              - kms:PutKeyPolicy
              - kms:EnableKey
              - kms:ListAliases
            Resource: "*"
          - Effect: Allow
            Action:
              - s3:CreateBucket
              - s3:PutBucketPolicy
              - s3:DeleteBucketPolicy
              - s3:PutEncryptionConfiguration # <-- renamed for W3037
              - s3:PutBucketVersioning
              - s3:PutBucketLogging
              - s3:PutBucketPublicAccessBlock
              - s3:GetBucketLocation
              - s3:GetEncryptionConfiguration # <-- renamed for W3037
              - s3:GetBucketVersioning
              - s3:ListAllMyBuckets
              - s3:ListBucket
              - s3:ListBucketVersions
              - s3:ListBucketMultipartUploads
              - s3:DeleteBucket
              - s3:DeleteObject
              - s3:DeleteObjectVersion
              - s3:AbortMultipartUpload
            Resource: "*"

  CustomResourceLambda:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt CustomResourceRole.Arn
      Timeout: 300
      Environment:
        Variables:
          LOG_LEVEL: INFO
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import traceback
          import time
          import urllib.request
          from botocore.exceptions import ClientError

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def _send(event, context, status, data, physical_id):
              response_url = event['ResponseURL']
              body = {
                  "Status": status,
                  "Reason": f"See CloudWatch Logs: {getattr(context, 'log_stream_name', 'n/a')}",
                  "PhysicalResourceId": physical_id or getattr(context, 'log_stream_name', 'n/a'),
                  "StackId": event["StackId"],
                  "RequestId": event["RequestId"],
                  "LogicalResourceId": event["LogicalResourceId"],
                  "NoEcho": False,
                  "Data": data or {}
              }
              encoded = json.dumps(body).encode("utf-8")
              req = urllib.request.Request(response_url, data=encoded, method="PUT")
              req.add_header("content-type", "")
              req.add_header("content-length", str(len(encoded)))
              with urllib.request.urlopen(req) as resp:
                  logger.info(f"cfn_resp_status={resp.status}")

          def handler(event, context):
              request_type = event['RequestType']
              physical_id = event.get('PhysicalResourceId', 'custom-s3-kms-resource')

              logger.info(json.dumps({
                  'request_id': getattr(context, 'aws_request_id', None),
                  'event_type': request_type,
                  'event_snapshot': event
              }))

              try:
                  props = event['ResourceProperties']
                  bucket_name = props['BucketName']
                  kms_alias = props['KmsAlias']
                  log_bucket = props['LogBucket']

                  if request_type in ('Create', 'Update'):
                      result = create_or_update_resources(bucket_name, kms_alias, log_bucket)
                      _send(event, context, "SUCCESS", result, physical_id)
                  elif request_type == 'Delete':
                      result = delete_resources(bucket_name)
                      _send(event, context, "SUCCESS", result, physical_id)
                  else:
                      _send(event, context, "SUCCESS", {}, physical_id)

              except Exception as e:
                  logger.error(json.dumps({
                      'request_id': getattr(context, 'aws_request_id', None),
                      'error': str(e),
                      'stack_trace': traceback.format_exc()
                  }))
                  _send(event, context, "FAILED", {}, physical_id)

          def create_or_update_resources(bucket_name, kms_alias, log_bucket):
              kms = boto3.client('kms')
              s3 = boto3.client('s3')
              sts = boto3.client('sts')
              region = boto3.session.Session().region_name
              account = sts.get_caller_identity()['Account']

              key_id = get_or_create_kms_key(kms, kms_alias, account)

              # Create bucket if needed
              try:
                  params = {'Bucket': bucket_name}
                  if region != 'us-east-1':
                      params['CreateBucketConfiguration'] = {'LocationConstraint': region}
                  s3.create_bucket(**params)
                  logger.info(f"Created bucket {bucket_name}")
              except ClientError as e:
                  code = e.response['Error']['Code']
                  if code in ('BucketAlreadyOwnedByYou', 'BucketAlreadyExists'):
                      logger.info(f"Bucket {bucket_name} exists or owned")
                  else:
                      raise

              # Versioning
              s3.put_bucket_versioning(
                  Bucket=bucket_name,
                  VersioningConfiguration={'Status': 'Enabled'}
              )

              # Default encryption SSE-KMS
              s3.put_bucket_encryption(
                  Bucket=bucket_name,
                  ServerSideEncryptionConfiguration={
                      'Rules': [{
                          'ApplyServerSideEncryptionByDefault': {
                              'SSEAlgorithm': 'aws:kms',
                              'KMSMasterKeyID': key_id
                          },
                          'BucketKeyEnabled': True
                      }]
                  }
              )

              # Block public access
              s3.put_public_access_block(
                  Bucket=bucket_name,
                  PublicAccessBlockConfiguration={
                      'BlockPublicAcls': True,
                      'BlockPublicPolicy': True,
                      'IgnorePublicAcls': True,
                      'RestrictPublicBuckets': True
                  }
              )

              # Server access logging to central bucket
              s3.put_bucket_logging(
                  Bucket=bucket_name,
                  BucketLoggingStatus={
                      'LoggingEnabled': {
                          'TargetBucket': log_bucket,
                          'TargetPrefix': f's3-access-logs/{bucket_name}/'
                      }
                  }
              )

              # Enforce encryption via bucket policy (scoped to this bucket)
              bucket_policy = {
                  "Version": "2012-10-17",
                  "Statement": [
                      {
                          "Sid": "DenyIncorrectEncryptionKey",
                          "Effect": "Deny",
                          "Principal": "*",
                          "Action": "s3:PutObject",
                          "Resource": f"arn:aws:s3:::{bucket_name}/*",
                          "Condition": {
                              "StringNotEquals": {
                                  "s3:x-amz-server-side-encryption-aws-kms-key-id": key_id
                              }
                          }
                      },
                      {
                          "Sid": "DenyUnEncryptedObjectUploads",
                          "Effect": "Deny",
                          "Principal": "*",
                          "Action": "s3:PutObject",
                          "Resource": f"arn:aws:s3:::{bucket_name}/*",
                          "Condition": {
                              "Null": {
                                  "s3:x-amz-server-side-encryption": "true"
                              }
                          }
                      }
                  ]
              }
              s3.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(bucket_policy))

              enc = s3.get_bucket_encryption(Bucket=bucket_name)
              return {
                  'BucketName': bucket_name,
                  'KmsKeyId': key_id,
                  'KmsKeyArn': f"arn:aws:kms:{region}:{account}:key/{key_id}",
                  'VersioningEnabled': 'true',
                  'DefaultEncryption': 'SSE-KMS',
                  'EncryptionKeyId': enc['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault'].get('KMSMasterKeyID', 'N/A')
              }

          def get_or_create_kms_key(kms, alias_name, account):
              full_alias = f"alias/{alias_name}"
              try:
                  resp = kms.describe_key(KeyId=full_alias)
                  return resp['KeyMetadata']['KeyId']
              except ClientError as e:
                  if e.response['Error']['Code'] != 'NotFoundException':
                      raise

              key_policy = {
                  "Version": "2012-10-17",
                  "Statement": [
                      {
                          "Sid": "EnableRootPermissions",
                          "Effect": "Allow",
                          "Principal": {"AWS": f"arn:aws:iam::{account}:root"},
                          "Action": "kms:*",
                          "Resource": "*"
                      },
                      {
                          "Sid": "AllowS3ServiceUse",
                          "Effect": "Allow",
                          "Principal": {"Service": "s3.amazonaws.com"},
                          "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
                          "Resource": "*"
                      }
                  ]
              }
              resp = kms.create_key(
                  Description=f'KMS key for {alias_name}',
                  KeyUsage='ENCRYPT_DECRYPT',
                  Origin='AWS_KMS',
                  Policy=json.dumps(key_policy)
              )
              key_id = resp['KeyMetadata']['KeyId']
              kms.create_alias(AliasName=full_alias, TargetKeyId=key_id)
              return key_id

          def delete_resources(bucket_name):
              s3 = boto3.client('s3')

              # 1) Remove policy & disable logging (best-effort)
              try:
                  s3.delete_bucket_policy(Bucket=bucket_name)
                  logger.info("Deleted bucket policy")
              except ClientError as e:
                  if e.response['Error']['Code'] not in ('NoSuchBucket', 'NoSuchBucketPolicy', 'NoSuchBucketPolicyExists'):
                      logger.warning(f"delete_bucket_policy warning: {e}")

              try:
                  s3.put_bucket_logging(Bucket=bucket_name, BucketLoggingStatus={})
                  logger.info("Disabled bucket logging")
              except ClientError as e:
                  if e.response['Error']['Code'] != 'NoSuchBucket':
                      logger.warning(f"disable logging warning: {e}")

              # 2) Determine versioning status
              versioning_status = None
              try:
                  vr = s3.get_bucket_versioning(Bucket=bucket_name)
                  versioning_status = vr.get('Status')
              except ClientError as e:
                  if e.response['Error']['Code'] == 'NoSuchBucket':
                      return {'Status': 'Absent'}
                  logger.warning(f"get_bucket_versioning warning: {e}")

              # 3) Abort multipart uploads
              try:
                  mp = s3.list_multipart_uploads(Bucket=bucket_name)
                  uploads = mp.get('Uploads', [])
                  while uploads:
                      for u in uploads:
                          try:
                              s3.abort_multipart_upload(Bucket=bucket_name, Key=u['Key'], UploadId=u['UploadId'])
                          except ClientError as e:
                              logger.warning(f"abort MPU {u['Key']} warn: {e}")
                      if mp.get('IsTruncated'):
                          mp = s3.list_multipart_uploads(
                              Bucket=bucket_name,
                              KeyMarker=mp.get('NextKeyMarker'),
                              UploadIdMarker=mp.get('NextUploadIdMarker')
                          )
                          uploads = mp.get('Uploads', [])
                      else:
                          break
              except ClientError as e:
                  if e.response['Error']['Code'] not in ('NoSuchUpload', 'NoSuchBucket', 'MethodNotAllowed'):
                      logger.warning(f"list/abort MPU warning: {e}")

              # 4) Delete objects (versioned or not)
              def _batch_delete(objs):
                  if not objs:
                      return
                  s3.delete_objects(Bucket=bucket_name, Delete={'Objects': objs})

              try:
                  if versioning_status in ('Enabled', 'Suspended'):
                      paginator = s3.get_paginator('list_object_versions')
                      for page in paginator.paginate(Bucket=bucket_name):
                          objs = []
                          for v in page.get('Versions', []):
                              objs.append({'Key': v['Key'], 'VersionId': v['VersionId']})
                              if len(objs) == 1000:
                                  _batch_delete(objs); objs = []
                          for m in page.get('DeleteMarkers', []):
                              objs.append({'Key': m['Key'], 'VersionId': m['VersionId']})
                              if len(objs) == 1000:
                                  _batch_delete(objs); objs = []
                          _batch_delete(objs)
                  else:
                      paginator = s3.get_paginator('list_objects_v2')
                      for page in paginator.paginate(Bucket=bucket_name):
                          objs = [{'Key': o['Key']} for o in page.get('Contents', [])]
                          while objs:
                              _batch_delete(objs[:1000])
                              objs = objs[1000:]
              except ClientError as e:
                  if e.response['Error']['Code'] == 'NoSuchBucket':
                      return {'Status': 'Absent'}
                  logger.warning(f"object deletion warning: {e}")

              # 5) Retry delete bucket with backoff
              for attempt in range(7):
                  try:
                      s3.delete_bucket(Bucket=bucket_name)
                      logger.info(f"Deleted bucket {bucket_name}")
                      return {'Status': 'Deleted'}
                  except ClientError as e:
                      code = e.response['Error']['Code']
                      if code in ('NoSuchBucket'):
                          return {'Status': 'Absent'}
                      if code in ('BucketNotEmpty', 'OperationAborted', 'InternalError'):
                          sleep = min(2 ** attempt, 30)
                          logger.info(f"Retry delete bucket (attempt {attempt+1}) due to {code}; sleeping {sleep}s")
                          time.sleep(sleep)
                          continue
                      raise

              return {'Status': 'DeleteAttemptedButBucketMayRemain'}
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  S3KMSResource:
    Type: Custom::S3KMSResource
    Properties:
      ServiceToken: !GetAtt CustomResourceLambda.Arn
      BucketName: !Sub "${ProjectPrefix}-${Environment}-app-bucket-${AWS::AccountId}"
      KmsAlias: !Ref KmsKeyAliasParam
      LogBucket: !Ref CentralLogBucket

  # ===== APPLICATION LAMBDA =====
  AppLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Ref AppLambdaManagedPolicy
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  AppLambdaManagedPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: "*"
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:PutObject
            Resource: "*"
          - Effect: Allow
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: "*"
            Condition:
              StringEquals:
                "kms:ViaService": !Sub "s3.${AWS::Region}.amazonaws.com"

  AppLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${ProjectPrefix}-${Environment}-app"
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt AppLambdaRole.Arn
      Timeout: 30
      Environment:
        Variables:
          BUCKET_NAME:
            Fn::GetAtt: [S3KMSResource, BucketName]
          KMS_KEY_ID:
            Fn::GetAtt: [S3KMSResource, KmsKeyId]
      Code:
        ZipFile: |
          import json
          import logging
          import traceback
          import os

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def handler(event, context):
              try:
                  logger.info(json.dumps({
                      'request_id': getattr(context, 'aws_request_id', None),
                      'function_name': getattr(context, 'function_name', None),
                      'event_snapshot': event
                  }))
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'X-Request-Id': getattr(context, 'aws_request_id', '')
                      },
                      'body': json.dumps({
                          'message': 'Hello from secure Lambda!',
                          'bucket': os.environ.get('BUCKET_NAME'),
                          'request_id': getattr(context, 'aws_request_id', '')
                      })
                  }
              except Exception as e:
                  logger.error(json.dumps({
                      'request_id': getattr(context, 'aws_request_id', None),
                      'error': str(e),
                      'error_type': type(e).__name__,
                      'stack_trace': traceback.format_exc(),
                      'event_snapshot': event
                  }))
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'X-Request-Id': getattr(context, 'aws_request_id', '')
                      },
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'request_id': getattr(context, 'aws_request_id', '')
                      })
                  }
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # ===== API GATEWAY =====
  ApiGatewayRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "${ProjectPrefix}-${Environment}-api"
      Description: Secure API Gateway
      EndpointConfiguration: { Types: [REGIONAL] }
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId: !GetAtt ApiGatewayRestApi.RootResourceId
      PathPart: app
      RestApiId: !Ref ApiGatewayRestApi

  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${AppLambda.Arn}/invocations"

  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiGatewayMethod
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      Description: Production deployment

  ApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: !Ref Environment
      RestApiId: !Ref ApiGatewayRestApi
      DeploymentId: !Ref ApiGatewayDeployment
      MethodSettings:
        - ResourcePath: "/*"
          HttpMethod: "*"
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  ApiGatewayLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref AppLambda
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*"

  # ===== WAF =====
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Condition: CreateWAF
    Properties:
      Name: !Sub "${ProjectPrefix}-${Environment}-waf"
      Scope: REGIONAL
      DefaultAction: { Allow: {} }
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub "${ProjectPrefix}-${Environment}-waf-metric"
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action: { Block: {} }
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction: { None: {} }
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Condition: CreateWAF
    Properties:
      WebACLArn: !GetAtt WAFWebACL.Arn
      # Implicit dependency via Refs (avoids W3005)
      ResourceArn: !Sub "arn:aws:apigateway:${AWS::Region}::/restapis/${ApiGatewayRestApi}/stages/${ApiGatewayStage}"

  # ===== CLOUDTRAIL =====
  TrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/cloudtrail/${ProjectPrefix}-${Environment}"
      RetentionInDays: 30

  TrailLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt TrailLogGroup.Arn

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CentralLogBucketPolicy
    Properties:
      TrailName: !Sub "${ProjectPrefix}-${Environment}-trail"
      S3BucketName: !Ref CentralLogBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
      CloudWatchLogsLogGroupArn: !GetAtt TrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt TrailLogRole.Arn
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  # ===== CLOUDWATCH (Metric Filters & Alarms) =====
  IamAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "${ProjectPrefix}-${Environment}-iam-alarms"
      DisplayName: IAM Security Alarms
      Tags:
        - Key: Project
          Value: !Ref ProjectPrefix
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag

  CreateUserMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: CreateUser
      FilterPattern: "{ ($.eventName = CreateUser) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: CreateUserCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  DeleteUserMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: DeleteUser
      FilterPattern: "{ ($.eventName = DeleteUser) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: DeleteUserCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  CreateRoleMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: CreateRole
      FilterPattern: "{ ($.eventName = CreateRole) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: CreateRoleCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  DeleteRoleMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: DeleteRole
      FilterPattern: "{ ($.eventName = DeleteRole) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: DeleteRoleCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  AttachRolePolicyMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: AttachRolePolicy
      FilterPattern: "{ ($.eventName = AttachRolePolicy) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: AttachRolePolicyCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  DetachRolePolicyMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: DetachRolePolicy
      FilterPattern: "{ ($.eventName = DetachRolePolicy) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: DetachRolePolicyCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  PutRolePolicyMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: PutRolePolicy
      FilterPattern: "{ ($.eventName = PutRolePolicy) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: PutRolePolicyCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  PutUserPolicyMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: PutUserPolicy
      FilterPattern: "{ ($.eventName = PutUserPolicy) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: PutUserPolicyCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  CreateAccessKeyMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: CreateAccessKey
      FilterPattern: "{ ($.eventName = CreateAccessKey) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: CreateAccessKeyCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  DeleteAccessKeyMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: DeleteAccessKey
      FilterPattern: "{ ($.eventName = DeleteAccessKey) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: DeleteAccessKeyCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  UpdateLoginProfileMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: UpdateLoginProfile
      FilterPattern: "{ ($.eventName = UpdateLoginProfile) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: UpdateLoginProfileCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  DeleteLoginProfileMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: DeleteLoginProfile
      FilterPattern: "{ ($.eventName = DeleteLoginProfile) }"
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: DeleteLoginProfileCount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  ConsoleLoginNoMFAMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: ConsoleLoginNoMFA
      FilterPattern: '{ ($.eventName = ConsoleLogin) && ($.additionalEventData.MFAUsed = "No") }'
      LogGroupName: !Ref TrailLogGroup
      MetricTransformations:
        - MetricName: ConsoleLoginNoMFACount
          MetricNamespace: !Sub "${ProjectPrefix}/IAM"
          MetricValue: "1"

  # Alarms
  CreateUserAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectPrefix}-${Environment}-CreateUser"
      AlarmDescription: Alert on IAM user creation
      MetricName: CreateUserCount
      Namespace: !Sub "${ProjectPrefix}/IAM"
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [!Ref IamAlarmTopic]

  DeleteUserAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectPrefix}-${Environment}-DeleteUser"
      AlarmDescription: Alert on IAM user deletion
      MetricName: DeleteUserCount
      Namespace: !Sub "${ProjectPrefix}/IAM"
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [!Ref IamAlarmTopic]

  CreateRoleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectPrefix}-${Environment}-CreateRole"
      AlarmDescription: Alert on IAM role creation
      MetricName: CreateRoleCount
      Namespace: !Sub "${ProjectPrefix}/IAM"
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [!Ref IamAlarmTopic]

  AttachRolePolicyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectPrefix}-${Environment}-AttachRolePolicy"
      AlarmDescription: Alert on role policy attachment
      MetricName: AttachRolePolicyCount
      Namespace: !Sub "${ProjectPrefix}/IAM"
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [!Ref IamAlarmTopic]

  ConsoleLoginNoMFAAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectPrefix}-${Environment}-ConsoleLoginNoMFA"
      AlarmDescription: Alert on console login without MFA
      MetricName: ConsoleLoginNoMFACount
      Namespace: !Sub "${ProjectPrefix}/IAM"
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [!Ref IamAlarmTopic]

Outputs:
  ApplicationBucketName:
    Description: Application S3 bucket name
    Value:
      Fn::GetAtt: [S3KMSResource, BucketName]

  CentralLogBucketName:
    Description: Central logging bucket name
    Value: !Ref CentralLogBucket

  KmsKeyArn:
    Description: KMS key ARN for application bucket encryption
    Value:
      Fn::GetAtt: [S3KMSResource, KmsKeyArn]

  ApiGatewayInvokeUrl:
    Description: API Gateway invoke URL
    Value: !Sub "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/app"

  WafWebAclArn:
    Description: WAF WebACL ARN
    Value: !If [CreateWAF, !GetAtt WAFWebACL.Arn, "WAF not enabled"]

  TrailName:
    Description: CloudTrail name
    Value: !Ref CloudTrail

  TrailLogGroupName:
    Description: CloudTrail log group name
    Value: !Ref TrailLogGroup

  IamEventAlarmArns:
    Description: List of IAM event alarm ARNs
    Value: !Join
      - ","
      - - !GetAtt CreateUserAlarm.Arn
        - !GetAtt DeleteUserAlarm.Arn
        - !GetAtt CreateRoleAlarm.Arn
        - !GetAtt AttachRolePolicyAlarm.Arn
        - !GetAtt ConsoleLoginNoMFAAlarm.Arn

  VpcId:
    Description: VPC ID
    Value: !Ref VPC

  SubnetIdsAZ1:
    Description: Subnet IDs for AZ1
    Value: !Join [",", [!Ref PublicSubnetAZ1, !Ref PrivateSubnetAZ1]]

  SubnetIdsAZ2:
    Description: Subnet IDs for AZ2
    Value: !Join [",", [!Ref PublicSubnetAZ2, !Ref PrivateSubnetAZ2]]

  SubnetIdsAZ3:
    Description: Subnet IDs for AZ3
    Value: !Join [",", [!Ref PublicSubnetAZ3, !Ref PrivateSubnetAZ3]]

  NaclIds:
    Description: Network ACL IDs
    Value: !Join [",", [!Ref PublicNetworkAcl, !Ref PrivateNetworkAcl]]

  BucketVersioningStatus:
    Description: Versioning status for all buckets
    Value:
      Fn::Sub:
        - "CentralLogBucket=Enabled, AppBucket=${VE}"
        - { VE: { "Fn::GetAtt": [S3KMSResource, VersioningEnabled] } }

  DefaultSSEKMSStatus:
    Description: Default SSE-KMS encryption status
    Value:
      Fn::Sub:
        - "AppBucket=${DE} with KeyId=${EK}"
        - {
            DE: { "Fn::GetAtt": [S3KMSResource, DefaultEncryption] },
            EK: { "Fn::GetAtt": [S3KMSResource, EncryptionKeyId] },
          }
```