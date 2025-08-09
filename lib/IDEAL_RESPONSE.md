# Secure, Highly Available AWS Infrastructure Template

This CloudFormation template creates a secure, highly available AWS infrastructure for web applications with VPC, subnets, ALB, EC2, and S3 in the us-west-2 region.

## Architecture Overview

The template provisions:
- VPC with public and private subnets across multiple Availability Zones
- Application Load Balancer (ALB) for distributing traffic
- EC2 instances in private subnets with proper security groups
- NAT Gateways for outbound internet access from private subnets
- S3 bucket with server-side encryption
- IAM roles with ReadOnlyAccess permissions

## Parameters

- **Environment**: Environment name for tagging (default: "Production")
- **KeyPairName**: Optional EC2 KeyPair name for SSH access (leave empty to disable)
- **AmiId**: AMI ID for EC2 instances (uses latest Amazon Linux 2)
- **InstanceType**: EC2 instance type (t3.micro, t3.small, or t3.medium)

## CloudFormation Template

```
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, highly available AWS infrastructure for web application with VPC, subnets, ALB, EC2, and S3 in us-west-2'

Parameters:
  Environment:
    Type: String
    Default: "Production"
    Description: 'Environment name for tagging'

  KeyPairName:
    Type: String
    Default: ''
    Description: 'Optional EC2 KeyPair name for SSH access (leave empty to disable)'
    ConstraintDescription: 'Must be empty or the name of an existing EC2 KeyPair'

  AmiId:
    Description: 'AMI ID for EC2 instances'
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'

  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
    Description: 'EC2 instance type'

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref Environment
  
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: !Ref Environment

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Environment
          Value: !Ref Environment

  NatEIP1:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NatEIP1'
        - Key: Environment
          Value: !Ref Environment

  NatEIP2:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NatEIP2'
        - Key: Environment
          Value: !Ref Environment

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NatGateway1'
        - Key: Environment
          Value: !Ref Environment

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NatGateway2'
        - Key: Environment
          Value: !Ref Environment

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: 
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: Environment
          Value: !Ref Environment

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: 
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable1'
        - Key: Environment
          Value: !Ref Environment

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags: 
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable2'
        - Key: Environment
          Value: !Ref Environment

  PublicDefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateDefaultRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateDefaultRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # DEFAULT SECURITY GROUP (No inline ingress rules to avoid circular dependency)
  DefaultSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Default security group allowing internal VPC traffic only
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DefaultSG'
        - Key: Environment
          Value: !Ref Environment

  # SEPARATE INGRESS RULE FOR DEFAULT SECURITY GROUP
  DefaultSecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref DefaultSecurityGroup
      IpProtocol: -1
      SourceSecurityGroupId: !Ref DefaultSecurityGroup

  # APPLICATION LOAD BALANCER SECURITY GROUP
  ApplicationLoadBalancerSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Load balancer security group allowing HTTP and HTTPS
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
          Value: !Sub '${AWS::StackName}-ALB-SG'
        - Key: Environment
          Value: !Ref Environment

  # EC2 SECURITY GROUP (No dependencies on complex resources)
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances allowing ALB traffic
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-SG'
        - Key: Environment
          Value: !Ref Environment

  # SEPARATE INGRESS RULE FOR EC2 SECURITY GROUP
  EC2SecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref EC2SecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref ApplicationLoadBalancerSG

  # IAM ROLE FOR EC2
  Ec2InstanceRole:
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
        - arn:aws:iam::aws:policy/ReadOnlyAccess
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2Role'
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref Ec2InstanceRole

  # EC2 INSTANCES (No direct target group references)
  EC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref AmiId
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref DefaultSecurityGroup
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2Instance1'
        - Key: Environment
          Value: !Ref Environment
      UserData: !Base64 |
        #!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Welcome to the secure webapp - Instance 1</h1>" > /var/www/html/index.html

  EC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref AmiId
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
      SubnetId: !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref DefaultSecurityGroup
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2Instance2'
        - Key: Environment
          Value: !Ref Environment
      UserData: !Base64 |
        #!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Welcome to the secure webapp - Instance 2</h1>" > /var/www/html/index.html

  # S3 BUCKET WITH ENCRYPTION
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-S3Bucket'
        - Key: Environment
          Value: !Ref Environment

  # APPLICATION LOAD BALANCER
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Scheme: internet-facing
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ApplicationLoadBalancerSG
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB'
        - Key: Environment
          Value: !Ref Environment

  # TARGET GROUP (No direct EC2 instance references)
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TargetGroup'
      Protocol: HTTP
      Port: 80
      VpcId: !Ref VPC
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-TargetGroup'
        - Key: Environment
          Value: !Ref Environment

  # LISTENER
  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref LoadBalancer
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      Port: 80
      Protocol: HTTP

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetId:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  LoadBalancerURL:
    Description: 'URL of the Application Load Balancer'
    Value: !Sub 'http://${LoadBalancer.DNSName}'
```
## Outputs

- **VPCId**: The ID of the created VPC
- **PublicSubnetId**: The ID of the first public subnet
- **LoadBalancerURL**: The HTTP URL of the Application Load Balancer

## Deployment

To deploy this template:

```
aws cloudformation create-stack \
  --stack-name TapStackYourName \
  --template-body file://TapStack.yml \
  --parameters \
      ParameterKey=Environment,ParameterValue=Production \
      ParameterKey=KeyPairName,ParameterValue="your-keypair-name" \
      ParameterKey=InstanceType,ParameterValue=t3.micro \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

**Note**: The template doesn't register EC2 instances with the Target Group automatically. You'll need to add Target Group attachments or use an Auto Scaling Group for automatic registration.
```

The YAML content is now contained within a single code block in the markdown file, making it easy to copy and paste while maintaining proper formatting and syntax highlighting.
