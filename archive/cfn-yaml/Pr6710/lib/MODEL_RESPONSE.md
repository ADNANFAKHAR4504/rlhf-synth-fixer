### Reasoning Trace
---

This is a comprehensive request for a production-ready CloudFormation template. Let me break down the requirements:

1. **Networking**: VPC with 3 public and 3 private subnets across AZs, NAT Gateways (one per public subnet)
2. **Load Balancing**: ALB in public subnets with HTTPS listener and target group
3. **Auto Scaling**: Launch template with Amazon Linux 2023, ASG with scheduled actions
4. **Database**: Aurora PostgreSQL 15.4 cluster with conditional reader in production
5. **CloudFront + S3**: Static hosting with S3 bucket and CloudFront distribution
6. **Security**: Security groups, WAF, IMDSv2 enforcement
7. **Monitoring**: CloudWatch alarms
8. **Naming Convention**: Specific naming pattern required
9. **Parameters**: Specific parameters including EnvironmentSuffix
10. **Conditions**: Reader instance only in production
11. **Cross-account compatibility**: No hardcoded values

I need to ensure:
- All resources follow the naming convention
- No hardcoded values (especially AMI IDs, AZs)
- Proper use of conditions
- All dependencies are properly declared
- Security best practices are followed
- All functional requirements are met

Let me create this template step by step.
### Answer 
---

I'll create a comprehensive CloudFormation template that meets all your requirements. This will be a production-ready template with proper security, high availability, and cross-account compatibility.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly available web application infrastructure for financial services portal'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: "Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)"
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: "Must contain only alphanumeric characters and hyphens"
  
  EnvironmentName:
    Type: String
    Description: "Environment name"
    Default: "dev"
    AllowedValues:
      - dev
      - staging
      - production
  
  InstanceType:
    Type: String
    Description: "EC2 instance type"
    Default: "t3.large"
    AllowedValues:
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge
  
  DBPassword:
    Type: String
    Description: "Database password"
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9]*$'
    ConstraintDescription: "Must contain only alphanumeric characters"
  
  CertificateArn:
    Type: String
    Description: "ACM Certificate ARN for HTTPS listener"
    AllowedPattern: '^arn:aws:acm:.*$'
  
  VpcCIDR:
    Type: String
    Description: "CIDR block for VPC"
    Default: "10.0.0.0/16"
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/(1[6-9]|2[0-8])$'
  
  PublicSubnetCIDRs:
    Type: CommaDelimitedList
    Description: "CIDR blocks for public subnets"
    Default: "10.0.1.0/24,10.0.2.0/24,10.0.3.0/24"
  
  PrivateSubnetCIDRs:
    Type: CommaDelimitedList
    Description: "CIDR blocks for private subnets"
    Default: "10.0.11.0/24,10.0.12.0/24,10.0.13.0/24"
  
  CostCenter:
    Type: String
    Description: "Cost center for tagging"
    Default: "finance-dept"
  
  Application:
    Type: String
    Description: "Application name for tagging"
    Default: "financial-portal"
  
  Owner:
    Type: String
    Description: "Owner email for tagging"
    Default: "devops@example.com"

Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, "production"]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 0
        - !GetAZs 
          Ref: AWS::Region
      CidrBlock: !Select [0, !Ref PublicSubnetCIDRs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 1
        - !GetAZs 
          Ref: AWS::Region
      CidrBlock: !Select [1, !Ref PublicSubnetCIDRs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 2
        - !GetAZs 
          Ref: AWS::Region
      CidrBlock: !Select [2, !Ref PublicSubnetCIDRs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-3"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 0
        - !GetAZs 
          Ref: AWS::Region
      CidrBlock: !Select [0, !Ref PrivateSubnetCIDRs]
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 1
        - !GetAZs 
          Ref: AWS::Region
      CidrBlock: !Select [1, !Ref PrivateSubnetCIDRs]
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 2
        - !GetAZs 
          Ref: AWS::Region
      CidrBlock: !Select [2, !Ref PrivateSubnetCIDRs]
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-3"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-3"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-3"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

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
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

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

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-3"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-sg"
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from anywhere
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-sg"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg"
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTP from ALB
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-sg"
      GroupDescription: Security group for RDS Aurora cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: PostgreSQL from EC2 instances
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-sg"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - sts:AssumeRole
      ManagedPolicyArns:
        - !Sub "arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy"
      Policies:
        - PolicyName: SSMParameterAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParameterHistory
                  - ssm:GetParametersByPath
                Resource: !Sub "arn:${AWS::Partition}:ssm:${AWS::Region}:${AWS::AccountId}:parameter/*"
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:*"
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile"
      Roles:
        - !Ref EC2Role

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lt"
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          HttpEndpoint: enabled
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<html><body><h1>Financial Services Portal</h1><p>Healthy</p></body></html>" > /var/www/html/health
            echo "<html><body><h1>Financial Services Portal - ${AWS::Region}</h1></body></html>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance"
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: CostCenter
                Value: !Ref CostCenter
              - Key: Application
                Value: !Ref Application
              - Key: Owner
                Value: !Ref Owner
              - Key: StackName
                Value: !Ref AWS::StackName

  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb"
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-tg"
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-tg"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ALB
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn: 
      - NatGateway1
      - NatGateway2
      - NatGateway3
    Properties:
      AutoScalingGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg"
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 3
      MaxSize: 9
      DesiredCapacity: 3
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref TargetGroup
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg-instance"
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true
        - Key: Application
          Value: !Ref Application
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true
        - Key: StackName
          Value: !Ref AWS::StackName
          PropagateAtLaunch: true

  ScaleUpScheduledAction:
    Type: AWS::AutoScaling::ScheduledAction
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      MinSize: 3
      Recurrence: "0 11 * * *"

  ScaleDownScheduledAction:
    Type: AWS::AutoScaling::ScheduledAction
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      MinSize: 1
      Recurrence: "0 3 * * *"

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group"
      DBSubnetGroupDescription: Subnet group for Aurora cluster
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: Parameter group for Aurora PostgreSQL
      Family: aurora-postgresql15
      Parameters:
        rds.force_ssl: '1'
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster-pg"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  AuroraCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    Properties:
      DBClusterIdentifier: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-aurora-cluster"
      Engine: aurora-postgresql
      EngineVersion: '15.4'
      MasterUsername: dbadmin
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-aurora-cluster"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  AuroraWriterInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-aurora-writer"
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-postgresql
      DBInstanceClass: db.r6g.large
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-aurora-writer"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  AuroraReaderInstance:
    Type: AWS::RDS::DBInstance
    Condition: IsProduction
    Properties:
      DBInstanceIdentifier: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-aurora-reader"
      DBClusterIdentifier: !Ref AuroraCluster
      Engine: aurora-postgresql
      DBInstanceClass: db.r6g.large
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-aurora-reader"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  StaticContentBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-static"
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-static"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  CloudFrontOriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-oac"
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt StaticContentBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !Ref CloudFrontOriginAccessControl
          - Id: ALBOrigin
            DomainName: !GetAtt ALB.DNSName
            CustomOriginConfig:
              OriginProtocolPolicy: https-only
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
          CachedMethods:
            - GET
            - HEAD
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        CacheBehaviors:
          - PathPattern: "/api/*"
            TargetOriginId: ALBOrigin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
              - OPTIONS
              - PUT
              - POST
              - PATCH
              - DELETE
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: true
              Headers:
                - Authorization
                - Content-Type
              Cookies:
                Forward: all
            MinTTL: 0
            DefaultTTL: 0
            MaxTTL: 60
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        Tags:
          - Key: Name
            Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cf"
          - Key: Environment
            Value: !Ref EnvironmentName
          - Key: CostCenter
            Value: !Ref CostCenter
          - Key: Application
            Value: !Ref Application
          - Key: Owner
            Value: !Ref Owner
          - Key: StackName
            Value: !Ref AWS::StackName

  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticContentBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontServicePrincipal
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub "${StaticContentBucket.Arn}/*"
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub "arn:${AWS::Partition}:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"

  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-waf"
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-waf"
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-waf"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Application
          Value: !Ref Application
        - Key: Owner
          Value: !Ref Owner
        - Key: StackName
          Value: !Ref AWS::StackName

  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ALB
      WebACLArn: !GetAtt WAFWebACL.Arn

  UnhealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-unhealthy-hosts"
      AlarmDescription: Alert when target group has unhealthy hosts
      MetricName: HealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 3
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ALB.LoadBalancerFullName

  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-cpu"
      AlarmDescription: Alert when RDS CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraCluster

  ASGCapacityAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg-capacity"
      AlarmDescription: Alert when ASG InService instances < 3
      MetricName: GroupInServiceInstances
      Namespace: AWS/AutoScaling
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 3
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

Outputs:
  CloudFrontDomainName:
    Description: CloudFront distribution domain name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub "${AWS::StackName}-CloudFrontDomain"

  ALBDNSName:
    Description: Application Load Balancer DNS name
    Value: !GetAtt ALB.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-ALBDNSName"

  RDSClusterEndpoint:
    Description: RDS Aurora cluster endpoint
    Value: !GetAtt AuroraCluster.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-RDSClusterEndpoint"
```

## Key Features of This Template

### 1. **Dynamic Resource Resolution**
- AMI ID resolved via SSM Parameter Store (no hardcoding)
- Availability Zones dynamically selected using `!GetAZs`
- All ARNs constructed using pseudo parameters

### 2. **Security Best Practices**
- IMDSv2 enforcement on EC2 instances
- SSL/TLS enforcement on RDS cluster
- WAF with rate limiting attached to ALB
- No public access to S3 bucket
- Security groups with minimal required access

### 3. **High Availability**
- Multi-AZ deployment across 3 availability zones
- Auto Scaling Group with minimum 3 instances during business hours
- Aurora cluster with conditional reader in production
- NAT Gateway in each AZ for redundancy

### 4. **Cross-Account Compatibility**
- No hardcoded account IDs, regions, or ARNs
- Uses `!Sub` with pseudo parameters
- Parameterized certificate ARN and other account-specific values

### 5. **Monitoring and Alerting**
- CloudWatch alarms for critical metrics
- Health checks on ALB target group
- RDS CPU monitoring
- ASG capacity monitoring

### 6. **Resource Naming Convention**
- All resources follow the required pattern: `${StackName}-${Region}-${EnvironmentSuffix}-[type]`
- Consistent tagging across all resources

### 7. **CloudFront Configuration**
- Dual origin setup (S3 + ALB)
- API traffic routing with 60-second max TTL
- Origin Access Control for S3 security

This template is production-ready and can be deployed across different AWS accounts without modification. Simply provide the required parameters during stack creation.