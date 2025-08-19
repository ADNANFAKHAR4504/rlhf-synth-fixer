# High-Availability AWS Network CloudFormation Template

I'll create a comprehensive CloudFormation template that builds a resilient, multi-AZ network infrastructure following AWS best practices. Here's the complete solution:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'High-Availability Multi-AZ Network Infrastructure with Public/Private Subnets, NAT Gateways, and Security Groups'

Parameters:
  SSHAllowedCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access to private subnets'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

Resources:
  # VPC - Main Network
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'HA-Production-VPC'
        - Key: Environment
          Value: 'Production'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'HA-Production-IGW'
        - Key: Environment
          Value: 'Production'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet in AZ 1 (us-west-2a)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2a'
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'HA-Production-Public-Subnet-AZ1'
        - Key: Environment
          Value: 'Production'
        - Key: Type
          Value: 'Public'

  # Public Subnet in AZ 2 (us-west-2b)
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2b'
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'HA-Production-Public-Subnet-AZ2'
        - Key: Environment
          Value: 'Production'
        - Key: Type
          Value: 'Public'

  # Private Subnet in AZ 1 (us-west-2a)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2a'
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: 'HA-Production-Private-Subnet-AZ1'
        - Key: Environment
          Value: 'Production'
        - Key: Type
          Value: 'Private'

  # Private Subnet in AZ 2 (us-west-2b)
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: 'us-west-2b'
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: 'HA-Production-Private-Subnet-AZ2'
        - Key: Environment
          Value: 'Production'
        - Key: Type
          Value: 'Private'

  # Elastic IP for NAT Gateway 1
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'HA-Production-NAT-EIP-AZ1'
        - Key: Environment
          Value: 'Production'

  # Elastic IP for NAT Gateway 2
  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'HA-Production-NAT-EIP-AZ2'
        - Key: Environment
          Value: 'Production'

  # NAT Gateway in Public Subnet 1
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: 'HA-Production-NAT-Gateway-AZ1'
        - Key: Environment
          Value: 'Production'

  # NAT Gateway in Public Subnet 2
  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: 'HA-Production-NAT-Gateway-AZ2'
        - Key: Environment
          Value: 'Production'

  # Route Table for Public Subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: 'HA-Production-Public-Route-Table'
        - Key: Environment
          Value: 'Production'

  # Default Route for Public Route Table
  DefaultPublicRoute:
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

  # Route Table for Private Subnet 1
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: 'HA-Production-Private-Route-Table-AZ1'
        - Key: Environment
          Value: 'Production'

  # Default Route for Private Route Table 1 (via NAT Gateway 1)
  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  # Associate Private Subnet 1 with Private Route Table 1
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  # Route Table for Private Subnet 2
  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: 'HA-Production-Private-Route-Table-AZ2'
        - Key: Environment
          Value: 'Production'

  # Default Route for Private Route Table 2 (via NAT Gateway 2)
  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  # Associate Private Subnet 2 with Private Route Table 2
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Group for Public Web Traffic (HTTP/HTTPS)
  PublicWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'HA-Production-Public-Web-SG'
      GroupDescription: 'Security group for public web traffic allowing HTTP and HTTPS'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: 'HA-Production-Public-Web-SG'
        - Key: Environment
          Value: 'Production'

  # Security Group for Private SSH Access
  PrivateSSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'HA-Production-Private-SSH-SG'
      GroupDescription: 'Security group for SSH access to private subnets from specific CIDR'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedCIDR
          Description: 'Allow SSH access from specified CIDR range'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: 'HA-Production-Private-SSH-SG'
        - Key: Environment
          Value: 'Production'

  # Network ACL for additional security layer
  NetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: 'HA-Production-Network-ACL'
        - Key: Environment
          Value: 'Production'

  # Inbound rule for HTTP traffic
  NetworkAclEntryInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      PortRange:
        From: 80
        To: 80
      CidrBlock: '0.0.0.0/0'

  # Inbound rule for HTTPS traffic
  NetworkAclEntryInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      PortRange:
        From: 443
        To: 443
      CidrBlock: '0.0.0.0/0'

  # Inbound rule for ephemeral ports (for return traffic)
  NetworkAclEntryInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      PortRange:
        From: 1024
        To: 65535
      CidrBlock: '0.0.0.0/0'

  # Outbound rule for all traffic
  NetworkAclEntryOutbound:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

Outputs:
  VPC:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1:
    Description: 'Public Subnet 1 ID (us-west-2a)'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2:
    Description: 'Public Subnet 2 ID (us-west-2b)'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1:
    Description: 'Private Subnet 1 ID (us-west-2a)'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2:
    Description: 'Private Subnet 2 ID (us-west-2b)'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  PublicWebSecurityGroup:
    Description: 'Security Group ID for public web traffic'
    Value: !Ref PublicWebSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-PublicWebSG-ID'

  PrivateSSHSecurityGroup:
    Description: 'Security Group ID for private SSH access'
    Value: !Ref PrivateSSHSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSSHSG-ID'

  NatGateway1:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway1-ID'

  NatGateway2:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NatGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway2-ID'
```

## Key Features and Architecture Explanation

### **High Availability Design**

- **Multi-AZ Setup**: Resources are distributed across `us-west-2a` and `us-west-2b` for fault tolerance
- **Redundant NAT Gateways**: Each AZ has its own NAT Gateway to eliminate single points of failure
- **Separate Route Tables**: Each private subnet has its own route table for independent routing

### **Network Segmentation**

- **Public Subnets** (`10.0.1.0/24`, `10.0.2.0/24`): Host internet-facing resources
- **Private Subnets** (`10.0.11.0/24`, `10.0.12.0/24`): Host internal resources with outbound internet access via NAT

### **Security Implementation**

- **Public Web Security Group**: Allows HTTP (80) and HTTPS (443) from anywhere
- **Private SSH Security Group**: Allows SSH (22) only from specified CIDR range (configurable parameter)
- **Network ACLs**: Additional security layer with explicit rules

### **Best Practices Implemented**

1. **Proper Tagging**: All resources tagged with `Environment: Production`
2. **DNS Resolution**: Enabled DNS hostnames and support
3. **Parameterization**: SSH access CIDR is configurable
4. **Resource Dependencies**: Proper dependency management with `DependsOn`
5. **Outputs**: All important resource IDs exported for cross-stack references

### **Deployment Instructions**

1. **Save the template** as `ha-network.yaml`

2. **Deploy using AWS CLI**:

```bash
aws cloudformation create-stack \
  --stack-name ha-production-network \
  --template-body file://ha-network.yaml \
  --parameters ParameterKey=SSHAllowedCIDR,ParameterValue=10.0.0.0/8 \
  --region us-west-2
```

3. **Or deploy via AWS Console**:
   - Navigate to CloudFormation in us-west-2
   - Create new stack with the template
   - Specify your allowed SSH CIDR range

This template creates a production-ready, highly available network infrastructure that can support web applications, databases, and other AWS services with proper security and redundancy.
