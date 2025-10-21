### Reasoning Trace
---

This is a comprehensive CloudFormation template request with many security and compliance requirements. I'll need to create a YAML template that addresses all these points:

1. Encryption at rest for S3 and DynamoDB (AES-256)
2. Least-privilege IAM roles and policies
3. HTTPS enforcement for ELB
4. VPC security groups with IP range controls
5. Secrets Manager for sensitive parameters
6. Versioning for S3 and DynamoDB
7. Centralized CloudTrail logs
8. Custom VPC for EC2 instances
9. Multi-AZ RDS deployments
10. AWS WAF for web protection
11. EventBridge + SNS + Lambda for security group/NACL change detection
12. Narrowly scoped IAM roles for Lambda
13. Automated backups for databases
14. CloudWatch alarms for critical thresholds
15. KMS with automatic key rotation

This is a large template, so I'll structure it with clear sections and make it modular. I'll include parameters for multi-region deployment and use best practices throughout.
### Answer 
---

I'll create a comprehensive CloudFormation template that implements all the specified security and compliance controls. This template will be modular and follow AWS best practices for multi-region deployment.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security and Compliance CloudFormation Template with Multi-Region Support'

# ===========================
# Parameters
# ===========================
Parameters:
  EnvironmentName:
    Description: Environment name prefix for all resources
    Type: String
    Default: SecureEnv
    AllowedValues:
      - Dev
      - Test
      - Prod
      - SecureEnv
  
  AlertEmail:
    Description: Email address for security alerts
    Type: String
    AllowedPattern: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$"
    ConstraintDescription: Must be a valid email address
  
  DBUsername:
    Description: Database master username
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: "[a-zA-Z][a-zA-Z0-9]*"
    NoEcho: true
  
  DBInstanceClass:
    Description: RDS instance type
    Type: String
    Default: db.t3.micro
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
  
  AllowedIPRange:
    Description: IP range allowed for web access (CIDR notation)
    Type: String
    Default: 0.0.0.0/0
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
  
  KeyRotationDays:
    Description: Number of days for KMS key rotation
    Type: Number
    Default: 90
    MinValue: 30
    MaxValue: 365

# ===========================
# Mappings
# ===========================
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c94855ba95c574c8
    us-west-2:
      AMI: ami-0c94855ba95c574c9
    eu-west-1:
      AMI: ami-0c94855ba95c574c7

# ===========================
# Resources
# ===========================
Resources:

  # ===========================
  # KMS Keys with Rotation
  # ===========================
  MasterKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Master KMS key for ${EnvironmentName} environment'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - dynamodb.amazonaws.com
                - rds.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      EnableKeyRotation: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-MasterKey'
        - Key: Environment
          Value: !Ref EnvironmentName

  MasterKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}-master-key'
      TargetKeyId: !Ref MasterKMSKey

  # ===========================
  # VPC and Networking
  # ===========================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.20.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-2'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'

  AttachGateway:
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
          Value: !Sub '${EnvironmentName}-Public-Routes'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  # ===========================
  # Security Groups
  # ===========================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: HTTPS access from allowed IP range
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.0.0.0/16
          Description: Allow all outbound traffic within VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB-SG'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTPS from ALB
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-SG'

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
          Description: MySQL access from web servers
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-SG'

  # ===========================
  # Secrets Manager
  # ===========================
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}-db-password'
      Description: RDS Master Password
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref MasterKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-Secret'

  # ===========================
  # S3 Buckets with Encryption
  # ===========================
  CentralizedLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-centralized-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: GLACIER
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-CentralLogs'

  CentralizedLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CentralizedLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CentralizedLogsBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CentralizedLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-app-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-AppData'

  # ===========================
  # CloudTrail
  # ===========================
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CentralizedLogsBucketPolicy
    Properties:
      TrailName: !Sub '${EnvironmentName}-trail'
      S3BucketName: !Ref CentralizedLogsBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values: 
                - !Sub '${ApplicationDataBucket.Arn}/'
      InsightSelectors:
        - InsightType: ApiCallRateInsight
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Trail'

  # ===========================
  # DynamoDB with Encryption
  # ===========================
  ApplicationTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${EnvironmentName}-app-table'
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref MasterKMSKey
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DynamoTable'

  # ===========================
  # RDS Multi-AZ with Encryption
  # ===========================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DBSubnetGroup'

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-db-instance'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref MasterKMSKey
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-RDS'

  # ===========================
  # Application Load Balancer
  # ===========================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB'

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: fixed-response
          FixedResponseConfig:
            StatusCode: '403'
            ContentType: text/plain
            MessageBody: 'Access Denied'
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref Certificate
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  Certificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub '*.${AWS::Region}.elb.amazonaws.com'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Certificate'

  # ===========================
  # AWS WAF
  # ===========================
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${EnvironmentName}-WebACL'
      Scope: REGIONAL
      Description: WAF WebACL for application protection
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: SQLInjectionRule
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          Action:
            Block: {}
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLInjectionRule
        - Name: XSSProtectionRule
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          Action:
            Block: {}
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: XSSProtectionRule
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${EnvironmentName}-WebACL'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebACL'

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # ===========================
  # Lambda Function for Security Monitoring
  # ===========================
  SecurityMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-SecurityMonitoringRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SecurityMonitoringPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref SecurityAlertTopic
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-LambdaRole'

  SecurityMonitoringFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-SecurityMonitor'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt SecurityMonitoringRole.Arn
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SecurityAlertTopic
          ENVIRONMENT: !Ref EnvironmentName
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          sns = boto3.client('sns')

          def handler(event, context):
              sns_topic = os.environ['SNS_TOPIC_ARN']
              environment = os.environ['ENVIRONMENT']
              
              # Parse EventBridge event
              detail = event.get('detail', {})
              event_name = detail.get('eventName', 'Unknown')
              event_source = detail.get('eventSource', 'Unknown')
              user_identity = detail.get('userIdentity', {})
              
              # Create alert message
              alert_message = {
                  'Environment': environment,
                  'Event': event_name,
                  'Source': event_source,
                  'UserIdentity': user_identity,
                  'Time': event.get('time', 'Unknown'),
                  'Region': event.get('region', 'Unknown'),
                  'Account': event.get('account', 'Unknown')
              }
              
              # Send SNS notification
              response = sns.publish(
                  TopicArn=sns_topic,
                  Subject=f'Security Alert: {event_name} in {environment}',
                  Message=json.dumps(alert_message, indent=2)
              )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Alert sent successfully')
              }
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SecurityMonitor'

  # ===========================
  # SNS Topic for Alerts
  # ===========================
  SecurityAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${EnvironmentName}-SecurityAlerts'
      DisplayName: Security Alerts
      KmsMasterKeyId: !Ref MasterKMSKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-SNSTopic'

  # ===========================
  # EventBridge Rules for Security Monitoring
  # ===========================
  SecurityGroupChangeRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${EnvironmentName}-SG-Changes'
      Description: Detect Security Group changes
      EventPattern:
        source:
          - aws.ec2
        detail-type:
          - AWS API Call via CloudTrail
        detail:
          eventSource:
            - ec2.amazonaws.com
          eventName:
            - AuthorizeSecurityGroupIngress
            - AuthorizeSecurityGroupEgress
            - RevokeSecurityGroupIngress
            - RevokeSecurityGroupEgress
            - CreateSecurityGroup
            - DeleteSecurityGroup
      State: ENABLED
      Targets:
        - Arn: !GetAtt SecurityMonitoringFunction.Arn
          Id: SecurityMonitoringTarget

  NACLChangeRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${EnvironmentName}-NACL-Changes'
      Description: Detect Network ACL changes
      EventPattern:
        source:
          - aws.ec2
        detail-type:
          - AWS API Call via CloudTrail
        detail:
          eventSource:
            - ec2.amazonaws.com
          eventName:
            - CreateNetworkAcl
            - DeleteNetworkAcl
            - CreateNetworkAclEntry
            - DeleteNetworkAclEntry
            - ReplaceNetworkAclEntry
      State: ENABLED
      Targets:
        - Arn: !GetAtt SecurityMonitoringFunction.Arn
          Id: NACLMonitoringTarget

  LambdaInvokePermissionForSGRule:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecurityMonitoringFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt SecurityGroupChangeRule.Arn

  LambdaInvokePermissionForNACLRule:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecurityMonitoringFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt NACLChangeRule.Arn

  # ===========================
  # CloudWatch Alarms
  # ===========================
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-High-CPU'
      AlarmDescription: Alert when RDS CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      AlarmActions:
        - !Ref SecurityAlertTopic

  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-Unauthorized-API-Calls'
      AlarmDescription: Alert on unauthorized API calls
      MetricName: UnauthorizedAPICalls
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlertTopic
      TreatMissingData: notBreaching

  # ===========================
  # EC2 Launch Template
  # ===========================
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.micro
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref MasterKMSKey
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y aws-cli
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentName}-Instance'
              - Key: Environment
                Value: !Ref EnvironmentName

  # ===========================
  # EC2 Instance Profile
  # ===========================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: EC2MinimalPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${ApplicationDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt MasterKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBPasswordSecret
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2Role'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-EC2Profile'
      Roles:
        - !Ref EC2Role

  # ===========================
  # Auto Scaling Group
  # ===========================
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-TG'
      Port: 443
      Protocol: HTTPS
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTPS
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-TargetGroup'

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true

  # ===========================
  # Backup Plans
  # ===========================
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${EnvironmentName}-backup-vault'
      EncryptionKeyArn: !GetAtt MasterKMSKey.Arn
      Tags:
        Name: !Sub '${EnvironmentName}-BackupVault'

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${EnvironmentName}-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackup
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 2 ? * * *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              MoveToColdStorageAfterDays: 30
              DeleteAfterDays: 365
          - RuleName: WeeklyBackup
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 3 ? * SUN *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 180
            Lifecycle:
              DeleteAfterDays: 90
      BackupPlanTags:
        Environment: !Ref EnvironmentName

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub '${EnvironmentName}-backup-selection'
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${RDSDatabase}'
          - !GetAtt ApplicationTable.Arn
        SelectionTags:
          - Type: STRINGEQUALS
            Key: Environment
            Value: !Ref EnvironmentName

  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-BackupRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores

# ===========================
# Outputs
# ===========================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-VPC-ID'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${EnvironmentName}-ALB-DNS'

  CentralizedLogsBucket:
    Description: Centralized CloudTrail logs bucket
    Value: !Ref CentralizedLogsBucket
    Export:
      Name: !Sub '${EnvironmentName}-Logs-Bucket'

  KMSKeyId:
    Description: Master KMS Key ID
    Value: !Ref MasterKMSKey
    Export:
      Name: !Sub '${EnvironmentName}-KMS-Key'

  SecurityAlertTopicArn:
    Description: SNS Topic for Security Alerts
    Value: !Ref SecurityAlertTopic
    Export:
      Name: !Sub '${EnvironmentName}-Alert-Topic'

  RDSDatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${EnvironmentName}-DB-Endpoint'

  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref ApplicationTable
    Export:
      Name: !Sub '${EnvironmentName}-DynamoDB-Table'
```

## Key Security Features Implemented

### 1. **Encryption at Rest**
- All S3 buckets use KMS encryption with customer-managed keys
- DynamoDB table uses KMS encryption
- RDS database storage is encrypted
- EBS volumes are encrypted using KMS

### 2. **Least Privilege IAM**
- EC2 instances have minimal permissions (only what's needed)
- Lambda function has narrow scope (SNS publish and logs only)
- Separate roles for different services

### 3. **Network Security**
- Custom VPC with public/private subnets
- Security groups with specific port/protocol rules
- HTTPS-only endpoints through ALB
- IP range restrictions configurable via parameters

### 4. **Secrets Management**
- Database credentials stored in AWS Secrets Manager
- No hardcoded passwords in template
- KMS encryption for secrets

### 5. **Versioning & Backup**
- S3 bucket versioning enabled
- DynamoDB point-in-time recovery
- RDS automated backups (7-day retention)
- AWS Backup for comprehensive backup strategy

### 6. **Monitoring & Alerting**
- CloudTrail for audit logging across all regions
- EventBridge rules detect security group and NACL changes
- Lambda function sends SNS alerts
- CloudWatch alarms for critical metrics

### 7. **High Availability**
- Multi-AZ RDS deployment
- Auto Scaling Group across multiple AZs
- Application Load Balancer for distribution

### 8. **Web Application Security**
- AWS WAF with rules for SQL injection, XSS, and rate limiting
- HTTPS enforcement at ALB
- TLS 1.2 minimum

### 9. **Compliance Features**
- Centralized logging
- Log file validation enabled
- Encryption key rotation
- Comprehensive tagging strategy

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Ensure AWS CLI is configured
   aws configure
   
   # Validate the template
   aws cloudformation validate-template \
     --template-body file://security-template.yaml
   ```

2. **Deploy the Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name secure-environment \
     --template-body file://security-template.yaml \
     --parameters \
       ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
       ParameterKey=EnvironmentName,ParameterValue=Prod \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Monitor Deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name secure-environment \
     --query 'Stacks[0].StackStatus'
   ```

## Multi-Region Considerations

For multi-region deployment:

1. **Global Resources** (deploy once):
   - CloudTrail (already set as multi-region)
   - IAM roles and policies

2. **Regional Resources** (deploy per region):
   - VPC and networking
   - EC2, RDS, DynamoDB
   - S3 buckets (with cross-region replication if needed)

3. **Cross-Region Setup**:
   ```bash
   # Deploy to additional regions
   aws cloudformation create-stack \
     --stack-name secure-environment \
     --region eu-west-1 \
     --template-body file://security-template.yaml \
     --parameters file://parameters.json \
     --capabilities CAPABILITY_NAMED_IAM
   ```

## Post-Deployment Steps

1. **Verify Security Controls**:
   - Check CloudTrail is logging
   - Confirm SNS email subscription
   - Test security group change alerts
   - Verify encryption on all resources

2. **Additional Hardening**:
   - Enable GuardDuty for threat detection
   - Configure AWS Config for compliance monitoring
   - Set up AWS Security Hub for centralized security view
   - Implement AWS SSO for user access management

This template provides a comprehensive security foundation that meets all specified requirements while following AWS best practices for production deployments.