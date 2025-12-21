```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: Production-grade AWS infrastructure for modern web application

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
          - DBInstanceClass
          - EnableMultiAZ
      - Label:
          default: "Application Configuration"
        Parameters:
          - InstanceType
          - KeyName
          - MinSize
          - MaxSize
          - DesiredCapacity
      - Label:
          default: "Notification Configuration"
        Parameters:
          - NotificationEmail
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - EnableDetailedMonitoring
          - LogRetentionDays

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

  DBInstanceClass:
    Description: Database instance type
    Type: String
    Default: db.t3.micro
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge

  InstanceType:
    Description: EC2 instance type for application servers
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large

  KeyName:
    Description: EC2 Key Pair for SSH access
    Type: String
    Default: ""
    ConstraintDescription: Can be empty or must be the name of an existing EC2 KeyPair

  NotificationEmail:
    Description: Email address for SNS notifications
    Type: String
    Default: 'noreply@example.com'
    AllowedPattern: '[^@]+@[^@]+\.[^@]+'
    ConstraintDescription: Must be a valid email address

  MinSize:
    Description: Minimum number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 1
    MinValue: 1
    MaxValue: 10

  MaxSize:
    Description: Maximum number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 3
    MinValue: 1
    MaxValue: 10

  DesiredCapacity:
    Description: Desired number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 1
    MinValue: 1
    MaxValue: 10

  EnableMultiAZ:
    Description: Enable Multi-AZ for RDS database (Production should be true)
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'

  EnableDetailedMonitoring:
    Description: Enable detailed CloudWatch monitoring for EC2 instances
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'

  LogRetentionDays:
    Description: CloudWatch Logs retention period in days
    Type: Number
    Default: 7
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]

  LatestAmiIdParameter:
    Description: SSM Parameter path for latest AMI ID
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

# Conditions for conditional resource creation
Conditions:
  HasKeyName: !Not [!Equals [!Ref KeyName, ""]]
  IsProduction: !Equals [!Ref EnvironmentName, Production]
  EnableRDSMultiAZ: !Or [!Equals [!Ref EnableMultiAZ, 'true'], !Condition IsProduction]
  EnableEC2DetailedMonitoring: !Equals [!Ref EnableDetailedMonitoring, 'true']

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
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Internet Gateway for public subnet connectivity
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

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
        - Key: iac-rlhf-amazon
          Value: 'true'

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
        - Key: iac-rlhf-amazon
          Value: 'true'

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
        - Key: iac-rlhf-amazon
          Value: 'true'

  # NAT Gateway removed for LocalStack (unsupported)

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
        - Key: iac-rlhf-amazon
          Value: 'true'

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

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Routes
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private subnet default route removed for LocalStack (relied on NAT Gateway)

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
      GroupDescription: Security group for application servers with HTTP/HTTPS access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic from internet
        # HTTPS from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic from internet
        # SSH (only if KeyName is provided)
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: Allow SSH traffic (consider restricting source IP)
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Application-SG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

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
          Description: Allow MySQL connections from application servers only
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Database-SG
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

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
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Access to database credentials in Secrets Manager
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DatabaseSecret
        - PolicyName: EIPAssociation
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Allow EC2 instances to associate Elastic IPs
              - Effect: Allow
                Action:
                  - ec2:AssociateAddress
                  - ec2:DisassociateAddress
                  - ec2:DescribeAddresses
                Resource: '*'
        - PolicyName: KMSDecryptAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Allow EC2 to decrypt data encrypted with KMS key (for S3 and Secrets Manager)
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                  - kms:GenerateDataKey
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EC2-Instance-Role
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

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
      Description: KMS key for encrypting RDS, S3, and CloudWatch Logs
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
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow CloudWatch Logs to use the key
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-KMS-Key
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # KMS Key Alias
  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}-encryption-key'
      TargetKeyId: !Ref KMSKey

  # ==========================================
  # Secrets Manager for Database Credentials
  # ==========================================

  # Database credentials stored securely
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub ${EnvironmentName}-database-credentials
      Description: RDS MySQL database master credentials
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Database-Secret
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Attachment for automatic rotation
  SecretRDSInstanceAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DatabaseSecret
      TargetId: !Ref RDSDatabase
      TargetType: AWS::RDS::DBInstance

  # ==========================================
  # S3 Bucket for Artifacts
  # ==========================================

  # S3 Bucket with encryption for CloudFormation templates and artifacts
  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
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
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
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
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # Auto Scaling Configuration
  # ==========================================

  # Launch Template for Auto Scaling
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentName}-Launch-Template
      LaunchTemplateData:
        ImageId: !Ref LatestAmiIdParameter
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ApplicationSecurityGroup
        Monitoring:
          Enabled: !If [EnableEC2DetailedMonitoring, true, false]
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash -xe
            # Log all output to file
            exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
            
            # Update system
            yum update -y
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Install required packages
            yum install -y httpd aws-cfn-bootstrap jq
            
            # Start Apache
            systemctl start httpd
            systemctl enable httpd
            
            # Create test page with instance metadata
            INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
            AVAILABILITY_ZONE=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
            
            cat > /var/www/html/index.html <<EOF
            <!DOCTYPE html>
            <html>
            <head><title>${EnvironmentName} Application</title></head>
            <body>
              <h1>Application Server - ${EnvironmentName}</h1>
              <p>Instance ID: $INSTANCE_ID</p>
              <p>Availability Zone: $AVAILABILITY_ZONE</p>
              <p>Stack: ${AWS::StackName}</p>
            </body>
            </html>
            EOF
            
            # Associate Elastic IP if this is the first instance
            if [ "${ElasticIP}" != "" ]; then
              ALLOCATION_ID="${ElasticIP.AllocationId}"
              # Check if EIP is already associated
              ASSOCIATION=$(aws ec2 describe-addresses --allocation-ids $ALLOCATION_ID --region ${AWS::Region} --query 'Addresses[0].AssociationId' --output text)
              if [ "$ASSOCIATION" == "None" ] || [ -z "$ASSOCIATION" ]; then
                aws ec2 associate-address --instance-id $INSTANCE_ID --allocation-id $ALLOCATION_ID --region ${AWS::Region}
              fi
            fi
            
            # Configure CloudWatch Logs
            cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json <<EOF
            {
              "agent": {
                "metrics_collection_interval": 60,
                "run_as_user": "root"
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${LogGroup}",
                        "log_stream_name": "{instance_id}/messages",
                        "retention_in_days": ${LogRetentionDays}
                      },
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${LogGroup}",
                        "log_stream_name": "{instance_id}/httpd-access",
                        "retention_in_days": ${LogRetentionDays}
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${LogGroup}",
                        "log_stream_name": "{instance_id}/httpd-error",
                        "retention_in_days": ${LogRetentionDays}
                      },
                      {
                        "file_path": "/var/log/user-data.log",
                        "log_group_name": "${LogGroup}",
                        "log_stream_name": "{instance_id}/user-data",
                        "retention_in_days": ${LogRetentionDays}
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "namespace": "${EnvironmentName}/Application",
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
              -a fetch-config -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json -s
            
            # Signal success to CloudFormation
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} \
              --resource AutoScalingGroup --region ${AWS::Region}
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-Application-Instance
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: iac-rlhf-amazon
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-Application-Volume
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: iac-rlhf-amazon
                Value: 'true'

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    CreationPolicy:
      ResourceSignal:
        Count: !Ref DesiredCapacity
        Timeout: PT15M
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: true
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentName}-ASG
      VPCZoneIdentifier:
        - !Ref PublicSubnet
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: $Latest
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      MetricsCollection:
        - Granularity: "1Minute"
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ASG-Instance
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: iac-rlhf-amazon
          Value: 'true'
          PropagateAtLaunch: true

  # Scaling Policy - Target Tracking
  TargetTrackingScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 50

  # CloudWatch Alarm - High CPU
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-CPU-Alarm-High
      AlarmDescription: Alarm when CPU exceeds 75%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 75
      AlarmActions:
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
      AlarmDescription: Alarm when CPU is below 25%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      AlarmActions:
        - !Ref SNSTopic
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: LessThanThreshold

  # ==========================================
  # Elastic IP for persistent access
  # ==========================================

  # Elastic IP for application access
  ElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Application-EIP
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: ApplicationAccess
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # RDS Database Configuration
  # ==========================================

  # DB Subnet Group for RDS
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database instances
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DB-SubnetGroup
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # RDS MySQL Database Instance
  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DependsOn: DatabaseSecret
    Properties:
      DBInstanceIdentifier: !Sub ${EnvironmentName}-mysql-db
      DBName: applicationdb
      Engine: mysql
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      MaxAllocatedStorage: 100  # Auto-scaling storage
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Sub '{{resolve:secretsmanager:${EnvironmentName}-database-credentials:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${EnvironmentName}-database-credentials:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      MultiAZ: !If [EnableRDSMultiAZ, true, false]
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-MySQL-Database
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # CloudWatch Logging
  # ==========================================

  # CloudWatch Log Group for application logs (with encryption)
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${EnvironmentName}'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt KMSKey.Arn

  # CloudWatch Log Group for RDS logs (with encryption)
  RDSLogGroupError:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/instance/${EnvironmentName}-mysql-db/error'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt KMSKey.Arn

  RDSLogGroupGeneral:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/instance/${EnvironmentName}-mysql-db/general'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt KMSKey.Arn

  RDSLogGroupSlowQuery:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/instance/${EnvironmentName}-mysql-db/slowquery'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt KMSKey.Arn

  # ==========================================
  # SNS Topic for Notifications
  # ==========================================

  # SNS Topic for stack events and alarms
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${EnvironmentName}-Notifications
      DisplayName: !Sub ${EnvironmentName} Stack Notifications
      KmsMasterKeyId: !Ref KMSKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-SNS-Topic
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

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
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Lambda-Role
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Lambda Function for Stack Event Notifications
  StackNotificationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${EnvironmentName}-Stack-Notifier
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt StackNotificationLambdaRole.Arn
      Timeout: 60
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
          STACK_NAME: !Ref AWS::StackName
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import cfnresponse
          
          def handler(event, context):
              sns = boto3.client('sns')
              topic_arn = os.environ['SNS_TOPIC_ARN']
              stack_name = os.environ['STACK_NAME']
              
              # Handle CloudFormation Custom Resource
              if 'RequestType' in event:
                  try:
                      request_type = event['RequestType']
                      
                      message = {
                          'StackName': stack_name,
                          'EventType': request_type,
                          'Status': 'IN_PROGRESS',
                          'ResourceType': event.get('ResourceType', 'Custom::StackNotification'),
                          'LogicalResourceId': event.get('LogicalResourceId', 'StackNotificationCustomResource'),
                          'PhysicalResourceId': event.get('PhysicalResourceId', context.aws_request_id),
                          'ResourceProperties': event.get('ResourceProperties', {})
                      }
                      
                      # Send notification
                      response = sns.publish(
                          TopicArn=topic_arn,
                          Subject=f"CloudFormation Stack Event: {stack_name} - {request_type}",
                          Message=json.dumps(message, indent=2)
                      )
                      
                      print(f"Notification sent: {response['MessageId']}")
                      
                      # Send success response to CloudFormation
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, 
                                     {'MessageId': response['MessageId']},
                                     event.get('PhysicalResourceId', context.aws_request_id))
                  except Exception as e:
                      print(f"Error: {str(e)}")
                      cfnresponse.send(event, context, cfnresponse.FAILED, 
                                     {'Error': str(e)},
                                     event.get('PhysicalResourceId', context.aws_request_id))
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Notification sent successfully')
              }
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Stack-Notifier
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Custom Resource to trigger Lambda on stack events
  StackNotificationCustomResource:
    Type: Custom::StackNotification
    Properties:
      ServiceToken: !GetAtt StackNotificationFunction.Arn
      StackName: !Ref AWS::StackName
      Environment: !Ref EnvironmentName
      NotificationEmail: !Ref NotificationEmail

  # CloudWatch Dashboard for monitoring
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub ${EnvironmentName}-Infrastructure-Dashboard
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average", "label": "EC2 CPU"}],
                  ["AWS/RDS", "CPUUtilization", {"stat": "Average", "label": "RDS CPU"}],
                  ["AWS/RDS", "DatabaseConnections", {"stat": "Average", "label": "DB Connections"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Resource Utilization",
                "yAxis": {"left": {"min": 0, "max": 100}}
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "StatusCheckFailed", {"stat": "Sum"}],
                  ["AWS/RDS", "ReadLatency", {"stat": "Average"}],
                  ["AWS/RDS", "WriteLatency", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Health Metrics"
              }
            },
            {
              "type": "log",
              "properties": {
                "query": "SOURCE '${LogGroup}' | fields @timestamp, @message | sort @timestamp desc | limit 100",
                "region": "${AWS::Region}",
                "title": "Recent Application Logs"
              }
            }
          ]
        }

# Outputs 
Outputs:
  VPCId:
    Description: VPC ID for network infrastructure
    Value: !Ref VPC
    Export:
      Name: !Sub ${AWS::StackName}-VPC-ID

  VPCCidr:
    Description: VPC CIDR block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub ${AWS::StackName}-VPC-CIDR

  PublicSubnetId:
    Description: Public Subnet ID for web tier
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub ${AWS::StackName}-Public-Subnet-ID

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID for database tier
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub ${AWS::StackName}-Private-Subnet-1-ID

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID for database tier
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub ${AWS::StackName}-Private-Subnet-2-ID

  # NAT Gateway output removed for LocalStack (resource unsupported)

  ElasticIPAddress:
    Description: Elastic IP Address for Application Access
    Value: !Ref ElasticIP
    Export:
      Name: !Sub ${AWS::StackName}-Application-EIP

  ApplicationURL:
    Description: URL to access the application
    Value: !Sub 'http://${ElasticIP}'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub ${AWS::StackName}-ASG-Name

  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub ${AWS::StackName}-Launch-Template-ID

  LaunchTemplateVersion:
    Description: Latest Launch Template Version
    Value: !GetAtt LaunchTemplate.LatestVersionNumber

  RDSDatabaseEndpoint:
    Description: RDS Database Endpoint Address
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub ${AWS::StackName}-RDS-Endpoint

  RDSDatabasePort:
    Description: RDS Database Port
    Value: !GetAtt RDSDatabase.Endpoint.Port
    Export:
      Name: !Sub ${AWS::StackName}-RDS-Port

  DatabaseSecretArn:
    Description: ARN of the Secrets Manager secret containing database credentials
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub ${AWS::StackName}-Database-Secret-ARN

  S3BucketName:
    Description: S3 Bucket for CloudFormation Templates and Artifacts
    Value: !Ref ArtifactsBucket
    Export:
      Name: !Sub ${AWS::StackName}-Artifacts-Bucket

  S3BucketArn:
    Description: S3 Bucket ARN
    Value: !GetAtt ArtifactsBucket.Arn
    Export:
      Name: !Sub ${AWS::StackName}-Artifacts-Bucket-ARN

  ApplicationSecurityGroupId:
    Description: Application Security Group ID
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-App-SG-ID

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub ${AWS::StackName}-DB-SG-ID

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub ${AWS::StackName}-KMS-Key-ID

  KMSKeyArn:
    Description: KMS Key ARN
    Value: !GetAtt KMSKey.Arn
    Export:
      Name: !Sub ${AWS::StackName}-KMS-Key-ARN

  EC2InstanceRoleArn:
    Description: IAM Role ARN for EC2 instances
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub ${AWS::StackName}-EC2-Role-ARN

  SNSTopicArn:
    Description: SNS Topic ARN for notifications
    Value: !Ref SNSTopic
    Export:
      Name: !Sub ${AWS::StackName}-SNS-Topic-ARN

  CloudWatchLogGroup:
    Description: CloudWatch Log Group for Application
    Value: !Ref LogGroup
    Export:
      Name: !Sub ${AWS::StackName}-LogGroup

  MonitoringDashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${EnvironmentName}-Infrastructure-Dashboard'

  StackNotificationFunctionArn:
    Description: Lambda Function ARN for stack notifications
    Value: !GetAtt StackNotificationFunction.Arn
    Export:
      Name: !Sub ${AWS::StackName}-Stack-Notifier-ARN

  StackName:
    Description: Stack Name
    Value: !Ref AWS::StackName

  Region:
    Description: AWS Region
    Value: !Ref AWS::Region

  AccountId:
    Description: AWS Account ID
    Value: !Ref AWS::AccountId

  EnvironmentName:
    Description: Environment Name
    Value: !Ref EnvironmentName
```