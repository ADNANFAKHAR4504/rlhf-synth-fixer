### Reasoning Trace
---

This is a comprehensive request for a PCI DSS compliant CloudFormation template. Let me break down the requirements:

1. General requirements:
- YAML format
- Use intrinsic functions
- All values parameterized
- Cross-account executable
- No hardcoded ARNs, Account IDs, Region names

2. VPC Architecture:
- VPC with 10.0.0.0/16 CIDR
- 3 AZs using !GetAZs and !Select
- DNS Hostnames and Resolution enabled

3. Subnets (3 tiers across 3 AZs = 9 subnets total):
- Public: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Private: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- Database: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24

4. Networking:
- Internet Gateway
- NAT Gateway (one per public subnet)
- Elastic IPs for NAT Gateways
- Route tables for each tier

5. Security Groups:
- Web tier: HTTPS (443) from Internet
- App tier: 8080 from Web tier
- DB tier: 5432 from App tier

6. Monitoring:
- VPC Flow Logs to CloudWatch
- IAM Role for Flow Logs
- 1 minute aggregation

7. VPC Endpoints:
- S3 Gateway Endpoint
- Interface endpoints for SSM, EC2 Messages, SSM Messages

8. Tagging:
- Environment, CostCenter, Compliance tags on all resources

9. Outputs:
- Export key resources for cross-stack references

Let me create a comprehensive CloudFormation template that meets all these requirements.
### Answer 
---

# PCI DSS Compliant Multi-AZ VPC CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Multi-AZ VPC Infrastructure for PCI DSS Compliant Payment Processing Environment'

# ===================================
# Parameters
# ===================================
Parameters:
  # Network Configuration
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for Public Subnet 1'
    
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for Public Subnet 2'
    
  PublicSubnet3Cidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for Public Subnet 3'
    
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.11.0/24'
    Description: 'CIDR block for Private Subnet 1'
    
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.12.0/24'
    Description: 'CIDR block for Private Subnet 2'
    
  PrivateSubnet3Cidr:
    Type: String
    Default: '10.0.13.0/24'
    Description: 'CIDR block for Private Subnet 3'
    
  DatabaseSubnet1Cidr:
    Type: String
    Default: '10.0.21.0/24'
    Description: 'CIDR block for Database Subnet 1'
    
  DatabaseSubnet2Cidr:
    Type: String
    Default: '10.0.22.0/24'
    Description: 'CIDR block for Database Subnet 2'
    
  DatabaseSubnet3Cidr:
    Type: String
    Default: '10.0.23.0/24'
    Description: 'CIDR block for Database Subnet 3'
  
  # Tag Configuration
  Environment:
    Type: String
    Default: 'Production'
    Description: 'Environment name for tagging'
    AllowedValues:
      - Development
      - Staging
      - Production
      
  CostCenter:
    Type: String
    Default: 'PaymentProcessing'
    Description: 'Cost center for billing allocation'
    
  ComplianceScope:
    Type: String
    Default: 'PCI-DSS'
    Description: 'Compliance framework identifier'

  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments'
    Default: "dev"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

# ===================================
# Resources
# ===================================
Resources:
  # ===================================
  # VPC Configuration
  # ===================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # ===================================
  # Internet Gateway
  # ===================================
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # ===================================
  # Public Subnets (for NAT Gateways)
  # ===================================
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1'
        - Key: Tier
          Value: 'Public'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2'
        - Key: Tier
          Value: 'Public'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet3Cidr
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-3'
        - Key: Tier
          Value: 'Public'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # ===================================
  # Private Subnets (Application Tier)
  # ===================================
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1'
        - Key: Tier
          Value: 'Application'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2'
        - Key: Tier
          Value: 'Application'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet3Cidr
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-3'
        - Key: Tier
          Value: 'Application'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # ===================================
  # Database Subnets (Data Tier)
  # ===================================
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DatabaseSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-database-subnet-1'
        - Key: Tier
          Value: 'Database'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DatabaseSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-database-subnet-2'
        - Key: Tier
          Value: 'Database'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  DatabaseSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref DatabaseSubnet3Cidr
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-database-subnet-3'
        - Key: Tier
          Value: 'Database'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # ===================================
  # Elastic IPs for NAT Gateways
  # ===================================
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-1-eip'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-2-eip'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-3-eip'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # ===================================
  # NAT Gateways
  # ===================================
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-3'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # ===================================
  # Route Tables
  # ===================================
  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-route-table'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  # Private Route Tables (one per AZ for high availability)
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-route-table-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-route-table-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-route-table-3'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  # Database Route Table (no internet access)
  DatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-database-route-table'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable
      SubnetId: !Ref DatabaseSubnet1

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable
      SubnetId: !Ref DatabaseSubnet2

  DatabaseSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable
      SubnetId: !Ref DatabaseSubnet3

  # ===================================
  # Security Groups
  # ===================================
  # Web Tier Security Group
  WebTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-tier-sg'
      GroupDescription: 'Security group for Web tier - allows HTTPS from Internet'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS from Internet'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          CidrIp: !Ref VpcCidr
          Description: 'Allow traffic to App tier'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS to Internet for external API calls'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-web-tier-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # App Tier Security Group
  AppTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-app-tier-sg'
      GroupDescription: 'Security group for App tier - allows traffic from Web tier'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          CidrIp: !Ref PublicSubnet1Cidr
          Description: 'Allow traffic from Public Subnet 1'
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          CidrIp: !Ref PublicSubnet2Cidr
          Description: 'Allow traffic from Public Subnet 2'
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          CidrIp: !Ref PublicSubnet3Cidr
          Description: 'Allow traffic from Public Subnet 3'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref VpcCidr
          Description: 'Allow PostgreSQL to Database tier'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref VpcCidr
          Description: 'Allow HTTPS within VPC for AWS services'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-app-tier-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # DB Tier Security Group
  DBTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-tier-sg'
      GroupDescription: 'Security group for Database tier - allows PostgreSQL from App tier'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref PrivateSubnet1Cidr
          Description: 'Allow PostgreSQL from Private Subnet 1'
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref PrivateSubnet2Cidr
          Description: 'Allow PostgreSQL from Private Subnet 2'
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: !Ref PrivateSubnet3Cidr
          Description: 'Allow PostgreSQL from Private Subnet 3'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '127.0.0.1/32'
          Description: 'Deny all outbound traffic (loopback only)'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-tier-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # VPC Endpoint Security Group
  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-endpoint-sg'
      GroupDescription: 'Security group for VPC Endpoints'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref VpcCidr
          Description: 'Allow HTTPS from VPC CIDR'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-endpoint-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # ===================================
  # VPC Flow Logs
  # ===================================
  # IAM Role for VPC Flow Logs
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - vpc-flow-logs.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      Path: /
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-flow-log-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # CloudWatch Log Group for VPC Flow Logs
  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}'
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-flow-log-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # VPC Flow Log
  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      ResourceId: !Ref VPC
      ResourceType: 'VPC'
      TrafficType: ALL
      MaxAggregationInterval: 60
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-flow-log'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Compliance
          Value: !Ref ComplianceScope

  # ===================================
  # VPC Endpoints
  # ===================================
  # S3 Gateway Endpoint
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
        - !Ref PrivateRouteTable3
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:*'
            Resource:
              - '*'

  # SSM Interface Endpoint
  SSMEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssm'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  # EC2 Messages Interface Endpoint
  EC2MessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2messages'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

  # SSM Messages Interface Endpoint
  SSMMessagesEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ssmmessages'
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref VPCEndpointSecurityGroup

# ===================================
# Outputs
# ===================================
Outputs:
  # VPC Outputs
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-VPC-ID'

  VPCCidr:
    Description: 'VPC CIDR Block'
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-VPC-CIDR'

  # Public Subnet Outputs
  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Public-Subnet-1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Public-Subnet-2-ID'

  PublicSubnet3Id:
    Description: 'Public Subnet 3 ID'
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Public-Subnet-3-ID'

  # Private Subnet Outputs
  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Private-Subnet-1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Private-Subnet-2-ID'

  PrivateSubnet3Id:
    Description: 'Private Subnet 3 ID'
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Private-Subnet-3-ID'

  # Database Subnet Outputs
  DatabaseSubnet1Id:
    Description: 'Database Subnet 1 ID'
    Value: !Ref DatabaseSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Database-Subnet-1-ID'

  DatabaseSubnet2Id:
    Description: 'Database Subnet 2 ID'
    Value: !Ref DatabaseSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Database-Subnet-2-ID'

  DatabaseSubnet3Id:
    Description: 'Database Subnet 3 ID'
    Value: !Ref DatabaseSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Database-Subnet-3-ID'

  # Security Group Outputs
  WebTierSecurityGroupId:
    Description: 'Web Tier Security Group ID'
    Value: !Ref WebTierSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Web-Tier-SG-ID'

  AppTierSecurityGroupId:
    Description: 'App Tier Security Group ID'
    Value: !Ref AppTierSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-App-Tier-SG-ID'

  DBTierSecurityGroupId:
    Description: 'Database Tier Security Group ID'
    Value: !Ref DBTierSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-DB-Tier-SG-ID'

  # NAT Gateway Outputs
  NatGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-NAT-Gateway-1-ID'

  NatGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NatGateway2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-NAT-Gateway-2-ID'

  NatGateway3Id:
    Description: 'NAT Gateway 3 ID'
    Value: !Ref NatGateway3
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-NAT-Gateway-3-ID'

  # Route Table Outputs
  PublicRouteTableId:
    Description: 'Public Route Table ID'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Public-Route-Table-ID'

  PrivateRouteTable1Id:
    Description: 'Private Route Table 1 ID'
    Value: !Ref PrivateRouteTable1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Private-Route-Table-1-ID'

  PrivateRouteTable2Id:
    Description: 'Private Route Table 2 ID'
    Value: !Ref PrivateRouteTable2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Private-Route-Table-2-ID'

  PrivateRouteTable3Id:
    Description: 'Private Route Table 3 ID'
    Value: !Ref PrivateRouteTable3
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Private-Route-Table-3-ID'

  DatabaseRouteTableId:
    Description: 'Database Route Table ID'
    Value: !Ref DatabaseRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Database-Route-Table-ID'

  # Internet Gateway Outputs
  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-Internet-Gateway-ID'

  # Elastic IP Outputs
  NatGateway1EIP:
    Description: 'NAT Gateway 1 Elastic IP'
    Value: !Ref NatGateway1EIP
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-NAT-Gateway-1-EIP'

  NatGateway2EIP:
    Description: 'NAT Gateway 2 Elastic IP'
    Value: !Ref NatGateway2EIP
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-NAT-Gateway-2-EIP'

  NatGateway3EIP:
    Description: 'NAT Gateway 3 Elastic IP'
    Value: !Ref NatGateway3EIP
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-NAT-Gateway-3-EIP'

  # VPC Endpoint Security Group Output
  VPCEndpointSecurityGroupId:
    Description: 'VPC Endpoint Security Group ID'
    Value: !Ref VPCEndpointSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-VPC-Endpoint-SG-ID'

  # VPC Flow Log Outputs
  VPCFlowLogRoleArn:
    Description: 'VPC Flow Log IAM Role ARN'
    Value: !GetAtt VPCFlowLogRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-VPC-Flow-Log-Role-ARN'

  # VPC Endpoint Outputs
  S3EndpointId:
    Description: 'S3 VPC Endpoint ID'
    Value: !Ref S3Endpoint
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-S3-Endpoint-ID'

  SSMEndpointId:
    Description: 'SSM VPC Endpoint ID'
    Value: !Ref SSMEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-SSM-Endpoint-ID'