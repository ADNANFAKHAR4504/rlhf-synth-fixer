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
  TapStack — Region-agnostic, multi-AZ VPC + EC2 (ASG) + RDS + CloudWatch Logs/Alarms with least-privilege IAM.
  All resources are created new and named with ENVIRONMENT_SUFFIX. Defaults enable non-interactive pipeline deploys.

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
    Description: Suffix appended to all resource names for collision avoidance (e.g., dev-us, qa-eu1, prod-ap1).
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2])$'
    Description: Primary VPC CIDR block.
  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: 10.0.0.0/20,10.0.16.0/20
    Description: Two non-overlapping public subnet CIDRs (A,B).
  PrivateSubnetCidrs:
    Type: CommaDelimitedList
    Default: 10.0.32.0/20,10.0.48.0/20
    Description: Two non-overlapping private subnet CIDRs (A,B).
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedPattern: '^[a-z0-9.]+$'
    Description: EC2 instance type for application nodes.
  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: Desired number of EC2 instances in ASG (>=2 for HA).
  MaxSize:
    Type: Number
    Default: 4
    MinValue: 2
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
  RdsEngine:
    Type: String
    Default: postgres
    AllowedValues: [postgres, mysql]
    Description: Database engine.
  RdsEngineVersionPostgres:
    Type: String
    Default: '16.4'
    Description: Postgres engine version (used when RdsEngine=postgres).
  RdsEngineVersionMySql:
    Type: String
    Default: '8.0.35'
    Description: MySQL engine version (used when RdsEngine=mysql).
  RdsInstanceClass:
    Type: String
    Default: db.t4g.micro
    AllowedPattern: '^db\.[a-z0-9]+\.[a-z0-9]+$'
    Description: RDS instance class.
  RdsAllocatedStorage:
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 16384
    Description: Allocated storage in GiB.
  DBName:
    Type: String
    Default: appdb
    AllowedPattern: '^[a-zA-Z0-9_]{1,63}$'
    Description: Initial database name.
  DbMasterUsername:
    Type: String
    Default: masteruser
    AllowedPattern: '^[a-zA-Z0-9_]{1,16}$'
    Description: Master username stored in Secrets Manager.
  RetainDbSnapshotOnDelete:
    Type: String
    Default: 'true'
    AllowedValues: ['true','false']
    Description: If 'true', deletion protection is enabled and snapshots retained on replacement.
  EnableSnsForAlarms:
    Type: String
    Default: 'false'
    AllowedValues: ['true','false']
    Description: If 'true', creates SNS topic and subscribes provided email.
  AlarmEmail:
    Type: String
    Default: ''
    Description: Email address to subscribe for alarms when EnableSnsForAlarms=true.
  AmiAl2023:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64
    Description: SSM path for Amazon Linux 2023 AMI (x86_64). Uses latest per region.

Mappings:
  CW:
    Defaults:
      Interval: 60
      CpuHighThreshold: 80
      MemHighThreshold: 80
      RdsCpuHighThreshold: 80
      PeriodSecs: 300
      EvalPeriods: 1

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  EnableSns: !Equals [!Ref EnableSnsForAlarms, 'true']
  HasAlarmEmail: !And [!Condition EnableSns, !Not [!Equals [!Ref AlarmEmail, '']]]
  EngineIsPg: !Equals [!Ref RdsEngine, 'postgres']
  #EngineIsMySQL: !Equals [!Ref RdsEngine, 'mysql']
  RetainDbSnapshot: !Equals [!Ref RetainDbSnapshotOnDelete, 'true']

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
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-subnet-public-a' }]

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-subnet-public-b' }]

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-subnet-private-a' }]

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-subnet-private-b' }]

  NatEipA:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-eip-nat-a' }]

  NatEipB:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-eip-nat-b' }]

  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEipA.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-nat-a' }]

  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEipB.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-nat-b' }]

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
      NatGatewayId: !Ref NatGatewayB

  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-role'
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
      InstanceProfileName: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-profile'
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

  SecurityGroupRds:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: RDS private access SG
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !If [EngineIsPg, 5432, 3306]
          ToPort:   !If [EngineIsPg, 5432, 3306]
          SourceSecurityGroupId: !Ref SecurityGroupEc2
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-sg-rds' }]

  CloudWatchLogGroupEC2:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/${ProjectName}/${EnvironmentSuffix}/ec2'
      RetentionInDays: 30

  CloudWatchLogGroupApp:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/${ProjectName}/${EnvironmentSuffix}/app'
      RetentionInDays: 30

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${EnvironmentSuffix}-lt'
      LaunchTemplateData:
        IamInstanceProfile: { Arn: !GetAtt InstanceProfile.Arn }
        ImageId: !Ref AmiAl2023
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
                cat >/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CFG'
                {
                  "agent": { "metrics_collection_interval": ${CWInterval} },
                  "metrics": {
                    "namespace": "CWAgent",
                    "append_dimensions": {
                      "AutoScalingGroupName": "${!aws:AutoScalingGroupName}",
                      "InstanceId": "${!aws:InstanceId}"
                    },
                    "metrics_collected": {
                      "mem": { "measurement": ["mem_used_percent"], "metrics_collection_interval": 60 },
                      "cpu": { "measurement": ["cpu_usage_idle","cpu_usage_user","cpu_usage_system"], "metrics_collection_interval": 60, "resources": ["*"] }
                    }
                  },
                  "logs": {
                    "logs_collected": {
                      "files": {
                        "collect_list": [
                          { "file_path": "/var/log/messages",    "log_group_name": "${Ec2LogGroup}", "log_stream_name": "{instance_id}/messages" },
                          { "file_path": "/var/log/cloud-init.log","log_group_name": "${Ec2LogGroup}", "log_stream_name": "{instance_id}/cloud-init.log" }
                        ]
                      }
                    }
                  }
                }
                CFG
                systemctl enable amazon-cloudwatch-agent
                systemctl restart amazon-cloudwatch-agent
                echo "hello from $(hostname) in ${AWS::Region}" > /var/www/html/index.html || true
              - { CWInterval: !FindInMap [CW, Defaults, Interval], Ec2LogGroup: !Ref CloudWatchLogGroupEC2 }

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${EnvironmentSuffix}-asg'
      VPCZoneIdentifier: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      MinSize: '2'
      DesiredCapacity: !Ref DesiredCapacity
      MaxSize: !Ref MaxSize
      HealthCheckType: EC2
      HealthCheckGracePeriod: 120
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MetricsCollection: [{ Granularity: '1Minute' }]
      Tags:
        - { Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2', PropagateAtLaunch: true }

  SNSTopicAlarms:
    Type: AWS::SNS::Topic
    Condition: EnableSns
    Properties:
      TopicName: !Sub '${ProjectName}-${EnvironmentSuffix}-alarms'

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
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-cpu-high'
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions: [{ Name: AutoScalingGroupName, Value: !Ref AutoScalingGroup }]
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
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-mem-high'
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

  DbSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-db-secret'
      Description: !Sub 'Auto-generated credentials for ${ProjectName}-${EnvironmentSuffix} RDS'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DbMasterUsername}"}'
        GenerateStringKey: password
        PasswordLength: 20
        ExcludePunctuation: true

  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub '${ProjectName}-${EnvironmentSuffix}-rds-subnet-group'
      DBSubnetGroupName: !Sub '${ProjectName}-${EnvironmentSuffix}-rds-subnets'
      SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-rds-subnet-group' }]

  RDSParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: !Sub '${ProjectName}-${EnvironmentSuffix}-rds-params'
      Family: !If [EngineIsPg, 'postgres16', 'mysql8.0']
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-rds-params' }]

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${EnvironmentSuffix}-rds'
      Engine: !Ref RdsEngine
      EngineVersion: !If [EngineIsPg, !Ref RdsEngineVersionPostgres, !Ref RdsEngineVersionMySql]
      DBInstanceClass: !Ref RdsInstanceClass
      AllocatedStorage: !Ref RdsAllocatedStorage
      StorageEncrypted: true
      PubliclyAccessible: false
      VPCSecurityGroups: [!Ref SecurityGroupRds]
      DBSubnetGroupName: !Ref RDSSubnetGroup
      DBParameterGroupName: !Ref RDSParameterGroup
      DeletionProtection: !If [RetainDbSnapshot, true, false]
      MasterUsername: !Sub '{{resolve:secretsmanager:${DbSecret}::username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DbSecret}::password}}'
      DBName: !Ref DBName
      BackupRetentionPeriod: 7
      MultiAZ: false
      AutoMinorVersionUpgrade: true
      EnableCloudwatchLogsExports: !If [EngineIsPg, ['postgresql'], ['error']]
      Tags: [{ Key: Name, Value: !Sub '${ProjectName}-${EnvironmentSuffix}-rds' }]

  AlarmRdsCpuHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-rds-cpu-high'
      Namespace: AWS/RDS
      MetricName: CPUUtilization
      Dimensions: [{ Name: DBInstanceIdentifier, Value: !Ref RDSInstance }]
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: !If [EnableSns, [!Ref SNSTopicAlarms], []]

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label: { default: 'Network' }
        Parameters: [VpcCidr, PublicSubnetCidrs, PrivateSubnetCidrs]
      - Label: { default: 'Compute' }
        Parameters: [InstanceType, DesiredCapacity, MaxSize, KeyPairName, AllowedSshCidr, AmiAl2023]
      - Label: { default: 'Database' }
        Parameters: [RdsEngine, RdsEngineVersionPostgres, RdsEngineVersionMySql, RdsInstanceClass, RdsAllocatedStorage, DBName, DbMasterUsername, RetainDbSnapshotOnDelete]
      - Label: { default: 'Alarms & Notifications' }
        Parameters: [EnableSnsForAlarms, AlarmEmail]
    ParameterLabels:
      EnvironmentSuffix: { default: 'Environment Suffix (regex-validated)' }

Outputs:
  VpcId:
    Description: VPC Id
    Value: !Ref VPC
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc-id' }
  PublicSubnetIds:
    Description: Comma-separated public subnet IDs
    Value: !Sub '${PublicSubnetA},${PublicSubnetB}'
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-public-subnets' }
  PrivateSubnetIds:
    Description: Comma-separated private subnet IDs
    Value: !Sub '${PrivateSubnetA},${PrivateSubnetB}'
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-private-subnets' }
  AsgName:
    Description: Auto Scaling Group name
    Value: !Ref AutoScalingGroup
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-asg-name' }
  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-lt-id' }
  InstanceProfileArn:
    Description: Instance profile ARN
    Value: !GetAtt InstanceProfile.Arn
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-profile-arn' }
  InstanceRoleArn:
    Description: Instance role ARN
    Value: !GetAtt InstanceRole.Arn
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-ec2-role-arn' }
  RdsEndpoint:
    Description: RDS endpoint address
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-rds-endpoint' }
  CloudWatchEC2LogGroup:
    Description: EC2 log group
    Value: !Ref CloudWatchLogGroupEC2
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-lg-ec2-export' }
  CloudWatchAppLogGroup:
    Description: App log group
    Value: !Ref CloudWatchLogGroupApp
    Export: { Name: !Sub '${ProjectName}-${EnvironmentSuffix}-lg-app-export' }
  AlarmCpuName:
    Description: EC2 CPU alarm name
    Value: !Ref AlarmEc2CpuHigh
  AlarmMemName:
    Description: EC2 memory alarm name
    Value: !Ref AlarmEc2MemoryHigh
  AlarmRdsCpuName:
    Description: RDS CPU alarm name
    Value: !Ref AlarmRdsCpuHigh
  DbSecretArn:
    Description: DB secret ARN
    Value: !Ref DbSecret
```