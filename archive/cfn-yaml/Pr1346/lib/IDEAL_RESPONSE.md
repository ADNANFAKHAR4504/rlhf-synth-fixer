# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'High-Availability Web Application Stack with ALB, Auto Scaling, and Multi-AZ deployment'
# Note: This template uses CAPABILITY_IAM (not CAPABILITY_NAMED_IAM) - IAM resources use auto-generated names

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - Environment
          - ProjectName
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCidr
          - PublicSubnet1Cidr
          - PublicSubnet2Cidr
          - PrivateSubnet1Cidr
          - PrivateSubnet2Cidr
          - SSHAllowedCidr
      - Label:
          default: "EC2 Configuration"
        Parameters:
          - InstanceType
          - KeyPairName
      - Label:
          default: "Auto Scaling Configuration"
        Parameters:
          - MinSize
          - MaxSize
          - DesiredCapacity
      - Label:
          default: "Application Configuration"
        Parameters:
          - S3BucketName
    ParameterLabels:
      Environment:
        default: "Environment"
      ProjectName:
        default: "Project Name"
      VpcCidr:
        default: "VPC CIDR Block"
      PublicSubnet1Cidr:
        default: "Public Subnet 1 CIDR"
      PublicSubnet2Cidr:
        default: "Public Subnet 2 CIDR"
      PrivateSubnet1Cidr:
        default: "Private Subnet 1 CIDR"
      PrivateSubnet2Cidr:
        default: "Private Subnet 2 CIDR"
      SSHAllowedCidr:
        default: "SSH Allowed CIDR"
      InstanceType:
        default: "Instance Type"
      KeyPairName:
        default: "Key Pair Name"
      MinSize:
        default: "Minimum Size"
      MaxSize:
        default: "Maximum Size"
      DesiredCapacity:
        default: "Desired Capacity"
      S3BucketName:
        default: "S3 Bucket Name"

Parameters:
  # Environment and naming parameters
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment name for resource tagging'
  
  ProjectName:
    Type: String
    Default: 'TapWebApp'
    Description: 'Project name for resource naming and tagging'
  
  # Network parameters
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
  
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet in AZ1'
  
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet in AZ2'
  
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.10.0/24'
    Description: 'CIDR block for private subnet in AZ1'
  
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.20.0/24'
    Description: 'CIDR block for private subnet in AZ2'
  
  # Security parameters
  SSHAllowedCidr:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access to EC2 instances'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  
  # EC2 parameters
  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium', 't3.large']
    Description: 'EC2 instance type for web servers'
  
  KeyPairName:
    Type: String
    Default: ''
    Description: 'EC2 Key Pair for SSH access (leave empty to create a new key pair automatically)'
    AllowedPattern: '^$|^[a-zA-Z0-9\-_]+$'
    ConstraintDescription: 'Key pair name must be alphanumeric with hyphens and underscores only, or empty to create automatically'
  
  # Auto Scaling parameters
  MinSize:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: 'Minimum number of instances in Auto Scaling Group (minimum 2 for high availability)'
  
  MaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    MaxValue: 20
    Description: 'Maximum number of instances in Auto Scaling Group'
  
  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 10
    Description: 'Desired number of instances in Auto Scaling Group (minimum 2 for high availability)'
  
  # Application parameters
  S3BucketName:
    Type: String
    Default: 'tap-webapp-code-bucket'
    Description: 'S3 bucket name for application code (must be globally unique)'
  
  # Latest AMI parameter
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID

Conditions:
  CreateKeyPair: !Equals [!Ref KeyPairName, '']
  UseExistingKeyPair: !Not [!Equals [!Ref KeyPairName, '']]



Resources:
  # ==================== VPC and Networking ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: 'Engineering'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-IGW'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # ==================== Key Pair ====================
  KeyPair:
    Type: AWS::EC2::KeyPair
    Condition: CreateKeyPair
    Properties:
      KeyName: !Sub '${ProjectName}-${Environment}-KeyPair'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-KeyPair'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Subnet-AZ1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Subnet-AZ2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Private-Subnet-AZ1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Private-Subnet-AZ2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # NAT Gateways for private subnets
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-EIP-AZ1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-EIP-AZ2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-AZ1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Routes'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

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
          Value: !Sub '${ProjectName}-${Environment}-Private-Routes-AZ1'

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
          Value: !Sub '${ProjectName}-${Environment}-Private-Routes-AZ2'

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

  # ==================== Security Groups ====================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-ALB-SG'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP traffic from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ALB-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-WebServer-SG'
      GroupDescription: 'Security group for web server instances'
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
          CidrIp: !Ref SSHAllowedCidr
          Description: 'Allow SSH access from specified CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-WebServer-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==================== S3 Bucket for Application Code ====================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${S3BucketName}-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Code-Bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==================== IAM Role for EC2 Instances ====================
  EC2Role:
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
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${S3Bucket}/*'
                  - !Sub 'arn:aws:s3:::${S3Bucket}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # ==================== Application Load Balancer ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-ALB'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ALB'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 120
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 10
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-TG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ==================== Launch Template ====================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        KeyName: !If [UseExistingKeyPair, !Ref KeyPairName, !Ref KeyPair]
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd

            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Create a simple web page
            cat > /var/www/html/index.html << EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>Secure Web Application</title>
            </head>
            <body>
                <h1>Welcome to the Secure Web Application</h1>
                <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                <p>Stack: ${AWS::StackName}</p>
            </body>
            </html>
            EOF

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
                "metrics": {
                    "namespace": "AWS/EC2/Custom",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s  
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-WebServer'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
              - Key: CostCenter
                Value: 'Engineering'

  # ==================== Auto Scaling Group ====================
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ASG'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: 'Engineering'
          PropagateAtLaunch: true

    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 2
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false

  # ==================== Auto Scaling Policies ====================
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

  # ==================== CloudWatch Alarms ====================
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-CPU-High'
      AlarmDescription: 'Scale up on high CPU'
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
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-CPU-Low'
      AlarmDescription: 'Scale down on low CPU'
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
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==================== ASG Capacity Protection Alarm ====================
  ASGCapacityAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-ASG-Capacity-Low'
      AlarmDescription: 'Critical: Auto Scaling Group capacity has dropped below minimum threshold'
      MetricName: GroupInServiceInstances
      Namespace: AWS/AutoScaling
      Statistic: Average
      Period: 60
      EvaluationPeriods: 1
      Threshold: !Ref MinSize
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

# ==================== Outputs ====================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerURL:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-ALB-URL'

  LoadBalancerDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  S3BucketName:
    Description: 'S3 Bucket for application code'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  PublicSubnets:
    Description: 'Public Subnets'
    Value: !Sub '${PublicSubnet1}, ${PublicSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnets:
    Description: 'Private Subnets'
    Value: !Sub '${PrivateSubnet1}, ${PrivateSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'

  KeyPairName:
    Description: 'EC2 Key Pair Name (if created automatically)'
    Value: !If [CreateKeyPair, !Ref KeyPair, !Ref 'AWS::NoValue']
    Export:
      Name: !Sub '${AWS::StackName}-KeyPair-Name'
 
  StackName:
    Description: 'CloudFormation Stack Name'
    Value: !Ref 'AWS::StackName'
    Export:
      Name: !Sub '${AWS::StackName}-Name'

  Environment:
    Description: 'Deployment environment'
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-Environment'

  # Alias for integration tests
  DataBucketName:
    Description: 'Primary S3 Bucket Name used by the application'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-Data-Bucket'

  # Additional outputs for comprehensive testing
  VpcCidrBlock:
    Description: 'VPC CIDR Block'
    Value: !Ref VpcCidr
    Export:
      Name: !Sub '${AWS::StackName}-VPC-CIDR'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-1'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-2'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-1'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-2'

  ALBSecurityGroupId:
    Description: 'Application Load Balancer Security Group ID'
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-SG'

  WebServerSecurityGroupId:
    Description: 'Web Server Security Group ID'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-SG'

  EC2RoleArn:
    Description: 'EC2 Instance Role ARN'
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Role'

  LaunchTemplateId:
    Description: 'Launch Template ID'
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-LaunchTemplate'

  LaunchTemplateLatestVersion:
    Description: 'Launch Template Latest Version'
    Value: !GetAtt LaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub '${AWS::StackName}-LaunchTemplate-Version'

  ScaleUpPolicyArn:
    Description: 'Scale Up Policy ARN'
    Value: !Ref ScaleUpPolicy
    Export:
      Name: !Sub '${AWS::StackName}-ScaleUp-Policy'

  ScaleDownPolicyArn:
    Description: 'Scale Down Policy ARN'
    Value: !Ref ScaleDownPolicy
    Export:
      Name: !Sub '${AWS::StackName}-ScaleDown-Policy'

  CPUAlarmHighArn:
    Description: 'High CPU Alarm ARN'
    Value: !Ref CPUAlarmHigh
    Export:
      Name: !Sub '${AWS::StackName}-CPU-High-Alarm'

  CPUAlarmLowArn:
    Description: 'Low CPU Alarm ARN'
    Value: !Ref CPUAlarmLow
    Export:
      Name: !Sub '${AWS::StackName}-CPU-Low-Alarm'

  ASGCapacityAlarmArn:
    Description: 'ASG Capacity Alarm ARN'
    Value: !Ref ASGCapacityAlarm
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Capacity-Alarm'

  NatGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NAT-Gateway-1'

  NatGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NatGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NAT-Gateway-2'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-IGW'

  PublicRouteTableId:
    Description: 'Public Route Table ID'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-Public-RouteTable'

  PrivateRouteTable1Id:
    Description: 'Private Route Table 1 ID'
    Value: !Ref PrivateRouteTable1
    Export:
      Name: !Sub '${AWS::StackName}-Private-RouteTable-1'

  PrivateRouteTable2Id:
    Description: 'Private Route Table 2 ID'
    Value: !Ref PrivateRouteTable2
    Export:
      Name: !Sub '${AWS::StackName}-Private-RouteTable-2'

  ALBTargetGroupArn:
    Description: 'Application Load Balancer Target Group ARN'
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-TargetGroup'

  ALBListenerArn:
    Description: 'Application Load Balancer Listener ARN'
    Value: !Ref ALBListener
    Export:
      Name: !Sub '${AWS::StackName}-ALB-Listener'

  MinSize:
    Description: 'Auto Scaling Group Minimum Size'
    Value: !Ref MinSize
    Export:
      Name: !Sub '${AWS::StackName}-ASG-MinSize'

  MaxSize:
    Description: 'Auto Scaling Group Maximum Size'
    Value: !Ref MaxSize
    Export:
      Name: !Sub '${AWS::StackName}-ASG-MaxSize'

  DesiredCapacity:
    Description: 'Auto Scaling Group Desired Capacity'
    Value: !Ref DesiredCapacity
    Export:
      Name: !Sub '${AWS::StackName}-ASG-DesiredCapacity'

  InstanceType:
    Description: 'EC2 Instance Type'
    Value: !Ref InstanceType
    Export:
      Name: !Sub '${AWS::StackName}-Instance-Type'
```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
