# ideal_response

## Summary

We diagnosed repeated `CREATE_FAILED` errors for the CloudTrail resource. Root cause was a mismatch in the KMS key policy and an over-restrictive S3 bucket policy. Specifically, CloudTrail writes to S3, and S3 is the service that calls KMS for SSE-KMS encryption. If the KMS key policy’s `kms:ViaService` is set to `cloudtrail.<region>.amazonaws.com` instead of `s3.<region>.amazonaws.com`, the first write fails. In addition, adding `aws:SourceArn` / `aws:SourceAccount` conditions to the CloudTrail bucket policy can block the initial probe/write in some environments.

## What changed

* **KMS key policy**

  * Principal remains `cloudtrail.amazonaws.com`.
  * Allowed actions limited to `kms:DescribeKey`, `kms:GenerateDataKey*`, `kms:Decrypt`.
  * `kms:ViaService` now correctly set to `s3.<region>.amazonaws.com`.
  * Encryption context relaxed to a safe wildcard: `arn:aws:cloudtrail:*:<account-id>:trail/*` so multi-region trails and creation sequencing don’t break.

* **S3 bucket policy for the CloudTrail bucket**

  * Kept only the two required statements:

    * Allow `cloudtrail.amazonaws.com` to `s3:GetBucketAcl` on the bucket.
    * Allow `cloudtrail.amazonaws.com` to `s3:PutObject` under `AWSLogs/<account-id>/*` **with** `s3:x-amz-acl = bucket-owner-full-control`.
  * Removed `aws:SourceArn` and `aws:SourceAccount` conditions that were intermittently blocking the first write.

* **CloudTrail resource**

  * Uses the **KMS key ARN** (not just the key ID).
  * Declares a dependency on the bucket policy so permissions exist before the service call.

* **RDS hardening for rollbacks**

  * `DeletionProtection` disabled to allow clean rollbacks.
  * Added snapshot policies (`DeletionPolicy` and `UpdateReplacePolicy` = `Snapshot`) so data is preserved without blocking stack deletion.

* **AMI handling**

  * Resolved via the public SSM parameter for AL2023 so no parameter is required and region mismatches don’t cause linter or plan errors.

## Why this works now

* The KMS policy now matches the real call path (S3 → KMS), so the encryption grant succeeds.
* The S3 policy is minimal and universal, preventing the “insufficient permissions” false negatives that occur when `SourceArn` headers aren’t present during the first write.
* CloudFormation can roll back without getting stuck on RDS.
* Template avoids brittle values (e.g., hardcoded AMIs), reducing non-deterministic failures.

## How to validate (conceptually)

* After the stack creates, confirm the trail is logging and delivering:

  * CloudTrail shows `IsLogging = true`.
  * New objects appear under `s3://<cloudtrail-bucket>/AWSLogs/<account-id>/CloudTrail/<region>/...`.
* KMS key shows grants being issued by S3 for CloudTrail context.
* API Gateway/Lambda respond with a simple pong at the `/ping` resource.
* RDS instance is private, encrypted, and has snapshots on replacement or delete.

## Lessons learned

* For CloudTrail with SSE-KMS, **S3 is the ViaService**, not CloudTrail.
* Start with the **minimum required** S3 bucket policy for CloudTrail; add extra conditions only when mandated by org policy and tested in your environment.
* Enable clean rollbacks for stateful services to avoid masking the original failure with `ROLLBACK_FAILED` noise.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: >
  TapStack.yml — secure environment (VPC, NAT, SGs, KMS, S3, CloudTrail, API GW, Lambda, RDS, IAM, Secrets, SSM).
  CloudTrail logs to KMS-encrypted S3 with robust KMS & bucket policies that work across org/account edge cases.

Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [prod, dev]
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
  PublicSubnet1Cidr:
    Type: String
    Default: 10.0.1.0/24
  PublicSubnet2Cidr:
    Type: String
    Default: 10.0.3.0/24
  PrivateSubnet1Cidr:
    Type: String
    Default: 10.0.2.0/24
  PrivateSubnet2Cidr:
    Type: String
    Default: 10.0.4.0/24
  AdminCIDR:
    Type: String
    Default: 203.0.113.0/24
    Description: CIDR allowed to SSH
  DBEngine:
    Type: String
    Default: mysql
    AllowedValues: [mysql, postgres]
  DBInstanceClass:
    Type: String
    Default: db.t3.medium
  DBAllocatedStorage:
    Type: Number
    Default: 20
  DBName:
    Type: String
    Default: tapstackdb
  DBAdminUser:
    Type: String
    Default: tapstack_admin
  LambdaRuntime:
    Type: String
    Default: python3.9
  LogRetentionDays:
    Type: Number
    Default: 90
  AmiId:
    Type: "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>"
    Default: "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"

Mappings:
  AZMap:
    us-east-1:
      AZ1: us-east-1a
      AZ2: us-east-1b
    eu-west-1:
      AZ1: eu-west-1a
      AZ2: eu-west-1b

Resources:

  ########################
  # KMS key — S3 is the via-service; wildcard the trail ARN in the encryption context
  ########################
  TapStackKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "TapStack ${Environment} KMS key – encrypt S3, RDS, CloudTrail, Lambda env"
      EnableKeyRotation: true
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: AllowRootAccountFullAccess
            Effect: Allow
            Principal:
              AWS: !Sub "arn:${AWS::Partition}:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"

          # Official CloudTrail SSE-KMS pattern
          - Sid: AllowCloudTrailUseOfTheKey
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:DescribeKey
              - kms:GenerateDataKey*
              - kms:Decrypt
            Resource: "*"
            Condition:
              StringEquals:
                kms:ViaService: !Sub "s3.${AWS::Region}.amazonaws.com"
              StringLike:
                kms:EncryptionContext:aws:cloudtrail:arn: !Sub "arn:${AWS::Partition}:cloudtrail:*:${AWS::AccountId}:trail/*"

  TapStackKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${Environment}-tapstack-key"
      TargetKeyId: !Ref TapStackKmsKey

  ########################
  # S3 buckets (SSE-KMS, block public, versioning, access logging)
  ########################
  TapStackLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${Environment}-tapstack-log-bucket-${AWS::AccountId}-${AWS::Region}"
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKmsKey

  TapStackCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${Environment}-tapstack-cloudtrail-${AWS::AccountId}-${AWS::Region}"
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKmsKey
      LoggingConfiguration:
        DestinationBucketName: !Ref TapStackLogBucket
        LogFilePrefix: cloudtrail-access-logs/

  TapStackAppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${Environment}-tapstack-app-${AWS::AccountId}-${AWS::Region}"
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref TapStackKmsKey
      LoggingConfiguration:
        DestinationBucketName: !Ref TapStackLogBucket
        LogFilePrefix: app-bucket-access-logs/

  ########################
  # S3 bucket policy for CloudTrail — minimal, robust
  ########################
  TapStackCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TapStackCloudTrailBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AllowCloudTrailGetBucketAcl
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "arn:${AWS::Partition}:s3:::${TapStackCloudTrailBucket}"

          - Sid: AllowCloudTrailPutObject
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "arn:${AWS::Partition}:s3:::${TapStackCloudTrailBucket}/AWSLogs/${AWS::AccountId}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: "bucket-owner-full-control"

  ########################
  # VPC, Subnets, IGW, NATs, RouteTables (2 AZs)
  ########################
  TapStackVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-vpc" } ]

  TapStackInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-igw" } ]

  TapStackIGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref TapStackVPC
      InternetGatewayId: !Ref TapStackInternetGateway

  NatEIP1:
    Type: AWS::EC2::EIP
    DependsOn: TapStackIGWAttachment
    Properties: { Domain: vpc }

  NatEIP2:
    Type: AWS::EC2::EIP
    DependsOn: TapStackIGWAttachment
    Properties: { Domain: vpc }

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !FindInMap [ AZMap, !Ref "AWS::Region", AZ1 ]
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-public-1" } ]

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !FindInMap [ AZMap, !Ref "AWS::Region", AZ2 ]
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-public-2" } ]

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !FindInMap [ AZMap, !Ref "AWS::Region", AZ1 ]
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-private-1" } ]

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TapStackVPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !FindInMap [ AZMap, !Ref "AWS::Region", AZ2 ]
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-private-2" } ]

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapStackVPC
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-public-rt" } ]

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: TapStackIGWAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref TapStackInternetGateway

  PublicSubnet1RouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  TapStackNatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-nat-1" } ]

  TapStackNatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-nat-2" } ]

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapStackVPC
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-private-rt-1" } ]

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref TapStackNatGateway1

  PrivateSubnet1RouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TapStackVPC
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-private-rt-2" } ]

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref TapStackNatGateway2

  PrivateSubnet2RouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  ########################
  # Security Groups
  ########################
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: SSH from admin CIDR
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AdminCIDR
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-bastion-sg" } ]

  PrivateInstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Internal instances SG
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-private-sg" } ]

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Lambda VPC SG
      VpcId: !Ref TapStackVPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-lambda-sg" } ]

  RdsSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: RDS SG (allow app & lambda)
      VpcId: !Ref TapStackVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref PrivateInstanceSecurityGroup
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref PrivateInstanceSecurityGroup
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-rds-sg" } ]

  ########################
  # IAM: EC2 Role & Instance Profile
  ########################
  TapStackEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${Environment}-TapStack-EC2Role"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: [ ec2.amazonaws.com ] }
            Action: [ sts:AssumeRole ]
      Path: "/"
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: EC2AccessToS3AndSecrets
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action: [ s3:GetObject, s3:PutObject ]
                Resource:
                  - !Sub "arn:${AWS::Partition}:s3:::${Environment}-tapstack-app-${AWS::AccountId}-${AWS::Region}/*"
              - Effect: Allow
                Action: [ secretsmanager:GetSecretValue ]
                Resource: [ !Ref DBCredentialsSecret ]
              - Effect: Allow
                Action: [ kms:Decrypt ]
                Resource:
                  - !Sub "arn:${AWS::Partition}:kms:${AWS::Region}:${AWS::AccountId}:key/${TapStackKmsKey}"

  TapStackInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${Environment}-TapStack-InstanceProfile"
      Roles: [ !Ref TapStackEC2Role ]

  ########################
  # IAM: Lambda Role (least privilege)
  ########################
  TapStackLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${Environment}-TapStack-LambdaRole"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: [ lambda.amazonaws.com ] }
            Action: [ sts:AssumeRole ]
      Path: "/"
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaLeastPriv
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Sid: AllowLambdaLogsWrite
                Effect: Allow
                Action: [ logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents ]
                Resource: !Sub "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Environment}-tapstack-handler:*"
              - Sid: AllowSecretsManagerRead
                Effect: Allow
                Action: [ secretsmanager:GetSecretValue ]
                Resource: [ !Ref DBCredentialsSecret ]
              - Sid: AllowRdsDescribe
                Effect: Allow
                Action: [ rds:DescribeDBInstances ]
                Resource: "*"
              - Sid: AllowKmsUse
                Effect: Allow
                Action: [ kms:Decrypt, kms:GenerateDataKey ]
                Resource:
                  - !Sub "arn:${AWS::Partition}:kms:${AWS::Region}:${AWS::AccountId}:key/${TapStackKmsKey}"

  ########################
  # IAM: MFA-enforce managed policy + admin group
  ########################
  RequireMFAForConsolePolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub "${Environment}-RequireMFAForConsoleAccess"
      Description: "Deny actions unless MFA is present."
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyIfNoMFA
            Effect: Deny
            Action: "*"
            Resource: "*"
            Condition: { Bool: { aws:MultiFactorAuthPresent: "false" } }

  TapStackAdminGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub "${Environment}-TapStack-Admins"
      ManagedPolicyArns:
        - !Ref RequireMFAForConsolePolicy
        - arn:aws:iam::aws:policy/AdministratorAccess

  ########################
  # Secrets Manager: DB credentials (encrypted by KMS)
  ########################
  DBCredentialsSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "${Environment}/tapstack/db/credentials"
      Description: RDS master credentials for TapStack
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DBAdminUser}","dbname":"${DBName}"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\\'
      KmsKeyId: !Ref TapStackKmsKey

  ########################
  # RDS (private, encrypted) — safe rollback
  ########################
  TapStackDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub "${Environment} TapStack DB subnet group"
      SubnetIds: [ !Ref PrivateSubnet1, !Ref PrivateSubnet2 ]
      DBSubnetGroupName: !Sub "${Environment}-tapstack-db-subnet-group"

  TapStackDBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub "${Environment}-tapstack-db"
      AllocatedStorage: !Ref DBAllocatedStorage
      DBInstanceClass: !Ref DBInstanceClass
      Engine: !Ref DBEngine
      DBName: !Ref DBName
      MasterUsername: !Join ['', [ "{{resolve:secretsmanager:", !Ref DBCredentialsSecret, ":SecretString:username}}" ]]
      MasterUserPassword: !Join ['', [ "{{resolve:secretsmanager:", !Ref DBCredentialsSecret, ":SecretString:password}}" ]]
      VPCSecurityGroups: [ !Ref RdsSecurityGroup ]
      DBSubnetGroupName: !Ref TapStackDBSubnetGroup
      PubliclyAccessible: false
      StorageEncrypted: true
      KmsKeyId: !Ref TapStackKmsKey
      BackupRetentionPeriod: 7
      DeletionProtection: false

  ########################
  # API Gateway + logging (/ping -> Lambda)
  ########################
  TapStackApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/apigateway/${Environment}-tapstack-api-logs"
      RetentionInDays: !Ref LogRetentionDays

  ApiGatewayCloudWatchLogsPolicy:
    Type: AWS::Logs::ResourcePolicy
    Properties:
      PolicyName: !Sub "${Environment}-apigateway-logs-policy"
      PolicyDocument: !Sub |
        {
          "Version":"2012-10-17",
          "Statement":[
            {
              "Sid":"AllowAPIGatewayToPutLogs",
              "Effect":"Allow",
              "Principal": { "Service": "apigateway.amazonaws.com" },
              "Action":["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
              "Resource":"arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/apigateway/${Environment}-tapstack-api-logs:*"
            }
          ]
        }

  TapStackRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub "${Environment}-tapstack-api"
      EndpointConfiguration: { Types: [ REGIONAL ] }

  TapStackApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref TapStackRestApi
      ParentId: !GetAtt TapStackRestApi.RootResourceId
      PathPart: ping

  TapStackLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${Environment}-tapstack-handler"
      Handler: handler.lambda_handler
      Runtime: !Ref LambdaRuntime
      Role: !GetAtt TapStackLambdaRole.Arn
      KmsKeyArn: !GetAtt TapStackKmsKey.Arn
      VpcConfig:
        SubnetIds: [ !Ref PrivateSubnet1, !Ref PrivateSubnet2 ]
        SecurityGroupIds: [ !Ref LambdaSecurityGroup ]
      Environment:
        Variables:
          DB_SECRET_ARN: !Ref DBCredentialsSecret
          ENV: !Ref Environment
      Code:
        ZipFile: |
          def lambda_handler(event, context):
              return {
                  "statusCode": 200,
                  "body": "pong",
                  "headers": {"Content-Type": "text/plain"}
              }

  TapStackApiMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref TapStackRestApi
      ResourceId: !Ref TapStackApiResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${TapStackLambdaFunction.Arn}/invocations"

  TapStackLambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref TapStackLambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${TapStackRestApi}/*/*/ping"

  TapStackApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: [ TapStackApiMethod ]
    Properties:
      RestApiId: !Ref TapStackRestApi

  TapStackApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: prod
      RestApiId: !Ref TapStackRestApi
      DeploymentId: !Ref TapStackApiDeployment
      AccessLogSetting:
        DestinationArn: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/apigateway/${Environment}-tapstack-api-logs"
        Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","caller":"$context.identity.caller","user":"$context.identity.user","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status","protocol":"$context.protocol"}'
      MethodSettings:
        - ResourcePath: "/*"
          HttpMethod: "*"
          LoggingLevel: INFO
          DataTraceEnabled: true

  ########################
  # Optional EC2 Instance (AMI via SSM param)
  ########################
  TapStackPrivateInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: !Ref AmiId
      SubnetId: !Ref PrivateSubnet1
      IamInstanceProfile: !Ref TapStackInstanceProfile
      SecurityGroupIds: [ !Ref PrivateInstanceSecurityGroup ]
      Tags: [ { Key: Name, Value: !Sub "${Environment}-tapstack-private-instance" } ]

  ########################
  # CloudTrail (multi-region) — after bucket policy
  ########################
  TapStackCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - TapStackCloudTrailBucketPolicy
    Properties:
      TrailName: !Sub "${Environment}-tapstack-cloudtrail"
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      S3BucketName: !Ref TapStackCloudTrailBucket
      KMSKeyId: !GetAtt TapStackKmsKey.Arn
      IsOrganizationTrail: false
      IsLogging: true

  ########################
  # SSM Parameter
  ########################
  TapStackConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/${Environment}/tapstack/config"
      Type: String
      Value: !Sub "created-by=cfn;env=${Environment}"

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref TapStackVPC
    Export: { Name: !Sub "${Environment}-TapStack-VpcId" }

  PublicSubnetIds:
    Description: Public subnet IDs
    Value: !Join [ ",", [ !Ref PublicSubnet1, !Ref PublicSubnet2 ] ]
    Export: { Name: !Sub "${Environment}-TapStack-PublicSubnets" }

  PrivateSubnetIds:
    Description: Private subnet IDs
    Value: !Join [ ",", [ !Ref PrivateSubnet1, !Ref PrivateSubnet2 ] ]
    Export: { Name: !Sub "${Environment}-TapStack-PrivateSubnets" }

  AppBucketName:
    Description: App S3 bucket
    Value: !Ref TapStackAppBucket
    Export: { Name: !Sub "${Environment}-TapStack-AppBucket" }

  CloudTrailBucketName:
    Description: CloudTrail S3 bucket
    Value: !Ref TapStackCloudTrailBucket
    Export: { Name: !Sub "${Environment}-TapStack-CloudTrailBucket" }

  LogBucketName:
    Description: Access log bucket
    Value: !Ref TapStackLogBucket
    Export: { Name: !Sub "${Environment}-TapStack-LogBucket" }

  KmsKeyId:
    Description: KMS Key Id
    Value: !Ref TapStackKmsKey
    Export: { Name: !Sub "${Environment}-TapStack-KmsKeyId" }

  KmsKeyArn:
    Description: KMS Key ARN
    Value: !GetAtt TapStackKmsKey.Arn
    Export: { Name: !Sub "${Environment}-TapStack-KmsKeyArn" }

  LambdaRoleArn:
    Description: Lambda role ARN
    Value: !GetAtt TapStackLambdaRole.Arn
    Export: { Name: !Sub "${Environment}-TapStack-LambdaRoleArn" }

  Ec2InstanceProfile:
    Description: EC2 instance profile name
    Value: !Ref TapStackInstanceProfile
    Export: { Name: !Sub "${Environment}-TapStack-InstanceProfile" }

  RdsEndpoint:
    Description: RDS endpoint
    Value: !GetAtt TapStackDBInstance.Endpoint.Address
    Export: { Name: !Sub "${Environment}-TapStack-RdsEndpoint" }

  RequireMFAManagedPolicyArn:
    Description: MFA-managed policy ARN
    Value: !Ref RequireMFAForConsolePolicy
    Export: { Name: !Sub "${Environment}-TapStack-RequireMFAPolicyArn" }
```