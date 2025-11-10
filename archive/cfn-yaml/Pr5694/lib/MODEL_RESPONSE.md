### Reasoning Trace
---

This is a comprehensive request for a production-ready AWS CloudFormation template. Let me break down the requirements:

1. **Networking**: VPC with 2+ subnets across AZs, IGW, Route Tables, parameterized CIDRs
2. **Compute**: Launch Template, ASG with ALB, IAM roles, Security Groups (80/443 only)
3. **Database**: RDS (MySQL/PostgreSQL), encrypted, Multi-AZ for prod/Single-AZ for dev
4. **Monitoring**: CloudWatch monitoring, alarms, logs
5. **Security**: Least privilege IAM, no wildcard permissions unless necessary
6. **Tagging**: Cost tracking tags on all resources
7. **Outputs**: Export key infrastructure details
8. **Conditions**: Environment-based configurations
9. **Parameters**: No hardcoded values, everything parameterized
10. **Naming**: Strict naming convention with StackName-Region-EnvironmentSuffix-ResourceType
11. **Compliance**: Must pass validation, follow AWS best practices

Let me create a comprehensive CloudFormation template that meets all these requirements.
### Answer 
---

# Production-Ready AWS CloudFormation Template

I'll create a comprehensive CloudFormation YAML template that meets all your requirements for a scalable, secure cloud environment with full parameterization and cross-account compatibility.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready scalable and secure AWS cloud environment with VPC, ALB, ASG, RDS, and CloudWatch monitoring'

# ===================================
# Parameters Section
# ===================================
Parameters:
  Environment:
    Type: String
    Description: 'Deployment environment (development or production)'
    AllowedValues:
      - dev
      - prod
    Default: dev

  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

  VPCCidrBlock:
    Type: String
    Description: 'CIDR block for VPC'
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet1CIDR:
    Type: String
    Description: 'CIDR block for Public Subnet 1'
    Default: '10.0.1.0/24'

  PublicSubnet2CIDR:
    Type: String
    Description: 'CIDR block for Public Subnet 2'
    Default: '10.0.2.0/24'

  PrivateSubnet1CIDR:
    Type: String
    Description: 'CIDR block for Private Subnet 1'
    Default: '10.0.11.0/24'

  PrivateSubnet2CIDR:
    Type: String
    Description: 'CIDR block for Private Subnet 2'
    Default: '10.0.12.0/24'

  InstanceType:
    Type: String
    Description: 'EC2 instance type'
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

  DBInstanceClass:
    Type: String
    Description: 'RDS instance class'
    Default: 'db.t3.micro'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge

  DBEngine:
    Type: String
    Description: 'RDS database engine'
    Default: 'mysql'
    AllowedValues:
      - mysql
      - postgres

  DBEngineVersion:
    Type: String
    Description: 'Database engine version'
    Default: '8.0.35'

  DBMasterUsername:
    Type: String
    Description: 'Master username for database'
    Default: 'dbadmin'
    NoEcho: true

  DBMasterPassword:
    Type: String
    Description: 'Master password for database (min 8 characters)'
    NoEcho: true
    MinLength: 8
    ConstraintDescription: 'Must contain at least 8 characters'

  DBAllocatedStorage:
    Type: Number
    Description: 'Allocated storage for database in GB'
    Default: 20
    MinValue: 20
    MaxValue: 1000

  MinSize:
    Type: Number
    Description: 'Minimum number of EC2 instances in ASG'
    Default: 1
    MinValue: 1

  MaxSize:
    Type: Number
    Description: 'Maximum number of EC2 instances in ASG'
    Default: 3
    MinValue: 1

  DesiredCapacity:
    Type: Number
    Description: 'Desired number of EC2 instances in ASG'
    Default: 2
    MinValue: 1

  HTTPSCertificateArn:
    Type: String
    Description: 'ARN of the SSL certificate for HTTPS (leave empty to skip HTTPS listener)'
    Default: ''

  AllowedCIDRBlock:
    Type: String
    Description: 'CIDR block allowed to access the ALB'
    Default: '0.0.0.0/0'

  ProjectName:
    Type: String
    Description: 'Project name for tagging'
    Default: 'CloudProject'

  OwnerEmail:
    Type: String
    Description: 'Owner email for tagging'
    Default: 'owner@example.com'

  CostCenter:
    Type: String
    Description: 'Cost center for tagging'
    Default: 'IT-001'

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID'

# ===================================
# Mappings Section
# ===================================
Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      DBInstanceClass: db.t3.micro
      MultiAZ: false
      AlarmThreshold: 75
    prod:
      InstanceType: t3.medium
      DBInstanceClass: db.m5.large
      MultiAZ: true
      AlarmThreshold: 85

# ===================================
# Conditions Section
# ===================================
Conditions:
  IsProduction: !Equals [!Ref Environment, 'prod']
  IsDevelopment: !Equals [!Ref Environment, 'dev']
  CreateHTTPSListener: !Not [!Equals [!Ref HTTPSCertificateArn, '']]
  UsePostgreSQL: !Equals [!Ref DBEngine, 'postgres']
  UseMySQL: !Equals [!Ref DBEngine, 'mysql']

# ===================================
# Resources Section
# ===================================
Resources:
  # ===================================
  # VPC and Networking Resources
  # ===================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidrBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # ===================================
  # Security Groups
  # ===================================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-sg'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedCIDRBlock
          Description: 'Allow HTTP traffic'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCIDRBlock
          Description: 'Allow HTTPS traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-webserver-sg'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP traffic from ALB'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-webserver-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-sg'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !If [UseMySQL, 3306, 5432]
          ToPort: !If [UseMySQL, 3306, 5432]
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: !Sub 'Allow ${DBEngine} traffic from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  # ===================================
  # IAM Roles and Policies
  # ===================================
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                  - 'cloudwatch:GetMetricStatistics'
                  - 'cloudwatch:ListMetrics'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: '/'
      Roles:
        - !Ref EC2InstanceRole

  # ===================================
  # Application Load Balancer
  # ===================================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-tg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: CreateHTTPSListener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref HTTPSCertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # ===================================
  # Launch Template and Auto Scaling
  # ===================================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lt'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !If [IsProduction, !FindInMap [EnvironmentConfig, prod, InstanceType], !FindInMap [EnvironmentConfig, dev, InstanceType]]
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${AWS::StackName} in ${AWS::Region}</h1>" > /var/www/html/index.html
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Configure CloudWatch Logs
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${AWS::StackName}",
                        "log_stream_name": "{instance_id}/apache/access"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${AWS::StackName}",
                        "log_stream_name": "{instance_id}/apache/error"
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
                      },
                      {
                        "name": "cpu_usage_iowait",
                        "rename": "CPU_USAGE_IOWAIT",
                        "unit": "Percent"
                      }
                    ]
                  },
                  "disk": {
                    "measurement": [
                      {
                        "name": "used_percent",
                        "rename": "DISK_USED_PERCENT",
                        "unit": "Percent"
                      }
                    ],
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
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: CostCenter
                Value: !Ref CostCenter

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn:
      - AttachGateway
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref TargetGroup
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerEmail
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true

  # ===================================
  # Database Resources
  # ===================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db'
      Engine: !Ref DBEngine
      EngineVersion: !Ref DBEngineVersion
      DBInstanceClass: !If [IsProduction, !FindInMap [EnvironmentConfig, prod, DBInstanceClass], !FindInMap [EnvironmentConfig, dev, DBInstanceClass]]
      AllocatedStorage: !Ref DBAllocatedStorage
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: !If [IsProduction, !FindInMap [EnvironmentConfig, prod, MultiAZ], !FindInMap [EnvironmentConfig, dev, MultiAZ]]
      BackupRetentionPeriod: !If [IsProduction, 7, 1]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      StorageEncrypted: true
      EnableCloudwatchLogsExports:
        - !If [UseMySQL, error, '']
        - !If [UseMySQL, general, '']
        - !If [UseMySQL, slowquery, '']
        - !If [UsePostgreSQL, postgresql, '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: CostCenter
          Value: !Ref CostCenter

  # ===================================
  # CloudWatch Monitoring
  # ===================================
  EC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cpu-alarm'
      AlarmDescription: 'Alarm when CPU exceeds threshold'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !If [IsProduction, !FindInMap [EnvironmentConfig, prod, AlarmThreshold], !FindInMap [EnvironmentConfig, dev, AlarmThreshold]]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      TreatMissingData: breaching

  RDSStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-storage-alarm'
      AlarmDescription: 'Alarm when RDS free storage space is low'
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648  # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      TreatMissingData: breaching

  ALBTargetHealthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-health-alarm'
      AlarmDescription: 'Alarm when healthy target count is low'
      MetricName: HealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Minimum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      TreatMissingData: breaching

  CloudWatchLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}'
      RetentionInDays: !If [IsProduction, 30, 7]

# ===================================
# Outputs Section
# ===================================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  ALBHostedZoneId:
    Description: 'Application Load Balancer Hosted Zone ID'
    Value: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub '${AWS::StackName}-ALB-HostedZoneID'

  RDSEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  RDSPort:
    Description: 'RDS Database Port'
    Value: !GetAtt RDSDatabase.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Port'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  EC2InstanceRoleArn:
    Description: 'EC2 Instance IAM Role ARN'
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Role-ARN'

  WebServerSecurityGroupId:
    Description: 'Web Server Security Group ID'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-SG-ID'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Database-SG-ID'

  CloudWatchLogsGroupName:
    Description: 'CloudWatch Logs Group Name'
    Value: !Ref CloudWatchLogsGroup
    Export:
      Name: !Sub '${AWS::StackName}-LogsGroup-Name'
```

## Key Features Explanation

### 1. **Networking Architecture**
- Creates a VPC with 4 subnets (2 public, 2 private) across 2 AZs
- Implements proper routing with Internet Gateway for public subnets
- All CIDR blocks are parameterized for flexibility

### 2. **Security Implementation**
- **Least Privilege IAM**: EC2 role only has permissions for CloudWatch metrics and logs
- **Network Segmentation**: ALB in public subnets, database in private subnets
- **Security Groups**: Strict ingress rules allowing only HTTP/HTTPS to ALB, and database access only from web servers

### 3. **High Availability & Scalability**
- Auto Scaling Group spans multiple AZs
- Application Load Balancer distributes traffic
- RDS Multi-AZ deployment for production environments

### 4. **Environment-Based Configuration**
- Uses CloudFormation Conditions to differentiate between dev/prod
- Production gets larger instances, Multi-AZ RDS, and longer log retention
- Development uses smaller, cost-effective resources

### 5. **Monitoring & Observability**
- CloudWatch Alarms for CPU, storage, and target health
- CloudWatch Logs integration for application and infrastructure logs
- Custom metrics collection via CloudWatch Agent

### 6. **Compliance & Best Practices**
- All resources tagged with mandatory tags (Environment, Project, Owner, CostCenter)
- Encryption enabled for RDS at rest
- Uses latest Amazon Linux 2 AMI via SSM Parameter
- Follows strict naming convention: `${StackName}-${Region}-${EnvironmentSuffix}-${ResourceType}`

### 7. **Cross-Account Compatibility**
- No hardcoded account IDs or region-specific values
- Uses intrinsic functions (!Sub, !Ref, !GetAtt) for dynamic references
- ARNs constructed using ${AWS::Partition} for GovCloud compatibility

## Deployment Instructions

1. **Validate the template:**
```bash
aws cloudformation validate-template --template-body file://template.yaml
```

2. **Create the stack:**
```bash
aws cloudformation create-stack \
  --stack-name my-app-stack \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=KeyPairName,ParameterValue=my-keypair \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePassword123! \
    ParameterKey=ProjectName,ParameterValue=MyProject \
    ParameterKey=OwnerEmail,ParameterValue=owner@company.com \
  --capabilities CAPABILITY_NAMED_IAM
```

3. **Monitor the stack creation:**
```bash
aws cloudformation describe-stacks --stack-name my-app-stack
```

This template provides a complete, production-ready infrastructure that's secure, scalable, and follows AWS best practices while maintaining full parameterization for cross-account deployment.