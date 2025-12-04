# Multi-AZ VPC Infrastructure - CloudFormation Implementation

This implementation provides a production-ready multi-AZ VPC infrastructure using CloudFormation YAML. The template creates a highly available network foundation with public and private subnets across three availability zones, NAT gateways for private subnet internet access, and proper security controls.

## File: lib/TapStack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-AZ VPC Infrastructure for Production Trading Platform - Task 101000928'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource naming to allow multiple deployments'
    Default: 'prod'
    AllowedPattern: '[a-z0-9-]+'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

Resources:
  # VPC Configuration
  TradingPlatformVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref TradingPlatformVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TradingPlatformVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-east-1a
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1a-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TradingPlatformVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-east-1b
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1b-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform
        - Key: Type
          Value: Public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TradingPlatformVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-east-1c
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1c-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform
        - Key: Type
          Value: Public

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TradingPlatformVPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: us-east-1a
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1a-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TradingPlatformVPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: us-east-1b
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1b-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform
        - Key: Type
          Value: Private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref TradingPlatformVPC
      CidrBlock: 10.0.13.0/24
      AvailabilityZone: us-east-1c
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1c-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform
        - Key: Type
          Value: Private

  # Elastic IPs for NAT Gateways
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1a-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1b-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1c-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  # NAT Gateways
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1a-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1b-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1c-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TradingPlatformVPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables (one per AZ for high availability)
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TradingPlatformVPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1a-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TradingPlatformVPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1b-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref TradingPlatformVPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1c-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # Security Group for HTTPS Access
  HTTPSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'https-sg-${EnvironmentSuffix}'
      GroupDescription: 'Security group allowing HTTPS inbound and all outbound traffic'
      VpcId: !Ref TradingPlatformVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'https-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
        - Key: Project
          Value: TradingPlatform

Outputs:
  VPCId:
    Description: 'VPC ID for the Trading Platform'
    Value: !Ref TradingPlatformVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID (us-east-1a)'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID (us-east-1b)'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PublicSubnet3Id:
    Description: 'Public Subnet 3 ID (us-east-1c)'
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet3-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID (us-east-1a)'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID (us-east-1b)'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  PrivateSubnet3Id:
    Description: 'Private Subnet 3 ID (us-east-1c)'
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet3-ID'

  HTTPSSecurityGroupId:
    Description: 'Security Group ID for HTTPS access'
    Value: !Ref HTTPSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-HTTPS-SG-ID'

  NATGateway1Id:
    Description: 'NAT Gateway 1 ID (us-east-1a)'
    Value: !Ref NATGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway1-ID'

  NATGateway2Id:
    Description: 'NAT Gateway 2 ID (us-east-1b)'
    Value: !Ref NATGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway2-ID'

  NATGateway3Id:
    Description: 'NAT Gateway 3 ID (us-east-1c)'
    Value: !Ref NATGateway3
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway3-ID'

  VPCCidr:
    Description: 'VPC CIDR Block'
    Value: !GetAtt TradingPlatformVPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-VPC-CIDR'
```

## File: lib/README.md

```markdown
# Multi-AZ VPC Infrastructure - CloudFormation

This CloudFormation template deploys a production-ready multi-AZ VPC infrastructure for a financial services trading platform with high availability, security, and PCI-DSS compliance considerations.

## Architecture Overview

The infrastructure consists of:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Public Subnets**: Three subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across us-east-1a, us-east-1b, us-east-1c
- **Private Subnets**: Three subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across the same AZs
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: Three NAT gateways (one per AZ) for high-availability outbound internet access from private subnets
- **Route Tables**: Separate route tables for public and private subnets with proper routing configuration
- **Security Group**: HTTPS (443) inbound access with all outbound traffic allowed

## Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create VPC, Subnet, Internet Gateway, NAT Gateway, Route Table, and Security Group resources
- AWS account with available Elastic IPs (3 required for NAT Gateways)

## Deployment Instructions

### 1. Validate the Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.yaml \
  --region us-east-1
```

### 2. Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name trading-platform-vpc-prod \
  --template-body file://lib/TapStack.yaml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --region us-east-1 \
  --tags Key=Environment,Value=Production Key=Project,Value=TradingPlatform
```

### 3. Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

Or watch events in real-time:

```bash
aws cloudformation describe-stack-events \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1 \
  --max-items 10
```

### 4. Retrieve Outputs

Once the stack is deployed successfully:

```bash
aws cloudformation describe-stacks \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Stack Outputs

The template exports the following outputs for use by other stacks:

- **VPCId**: VPC identifier
- **PublicSubnet1Id, PublicSubnet2Id, PublicSubnet3Id**: Public subnet identifiers
- **PrivateSubnet1Id, PrivateSubnet2Id, PrivateSubnet3Id**: Private subnet identifiers
- **HTTPSSecurityGroupId**: HTTPS security group identifier
- **NATGateway1Id, NATGateway2Id, NATGateway3Id**: NAT Gateway identifiers
- **VPCCidr**: VPC CIDR block

## Using Outputs in Other Stacks

Reference these outputs in other CloudFormation templates:

```yaml
Resources:
  MyResource:
    Type: AWS::SomeService::Resource
    Properties:
      VpcId: !ImportValue 'trading-platform-vpc-prod-VPC-ID'
      SubnetIds:
        - !ImportValue 'trading-platform-vpc-prod-PrivateSubnet1-ID'
        - !ImportValue 'trading-platform-vpc-prod-PrivateSubnet2-ID'
        - !ImportValue 'trading-platform-vpc-prod-PrivateSubnet3-ID'
```

## Cost Considerations

**Monthly Cost Estimate (approximate):**

- NAT Gateway (3): ~$98/month ($32.40 per NAT Gateway)
- Data Processing: Variable based on traffic (starts at $0.045/GB)
- Elastic IPs: Free when attached to running NAT Gateways
- VPC, Subnets, Route Tables, Internet Gateway: No charge

**Total estimated monthly cost**: $100-150 depending on data transfer

## Clean Up

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1
```

Monitor deletion:

```bash
aws cloudformation describe-stacks \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

**Note**: All resources in this template are designed to be fully deletable. No DeletionPolicy: Retain is used.

## Security Considerations

1. **Network Isolation**: Private subnets have no direct internet access
2. **HTTPS Only**: Security group restricts inbound traffic to HTTPS (443)
3. **Multi-AZ Design**: Resources distributed across three availability zones for fault tolerance
4. **NAT Gateway HA**: Each AZ has its own NAT Gateway to prevent single point of failure
5. **PCI-DSS Ready**: Network segmentation supports PCI-DSS compliance requirements

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name trading-platform-vpc-prod \
     --region us-east-1
   ```

2. Common issues:
   - **Insufficient Elastic IPs**: Request limit increase if you've reached the EIP limit
   - **Service Limits**: Check VPC, subnet, and NAT Gateway limits in your account
   - **Invalid CIDR**: Ensure 10.0.0.0/16 doesn't conflict with existing VPCs

### NAT Gateway Not Working

1. Verify NAT Gateway status:
   ```bash
   aws ec2 describe-nat-gateways \
     --region us-east-1 \
     --filter "Name=vpc-id,Values=<VPC_ID>"
   ```

2. Check route table associations and routes

### Connectivity Issues

1. Verify security group rules
2. Check Network ACLs (default allows all traffic)
3. Ensure proper route table associations

## Next Steps

After deploying this VPC infrastructure, you can:

1. Deploy RDS databases in private subnets
2. Deploy Application Load Balancers in public subnets
3. Launch EC2 instances in appropriate subnets
4. Configure additional security groups for application tiers
5. Set up VPC Flow Logs for network monitoring

## Support

For issues or questions about this infrastructure:
- Review CloudFormation documentation
- Check AWS VPC best practices
- Contact your AWS support team
```

## Deployment Summary

The CloudFormation template creates a complete multi-AZ VPC infrastructure with:

1. **Network Foundation**: VPC with 10.0.0.0/16 CIDR, DNS enabled
2. **High Availability**: Resources across three availability zones (us-east-1a, us-east-1b, us-east-1c)
3. **Public Tier**: Three public subnets with Internet Gateway routing
4. **Private Tier**: Three private subnets with dedicated NAT Gateway routing per AZ
5. **Security**: HTTPS security group with inline rules as required
6. **Tagging**: All resources tagged with Environment=Production and Project=TradingPlatform
7. **Outputs**: All required IDs exported for cross-stack references
8. **Flexibility**: EnvironmentSuffix parameter allows multiple deployments

The template follows CloudFormation best practices and includes no DeletionPolicy: Retain, ensuring all resources can be cleanly deleted.
