# CloudFormation Multi-Region AWS Cloud Environment Solution

This solution provides a comprehensive CloudFormation implementation for deploying a robust AWS cloud environment supporting a distributed web application across multiple regions (us-east-1 and us-west-2).

## Architecture Overview

The infrastructure implements a highly available, scalable, and secure cloud environment with:

- **Multi-Region Support**: Deployable to both us-east-1 and us-west-2 regions
- **High Availability**: Resources distributed across 3 availability zones per region
- **Auto Scaling**: Dynamic scaling from 2 to 6 t3.medium instances
- **Load Balancing**: Application Load Balancer for traffic distribution
- **Network Segmentation**: VPC with 3 public and 3 private subnets
- **Security**: Layered security groups with principle of least privilege
- **Monitoring**: CloudWatch alarms for CPU utilization monitoring
- **Tagging**: Consistent resource tagging for management and compliance

## Implementation

### TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-region capable AWS cloud environment for distributed web application'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  KeyPairName:
    Type: String
    Default: ''
    Description: 'EC2 Key Pair name for instances (leave empty to skip)'
  
  ImageId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Amazon Linux 2 AMI ID'

Conditions:
  UseKeyPair: !Not [!Equals [!Ref KeyPairName, '']]

Mappings:
  RegionMap:
    us-east-1:
      AZ1: us-east-1a
      AZ2: us-east-1b
      AZ3: us-east-1c
    us-west-2:
      AZ1: us-west-2a
      AZ2: us-west-2b
      AZ3: us-west-2c

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
          Value: !Sub 'TapStack${EnvironmentSuffix}-VPC'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-IGW'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets (3)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Public-Subnet-1'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Public-Subnet-2'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: '10.0.3.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Public-Subnet-3'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  # Private Subnets (3)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Private-Subnet-1'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Private-Subnet-2'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: '10.0.13.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Private-Subnet-3'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  # NAT Gateways and Elastic IPs
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-NAT-EIP-1'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-NAT-EIP-2'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-NAT-EIP-3'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-NAT-Gateway-1'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-NAT-Gateway-2'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-NAT-Gateway-3'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  # Route Tables - Public
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Public-Routes'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  # Route Tables - Private
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Private-Routes-1'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

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
          Value: !Sub 'TapStack${EnvironmentSuffix}-Private-Routes-2'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-Private-Routes-3'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapStack${EnvironmentSuffix}-ALB-SG'
      GroupDescription: 'Security group for Application Load Balancer - allows HTTP and HTTPS'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-ALB-SecurityGroup'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapStack${EnvironmentSuffix}-EC2-SG'
      GroupDescription: 'Security group for EC2 instances - allows traffic from ALB'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP traffic from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTPS traffic from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/16'
          Description: 'Allow SSH from VPC'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-EC2-SecurityGroup'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'TapStack${EnvironmentSuffix}-ALB'
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: deletion_protection.enabled
          Value: 'false'
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-ALB'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  # Target Group
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'TapStack${EnvironmentSuffix}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckPort: traffic-port
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Matcher:
        HttpCode: '200,302'
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
        - Key: stickiness.enabled
          Value: 'false'
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-TargetGroup'
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'TapStack${EnvironmentSuffix}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref ImageId
        InstanceType: t3.medium
        KeyName: !If [UseKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt InstanceProfile.Arn
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${AWS::Region} - Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'TapStack${EnvironmentSuffix}-Instance'
              - Key: Environment
                Value: Production
              - Key: Team
                Value: DevOps
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'TapStack${EnvironmentSuffix}-Volume'
              - Key: Environment
                Value: Production
              - Key: Team
                Value: DevOps

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    Properties:
      RoleName: !Sub 'TapStack${EnvironmentSuffix}-EC2-Role-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Environment
          Value: Production
        - Key: Team
          Value: DevOps

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'TapStack${EnvironmentSuffix}-InstanceProfile-${AWS::Region}'
      Roles:
        - !Ref EC2InstanceRole

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AutoScalingGroupName: !Sub 'TapStack${EnvironmentSuffix}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Cooldown: 300
      Tags:
        - Key: Name
          Value: !Sub 'TapStack${EnvironmentSuffix}-ASG'
          PropagateAtLaunch: false
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true
        - Key: Team
          Value: DevOps
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TapStack${EnvironmentSuffix}-CPU-High'
      AlarmDescription: 'Alarm when CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy
      TreatMissingData: notBreaching

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'TapStack${EnvironmentSuffix}-CPU-Low'
      AlarmDescription: 'Alarm when CPU is below 25%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy
      TreatMissingData: notBreaching

Outputs:
  LoadBalancerDNS:
    Description: 'DNS name of the load balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-LoadBalancer-DNS'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-ASG-Name'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-VPC-ID'
  
  Region:
    Description: 'AWS Region of deployment'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-Region'
  
  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-PublicSubnet1'
  
  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-PublicSubnet2'
  
  PublicSubnet3Id:
    Description: 'Public Subnet 3 ID'
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-PublicSubnet3'
  
  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-PrivateSubnet1'
  
  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-PrivateSubnet2'
  
  PrivateSubnet3Id:
    Description: 'Private Subnet 3 ID'
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-PrivateSubnet3'
  
  ALBSecurityGroupId:
    Description: 'ALB Security Group ID'
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-ALB-SG'
  
  EC2SecurityGroupId:
    Description: 'EC2 Security Group ID'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub 'TapStack${EnvironmentSuffix}-EC2-SG'
```

### TapStack.json

For testing and tooling compatibility, the same template is also available in JSON format:

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Multi-region capable AWS cloud environment for distributed web application",
    "Parameters": {
        "EnvironmentSuffix": {
            "Type": "String",
            "Default": "dev",
            "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
            "AllowedPattern": "^[a-zA-Z0-9]+$",
            "ConstraintDescription": "Must contain only alphanumeric characters"
        },
        "KeyPairName": {
            "Type": "String",
            "Default": "",
            "Description": "EC2 Key Pair name for instances (leave empty to skip)"
        },
        "ImageId": {
            "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
            "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
            "Description": "Amazon Linux 2 AMI ID"
        }
    },
    "Conditions": {
        "UseKeyPair": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "KeyPairName"
                        },
                        ""
                    ]
                }
            ]
        }
    }
}
```

*Note: The full JSON template contains all resources identical to the YAML version above.*

## Key Features

### 1. Multi-Region Architecture
- Template deployable to any AWS region without modification
- Region-specific IAM resource naming to avoid conflicts
- Support for us-east-1 and us-west-2 as required

### 2. High Availability
- Resources distributed across 3 availability zones
- Redundant NAT gateways for private subnet internet access
- Auto Scaling Group ensures minimum 2 instances always running

### 3. Network Security
- VPC with CIDR block 10.0.0.0/16
- 3 public subnets for load balancer and NAT gateways
- 3 private subnets for EC2 instances
- Security groups implementing least privilege:
  - ALB allows HTTP/HTTPS from internet
  - EC2 instances only accept traffic from ALB
  - SSH restricted to VPC CIDR range

### 4. Auto Scaling & Load Balancing
- Application Load Balancer distributes traffic across healthy instances
- Auto Scaling Group with:
  - Minimum: 2 instances
  - Maximum: 6 instances
  - Instance type: t3.medium
  - Health checks via ELB

### 5. Monitoring & Alerting
- CloudWatch CPU utilization alarms:
  - Scale up when CPU > 70%
  - Scale down when CPU < 25%
- Alarm actions trigger scaling policies

### 6. Resource Management
- Consistent tagging strategy:
  - Environment: Production
  - Team: DevOps
- Environment suffix for resource isolation
- Deletion policies ensure clean teardown

## Deployment Instructions

### Deploy to us-east-1:
```bash
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION=us-east-1
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --tags Repository=myrepo CommitAuthor=devops
```

### Deploy to us-west-2:
```bash
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION=us-west-2
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --tags Repository=myrepo CommitAuthor=devops
```

## Requirements Compliance

✅ **Multi-region deployment**: Template works in both us-east-1 and us-west-2  
✅ **Three availability zones**: Resources distributed across 3 AZs per region  
✅ **EC2 instance type**: All instances use t3.medium  
✅ **Auto Scaling**: Min 2, max 6 instances per region  
✅ **Elastic Load Balancer**: ALB distributes traffic to healthy instances only  
✅ **VPC configuration**: 3 public and 3 private subnets per region  
✅ **Resource tagging**: All resources tagged with Environment and Team  
✅ **Security groups**: HTTP/HTTPS allowed from internet  
✅ **CloudWatch monitoring**: CPU alarms trigger at 70% threshold  

This solution provides a production-ready, secure, and scalable cloud infrastructure that meets all specified requirements while following AWS best practices.