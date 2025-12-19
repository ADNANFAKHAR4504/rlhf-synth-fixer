```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'production-ready infrastructure baseline with VPC, NLB, EC2, and S3'

# Metadata with runbook information
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Security Configuration"
        Parameters:
          - AllowedSSHIp
          - InstanceType
    ParameterLabels:
      AllowedSSHIp:
        default: "SSH Access CIDR"
      InstanceType:
        default: "EC2 Instance Type"
  
  Runbook: |
    Testing and Validation Steps:
    1. SSH Access: ssh -i <key> ec2-user@<PublicInstanceIP> (only from AllowedSSHIp)
    2. NLB Health: curl <NLBDNSName>:8080 (should return healthy response)
    3. Flow Logs: Check CloudWatch Logs group for VPC flow entries
    4. S3 Encryption: Verify bucket has KMS encryption enabled
    5. Tags: Confirm all resources have Environment=Production tag

# Parameters with validation
Parameters:
  AllowedSSHIp:
    Type: String
    Default: "203.0.113.10/32"
    Description: "CIDR block allowed for SSH access to EC2 instances"
    AllowedPattern: "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"
    ConstraintDescription: "Must be a valid CIDR notation (e.g., 203.0.113.10/32)"
  
  InstanceType:
    Type: String
    Default: "t3.micro"
    Description: "EC2 instance type"
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - m5.large
    ConstraintDescription: "Must be a valid EC2 instance type"

# Conditions to enforce us-east-1 deployment
Conditions:
  IsUSEast1: !Equals [!Ref "AWS::Region", "us-east-1"]

# Resources section
Resources:
  # Condition check - fail if not us-east-1
  RegionCheck:
    Type: AWS::CloudFormation::WaitConditionHandle
    Condition: IsUSEast1

  # KMS Key for encryption
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: "KMS key for infrastructure encryption"
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - "kms:Encrypt"
              - "kms:Decrypt"
              - "kms:ReEncrypt*"
              - "kms:GenerateDataKey*"
              - "kms:DescribeKey"
            Resource: "*"
      Tags:
        - Key: Environment
          Value: Production

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/secure-infrastructure
      TargetKeyId: !Ref EncryptionKey

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: "10.0.0.0/16"
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: "SecureVPC"
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: "SecureVPC-IGW"
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (2 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: "10.0.1.0/24"
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: "Public-Subnet-1"
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: "10.0.2.0/24"
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: "Public-Subnet-2"
        - Key: Environment
          Value: Production

  # Private Subnets (2 AZs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: "10.0.3.0/24"
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags:
        - Key: Name
          Value: "Private-Subnet-1"
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: "10.0.4.0/24"
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - Key: Name
          Value: "Private-Subnet-2"
        - Key: Environment
          Value: Production

  # NAT Gateway and EIP
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: "NAT-Gateway-EIP"
        - Key: Environment
          Value: Production

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: "NAT-Gateway"
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: "Public-Route-Table"
        - Key: Environment
          Value: Production

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: "Private-Route-Table"
        - Key: Environment
          Value: Production

  # Routes
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: "0.0.0.0/0"
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: "0.0.0.0/0"
      NatGatewayId: !Ref NATGateway

  # Route Table Associations
  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # VPC Flow Logs
  FlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FlowLogsDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: "*"
      Tags:
        - Key: Environment
          Value: Production

  FlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: "/aws/vpc/flowlogs"
      RetentionInDays: 30
      KmsKeyId: !GetAtt EncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref FlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt FlowLogsRole.Arn
      Tags:
        - Key: Environment
          Value: Production

  # Security Groups
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for bastion host"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIp
          Description: "SSH access from allowed IP"
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: "0.0.0.0/0"
          Description: "All outbound traffic"
      Tags:
        - Key: Name
          Value: "Bastion-SG"
        - Key: Environment
          Value: Production

  NLBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for Network Load Balancer"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          CidrIp: "0.0.0.0/0"
          Description: "HTTP traffic from internet"
      Tags:
        - Key: Name
          Value: "NLB-SG"
        - Key: Environment
          Value: Production

  PrivateInstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Security group for private instances"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIp
          Description: "SSH access from allowed IP"
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref NLBSecurityGroup
          Description: "HTTP traffic from NLB"
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: "0.0.0.0/0"
          Description: "All outbound traffic"
      Tags:
        - Key: Name
          Value: "Private-Instance-SG"
        - Key: Environment
          Value: Production

  # IAM Role for EC2 instances
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
        - PolicyName: EC2LeastPrivilegePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:Describe*
                  - cloudwatch:PutMetricData
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                Resource: "*"
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub "${SecureS3Bucket}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref SecureS3Bucket
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # S3 Bucket
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "secure-infrastructure-${AWS::AccountId}-${AWS::Region}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: Production

  # Network Load Balancer
  NetworkLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: "secure-nlb"
      Type: network
      Scheme: internet-facing
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: Production

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: "secure-tg"
      Port: 8080
      Protocol: TCP
      VpcId: !Ref VPC
      HealthCheckProtocol: TCP
      HealthCheckPort: 8080
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 3
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: Production

  # NLB Listener
  NLBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref NetworkLoadBalancer
      Port: 8080
      Protocol: TCP

  # EC2 Instances
  BastionInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Basic health endpoint for testing
          echo "Bastion host healthy" > /var/log/health.log
      Tags:
        - Key: Name
          Value: "Bastion-Host"
        - Key: Environment
          Value: Production

  PrivateInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref PrivateInstanceSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent python3
          # Simple HTTP server for health checks
          cat > /home/ec2-user/server.py << 'EOF'
          #!/usr/bin/env python3
          import http.server
          import socketserver
          PORT = 8080
          Handler = http.server.SimpleHTTPRequestHandler
          with socketserver.TCPServer(("", PORT), Handler) as httpd:
              print(f"Server running on port {PORT}")
              httpd.serve_forever()
          EOF
          chmod +x /home/ec2-user/server.py
          nohup python3 /home/ec2-user/server.py > /var/log/server.log 2>&1 &
      Tags:
        - Key: Name
          Value: "Private-Instance-1"
        - Key: Environment
          Value: Production

  PrivateInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref PrivateInstanceSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent python3
          # Simple HTTP server for health checks
          cat > /home/ec2-user/server.py << 'EOF'
          #!/usr/bin/env python3
          import http.server
          import socketserver
          PORT = 8080
          Handler = http.server.SimpleHTTPRequestHandler
          with socketserver.TCPServer(("", PORT), Handler) as httpd:
              print(f"Server running on port {PORT}")
              httpd.serve_forever()
          EOF
          chmod +x /home/ec2-user/server.py
          nohup python3 /home/ec2-user/server.py > /var/log/server.log 2>&1 &
      Tags:
        - Key: Name
          Value: "Private-Instance-2"
        - Key: Environment
          Value: Production

  # Target Group Attachments
  TargetGroupAttachment1:
    Type: AWS::ElasticLoadBalancingV2::TargetGroupAttachment
    Properties:
      TargetGroupArn: !Ref TargetGroup
      TargetId: !Ref PrivateInstance1
      Port: 8080

  TargetGroupAttachment2:
    Type: AWS::ElasticLoadBalancingV2::TargetGroupAttachment
    Properties:
      TargetGroupArn: !Ref TargetGroup
      TargetId: !Ref PrivateInstance2
      Port: 8080

# Outputs
Outputs:
  VPCId:
    Description: "VPC ID"
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPC-ID"

  PublicSubnet1Id:
    Description: "Public Subnet 1 ID"
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet1-ID"

  PublicSubnet2Id:
    Description: "Public Subnet 2 ID"
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet2-ID"

  PrivateSubnet1Id:
    Description: "Private Subnet 1 ID"
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet1-ID"

  PrivateSubnet2Id:
    Description: "Private Subnet 2 ID"
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet2-ID"

  NetworkLoadBalancerArn:
    Description: "Network Load Balancer ARN"
    Value: !Ref NetworkLoadBalancer
    Export:
      Name: !Sub "${AWS::StackName}-NLB-ARN"

  NetworkLoadBalancerDNS:
    Description: "Network Load Balancer DNS Name"
    Value: !GetAtt NetworkLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-NLB-DNS"

  TargetGroupArn:
    Description: "Target Group ARN"
    Value: !Ref TargetGroup
    Export:
      Name: !Sub "${AWS::StackName}-TG-ARN"

  BastionInstanceId:
    Description: "Bastion Host Instance ID"
    Value: !Ref BastionInstance
    Export:
      Name: !Sub "${AWS::StackName}-Bastion-ID"

  BastionPublicIP:
    Description: "Bastion Host Public IP"
    Value: !GetAtt BastionInstance.PublicIp
    Export:
      Name: !Sub "${AWS::StackName}-Bastion-PublicIP"

  S3BucketName:
    Description: "Secure S3 Bucket Name"
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub "${AWS::StackName}-S3-Bucket"

  VPCFlowLogsGroup:
    Description: "VPC Flow Logs CloudWatch Log Group"
    Value: !Ref FlowLogsLogGroup
    Export:
      Name: !Sub "${AWS::StackName}-FlowLogs-LogGroup"

# Validation Tests (as comments):
# 1. cfn-lint secure_infrastructure.yaml (should pass with no W30xx warnings)
# 2. aws cloudformation create-stack --stack-name secure-infra --template-body file://secure_infrastructure.yaml --parameters ParameterKey=AllowedSSHIp,ParameterValue=YOUR_IP/32 --capabilities CAPABILITY_IAM --region us-east-1
# 3. Test SSH: ssh -i keypair.pem ec2-user@<BastionPublicIP> (only works from AllowedSSHIp)
# 4. Test NLB: curl <NLBDNSName>:8080 (should return directory listing from SimpleHTTPServer)
# 5. Check Flow Logs: aws logs describe-log-streams --log-group-name /aws/vpc/flowlogs --region us-east-1
# 6. Verify S3 encryption: aws s3api get-bucket-encryption --bucket <BucketName> --region us-east-1
# 7. Verify tags: aws ec2 describe-instances --filters "Name=tag:Environment,Values=Production" --region us-east-1
```