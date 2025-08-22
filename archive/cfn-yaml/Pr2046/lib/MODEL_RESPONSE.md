# Multi-Environment CloudFormation Infrastructure Response

Here's a comprehensive CloudFormation YAML template that creates Development and Production environments with all the requested components:

## multi-environment-infrastructure.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Environment Infrastructure - Development and Production environments with VPCs, EC2, S3, IAM, and VPC Endpoints'

Parameters:
  EnvironmentName:
    Type: String
    Default: 'MultiEnv'
    Description: 'Base name for the environment resources'
  
  InstanceType:
    Type: String
    Default: 't2.micro'
    Description: 'EC2 instance type for both environments'
    AllowedValues:
      - t2.micro
      - t2.small
  
  VPCCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPCs (will use different ranges for Dev/Prod)'

Resources:
  # Development Environment VPC
  DevVPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-VPC'
        - Key: Environment
          Value: 'Development'

  # Production Environment VPC  
  ProdVPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: '10.1.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-VPC'
        - Key: Environment
          Value: 'Production'

  # Development Environment - Internet Gateway
  DevInternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-IGW'

  DevVPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref DevVPC
      InternetGatewayId: !Ref DevInternetGateway

  # Production Environment - Internet Gateway
  ProdInternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-IGW'

  ProdVPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref ProdInternetGateway

  # Development Environment - Subnets
  DevPublicSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-Public-Subnet'

  DevPrivateSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-Private-Subnet'

  # Production Environment - Subnets
  ProdPublicSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.1.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-Public-Subnet'

  ProdPrivateSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.1.2.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-Private-Subnet'

  # Development Environment - NAT Gateway
  DevNATGatewayEIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: DevVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-NAT-EIP'

  DevNATGateway:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt DevNATGatewayEIP.AllocationId
      SubnetId: !Ref DevPublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-NAT-Gateway'

  # Production Environment - NAT Gateway
  ProdNATGatewayEIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-NAT-EIP'

  ProdNATGateway:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt ProdNATGatewayEIP.AllocationId
      SubnetId: !Ref ProdPublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-NAT-Gateway'

  # Development Environment - Route Tables
  DevPublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref DevVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-Public-RT'

  DevPublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: DevVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref DevPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref DevInternetGateway

  DevPublicSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref DevPublicSubnet
      RouteTableId: !Ref DevPublicRouteTable

  DevPrivateRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref DevVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-Private-RT'

  DevPrivateRoute:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref DevPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref DevNATGateway

  DevPrivateSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref DevPrivateSubnet
      RouteTableId: !Ref DevPrivateRouteTable

  # Production Environment - Route Tables
  ProdPublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-Public-RT'

  ProdPublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref ProdPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProdInternetGateway

  ProdPublicSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref ProdPublicSubnet
      RouteTableId: !Ref ProdPublicRouteTable

  ProdPrivateRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-Private-RT'

  ProdPrivateRoute:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref ProdNATGateway

  ProdPrivateSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref ProdPrivateSubnet
      RouteTableId: !Ref ProdPrivateRouteTable

  # S3 Buckets
  DevS3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${EnvironmentName}-dev-bucket-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-S3-Bucket'
        - Key: Environment
          Value: 'Development'

  ProdS3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${EnvironmentName}-prod-bucket-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-S3-Bucket'
        - Key: Environment
          Value: 'Production'

  # IAM Roles for EC2 instances
  DevEC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${EnvironmentName}-Dev-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: 'DevS3Access'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub '${DevS3Bucket}/*'
                  - !Sub '${DevS3Bucket}'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-EC2-Role'
        - Key: Environment
          Value: 'Development'

  ProdEC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${EnvironmentName}-Prod-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: 'ProdS3Access'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub '${ProdS3Bucket}/*'
                  - !Sub '${ProdS3Bucket}'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-EC2-Role'
        - Key: Environment
          Value: 'Production'

  # Instance Profiles
  DevInstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-Dev-Instance-Profile'
      Roles:
        - !Ref DevEC2Role

  ProdInstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-Prod-Instance-Profile'
      Roles:
        - !Ref ProdEC2Role

  # Security Groups
  DevEC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: !Sub '${EnvironmentName}-Dev-EC2-SG'
      GroupDescription: 'Security group for Development EC2 instance'
      VpcId: !Ref DevVPC
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-EC2-SG'

  ProdEC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: !Sub '${EnvironmentName}-Prod-EC2-SG'
      GroupDescription: 'Security group for Production EC2 instance'
      VpcId: !Ref ProdVPC
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-EC2-SG'

  # VPC Endpoints for S3
  DevS3VPCEndpoint:
    Type: 'AWS::EC2::VPCEndpoint'
    Properties:
      VpcId: !Ref DevVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref DevPrivateRouteTable
        - !Ref DevPublicRouteTable

  ProdS3VPCEndpoint:
    Type: 'AWS::EC2::VPCEndpoint'
    Properties:
      VpcId: !Ref ProdVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref ProdPrivateRouteTable
        - !Ref ProdPublicRouteTable

  # EC2 Instances
  DevEC2Instance:
    Type: 'AWS::EC2::Instance'
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: !Ref InstanceType
      SubnetId: !Ref DevPrivateSubnet
      IamInstanceProfile: !Ref DevInstanceProfile
      SecurityGroupIds:
        - !Ref DevEC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Dev-Instance'
        - Key: Environment
          Value: 'Development'
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y aws-cli
          echo "Development Environment Instance Ready" > /home/ec2-user/environment-info.txt

  ProdEC2Instance:
    Type: 'AWS::EC2::Instance'
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: !Ref InstanceType
      SubnetId: !Ref ProdPrivateSubnet
      IamInstanceProfile: !Ref ProdInstanceProfile
      SecurityGroupIds:
        - !Ref ProdEC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Prod-Instance'
        - Key: Environment
          Value: 'Production'
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y aws-cli
          echo "Production Environment Instance Ready" > /home/ec2-user/environment-info.txt

Outputs:
  # VPC Outputs for cross-stack referencing
  DevVPCId:
    Description: 'Development VPC ID'
    Value: !Ref DevVPC
    Export:
      Name: !Sub '${EnvironmentName}-Dev-VPC-ID'

  ProdVPCId:
    Description: 'Production VPC ID'
    Value: !Ref ProdVPC
    Export:
      Name: !Sub '${EnvironmentName}-Prod-VPC-ID'

  # Subnet Outputs
  DevPrivateSubnetId:
    Description: 'Development Private Subnet ID'
    Value: !Ref DevPrivateSubnet
    Export:
      Name: !Sub '${EnvironmentName}-Dev-Private-Subnet-ID'

  ProdPrivateSubnetId:
    Description: 'Production Private Subnet ID'
    Value: !Ref ProdPrivateSubnet
    Export:
      Name: !Sub '${EnvironmentName}-Prod-Private-Subnet-ID'

  # S3 Bucket Outputs
  DevS3BucketName:
    Description: 'Development S3 Bucket Name'
    Value: !Ref DevS3Bucket
    Export:
      Name: !Sub '${EnvironmentName}-Dev-S3-Bucket-Name'

  ProdS3BucketName:
    Description: 'Production S3 Bucket Name'
    Value: !Ref ProdS3Bucket
    Export:
      Name: !Sub '${EnvironmentName}-Prod-S3-Bucket-Name'

  # EC2 Instance Outputs
  DevEC2InstanceId:
    Description: 'Development EC2 Instance ID'
    Value: !Ref DevEC2Instance
    Export:
      Name: !Sub '${EnvironmentName}-Dev-EC2-Instance-ID'

  ProdEC2InstanceId:
    Description: 'Production EC2 Instance ID'
    Value: !Ref ProdEC2Instance
    Export:
      Name: !Sub '${EnvironmentName}-Prod-EC2-Instance-ID'

  # VPC Endpoint Outputs
  DevS3VPCEndpointId:
    Description: 'Development S3 VPC Endpoint ID'
    Value: !Ref DevS3VPCEndpoint
    Export:
      Name: !Sub '${EnvironmentName}-Dev-S3-VPC-Endpoint-ID'

  ProdS3VPCEndpointId:
    Description: 'Production S3 VPC Endpoint ID'
    Value: !Ref ProdS3VPCEndpoint
    Export:
      Name: !Sub '${EnvironmentName}-Prod-S3-VPC-Endpoint-ID'
```

This CloudFormation template provides:

1. **Two separate VPCs** with consistent CIDR blocks (10.0.0.0/16 for Dev, 10.1.0.0/16 for Prod)
2. **Complete network infrastructure** including Internet Gateways, NAT Gateways, public/private subnets, and routing
3. **EC2 instances** (t2.micro) deployed in private subnets for security
4. **S3 buckets** with versioning enabled and public access blocked
5. **IAM roles** with least privilege access to respective S3 buckets
6. **VPC Endpoints** for S3 to keep traffic within AWS network
7. **Comprehensive outputs** for cross-stack referencing
8. **Consistent naming** with environment-specific prefixes
9. **Latest AWS best practices** including resource tagging and security configurations

The template uses parameters for flexibility and includes proper dependencies to ensure correct deployment order.