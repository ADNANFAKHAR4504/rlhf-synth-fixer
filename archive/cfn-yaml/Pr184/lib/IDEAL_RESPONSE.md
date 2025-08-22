# CloudFormation Multi-Environment Management Solution

## Overview

This comprehensive, modular, and secure AWS infrastructure-as-code solution uses CloudFormation to manage development (dev), testing (test), and production (prod) environments with consistency, compliance, and scalability.

## Complete CloudFormation Template

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Multi-Environment CloudFormation Template for Dev, Test, and Production Infrastructure"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
          - Environment
      - Label:
          default: "Tagging"
        Parameters:
          - Owner
          - CostCenter

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming (e.g., dev, test, prod)"
    AllowedPattern: "^[a-zA-Z0-9]+$"
    ConstraintDescription: "Must contain only alphanumeric characters"

  Environment:
    Type: String
    Default: "dev"
    AllowedValues: [dev, test, prod]
    Description: "Deployment environment"

  Owner:
    Type: String
    Default: "DevOps Team"
    Description: "Owner tag for resources"

  CostCenter:
    Type: String
    Default: "Engineering"
    Description: "Cost center tag for resources"

Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      MinSize: 1
      MaxSize: 2
      CPUAlarmThreshold: 80
    test:
      InstanceType: t3.small
      MinSize: 1
      MaxSize: 3
      CPUAlarmThreshold: 70
    prod:
      InstanceType: m5.large
      MinSize: 2
      MaxSize: 10
      CPUAlarmThreshold: 60

Conditions:
  IsProduction: !Equals [!Ref Environment, "prod"]
Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-VPC"
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-IGW"
        - Key: Environment
          Value: !Ref Environment

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
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Public-Subnet-AZ1"
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Public-Subnet-AZ2"
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Private-Subnet-AZ1"
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: 10.0.12.0/24
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Private-Subnet-AZ2"
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-NatGateway1-EIP"

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-NatGateway2-EIP"

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-NatGateway-AZ1"

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-NatGateway-AZ2"

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Public-Routes"

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
        - Key: Name
          Value: !Sub "${AWS::StackName}-Private-Routes-AZ1"

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
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
          Value: !Sub "${AWS::StackName}-Private-Routes-AZ2"

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # IAM Roles and Policies
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-EC2Role"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !If
          - IsProduction
          - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
          - !Ref AWS::NoValue
      Policies:
        - PolicyName: EC2BasicPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: "*"
                Condition:
                  StringEquals:
                    "cloudwatch:namespace": !Sub "${AWS::StackName}/Application"
      Tags:
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${AWS::StackName}-ALB-SG"
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
          Value: !Sub "${AWS::StackName}-ALB-SG"
        - Key: Environment
          Value: !Ref Environment

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${AWS::StackName}-WebServer-SG"
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !If [IsProduction, "10.0.0.0/16", "0.0.0.0/0"]
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-WebServer-SG"
        - Key: Environment
          Value: !Ref Environment

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${AWS::StackName}-ALB"
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${AWS::StackName}-TG"
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template and Auto Scaling
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${AWS::StackName}-LaunchTemplate"
      LaunchTemplateData:
        ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
        InstanceType:
          !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
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
            echo "<h1>Environment: ${Environment}</h1>" > /var/www/html/index.html
            echo "<h2>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h2>" >> /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub "${AWS::StackName}-WebServer"
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref Owner
              - Key: CostCenter
                Value: !Ref CostCenter

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub "${AWS::StackName}-ASG"
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]
      DesiredCapacity: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-ASG"
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true

  # CloudWatch Alarms
  CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-HighCPU"
      AlarmDescription: "Alarm when CPU exceeds threshold"
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold:
        !FindInMap [EnvironmentConfig, !Ref Environment, CPUAlarmThreshold]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic

  # SNS Topic for Notifications
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "${AWS::StackName}-Alerts"
      DisplayName: !Sub "${AWS::StackName} Infrastructure Alerts"

  # AWS Config Configuration Recorder (for compliance)
  ConfigConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Condition: IsProduction
    Properties:
      Name: !Sub "${AWS::StackName}-ConfigRecorder"
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigRole:
    Type: AWS::IAM::Role
    Condition: IsProduction
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole

  # DynamoDB Table (keeping original requirement)
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "TurnAroundPromptTable${EnvironmentSuffix}"
      AttributeDefinitions:
        - AttributeName: "id"
          AttributeType: "S"
      KeySchema:
        - AttributeName: "id"
          KeyType: "HASH"
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: !If [IsProduction, true, false]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

Outputs:
  VPCId:
    Description: "VPC ID"
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCID"

  PublicSubnets:
    Description: "Public Subnets"
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnets"

  PrivateSubnets:
    Description: "Private Subnets"
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnets"

  ApplicationLoadBalancerDNS:
    Description: "Application Load Balancer DNS name"
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-ALB-DNS"

  ApplicationLoadBalancerArn:
    Description: "Application Load Balancer ARN"
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub "${AWS::StackName}-ALB-ARN"

  TurnAroundPromptTableName:
    Description: "Name of the DynamoDB table"
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableName"

  TurnAroundPromptTableArn:
    Description: "ARN of the DynamoDB table"
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableArn"

  AutoScalingGroupName:
    Description: "Auto Scaling Group Name"
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub "${AWS::StackName}-ASG-Name"

  SNSTopicArn:
    Description: "SNS Topic ARN for alerts"
    Value: !Ref SNSTopic
    Export:
      Name: !Sub "${AWS::StackName}-SNS-Topic"

  StackName:
    Description: "Name of this CloudFormation stack"
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-StackName"

  EnvironmentSuffix:
    Description: "Environment suffix used for this deployment"
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-EnvironmentSuffix"
```

## Key Features

### Environment-Specific Configuration
- **Dev Environment**: t3.micro instances, 1-2 instances, 80% CPU threshold
- **Test Environment**: t3.small instances, 1-3 instances, 70% CPU threshold  
- **Prod Environment**: m5.large instances, 2-10 instances, 60% CPU threshold

### Networking Architecture
- **Multi-AZ VPC**: 10.0.0.0/16 CIDR with DNS support
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24 across 2 AZs
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24 across 2 AZs
- **Redundant NAT Gateways**: One in each AZ for high availability
- **Internet Gateway**: For public subnet internet access

### Security & Compliance
- **IAM Roles**: Least privilege access with CloudWatch permissions
- **Security Groups**: 
  - ALB allows HTTP/HTTPS from internet
  - Web servers allow HTTP only from ALB
  - SSH access: Open for dev/test, VPC-only for production
- **AWS Config**: Enabled for production compliance monitoring
- **Conditional Resources**: Production-only features using CloudFormation conditions

### Application Infrastructure
- **Application Load Balancer**: Internet-facing with health checks
- **Auto Scaling Group**: Environment-specific sizing in private subnets
- **Launch Template**: Latest Amazon Linux 2 AMI via SSM parameter
- **Target Group**: HTTP health checks on root path

### Monitoring & Alerting
- **CloudWatch Alarms**: Environment-specific CPU thresholds
- **SNS Topic**: Infrastructure alert notifications
- **Comprehensive Tagging**: Environment, Owner, and CostCenter tags

### Data Storage
- **DynamoDB Table**: 
  - Pay-per-request billing mode
  - Point-in-time recovery for production
  - Environment-specific naming with suffix

## Deployment

This template can be deployed to any AWS region and will automatically configure resources based on the selected environment (dev, test, or prod). The template uses CloudFormation conditions and mappings to ensure environment-appropriate configurations while maintaining consistency across deployments.