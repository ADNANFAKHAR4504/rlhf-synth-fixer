# Multi-Environment CloudFormation Template

Here's a comprehensive, reusable CloudFormation template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-environment infrastructure template for dev, stage, and prod environments with strict isolation'

# Parameters section defines the input variables for the template
# The Environment parameter is the single control point for all environment-specific configurations
Parameters:
  Environment:
    Type: String
    Description: 'Environment name that determines all resource configurations and naming'
    AllowedValues:
      - dev
      - stage
      - prod
    Default: dev
    ConstraintDescription: 'Must be one of: dev, stage, or prod'

# Mappings section provides static lookup tables for environment-specific values
# This approach ensures consistency and makes it easy to modify environment configurations
Mappings:
  # Environment-specific CIDR blocks for VPC isolation
  # Each environment gets a unique /16 network to prevent any IP conflicts
  EnvironmentConfig:
    dev:
      VpcCidr: '10.1.0.0/16'
      SubnetCidr: '10.1.1.0/24'  # First /24 subnet within the VPC
    stage:
      VpcCidr: '10.2.0.0/16'
      SubnetCidr: '10.2.1.0/24'  # First /24 subnet within the VPC
    prod:
      VpcCidr: '10.3.0.0/16'
      SubnetCidr: '10.3.1.0/24'  # First /24 subnet within the VPC

# Resources section defines the actual AWS infrastructure components
Resources:
  # VPC: Virtual Private Cloud provides network isolation for each environment
  # The CIDR block is dynamically selected based on the Environment parameter
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-VPC'  # Dynamic naming: dev-VPC, stage-VPC, prod-VPC
        - Key: Environment
          Value: !Ref Environment  # Environment tag for resource identification and billing

  # Internet Gateway: Enables internet access for resources in public subnets
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-IGW'
        - Key: Environment
          Value: !Ref Environment

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet: Hosts resources that need direct internet access
  # CIDR is environment-specific and derived from the mappings
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']  # Use first AZ in the region
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, SubnetCidr]
      MapPublicIpOnLaunch: true  # Auto-assign public IPs to instances
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-PublicSubnet'
        - Key: Environment
          Value: !Ref Environment

  # Route Table: Defines routing rules for the public subnet
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-PublicRouteTable'
        - Key: Environment
          Value: !Ref Environment

  # Default Route: Routes internet traffic through the Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate the route table with the public subnet
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  # Security Group: Controls inbound and outbound traffic for EC2 instances
  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-InstanceSG'
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'  # SSH access (consider restricting in production)
          Description: 'SSH access'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'  # HTTP access
          Description: 'HTTP access'
      SecurityGroupEgress:
        - IpProtocol: -1  # All protocols
          CidrIp: '0.0.0.0/0'  # All destinations
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-InstanceSG'
        - Key: Environment
          Value: !Ref Environment

  # EC2 Instance: The main compute resource deployed in each environment
  # Uses t3.micro for consistency across all environments
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'  # Latest Amazon Linux 2
      InstanceType: t3.micro  # Consistent instance type across environments
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref InstanceSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Hello from ${Environment} environment!</h1>" > /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-EC2Instance'
        - Key: Environment
          Value: !Ref Environment

# Outputs section exports important resource identifiers for use by other stacks or external tools
# The output names include the environment for clarity when managing multiple environments
Outputs:
  # VPC ID output with environment-specific logical ID
  VpcId:
    Description: 'ID of the VPC created for this environment'
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-VpcId'  # Export name includes environment for uniqueness

  # EC2 Instance ID output with environment-specific logical ID
  InstanceId:
    Description: 'ID of the EC2 instance created for this environment'
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${Environment}-InstanceId'  # Export name includes environment for uniqueness

  # Additional useful outputs for network configuration
  PublicSubnetId:
    Description: 'ID of the public subnet created for this environment'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${Environment}-PublicSubnetId'

  InstancePublicIp:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt EC2Instance.PublicIp
    Export:
      Name: !Sub '${Environment}-InstancePublicIp'

  WebsiteUrl:
    Description: 'URL to access the web server running on the instance'
    Value: !Sub 'http://${EC2Instance.PublicIp}'
    Export:
      Name: !Sub '${Environment}-WebsiteUrl'
```

## Key Features and Design Decisions

### 🎯 **Parameter-Driven Architecture**
- **Single Control Point**: The `Environment` parameter is the only input needed to deploy across different environments
- **Validation**: Uses `AllowedValues` to ensure only valid environments can be specified
- **Default Value**: Includes a sensible default (`dev`) for ease of use

### 🗺️ **Mappings for Environment Isolation**
- **CIDR Isolation**: Each environment gets a unique `/16` network block to prevent IP conflicts
- **Subnet Allocation**: Uses the first `/24` subnet within each VPC for consistency
- **Scalable Design**: Easy to add new environments or modify existing configurations

### 🏷️ **Comprehensive Tagging Strategy**
- **Dynamic Naming**: All resources use `!Sub '${Environment}-ResourceType'` pattern
- **Environment Tags**: Every resource includes an `Environment` tag for billing and management
- **Consistent Conventions**: Follows AWS best practices for resource naming

### 🔒 **Security Considerations**
- **Security Groups**: Includes basic HTTP and SSH access (consider restricting SSH in production)
- **Public Subnet**: Configured with auto-assign public IP for internet access
- **Egress Rules**: Allows all outbound traffic (can be restricted based on requirements)

### 📤 **Rich Outputs**
- **Cross-Stack References**: Exports can be imported by other CloudFormation stacks
- **Environment-Specific Names**: All exports include the environment name for uniqueness
- **Practical Information**: Includes web URL and public IP for immediate use

## Deployment Examples

```bash
# Deploy to development environment
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name dev-infrastructure \
  --parameter-overrides Environment=dev

# Deploy to production environment
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name prod-infrastructure \
  --parameter-overrides Environment=prod
```

This template provides complete environment isolation while maintaining consistency and reusability across all deployment targets.