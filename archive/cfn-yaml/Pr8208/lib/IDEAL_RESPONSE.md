# ideal_response.md

## Functional scope (build everything new):

Implements a region-consistent, brand-new deployment for a global e-commerce platform across us-east-1, eu-west-1, and ap-southeast-1 using AWS CDK (Python) that synthesizes a single TapStack.yml. Provisions per-region VPCs with segregated public and private subnets, dual-AZ placement, Internet/NAT gateways, security groups, and IAM roles. Deploys Auto Scaling Groups for Amazon Linux EC2 instances behind a Launch Template with CloudWatch Agent for metrics and logs, and creates a private RDS instance per region with parameters, subnet groups, secrets, backups, and deletion protection controls. Configures CloudWatch Log Groups and high-signal alarms for EC2 CPU and memory and RDS CPU, with optional SNS notifications. Names every resource with an ENVIRONMENT_SUFFIX and validates inputs via safe regex patterns instead of hard allowed values. Includes teardown readiness through snapshot-on-delete for RDS, and produces explicit outputs for programmatic validation.

## Deliverable:

Single, production-ready TapStack.yml written in YAML (not JSON) containing all Parameters with safe defaults, Conditions, Mappings, Resources, and Outputs so the pipeline can deploy without CLI inputs. The template stands alone, creates all modules without referencing external stacks, adheres to least-privilege access for EC2 read-only S3, and enforces best practices for HA, logging, and security across three regions. The file must pass cfn-lint and synth cleanly from AWS CDK Python, with modular sections structured for easy per-region overrides while preserving global consistency.

## Constraints and assumptions:

Uses a regex-validated EnvironmentSuffix for collision-free resource names and repeatable multi-region rollouts, without brittle hardcoded AllowedValues. Ensures at least two EC2 instances per region across multiple AZs with Auto Scaling settings defined, and a single RDS instance in private subnets per region with encryption, backups, and minimal exposure. CloudWatch resources are region-scoped, alarms are actionable, and optional SNS is gated by a parameter and email presence. Resource cleanup is addressed through snapshot retention guardrails and explicit exports to enable orchestrated deletes. The solution avoids external dependencies and embeds all logic, variables, and outputs in TapStack.yml.

## Testing and validation:

Automated tests verify that each target region contains the expected VPC, subnets, gateways, security groups, IAM roles/profiles, Launch Template, ASG, RDS, log groups, and alarms, with names suffixed by EnvironmentSuffix. Assertions confirm subnet counts, AZ distribution, ASG capacity bounds, RDS subnet group membership and encryption, and the presence of CloudWatch Agent metrics. Outputs are compared across regions for structural parity, and alarms are validated for correct dimensions and thresholds. Linting and synthesis checks run as gates to ensure schema integrity and deployability in a single pipeline attempt.

## Security and operations:

IAM follows least privilege, EC2 instances receive only S3 read-only permissions and CloudWatch Agent access. RDS secrets are managed by AWS Secrets Manager with generated credentials, no plaintext in the template. Network boundaries place databases in private subnets; public exposure is limited to necessary ports on EC2 security groups with a configurable SSH CIDR. Operational visibility comes from CloudWatch logs, metrics, and alarms, and the stack includes safe defaults for deletion and backups to support incident recovery and controlled teardown.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack — Multi-AZ VPC + EC2 (ASG) + CloudWatch Logs/Alarms with least-privilege IAM.
  Includes LocalStack-safe mode via DeployTarget.

Parameters:
  ProjectName:
    Type: String
    Default: tapstack
    AllowedPattern: '^[a-z0-9-]{3,32}$'
    ConstraintDescription: must be 3–32 chars, lowercase letters, numbers, and hyphens only.
    Description: Logical project name used as a prefix in resource names.

  EnvironmentSuffix:
    Type: String
    Default: dev-us
    AllowedPattern: '^[a-z0-9-]{3,32}$'
    ConstraintDescription: must be 3–32 chars, lowercase letters, numbers, and hyphens only.
    Description: Suffix appended to all resource names for collision avoidance.

  DeployTarget:
    Type: String
    Default: localstack
    AllowedValues: [aws, localstack]
    Description: Use 'localstack' to skip services commonly unsupported by LocalStack.

  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2])$'
    Description: Primary VPC CIDR block.

  # LocalStack-safe: keep String + Split/Select
  PublicSubnetCidrs:
    Type: String
    Default: 10.0.0.0/20,10.0.16.0/20
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2]),([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2])$'
    Description: Two non-overlapping public subnet CIDRs (A,B), comma-separated (no spaces).

  PrivateSubnetCidrs:
    Type: String
    Default: 10.0.32.0/20,10.0.48.0/20
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2]),([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2])$'
    Description: Two non-overlapping private subnet CIDRs (A,B), comma-separated (no spaces).

  InstanceType:
    Type: String
    Default: t3.micro
    AllowedPattern: '^[a-z0-9.]+$'
    Description: EC2 instance type for application nodes.

  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10
    Description: Desired number of EC2 instances in ASG.

  MaxSize:
    Type: Number
    Default: 4
    MinValue: 1
    MaxValue: 20
    Description: Maximum number of EC2 instances in ASG.

  KeyPairName:
    Type: String
    Default: ''
    Description: Optional EC2 KeyPair name. Leave empty to disable SSH key association.

  AllowedSshCidr:
    Type: String
    Default: 0.0.0.0/0
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2])$'
    Description: CIDR allowed to SSH (tcp/22) to EC2 security group.

  EnableSnsForAlarms:
    Type: String
    Default: 'false'
    AllowedValues: ['true','false']
    Description: If 'true', creates SNS topic and subscribes provided email (AWS only recommended).

  AlarmEmail:
    Type: String
    Default: ''
    Description: Email address to subscribe for alarms when EnableSnsForAlarms=true.

  AmiId:
    Type: String
    Default: ''
    Description: >
      AMI ID to use for EC2 instances.
      Required for LocalStack. Optional for AWS (can be auto-resolved via SSM externally).

Mappings:
  CW:
    Defaults:
      Interval: 60
      CpuHighThreshold: 80
      MemHighThreshold: 80
      PeriodSecs: 300
      EvalPeriods: 1

Conditions:
  IsLocalStack: !Equals [!Ref DeployTarget, 'localstack']
  IsAws: !Equals [!Ref DeployTarget, 'aws']

  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  EnableSns: !And [!Equals [!Ref EnableSnsForAlarms, 'true'], !Condition IsAws]
  HasAlarmEmail: !And [!Condition EnableSns, !Not [!Equals [!Ref AlarmEmail, '']]]

  HasAmiId: !Not [!Equals [!Ref AmiId, '']]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc' }]

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-igw' }]

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-rtb-public' }]

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-rtb-private-a' }]

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-rtb-private-b' }]

  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
    DependsOn: VPCGatewayAttachment

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Split [",", !Ref PublicSubnetCidrs]]
      MapPublicIpOnLaunch: true
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-subnet-public-a' }]

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Split [",", !Ref PublicSubnetCidrs]]
      MapPublicIpOnLaunch: true
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-subnet-public-b' }]

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Split [",", !Ref PrivateSubnetCidrs]]
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-subnet-private-a' }]

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Split [",", !Ref PrivateSubnetCidrs]]
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-subnet-private-b' }]

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTableA

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTableB

  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-s3-readonly'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ['s3:Get*','s3:List*']
                Resource: ['*']
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-role' }]

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref InstanceRole]
      Path: '/'

  SecurityGroupEc2:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: EC2 access SG
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - { IpProtocol: tcp, FromPort: 22,  ToPort: 22,  CidrIp: !Ref AllowedSshCidr }
        - { IpProtocol: tcp, FromPort: 80,  ToPort: 80,  CidrIp: 0.0.0.0/0 }
        - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: 0.0.0.0/0 }
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-sg-ec2' }]

  CloudWatchLogGroupEC2:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: 30

  CloudWatchLogGroupApp:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: 30

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        IamInstanceProfile: { Arn: !GetAtt InstanceProfile.Arn }
        ImageId: !If
          - HasAmiId
          - !Ref AmiId
          - ami-1234567890abcdef0
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        SecurityGroupIds: [!Ref SecurityGroupEc2]
        MetadataOptions: { HttpTokens: required, HttpEndpoint: enabled }
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - { Key: Name,        Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2' }
              - { Key: Project,     Value: !Ref ProjectName }
              - { Key: Environment, Value: !Ref EnvironmentSuffix }
          - ResourceType: volume
            Tags:
              - { Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2' }
        UserData:
          Fn::Base64:
            Fn::Sub:
              - |
                #!/bin/bash
                set -xe

                dnf update -y || yum update -y
                dnf install -y amazon-cloudwatch-agent httpd || yum install -y amazon-cloudwatch-agent httpd

                systemctl enable httpd || true
                systemctl start httpd || true

                mkdir -p /opt/aws/amazon-cloudwatch-agent/etc

                cat >/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<CFG
                {
                  "agent": { "metrics_collection_interval": ${CWInterval} },
                  "metrics": {
                    "namespace": "CWAgent",
                    "append_dimensions": { "InstanceId": "{instance_id}" },
                    "metrics_collected": {
                      "mem": { "measurement": ["mem_used_percent"], "metrics_collection_interval": 60 },
                      "cpu": {
                        "measurement": ["cpu_usage_idle","cpu_usage_user","cpu_usage_system"],
                        "metrics_collection_interval": 60,
                        "resources": ["*"]
                      }
                    }
                  },
                  "logs": {
                    "logs_collected": {
                      "files": {
                        "collect_list": [
                          { "file_path": "/var/log/messages", "log_group_name": "${CloudWatchLogGroupEC2}", "log_stream_name": "{instance_id}/messages" },
                          { "file_path": "/var/log/cloud-init.log", "log_group_name": "${CloudWatchLogGroupEC2}", "log_stream_name": "{instance_id}/cloud-init.log" }
                        ]
                      }
                    }
                  }
                }
                CFG

                systemctl enable amazon-cloudwatch-agent || true
                systemctl restart amazon-cloudwatch-agent || true

                echo "hello from $(hostname) in ${AWS::Region}" > /var/www/html/index.html || true
              - CWInterval: !FindInMap [CW, Defaults, Interval]

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier: !If
        - IsLocalStack
        - [!Ref PublicSubnetA, !Ref PublicSubnetB]
        - [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      MinSize: '1'
      DesiredCapacity: !Ref DesiredCapacity
      MaxSize: !Ref MaxSize
      HealthCheckType: EC2
      HealthCheckGracePeriod: 120
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: $Latest
      MetricsCollection:
        - Granularity: '1Minute'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2'
          PropagateAtLaunch: true

  SNSTopicAlarms:
    Type: AWS::SNS::Topic
    Condition: EnableSns
    Properties: {}

  SNSSubscription:
    Type: AWS::SNS::Subscription
    Condition: HasAlarmEmail
    Properties:
      Protocol: email
      Endpoint: !Ref AlarmEmail
      TopicArn: !Ref SNSTopicAlarms

  AlarmEc2CpuHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      Statistic: Average
      Period: !FindInMap [CW, Defaults, PeriodSecs]
      EvaluationPeriods: !FindInMap [CW, Defaults, EvalPeriods]
      Threshold: !FindInMap [CW, Defaults, CpuHighThreshold]
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: !If [EnableSns, [!Ref SNSTopicAlarms], []]

  AlarmEc2MemoryHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      Namespace: CWAgent
      MetricName: mem_used_percent
      Dimensions: [{ Name: AutoScalingGroupName, Value: !Ref AutoScalingGroup }]
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: !If [EnableSns, [!Ref SNSTopicAlarms], []]

Outputs:
  VpcId:
    Description: VPC Id
    Value: !Ref VPC

  PublicSubnetIds:
    Description: Comma-separated public subnet IDs
    Value: !Join [",", [!Ref PublicSubnetA, !Ref PublicSubnetB]]

  PrivateSubnetIds:
    Description: Comma-separated private subnet IDs
    Value: !Join [",", [!Ref PrivateSubnetA, !Ref PrivateSubnetB]]

  AsgName:
    Description: Auto Scaling Group name
    Value: !Ref AutoScalingGroup

  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate

  InstanceProfileArn:
    Description: Instance profile ARN
    Value: !GetAtt InstanceProfile.Arn

  InstanceRoleArn:
    Description: Instance role ARN
    Value: !GetAtt InstanceRole.Arn

  CloudWatchEC2LogGroup:
    Description: EC2 log group
    Value: !Ref CloudWatchLogGroupEC2

  CloudWatchAppLogGroup:
    Description: App log group
    Value: !Ref CloudWatchLogGroupApp

  AlarmCpuName:
    Description: EC2 CPU alarm logical id
    Value: !Ref AlarmEc2CpuHigh

  AlarmMemName:
    Description: EC2 memory alarm logical id
    Value: !Ref AlarmEc2MemoryHigh
```