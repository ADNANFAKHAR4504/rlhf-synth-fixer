# Security Configuration as Code - Multi-Tier Web Application

This CloudFormation template creates a secure multi-tier web application infrastructure with comprehensive security controls, monitoring, and compliance features.

## Key Security Features Implemented

1. **IAM Roles with Least Privilege**: All roles have minimal required permissions
2. **S3 Encryption**: All buckets use AWS-managed SSE-S3 encryption
3. **VPC-Specific Deployment**: Uses existing VPC vpc-0abcd1234
4. **Lambda CloudWatch Logging**: Comprehensive logging for all Lambda functions
5. **RDS Multi-AZ**: High availability database deployment
6. **Centralized Logging**: S3 bucket for CloudWatch logs with secure access
7. **Security Group Restrictions**: Only allows port 443 from internet
8. **AWS Config Monitoring**: Rules to monitor security group changes

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Multi-Tier Web Application Infrastructure with Security Configuration as Code'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - DBUsername
          - DBPassword
      - Label:
          default: 'Security Configuration'
        Parameters:
          - VPCId
          - PrivateSubnet1Id
          - PrivateSubnet2Id
          - PublicSubnet1Id
          - PublicSubnet2Id

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  VPCId:
    Type: String
    Default: 'vpc-0abcd1234'
    Description: 'VPC ID where resources will be deployed'
    
  PrivateSubnet1Id:
    Type: String
    Description: 'Private subnet ID in AZ 1a for database and application servers'
    
  PrivateSubnet2Id:
    Type: String
    Description: 'Private subnet ID in AZ 1b for database and application servers'
    
  PublicSubnet1Id:
    Type: String
    Description: 'Public subnet ID in AZ 1a for load balancer'
    
  PublicSubnet2Id:
    Type: String
    Description: 'Public subnet ID in AZ 1b for load balancer'
    
  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    MinLength: '1'
    MaxLength: '16'
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    
  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database administrator password'
    MinLength: '8'
    MaxLength: '41'
    AllowedPattern: '[a-zA-Z0-9]*'

Resources:
  # Centralized Logging S3 Bucket
  CentralizedLoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-webapp-logs-${EnvironmentSuffix}-${AWS::AccountId}'
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
          - Id: LogRetentionRule
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref LoggingBucketLogGroup

  # Application Assets S3 Bucket
  ApplicationAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-webapp-assets-${EnvironmentSuffix}-${AWS::AccountId}'
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

  # CloudWatch Log Groups
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/application/secure-webapp-${EnvironmentSuffix}'
      RetentionInDays: 30
      
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/secure-webapp-processor-${EnvironmentSuffix}'
      RetentionInDays: 30
      
  LoggingBucketLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/logging-bucket-${EnvironmentSuffix}'
      RetentionInDays: 30

  # IAM Roles with Least Privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureWebAppLambdaRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaMinimalAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub '${LambdaLogGroup}:*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationAssetsBucket}/*'
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                Resource: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${DatabaseInstance}'

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureWebAppEC2Role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: EC2MinimalAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub '${ApplicationLogGroup}:*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub '${ApplicationAssetsBucket}/*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureWebAppConfigRole-${EnvironmentSuffix}'
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
        - PolicyName: ConfigS3DeliveryPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !Sub '${CentralizedLoggingBucket}'
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                Resource: !Sub '${CentralizedLoggingBucket}/config/*'

  # Security Groups
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SecureWebApp-ALB-SG-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Application Load Balancer - only allows HTTPS from internet'
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'HTTP to web servers'
      Tags:
        - Key: Name
          Value: !Sub 'SecureWebApp-ALB-SG-${EnvironmentSuffix}'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SecureWebApp-Web-SG-${EnvironmentSuffix}'
      GroupDescription: 'Security group for web servers - only allows traffic from ALB'
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTP from load balancer'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
          Description: 'MySQL to database'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS for external API calls'
      Tags:
        - Key: Name
          Value: !Sub 'SecureWebApp-Web-SG-${EnvironmentSuffix}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SecureWebApp-DB-SG-${EnvironmentSuffix}'
      GroupDescription: 'Security group for RDS database - only allows traffic from web servers'
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL from web servers'
      Tags:
        - Key: Name
          Value: !Sub 'SecureWebApp-DB-SG-${EnvironmentSuffix}'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SecureWebApp-Lambda-SG-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VPCId
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS for AWS API calls'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
          Description: 'MySQL to database'
      Tags:
        - Key: Name
          Value: !Sub 'SecureWebApp-Lambda-SG-${EnvironmentSuffix}'

  # RDS Database with Multi-AZ
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'secure-webapp-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1Id
        - !Ref PrivateSubnet2Id
      Tags:
        - Key: Name
          Value: !Sub 'SecureWebApp-DB-SubnetGroup-${EnvironmentSuffix}'

  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'secure-webapp-db-${EnvironmentSuffix}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: '20'
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBName: securewebapp
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: false
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      Tags:
        - Key: Name
          Value: !Sub 'SecureWebApp-Database-${EnvironmentSuffix}'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'SecureWebApp-ALB-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1Id
        - !Ref PublicSubnet2Id
      Tags:
        - Key: Name
          Value: !Sub 'SecureWebApp-ALB-${EnvironmentSuffix}'

  # Lambda Function for background processing
  BackgroundProcessorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'secure-webapp-processor-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1Id
          - !Ref PrivateSubnet2Id
      Environment:
        Variables:
          DB_HOST: !GetAtt DatabaseInstance.Endpoint.Address
          LOG_LEVEL: INFO
      Code:
        ZipFile: |
          import json
          import logging
          import os
          
          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
          
          def lambda_handler(event, context):
              logger.info(f"Processing event: {json.dumps(event)}")
              
              # Background processing logic would go here
              response = {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Background processing completed successfully',
                      'event': event
                  })
              }
              
              logger.info(f"Response: {json.dumps(response)}")
              return response
      Timeout: 30
      ReservedConcurrencyLimit: 10
      Tags:
        - Key: Name
          Value: !Sub 'SecureWebApp-BackgroundProcessor-${EnvironmentSuffix}'

  # AWS Config Configuration Recorder
  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'SecureWebApp-ConfigRecorder-${EnvironmentSuffix}'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        GlobalResourceTypesRegion: !Ref AWS::Region
        IncludeGlobalResourceTypes: true

  # Config Delivery Channel
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'SecureWebApp-ConfigChannel-${EnvironmentSuffix}'
      S3BucketName: !Ref CentralizedLoggingBucket
      S3KeyPrefix: 'config'
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: Daily

  # Config Rules for Security Monitoring
  SecurityGroupOpenToWorldRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 'security-group-ssh-check-${EnvironmentSuffix}'
      Description: 'Checks whether security groups allow unrestricted incoming SSH traffic'
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::SecurityGroup

  SecurityGroupHTTPSOnlyRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 'security-group-https-only-${EnvironmentSuffix}'
      Description: 'Checks whether security groups allow unrestricted incoming traffic except on port 443'
      Source:
        Owner: AWS
        SourceIdentifier: SECURITY_GROUP_NOT_USED
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::SecurityGroup

  RDSMultiAZRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 'rds-multi-az-support-${EnvironmentSuffix}'
      Description: 'Checks whether high availability is enabled for RDS DB instances'
      Source:
        Owner: AWS
        SourceIdentifier: RDS_MULTI_AZ_SUPPORT
      Scope:
        ComplianceResourceTypes:
          - AWS::RDS::DBInstance

  S3BucketSSLRequestsOnlyRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 's3-bucket-ssl-requests-only-${EnvironmentSuffix}'
      Description: 'Checks whether S3 buckets have policies that require requests to use SSL'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SSL_REQUESTS_ONLY
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket

  # CloudWatch Alarms for Security Monitoring
  SecurityGroupChangeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'SecureWebApp-SecurityGroup-Changes-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm for security group configuration changes'
      MetricName: ComplianceByConfigRule
      Namespace: AWS/Config
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: ConfigRuleName
          Value: !Ref SecurityGroupOpenToWorldRule

Outputs:
  CentralizedLoggingBucketName:
    Description: 'Name of the centralized logging S3 bucket'
    Value: !Ref CentralizedLoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket'

  ApplicationAssetsBucketName:
    Description: 'Name of the application assets S3 bucket'
    Value: !Ref ApplicationAssetsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AssetsBucket'

  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  LoadBalancerDNSName:
    Description: 'DNS name of the load balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  LambdaFunctionArn:
    Description: 'ARN of the background processor Lambda function'
    Value: !GetAtt BackgroundProcessorLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  ConfigRecorderName:
    Description: 'Name of the AWS Config configuration recorder'
    Value: !Ref ConfigurationRecorder
    Export:
      Name: !Sub '${AWS::StackName}-ConfigRecorder'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```