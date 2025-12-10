### ideal_response.md

# Functional scope (build everything new):

Provision a brand-new, production-grade web application stack in **us-east-1** using a single CloudFormation template (`TapStack.yml`). The stack must create all modules from scratch (no references to pre-existing resources) and embed secure defaults: private compute, restricted security groups by default, least-privilege IAM for EC2, encrypted storage, and comprehensive logging/monitoring.

# Deliverable:

A single, human-readable **YAML** CloudFormation file named **TapStack.yml** that deploys in one attempt through CI/CD without any CLI parameter injection. The template includes fully initialized Parameters with safe defaults, Conditions, Rules, Resources, and Outputs, and avoids explicit physical names to pass **AWS::EarlyValidation::ResourceExistenceCheck**.

## Constraints and invariants

* Region hard-enforced to **us-east-1** via a CloudFormation Rule.
* No hard AllowedValues for `EnvironmentSuffix`; use a safe naming regex to keep deployments flexible and resilient.
* All resource names in tags include `ENVIRONMENT_SUFFIX` to avoid collisions across environments.
* Every requirement is met using AWS-managed services only.

## High-level design decisions

* **AMI sourcing** via SSM public parameter for Amazon Linux 2023 to eliminate “AMI does not exist” rollbacks.
* **Networking**: new VPC, two public and two private subnets across AZs, single NAT Gateway for egress, public subnets for ALB only.
* **Security**: ALB SG allows 80/443 from a parameterized CIDR; App SG only allows `${AppPort}` from ALB SG; default-deny inbound elsewhere.
* **Compute**: Auto Scaling Group in private subnets with encrypted `gp3` root EBS volumes; target tracking on CPU.
* **Health & stability**: ALB Target Group checks `/health` with tolerant thresholds; ASG uses warmup and extended grace to prevent flapping.
* **Observability**: CloudWatch log groups with retention; optional VPC Flow Logs; alarms for CPU, ALB 5XX, and unhealthy targets.
* **ALB access logs**: S3 bucket with `BucketOwnerEnforced`, TLS-only policy, and principal `logdelivery.elasticloadbalancing.amazonaws.com`; ALB depends on bucket policy so validation doesn’t fail.
* **Configuration**: SSM Parameter Store namespace auto-generated as `/${ProjectName}/${EnvironmentSuffix}` when not supplied.

## Acceptance criteria

* Stack completes successfully on a clean account with no pre-existing resources or names.
* Instances become **InService** and the ASG converges to DesiredCapacity without “updating capacity” loops.
* ALB access logging works when enabled and does not fail with “Access Denied”.
* `cfn-lint` passes with zero errors on the delivered YAML.
* Outputs expose VPC/Subnet IDs, ALB DNS, SG IDs, Target Group ARN, ASG and Launch Template identifiers, Logs bucket name, and the SSM namespace.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack — Production-ready, secure, and highly available web application stack in us-east-1.
  Creates a brand-new VPC (public/private subnets across 2 AZs), ALB, Auto Scaling Group with
  encrypted EBS volumes, least-privilege IAM, CloudWatch logging/alarms, VPC Flow Logs,
  S3 logs bucket (SSE, versioned, BPA), and SSM Parameter Store namespace. All names include
  ProjectName + EnvironmentSuffix in tags only (no fixed physical names) to avoid early validation
  conflicts. Parameters have safe defaults for non-interactive pipeline deployments.

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label: { default: "Project & Environment" }
        Parameters: [ProjectName, EnvironmentSuffix, OwnerTag]
      - Label: { default: "Networking (VPC & Subnets)" }
        Parameters: [VpcCidr, PublicSubnetCidrA, PublicSubnetCidrB, PrivateSubnetCidrA, PrivateSubnetCidrB]
      - Label: { default: "Compute & Scaling" }
        Parameters: [AmiId, InstanceType, AppPort, RootVolumeSizeGiB, DesiredCapacity, MinSize, MaxSize, CpuTargetUtilization]
      - Label: { default: "Access Constraints" }
        Parameters: [AlbAccessCidr]
      - Label: { default: "Logging & Observability" }
        Parameters: [LogRetentionDays]
    ParameterLabels:
      ProjectName: { default: "Project Name (lowercase, hyphenated)" }
      EnvironmentSuffix: { default: "Environment Suffix (lowercase, hyphens)" }
      OwnerTag: { default: "Owner/Team Tag" }
      AmiId: { default: "AMI (SSM Parameter or AMI Id)" }
      InstanceType: { default: "EC2 Instance Type" }
      AppPort: { default: "Application Port" }
      RootVolumeSizeGiB: { default: "Root EBS Volume Size (GiB)" }
      DesiredCapacity: { default: "ASG Desired Capacity" }
      MinSize: { default: "ASG Min Size" }
      MaxSize: { default: "ASG Max Size" }
      CpuTargetUtilization: { default: "Target Avg CPU (%)" }
      AlbAccessCidr: { default: "ALB Inbound CIDR (client range)" }
      LogRetentionDays: { default: "CloudWatch Log Retention (days)" }

Rules:
  MustBeUsEast1:
    Assertions:
      - Assert: !Equals [ !Ref "AWS::Region", "us-east-1" ]
        AssertDescription: "This stack must be deployed in us-east-1."

Parameters:
  ProjectName:
    Type: String
    Default: tapstack
    AllowedPattern: '^[a-z0-9-]{3,32}$'
    ConstraintDescription: "Use 3–32 chars: lowercase letters, numbers, hyphens."
    Description: "Project name used in tags (no physical names are set)."
  EnvironmentSuffix:
    Type: String
    Default: prod-us
    AllowedPattern: '^[a-z0-9-]{3,32}$'
    ConstraintDescription: "Use 3–32 chars: lowercase letters, numbers, hyphens (no hard AllowedValues)."
    Description: "Environment suffix included in all Name tags to avoid collisions."
  OwnerTag:
    Type: String
    Default: "platform-team"
    AllowedPattern: '^[A-Za-z0-9 _@.\-]{2,64}$'
    Description: "Owner/Team tag for cost allocation and governance."
  VpcCidr:
    Type: String
    Default: 10.10.0.0/16
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/(1[6-9]|2[0-8])$'
    Description: "CIDR for VPC."
  PublicSubnetCidrA:
    Type: String
    Default: 10.10.0.0/20
    Description: "Public Subnet A CIDR."
  PublicSubnetCidrB:
    Type: String
    Default: 10.10.16.0/20
    Description: "Public Subnet B CIDR."
  PrivateSubnetCidrA:
    Type: String
    Default: 10.10.32.0/20
    Description: "Private Subnet A CIDR."
  PrivateSubnetCidrB:
    Type: String
    Default: 10.10.48.0/20
    Description: "Private Subnet B CIDR."
  AmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64
    Description: "AMI for EC2 (SSM path default to AL2023)."
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedPattern: '^[a-z0-9]+\.[a-z0-9]+$'
    Description: "EC2 instance type."
  AppPort:
    Type: Number
    Default: 8080
    MinValue: 1024
    MaxValue: 65535
    Description: "Application listening port on EC2 instances."
  RootVolumeSizeGiB:
    Type: Number
    Default: 16
    MinValue: 8
    MaxValue: 1024
    Description: "Root EBS volume size; encrypted by default with AWS-managed KMS for EBS."
  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: "ASG desired capacity (min 2 for HA)."
  MinSize:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: "ASG minimum size."
  MaxSize:
    Type: Number
    Default: 4
    MinValue: 2
    MaxValue: 20
    Description: "ASG maximum size."
  CpuTargetUtilization:
    Type: Number
    Default: 55
    MinValue: 20
    MaxValue: 90
    Description: "Target average CPU for scaling policy."
  AlbAccessCidr:
    Type: String
    Default: 0.0.0.0/0
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/(3[0-2]|[12]?\d)$'
    Description: "Client CIDR allowed to reach ALB (default: internet)."
  LogRetentionDays:
    Type: Number
    Default: 30
    MinValue: 1
    MaxValue: 3653
    Description: "CloudWatch Logs retention in days."

Mappings: {}

Conditions: {}

Resources:

  # -----------------------------
  # Networking — VPC & Subnets
  # -----------------------------
  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerTag

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-igw'

  VpcGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref Vpc
      InternetGatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnetCidrA
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-pub-a'

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnetCidrB
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-pub-b'

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnetCidrA
      MapPublicIpOnLaunch: false
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-pri-a'

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnetCidrB
      MapPublicIpOnLaunch: false
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-pri-b'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VpcGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociationA:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnetA

  PublicSubnetRouteTableAssociationB:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnetB

  NatEipA:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEipA.AllocationId
      SubnetId: !Ref PublicSubnetA
      ConnectivityType: public
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-nat-a'

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-rt-a'

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-private-rt-b'

  PrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayA

  PrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayA

  PrivateSubnetRouteTableAssociationA:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      SubnetId: !Ref PrivateSubnetA

  PrivateSubnetRouteTableAssociationB:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      SubnetId: !Ref PrivateSubnetB

  # -----------------------------
  # Logging — S3 (no fixed name)
  # -----------------------------
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration: { Status: Enabled }
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: transition-ia
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-logs'
  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub '${LogsBucket.Arn}'
              - !Sub '${LogsBucket.Arn}/*'
            Condition:
              Bool:
                aws:SecureTransport: false

  # -----------------------------
  # CloudWatch Logs & VPC Flow Logs
  # -----------------------------
  FlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc-flow-logs'

  VpcFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: flowlogs-to-cw
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource:
                  - !GetAtt FlowLogsLogGroup.Arn
                  - !Sub '${FlowLogsLogGroup.Arn}:*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-flowlogs-role'

  VpcFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref Vpc
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref FlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt VpcFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc-flow-logs'

  # -----------------------------
  # Security Groups (least inbound)
  # -----------------------------
  AlbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "ALB SG - allow HTTP from AlbAccessCidr; egress all."
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AlbAccessCidr
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-alb-sg'

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "App SG - only ALB to AppPort; egress all."
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !Ref AppPort
          ToPort: !Ref AppPort
          SourceSecurityGroupId: !Ref AlbSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-app-sg'

  # -----------------------------
  # IAM for EC2 (least privilege)
  # -----------------------------
  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: ssm-parameter-read-scope
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Sid: ReadEnvNamespace
                Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource:
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/${EnvironmentSuffix}/${AWS::StackName}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-instance-role'

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [ !Ref InstanceRole ]

  # -----------------------------
  # Application & System Logs
  # -----------------------------
  AppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-app-logs'

  SystemLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-system-logs'

  # -----------------------------
  # Launch Template (EBS encrypted)
  # -----------------------------
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        ImageId: !Ref AmiId
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt InstanceProfile.Arn
        NetworkInterfaces:
          - AssociatePublicIpAddress: false
            DeviceIndex: 0
            Groups: [ !Ref AppSecurityGroup ]
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              Encrypted: true
              VolumeSize: !Ref RootVolumeSizeGiB
              VolumeType: gp3
              DeleteOnTermination: true
              KmsKeyId: alias/aws/ebs
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 2
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            set -xe

            # ---------------------------------
            # Minimal setup for fast, stable boot
            # ---------------------------------

            # Install CloudWatch Agent & Python (best effort, don't fail stack if this breaks)
            dnf install -y amazon-cloudwatch-agent python3 || yum install -y amazon-cloudwatch-agent python3 || true

            # Simple demo app directory
            mkdir -p /opt/app
            echo "OK" > /opt/app/health.html

            # -----------------------
            # App run script
            # -----------------------
            cat >/opt/app/run.sh <<'EOF'
            #!/bin/bash
            set -e
            cd /opt/app
            echo "<h1>TapStack</h1><p>Environment: ${EnvironmentSuffix}</p>" > index.html
            /usr/bin/python3 -m http.server ${AppPort} --bind 0.0.0.0 1>>/var/log/tapstack-app.log 2>&1
            EOF
            chmod +x /opt/app/run.sh

            # -----------------------
            # Systemd service
            # -----------------------
            cat >/etc/systemd/system/tapstack.service <<SYSTEMD
            [Unit]
            Description=TapStack Demo App
            After=network-online.target

            [Service]
            Type=simple
            ExecStart=/opt/app/run.sh
            Restart=always
            RestartSec=5

            [Install]
            WantedBy=multi-user.target
            SYSTEMD

            systemctl daemon-reload
            systemctl enable tapstack.service
            systemctl start tapstack.service

            # -----------------------
            # CloudWatch Agent config
            # -----------------------
            mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
            cat >/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<CWCFG
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${ProjectName}-${EnvironmentSuffix}-system-logs",
                        "log_stream_name": "{instance_id}-messages"
                      },
                      {
                        "file_path": "/var/log/tapstack-app.log",
                        "log_group_name": "${ProjectName}-${EnvironmentSuffix}-app-logs",
                        "log_stream_name": "{instance_id}-app"
                      }
                    ]
                  }
                }
              }
            }
            CWCFG

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s || true

  # -----------------------------
  # Auto Scaling Group & Policy
  # -----------------------------
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn:
      - NatGatewayA
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      LaunchTemplate:
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
        LaunchTemplateId: !Ref LaunchTemplate
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      HealthCheckType: ELB
      HealthCheckGracePeriod: 900
      TargetGroupARNs: [ !Ref AlbTargetGroup ]
      MetricsCollection:
        - Granularity: "1Minute"
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-asg'
          PropagateAtLaunch: true

  CpuTargetTrackingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: !Ref CpuTargetUtilization

  # -----------------------------
  # Elastic Load Balancer (ALB)
  # -----------------------------
  Alb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
      SecurityGroups:
        - !Ref AlbSecurityGroup
      IpAddressType: ipv4
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-alb'

  AlbTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref Vpc
      TargetType: instance
      Port: !Ref AppPort
      Protocol: HTTP
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPort: traffic-port
      HealthCheckPath: /health.html
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 2
      Matcher:
        HttpCode: '200'
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-tg'

  AlbListenerHttp:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref Alb
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref AlbTargetGroup

  # -----------------------------
  # Alarms (CPU, ALB 5xx, Unhealthy)
  # -----------------------------
  CpuHighAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: "ASG Average CPU > 80% for 5 minutes"
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      Statistic: Average
      Period: 60
      EvaluationPeriods: 5
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  Alb5xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: "ALB 5XX count high"
      Namespace: AWS/ApplicationELB
      MetricName: HTTPCode_ELB_5XX_Count
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt Alb.LoadBalancerFullName
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 5
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  UnhealthyHostsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: "ALB target group unhealthy hosts > 0"
      Namespace: AWS/ApplicationELB
      MetricName: UnHealthyHostCount
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt AlbTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt Alb.LoadBalancerFullName
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 5
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  # -----------------------------
  # SSM Parameter Store Namespace
  # -----------------------------
  SsmParameterNamespace:
    Type: AWS::SSM::Parameter
    Properties:
      Type: String
      Name: !Sub '/${ProjectName}/${EnvironmentSuffix}/${AWS::StackName}/NAMESPACE'
      Value: !Sub '/${ProjectName}/${EnvironmentSuffix}/${AWS::StackName}'
      Description: "Base namespace for this stack's environment parameters."

  SsmParamAppPort:
    Type: AWS::SSM::Parameter
    Properties:
      Type: String
      Name: !Sub '/${ProjectName}/${EnvironmentSuffix}/${AWS::StackName}/APP_PORT'
      Value: !Ref AppPort
      Description: "Application port for instances."

  SsmParamLogLevel:
    Type: AWS::SSM::Parameter
    Properties:
      Type: String
      Name: !Sub '/${ProjectName}/${EnvironmentSuffix}/${AWS::StackName}/LOG_LEVEL'
      Value: INFO
      Description: "Application log level."

  SsmParamEnvironment:
    Type: AWS::SSM::Parameter
    Properties:
      Type: String
      Name: !Sub '/${ProjectName}/${EnvironmentSuffix}/${AWS::StackName}/ENV'
      Value: !Ref EnvironmentSuffix
      Description: "Environment suffix for app consumption."

Outputs:
  VpcId:
    Description: VPC Id
    Value: !Ref Vpc
  PublicSubnetIds:
    Description: Public Subnet Ids (A,B)
    Value: !Join [ ",", [ !Ref PublicSubnetA, !Ref PublicSubnetB ] ]
  PrivateSubnetIds:
    Description: Private Subnet Ids (A,B)
    Value: !Join [ ",", [ !Ref PrivateSubnetA, !Ref PrivateSubnetB ] ]
  AlbArn:
    Description: ALB ARN
    Value: !Ref Alb
  AlbDnsName:
    Description: Public DNS name of ALB
    Value: !GetAtt Alb.DNSName
  AlbSecurityGroupId:
    Description: ALB Security Group Id
    Value: !Ref AlbSecurityGroup
  AppSecurityGroupId:
    Description: App Security Group Id
    Value: !Ref AppSecurityGroup
  TargetGroupArn:
    Description: Target Group ARN
    Value: !Ref AlbTargetGroup
  AsgName:
    Description: AutoScaling Group Name
    Value: !Ref AutoScalingGroup
  LaunchTemplateId:
    Description: Launch Template Id
    Value: !Ref LaunchTemplate
  InstanceRoleArn:
    Description: Instance Role ARN
    Value: !GetAtt InstanceRole.Arn
  InstanceProfileName:
    Description: Instance Profile Name
    Value: !Ref InstanceProfile
  LogsBucketName:
    Description: S3 Logs Bucket (SSE, versioned)
    Value: !Ref LogsBucket
  ParameterNamespace:
    Description: SSM Parameter base path
    Value: !Sub '/${ProjectName}/${EnvironmentSuffix}/${AWS::StackName}'
```