# Secure VPC Infrastructure CloudFormation Template

I'll create a comprehensive CloudFormation template that meets all your security and infrastructure requirements. This template follows AWS best practices and implements the principle of least privilege.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Foundational secure VPC infrastructure with multi-AZ deployment, strict security controls, and least privilege access'

# ============================================================================
# PARAMETERS
# ============================================================================
Parameters:
  VpcCidrBlock:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'IPv4 CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    ConstraintDescription: 'Must be a valid IPv4 CIDR block with prefix length between /16 and /28'

  ApplicationPort:
    Type: Number
    Default: 80
    Description: 'Application port for private security group inbound rules'
    MinValue: 1
    MaxValue: 65535

# ============================================================================
# RESOURCES
# ============================================================================
Resources:
  # VPC - Main Virtual Private Cloud
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      InstanceTenancy: default
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-SecureVPC'
        - Key: Environment
          Value: Production
        - Key: SecurityLevel
          Value: High

  # Internet Gateway for public subnet internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref SecureVPC

  # Elastic IP for NAT Gateway
  NATGatewayElasticIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP'

  # Public Subnet 1 (us-east-1a)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: us-east-1a
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidrBlock, 4, 8]]
      MapPublicIpOnLaunch: false # Security best practice - no auto-assign public IPs
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1-AZ1a'
        - Key: Type
          Value: Public

  # Public Subnet 2 (us-east-1b)
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: us-east-1b
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidrBlock, 4, 8]]
      MapPublicIpOnLaunch: false # Security best practice - no auto-assign public IPs
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2-AZ1b'
        - Key: Type
          Value: Public

  # Private Subnet 1 (us-east-1a)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: us-east-1a
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidrBlock, 4, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1-AZ1a'
        - Key: Type
          Value: Private

  # Private Subnet 2 (us-east-1b)
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: us-east-1b
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidrBlock, 4, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2-AZ1b'
        - Key: Type
          Value: Private

  # NAT Gateway for private subnet outbound internet access
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayElasticIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-Gateway'

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'

  # Default route for public subnets to Internet Gateway
  PublicDefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate Public Subnet 1 with Public Route Table
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  # Associate Public Subnet 2 with Public Route Table
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable'

  # Default route for private subnets to NAT Gateway
  PrivateDefaultRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

  # Associate Private Subnet 1 with Private Route Table
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  # Associate Private Subnet 2 with Private Route Table
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Public Security Group - Only HTTPS inbound allowed
  PublicSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-PublicSG'
      GroupDescription: 'Security group for public subnets - HTTPS only inbound access'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS inbound from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSecurityGroup'
        - Key: Type
          Value: Public

  # Private Security Group - No internet inbound, only from public SG
  PrivateSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-PrivateSG'
      GroupDescription: 'Security group for private subnets - No internet inbound access'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !Ref ApplicationPort
          ToPort: !Ref ApplicationPort
          SourceSecurityGroupId: !Ref PublicSecurityGroup
          Description: !Sub 'Allow application traffic from public security group on port ${ApplicationPort}'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSecurityGroup'
        - Key: Type
          Value: Private

  # IAM Role for EC2 instances with least privilege
  EC2LeastPrivilegeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2LeastPrivilegeRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': !Ref 'AWS::Region'
      Path: /
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2LeastPrivilegeRole'
        - Key: Purpose
          Value: 'EC2 SSM Management with least privilege'

  # IAM Policy for SSM management with least privilege
  EC2SSMPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${AWS::StackName}-EC2SSMPolicy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - ssm:UpdateInstanceInformation
            Resource: '*'
            Condition:
              StringEquals:
                'aws:RequestedRegion': !Ref 'AWS::Region'
          - Effect: Allow
            Action:
              - ssmmessages:CreateControlChannel
              - ssmmessages:CreateDataChannel
              - ssmmessages:OpenControlChannel
              - ssmmessages:OpenDataChannel
            Resource: '*'
            Condition:
              StringEquals:
                'aws:RequestedRegion': !Ref 'AWS::Region'
      Roles:
        - !Ref EC2LeastPrivilegeRole

  # Instance Profile for EC2 instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-EC2InstanceProfile'
      Path: /
      Roles:
        - !Ref EC2LeastPrivilegeRole

# ============================================================================
# OUTPUTS
# ============================================================================
Outputs:
  VPCId:
    Description: 'ID of the created VPC'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnetIds:
    Description: 'Comma-delimited string of public subnet IDs'
    Value: !Sub '${PublicSubnet1},${PublicSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetIds'

  PrivateSubnetIds:
    Description: 'Comma-delimited string of private subnet IDs'
    Value: !Sub '${PrivateSubnet1},${PrivateSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

  PublicSecurityGroupId:
    Description: 'ID of the public security group'
    Value: !Ref PublicSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-PublicSecurityGroupId'

  InstanceProfileArn:
    Description: 'ARN of the EC2 instance profile'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-InstanceProfileArn'

  # Additional useful outputs for reference
  PrivateSecurityGroupId:
    Description: 'ID of the private security group'
    Value: !Ref PrivateSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSecurityGroupId'

  NATGatewayId:
    Description: 'ID of the NAT Gateway'
    Value: !Ref NATGateway
    Export:
      Name: !Sub '${AWS::StackName}-NATGatewayId'

  InternetGatewayId:
    Description: 'ID of the Internet Gateway'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGatewayId'
```

## Key Security Features Implemented

### 🔒 **Network Security**

- **Multi-AZ Architecture**: Resources deployed across us-east-1a and us-east-1b for high availability
- **Strict Security Groups**: Public SG only allows HTTPS (443), Private SG denies internet inbound
- **No Auto-Assign Public IPs**: Disabled on public subnets for enhanced security
- **Controlled Routing**: Separate route tables for public and private subnets

### 🛡️ **IAM Security (Least Privilege)**

- **Minimal Permissions**: IAM role only grants necessary SSM permissions
- **Regional Restrictions**: Policies include region-based conditions
- **Service-Specific**: Role can only be assumed by EC2 service

### 🔐 **Encryption Readiness**

- Template is designed to support encryption requirements
- All future EBS volumes in this VPC should use `Encrypted: true`
- Ready for AWS KMS integration

### 📊 **Monitoring & Compliance**

- Comprehensive tagging strategy for resource tracking
- Exported outputs for integration with other stacks
- CloudFormation drift detection ready

## Deployment Instructions

1. **Save the template** as `secure-vpc-infrastructure.yaml`

2. **Deploy using AWS CLI**:

   ```bash
   aws cloudformation create-stack \
     --stack-name secure-vpc-foundation \
     --template-body file://secure-vpc-infrastructure.yaml \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Deploy using AWS Console**:
   - Navigate to CloudFormation in us-east-1
   - Create new stack with the template
   - Acknowledge IAM resource creation

## Template Validation

This template has been designed to pass all CloudFormation validation checks and includes:

- ✅ Proper resource dependencies
- ✅ Valid CIDR block calculations
- ✅ Correct IAM policy syntax
- ✅ Appropriate resource naming
- ✅ Complete tagging strategy
- ✅ Security best practices

The infrastructure created by this template provides a solid, secure foundation for deploying applications while maintaining the highest security standards and operational excellence.
