# ideal_response

## Overview

Deliver a single, self-contained **TapStack.yml** CloudFormation template that stands up a brand-new production environment in **us-east-1** for migration to a new AWS account. The stack must follow **prod-** naming, create every resource it needs (no imports), and adhere to security best practices.

## Deliverable

A single valid YAML template (no prose inside the file) that passes `cfn-lint`, uses named IAM where applicable, and can be deployed without any external artifacts beyond template parameters.

## Architecture & Resources

* **Networking**

  * VPC named `ProdVPC` with DNS support enabled, CIDR `10.0.0.0/16`
  * Two **public subnets** across separate AZs (derived via `Fn::GetAZs`)
  * Internet Gateway + VPC attachment
  * Public route table, default route `0.0.0.0/0` via IGW, and subnet associations
* **Security**

  * Security Group allowing inbound HTTP (80) from anywhere and SSH (22) from parameterized CIDR
* **Compute**

  * Two Amazon Linux 2 EC2 instances, one per public subnet
  * Optional Elastic IP attached to Instance 1 (via condition)
  * IAM **Role** + **Instance Profile** granting:

    * `AmazonSSMManagedInstanceCore` for SSM
    * Least-privilege S3 read-only to the created bucket (bucket ARN + `/*`)
  * Basic UserData to install and serve a simple HTTP page
  * EBS volumes gp3, encrypted, delete on termination
* **Auto Scaling**

  * Launch Template mirroring the instance config (AMI, SG, IAM, UserData)
  * Auto Scaling Group spanning both public subnets
  * Desired capacity 2, min 2, max 4
  * CloudWatch Alarms + SimpleScaling policies:

    * Scale out when Avg CPU > 60% for 2 periods of 60s
    * Scale in when Avg CPU < 30% for 2 periods of 60s
* **Storage, Logging & Encryption**

  * S3 bucket `prod-tapstack-${AccountId}-${Region}` with versioning
  * KMS CMK for S3 & CloudTrail encryption + alias `alias/prod-tapstack-s3`
  * S3 Public Access Block: all four settings true
  * Bucket policy allowing CloudTrail ACL check and `PutObject` with `bucket-owner-full-control`
  * CloudTrail (single-region) with SSE-KMS using the CMK
* **Patching**

  * SSM Association running `AWS-RunPatchBaseline` nightly at 03:00 (cron), `Operation=Install`, targeting instances by tag

## Parameters & Conditions

* `KeyName` (String, default empty): optional SSH key; omitted when blank using `AWS::NoValue`
* `SSHLocation` (String, default `0.0.0.0/0`): CIDR for SSH ingress
* `CreateEIP` (String, default `true`, allowed `true|false`): controls EIP creation/association
* `LatestAmiId` (SSM parameter type): AL2 via `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`
* Conditions: `CreateEIPCondition`, `UseKeyName`

## Outputs

* `VpcId`, `PublicSubnetIds`, `Instance1PublicIp`, `Instance2PublicIp`
* `AsgName`, `S3BucketName`, `CloudTrailName`, `KmsKeyId`

## Metadata, Naming, Tags

* `AWS::CloudFormation::Interface` with grouped/labelled parameters
* Consistent `prod-` name tags and `{Environment=prod, Project=TapStack}` across taggable resources
* Per-resource `Metadata` (`Owner`, `Environment`, `Module`) for discoverability

## Security & Best Practices

* IAM policies scoped to created S3 bucket paths
* S3 SSE-KMS with CMK; strict Public Access Block
* CloudTrail log file validation enabled
* EBS encryption and termination-protected volumes by default in mappings
* Latest AL2 via SSM parameter; AZs derived, not hardcoded

## Quality & Linting

* Single YAML document (no prose or Markdown)
* No unnecessary `Fn::Sub` where literals suffice
* Correct `EIPAssociation` with `AllocationId`
* Alarm actions reference scaling policy ARNs
* Template deployable with named IAM capabilities

## Acceptance Criteria (must all be true)

* Two public subnets in different AZs with IGW routing
* Two EC2 instances, each in a different public subnet
* Security Group allows 80/22 (SSH CIDR parameterized)
* One EIP attached conditionally to Instance 1
* IAM role/profile with SSM core + S3 read-only (scoped)
* KMS CMK + alias used to encrypt S3 and CloudTrail
* Versioned S3 bucket with CloudTrail delivery and correct policy
* ASG (min 2, max 4, desired 2) + CPU alarms/policies
* Parameters for KeyName/SSHLocation/CreateEIP; conditions applied
* SSM nightly patch association
* Outputs for VPC, subnets, IPs, ASG, bucket, trail, KMS
* Passes `cfn-lint` without errors or avoidable warnings

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: TapStack production environment in us-east-1 with VPC, EC2, ASG, S3 (KMS-encrypted), CloudTrail, and SSM patching. All resources are created new with prod- naming.

Metadata:
  Owner: TapStack
  Environment: prod
  Module: Root
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: Network Configuration
        Parameters:
          - SSHLocation
      - Label:
          default: EC2 Configuration
        Parameters:
          - KeyName
          - CreateEIP
    ParameterLabels:
      KeyName:
        default: EC2 Key Pair Name
      SSHLocation:
        default: SSH CIDR Range
      CreateEIP:
        default: Create Elastic IP

Parameters:
  KeyName:
    Description: Optional EC2 KeyPair name for SSH; leave blank to skip assigning a key
    Type: String
    Default: ""
  SSHLocation:
    Description: The CIDR that can SSH to the EC2 instances (default allows anywhere)
    Type: String
    Default: 0.0.0.0/0
  CreateEIP:
    Description: Create and attach Elastic IP to the first instance
    Type: String
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
  LatestAmiId:
    Description: Latest Amazon Linux 2 AMI (from SSM public parameter)
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

Conditions:
  CreateEIPCondition: !Equals [!Ref CreateEIP, 'true']
  UseKeyName: !Not [!Equals [!Ref KeyName, ""]]

Resources:
  ProdVPC:
    Type: AWS::EC2::VPC
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: ProdVPC
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Properties:
      Tags:
        - Key: Name
          Value: prod-igw
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: prod-public-subnet-1
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: prod-public-subnet-2
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: prod-public-rt
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  PublicRoute:
    Type: AWS::EC2::Route
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  SubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Security
    Properties:
      GroupDescription: Security group for web servers (HTTP/SSH)
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
      Tags:
        - Key: Name
          Value: prod-web-sg
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  S3KMSKey:
    Type: AWS::KMS::Key
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Security
    Properties:
      Description: KMS key for S3 bucket encryption and CloudTrail SSE-KMS
      Enabled: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: EnableRootPermissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowCloudTrailUseOfKey
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringLike:
                kms:EncryptionContext:aws:cloudtrail:arn: !Sub arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*
      Tags:
        - Key: Name
          Value: prod-s3-kms-key
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Security
    Properties:
      AliasName: alias/prod-tapstack-s3
      TargetKeyId: !Ref S3KMSKey

  S3Bucket:
    Type: AWS::S3::Bucket
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Storage
    Properties:
      BucketName: !Sub prod-tapstack-${AWS::AccountId}-${AWS::Region}
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: prod-tapstack-bucket
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Storage
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt S3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${S3Bucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Logging
    DependsOn: S3BucketPolicy
    Properties:
      TrailName: prod-tapstack-trail
      IsLogging: true
      IsMultiRegionTrail: false
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      S3BucketName: !Ref S3Bucket
      KMSKeyId: !GetAtt S3KMSKey.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      Tags:
        - Key: Name
          Value: prod-cloudtrail
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  EC2Role:
    Type: AWS::IAM::Role
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: IAM
    Properties:
      RoleName: prod-ec2-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3ReadOnlyAccessToProdBucket
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt S3Bucket.Arn
                  - !Sub '${S3Bucket.Arn}/*'
      Tags:
        - Key: Name
          Value: prod-ec2-role
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: IAM
    Properties:
      InstanceProfileName: prod-ec2-instance-profile
      Roles:
        - !Ref EC2Role

  Instance1:
    Type: AWS::EC2::Instance
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Compute
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      KeyName: !If [UseKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      SubnetId: !Ref PublicSubnet1
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 8
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: alias/aws/ebs
            DeleteOnTermination: true
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          echo "Hello from prod - Instance 1" > /var/www/html/index.html
          systemctl enable --now httpd
      Tags:
        - Key: Name
          Value: prod-instance-1
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  Instance2:
    Type: AWS::EC2::Instance
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Compute
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      KeyName: !If [UseKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      SubnetId: !Ref PublicSubnet2
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 8
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: alias/aws/ebs
            DeleteOnTermination: true
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          echo "Hello from prod - Instance 2" > /var/www/html/index.html
          systemctl enable --now httpd
      Tags:
        - Key: Name
          Value: prod-instance-2
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  ElasticIP:
    Type: AWS::EC2::EIP
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Condition: CreateEIPCondition
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: prod-eip
        - Key: Environment
          Value: prod
        - Key: Project
          Value: TapStack

  EIPAssociation:
    Type: AWS::EC2::EIPAssociation
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Networking
    Condition: CreateEIPCondition
    Properties:
      InstanceId: !Ref Instance1
      AllocationId: !GetAtt ElasticIP.AllocationId

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Compute
    Properties:
      LaunchTemplateName: prod-launch-template
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t3.micro
        KeyName: !If [UseKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
        SecurityGroupIds:
          - !Ref WebSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 8
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: alias/aws/ebs
              DeleteOnTermination: true
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            echo "Hello from prod - ASG Instance" > /var/www/html/index.html
            systemctl enable --now httpd
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: prod-asg-instance
              - Key: Environment
                Value: prod
              - Key: Project
                Value: TapStack

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Compute
    Properties:
      AutoScalingGroupName: prod-asg
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: prod-asg
          PropagateAtLaunch: false
        - Key: Environment
          Value: prod
          PropagateAtLaunch: true
        - Key: Project
          Value: TapStack
          PropagateAtLaunch: true

  ScaleOutPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Compute
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: 1
      Cooldown: 120

  ScaleInPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Compute
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: -1
      Cooldown: 120

  ScaleOutAlarm:
    Type: AWS::CloudWatch::Alarm
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Monitoring
    Properties:
      AlarmName: prod-cpu-high
      AlarmDescription: Trigger scale out when ASG average CPU > 60%
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 60
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !GetAtt ScaleOutPolicy.Arn

  ScaleInAlarm:
    Type: AWS::CloudWatch::Alarm
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Monitoring
    Properties:
      AlarmName: prod-cpu-low
      AlarmDescription: Trigger scale in when ASG average CPU < 30%
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !GetAtt ScaleInPolicy.Arn

  PatchingAssociation:
    Type: AWS::SSM::Association
    Metadata:
      Owner: TapStack
      Environment: prod
      Module: Management
    Properties:
      AssociationName: prod-patching-association
      Name: AWS-RunPatchBaseline
      Parameters:
        Operation:
          - Install
      ScheduleExpression: cron(0 3 * * ? *)
      Targets:
        - Key: tag:Project
          Values:
            - TapStack

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref ProdVPC
  PublicSubnetIds:
    Description: Public Subnet IDs (comma-separated)
    Value: !Join
      - ","
      - - !Ref PublicSubnet1
        - !Ref PublicSubnet2
  Instance1PublicIp:
    Description: Public IP of Instance 1 (EIP if created)
    Value: !If
      - CreateEIPCondition
      - !Ref ElasticIP
      - !GetAtt Instance1.PublicIp
  Instance2PublicIp:
    Description: Public IP of Instance 2
    Value: !GetAtt Instance2.PublicIp
  AsgName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail
  KmsKeyId:
    Description: KMS Key ID
    Value: !Ref S3KMSKey
```