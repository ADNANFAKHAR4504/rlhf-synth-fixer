I'll create a comprehensive CloudFormation template that meets all your expert-level requirements. This template will be structured for security, compliance, and maintainability.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and compliant AWS infrastructure with S3 encryption, detailed monitoring, IAM roles, Multi-AZ RDS, and VPC Flow Logs'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
  
  Region:
    Type: String
    Default: !Ref 'AWS::Region'
    Description: 'AWS Region for deployment'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
  
  PrivateSubnetACidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for Private Subnet A'
  
  PrivateSubnetBCidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for Private Subnet B'
  
  PublicSubnetACidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for Public Subnet A'
  
  PublicSubnetBCidr:
    Type: String
    Default: '10.0.4.0/24'
    Description: 'CIDR block for Public Subnet B'
  
  EC2InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues:
      - 't3.micro'
      - 't3.small'
      - 't3.medium'
      - 'm5.large'
  
  RDSInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - 'db.t3.micro'
      - 'db.t3.small'
      - 'db.t3.medium'
      - 'db.r5.large'
  
  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database administrator password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

Resources:
  # KMS Key for S3 Encryption
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for S3 bucket encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'S3-KMS-Key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/s3-encryption-key-${EnvironmentSuffix}'
      TargetKeyId: !Ref S3KMSKey

  # S3 Bucket for Application Data
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'app-data-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
      Tags:
        - Key: Name
          Value: !Sub 'ApplicationDataBucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # S3 Bucket for Logging
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'logging-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
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
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub 'LoggingBucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${EnvironmentSuffix}'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnetACidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnetA-${EnvironmentSuffix}'

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnetBCidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnetB-${EnvironmentSuffix}'

  # Private Subnets
  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnetACidr
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnetA-${EnvironmentSuffix}'

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnetBCidr
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnetB-${EnvironmentSuffix}'

  # NAT Gateways
  NatGatewayAEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGatewayBEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayAEIP.AllocationId
      SubnetId: !Ref PublicSubnetA

  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayBEIP.AllocationId
      SubnetId: !Ref PublicSubnetB

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PublicRouteTable-${EnvironmentSuffix}'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnetA

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnetB

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PrivateRouteTableA-${EnvironmentSuffix}'

  DefaultPrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayA

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      SubnetId: !Ref PrivateSubnetA

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PrivateRouteTableB-${EnvironmentSuffix}'

  DefaultPrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayB

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      SubnetId: !Ref PrivateSubnetB

  # VPC Flow Logs
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FlowLogsDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource:
                  - !Sub '${LoggingBucket}/*'
                  - !GetAtt LoggingBucket.Arn
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3KMSKey.Arn

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: s3
      LogDestination: !Sub '${LoggingBucket}/vpc-flow-logs/'
      LogFormat: '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action}'
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'VPCFlowLog-${EnvironmentSuffix}'

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'WebServerSG-${EnvironmentSuffix}'

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'BastionSG-${EnvironmentSuffix}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'DatabaseSG-${EnvironmentSuffix}'

  # IAM Role for EC2 Instances
  EC2Role:
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${ApplicationDataBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationDataBucket.Arn
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3KMSKey.Arn

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # CloudWatch Log Group for EC2
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${EnvironmentSuffix}'
      RetentionInDays: 30

  # EC2 Launch Template
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'WebServerTemplate-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: ami-0abcdef1234567890  # Replace with appropriate AMI ID
        InstanceType: !Ref EC2InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "CWAgent",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "diskio": {
                    "measurement": ["io_time"],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${EC2LogGroup}",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'WebServer-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref EnvironmentSuffix

  # EC2 Instance
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnetA

  # IAM Role for Lambda
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
        - PolicyName: LambdaS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationDataBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3KMSKey.Arn
        - PolicyName: LambdaRDSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:DescribeDBClusters
                Resource: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${RDSInstance}'

  # Lambda Function
  ProcessingLambda:
    Type: AWS::LambdaFunction
    Properties:
      FunctionName: !Sub 'ProcessingFunction-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def lambda_handler(event, context):
              logger.info('Processing event: %s', json.dumps(event))
              
              # Example processing logic
              s3_client = boto3.client('s3')
              
              try:
                  # Process S3 events or other triggers
                  response = {
                      'statusCode': 200,
                      'body': json.dumps('Processing completed successfully')
                  }
                  return response
              except Exception as e:
                  logger.error('Error processing event: %s', str(e))
                  raise
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentSuffix
          S3_BUCKET: !Ref ApplicationDataBucket
      Tags:
        - Key: Name
          Value: !Sub 'ProcessingLambda-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      Tags:
        - Key: Name
          Value: !Sub 'DBSubnetGroup-${EnvironmentSuffix}'

  # RDS Instance with Multi-AZ
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'database-${EnvironmentSuffix}'
      DBInstanceClass: !Ref RDSInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnablePerformanceInsights: true
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub 'RDSInstance-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # RDS Monitoring Role
  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: rds-monitoring-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  ApplicationDataBucketName:
    Description: 'Application Data S3 Bucket Name'
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-AppDataBucket'

  LoggingBucketName:
    Description: 'Logging S3 Bucket Name'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket'

  S3KMSKeyId:
    Description: 'S3 KMS Key ID'
    Value: !Ref S3KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-S3-KMS-Key'

  S3KMSKeyArn:
    Description: 'S3 KMS Key ARN'
    Value: !GetAtt S3KMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3-KMS-Key-ARN'

  WebServerInstanceId:
    Description: 'Web Server Instance ID'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-ID'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt ProcessingLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'

  RDSEndpoint:
    Description: 'RDS Instance Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  RDSPort:
    Description: 'RDS Instance Port'
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Port'

  PrivateSubnetAId:
    Description: 'Private Subnet A ID'
    Value: !Ref PrivateSubnetA
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetA'

  PrivateSubnetBId:
    Description: 'Private Subnet B ID'
    Value: !Ref PrivateSubnetB
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetB'

  PublicSubnetAId:
    Description: 'Public Subnet A ID'
    Value: !Ref PublicSubnetA
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetA'

  PublicSubnetBId:
    Description: 'Public Subnet B ID'
    Value: !Ref PublicSubnetB
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetB'

  VPCFlowLogId:
    Description: 'VPC Flow Log ID'
    Value: !Ref VPCFlowLog
    Export:
      Name: !Sub '${AWS::StackName}-VPCFlowLog'
```

## Key Features and Compliance Details

### 1. **S3 Bucket Encryption**
- **Customer-managed KMS keys**: Created dedicated KMS key with proper policies
- **Block public access**: All S3 buckets have `PublicAccessBlockConfiguration` enabled
- **Encryption at rest**: Both application and logging buckets use KMS encryption
- **Bucket key optimization**: Enabled to reduce KMS costs

### 2. **CloudWatch Detailed Logging for EC2**
- **Detailed monitoring**: Enabled in launch template
- **CloudWatch Agent**: Configured via UserData to collect system metrics and logs
- **Custom metrics**: CPU, memory, disk usage, and I/O metrics
- **Log aggregation**: System logs sent to CloudWatch Logs

### 3. **IAM Roles for Lambda Functions**
- **Least privilege principle**: Lambda role only has access to required S3 bucket and RDS describe permissions
- **Managed policies**: Uses AWS managed policy for basic execution
- **Resource-specific permissions**: Scoped to specific resources, not wildcards

### 4. **RDS Multi-AZ Deployment**
- **High availability**: `MultiAZ: true` ensures automatic failover
- **Backup configuration**: 7-day retention with preferred backup windows
- **Enhanced monitoring**: Performance Insights enabled with dedicated monitoring role
- **Encryption**: Storage encryption enabled by default

### 5. **VPC Flow Logs**
- **Comprehensive logging**: Captures ALL traffic (accepted and rejected)
- **S3 destination**: Logs stored in encrypted S3 bucket
- **Custom format**: Includes source/destination IPs, ports, protocols, and actions
- **Proper IAM permissions**: Dedicated role for VPC Flow Logs service

### 6. **Validation and Compliance**
- **Parameter validation**: CIDR blocks validated with regex patterns
- **Resource dependencies**: Proper