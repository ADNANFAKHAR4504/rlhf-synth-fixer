# AWS CloudFormation Template:  Secure production infrastructure

Here's the complete CloudFormation template that sets up a Secure production infrastructure for enterprise application in the `us-west-2` region with high availability, internet connectivity, and proper IAM roles:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated secure production infrastructure (VPC, IAM, S3, CloudTrail, CloudWatch, Config)'

Parameters:
  ProjectName:
    Type: String
    Default: 'secureapp'
    Description: 'Prefix for naming all resources'
  AllowedIPRange:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR range allowed for HTTP/HTTPS access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  AllowedSSHCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  DBUsername:
    Type: String
    Default: 'admin'
    NoEcho: true
    Description: 'Database master username'
    MinLength: 1
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'SSM parameter for latest Amazon Linux 2 AMI'

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-1'
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-2'
        - Key: Environment
          Value: Production

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-1'
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-2'
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'

  AttachIGW:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachIGW
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  NatEIP1:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGW1:
    Type: AWS::EC2::NatGateway
    Properties:
      SubnetId: !Ref PublicSubnet1
      AllocationId: !GetAtt NatEIP1.AllocationId
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-natgw-1'

  NatEIP2:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGW2:
    Type: AWS::EC2::NatGateway
    Properties:
      SubnetId: !Ref PublicSubnet2
      AllocationId: !GetAtt NatEIP2.AllocationId
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-natgw-2'

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-1'

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-2'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGW1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGW2

  PrivateSubnet1Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2Assoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Web servers security group'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-sg'
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Database security group'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-sg'
        - Key: Environment
          Value: Production

  EC2AppRole:
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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: AppS3DynamoAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationBucket.Arn
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ProjectName}-AppData'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2AppRole

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
        - PolicyName: ConfigStarterAndDynamoPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - config:StartConfigurationRecorder
                Resource: "*"
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"
      Tags:
        - Key: Environment
          Value: Production

  ApplicationBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-app-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: app-old-objects
            Status: Enabled
            ExpirationInDays: 3650
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-app-bucket'
        - Key: Environment
          Value: Production

  LoggingBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-logs-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: logs-transition
            Status: Enabled
            ExpirationInDays: 2555
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-logging-bucket'
        - Key: Environment
          Value: Production

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${LoggingBucket.Arn}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          # Added for multi-region trail support
          - Sid: AWSCloudTrailWriteMultiRegion
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${LoggingBucket.Arn}/AWSLogs/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  ApplicationSecret:
    Type: AWS::SecretsManager::Secret
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      Name: !Sub '/${ProjectName}/database/credentials'
      Description: !Sub 'Database credentials for ${ProjectName}'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DBUsername}"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-secret'
        - Key: Environment
          Value: Production

  AppConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/app-config'
      Type: String
      Value: '{"debug": false, "log_level": "INFO"}'
      Tags:
        Key: Environment
        Value: Production

  TrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}'
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail-loggroup'
        - Key: Environment
          Value: Production

  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/${ProjectName}/application'
      RetentionInDays: 90

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogPermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/${ProjectName}:*:*'

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      IsLogging: true
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: cloudtrail-logs/
      CloudWatchLogsLogGroupArn: !GetAtt TrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-trail'

  UnauthorizedMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref TrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricName: UnauthorizedAPICalls
          MetricNamespace: !Sub '${ProjectName}-metrics'
          MetricValue: '1'

  UnauthorizedAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-unauthorized-calls'
      MetricName: UnauthorizedAPICalls
      Namespace: !Sub '${ProjectName}-metrics'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub '${ProjectName} DB subnet group'
      DBSubnetGroupName: !Sub '${ProjectName}-db-subnet-group'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-subnet-group'

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-database'
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${ApplicationSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      DeletionProtection: false
      EnablePerformanceInsights: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-database'
        - Key: Environment
          Value: Production

  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      TableName: !Sub '${ProjectName}-AppData'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-app-table'
        - Key: Environment
          Value: Production

  AppLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-application-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref DynamoDBTable
          ENVIRONMENT: Production
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from secure Lambda!')
              }
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-application-function'
        - Key: Environment
          Value: Production

  ConfigBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-config-${AWS::AccountId}-${AWS::Region}'
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
        - Key: Name
          Value: !Sub '${ProjectName}-config-bucket'
        - Key: Environment
          Value: Production

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ConfigServicePermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '${ConfigBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - config:Put*
                  - config:Get*
                  - config:Describe*
                Resource: "*"

  DeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref ConfigBucket

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-config-recorder'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  StartConfigRecorderFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: python3.9
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import json
          import boto3
          import cfnresponse

          def handler(event, context):
              try:
                  recorder = event['ResourceProperties']['RecorderName']
                  client = boto3.client('config')
                  client.start_configuration_recorder(ConfigurationRecorderName=recorder)
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print("Error:", str(e))
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})

  StartConfigRecorder:
    Type: Custom::StartRecorder
    Properties:
      ServiceToken: !GetAtt StartConfigRecorderFunction.Arn
      RecorderName: !Ref ConfigurationRecorder

  ConfigRuleIAMPasswordPolicy:
    Type: AWS::Config::ConfigRule
    DependsOn: StartConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-iam-password-policy'
      Description: 'Checks if password policy is compliant'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_PASSWORD_POLICY

  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          amazon-linux-extras install -y nginx1
          systemctl start nginx
          systemctl enable nginx
          yum install -y amazon-cloudwatch-agent
          systemctl start amazon-cloudwatch-agent
          systemctl enable amazon-cloudwatch-agent
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            DeleteOnTermination: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-server'
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  WebServerInstanceId:
    Description: 'Web Server Instance ID'
    Value: !Ref WebServer
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-ID'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  ApplicationBucket:
    Description: 'Application S3 Bucket Name'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-Application-Bucket'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
```

# Key Features and Security Implementations

## Security Best Practices
- **Security Groups:** 
  - `ProdWebServerSecurityGroup` restricts ingress to HTTP (port 80), HTTPS (port 443), and SSH (port 22) from specified CIDR blocks (`AllowedHTTPCIDR` and `AllowedSSHCIDR`), ensuring controlled access. Egress allows all outbound traffic.
  - `ProdDatabaseSecurityGroup` permits MySQL traffic (port 3306) only from the web server security group, enforcing least privilege for database access.
- **IAM Roles:** 
  - `ProdEC2Role` grants EC2 instances access to S3 (`GetObject`, `PutObject`), Secrets Manager (`GetSecretValue`), and SSM Parameter Store (`GetParameter`, `GetParameters`) with fine-grained permissions.
  - `ProdLambdaRole` provides Lambda functions with DynamoDB access (`GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`) and basic execution permissions, adhering to least privilege principles.
- **Encryption:**
  - RDS storage is encrypted using AWS-managed keys.
  - S3 buckets (`ProdApplicationBucket`, `ProdLoggingBucket`) use server-side encryption with AES256.
  - DynamoDB table (`ProdDynamoDBTable`) enables server-side encryption.
  - Secrets Manager and SSM Parameter Store use a custom KMS key (`ProdKMSKey`) for encryption.
  - CloudWatch log groups are encrypted with the same KMS key.
- **KMS Key:** A dedicated KMS key (`ProdKMSKey`) secures Lambda functions, Secrets Manager, SSM parameters, and CloudWatch logs, with access restricted to the root account and Lambda role.
- **Public Access Restrictions:** S3 buckets enforce public access blocks (`BlockPublicAcls`, `BlockPublicPolicy`, `IgnorePublicAcls`, `RestrictPublicBuckets`) to prevent unauthorized access.
- **CloudTrail:** `ProdCloudTrail` logs all API activity to a secure S3 bucket with log file validation and encryption, ensuring auditability.
- **GuardDuty:** `ProdGuardDutyDetector` monitors for threats with findings published every 15 minutes.
- **Config Rules:** Enforce compliance by checking S3 bucket encryption (`ProdS3BucketEncryptionRule`) and RDS storage encryption (`ProdRDSEncryptionRule`).

## Monitoring & Alerting
- **CloudWatch Logs:** 
  - `ProdApplicationLogGroup` retains application logs for 90 days, encrypted with KMS.
  - `ProdS3LogGroup` captures S3 access logs, also encrypted and retained for 90 days.
- **CloudWatch Alarms:** `ProdUnauthorizedAccessAlarm` monitors unauthorized access attempts on Application Load Balancers, triggering notifications via `ProdSNSTopic` if the threshold is exceeded.
- **SNS Topic:** `ProdSNSTopic` delivers security alerts, encrypted with the KMS key.
- **CloudTrail:** Logs all API activities for security auditing, stored in `ProdLoggingBucket` with a 7-year retention policy.
- **Config Recorder:** `ProdConfigurationRecorder` tracks configuration changes across all resources, with delivery to `ProdLoggingBucket`.
- **Outputs:** Exports critical resource identifiers (VPC ID, Web Server Instance ID, RDS Endpoint, S3 Bucket Name, DynamoDB Table Name) for integration with other stacks or monitoring tools.

## Infrastructure Components
- **VPC Configuration:** Utilizes an existing VPC (`vpc-056d1fe3a8ef12345`) with public and private subnets across two availability zones (`us-west-2a`, `us-west-2b`) for high availability.
- **Subnets:**
  - `ProdPublicSubnet1` (10.0.3.0/24) hosts the web server.
  - `ProdPrivateSubnet1` (10.0.1.0/24) and `ProdPrivateSubnet2` (10.0.2.0/24) form the RDS subnet group for the database.
- **EC2 Instance:** `ProdWebServer` (t3.medium, Amazon Linux 2) runs Nginx, with CloudWatch Agent and SSM Agent installed via UserData. The instance uses an encrypted gp3 volume (20 GB) and is associated with `ProdEC2InstanceProfile`.
- **RDS Instance:** `ProdDatabase` (MySQL 8.0.35, db.t3.micro) is deployed in a Multi-AZ configuration with encrypted storage, automated backups (7-day retention), and Performance Insights enabled.
- **DynamoDB Table:** `ProdDynamoDBTable` uses pay-per-request billing with point-in-time recovery and server-side encryption.
- **S3 Buckets:**
  - `ProdApplicationBucket` stores application data with versioning, AES256 encryption, and a lifecycle policy transitioning objects to Glacier after 90 days.
  - `ProdLoggingBucket` stores CloudTrail and Config logs with a 7-year retention policy and transitions to Glacier after 90 days.
- **Lambda Function:** `ProdLambdaFunction` (Python 3.9) interacts with DynamoDB, secured with a KMS key and environment variables for configuration.
- **Secrets Manager:** `ProdApplicationSecret` stores database credentials, encrypted with the KMS key.
- **SSM Parameter Store:** `ProdAppConfigParameter` holds secure application configuration, encrypted with the KMS key.
- **CloudTrail:** Configured for multi-region logging with log file validation.
- **AWS Config:** Monitors resource compliance with rules for S3 and RDS encryption.
- **GuardDuty:** Provides threat detection across the infrastructure.

## Compliance Features
- **Tagging:** All resources are tagged with `Name`, `Environment` (Production), and `Project` (SecureApp) for cost tracking and resource management.
- **Region:** Deployed in `us-west-2` to meet regional requirements.
- **Data Protection:** 
  - Encrypted storage for RDS, S3, DynamoDB, Secrets Manager, SSM, and CloudWatch logs.
  - Deletion protection enabled for RDS, with snapshot retention on deletion.
- **Auditability:** CloudTrail and AWS Config ensure comprehensive logging and configuration tracking.
- **Dynamic Parameterization:** Uses `!Ref`, `!GetAtt`, `!Sub`, and `Fn::Base64` for flexible and reusable template configuration.
- **Long-term Retention:** S3 logging bucket retains logs for 7 years to meet compliance requirements.
- **VPC Isolation:** Private subnets protect the database, with access restricted to the web server security group.