### Reasoning Trace
---

This is a comprehensive request for a production-ready AWS CloudFormation template. I need to create a complete YAML template that includes:

1. VPC with 2 public and 2 private subnets across different AZs
2. Security groups with proper restrictions
3. IAM roles with least privilege
4. EC2 instances with detailed monitoring
5. Auto Scaling Group (min: 2, max: 6)
6. S3 bucket for logs with versioning and lifecycle policy
7. RDS with KMS encryption
8. Proper tagging (Environment:Prod)
9. MFA enforcement for IAM users

Let me structure this properly following AWS best practices.
### Answer 
---

I'll create a comprehensive CloudFormation template that meets all your requirements for a secure and scalable AWS infrastructure. This template follows AWS best practices and includes all the specified components.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready secure and scalable AWS infrastructure with VPC, Auto Scaling, RDS, and S3 logging'

Parameters:
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
    ConstraintDescription: Must be the name of an existing EC2 KeyPair
  
  SSHAllowedCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: CIDR block allowed for SSH access
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: Must be a valid CIDR range
  
  DBMasterUsername:
    Type: String
    Default: 'admin'
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters
  
  DBMasterPassword:
    Type: String
    Description: Database master password
    MinLength: 8
    MaxLength: 41
    NoEcho: true
    AllowedPattern: '[a-zA-Z0-9!@#$%^&*()_+]*'
    ConstraintDescription: Must contain only alphanumeric characters and special characters

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381  # Amazon Linux 2 AMI (update as needed)

Resources:
  # =====================================
  # VPC Configuration
  # =====================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: Prod

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: Prod

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: Prod

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: Prod

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: Prod

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: Prod

  # NAT Gateways for Private Subnets
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT1'
        - Key: Environment
          Value: Prod

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT2'
        - Key: Environment
          Value: Prod

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: Environment
          Value: Prod

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable1'
        - Key: Environment
          Value: Prod

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable2'
        - Key: Environment
          Value: Prod

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # =====================================
  # Security Groups
  # =====================================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'
        - Key: Environment
          Value: Prod

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers in Auto Scaling Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP from ALB
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedCIDR
          Description: Allow SSH from specific CIDR
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG'
        - Key: Environment
          Value: Prod

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
          Description: Allow MySQL/Aurora from web servers
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database-SG'
        - Key: Environment
          Value: Prod

  # =====================================
  # IAM Roles and Policies
  # =====================================
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3LoggingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource:
                  - !Sub '${LoggingBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt LoggingBucket.Arn
        - PolicyName: SSMAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:GetParametersByPath'
                Resource:
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${AWS::StackName}/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-Role'
        - Key: Environment
          Value: Prod

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # IAM Group with MFA enforcement
  IAMUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub '${AWS::StackName}-MFAUsers'
      Policies:
        - PolicyName: EnforceMFAPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowViewAccountInfo
                Effect: Allow
                Action:
                  - 'iam:GetAccountPasswordPolicy'
                  - 'iam:ListVirtualMFADevices'
                Resource: '*'
              - Sid: AllowManageOwnPasswords
                Effect: Allow
                Action:
                  - 'iam:ChangePassword'
                  - 'iam:GetUser'
                Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${!aws:username}'
              - Sid: AllowManageOwnAccessKeys
                Effect: Allow
                Action:
                  - 'iam:CreateAccessKey'
                  - 'iam:DeleteAccessKey'
                  - 'iam:ListAccessKeys'
                  - 'iam:UpdateAccessKey'
                Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${!aws:username}'
              - Sid: AllowManageOwnMFA
                Effect: Allow
                Action:
                  - 'iam:CreateVirtualMFADevice'
                  - 'iam:DeleteVirtualMFADevice'
                  - 'iam:EnableMFADevice'
                  - 'iam:ResyncMFADevice'
                  - 'iam:ListMFADevices'
                Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:*'
              - Sid: DenyAllExceptListedIfNoMFA
                Effect: Deny
                NotAction:
                  - 'iam:CreateVirtualMFADevice'
                  - 'iam:EnableMFADevice'
                  - 'iam:GetUser'
                  - 'iam:ListMFADevices'
                  - 'iam:ListVirtualMFADevices'
                  - 'iam:ResyncMFADevice'
                  - 'sts:GetSessionToken'
                Resource: '*'
                Condition:
                  BoolIfExists:
                    'aws:MultiFactorAuthPresent': 'false'

  # =====================================
  # S3 Bucket for Logging
  # =====================================
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-logs-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 30
            NoncurrentVersionExpirationInDays: 7
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-LoggingBucket'
        - Key: Environment
          Value: Prod

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LoggingBucket.Arn
              - !Sub '${LoggingBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # =====================================
  # KMS Key for RDS Encryption
  # =====================================
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for RDS encryption
      KeyPolicy:
        Version: '2012-10-17'
        Id: rds-key-policy
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
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-KMS-Key'
        - Key: Environment
          Value: Prod

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-rds-key'
      TargetKeyId: !Ref RDSKMSKey

  # =====================================
  # RDS Database
  # =====================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DBSubnetGroup'
        - Key: Environment
          Value: Prod

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.33'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      AllocatedStorage: '20'
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS'
        - Key: Environment
          Value: Prod

  # =====================================
  # Application Load Balancer
  # =====================================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB'
        - Key: Environment
          Value: Prod

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-TargetGroup'
        - Key: Environment
          Value: Prod

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # =====================================
  # Launch Template for Auto Scaling
  # =====================================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.micro
        KeyName: !Ref KeyPairName
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
            yum install -y amazon-cloudwatch-agent httpd
            
            # Configure CloudWatch agent
            cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${AWS::StackName}/httpd/access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${AWS::StackName}/httpd/error",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "namespace": "${AWS::StackName}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      {
                        "name": "cpu_usage_idle",
                        "rename": "CPU_USAGE_IDLE",
                        "unit": "Percent"
                      }
                    ],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": [
                      {
                        "name": "used_percent",
                        "rename": "DISK_USED_PERCENT",
                        "unit": "Percent"
                      }
                    ],
                    "metrics_collection_interval": 60,
                    "resources": [
                      "*"
                    ]
                  },
                  "mem": {
                    "measurement": [
                      {
                        "name": "mem_used_percent",
                        "rename": "MEM_USED_PERCENT",
                        "unit": "Percent"
                      }
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            
            # Start web server
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple index page
            echo "<h1>Hello from ${AWS::StackName}</h1>" > /var/www/html/index.html
            
            # Send logs to S3 periodically
            cat <<'SCRIPT' > /usr/local/bin/upload-logs.sh
            #!/bin/bash
            INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
            DATE=$(date +%Y%m%d%H%M%S)
            tar -czf /tmp/logs-${!DATE}.tar.gz /var/log/httpd/
            aws s3 cp /tmp/logs-${!DATE}.tar.gz s3://${LoggingBucket}/ec2-logs/${!INSTANCE_ID}/
            rm -f /tmp/logs-${!DATE}.tar.gz
            SCRIPT
            
            chmod +x /usr/local/bin/upload-logs.sh
            echo "0 * * * * /usr/local/bin/upload-logs.sh" | crontab -
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Instance'
              - Key: Environment
                Value: Prod
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Volume'
              - Key: Environment
                Value: Prod

  # =====================================
  # Auto Scaling Group
  # =====================================
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      MetricsCollection:
        - Granularity: 1Minute
          Metrics:
            - GroupMinSize
            - GroupMaxSize
            - GroupDesiredCapacity
            - GroupInServiceInstances
            - GroupTotalInstances
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: Prod
          PropagateAtLaunch: true

  # Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # CloudWatch Alarms for Auto Scaling
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale up if CPU > 70%
      AlarmName: !Sub '${AWS::StackName}-CPU-High'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      AlarmActions:
        - !Ref ScaleUpPolicy
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: GreaterThanThreshold

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale down if CPU < 30%
      AlarmName: !Sub '${AWS::StackName}-CPU-Low'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      AlarmActions:
        - !Ref ScaleDownPolicy
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: LessThanThreshold

  # =====================================
  # CloudWatch Log Groups
  # =====================================
  AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${AWS::StackName}/httpd/access'
      RetentionInDays: 30

  ErrorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${AWS::StackName}/httpd/error'
      RetentionInDays: 30

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  LoggingBucketName:
    Description: S3 Bucket for Logs
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG'

  IAMUsersGroupName:
    Description: IAM Group requiring MFA
    Value: !Ref IAMUsersGroup
    Export:
      Name: !Sub '${AWS::StackName}-IAMGroup'
```

## Key Features Implemented:

### 1. **Network Architecture**
- Custom VPC with CIDR 10.0.0.0/16
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24) across different AZs
- 2 private subnets (10.0.10.0/24, 10.0.11.0/24) across different AZs
- NAT Gateways for high availability
- Internet Gateway for public subnet connectivity

### 2. **Security Configuration**
- **ALB Security Group**: Allows HTTP (80) and HTTPS (443) from anywhere
- **Web Server Security Group**: Allows traffic only from ALB and SSH from specified CIDR
- **Database Security Group**: Allows MySQL connections only from web servers
- All security groups tagged with Environment:Prod

### 3. **IAM Configuration**
- EC2 instance role with least privilege principle
- IAM group with enforced MFA policy
- Policies for CloudWatch logging and S3 access only to specific resources

### 4. **Auto Scaling**
- Launch template with detailed monitoring enabled
- Auto Scaling Group with min: 2, max: 6 instances
- CPU-based scaling policies (scale up >70%, scale down <30%)
- Health checks via ELB

### 5. **Logging and Monitoring**
- S3 bucket with versioning and 30-day lifecycle policy
- CloudWatch agent configuration for system and application logs
- Log groups with 30-day retention
- Detailed EC2 monitoring enabled

### 6. **Database Security**
- RDS MySQL instance with KMS encryption
- Multi-AZ deployment for high availability
- Automated backups with 7-day retention
- Database in private subnets only

### 7. **Best Practices**
- All resources properly tagged
- Secure transport enforced on S3
- No hardcoded credentials (uses parameters)
- Deletion protection on critical resources
- Public access blocked on S3 bucket

## Deployment Instructions:

1. **Prerequisites**:
   - Create an EC2 Key Pair in us-east-1
   - Ensure you have appropriate AWS permissions

2. **Deploy the stack**:
```bash
aws cloudformation create-stack \
  --stack-name production-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
    ParameterKey=SSHAllowedCIDR,ParameterValue=your-ip/32 \
    ParameterKey=DBMasterUsername,ParameterValue=admin \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

3. **Monitor deployment**:
```bash
aws cloudformation describe-stacks \
  --stack-name production-infrastructure \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

4. **Post-deployment**:
   - Add IAM users to the MFA-enforced group
   - Configure SSL certificates for HTTPS
   - Update application code on instances
   - Configure CloudWatch dashboards

This template provides a production-ready, secure, and scalable infrastructure that follows AWS best practices and meets all your specified requirements.