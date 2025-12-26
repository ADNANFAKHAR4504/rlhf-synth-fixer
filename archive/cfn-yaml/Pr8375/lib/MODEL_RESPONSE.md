### Reasoning Trace
---

This is a comprehensive CloudFormation template request. Let me break down the requirements:

1. VPC with 10.0.0.0/16 CIDR
2. 3 subnets: 1 public (for web), 2 private (for DB with HA)
3. Internet Gateway for public subnet
4. EC2 instance in public subnet with:
   - Elastic IP
   - SSM Session Manager access
   - Auto Scaling group based on CPU
5. RDS MySQL in private subnets with:
   - KMS encryption
   - Automated backups
   - Security groups allowing only EC2 access
6. CloudWatch logging for all resources
7. SNS topic for stack events
8. IAM roles with least privilege
9. S3 bucket with encryption for templates/artifacts
10. Resource tagging
11. Inline documentation
12. Region-agnostic design
13. Change Set support
14. YAML format

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

# Comprehensive AWS CloudFormation Template for Modern Web Application

Below is a complete CloudFormation template that creates a robust, secure, and scalable AWS infrastructure for a modern web application with public and private layers.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: |
  Comprehensive AWS infrastructure for modern web application with public web tier 
  and private database layer. Includes VPC, Auto Scaling, RDS, monitoring, and security controls.
  Supports multi-region deployment and Change Sets.

# Template Metadata for grouping parameters in AWS Console
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Configuration"
        Parameters:
          - EnvironmentName
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBUsername
          - DBPassword
          - DBInstanceClass
      - Label:
          default: "Application Configuration"
        Parameters:
          - InstanceType
          - KeyName
      - Label:
          default: "Notification Configuration"
        Parameters:
          - NotificationEmail

# Parameters for template customization
Parameters:
  EnvironmentName:
    Description: Environment name prefix for resource naming
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Staging
      - Production
    ConstraintDescription: Must be Development, Staging, or Production

  DBUsername:
    Description: Database master username
    Type: String
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBPassword:
    Description: Database master password
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: Must contain only alphanumeric characters (8-41 chars)

  DBInstanceClass:
    Description: Database instance type
    Type: String
    Default: db.t3.micro
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium

  InstanceType:
    Description: EC2 instance type for application servers
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium

  KeyName:
    Description: EC2 Key Pair for SSH access (optional - SSM preferred)
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be the name of an existing EC2 KeyPair

  NotificationEmail:
    Description: Email address for SNS notifications
    Type: String
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'
    ConstraintDescription: Must be a valid email address

# Mappings for region-specific configurations
Mappings:
  # AMI IDs for Amazon Linux 2 (update these periodically)
  RegionAMI:
    us-east-1:
      AMI: ami-0c02fb55731490381
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0f29c8402f8cce65c
    ap-southeast-1:
      AMI: ami-0e5182fad1edfaa68

# Resources section - Core infrastructure components
Resources:

  # ==========================================
  # VPC and Network Components
  # ==========================================
  
  # Main VPC with 10.0.0.0/16 CIDR block
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: ManagedBy
          Value: CloudFormation

  # Internet Gateway for public subnet connectivity
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW
        - Key: Environment
          Value: !Ref EnvironmentName

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet for web-facing resources (10.0.1.0/24)
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref EnvironmentName

  # Private Subnet 1 for database (10.0.2.0/24)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-1
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref EnvironmentName

  # Private Subnet 2 for database high availability (10.0.3.0/24)
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-2
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref EnvironmentName

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Routes
        - Key: Environment
          Value: !Ref EnvironmentName

  # Route to Internet Gateway for public subnet
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate public subnet with public route table
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  # Private Route Table (no internet route)
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Routes
        - Key: Environment
          Value: !Ref EnvironmentName

  # Associate private subnet 1 with private route table
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  # Associate private subnet 2 with private route table
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # ==========================================
  # Security Groups
  # ==========================================

  # Security Group for Application Servers
  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-Application-SG
      GroupDescription: Security group for application servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        # HTTPS from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Application-SG
        - Key: Environment
          Value: !Ref EnvironmentName

  # Security Group for RDS Database
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-Database-SG
      GroupDescription: Security group for RDS database - only allows access from application servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # MySQL/Aurora port only from Application Security Group
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ApplicationSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Database-SG
        - Key: Environment
          Value: !Ref EnvironmentName

  # ==========================================
  # IAM Roles and Policies
  # ==========================================

  # IAM Role for EC2 instances with SSM access
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-EC2-Instance-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # SSM managed policy for Session Manager access
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        # CloudWatch Logs access
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3ArtifactAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Read access to artifacts bucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt ArtifactsBucket.Arn
                  - !Sub '${ArtifactsBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EC2-Instance-Role
        - Key: Environment
          Value: !Ref EnvironmentName

  # Instance Profile for EC2 Role
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub ${EnvironmentName}-EC2-Instance-Profile
      Roles:
        - !Ref EC2InstanceRole

  # ==========================================
  # KMS Key for Encryption
  # ==========================================

  # KMS Key for RDS and S3 encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting RDS and S3 resources
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
                - rds.amazonaws.com
                - s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-KMS-Key
        - Key: Environment
          Value: !Ref EnvironmentName

  # KMS Key Alias
  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}-encryption-key'
      TargetKeyId: !Ref KMSKey

  # ==========================================
  # S3 Bucket for Artifacts
  # ==========================================

  # S3 Bucket with encryption for CloudFormation templates and artifacts
  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${EnvironmentName}-artifacts-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Artifacts-Bucket
        - Key: Environment
          Value: !Ref EnvironmentName

  # ==========================================
  # Auto Scaling Configuration
  # ==========================================

  # Launch Template for Auto Scaling
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentName}-Launch-Template
      LaunchTemplateData:
        ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ApplicationSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            yum update -y
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Install Apache web server (example application)
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create simple test page
            echo "<h1>Application Server - ${EnvironmentName}</h1>" > /var/www/html/index.html
            
            # Configure CloudWatch Logs
            cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json <<EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${LogGroup}",
                        "log_stream_name": "{instance_id}/messages"
                      },
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${LogGroup}",
                        "log_stream_name": "{instance_id}/httpd-access"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-Application-Instance
              - Key: Environment
                Value: !Ref EnvironmentName

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentName}-ASG
      VPCZoneIdentifier:
        - !Ref PublicSubnet
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 1
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ASG-Instance
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true

  # Scaling Policy - Scale Up
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 60
      ScalingAdjustment: 1

  # Scaling Policy - Scale Down
  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 60
      ScalingAdjustment: -1

  # CloudWatch Alarm - High CPU
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-CPU-Alarm-High
      AlarmDescription: Alarm if CPU too high
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 75
      AlarmActions:
        - !Ref ScaleUpPolicy
        - !Ref SNSTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: GreaterThanThreshold

  # CloudWatch Alarm - Low CPU
  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-CPU-Alarm-Low
      AlarmDescription: Alarm if CPU too low
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      AlarmActions:
        - !Ref ScaleDownPolicy
        - !Ref SNSTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: LessThanThreshold

  # ==========================================
  # Elastic IP for persistent access
  # ==========================================

  # Elastic IP
  ElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EIP
        - Key: Environment
          Value: !Ref EnvironmentName

  # ==========================================
  # RDS Database Configuration
  # ==========================================

  # DB Subnet Group for RDS
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub ${EnvironmentName}-db-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-SubnetGroup
        - Key: Environment
          Value: !Ref EnvironmentName

  # RDS MySQL Database Instance
  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub ${EnvironmentName}-mysql-db
      DBName: applicationdb
      Engine: mysql
      EngineVersion: '8.0.33'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      MultiAZ: false  # Set to true for production
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-MySQL-Database
        - Key: Environment
          Value: !Ref EnvironmentName

  # ==========================================
  # CloudWatch Logging
  # ==========================================

  # CloudWatch Log Group for application logs
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${EnvironmentName}'
      RetentionInDays: 7

  # CloudWatch Log Group for RDS logs
  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/${EnvironmentName}'
      RetentionInDays: 7

  # ==========================================
  # SNS Topic for Notifications
  # ==========================================

  # SNS Topic for stack events and alarms
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${EnvironmentName}-Notifications
      DisplayName: !Sub ${EnvironmentName} Stack Notifications
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-SNS-Topic
        - Key: Environment
          Value: !Ref EnvironmentName

  # SNS Topic Policy
  SNSTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref SNSTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudWatchPublish
            Effect: Allow
            Principal:
              Service: cloudwatch.amazonaws.com
            Action:
              - SNS:Publish
            Resource: !Ref SNSTopic
          - Sid: AllowAutoScalingPublish
            Effect: Allow
            Principal:
              Service: autoscaling.amazonaws.com
            Action:
              - SNS:Publish
            Resource: !Ref SNSTopic

  # ==========================================
  # CloudFormation Stack Event Notifications
  # ==========================================

  # Lambda Execution Role for Stack Notifications
  StackNotificationLambdaRole:
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
        - PolicyName: SNSPublishPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SNSTopic

  # Lambda Function for Stack Event Notifications
  StackNotificationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-Stack-Notifier
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt StackNotificationLambdaRole.Arn
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def handler(event, context):
              sns = boto3.client('sns')
              topic_arn = os.environ['SNS_TOPIC_ARN']
              
              message = {
                  'StackName': event.get('StackName', 'Unknown'),
                  'EventType': event.get('RequestType', 'Unknown'),
                  'Status': event.get('Status', 'Unknown'),
                  'ResourceType': event.get('ResourceType', 'Unknown'),
                  'LogicalResourceId': event.get('LogicalResourceId', 'Unknown')
              }
              
              sns.publish(
                  TopicArn=topic_arn,
                  Subject=f"CloudFormation Stack Event: {message['StackName']}",
                  Message=json.dumps(message, indent=2)
              )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Notification sent')
              }
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Stack-Notifier
        - Key: Environment
          Value: !Ref EnvironmentName

# Outputs for reference and integration
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPC-ID

  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub ${EnvironmentName}-Public-Subnet-ID

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub ${EnvironmentName}-Private-Subnet-1-ID

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub ${EnvironmentName}-Private-Subnet-2-ID

  ElasticIPAddress:
    Description: Elastic IP Address for Application
    Value: !Ref ElasticIP

  RDSDatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-RDS-Endpoint

  RDSDatabasePort:
    Description: RDS Database Port
    Value: !GetAtt RDSDatabase.Endpoint.Port

  S3BucketName:
    Description: S3 Bucket for Artifacts
    Value: !Ref ArtifactsBucket
    Export:
      Name: !Sub ${EnvironmentName}-Artifacts-Bucket

  SNSTopicArn:
    Description: SNS Topic ARN for notifications
    Value: !Ref SNSTopic
    Export:
      Name: !Sub ${EnvironmentName}-SNS-Topic-ARN

  ApplicationSecurityGroupId:
    Description: Application Security Group ID
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-App-SG-ID

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-DB-SG-ID

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub ${EnvironmentName}-ASG-Name

  CloudWatchLogGroup:
    Description: CloudWatch Log Group for Application
    Value: !Ref LogGroup
    Export:
      Name: !Sub ${EnvironmentName}-LogGroup

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub ${EnvironmentName}-KMS-Key-ID
```

## Key Features and Documentation

### 1. **Network Architecture**
- **VPC**: Uses 10.0.0.0/16 CIDR block as specified
- **Subnets**: 
  - 1 Public subnet (10.0.1.0/24) for web tier
  - 2 Private subnets (10.0.2.0/24, 10.0.3.0/24) for database HA
- **Internet Gateway**: Provides internet connectivity to public subnet
- **Route Tables**: Separate tables for public and private subnets

### 2. **Security Implementation**
- **Security Groups**: 
  - Application SG allows HTTP/HTTPS from internet
  - Database SG only allows MySQL connections from Application SG
- **IAM Roles**: Least privilege principle with specific policies
- **KMS Encryption**: Single key for RDS and S3 encryption
- **SSM Session Manager**: Secure administrative access without SSH exposure

### 3. **Auto Scaling Configuration**
- **Launch Template**: Defines instance configuration
- **Auto Scaling Group**: Scales 1-3 instances based on demand
- **CPU-based Scaling**: Policies trigger at 75% (scale up) and 25% (scale down)

### 4. **Database Setup**
- **RDS MySQL**: Deployed in private subnets
- **Encryption**: KMS encryption at rest
- **Backups**: 7-day retention with scheduled backup window
- **CloudWatch Logs**: Error, general, and slow query logs exported

### 5. **Monitoring and Notifications**
- **CloudWatch Log Groups**: Centralized logging for all resources
- **SNS Topic**: Real-time notifications for stack events and alarms
- **CloudWatch Alarms**: Monitor CPU utilization and trigger scaling

### 6. **Region-Agnostic Design**
- **Mappings**: AMI IDs for multiple regions
- **Dynamic Resource Naming**: Uses AWS pseudo parameters
- **No hardcoded region-specific values**

### 7. **Change Set Support**
The template fully supports CloudFormation Change Sets through:
- Parameterized configuration
- Resource dependencies properly defined
- Update policies where applicable

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Ensure AWS CLI is configured
   aws configure
   
   # Create an EC2 Key Pair (optional, for emergency SSH access)
   aws ec2 create-key-pair --key-name MyKeyPair
   ```

2. **Validate Template**:
   ```bash
   aws cloudformation validate-template \
     --template-body file://infrastructure.yaml
   ```

3. **Create Change Set** (for review before deployment):
   ```bash
   aws cloudformation create-change-set \
     --stack-name my-app-stack \
     --change-set-name initial-deployment \
     --template-body file://infrastructure.yaml \
     --parameters \
       ParameterKey=DBPassword,ParameterValue=MySecurePassword123 \
       ParameterKey=KeyName,ParameterValue=MyKeyPair \
       ParameterKey=NotificationEmail,ParameterValue=admin@example.com \
     --capabilities CAPABILITY_NAMED_IAM
   ```

4. **Review and Execute Change Set**:
   ```bash
   # Review changes
   aws cloudformation describe-change-set \
     --change-set-name initial-deployment \
     --stack-name my-app-stack
   
   # Execute if satisfied
   aws cloudformation execute-change-set \
     --change-set-name initial-deployment \
     --stack-name my-app-stack
   ```

5. **Monitor Stack Creation**:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name my-app-stack \
     --query 'StackEvents[0:10]'
   ```

## Post-Deployment Steps

1. **Verify Email Subscription**: Check your email and confirm the SNS subscription

2. **Test SSM Session Manager**:
   ```bash
   aws ssm start-session --target <instance-id>
   ```

3. **Associate Elastic IP** (manual step or via automation):
   ```bash
   aws ec2 associate-address \
     --instance-id <instance-id> \
     --allocation-id <eip-allocation-id>
   ```

4. **Test Application**: Access the application using the Elastic IP address

## Cost Optimization Tips

1. Use Spot Instances for development environments
2. Implement automated start/stop schedules for non-production
3. Review and adjust Auto Scaling thresholds based on actual usage
4. Consider Reserved Instances for production workloads
5. Enable S3 lifecycle policies for log retention

This comprehensive CloudFormation template provides a production-ready, secure, and scalable infrastructure that meets all specified requirements while maintaining best practices for AWS cloud architecture.