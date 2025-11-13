### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that implements multiple AWS security best practices. Let me break down the requirements:

1. **IAM Management**:
   - IAM users with tightly scoped access policies
   - IAM roles for EC2 instances (no static credentials)
   - Least privilege IAM policies for Lambda functions

2. **Networking**:
   - VPC with proper configuration
   - Security groups restricting SSH to corporate IP range
   - VPC flow logs for network visibility

3. **Encryption**:
   - S3 bucket default encryption
   - RDS encrypted storage
   - SSL certificate for ALB

4. **Monitoring & Auditing**:
   - CloudTrail enabled
   - CloudWatch for monitoring
   - SNS notifications for security alarms

5. **Resource Tagging**:
   - Enforce Environment tag (development, staging, production)

6. **EC2**:
   - Use company-approved AMIs only
   - Use IAM roles instead of static credentials

Let me create a comprehensive CloudFormation YAML template that addresses all these requirements. Since this is quite extensive, I'll structure it with clear sections and include all necessary components.
### Answer 
---

# Secure AWS Infrastructure CloudFormation Template

I'll create a comprehensive CloudFormation template that implements all your security requirements. This template follows AWS best practices for a secure, well-architected infrastructure.

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
    
  ApprovedAMIId:
    Type: AWS::EC2::Image::Id
    Default: ami-0c02fb55731490381  # Replace with your approved AMI
    Description: Company-approved AMI ID for EC2 instances
    
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    Description: RDS database password
    
  NotificationEmail:
    Type: String
    AllowedPattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    Description: Email address for security notifications

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
  
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-app-bucket-${AWS::AccountId}'
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
    Properties:
      BucketName: !Sub '${AWS::StackName}-cloudtrail-${AWS::AccountId}'
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
          
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
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
          
  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, DBInstanceClass]
      Engine: mysql
      EngineVersion: '8.0.28'
      MasterUsername: admin
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
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
          
  # Note: You'll need to import or create an ACM certificate
  # This is a placeholder for the HTTPS listener
  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: CreateHTTPSListener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificate
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
          
  ALBListenerHTTP:
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

  # ==========================================
  # EC2 Instances with Approved AMI
  # ==========================================
  
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref ApprovedAMIId
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
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
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
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${AWS::StackName}'
      RetentionInDays: 90
      
  UnauthorizedAPICallsMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }'
      MetricTransformations:
        - MetricName: UnauthorizedAPICalls
          MetricNamespace: CloudTrailMetrics
          MetricValue: '1'
          
  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      MetricTransformations:
        - MetricName: RootAccountUsage
          MetricNamespace: CloudTrailMetrics
          MetricValue: '1'

  # ==========================================
  # Systems Manager Parameter Store for Secrets
  # ==========================================
  
  DatabasePasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${AWS::StackName}/database/password'
      Type: String
      Value: !Ref DBPassword
      Description: RDS Database Password
      Tags:
        Environment: !Ref EnvironmentType

  # ==========================================
  # SSL Certificate (ACM)
  # ==========================================
  
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub '${AWS::StackName}.example.com'  # Replace with your domain
      SubjectAlternativeNames:
        - !Sub 'www.${AWS::StackName}.example.com'
      DomainValidationOptions:
        - DomainName: !Sub '${AWS::StackName}.example.com'
          ValidationDomain: example.com  # Replace with your domain
      ValidationMethod: DNS
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

# ==========================================
# Conditions
# ==========================================

Conditions:
  CreateHTTPSListener: !Not [!Equals [!Ref SSLCertificate, '']]
  IsProduction: !Equals [!Ref EnvironmentType, production]

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
      
  CloudTrailName:
    Description: CloudTrail Trail Name
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
      
  SNSTopicArn:
    Description: SNS Topic for Security Alarms
    Value: !Ref SecurityAlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic'
      
  LambdaFunctionArn:
    Description: Processing Lambda Function ARN
    Value: !GetAtt ProcessingLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'
```

## Key Security Features Implemented

### 1. **Identity and Access Management**
- IAM roles for EC2 instances (no static credentials)
- Least privilege policies for Lambda functions
- Tightly scoped IAM user policies based on environment tags
- Instance profiles for secure AWS service access

### 2. **Network Security**
- VPC with public and private subnets
- Security groups restricting SSH to corporate IP range
- VPC Flow Logs for network monitoring
- Network segmentation with proper routing

### 3. **Data Encryption**
- S3 buckets with default AES256 encryption
- RDS database with encrypted storage
- SSL/TLS certificate for ALB
- DynamoDB with encryption at rest

### 4. **Monitoring and Auditing**
- CloudTrail for API auditing
- CloudWatch alarms for security events
- VPC Flow Logs for network traffic analysis
- SNS notifications for security alerts
- Log retention policies

### 5. **Resource Management**
- Consistent environment tagging (development, staging, production)
- Company-approved AMI enforcement
- Auto Scaling for availability
- Backup retention for RDS

## Deployment Instructions

1. **Prerequisites**:
   - Update the `CorporateIPRange` parameter with your actual IP range
   - Replace the `ApprovedAMIId` with your company's approved AMI
   - Update the domain name in the SSL certificate section

2. **Deploy the Stack**:
```bash
aws cloudformation create-stack \
  --stack-name secure-infrastructure \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=development \
    ParameterKey=CorporateIPRange,ParameterValue=YOUR_IP_RANGE/32 \
    ParameterKey=ApprovedAMIId,ParameterValue=YOUR_AMI_ID \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
    ParameterKey=NotificationEmail,ParameterValue=security@example.com \
  --capabilities CAPABILITY_IAM \
  --tags Key=Environment,Value=development
```

3. **Post-Deployment**:
   - Confirm the SNS email subscription
   - Validate the ACM certificate (if using DNS validation)
   - Test security alarms and notifications
   - Review CloudTrail logs and VPC Flow Logs

This template provides a robust, secure foundation that can be customized further based on your specific requirements while maintaining security best practices across all AWS services.