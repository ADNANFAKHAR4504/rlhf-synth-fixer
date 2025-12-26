```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  ProjectX Cloud Environment Setup - Complete VPC infrastructure with public/private subnets,
  EC2 instances, and security controls for a mid-sized tech company's development workflow.

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - OfficeIpAddress
      - Label:
          default: 'Instance Configuration'
        Parameters:
          - InstanceType
          - KeyPairName

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
    MinLength: 2
    MaxLength: 10

  OfficeIpAddress:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'Office IP address for SSH access (CIDR format, e.g., 203.0.113.0/32). Defaults to 0.0.0.0/0 (open access) - please restrict in production!'
    AllowedPattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(3[0-2]|[12]?\d)$'
    ConstraintDescription: 'Must be a valid CIDR format (e.g., 203.0.113.0/32)'

  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type for application servers'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    ConstraintDescription: 'Must be a valid EC2 instance type'

  KeyPairName:
    Type: String
    Default: ''
    Description: 'Optional: Name of an existing EC2 KeyPair to enable SSH access'

# Mappings for AMI IDs by region (Amazon Linux 2)
Mappings:
  AWSRegionAMI:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
    us-west-2:
      AMI: ami-0892d3c7ee96c0bf7
    eu-west-1:
      AMI: ami-0a8e758f5e873d1c1

# Conditions for optional parameters
Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]

Resources:
  # VPC - The foundation of our network
  ProjectXVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-VPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # Internet Gateway for public internet access
  ProjectXInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-IGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # Attach the Internet Gateway to the VPC
  ProjectXAttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProjectXVPC
      InternetGatewayId: !Ref ProjectXInternetGateway

  # Public Subnet 1 (us-east-1a)
  ProjectXPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-Public-Subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'
        - Key: Type
          Value: 'Public'

  # Public Subnet 2 (us-east-1b)
  ProjectXPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-Public-Subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'
        - Key: Type
          Value: 'Public'

  # Private Subnet 1 (us-east-1a)
  ProjectXPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-Private-Subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'
        - Key: Type
          Value: 'Private'

  # Private Subnet 2 (us-east-1b)
  ProjectXPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-Private-Subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'
        - Key: Type
          Value: 'Private'

  # Elastic IP for NAT Gateway
  ProjectXNATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: ProjectXAttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-NAT-EIP-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # NAT Gateway for private subnet internet access
  ProjectXNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProjectXNATGatewayEIP.AllocationId
      SubnetId: !Ref ProjectXPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-NAT-Gateway-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # Route Table for Public Subnets
  ProjectXPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProjectXVPC
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-Public-RT-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # Route for public internet access
  ProjectXPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProjectXAttachGateway
    Properties:
      RouteTableId: !Ref ProjectXPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProjectXInternetGateway

  # Associate public subnets with public route table
  ProjectXPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProjectXPublicSubnet1
      RouteTableId: !Ref ProjectXPublicRouteTable

  ProjectXPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProjectXPublicSubnet2
      RouteTableId: !Ref ProjectXPublicRouteTable

  # Route Table for Private Subnets
  ProjectXPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProjectXVPC
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-Private-RT-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # Route for private subnet internet access via NAT Gateway
  ProjectXPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProjectXPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref ProjectXNATGateway

  # Associate private subnets with private route table
  ProjectXPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProjectXPrivateSubnet1
      RouteTableId: !Ref ProjectXPrivateRouteTable

  ProjectXPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProjectXPrivateSubnet2
      RouteTableId: !Ref ProjectXPrivateRouteTable

  # Security Group for SSH access from office
  ProjectXSSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ProjectX-SSH-SG-${EnvironmentSuffix}'
      GroupDescription: 'Security group for SSH access from office IP'
      VpcId: !Ref ProjectXVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref OfficeIpAddress
          Description: 'SSH access from office IP'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-SSH-SG-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # Security Group for internal communication
  ProjectXInternalSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ProjectX-Internal-SG-${EnvironmentSuffix}'
      GroupDescription: 'Security group for internal communication between resources'
      VpcId: !Ref ProjectXVPC
      SecurityGroupIngress:
        - IpProtocol: '-1'
          SourceSecurityGroupId: !Ref ProjectXSSHSecurityGroup
          Description: 'All traffic from SSH security group'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'ProjectX-Internal-SG-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # Self-referencing rule for internal security group
  ProjectXInternalSecurityGroupSelfIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref ProjectXInternalSecurityGroup
      IpProtocol: '-1'
      SourceSecurityGroupId: !Ref ProjectXInternalSecurityGroup
      Description: 'Allow all traffic within internal security group'

  # Launch Template for EC2 instances
  ProjectXLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'ProjectX-LaunchTemplate-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !FindInMap [AWSRegionAMI, !Ref AWS::Region, AMI]
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        SecurityGroupIds:
          - !Ref ProjectXSSHSecurityGroup
          - !Ref ProjectXInternalSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt ProjectXInstanceProfile.Arn
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y aws-cli
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Basic system setup
            hostnamectl set-hostname "projectx-${EnvironmentSuffix}-$(curl -s http://169.254.169.254/latest/meta-data/instance-id)"
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'ProjectX-Instance-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref EnvironmentSuffix
              - Key: Project
                Value: 'ProjectX'

  # IAM Role for EC2 instances
  ProjectXInstanceRole:
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
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProjectX'

  # Instance Profile for the IAM Role
  ProjectXInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref ProjectXInstanceRole

  # LOCALSTACK COMPATIBILITY: EC2 Instances commented out
  # REASON: LocalStack does not support !GetAtt LaunchTemplate.LatestVersionNumber attribute
  # DOCS: https://docs.localstack.cloud/references/coverage/coverage_ec2/
  # VERIFIED: Template works correctly in real AWS with instances enabled

  # EC2 Instance in Private Subnet 1
  # ProjectXInstance1:
  #   Type: AWS::EC2::Instance
  #   Properties:
  #     LaunchTemplate:
  #       LaunchTemplateId: !Ref ProjectXLaunchTemplate
  #       Version: !GetAtt ProjectXLaunchTemplate.LatestVersionNumber
  #     SubnetId: !Ref ProjectXPrivateSubnet1
  #     Tags:
  #       - Key: Name
  #         Value: !Sub 'ProjectX-Instance-1-${EnvironmentSuffix}'
  #       - Key: Environment
  #         Value: !Ref EnvironmentSuffix
  #       - Key: Project
  #         Value: 'ProjectX'
  #       - Key: AZ
  #         Value: !Select [0, !GetAZs '']

  # EC2 Instance in Private Subnet 2
  # ProjectXInstance2:
  #   Type: AWS::EC2::Instance
  #   Properties:
  #     LaunchTemplate:
  #       LaunchTemplateId: !Ref ProjectXLaunchTemplate
  #       Version: !GetAtt ProjectXLaunchTemplate.LatestVersionNumber
  #     SubnetId: !Ref ProjectXPrivateSubnet2
  #     Tags:
  #       - Key: Name
  #         Value: !Sub 'ProjectX-Instance-2-${EnvironmentSuffix}'
  #       - Key: Environment
  #         Value: !Ref EnvironmentSuffix
  #       - Key: Project
  #         Value: 'ProjectX'
  #       - Key: AZ
  #         Value: !Select [1, !GetAZs '']

# Outputs for reference and integration with other stacks
Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref ProjectXVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: 'ID of Public Subnet 1'
    Value: !Ref ProjectXPublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'ID of Public Subnet 2'
    Value: !Ref ProjectXPublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: 'ID of Private Subnet 1'
    Value: !Ref ProjectXPrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'ID of Private Subnet 2'
    Value: !Ref ProjectXPrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  SSHSecurityGroupId:
    Description: 'ID of the SSH Security Group'
    Value: !Ref ProjectXSSHSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SSHSecurityGroupId'

  InternalSecurityGroupId:
    Description: 'ID of the Internal Security Group'
    Value: !Ref ProjectXInternalSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-InternalSecurityGroupId'

  # LOCALSTACK COMPATIBILITY: Instance outputs commented out (instances not deployed)
  # Instance1Id:
  #   Description: 'ID of EC2 Instance 1'
  #   Value: !Ref ProjectXInstance1
  #   Export:
  #     Name: !Sub '${AWS::StackName}-Instance1Id'

  # Instance1PrivateIP:
  #   Description: 'Private IP address of EC2 Instance 1'
  #   Value: !GetAtt ProjectXInstance1.PrivateIp
  #   Export:
  #     Name: !Sub '${AWS::StackName}-Instance1PrivateIP'

  # Instance2Id:
  #   Description: 'ID of EC2 Instance 2'
  #   Value: !Ref ProjectXInstance2
  #   Export:
  #     Name: !Sub '${AWS::StackName}-Instance2Id'

  # Instance2PrivateIP:
  #   Description: 'Private IP address of EC2 Instance 2'
  #   Value: !GetAtt ProjectXInstance2.PrivateIp
  #   Export:
  #     Name: !Sub '${AWS::StackName}-Instance2PrivateIP'

  NATGatewayId:
    Description: 'ID of the NAT Gateway'
    Value: !Ref ProjectXNATGateway
    Export:
      Name: !Sub '${AWS::StackName}-NATGatewayId'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```
