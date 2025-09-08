Summary

Deliver a single, production-ready CloudFormation template named TapStack.yml that provisions a brand-new web application stack in us-east-1. It must include VPC networking, public/private subnets, an internet-facing ALB (HTTP only), an Auto Scaling Group of Amazon Linux 2 EC2 instances (min 2, max 6, detailed monitoring), an RDS MySQL instance (8.0.x, Multi-AZ), an S3 bucket for logs with SSE, IAM role/instance profile to ship logs to CloudWatch, and clear Outputs. All resources must be tagged with Environment: Production. The template must lint cleanly and deploy without references to pre-existing resources.

What the template must contain (end-to-end)

Parameters

VpcCidr, AZs, PublicSubnetCidrs, PrivateAppSubnetCidrs, PrivateDbSubnetCidrs

AmiId as AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> with default /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

InstanceType, KeyName (optional, default empty), DesiredCapacity, MinSize, MaxSize

DbName, DbUsername, DbInstanceClass, DbAllocatedStorage, LogsRetentionDays

Conditions

HasKeyName to omit LaunchTemplate KeyName when empty (prevents validation failure)

Networking

New VPC with DNS support enabled

Two public subnets (ALB), two private app subnets (EC2/ASG), two private DB subnets (RDS)

One IGW, two NAT Gateways (one per public subnet), route tables and associations

Security Groups

ALB SG: inbound 80/443 from 0.0.0.0/0

App SG: inbound 80 from ALB SG only

DB SG: inbound 3306 from App SG only

S3 logging

New bucket with Block Public Access, SSE-S3 (AES256), versioning, lifecycle (IA @30d, expire @90d)

Bucket policy: enforce TLS; allow ALB access logs from 127311923021 (us-east-1 ELB log delivery), with bucket-owner-full-control

ALB

Internet-facing, HTTP listener on 80 forwarding to instance target group

Access logging to the S3 bucket

No HTTPS listener or ACM certificate blocks

Compute

Launch Template using ImageId: !Ref AmiId (Amazon Linux 2), detailed monitoring ON

UserData that installs nginx and awslogs, ships /var/log/messages and nginx logs to a dedicated log group

ASG across private app subnets; Min=2, Max=6, Desired=2; health checks via target group

Top-level UpdatePolicy for rolling updates

Observability

CloudWatch Logs LogGroup /tapstack/app with retention from parameter

IAM Role + Instance Profile with CloudWatchAgentServerPolicy

Database

Subnet group across DB subnets

Secrets Manager secret for master password; dynamic reference in DB instance

MySQL 8.0.43 (allowed by CloudFormation), Multi-AZ, encrypted, deletion protection ON

DeletionPolicy: Snapshot and UpdateReplacePolicy: Snapshot

Tagging

Apply Environment: Production (plus sensible Name/Project) everywhere supported

Outputs

VPCId, Subnet IDs, ALB ARN and DNS, TargetGroup ARN, ASG name, LaunchTemplate ID:Version

InstanceRoleArn, InstanceProfileName, LogsBucketName

RdsEndpointAddress, RdsArn, DbSubnetGroupName

Acceptance checklist

Passes cfn-lint with no errors

Deploys cleanly via Change Set in us-east-1

Does not reference existing resources (names left for CFN to generate where risky)

KeyPair optional; stack succeeds even if KeyName is empty

AMI resolved via SSM alias that exists in us-east-1 (gp2)

RDS engine version is valid (e.g., 8.0.43), password from Secrets Manager dynamic reference

S3 bucket policy uses correct ELB log delivery principal and ACL condition

All resources carry Environment: Production

How to deploy (CLI outline)

Lint:

cfn-lint TapStack.yml

Create change set:

aws cloudformation create-stack --stack-name TapStackProd --template-body file://TapStack.yml --capabilities CAPABILITY_NAMED_IAM

Monitor events & execute:

aws cloudformation describe-stacks --stack-name TapStackProd

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade web app: VPC, ALB, ASG (Amazon Linux 2), RDS MySQL, S3 logs, CloudWatch logging — us-east-1'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label: { default: "Network Configuration" }
        Parameters:
          - VpcCidr
          - AZs
          - PublicSubnetCidrs
          - PrivateAppSubnetCidrs
          - PrivateDbSubnetCidrs
      - Label: { default: "EC2 Configuration" }
        Parameters:
          - AmiId
          - InstanceType
          - KeyName
          - DesiredCapacity
          - MinSize
          - MaxSize
      - Label: { default: "Database Configuration" }
        Parameters:
          - DbName
          - DbUsername
          - DbInstanceClass
          - DbAllocatedStorage
      - Label: { default: "Logging Configuration" }
        Parameters:
          - LogsRetentionDays
    ParameterLabels:
      VpcCidr: { default: "VPC CIDR Block" }
      AZs: { default: "Availability Zones" }
      AmiId: { default: "Amazon Linux 2 AMI (SSM Alias)" }
      InstanceType: { default: "EC2 Instance Type" }
      DbUsername: { default: "Database Username" }
      KeyName: { default: "EC2 Key Pair (optional)" }

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: 'Must be a valid CIDR range'

  AZs:
    Type: List<AWS::EC2::AvailabilityZone::Name>
    Default: 'us-east-1a,us-east-1b'
    Description: 'Availability Zones to use (2 minimum)'

  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.0.1.0/24,10.0.2.0/24'
    Description: 'CIDR blocks for public subnets'

  PrivateAppSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.0.10.0/24,10.0.20.0/24'
    Description: 'CIDR blocks for private app subnets'

  PrivateDbSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.0.30.0/24,10.0.40.0/24'
    Description: 'CIDR blocks for private DB subnets'

  # Properly initialized AMI parameter (SSM alias) that exists in us-east-1
  AmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Amazon Linux 2 AMI ID from SSM Parameter Store (leave default)'

  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge
    Description: 'EC2 instance type'

  # Optional; omitted from LT if left empty (prevents validation failure)
  KeyName:
    Type: String
    Default: ''
    Description: 'Optional EC2 Key Pair name for SSH access (leave empty for none)'

  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 6
    Description: 'Desired number of EC2 instances'

  MinSize:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 6
    Description: 'Minimum number of EC2 instances'

  MaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    MaxValue: 10
    Description: 'Maximum number of EC2 instances'

  DbName:
    Type: String
    Default: 'tapstack'
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: 'Database name'

  DbUsername:
    Type: String
    Default: 'admin'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: 'Database admin username'

  DbInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.r5.large
      - db.r5.xlarge
    Description: 'RDS instance class'

  DbAllocatedStorage:
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 100
    Description: 'Database allocated storage in GB'

  LogsRetentionDays:
    Type: Number
    Default: 30
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
    Description: 'CloudWatch Logs retention period in days'

Conditions:
  HasKeyName: !Not [!Equals [!Ref KeyName, '']]

Resources:
  ############################
  # Networking
  ############################
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-vpc' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-igw' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !Ref AZs]
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-public-subnet-1' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !Ref AZs]
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-public-subnet-2' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  PrivateAppSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !Ref AZs]
      CidrBlock: !Select [0, !Ref PrivateAppSubnetCidrs]
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-app-subnet-1' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  PrivateAppSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !Ref AZs]
      CidrBlock: !Select [1, !Ref PrivateAppSubnetCidrs]
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-app-subnet-2' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  PrivateDbSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !Ref AZs]
      CidrBlock: !Select [0, !Ref PrivateDbSubnetCidrs]
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-db-subnet-1' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  PrivateDbSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !Ref AZs]
      CidrBlock: !Select [1, !Ref PrivateDbSubnetCidrs]
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-db-subnet-2' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-nat-eip-1' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-nat-eip-2' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-nat-1' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-nat-2' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-public-rt' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-rt-1' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateAppSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateAppSubnet1

  PrivateDbSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateDbSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-private-rt-2' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateAppSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateAppSubnet2

  PrivateDbSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateDbSubnet2

  ############################
  # Security Groups
  ############################
  AlbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0', Description: 'HTTP access from anywhere' }
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0', Description: 'HTTPS (future use)' }
      SecurityGroupEgress:
        - { IpProtocol: '-1', CidrIp: '0.0.0.0/0', Description: 'All outbound traffic' }
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-alb-sg' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 80, ToPort: 80, SourceSecurityGroupId: !Ref AlbSecurityGroup, Description: 'HTTP from ALB only' }
      SecurityGroupEgress:
        - { IpProtocol: '-1', CidrIp: '0.0.0.0/0', Description: 'All outbound traffic' }
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-app-sg' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  DbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 3306, ToPort: 3306, SourceSecurityGroupId: !Ref AppSecurityGroup, Description: 'MySQL from app only' }
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-db-sg' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  ############################
  # S3 for Logs (+ Policy)
  ############################
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault: { SSEAlgorithm: AES256 }
      VersioningConfiguration: { Status: Enabled }
      LifecycleConfiguration:
        Rules:
          - Id: 'TransitionAndExpiration'
            Status: Enabled
            Transitions:
              - { TransitionInDays: 30, StorageClass: STANDARD_IA }
            ExpirationInDays: 90
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-logs-bucket' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyInsecureConnections'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${LogsBucket}'
              - !Sub 'arn:aws:s3:::${LogsBucket}/*'
            Condition:
              Bool: { 'aws:SecureTransport': 'false' }
          - Sid: 'AllowALBAccessLogs'
            Effect: Allow
            Principal:
              AWS: 'arn:aws:iam::127311923021:root' # us-east-1 ELB log delivery
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::${LogsBucket}/alb-logs/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  ############################
  # ALB + Target Group + Listener (HTTP only)
  ############################
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref AlbSecurityGroup
      LoadBalancerAttributes:
        - { Key: access_logs.s3.enabled, Value: 'true' }
        - { Key: access_logs.s3.bucket, Value: !Ref LogsBucket }
        - { Key: access_logs.s3.prefix, Value: 'alb-logs' }
        - { Key: idle_timeout.timeout_seconds, Value: '60' }
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-alb' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-tg' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  HttpListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      # NOTE: HTTPS listener intentionally omitted (add later when ACM cert is available)

  ############################
  # CloudWatch Logs + IAM
  ############################
  AppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/tapstack/app'
      RetentionInDays: !Ref LogsRetentionDays
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-app-logs' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-instance-role' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [ !Ref InstanceRole ]

  ############################
  # Launch Template & ASG
  ############################
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        ImageId: !Ref AmiId
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
        IamInstanceProfile: { Name: !Ref InstanceProfile }
        SecurityGroupIds: [ !Ref AppSecurityGroup ]
        Monitoring: { Enabled: true }
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y nginx awslogs

            systemctl enable nginx
            systemctl start nginx

            echo "<h1>Hello from TapStack</h1>" > /usr/share/nginx/html/index.html
            echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /usr/share/nginx/html/index.html
            echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /usr/share/nginx/html/index.html

            cat << 'EOF' > /etc/awslogs/awslogs.conf
            [general]
            state_file = /var/lib/awslogs/agent-state

            [/var/log/messages]
            file = /var/log/messages
            log_group_name = /tapstack/app
            log_stream_name = {instance_id}/messages
            datetime_format = %b %d %H:%M:%S

            [/var/log/nginx/access.log]
            file = /var/log/nginx/access.log
            log_group_name = /tapstack/app
            log_stream_name = {instance_id}/nginx-access
            datetime_format = %d/%b/%Y:%H:%M:%S %z

            [/var/log/nginx/error.log]
            file = /var/log/nginx/error.log
            log_group_name = /tapstack/app
            log_stream_name = {instance_id}/nginx-error
            datetime_format = %Y/%m/%d %H:%M:%S
            EOF

            sed -i "s/region = .*/region = ${AWS::Region}/g" /etc/awslogs/awscli.conf || echo -e "[default]\nregion = ${AWS::Region}" > /etc/awslogs/awscli.conf
            systemctl enable awslogsd.service || true
            systemctl start awslogsd || true

        TagSpecifications:
          - ResourceType: instance
            Tags:
              - { Key: Name, Value: !Sub '${AWS::StackName}-instance' }
              - { Key: Environment, Value: Production }
              - { Key: Project, Value: TapStack }
      TagSpecifications:
        - ResourceType: launch-template
          Tags:
            - { Key: Name, Value: !Sub '${AWS::StackName}-launch-template' }
            - { Key: Environment, Value: Production }
            - { Key: Project, Value: TapStack }

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateAppSubnet1
        - !Ref PrivateAppSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs: [ !Ref TargetGroup ]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg'
          PropagateAtLaunch: false
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true
        - Key: Project
          Value: TapStack
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false

  ############################
  # RDS Secrets + Subnet Group + DB
  ############################
  DbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateDbSubnet1
        - !Ref PrivateDbSubnet2
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-db-subnet-group' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  DbSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-db-credentials'
      Description: 'RDS master credentials for TapStack'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DbUsername}"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
        ExcludePunctuation: true
      Tags:
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBName: !Ref DbName
      DBInstanceClass: !Ref DbInstanceClass
      AllocatedStorage: !Ref DbAllocatedStorage
      Engine: MySQL
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DbUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DbSecret}::password}}'
      VPCSecurityGroups: [ !Ref DbSecurityGroup ]
      DBSubnetGroupName: !Ref DbSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      StorageEncrypted: true
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - { Key: Name, Value: !Sub '${AWS::StackName}-db' }
        - { Key: Environment, Value: Production }
        - { Key: Project, Value: TapStack }

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export: { Name: !Sub '${AWS::StackName}-VPCId' }

  PublicSubnetIds:
    Description: 'Public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export: { Name: !Sub '${AWS::StackName}-PublicSubnetIds' }

  PrivateAppSubnetIds:
    Description: 'Private app subnet IDs'
    Value: !Join [',', [!Ref PrivateAppSubnet1, !Ref PrivateAppSubnet2]]
    Export: { Name: !Sub '${AWS::StackName}-PrivateAppSubnetIds' }

  PrivateDbSubnetIds:
    Description: 'Private DB subnet IDs'
    Value: !Join [',', [!Ref PrivateDbSubnet1, !Ref PrivateDbSubnet2]]
    Export: { Name: !Sub '${AWS::StackName}-PrivateDbSubnetIds' }

  AlbArn:
    Description: 'Application Load Balancer ARN'
    Value: !Ref ApplicationLoadBalancer
    Export: { Name: !Sub '${AWS::StackName}-AlbArn' }

  AlbDnsName:
    Description: 'Application Load Balancer DNS name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export: { Name: !Sub '${AWS::StackName}-AlbDnsName' }

  TargetGroupArn:
    Description: 'Target Group ARN'
    Value: !Ref TargetGroup
    Export: { Name: !Sub '${AWS::StackName}-TargetGroupArn' }

  AutoScalingGroupName:
    Description: 'Auto Scaling Group name'
    Value: !Ref AutoScalingGroup
    Export: { Name: !Sub '${AWS::StackName}-AutoScalingGroupName' }

  LaunchTemplateId:
    Description: 'Launch Template ID and latest version'
    Value: !Sub '${LaunchTemplate}:${LaunchTemplate.LatestVersionNumber}'
    Export: { Name: !Sub '${AWS::StackName}-LaunchTemplateId' }

  InstanceRoleArn:
    Description: 'Instance IAM Role ARN'
    Value: !GetAtt InstanceRole.Arn
    Export: { Name: !Sub '${AWS::StackName}-InstanceRoleArn' }

  InstanceProfileName:
    Description: 'Instance Profile name'
    Value: !Ref InstanceProfile
    Export: { Name: !Sub '${AWS::StackName}-InstanceProfileName' }

  LogsBucketName:
    Description: 'S3 logs bucket name'
    Value: !Ref LogsBucket
    Export: { Name: !Sub '${AWS::StackName}-LogsBucketName' }

  RdsEndpointAddress:
    Description: 'RDS endpoint address'
    Value: !GetAtt Database.Endpoint.Address
    Export: { Name: !Sub '${AWS::StackName}-RdsEndpointAddress' }

  RdsArn:
    Description: 'RDS instance ARN'
    Value: !GetAtt Database.DBInstanceArn
    Export: { Name: !Sub '${AWS::StackName}-RdsArn' }

  DbSubnetGroupName:
    Description: 'Database subnet group name'
    Value: !Ref DbSubnetGroup
    Export: { Name: !Sub '${AWS::StackName}-DbSubnetGroupName' }
```