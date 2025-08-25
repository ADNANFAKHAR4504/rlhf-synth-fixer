```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Multi-Account CloudFormation Template with Strict Security Controls'

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource tagging'
  
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: 'VPC ID for Lambda functions'
  
  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: 'Private subnet IDs for Lambda functions'

Resources:
  # KMS Customer Managed Key for CloudTrail
  CloudTrailKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS CMK for CloudTrail encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow CloudTrail to describe key
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: CloudTrail

  CloudTrailKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/cloudtrail-${Environment}'
      TargetKeyId: !Ref CloudTrailKMSKey

  # KMS Customer Managed Key for RDS
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS CMK for RDS encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS to use the key
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
    Properties:
      AliasName: !Sub 'alias/rds-${Environment}'
      TargetKeyId: !Ref RDSKMSKey

  # Secure S3 Bucket for CloudTrail logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
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
              KMSMasterKeyID: !Ref CloudTrailKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 2555
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: CloudTrail

  # S3 Bucket Policy - Explicitly deny public access
  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
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
            Condition:
              Bool:
                'aws:PrincipalIsAWSService': 'false'
              StringNotEquals:
                'aws:PrincipalServiceName':
                  - cloudtrail.amazonaws.com
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref CloudTrailLogsBucket
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailLogsBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # CloudTrail with global events and KMS encryption
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailLogsBucketPolicy
    Properties:
      TrailName: !Sub 'secure-cloudtrail-${Environment}'
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref CloudTrailKMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Audit

  # S3 Bucket for AWS Config
  ConfigBucket:
    Type: AWS::S3::Bucket
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
            Condition:
              Bool:
                'aws:PrincipalIsAWSService': 'false'
              StringNotEquals:
                'aws:PrincipalServiceName':
                  - config.amazonaws.com
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref ConfigBucket
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !Ref ConfigBucket
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # IAM Role for AWS Config
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

  # AWS Config Configuration Recorder
  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'config-recorder-${Environment}'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # AWS Config Delivery Channel
  DeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'config-delivery-${Environment}'
      S3BucketName: !Ref ConfigBucket

  # AWS Config Rule for Required Tags
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: 'required-tags'
      Description: 'Checks whether resources contain all required tags'
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      InputParameters: |
        {
          "tag1Key": "Environment",
          "tag2Key": "Purpose"
        }

  # Security Group for Lambda functions
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VpcId
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Lambda

  # IAM Role for Lambda (no root account access)
  LambdaExecutionRole:
    Type: AWS::IAM::Role
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

  # Example Lambda function with VPC configuration
  SecureLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'secure-lambda-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': 'Hello from secure Lambda!'
              }
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: !Ref PrivateSubnetIds
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Compute

  # RDS Subnet Group
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'rds-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds: !Ref PrivateSubnetIds
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Database

  # RDS Security Group
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS instances'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'MySQL access from Lambda'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Database

  # Encrypted RDS Instance
  SecureRDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'secure-db-${Environment}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      DBSubnetGroupName: !Ref RDSSubnetGroup
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

  # Application Load Balancer Security Group
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP inbound (for redirect)'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS inbound'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: LoadBalancer

  # Application Load Balancer
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

  # Target Group for ALB
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

  # HTTP Listener (redirects to HTTPS)
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

  # HTTPS Listener with TLS 1.2+
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

  # Example secure S3 bucket
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-app-bucket-${AWS::AccountId}-${Environment}'
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
          Value: Application

  # S3 Bucket Policy - Explicitly deny public access
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyPublicAccess
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Ref SecureS3Bucket
            Condition:
              Bool:
                'aws:PrincipalIsAWSService': 'false'
          - Sid: DenyRootAccess
            Effect: Deny
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Ref SecureS3Bucket

Outputs:
  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Arn'

  ConfigBucketName:
    Description: 'AWS Config S3 Bucket Name'
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-Config-Bucket'

  LambdaFunctionArn:
    Description: 'Secure Lambda Function ARN'
    Value: !GetAtt SecureLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Arn'

  RDSInstanceEndpoint:
    Description: 'RDS Instance Endpoint'
    Value: !GetAtt SecureRDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  SecureBucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-Secure-Bucket'
```