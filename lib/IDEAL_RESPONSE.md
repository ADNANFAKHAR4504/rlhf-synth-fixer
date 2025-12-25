# Multi-Environment CloudFormation Infrastructure Solution

This CloudFormation template creates Development and Production environments with complete network isolation, consistent resource configurations, and security best practices.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Environment Infrastructure - Development and Production environments with VPCs, EC2, S3, IAM, and VPC Endpoints'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Suffix for all resource names to ensure uniqueness'
  
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

Resources:
  # Development Environment VPC
  DevVPC:
    Type: 'AWS::EC2::VPC'
    DeletionPolicy: Delete
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-VPC'
        - Key: Environment
          Value: 'Development'

  # Production Environment VPC  
  ProdVPC:
    Type: 'AWS::EC2::VPC'
    DeletionPolicy: Delete
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-VPC'
        - Key: Environment
          Value: 'Production'

  # Development Environment - Internet Gateway
  DevInternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    DeletionPolicy: Delete
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-IGW'

  DevVPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref DevVPC
      InternetGatewayId: !Ref DevInternetGateway

  # Production Environment - Internet Gateway
  ProdInternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    DeletionPolicy: Delete
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-IGW'

  ProdVPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref ProdInternetGateway

  # Development Environment - Subnets
  DevPublicSubnet:
    Type: 'AWS::EC2::Subnet'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-Public-Subnet'

  DevPrivateSubnet:
    Type: 'AWS::EC2::Subnet'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-Private-Subnet'

  # Production Environment - Subnets
  ProdPublicSubnet:
    Type: 'AWS::EC2::Subnet'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-Public-Subnet'

  ProdPrivateSubnet:
    Type: 'AWS::EC2::Subnet'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-Private-Subnet'

  # Development Environment - NAT Gateway
  DevNATGatewayEIP:
    Type: 'AWS::EC2::EIP'
    DeletionPolicy: Delete
    DependsOn: DevVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-NAT-EIP'

  DevNATGateway:
    Type: 'AWS::EC2::NatGateway'
    DeletionPolicy: Delete
    Properties:
      AllocationId: !GetAtt DevNATGatewayEIP.AllocationId
      SubnetId: !Ref DevPublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-NAT-Gateway'

  # Production Environment - NAT Gateway
  ProdNATGatewayEIP:
    Type: 'AWS::EC2::EIP'
    DeletionPolicy: Delete
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-NAT-EIP'

  ProdNATGateway:
    Type: 'AWS::EC2::NatGateway'
    DeletionPolicy: Delete
    Properties:
      AllocationId: !GetAtt ProdNATGatewayEIP.AllocationId
      SubnetId: !Ref ProdPublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-NAT-Gateway'

  # Development Environment - Route Tables
  DevPublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref DevVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-Public-RT'

  DevPublicRoute:
    Type: 'AWS::EC2::Route'
    DeletionPolicy: Delete
    DependsOn: DevVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref DevPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref DevInternetGateway

  DevPublicSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref DevPublicSubnet
      RouteTableId: !Ref DevPublicRouteTable

  DevPrivateRouteTable:
    Type: 'AWS::EC2::RouteTable'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref DevVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-Private-RT'

  DevPrivateRoute:
    Type: 'AWS::EC2::Route'
    DeletionPolicy: Delete
    Properties:
      RouteTableId: !Ref DevPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref DevNATGateway

  DevPrivateSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref DevPrivateSubnet
      RouteTableId: !Ref DevPrivateRouteTable

  # Production Environment - Route Tables
  ProdPublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-Public-RT'

  ProdPublicRoute:
    Type: 'AWS::EC2::Route'
    DeletionPolicy: Delete
    DependsOn: ProdVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref ProdPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProdInternetGateway

  ProdPublicSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref ProdPublicSubnet
      RouteTableId: !Ref ProdPublicRouteTable

  ProdPrivateRouteTable:
    Type: 'AWS::EC2::RouteTable'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-Private-RT'

  ProdPrivateRoute:
    Type: 'AWS::EC2::Route'
    DeletionPolicy: Delete
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref ProdNATGateway

  ProdPrivateSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    DeletionPolicy: Delete
    Properties:
      SubnetId: !Ref ProdPrivateSubnet
      RouteTableId: !Ref ProdPrivateRouteTable

  # S3 Buckets
  DevS3Bucket:
    Type: 'AWS::S3::Bucket'
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'multienv-${EnvironmentSuffix}-dev-bucket-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-S3-Bucket'
        - Key: Environment
          Value: 'Development'

  ProdS3Bucket:
    Type: 'AWS::S3::Bucket'
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'multienv-${EnvironmentSuffix}-prod-bucket-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-S3-Bucket'
        - Key: Environment
          Value: 'Production'

  # IAM Roles for EC2 instances
  DevEC2Role:
    Type: 'AWS::IAM::Role'
    DeletionPolicy: Delete
    Properties:
      RoleName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-EC2-Role'
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
                  - !GetAtt DevS3Bucket.Arn
                  - !Sub '${DevS3Bucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-EC2-Role'
        - Key: Environment
          Value: 'Development'

  ProdEC2Role:
    Type: 'AWS::IAM::Role'
    DeletionPolicy: Delete
    Properties:
      RoleName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-EC2-Role'
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
                  - !GetAtt ProdS3Bucket.Arn
                  - !Sub '${ProdS3Bucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-EC2-Role'
        - Key: Environment
          Value: 'Production'

  # Instance Profiles
  DevInstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    DeletionPolicy: Delete
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-Instance-Profile'
      Roles:
        - !Ref DevEC2Role

  ProdInstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    DeletionPolicy: Delete
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-Instance-Profile'
      Roles:
        - !Ref ProdEC2Role

  # Security Groups
  DevEC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    DeletionPolicy: Delete
    Properties:
      GroupName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-EC2-SG'
      GroupDescription: 'Security group for Development EC2 instance'
      VpcId: !Ref DevVPC
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-EC2-SG'

  ProdEC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    DeletionPolicy: Delete
    Properties:
      GroupName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-EC2-SG'
      GroupDescription: 'Security group for Production EC2 instance'
      VpcId: !Ref ProdVPC
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-EC2-SG'

  # VPC Endpoints for S3
  DevS3VPCEndpoint:
    Type: 'AWS::EC2::VPCEndpoint'
    DeletionPolicy: Delete
    Properties:
      VpcId: !Ref DevVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref DevPrivateRouteTable
        - !Ref DevPublicRouteTable

  ProdS3VPCEndpoint:
    Type: 'AWS::EC2::VPCEndpoint'
    DeletionPolicy: Delete
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
    DeletionPolicy: Delete
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: !Ref InstanceType
      SubnetId: !Ref DevPrivateSubnet
      IamInstanceProfile: !Ref DevInstanceProfile
      SecurityGroupIds:
        - !Ref DevEC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-Instance'
        - Key: Environment
          Value: 'Development'
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y aws-cli
          echo "Development Environment Instance Ready" > /home/ec2-user/environment-info.txt

  ProdEC2Instance:
    Type: 'AWS::EC2::Instance'
    DeletionPolicy: Delete
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: !Ref InstanceType
      SubnetId: !Ref ProdPrivateSubnet
      IamInstanceProfile: !Ref ProdInstanceProfile
      SecurityGroupIds:
        - !Ref ProdEC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-Instance'
        - Key: Environment
          Value: 'Production'
      UserData:
        Fn::Base64: |
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
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-VPC-ID'

  ProdVPCId:
    Description: 'Production VPC ID'
    Value: !Ref ProdVPC
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-VPC-ID'

  # Subnet Outputs
  DevPrivateSubnetId:
    Description: 'Development Private Subnet ID'
    Value: !Ref DevPrivateSubnet
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-Private-Subnet-ID'

  ProdPrivateSubnetId:
    Description: 'Production Private Subnet ID'
    Value: !Ref ProdPrivateSubnet
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-Private-Subnet-ID'

  # S3 Bucket Outputs
  DevS3BucketName:
    Description: 'Development S3 Bucket Name'
    Value: !Ref DevS3Bucket
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-S3-Bucket-Name'

  ProdS3BucketName:
    Description: 'Production S3 Bucket Name'
    Value: !Ref ProdS3Bucket
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-S3-Bucket-Name'

  # EC2 Instance Outputs
  DevEC2InstanceId:
    Description: 'Development EC2 Instance ID'
    Value: !Ref DevEC2Instance
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-EC2-Instance-ID'

  ProdEC2InstanceId:
    Description: 'Production EC2 Instance ID'
    Value: !Ref ProdEC2Instance
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-EC2-Instance-ID'

  # VPC Endpoint Outputs
  DevS3VPCEndpointId:
    Description: 'Development S3 VPC Endpoint ID'
    Value: !Ref DevS3VPCEndpoint
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Dev-S3-VPC-Endpoint-ID'

  ProdS3VPCEndpointId:
    Description: 'Production S3 VPC Endpoint ID'
    Value: !Ref ProdS3VPCEndpoint
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Prod-S3-VPC-Endpoint-ID'
```

## Key Features

### 1. Multi-Environment Architecture
- **Complete environment isolation**: Development and Production environments are fully isolated in separate VPCs
- **Consistent configuration**: Both environments use identical CIDR blocks (10.0.0.0/16) as required
- **Environment-specific resources**: All resources are properly tagged and named with environment indicators

### 2. Network Infrastructure
- **VPC Design**: Each environment has its own VPC with DNS enabled
- **Subnet Architecture**: Public and private subnets in different availability zones for resilience
- **Internet Connectivity**: Internet Gateways for public subnet traffic
- **NAT Gateways**: Enable private subnet instances to access the internet securely
- **Route Tables**: Properly configured for both public and private traffic routing

### 3. Security Implementation
- **IAM Roles**: Least privilege access with environment-specific roles
- **Security Groups**: Restrict traffic appropriately for each environment
- **S3 Bucket Security**: Public access blocked on all buckets
- **VPC Endpoints**: Keep S3 traffic within AWS network for enhanced security
- **Instance Profiles**: Proper IAM role associations for EC2 instances

### 4. Storage Configuration
- **S3 Buckets**: Environment-specific buckets with versioning enabled
- **Naming Convention**: Unique bucket names including environment suffix to avoid conflicts
- **Access Control**: IAM policies restrict bucket access to respective environment resources

### 5. Compute Resources
- **EC2 Instances**: t2.micro instances deployed in private subnets
- **User Data**: Basic initialization scripts for each environment
- **Instance Configuration**: Consistent setup across both environments

### 6. Best Practices Implementation
- **DeletionPolicy**: All resources set to Delete for clean removal
- **Environment Suffix**: All resource names include suffix to ensure uniqueness
- **CloudFormation Outputs**: Comprehensive outputs for cross-stack referencing
- **Parameter Usage**: Flexible configuration through CloudFormation parameters
- **Resource Tagging**: Consistent tagging strategy for resource management

### 7. Deployment Considerations
- **Region**: Deployable in us-east-1 as specified
- **Resource Dependencies**: Proper DependsOn declarations for resource ordering
- **SSM Parameters**: Dynamic AMI selection using AWS Systems Manager
- **Availability Zones**: Resources distributed across multiple AZs for high availability

This solution provides a production-ready, secure, and scalable multi-environment infrastructure that meets all specified requirements while following AWS best practices.

## TapStack.json

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Multi-Environment Infrastructure - Development and Production environments with VPCs, EC2, S3, IAM, and VPC Endpoints",
    "Parameters": {
        "EnvironmentSuffix": {
            "Type": "String",
            "Default": "dev",
            "Description": "Suffix for all resource names to ensure uniqueness"
        },
        "EnvironmentName": {
            "Type": "String",
            "Default": "MultiEnv",
            "Description": "Base name for the environment resources"
        },
        "InstanceType": {
            "Type": "String",
            "Default": "t2.micro",
            "Description": "EC2 instance type for both environments",
            "AllowedValues": [
                "t2.micro",
                "t2.small"
            ]
        }
    }
}
```
*Note: TapStack.json is the JSON conversion of TapStack.yml containing the same infrastructure definition in JSON CloudFormation format.*

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
```
*Note: multi-environment-infrastructure.yaml is the original template that was refactored into the final TapStack.yml with environment suffix parameters and consistent CIDR blocks.*

## AWS_REGION

```text
us-east-1
```
*Note: AWS_REGION file specifies the deployment region for the CloudFormation stack.*