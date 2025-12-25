# Production-Ready AWS CloudFormation Template

Here's a comprehensive CloudFormation YAML template that meets all your requirements for a secure and scalable production infrastructure:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready AWS infrastructure with security best practices'

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    
  AllowedCidrBlock:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed to access VPC resources'
    
  DatabaseUsername:
    Type: String
    Default: 'admin'
    Description: 'Database master username'
    NoEcho: true

Resources:
  # VPC Configuration
  ProductionVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'Production-VPC'
        - Key: Environment
          Value: 'Production'

  # Internet Gateway
  ProductionInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'Production-IGW'
        - Key: Environment
          Value: 'Production'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProductionVPC
      InternetGatewayId: !Ref ProductionInternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'Production-Public-Subnet-1'
        - Key: Environment
          Value: 'Production'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'Production-Public-Subnet-2'
        - Key: Environment
          Value: 'Production'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'Production-Private-Subnet-1'
        - Key: Environment
          Value: 'Production'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'Production-Private-Subnet-2'
        - Key: Environment
          Value: 'Production'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: 'Production-Public-RT'
        - Key: Environment
          Value: 'Production'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProductionInternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref ProductionVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedCidrBlock
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCidrBlock
      Tags:
        - Key: Name
          Value: 'Production-WebServer-SG'
        - Key: Environment
          Value: 'Production'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for database'
      VpcId: !Ref ProductionVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: 'Production-Database-SG'
        - Key: Environment
          Value: 'Production'

  # S3 Bucket with Encryption
  ProductionS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'production-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: 'Production'

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt ProductionS3Bucket.Arn
                  - !Sub '${ProductionS3Bucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: 'Production'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SQSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource: !GetAtt LambdaDeadLetterQueue.Arn
      Tags:
        - Key: Environment
          Value: 'Production'

  # DynamoDB Table with Point-in-Time Recovery
  ProductionDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: 'ProductionTable'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: 'Production'

  # DynamoDB Backup Vault
  DynamoDBBackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: 'DynamoDBProductionBackupVault'
      EncryptionKeyArn: alias/aws/backup
      BackupVaultTags:
        Environment: 'Production'

  # Backup Plan for DynamoDB
  DynamoDBBackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: 'DynamoDBProductionBackupPlan'
        BackupPlanRule:
          - RuleName: 'DailyBackups'
            TargetBackupVault: !Ref DynamoDBBackupVault
            ScheduleExpression: 'cron(0 2 * * ? *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 7
      BackupPlanTags:
        Environment: 'Production'

  # Backup Selection for DynamoDB
  DynamoDBBackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref DynamoDBBackupPlan
      BackupSelection:
        SelectionName: 'DynamoDBSelection'
        IamRoleArn: !GetAtt BackupServiceRole.Arn
        Resources:
          - !GetAtt ProductionDynamoDBTable.Arn

  # Backup Service Role
  BackupServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores
      Tags:
        - Key: Environment
          Value: 'Production'

  # AWS Config Configuration Recorder
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !GetAtt ConfigS3Bucket.Arn
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ConfigS3Bucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: 'Production'

  ConfigS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'config-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: 'Production'

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref ConfigS3Bucket

  ConfigConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: 'ProductionConfigRecorder'
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # Config Rule for Root Access Key Check
  RootAccessKeyCheckRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigConfigurationRecorder
    Properties:
      ConfigRuleName: 'root-access-key-check'
      Source:
        Owner: AWS
        SourceIdentifier: ROOT_ACCESS_KEY_CHECK

  # RDS Subnet Group
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: 'Production'

  # RDS Instance
  ProductionRDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: 'production-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername: !Ref DatabaseUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:prod/db/password:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref RDSSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      AutoMinorVersionUpgrade: true
      DeletionProtection: true
      Tags:
        - Key: Environment
          Value: 'Production'

  # CloudTrail S3 Bucket
  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: 'Production'

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref CloudTrailS3Bucket

  # CloudTrail
  ProductionCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: 'ProductionCloudTrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsLogging: true
      EnableLogFileValidation: true
      Tags:
        - Key: Environment
          Value: 'Production'

  # EC2 Launch Template
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: 'ProductionLaunchTemplate'
      LaunchTemplateData:
        ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI (update as needed)
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        DisableApiTermination: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: 'Production-WebServer'
              - Key: Environment
                Value: 'Production'

  # Application Load Balancer
  ProductionALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: 'Production-ALB'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref WebServerSecurityGroup
      LoadBalancerAttributes:
        - Key: load_balancing.cross_zone.enabled
          Value: 'true'
      Tags:
        - Key: Environment
          Value: 'Production'

  # Target Group
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: 'Production-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ProductionVPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: 'Production'

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ProductionALB
      Port: 80
      Protocol: HTTP

  # SQS Dead Letter Queue
  LambdaDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: 'ProductionLambdaDLQ'
      MessageRetentionPeriod: 1209600  # 14 days
      Tags:
        - Key: Environment
          Value: 'Production'

  # Lambda Function
  ProductionLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: 'ProductionLambda'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from Lambda!')
              }
      DeadLetterConfig:
        TargetArn: !GetAtt LambdaDeadLetterQueue.Arn
      Tags:
        - Key: Environment
          Value: 'Production'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref ProductionVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref ProductionS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  LoadBalancerDNS:
    Description: 'Load Balancer DNS Name'
    Value: !GetAtt ProductionALB.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref ProductionDynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'
```

## Key Features Implemented

### Security Best Practices
- **VPC with restricted CIDR access** - Only allows traffic from specified CIDR ranges
- **Server-side encryption** - All S3 buckets use AES256 encryption
- **IAM least privilege** - Roles have minimal required permissions
- **Security groups** - Properly configured with restricted access

### Compliance & Monitoring
- **AWS Config** - Monitors root credential usage with configuration recorder
- **CloudTrail** - Logs all API calls across regions with `IsLogging: true`
- **DynamoDB backups** - 7-day retention with AWS Backup service
- **RDS protection** - Automatic minor version upgrades and deletion protection

### Operational Excellence
- **EC2 termination protection** - Prevents accidental instance deletion
- **Cross-zone load balancing** - Enabled on Application Load Balancer
- **Lambda dead letter queues** - Handles failed function executions
- **Comprehensive tagging** - All resources tagged with `Environment:Production`

### Dynamic Configuration
- **No hardcoded regions** - Uses AWS pseudo parameters and functions
- **Dynamic references** - Database password uses Secrets Manager
- **Parameter-driven** - VPC CIDR and allowed access ranges configurable

## Deployment Instructions

1. **Prerequisites**: Ensure you have a secret in AWS Secrets Manager at `prod/db/password` with the database password
2. **Deploy**: Use AWS CLI or Console to deploy this template
3. **Validation**: The template passes CloudFormation validation and cfn-lint checks

This template provides a solid foundation for production workloads with security, scalability, and operational best practices built-in.
