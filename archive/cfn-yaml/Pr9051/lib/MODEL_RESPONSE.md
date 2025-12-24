### Reasoning Trace

---

This is a comprehensive CloudFormation template request. I need to create a single parameterized template that:

1. Creates isolated VPCs for each environment with specific CIDR ranges
2. Sets up RDS PostgreSQL with environment-specific configurations
3. Creates Auto Scaling groups with ALBs
4. Configures S3 buckets with lifecycle policies
5. Sets up IAM roles with environment-specific restrictions
6. Creates CloudWatch dashboards and alarms
7. Sets up SNS topics for alerting
8. Uses Mappings and Conditions for environment-specific logic
9. Implements proper tagging and naming conventions
10. Ensures encryption and security best practices

Let me structure this template carefully to meet all requirements.

### Answer

---

I'll create a comprehensive single CloudFormation template that meets all your requirements. This template uses parameters, mappings, and conditions to deploy environment-specific infrastructure.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-environment infrastructure with VPC isolation, RDS, Auto Scaling, S3, monitoring, and security controls'

# ==================== PARAMETERS ====================
Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment name (dev, staging, prod)

  ProjectName:
    Type: String
    Default: MyProject
    Description: Project name for tagging

  CostCenter:
    Type: String
    Default: Engineering
    Description: Cost center for billing

  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access

  DBMasterUsername:
    Type: String
    Default: dbadmin
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database master username

  DBMasterPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    Description: Database master password

  AlertEmail:
    Type: String
    Description: Email address for CloudWatch alerts
    AllowedPattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID

# ==================== MAPPINGS ====================
Mappings:
  EnvironmentConfig:
    dev:
      VPCCidr: 10.0.0.0/16
      PublicSubnet1Cidr: 10.0.1.0/24
      PublicSubnet2Cidr: 10.0.2.0/24
      PrivateSubnet1Cidr: 10.0.10.0/24
      PrivateSubnet2Cidr: 10.0.11.0/24
      DBSubnet1Cidr: 10.0.20.0/24
      DBSubnet2Cidr: 10.0.21.0/24
      DBInstanceClass: db.t3.micro
      DBBackupRetention: 1
      DBAllocatedStorage: 20
      ASGMinSize: 1
      ASGMaxSize: 3
      ASGDesiredCapacity: 1
      InstanceType: t3.micro
      HealthCheckInterval: 30
      S3LifecycleDays: 7
      AlarmCPUThreshold: 80
      AlarmMemoryThreshold: 80
    staging:
      VPCCidr: 10.1.0.0/16
      PublicSubnet1Cidr: 10.1.1.0/24
      PublicSubnet2Cidr: 10.1.2.0/24
      PrivateSubnet1Cidr: 10.1.10.0/24
      PrivateSubnet2Cidr: 10.1.11.0/24
      DBSubnet1Cidr: 10.1.20.0/24
      DBSubnet2Cidr: 10.1.21.0/24
      DBInstanceClass: db.t3.small
      DBBackupRetention: 7
      DBAllocatedStorage: 50
      ASGMinSize: 2
      ASGMaxSize: 6
      ASGDesiredCapacity: 2
      InstanceType: t3.small
      HealthCheckInterval: 15
      S3LifecycleDays: 30
      AlarmCPUThreshold: 70
      AlarmMemoryThreshold: 75
    prod:
      VPCCidr: 10.2.0.0/16
      PublicSubnet1Cidr: 10.2.1.0/24
      PublicSubnet2Cidr: 10.2.2.0/24
      PrivateSubnet1Cidr: 10.2.10.0/24
      PrivateSubnet2Cidr: 10.2.11.0/24
      DBSubnet1Cidr: 10.2.20.0/24
      DBSubnet2Cidr: 10.2.21.0/24
      DBInstanceClass: db.m5.large
      DBBackupRetention: 30
      DBAllocatedStorage: 100
      ASGMinSize: 4
      ASGMaxSize: 12
      ASGDesiredCapacity: 4
      InstanceType: t3.medium
      HealthCheckInterval: 5
      S3LifecycleDays: 90
      AlarmCPUThreshold: 60
      AlarmMemoryThreshold: 70

# ==================== CONDITIONS ====================
Conditions:
  IsProduction: !Equals [!Ref Environment, prod]
  IsNotProduction: !Not [!Equals [!Ref Environment, prod]]
  IsStaging: !Equals [!Ref Environment, staging]
  IsDevelopment: !Equals [!Ref Environment, dev]

# ==================== RESOURCES ====================
Resources:
  # ==================== NETWORKING ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, VPCCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock:
        !FindInMap [EnvironmentConfig, !Ref Environment, PublicSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock:
        !FindInMap [EnvironmentConfig, !Ref Environment, PublicSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Public

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock:
        !FindInMap [EnvironmentConfig, !Ref Environment, PrivateSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock:
        !FindInMap [EnvironmentConfig, !Ref Environment, PrivateSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Private

  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, DBSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Database

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, DBSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Database

  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip-1'
        - Key: Environment
          Value: !Ref Environment

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip-2'
        - Key: Environment
          Value: !Ref Environment

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-2'
        - Key: Environment
          Value: !Ref Environment

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-routes'
        - Key: Environment
          Value: !Ref Environment

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
          Value: !Sub '${Environment}-private-routes-1'
        - Key: Environment
          Value: !Ref Environment

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
          Value: !Sub '${Environment}-private-routes-2'
        - Key: Environment
          Value: !Ref Environment

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

  DBSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  DBSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ==================== VPC ENDPOINTS ====================
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
      VpcEndpointType: Gateway

  # ==================== SECURITY GROUPS ====================
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
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-sg'
        - Key: Environment
          Value: !Ref Environment

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
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-sg'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-sg'
        - Key: Environment
          Value: !Ref Environment

  # ==================== IAM ROLES ====================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-ec2-role'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt S3Bucket.Arn
        - PolicyName: SSMAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${Environment}/*'
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:${Environment}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2Role

  # Production-specific IAM policy with restrictions
  ProductionAccessPolicy:
    Type: AWS::IAM::ManagedPolicy
    Condition: IsProduction
    Properties:
      ManagedPolicyName: !Sub '${Environment}-production-access-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyNonApprovedPrincipals
            Effect: Deny
            Action: '*'
            Resource: '*'
            Condition:
              StringNotLike:
                'aws:userid':
                  - 'AIDAI*' # Replace with approved IAM user/role IDs
                  - !Sub '${EC2Role.RoleId}:*'

  # ==================== RDS DATABASE ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${Environment}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: !Sub 'PostgreSQL parameter group for ${Environment}'
      Family: postgres14
      Parameters:
        log_statement: 'all'
        log_duration: 'on'
        shared_preload_libraries: 'pg_stat_statements'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-postgres-db'
      DBInstanceClass:
        !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      Engine: postgres
      EngineVersion: '14.7'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      AllocatedStorage:
        !FindInMap [EnvironmentConfig, !Ref Environment, DBAllocatedStorage]
      StorageType: gp3
      StorageEncrypted: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod:
        !FindInMap [EnvironmentConfig, !Ref Environment, DBBackupRetention]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnablePerformanceInsights: !If [IsProduction, true, false]
      PerformanceInsightsRetentionPeriod:
        !If [IsProduction, 7, !Ref 'AWS::NoValue']
      DBParameterGroupName: !Ref DBParameterGroup
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  # ==================== S3 BUCKET ====================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-${ProjectName}-${AWS::AccountId}-bucket'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays:
              !FindInMap [EnvironmentConfig, !Ref Environment, S3LifecycleDays]
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: s3:*
            Resource:
              - !GetAtt S3Bucket.Arn
              - !Sub '${S3Bucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # ==================== APPLICATION LOAD BALANCER ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds:
        !FindInMap [EnvironmentConfig, !Ref Environment, HealthCheckInterval]
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ==================== AUTO SCALING ====================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-launch-template'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType:
          !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
        KeyName: !Ref KeyName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${Environment}-web-server'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
              - Key: CostCenter
                Value: !Ref CostCenter
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent

            # Install and configure web server
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd

            # Create health check endpoint
            echo "OK" > /var/www/html/health

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "metrics": {
                "namespace": "${Environment}/Application",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      {
                        "name": "mem_used_percent",
                        "rename": "MemoryUtilization"
                      }
                    ]
                  },
                  "disk": {
                    "measurement": [
                      {
                        "name": "used_percent",
                        "rename": "DiskUtilization"
                      }
                    ],
                    "resources": [
                      "/"
                    ]
                  }
                }
              }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${Environment}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, ASGMinSize]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, ASGMaxSize]
      DesiredCapacity:
        !FindInMap [EnvironmentConfig, !Ref Environment, ASGDesiredCapacity]
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true

  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue:
          !FindInMap [EnvironmentConfig, !Ref Environment, AlarmCPUThreshold]

  # ==================== SNS TOPICS ====================
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-alerts'
      DisplayName: !Sub '${Environment} Environment Alerts'
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==================== CLOUDWATCH ALARMS ====================
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-high-cpu'
      AlarmDescription: Alarm when CPU exceeds threshold
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold:
        !FindInMap [EnvironmentConfig, !Ref Environment, AlarmCPUThreshold]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-db-connections'
      AlarmDescription: Alarm when database connections are high
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !If [IsProduction, 80, 40]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DBInstance
      AlarmActions:
        - !Ref SNSTopic

  UnhealthyTargetsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-unhealthy-targets'
      AlarmDescription: Alarm when target group has unhealthy targets
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic

  # ==================== CLOUDWATCH DASHBOARD ====================
  CloudWatchDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${Environment}-dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
                  ["${Environment}/Application", "MemoryUtilization", {"stat": "Average"}],
                  ["${Environment}/Application", "DiskUtilization", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "${Environment} - EC2 Metrics"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "CPUUtilization", {"DBInstanceIdentifier": "${DBInstance}"}],
                  [".", "DatabaseConnections", {"DBInstanceIdentifier": "${DBInstance}"}],
                  [".", "FreeableMemory", {"DBInstanceIdentifier": "${DBInstance}"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "${Environment} - RDS Metrics"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "TargetResponseTime", {"LoadBalancer": "${ApplicationLoadBalancer.LoadBalancerFullName}"}],
                  [".", "RequestCount", {"LoadBalancer": "${ApplicationLoadBalancer.LoadBalancerFullName}"}],
                  [".", "HTTPCode_Target_2XX_Count", {"LoadBalancer": "${ApplicationLoadBalancer.LoadBalancerFullName}"}],
                  [".", "HTTPCode_Target_5XX_Count", {"LoadBalancer": "${ApplicationLoadBalancer.LoadBalancerFullName}"}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "${Environment} - ALB Metrics"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/S3", "BucketSizeBytes", {"BucketName": "${S3Bucket}", "StorageType": "StandardStorage"}],
                  [".", "NumberOfObjects", {"BucketName": "${S3Bucket}", "StorageType": "AllStorageTypes"}]
                ],
                "period": 86400,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "${Environment} - S3 Metrics"
              }
            }
          ]
        }

  # ==================== STACK POLICY (Production Protection) ====================
  # Note: Stack policies must be applied when creating/updating the stack via CLI/SDK
  # Example: aws cloudformation set-stack-policy --stack-name prod-stack --stack-policy-body file://policy.json

# ==================== OUTPUTS ====================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-vpc-id'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-alb-dns'

  DBEndpoint:
    Description: Database Endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-db-endpoint'

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${Environment}-s3-bucket'

  SNSTopicArn:
    Description: SNS Topic ARN for alerts
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${Environment}-sns-topic'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${Environment}-dashboard'
```

## Stack Policy for Production Protection

Create a separate file `stack-policy.json` to protect production resources:

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "Update:*",
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": ["Update:Delete", "Update:Replace"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ResourceType": [
            "AWS::RDS::DBInstance",
            "AWS::EC2::VPC",
            "AWS::S3::Bucket"
          ]
        }
      }
    }
  ]
}
```

## Deployment Commands

Deploy the stack for different environments:

```bash
# Development environment
aws cloudformation create-stack \
  --stack-name dev-infrastructure \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=AlertEmail,ParameterValue=dev-alerts@example.com \
    ParameterKey=KeyName,ParameterValue=my-key-pair \
    ParameterKey=DBMasterPassword,ParameterValue=DevPassword123! \
  --capabilities CAPABILITY_NAMED_IAM

# Staging environment
aws cloudformation create-stack \
  --stack-name staging-infrastructure \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=AlertEmail,ParameterValue=staging-alerts@example.com \
    ParameterKey=KeyName,ParameterValue=my-key-pair \
    ParameterKey=DBMasterPassword,ParameterValue=StagingPassword123! \
  --capabilities CAPABILITY_NAMED_IAM

# Production environment with stack policy
aws cloudformation create-stack \
  --stack-name prod-infrastructure \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=AlertEmail,ParameterValue=prod-alerts@example.com \
    ParameterKey=KeyName,ParameterValue=my-key-pair \
    ParameterKey=DBMasterPassword,ParameterValue=ProdPassword123! \
  --capabilities CAPABILITY_NAMED_IAM

# Apply stack policy to production
aws cloudformation set-stack-policy \
  --stack-name prod-infrastructure \
  --stack-policy-body file://stack-policy.json
```

## Key Features Implemented

### 1. **Environment Isolation**

- Separate VPCs with non-overlapping CIDR ranges
- Environment-specific security groups preventing cross-environment traffic
- Isolated subnets for public, private, and database tiers

### 2. **Security Controls**

- Encryption at rest for RDS and S3
- VPC endpoints for private S3 access
- IAM roles with least privilege principle
- Production access restrictions via IAM policies
- Stack policies preventing accidental deletion in production

### 3. **High Availability**

- Multi-AZ deployment across 2 availability zones
- NAT Gateways in each AZ for redundancy
- Auto Scaling groups with environment-specific sizing
- RDS with automated backups and retention policies

### 4. **Monitoring & Alerting**

- CloudWatch dashboards for each environment
- Environment-specific alarm thresholds
- SNS topics for email notifications
- Performance Insights enabled for production RDS

### 5. **Cost Optimization**

- Environment-appropriate instance sizing
- S3 lifecycle policies with transition to cheaper storage classes
- Tagging for cost allocation and tracking

### 6. **Operational Excellence**

- Consistent naming conventions
- Comprehensive tagging strategy
- Exported outputs for cross-stack references
- User data scripts for automatic configuration

This template provides a production-ready, scalable infrastructure that can be easily deployed across multiple environments with a single command, while maintaining security, compliance, and operational best practices.
