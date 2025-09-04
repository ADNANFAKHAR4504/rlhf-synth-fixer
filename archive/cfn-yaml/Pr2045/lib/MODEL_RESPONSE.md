# CloudFormation Template for AWS Infrastructure Setup

Based on the requirements, I'll create a CloudFormation YAML template that sets up a basic AWS infrastructure including VPC, subnets, Internet Gateway, Route Table, Security Group, and EC2 instance with Apache HTTP server.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Cloud Environment Setup - VPC with EC2 instance and Apache HTTP server'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - ProjectName

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  ProjectName:
    Type: String
    Default: 'cloud-env'
    Description: 'Project name for resource naming convention'
    AllowedPattern: '^[a-zA-Z0-9-]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

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
          Value: !Sub 'vpc-${ProjectName}-${EnvironmentSuffix}'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${ProjectName}-${EnvironmentSuffix}'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-public-${ProjectName}-1-${EnvironmentSuffix}'

  # Public Subnet 2
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-public-${ProjectName}-2-${EnvironmentSuffix}'

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'rt-public-${ProjectName}-${EnvironmentSuffix}'

  # Default Public Route
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate Public Subnet 1 with Route Table
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::RouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  # Associate Public Subnet 2 with Route Table
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::RouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # Security Group for Web Server
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'sg-webserver-${ProjectName}-${EnvironmentSuffix}'
      GroupDescription: 'Security group for web server allowing HTTP and SSH access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access from anywhere'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'SSH access from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'sg-webserver-${ProjectName}-${EnvironmentSuffix}'

  # IAM Role for EC2 Instance
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-ec2-${ProjectName}-${EnvironmentSuffix}'
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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: EC2DescribeInstances
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ec2:DescribeInstanceStatus
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'role-ec2-${ProjectName}-${EnvironmentSuffix}'

  # Instance Profile for EC2 Role
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'profile-ec2-${ProjectName}-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2InstanceRole

  # Elastic IP for Web Server
  WebServerElasticIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-webserver-${ProjectName}-${EnvironmentSuffix}'

  # EC2 Instance for Web Server
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64}}'
      InstanceType: t2.micro
      KeyName: my-key
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<html><body><h1>Hello from ${ProjectName} Web Server!</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p><p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p></body></html>" > /var/www/html/index.html
          # Install CloudWatch agent for enhanced monitoring (latest feature)
          yum install -y amazon-cloudwatch-agent
      Tags:
        - Key: Name
          Value: !Sub 'instance-webserver-${ProjectName}-${EnvironmentSuffix}'

  # Associate Elastic IP with Web Server Instance
  WebServerEIPAssociation:
    Type: AWS::EC2::EIPAssociation
    Properties:
      InstanceId: !Ref WebServerInstance
      EIP: !Ref WebServerElasticIP

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: 'ID of the first public subnet'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'ID of the second public subnet'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  WebServerInstanceId:
    Description: 'ID of the web server EC2 instance'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-WebServerInstanceId'

  WebServerPublicIP:
    Description: 'Public IP address of the web server'
    Value: !Ref WebServerElasticIP
    Export:
      Name: !Sub '${AWS::StackName}-WebServerPublicIP'

  WebServerURL:
    Description: 'URL of the web server'
    Value: !Sub 'http://${WebServerElasticIP}'
    Export:
      Name: !Sub '${AWS::StackName}-WebServerURL'

  SecurityGroupId:
    Description: 'ID of the web server security group'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'

  InternetGatewayId:
    Description: 'ID of the Internet Gateway'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGatewayId'

  PublicRouteTableId:
    Description: 'ID of the public route table'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-PublicRouteTableId'
```

This CloudFormation template creates a complete AWS infrastructure setup that meets all the specified requirements:

1. **VPC** with CIDR block `10.0.0.0/16`
2. **Two public subnets** with CIDR blocks `10.0.1.0/24` and `10.0.2.0/24`
3. **Internet Gateway** attached to the VPC for external access
4. **Route Table** associated with both subnets routing traffic (`0.0.0.0/0`) to the Internet Gateway
5. **Security Group** allowing inbound HTTP (port 80) and SSH (port 22) access
6. **EC2 instance** (t2.micro) in the first public subnet with Apache HTTP server installed
7. **Elastic IP** allocated and associated with the EC2 instance
8. **IAM role** for the EC2 instance with permissions to describe instances
9. **Proper resource naming convention** following `<resource-type>-<project-name>-<unique-id>` pattern
10. Uses the existing KeyPair named 'my-key' for SSH access

The template includes modern AWS features:
- Uses Systems Manager Parameter Store for the latest Amazon Linux 2023 AMI
- Includes CloudWatch agent installation for enhanced monitoring
- Uses AWS Systems Manager Session Manager for secure instance access
- Proper resource tagging and naming conventions
- Complete dependency management with DependsOn attributes

The infrastructure is optimized for quick deployment and follows CloudFormation best practices with comprehensive outputs for integration with other stacks.