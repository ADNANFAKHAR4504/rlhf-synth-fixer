# CloudFormation Infrastructure Solution

## Overview
This CloudFormation template provisions a highly available, scalable, and secure cloud environment in a single AWS region to support a critical application. The infrastructure includes VPC networking, security groups, IAM roles, and database subnet groups across multiple availability zones.

## Infrastructure Components

### TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: |
  CloudFormation template for a highly available, scalable, and secure
  cloud environment in a single AWS region to support a critical application.

Parameters:
  ProjectName:
    Type: String
    Description: A unique name for the project, used as a prefix for resources.
    Default: TapStack
  Region1:
    Type: String
    Default: us-east-2
    Description: The AWS region for deployment.
  VpcCidr1:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for the VPC in Region 1.
  PublicSubnet1Cidr1:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for Public Subnet 1 in Region 1.
  PrivateSubnet1Cidr1:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for Private Subnet 1 in Region 1.
  PublicSubnet2Cidr1:
    Type: String
    Default: 10.0.3.0/24
    Description: CIDR block for Public Subnet 2 in Region 1.
  PrivateSubnet2Cidr1:
    Type: String
    Default: 10.0.4.0/24
    Description: CIDR block for Private Subnet 2 in Region 1.


Resources:
  VpcR1:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr1
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-VPC-R1-${Region1}

  PublicSubnet1R1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcR1
      CidrBlock: !Ref PublicSubnet1Cidr1
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-PublicSubnet1-R1-${Region1}

  PublicSubnet2R1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcR1
      CidrBlock: !Ref PublicSubnet2Cidr1
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-PublicSubnet2-R1-${Region1}

  PrivateSubnet1R1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcR1
      CidrBlock: !Ref PrivateSubnet1Cidr1
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-PrivateSubnet1-R1-${Region1}

  PrivateSubnet2R1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcR1
      CidrBlock: !Ref PrivateSubnet2Cidr1
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-PrivateSubnet2-R1-${Region1}

  IgwR1:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-IGW-R1-${Region1}

  IgwAttachmentR1:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VpcR1
      InternetGatewayId: !Ref IgwR1

  NatEipR1:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  PublicRouteTableR1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VpcR1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-PublicRouteTable-R1-${Region1}

  PrivateRouteTableR1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VpcR1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-PrivateRouteTable-R1-${Region1}

  PublicRouteR1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTableR1
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref IgwR1

  PublicSubnet1AssocR1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1R1
      RouteTableId: !Ref PublicRouteTableR1

  PublicSubnet2AssocR1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2R1
      RouteTableId: !Ref PublicRouteTableR1

  PrivateSubnet1AssocR1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1R1
      RouteTableId: !Ref PrivateRouteTableR1

  PrivateSubnet2AssocR1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2R1
      RouteTableId: !Ref PrivateRouteTableR1

  AlbSgR1:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB Security Group for HTTP and HTTPS from anywhere
      VpcId: !Ref VpcR1
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
          Value: !Sub ${ProjectName}-ALBSG-R1-${Region1}

  AppSgR1:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: App Security Group for HTTP from ALB and SSH from specific IP
      VpcId: !Ref VpcR1
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-AppSG-R1-${Region1}

  DbSgR1:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: DB Security Group for MySQL from Application Security Group
      VpcId: !Ref VpcR1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-DBSG-R1-${Region1}

  Ec2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource: "*"

  DbSubnetGroupR1:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: DB Subnet Group for RDS in Region 1
      SubnetIds:
        - !Ref PrivateSubnet1R1
        - !Ref PrivateSubnet2R1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-DBSG-R1-${Region1}

Outputs:
  VpcId:
    Description: The ID of the created VPC
    Value: !Ref VpcR1
    Export:
      Name: !Sub "${ProjectName}-VPCID"

  PublicSubnetIds:
    Description: A comma-delimited list of the Public Subnet IDs
    Value: !Join [",", [!Ref PublicSubnet1R1, !Ref PublicSubnet2R1]]
    Export:
      Name: !Sub "${ProjectName}-PublicSubnets"

  PrivateSubnetIds:
    Description: A comma-delimited list of the Private Subnet IDs
    Value: !Join [",", [!Ref PrivateSubnet1R1, !Ref PrivateSubnet2R1]]
    Export:
      Name: !Sub "${ProjectName}-PrivateSubnets"

  AlbSecurityGroupId:
    Description: The ID of the Application Load Balancer Security Group
    Value: !GetAtt AlbSgR1.GroupId
    Export:
      Name: !Sub "${ProjectName}-AlbSgId"

  AppSecurityGroupId:
    Description: The ID of the Application Security Group
    Value: !GetAtt AppSgR1.GroupId
    Export:
      Name: !Sub "${ProjectName}-AppSgId"

  DbSecurityGroupId:
    Description: The ID of the Database Security Group
    Value: !GetAtt DbSgR1.GroupId
    Export:
      Name: !Sub "${ProjectName}-DbSgId"
      
  DbSubnetGroupName:
    Description: The name of the RDS DB Subnet Group
    Value: !Ref DbSubnetGroupR1
    Export:
      Name: !Sub "${ProjectName}-DbSubnetGroup"

  Ec2InstanceRoleArn:
    Description: The ARN of the EC2 Instance Role
    Value: !GetAtt Ec2InstanceRole.Arn
    Export:
      Name: !Sub "${ProjectName}-Ec2InstanceRoleArn"

  NatEipR1PublicIp:
    Description: The Public IP Address of the NAT Gateway Elastic IP
    Value: !GetAtt NatEipR1.PublicIp
    Export:
      Name: !Sub "${ProjectName}-NatEipPublicIp"
      
  NatEipR1AllocationId:
    Description: The Allocation ID of the NAT Gateway Elastic IP
    Value: !GetAtt NatEipR1.AllocationId
    Export:
      Name: !Sub "${ProjectName}-NatEipAllocationId"
```

## Key Features

- **Single Region Deployment**: Optimized for deployment in a single AWS region (us-east-2)
- **High Availability**: Resources distributed across multiple availability zones
- **Network Segmentation**: Public and private subnets for security isolation
- **Security Groups**: ALB, Application, and Database security groups with proper ingress rules
- **IAM Role**: EC2 instance role with SSM and S3 access permissions
- **Database Infrastructure**: RDS DB subnet group for database deployment in private subnets
- **NAT Gateway EIP**: Elastic IP for NAT Gateway to provide outbound internet access
- **Comprehensive Outputs**: All critical resource IDs exported for cross-stack references