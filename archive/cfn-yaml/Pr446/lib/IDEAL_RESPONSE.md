# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentType
    ParameterLabels:
      EnvironmentType:
        default: "Environment Type"

Parameters:
  EnvironmentType:
    Type: String
    Description: 'Environment Type for resource naming (e.g., dev, staging, prod)'
    Default: 'dev'
    AllowedValues:
      - dev
      - stage
      - prod
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
  # DynamoDB Table: TurnAroundPromptTable for storing prompt data
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'TurnAroundPromptTable${EnvironmentType}'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'

  # VPC: Virtual Private Cloud provides network isolation for each environment
  # The CIDR block is dynamically selected based on the EnvironmentType parameter
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-VPC'  # Dynamic naming: dev-VPC, stage-VPC, prod-VPC
        - Key: Environment
          Value: !Ref EnvironmentType  # Environment tag for resource identification and billing

  # Internet Gateway: Enables internet access for resources in public subnets
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentType

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
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvironmentType, SubnetCidr]
      MapPublicIpOnLaunch: true  # Auto-assign public IPs to instances
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-PublicSubnet'
        - Key: Environment
          Value: !Ref EnvironmentType

  # Route Table: Defines routing rules for the public subnet
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-PublicRouteTable'
        - Key: Environment
          Value: !Ref EnvironmentType

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
      GroupName: !Sub '${EnvironmentType}-InstanceSG'
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
          Value: !Sub '${EnvironmentType}-InstanceSG'
        - Key: Environment
          Value: !Ref EnvironmentType

  # EC2 Instance: The main compute resource deployed in each environment
  # Uses t3.micro for consistency across all environments
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'  # Latest Amazon Linux 2
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
          echo "<h1>Hello from ${EnvironmentType} environment!</h1>" > /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-EC2Instance'
        - Key: Environment
          Value: !Ref EnvironmentType

# Outputs section exports important resource identifiers for use by other stacks or external tools
# The output names include the environment for clarity when managing multiple environments
Outputs:
  # DynamoDB Table outputs
  TurnAroundPromptTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableName'

  TurnAroundPromptTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentType:
    Description: 'Environment Type used for this deployment'
    Value: !Ref EnvironmentType
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentType'

  # VPC ID output with environment-specific logical ID
  VpcId:
    Description: 'ID of the VPC created for this environment'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'  # Export name includes environment for uniqueness

  # EC2 Instance ID output with environment-specific logical ID
  InstanceId:
    Description: 'ID of the EC2 instance created for this environment'
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-InstanceId'  # Export name includes environment for uniqueness

  # Additional useful outputs for network configuration
  PublicSubnetId:
    Description: 'ID of the public subnet created for this environment'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetId'

  InstancePublicIp:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt EC2Instance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-InstancePublicIp'

  WebsiteUrl:
    Description: 'URL to access the web server running on the instance'
    Value: !Sub 'http://${EC2Instance.PublicIp}'
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteUrl'

```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
