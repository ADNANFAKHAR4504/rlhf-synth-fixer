# CloudFormation Template for ProjectX Infrastructure

## Design Approach

I've structured this template to follow AWS best practices while keeping it maintainable for your team. Here's my approach:

- **Modular organization**: Resources are grouped logically (networking, security, compute)
- **Parameter-driven**: Key values like office IP and instance type are parameterized for flexibility
- **Consistent naming**: All resources follow a clear naming convention with ProjectX prefix
- **Proper dependencies**: CloudFormation will create resources in the correct order automatically
- **Security-first**: Private subnets for compute, restrictive security groups, and proper routing

## Full CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ProjectX - Basic infrastructure setup with VPC, subnets, EC2 instances, and security groups'

# Parameters allow customization without modifying the template
Parameters:
  OfficeIPAddress:
    Type: String
    Description: 'Your office public IP address for SSH access (format: x.x.x.x/32)'
    Default: '203.0.113.0/32'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/32$'
    ConstraintDescription: 'Must be a valid IP address in CIDR format (x.x.x.x/32)'
  
  InstanceType:
    Type: String
    Description: 'EC2 instance type for the application servers'
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    ConstraintDescription: 'Must be a valid EC2 instance type'

# Mappings help us get the latest Amazon Linux 2 AMI ID
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890  # You'll need to update this with current AMI ID

Resources:
  # ==========================================
  # NETWORKING RESOURCES
  # ==========================================
  
  # Main VPC - Our isolated network environment
  ProjectXVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: ProjectX-VPC
        - Key: Project
          Value: ProjectX

  # Internet Gateway - Allows internet access for public subnets
  ProjectXInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: ProjectX-InternetGateway
        - Key: Project
          Value: ProjectX

  # Attach Internet Gateway to VPC
  ProjectXInternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref ProjectXInternetGateway
      VpcId: !Ref ProjectXVPC

  # Public Subnet 1 - For NAT Gateway and other public resources
  ProjectXPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProjectX-Public-Subnet-1
        - Key: Project
          Value: ProjectX

  # Public Subnet 2 - Second AZ for high availability
  ProjectXPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProjectX-Public-Subnet-2
        - Key: Project
          Value: ProjectX

  # Private Subnet 1 - For application servers
  ProjectXPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: ProjectX-Private-Subnet-1
        - Key: Project
          Value: ProjectX

  # Private Subnet 2 - Second AZ for high availability
  ProjectXPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24
      Tags:
        - Key: Name
          Value: ProjectX-Private-Subnet-2
        - Key: Project
          Value: ProjectX

  # Elastic IP for NAT Gateway - Static IP that won't change
  ProjectXNATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: ProjectXInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: ProjectX-NAT-Gateway-EIP
        - Key: Project
          Value: ProjectX

  # NAT Gateway - Allows private subnets to access internet for updates, etc.
  ProjectXNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProjectXNATGatewayEIP.AllocationId
      SubnetId: !Ref ProjectXPublicSubnet1
      Tags:
        - Key: Name
          Value: ProjectX-NAT-Gateway
        - Key: Project
          Value: ProjectX

  # Route Table for Public Subnets
  ProjectXPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProjectXVPC
      Tags:
        - Key: Name
          Value: ProjectX-Public-Route-Table
        - Key: Project
          Value: ProjectX

  # Route for public subnets to reach internet via Internet Gateway
  ProjectXPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProjectXInternetGatewayAttachment
    Properties:
      RouteTableId: !Ref ProjectXPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ProjectXInternetGateway

  # Associate public subnets with public route table
  ProjectXPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref ProjectXPublicRouteTable
      SubnetId: !Ref ProjectXPublicSubnet1

  ProjectXPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref ProjectXPublicRouteTable
      SubnetId: !Ref ProjectXPublicSubnet2

  # Route Table for Private Subnets
  ProjectXPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProjectXVPC
      Tags:
        - Key: Name
          Value: ProjectX-Private-Route-Table
        - Key: Project
          Value: ProjectX

  # Route for private subnets to reach internet via NAT Gateway
  ProjectXPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProjectXPrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref ProjectXNATGateway

  # Associate private subnets with private route table
  ProjectXPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref ProjectXPrivateRouteTable
      SubnetId: !Ref ProjectXPrivateSubnet1

  ProjectXPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref ProjectXPrivateRouteTable
      SubnetId: !Ref ProjectXPrivateSubnet2

  # ==========================================
  # SECURITY GROUPS
  # ==========================================

  # Security Group for EC2 instances - Only allows SSH from office
  ProjectXEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: ProjectX-EC2-SecurityGroup
      GroupDescription: 'Security group for ProjectX EC2 instances - SSH access from office only'
      VpcId: !Ref ProjectXVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref OfficeIPAddress
          Description: 'SSH access from office IP'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: ProjectX-EC2-SecurityGroup
        - Key: Project
          Value: ProjectX

  # ==========================================
  # COMPUTE RESOURCES
  # ==========================================

  # EC2 Instance in Private Subnet 1
  ProjectXEC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      SubnetId: !Ref ProjectXPrivateSubnet1
      SecurityGroupIds:
        - !Ref ProjectXEC2SecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y htop
          # Add any additional setup commands here
      Tags:
        - Key: Name
          Value: ProjectX-EC2-Instance-1
        - Key: Project
          Value: ProjectX

  # EC2 Instance in Private Subnet 2
  ProjectXEC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      SubnetId: !Ref ProjectXPrivateSubnet2
      SecurityGroupIds:
        - !Ref ProjectXEC2SecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y htop
          # Add any additional setup commands here
      Tags:
        - Key: Name
          Value: ProjectX-EC2-Instance-2
        - Key: Project
          Value: ProjectX

# ==========================================
# OUTPUTS
# ==========================================
Outputs:
  VPCId:
    Description: 'VPC ID for ProjectX infrastructure'
    Value: !Ref ProjectXVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref ProjectXPublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref ProjectXPublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref ProjectXPrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref ProjectXPrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-2-ID'

  EC2SecurityGroupId:
    Description: 'Security Group ID for EC2 instances'
    Value: !Ref ProjectXEC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2-SecurityGroup-ID'

  EC2Instance1Id:
    Description: 'EC2 Instance 1 ID'
    Value: !Ref ProjectXEC2Instance1

  EC2Instance2Id:
    Description: 'EC2 Instance 2 ID'
    Value: !Ref ProjectXEC2Instance2

  NATGatewayIP:
    Description: 'NAT Gateway Elastic IP'
    Value: !Ref ProjectXNATGatewayEIP
```

## Helpful Outputs

The template includes several outputs that will be useful for your team:

- **VPC and Subnet IDs**: For referencing in other stacks or when creating additional resources
- **Security Group ID**: For adding to other resources that need the same access rules
- **Instance IDs**: For monitoring and management
- **NAT Gateway IP**: For whitelisting in external services

These outputs are also exported, so other CloudFormation stacks can reference them using `!ImportValue`.

## Deployment Process Heads Up

### Before You Deploy

1. **Update the AMI ID**: The template has a placeholder AMI ID. Get the latest Amazon Linux 2 AMI ID for us-east-1:
   ```bash
   aws ec2 describe-images --owners amazon --filters "Name=name,Values=amzn2-ami-hvm-*" --query 'Images[*].[ImageId,CreationDate]' --output table
   ```

2. **Get your office IP**: Find your public IP address:
   ```bash
   curl ifconfig.me
   ```
   Then format it as `x.x.x.x/32` for the parameter.

### Deployment Commands

```bash
# Deploy the stack
aws cloudformation create-stack \
  --stack-name projectx-infrastructure \
  --template-body file://projectx-template.yaml \
  --parameters ParameterKey=OfficeIPAddress,ParameterValue=YOUR.IP.ADDRESS.HERE/32 \
  --region us-east-1

# Check deployment status
aws cloudformation describe-stacks --stack-name projectx-infrastructure --region us-east-1
```

### Important Notes

- **Cost consideration**: The NAT Gateway costs ~$45/month, so don't forget about it in non-production environments
- **Key pairs**: The template doesn't create EC2 key pairs. You'll need to create one first if you want to SSH to the instances
- **AMI updates**: Consider parameterizing the AMI ID or using AWS Systems Manager Parameter Store for automatic updates
- **Cleanup**: When testing, remember to delete the stack to avoid ongoing charges

This template gives you a solid, standardized foundation that your team can build upon while following AWS best practices!