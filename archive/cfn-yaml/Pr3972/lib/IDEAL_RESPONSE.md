# Secure RDS MySQL Deployment with VPC, Encryption, Automated Backups, and Monitoring

This CloudFormation template creates a comprehensive, production-ready RDS MySQL deployment that meets all security and operational requirements for managing 1,500 daily customer records.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure RDS MySQL deployment with VPC, encryption, automated backups, and monitoring'

Parameters:
  EnvironmentSuffix:
    Default: dev
    Type: String
    Description: Environment suffix for resource naming (e.g., dev, staging, prod)
    MinLength: 1
    MaxLength: 10

  DBName:
    Type: String
    Description: Initial database name
    Default: customerdb
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

Resources:
  # Secrets Manager for DB Credentials
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'customer-db-credentials-${EnvironmentSuffix}'
      Description: !Sub 'RDS MySQL credentials for ${EnvironmentSuffix} environment'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub 'customer-db-secret-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Secret Rotation Lambda Execution Role
  SecretRotationLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: SecretRotationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:DescribeSecret'
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:PutSecretValue'
                  - 'secretsmanager:UpdateSecretVersionStage'
                Resource: !Ref DBSecret
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetRandomPassword'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'customer-secret-rotation-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Attach Secret to RDS Instance
  SecretRDSInstanceAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DBSecret
      TargetId: !Ref DBInstance
      TargetType: AWS::RDS::DBInstance

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'customer-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway (for NAT Gateway)
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'customer-igw-${EnvironmentSuffix}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnet for NAT Gateway
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'customer-public-subnet-${EnvironmentSuffix}'

  # Private Subnets for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'customer-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'customer-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateway for private subnet internet access
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'customer-nat-eip-${EnvironmentSuffix}'

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub 'customer-nat-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'customer-public-rt-${EnvironmentSuffix}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'customer-private-rt-${EnvironmentSuffix}'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # KMS Key for RDS Encryption
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for RDS encryption - ${EnvironmentSuffix}'
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
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'customer-rds-kms-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/customer-rds-${EnvironmentSuffix}'
      TargetKeyId: !Ref RDSKMSKey

  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'customer-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS MySQL instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'customer-db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Security Group for RDS
  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'customer-db-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for RDS MySQL instance
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 10.0.0.0/16
          Description: Allow MySQL access from VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'customer-db-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # RDS MySQL Instance
  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'customer-db-${EnvironmentSuffix}'
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: '8.0.39'
      DBInstanceClass: db.m5.large
      AllocatedStorage: 20
      MaxAllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !GetAtt RDSKMSKey.Arn
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      PerformanceInsightsKMSKeyId: !GetAtt RDSKMSKey.Arn
      PubliclyAccessible: false
      MultiAZ: false
      AutoMinorVersionUpgrade: true
      DeletionProtection: false
      CopyTagsToSnapshot: true
      Tags:
        - Key: Name
          Value: !Sub 'customer-db-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM Role for Enhanced Monitoring
  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      Tags:
        - Key: Name
          Value: !Sub 'customer-rds-monitoring-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM Role for Application Access
  DBAccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: RDSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds:DescribeDBInstances'
                  - 'rds:DescribeDBClusters'
                Resource: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:customer-db-${EnvironmentSuffix}'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt RDSKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBSecret
      Tags:
        - Key: Name
          Value: !Sub 'customer-db-access-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudWatch Alarms
  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'customer-db-cpu-${EnvironmentSuffix}'
      AlarmDescription: Alert when database CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DBInstance

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'customer-db-connections-${EnvironmentSuffix}'
      AlarmDescription: Alert when database connections are high
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DBInstance

  DatabaseStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'customer-db-storage-${EnvironmentSuffix}'
      AlarmDescription: Alert when free storage space is low
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648 # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DBInstance

  # SNS Topic for Alarms (optional - for notifications)
  DBAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'customer-db-alarms-${EnvironmentSuffix}'
      DisplayName: RDS Database Alarms
      Tags:
        - Key: Name
          Value: !Sub 'customer-db-alarms-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  DBInstanceEndpoint:
    Description: RDS MySQL instance endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  DBInstancePort:
    Description: RDS MySQL instance port
    Value: !GetAtt DBInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'

  DBName:
    Description: Database name
    Value: !Ref DBName
    Export:
      Name: !Sub '${AWS::StackName}-DB-Name'

  KMSKeyId:
    Description: KMS Key ID for RDS encryption
    Value: !Ref RDSKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  DBSecurityGroupId:
    Description: Security Group ID for RDS
    Value: !Ref DBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-DB-SecurityGroup-ID'

  DBAccessRoleArn:
    Description: IAM Role ARN for database access
    Value: !GetAtt DBAccessRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DB-AccessRole-ARN'

  SNSTopicArn:
    Description: SNS Topic ARN for database alarms
    Value: !Ref DBAlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic-ARN'

  DBSecretArn:
    Description: Secrets Manager Secret ARN for database credentials
    Value: !Ref DBSecret
    Export:
      Name: !Sub '${AWS::StackName}-DB-Secret-ARN'
```

## Key Features

### Security
- **Encryption at Rest**: KMS encryption for RDS storage and Performance Insights
- **Network Isolation**: Private subnets (10.0.10.0/24) for database placement
- **Secrets Management**: AWS Secrets Manager for database credentials
- **Security Groups**: Restrictive inbound rules allowing only MySQL port from VPC
- **IAM Roles**: Least-privilege access for monitoring and application access

### High Availability and Backup
- **Automated Backups**: 7-day retention policy as required
- **Maintenance Windows**: Scheduled during low-traffic hours
- **Performance Insights**: 7-day retention for performance monitoring
- **CloudWatch Logs**: Error, general, and slow query log exports
- **Enhanced Monitoring**: 60-second interval monitoring

### Monitoring and Alerting
- **CloudWatch Alarms**: CPU utilization, database connections, and storage space
- **SNS Topic**: Ready for alarm notifications
- **Performance Insights**: Database performance monitoring
- **CloudWatch Logs**: Comprehensive logging for troubleshooting

### Cost Optimization
- **Storage Auto Scaling**: Automatic growth from 20GB to 100GB as needed
- **GP3 Storage**: Cost-effective general purpose SSD storage
- **Right-sized Instance**: db.m5.large suitable for 1,500 daily records
- **Single AZ Deployment**: Cost-effective for startup requirements

### Operational Excellence
- **Consistent Naming**: Environment suffix for multi-environment deployments
- **Resource Tagging**: Comprehensive tagging for management and cost allocation
- **Deletion Policies**: Set to Delete for non-production environments
- **Auto Minor Version Upgrades**: Automatic security and bug fixes

This template provides a production-ready, secure, and cost-effective RDS MySQL deployment that can efficiently handle 1,500 daily customer records while maintaining high security standards and operational visibility.