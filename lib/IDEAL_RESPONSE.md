# BrazilCart E-Commerce Infrastructure - Ideal Implementation

This document contains the complete infrastructure code for the BrazilCart e-commerce platform deployment using Pulumi with Python.

## File: lib/AWS_REGION

```
eu-south-2
```

## File: lib/TapStack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Containerized Learning Management System Infrastructure for EduTech Singapore'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource naming to enable multiple deployments'
    Default: 'dev'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  VpcCidr:
    Type: String
    Description: 'CIDR block for VPC'
    Default: '10.0.0.0/16'

  DatabaseMasterUsername:
    Type: String
    Description: 'Master username for Aurora database'
    Default: 'lmsadmin'
    NoEcho: true

  ContainerImage:
    Type: String
    Description: 'Docker image for LMS application'
    Default: 'nginx:latest'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCidr
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DatabaseMasterUsername
      - Label:
          default: 'Application Configuration'
        Parameters:
          - ContainerImage

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
          Value: !Sub 'lms-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'PDPA'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'lms-igw-${EnvironmentSuffix}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'lms-public-subnet-1-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'lms-public-subnet-2-${EnvironmentSuffix}'
        - Key: Type
          Value: 'Public'

  # ==================== Security Groups ====================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'lms-alb-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS traffic'
      Tags:
        - Key: Name
          Value: !Sub 'lms-alb-sg-${EnvironmentSuffix}'

  # ==================== KMS Encryption Key ====================

  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for LMS data encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'lms-kms-key-${EnvironmentSuffix}'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  ECSClusterName:
    Description: 'ECS Cluster Name'
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECSCluster'
```

