```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with Best Practices for Identity, Networking, Encryption, and Monitoring'

# Parameters for customization
Parameters:
  EnvironmentType:
    Type: String
    Default: development
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment type for resource tagging
    
  CorporateIPRange:
    Type: String
    Default: '203.0.113.0/24'  # Replace with your corporate IP range
    Description: Corporate IP range for SSH access
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI from SSM Parameter Store

  CreateCloudTrail:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Create CloudTrail resources (AWS limit is 5 trails per region - set to false if limit reached)

# Mappings for environment-specific configurations
Mappings:
  EnvironmentConfig:
    development:
      InstanceType: t3.micro
      DBInstanceClass: db.t3.micro
      MultiAZ: false
    staging:
      InstanceType: t3.small
      DBInstanceClass: db.t3.small
      MultiAZ: false
    production:
      InstanceType: t3.medium
      DBInstanceClass: db.t3.small
      MultiAZ: true

Conditions:
  ShouldCreateCloudTrail: !Equals [!Ref CreateCloudTrail, 'true']

Resources:
  # ==========================================
  # VPC and Networking Configuration
  # ==========================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentType
          
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Environment
          Value: !Ref EnvironmentType
          
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Environment
          Value: !Ref EnvironmentType
          
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Environment
          Value: !Ref EnvironmentType
          
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.20.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Environment
          Value: !Ref EnvironmentType
          
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentType
          
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
          Value: !Sub '${AWS::StackName}-PublicRT'
        - Key: Environment
          Value: !Ref EnvironmentType
          
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
      
  SubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable
      
  SubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # ==========================================
  # VPC Flow Logs
  # ==========================================
  
  VPCFlowLogRole:
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
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
          
  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${AWS::StackName}'
      RetentionInDays: 30
      
  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPCFlowLog'
        - Key: Environment
          Value: !Ref EnvironmentType

  # ==========================================
  # Security Groups
  # ==========================================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'
        - Key: Environment
          Value: !Ref EnvironmentType
          
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref CorporateIPRange
          Description: SSH access from corporate network only
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG'
        - Key: Environment
          Value: !Ref EnvironmentType
          
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
          Value: !Sub '${AWS::StackName}-DB-SG'
        - Key: Environment
          Value: !Ref EnvironmentType

  # ==========================================
  # IAM Roles and Policies
  # ==========================================
  
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
        - PolicyName: S3AccessPolicy
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
        - PolicyName: SSMAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${AWS::StackName}/*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
          
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole
        
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
        - PolicyName: LeastPrivilegeLambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub '${ApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                Resource: !GetAtt ApplicationTable.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
          
  DeveloperUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub '${AWS::StackName}-developer'
      Policies:
        - PolicyName: DeveloperPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:Describe*
                  - ec2:StartInstances
                  - ec2:StopInstances
                  - ec2:RebootInstances
                Resource: '*'
                Condition:
                  StringEquals:
                    'ec2:ResourceTag/Environment': !Ref EnvironmentType
              - Effect: Allow
                Action:
                  - s3:ListBucket
                  - s3:GetObject
                Resource:
                  - !GetAtt ApplicationBucket.Arn
                  - !Sub '${ApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - cloudwatch:GetMetricData
                  - cloudwatch:GetMetricStatistics
                  - cloudwatch:ListMetrics
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # ==========================================
  # S3 Buckets with Encryption
  # ==========================================

  EmptyS3BucketLambdaRole:
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
        - PolicyName: EmptyS3BucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:ListBucket
                  - s3:ListBucketVersions
                  - s3:DeleteObject
                  - s3:DeleteObjectVersion
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  EmptyS3BucketLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-EmptyS3Bucket'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt EmptyS3BucketLambdaRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          import boto3
          import cfnresponse
          def handler(event, context):
              try:
                  if event['RequestType'] == 'Delete':
                      bucket_name = event['ResourceProperties']['BucketName']
                      s3 = boto3.resource('s3')
                      bucket = s3.Bucket(bucket_name)
                      bucket.object_versions.all().delete()
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'app-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
          
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Condition: ShouldCreateCloudTrail
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'cloudtrail-bucket-${AWS::AccountId}-${AWS::Region}'
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
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  EmptyCloudTrailBucket:
    Type: Custom::EmptyS3Bucket
    Condition: ShouldCreateCloudTrail
    Properties:
      ServiceToken: !GetAtt EmptyS3BucketLambda.Arn
      BucketName: !Ref CloudTrailBucket
          
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: ShouldCreateCloudTrail
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # ==========================================
  # RDS Database with Encryption
  # ==========================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '/${AWS::StackName}/database/password'
      Description: RDS Database Master Password
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: "password"
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, DBInstanceClass]
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      DeletionProtection: false
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, MultiAZ]
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # ==========================================
  # CloudTrail for Auditing
  # ==========================================
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Condition: ShouldCreateCloudTrail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-trail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${ApplicationBucket.Arn}/'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # ==========================================
  # Application Load Balancer with SSL
  # ==========================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
          
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
          
  # Note: HTTPS listener requires ACM certificate - configure separately if needed
  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ==========================================
  # EC2 Instances with Approved AMI
  # ==========================================
  
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, InstanceType]
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Instance'
              - Key: Environment
                Value: !Ref EnvironmentType
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "metrics": {
                "namespace": "${AWS::StackName}",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MemoryUtilization"}
                    ]
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DiskUtilization"}
                    ],
                    "resources": ["/"]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentType
          PropagateAtLaunch: true

  # ==========================================
  # Lambda Function with Least Privilege
  # ==========================================
  
  ApplicationTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-AppTable'
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
        - Key: Environment
          Value: !Ref EnvironmentType
          
  ProcessingLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-ProcessingFunction'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def handler(event, context):
              # Example Lambda function with least privilege access
              dynamodb = boto3.resource('dynamodb')
              table = dynamodb.Table(os.environ['TABLE_NAME'])
              
              # Process event
              response = {
                  'statusCode': 200,
                  'body': json.dumps('Processing completed successfully')
              }
              return response
      Environment:
        Variables:
          TABLE_NAME: !Ref ApplicationTable
      ReservedConcurrentExecutions: 10
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # ==========================================
  # CloudWatch Alarms and SNS Notifications
  # ==========================================
  
  SecurityAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: Security Alarms
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
          
  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-UnauthorizedAPICalls'
      AlarmDescription: Alert on unauthorized API calls
      MetricName: UnauthorizedAPICalls
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic
      TreatMissingData: notBreaching
        
  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-RootAccountUsage'
      AlarmDescription: Alert when root account is used
      MetricName: RootAccountUsage
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic
      TreatMissingData: notBreaching
        
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: Alert when CPU utilization is high
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      TreatMissingData: breaching
        
  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DatabaseConnections'
      AlarmDescription: Alert on high database connections
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 40
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      TreatMissingData: notBreaching

  # ==========================================
  # CloudWatch Log Groups and Metric Filters
  # ==========================================
  
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Condition: ShouldCreateCloudTrail
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${AWS::StackName}'
      RetentionInDays: 90
      
  UnauthorizedAPICallsMetricFilter:
    Type: AWS::Logs::MetricFilter
    Condition: ShouldCreateCloudTrail
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }'
      MetricTransformations:
        - MetricName: UnauthorizedAPICalls
          MetricNamespace: CloudTrailMetrics
          MetricValue: '1'
          
  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    Condition: ShouldCreateCloudTrail
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      MetricTransformations:
        - MetricName: RootAccountUsage
          MetricNamespace: CloudTrailMetrics
          MetricValue: '1'

  # ==========================================
  # SSL Certificate (ACM) - Optional
  # ==========================================
  # Note: SSL Certificate creation requires domain ownership validation
  # Create separately via AWS Console or CLI if HTTPS is needed

# ==========================================
# Outputs
# ==========================================

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
      
  LoadBalancerURL:
    Description: Application Load Balancer URL
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-URL'
      
  S3BucketName:
    Description: Application S3 Bucket Name
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'
      
  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  DatabasePasswordSecret:
    Description: RDS Database Password Secret ARN
    Value: !Ref DBPasswordSecret
    Export:
      Name: !Sub '${AWS::StackName}-DB-Password-Secret'

  CloudTrailName:
    Condition: ShouldCreateCloudTrail
    Description: CloudTrail Trail Name
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
      
  SNSTopicArn:
    Description: SNS Topic for Security Alarms - Subscribe via AWS Console or CLI to receive notifications
    Value: !Ref SecurityAlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic'
      
  LambdaFunctionArn:
    Description: Processing Lambda Function ARN
    Value: !GetAtt ProcessingLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'

  LambdaFunctionName:
    Description: Processing Lambda Function Name
    Value: !Ref ProcessingLambda
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Name'

  DynamoDBTableName:
    Description: Application DynamoDB Table Name
    Value: !Ref ApplicationTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  DynamoDBTableArn:
    Description: Application DynamoDB Table ARN
    Value: !GetAtt ApplicationTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-ARN'

  VPCFlowLogGroup:
    Description: VPC Flow Logs CloudWatch Log Group Name
    Value: !Ref VPCFlowLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-VPC-FlowLogs'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  LaunchTemplateName:
    Description: EC2 Launch Template Name
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-LaunchTemplate'

  ALBSecurityGroupId:
    Description: Application Load Balancer Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-SG'

  WebServerSecurityGroupId:
    Description: Web Server Security Group ID
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-SG'

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Database-SG'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2'

  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-IGW'

  ALBTargetGroupArn:
    Description: Application Load Balancer Target Group ARN
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-TG'

  EC2InstanceRoleArn:
    Description: EC2 Instance Role ARN
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Role'

  LambdaExecutionRoleArn:
    Description: Lambda Execution Role ARN
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Role'

  DeveloperUserArn:
    Description: Developer IAM User ARN
    Value: !GetAtt DeveloperUser.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Developer-User'

  CloudTrailBucketName:
    Condition: ShouldCreateCloudTrail
    Description: CloudTrail S3 Bucket Name
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Bucket'

  DBSubnetGroupName:
    Description: RDS DB Subnet Group Name
    Value: !Ref DBSubnetGroup
    Export:
      Name: !Sub '${AWS::StackName}-DB-SubnetGroup'

  UnauthorizedAPICallsAlarmName:
    Description: Unauthorized API Calls Alarm Name
    Value: !Ref UnauthorizedAPICallsAlarm
    Export:
      Name: !Sub '${AWS::StackName}-UnauthorizedAPICalls-Alarm'

  RootAccountUsageAlarmName:
    Description: Root Account Usage Alarm Name
    Value: !Ref RootAccountUsageAlarm
    Export:
      Name: !Sub '${AWS::StackName}-RootAccountUsage-Alarm'

  HighCPUAlarmName:
    Description: High CPU Alarm Name
    Value: !Ref HighCPUAlarm
    Export:
      Name: !Sub '${AWS::StackName}-HighCPU-Alarm'

  DatabaseConnectionsAlarmName:
    Description: Database Connections Alarm Name
    Value: !Ref DatabaseConnectionsAlarm
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseConnections-Alarm'
```