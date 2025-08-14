# CloudFormation Template Design Approach

## Design Strategy

I've created a comprehensive yet straightforward template that follows AWS best practices:

- **Modular structure**: Organized by logical components (networking, security, compute)
- **Parameter-driven**: Key values like office IP and instance type are configurable
- **Proper dependencies**: Resources are created in the correct order using `DependsOn` where needed
- **Consistent naming**: All resources follow the 'ProjectX-' prefix convention
- **Security-first**: Private subnets for compute, restrictive security groups, NAT for outbound access

## Complete CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ProjectX Infrastructure - VPC with public/private subnets, NAT Gateway, and EC2 instances'

Parameters:
  OfficeIPCIDR:
    Type: String
    Description: 'Office IP address range for SSH access (e.g., 203.0.113.0/24)'
    Default: '0.0.0.0/0'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR notation (e.g., 192.168.1.0/24)'
  
  InstanceType:
    Type: String
    Description: 'EC2 Instance type for application servers'
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    ConstraintDescription: 'Must be a valid EC2 instance type'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access to instances'

Mappings:
  # Latest Amazon Linux 2 AMI IDs by region
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890  # Update with latest AL2 AMI ID
    us-west-2:
      AMI: ami-0abcdef1234567890  # Update with latest AL2 AMI ID

Resources:
  # ===== NETWORKING RESOURCES =====
  
  # Main VPC
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

  # Internet Gateway
  ProjectXInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: ProjectX-IGW
        - Key: Project
          Value: ProjectX

  # Attach Internet Gateway to VPC
  ProjectXIGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProjectXVPC
      InternetGatewayId: !Ref ProjectXInternetGateway

  # Public Subnet 1 (AZ a)
  ProjectXPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProjectX-Public-Subnet-1
        - Key: Project
          Value: ProjectX
        - Key: Type
          Value: Public

  # Public Subnet 2 (AZ b)
  ProjectXPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProjectX-Public-Subnet-2
        - Key: Project
          Value: ProjectX
        - Key: Type
          Value: Public

  # Private Subnet 1 (AZ a)
  ProjectXPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: ProjectX-Private-Subnet-1
        - Key: Project
          Value: ProjectX
        - Key: Type
          Value: Private

  # Private Subnet 2 (AZ b)
  ProjectXPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProjectXVPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: ProjectX-Private-Subnet-2
        - Key: Project
          Value: ProjectX
        - Key: Type
          Value: Private

  # Elastic IP for NAT Gateway
  ProjectXNATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: ProjectXIGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: ProjectX-NAT-EIP
        - Key: Project
          Value: ProjectX

  # NAT Gateway in Public Subnet 1
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

  # Public Route Table
  ProjectXPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProjectXVPC
      Tags:
        - Key: Name
          Value: ProjectX-Public-RT
        - Key: Project
          Value: ProjectX

  # Route to Internet Gateway for public subnets
  ProjectXPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProjectXIGWAttachment
    Properties:
      RouteTableId: !Ref ProjectXPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ProjectXInternetGateway

  # Associate Public Subnet 1 with Public Route Table
  ProjectXPublicSubnet1Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProjectXPublicSubnet1
      RouteTableId: !Ref ProjectXPublicRouteTable

  # Associate Public Subnet 2 with Public Route Table
  ProjectXPublicSubnet2Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProjectXPublicSubnet2
      RouteTableId: !Ref ProjectXPublicRouteTable

  # Private Route Table
  ProjectXPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProjectXVPC
      Tags:
        - Key: Name
          Value: ProjectX-Private-RT
        - Key: Project
          Value: ProjectX

  # Route to NAT Gateway for private subnets
  ProjectXPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProjectXPrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref ProjectXNATGateway

  # Associate Private Subnet 1 with Private Route Table
  ProjectXPrivateSubnet1Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProjectXPrivateSubnet1
      RouteTableId: !Ref ProjectXPrivateRouteTable

  # Associate Private Subnet 2 with Private Route Table
  ProjectXPrivateSubnet2Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProjectXPrivateSubnet2
      RouteTableId: !Ref ProjectXPrivateRouteTable

  # ===== SECURITY GROUPS =====

  # Security Group for EC2 instances in private subnets
  ProjectXPrivateInstanceSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: ProjectX-Private-Instance-SG
      GroupDescription: 'Security group for ProjectX private instances - SSH from office only'
      VpcId: !Ref ProjectXVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref OfficeIPCIDR
          Description: 'SSH access from office'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ProjectXBastionSG
          Description: 'HTTP access from bastion'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ProjectXBastionSG
          Description: 'HTTPS access from bastion'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: ProjectX-Private-Instance-SG
        - Key: Project
          Value: ProjectX

  # Security Group for Bastion Host (optional - for SSH access)
  ProjectXBastionSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: ProjectX-Bastion-SG
      GroupDescription: 'Security group for ProjectX bastion host'
      VpcId: !Ref ProjectXVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref OfficeIPCIDR
          Description: 'SSH access from office'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: ProjectX-Bastion-SG
        - Key: Project
          Value: ProjectX

  # ===== EC2 INSTANCES =====

  # EC2 Instance in Private Subnet 1
  ProjectXPrivateInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref ProjectXPrivateSubnet1
      SecurityGroupIds:
        - !Ref ProjectXPrivateInstanceSG
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>ProjectX Server 1 - Private Subnet</h1>" > /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
      Tags:
        - Key: Name
          Value: ProjectX-Private-Instance-1
        - Key: Project
          Value: ProjectX
        - Key: Environment
          Value: Development

  # EC2 Instance in Private Subnet 2
  ProjectXPrivateInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref ProjectXPrivateSubnet2
      SecurityGroupIds:
        - !Ref ProjectXPrivateInstanceSG
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>ProjectX Server 2 - Private Subnet</h1>" > /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
      Tags:
        - Key: Name
          Value: ProjectX-Private-Instance-2
        - Key: Project
          Value: ProjectX
        - Key: Environment
          Value: Development

  # Optional Bastion Host in Public Subnet
  ProjectXBastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      SubnetId: !Ref ProjectXPublicSubnet1
      SecurityGroupIds:
        - !Ref ProjectXBastionSG
      Tags:
        - Key: Name
          Value: ProjectX-Bastion-Host
        - Key: Project
          Value: ProjectX
        - Key: Environment
          Value: Development

# ===== OUTPUTS =====
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

  NATGatewayEIP:
    Description: 'Elastic IP address of the NAT Gateway'
    Value: !Ref ProjectXNATGatewayEIP

  BastionHostPublicIP:
    Description: 'Public IP address of the Bastion Host'
    Value: !GetAtt ProjectXBastionHost.PublicIp

  PrivateInstance1Id:
    Description: 'Instance ID of Private Instance 1'
    Value: !Ref ProjectXPrivateInstance1

  PrivateInstance2Id:
    Description: 'Instance ID of Private Instance 2'
    Value: !Ref ProjectXPrivateInstance2

  PrivateInstanceSecurityGroup:
    Description: 'Security Group ID for private instances'
    Value: !Ref ProjectXPrivateInstanceSG
    Export:
      Name: !Sub '${AWS::StackName}-Private-SG-ID'
```

## Key Outputs Explanation

The template provides these useful outputs:

- **VPC and Subnet IDs**: For referencing in other stacks or manual resource creation
- **NAT Gateway EIP**: The static IP address for outbound traffic from private subnets
- **Bastion Host Public IP**: For SSH access to manage private instances
- **Instance IDs**: For monitoring and management
- **Security Group ID**: For adding additional rules or referencing in other resources

## Quick Deployment Notes

### Prerequisites
1. **Update AMI ID**: Replace the placeholder AMI ID in the RegionMap with the latest Amazon Linux 2 AMI ID for your region
2. **Create EC2 Key Pair**: Ensure you have an EC2 key pair created in the target region

### Deployment Commands
```bash
# Validate template
aws cloudformation validate-template --template-body file://projectx-infrastructure.yaml

# Deploy stack
aws cloudformation create-stack \
  --stack-name projectx-infrastructure \
  --template-body file://projectx-infrastructure.yaml \
  --parameters ParameterKey=OfficeIPCIDR,ParameterValue="YOUR_OFFICE_IP/32" \
               ParameterKey=KeyPairName,ParameterValue="your-key-pair-name" \
               ParameterKey=InstanceType,ParameterValue="t3.micro"

# Monitor deployment
aws cloudformation describe-stacks --stack-name projectx-infrastructure
```

### Post-Deployment
- **SSH Access**: Use the bastion host to access private instances
- **Cost Optimization**: The NAT Gateway incurs hourly charges (~$45/month)
- **Security**: Update the OfficeIPCIDR parameter with your actual office IP range
- **Scaling**: Additional instances can be added to the private subnets using the existing security group

This template provides a solid foundation that can be easily modified and extended as the project grows!