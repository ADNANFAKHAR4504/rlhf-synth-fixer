```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-tier enterprise infrastructure with VPC, bastion host, encrypted S3, IAM roles, and CloudWatch monitoring, accessed via SSM Session Manager'

Parameters:
  CompanyName:
    Type: String
    Default: 'Enterprise'
    Description: 'Company name for resource naming and tagging'

  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment type for resource tagging'

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<String>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'SSM Parameter for the latest Amazon Linux 2 AMI ID.'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-IGW'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Public-Subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Public-Subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName
        - Key: Type
          Value: 'Public'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.10.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-Subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-Subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName
        - Key: Type
          Value: 'Private'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-NAT-EIP-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-NAT-EIP-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-NAT-Gateway-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-NAT-Gateway-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Public-RouteTable'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-RouteTable-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-RouteTable-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${CompanyName}-${Environment}-Bastion-SG'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Bastion-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  PrivateInstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${CompanyName}-${Environment}-Private-Instance-SG'
      GroupDescription: 'Security group for private instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '10.0.0.0/16'
          Description: 'HTTP access from VPC'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '10.0.0.0/16'
          Description: 'HTTPS access from VPC'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-Instance-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  # IAM Roles and Policies
  BastionHostRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-BastionHost-Role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  BastionHostInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref BastionHostRole

  PrivateInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: PrivateInstancePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${ApplicationBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationBucket.Arn
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-PrivateInstance-Role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  PrivateInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref PrivateInstanceRole

  # S3 Buckets with Encryption
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'application-bucket-${Environment}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Application-Bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'logging-bucket-${Environment}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Logging-Bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  # EC2 Instances
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      IamInstanceProfile: !Ref BastionHostInstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Bastion-Host'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName
        - Key: Type
          Value: 'Bastion'

  PrivateInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.small
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref PrivateInstanceSecurityGroup
      IamInstanceProfile: !Ref PrivateInstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-Instance-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName
        - Key: Type
          Value: 'Application'

  PrivateInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.small
      SubnetId: !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref PrivateInstanceSecurityGroup
      IamInstanceProfile: !Ref PrivateInstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-Instance-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName
        - Key: Type
          Value: 'Application'

  # VPC Endpoints for SSM
  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${CompanyName}-${Environment}-VPCEndpoint-SG'
      GroupDescription: 'Security group for VPC Interface Endpoints'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !GetAtt VPC.CidrBlock
          Description: 'Allow HTTPS from within the VPC'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-VPCEndpoint-SG'

  SSMEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssm'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup
      PrivateDnsEnabled: true

  SSMMessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssmmessages'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup
      PrivateDnsEnabled: true

  EC2MessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2messages'
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup
      PrivateDnsEnabled: true

  # SNS Topic for Notifications
  CPUAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${CompanyName}-${Environment}-CPU-Alarms'
      DisplayName: 'CPU Utilization Alarms'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-CPU-Alarm-Topic'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  # CloudWatch Alarms
  BastionCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${CompanyName}-${Environment}-Bastion-CPU-High'
      AlarmDescription: 'Bastion host CPU utilization is above 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref BastionHost
      AlarmActions:
        - !Ref CPUAlarmTopic
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Bastion-CPU-Alarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  PrivateInstance1CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${CompanyName}-${Environment}-Private-Instance-1-CPU-High'
      AlarmDescription: 'Private instance 1 CPU utilization is above 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref PrivateInstance1
      AlarmActions:
        - !Ref CPUAlarmTopic
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-Instance-1-CPU-Alarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

  PrivateInstance2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${CompanyName}-${Environment}-Private-Instance-2-CPU-High'
      AlarmDescription: 'Private instance 2 CPU utilization is above 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref PrivateInstance2
      AlarmActions:
        - !Ref CPUAlarmTopic
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-Private-Instance-2-CPU-Alarm'
        - Key: Environment
          Value: !Ref Environment
        - Key: Company
          Value: !Ref CompanyName

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
      Name: !Sub '${AWS::StackName}-Public-Subnet-1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-2-ID'

  BastionHostId:
    Description: 'Bastion Host Instance ID'
    Value: !Ref BastionHost
    Export:
      Name: !Sub '${AWS::StackName}-Bastion-Host-ID'

  BastionHostPublicIP:
    Description: 'Bastion Host Public IP'
    Value: !GetAtt BastionHost.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-Bastion-Host-Public-IP'

  PrivateInstance1Id:
    Description: 'Private EC2 Instance 1 ID'
    Value: !Ref PrivateInstance1
    Export:
      Name: !Sub '${AWS::StackName}-Private-Instance-1-ID'

  PrivateInstance2Id:
    Description: 'Private EC2 Instance 2 ID'
    Value: !Ref PrivateInstance2
    Export:
      Name: !Sub '${AWS::StackName}-Private-Instance-2-ID'

  ApplicationBucketName:
    Description: 'Application S3 Bucket Name'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-Application-Bucket-Name'

  LoggingBucketName:
    Description: 'Logging S3 Bucket Name'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-Logging-Bucket-Name'

  SNSTopicArn:
    Description: 'SNS Topic ARN for CPU Alarms'
    Value: !Ref CPUAlarmTopic
    Export:
      Name: !Sub '${AWS::StackName}-CPU-Alarm-Topic-ARN'

  # Pass parameters through as outputs for test validation
  CompanyNameOutput:
    Description: 'Company name used for tagging and naming'
    Value: !Ref CompanyName

  EnvironmentOutput:
    Description: 'Environment used for tagging and naming'
    Value: !Ref Environment
```