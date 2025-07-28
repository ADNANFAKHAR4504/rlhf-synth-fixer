# VPC Infrastructure CloudFormation Solution

I'll create a comprehensive CloudFormation YAML template that provisions a secure, scalable, and cost-effective AWS Virtual Private Cloud (VPC) infrastructure suitable for hosting applications in a multi-AZ environment.

## Solution Overview

The solution creates:
- **VPC** with CIDR block `10.0.0.0/16`
- **Two public subnets** in distinct availability zones
- **Two private subnets** in distinct availability zones
- **Internet Gateway** for public internet access
- **Two NAT Gateways** for high availability private subnet internet access
- **Proper routing configuration** with route tables and associations
- **Cost optimization** through appropriate resource sizing and tagging
- **Comprehensive tagging strategy** for cost tracking and management

## File Structure and Implementation

### Primary Infrastructure Template

**lib/TapStack.yml**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC Infrastructure - Secure, scalable, and cost-effective AWS Virtual Private Cloud infrastructure for multi-AZ environment'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # Internet Gateway Attachment
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet 1 (AZ a)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'
        - Key: Type
          Value: 'Public'

  # Public Subnet 2 (AZ b)
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'
        - Key: Type
          Value: 'Public'

  # Private Subnet 1 (AZ a)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'
        - Key: Type
          Value: 'Private'

  # Private Subnet 2 (AZ b)
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'
        - Key: Type
          Value: 'Private'

  # NAT Gateway 1 Elastic IP
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # NAT Gateway 2 Elastic IP
  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # NAT Gateway 1
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # NAT Gateway 2
  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # Default Public Route
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Public Subnet 1 Route Table Association
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  # Public Subnet 2 Route Table Association
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # Private Route Table 1
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # Default Private Route 1
  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  # Private Subnet 1 Route Table Association
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  # Private Route Table 2
  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'VPC-Infrastructure'
        - Key: Owner
          Value: 'DevOps-Team'
        - Key: BillingCode
          Value: 'INFRA-001'

  # Default Private Route 2
  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  # Private Subnet 2 Route Table Association
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  VPCCidrBlock:
    Description: 'CIDR block of the VPC'
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-VPCCidrBlock'

  InternetGatewayId:
    Description: 'ID of the Internet Gateway'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGatewayId'

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

  PrivateSubnet1Id:
    Description: 'ID of the first private subnet'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'ID of the second private subnet'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  NatGateway1Id:
    Description: 'ID of the first NAT Gateway'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway1Id'

  NatGateway2Id:
    Description: 'ID of the second NAT Gateway'
    Value: !Ref NatGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway2Id'

  PublicRouteTableId:
    Description: 'ID of the public route table'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-PublicRouteTableId'

  PrivateRouteTable1Id:
    Description: 'ID of the first private route table'
    Value: !Ref PrivateRouteTable1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateRouteTable1Id'

  PrivateRouteTable2Id:
    Description: 'ID of the second private route table'
    Value: !Ref PrivateRouteTable2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateRouteTable2Id'

  AvailabilityZones:
    Description: 'Availability zones used'
    Value: !Join 
      - ','
      - - !Select [0, !GetAZs '']
        - !Select [1, !GetAZs '']
    Export:
      Name: !Sub '${AWS::StackName}-AvailabilityZones'

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

## Architecture Design

### Network Segmentation
- **Public Subnets (10.0.1.0/24, 10.0.2.0/24)**: Host resources that need direct internet access (load balancers, bastion hosts)
- **Private Subnets (10.0.11.0/24, 10.0.12.0/24)**: Host application servers, databases, and internal services

### High Availability
- **Multi-AZ Deployment**: All subnets are distributed across two availability zones
- **Redundant NAT Gateways**: Each private subnet has its own NAT Gateway for fault tolerance
- **Cross-AZ Load Distribution**: Applications can be deployed across zones for resilience

### Security Best Practices
- **Network Isolation**: Private subnets cannot be directly accessed from the internet
- **Controlled Egress**: Private subnet internet access only through NAT Gateways
- **DNS Resolution**: Enabled DNS hostnames and support for service discovery

### Cost Optimization
- **Efficient CIDR Design**: Allows for future expansion while minimizing wasted IP space
- **Shared NAT Gateways**: Each NAT Gateway serves one AZ to balance cost and availability
- **Resource Tagging**: Comprehensive tagging strategy for cost allocation and management

## Deployment Instructions

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. Access to deploy CloudFormation stacks
3. Permissions for VPC, EC2, and networking resources

### Deployment Commands
```bash
# Validate template syntax
pipenv run cfn-validate-yaml

# Deploy the stack
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --tags Repository=${REPOSITORY} CommitAuthor=${COMMIT_AUTHOR}

# Export outputs for testing
aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs' > cfn-outputs/flat-outputs.json
```

### Testing
```bash
# Run unit tests
npm run test:unit

# Run integration tests (after deployment)
npm run test:integration

# Lint the code
npm run lint

# Build TypeScript
npm run build
```

## Outputs and Exports

The template provides comprehensive outputs for integration with other stacks:

- **VPCId, VPCCidrBlock**: Core VPC information
- **PublicSubnet1Id, PublicSubnet2Id**: Public subnet IDs for load balancers
- **PrivateSubnet1Id, PrivateSubnet2Id**: Private subnet IDs for applications
- **NatGateway1Id, NatGateway2Id**: NAT Gateway IDs for routing configuration
- **PublicRouteTableId, PrivateRouteTable1Id, PrivateRouteTable2Id**: Route table IDs
- **InternetGatewayId**: Internet Gateway ID
- **AvailabilityZones**: List of AZs used in deployment

All outputs are exported with the stack name prefix for cross-stack references.

## Security Considerations

- **No Default Subnets**: Custom subnets provide better control over network design
- **Proper Route Isolation**: Public and private subnets have separate routing logic
- **Internet Access Control**: Private subnets access internet through NAT Gateways only
- **Resource Tagging**: All resources properly tagged for security and compliance tracking

This solution provides a robust, scalable, and cost-effective VPC foundation suitable for hosting applications in a production multi-AZ environment while following AWS best practices for security and high availability.