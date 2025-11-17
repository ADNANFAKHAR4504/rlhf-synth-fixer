# VPC Migration Infrastructure - Production-Ready CloudFormation Template

Complete CloudFormation template for VPC migration with all requirements properly implemented.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Production VPC Migration Infrastructure for Account Consolidation

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix to append to all resource names for environment isolation
    Default: prod
    MinLength: 1
    MaxLength: 20

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.1.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub vpc-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub igw-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.1.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub public-subnet-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Tier
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.1.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub public-subnet-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Tier
          Value: Public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.1.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub public-subnet-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Tier
          Value: Public

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.1.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub private-subnet-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Tier
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.1.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub private-subnet-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Tier
          Value: Private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.1.13.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub private-subnet-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Tier
          Value: Private

  # Elastic IPs for NAT Gateways
  NATGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub nat-eip-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGatewayEIP2:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub nat-eip-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGatewayEIP3:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub nat-eip-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateways
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub nat-gateway-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub nat-gateway-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP3.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub nat-gateway-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub public-rt-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables (one per AZ)
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub private-rt-1-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub private-rt-2-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub private-rt-3-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  PrivateSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # VPC Endpoints
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub com.amazonaws.${AWS::Region}.s3
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
        - !Ref PrivateRouteTable3

  DynamoDBEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub com.amazonaws.${AWS::Region}.dynamodb
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
        - !Ref PrivateRouteTable3

  # Security Groups
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub web-sg-${EnvironmentSuffix}
      GroupDescription: Security group for web tier - allows HTTP and HTTPS
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub web-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Tier
          Value: Web

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub db-sg-${EnvironmentSuffix}
      GroupDescription: Security group for database tier - allows PostgreSQL from web tier
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: Allow PostgreSQL from web tier
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub db-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Tier
          Value: Database

  # Network ACL
  NetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub nacl-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Network ACL Inbound Rules
  NetworkAclInboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 80
        To: 80

  NetworkAclInboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  NetworkAclInboundPostgreSQL:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      CidrBlock: 10.1.0.0/16
      PortRange:
        From: 5432
        To: 5432

  NetworkAclInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 130
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Network ACL Outbound Rules
  NetworkAclOutboundHTTP:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 100
      Protocol: 6
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 80
        To: 80

  NetworkAclOutboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 110
      Protocol: 6
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  NetworkAclOutboundPostgreSQL:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 120
      Protocol: 6
      Egress: true
      RuleAction: allow
      CidrBlock: 10.1.0.0/16
      PortRange:
        From: 5432
        To: 5432

  NetworkAclOutboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref NetworkAcl
      RuleNumber: 130
      Protocol: 6
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Subnet Network ACL Associations
  PublicSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref NetworkAcl

  PublicSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref NetworkAcl

  PublicSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      NetworkAclId: !Ref NetworkAcl

  PrivateSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref NetworkAcl

  PrivateSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref NetworkAcl

  PrivateSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      NetworkAclId: !Ref NetworkAcl

  # S3 Bucket for VPC Flow Logs
  FlowLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub vpc-flow-logs-${EnvironmentSuffix}-${AWS::AccountId}
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub flow-logs-bucket-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # S3 Bucket Policy for VPC Flow Logs
  FlowLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FlowLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub ${FlowLogsBucket.Arn}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt FlowLogsBucket.Arn

  # VPC Flow Logs
  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: s3
      LogDestination: !GetAtt FlowLogsBucket.Arn
      Tags:
        - Key: Name
          Value: !Sub vpc-flow-log-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentSuffix}-VPCId

  VPCCidr:
    Description: VPC CIDR Block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub ${EnvironmentSuffix}-VPCCidr

  PublicSubnet1Id:
    Description: Public Subnet 1 ID in AZ1
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub ${EnvironmentSuffix}-PublicSubnet1Id

  PublicSubnet2Id:
    Description: Public Subnet 2 ID in AZ2
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub ${EnvironmentSuffix}-PublicSubnet2Id

  PublicSubnet3Id:
    Description: Public Subnet 3 ID in AZ3
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub ${EnvironmentSuffix}-PublicSubnet3Id

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID in AZ1
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub ${EnvironmentSuffix}-PrivateSubnet1Id

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID in AZ2
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub ${EnvironmentSuffix}-PrivateSubnet2Id

  PrivateSubnet3Id:
    Description: Private Subnet 3 ID in AZ3
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub ${EnvironmentSuffix}-PrivateSubnet3Id

  WebSecurityGroupId:
    Description: Web Security Group ID
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub ${EnvironmentSuffix}-WebSecurityGroupId

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub ${EnvironmentSuffix}-DatabaseSecurityGroupId

  PublicRouteTableId:
    Description: Public Route Table ID
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub ${EnvironmentSuffix}-PublicRouteTableId

  PrivateRouteTable1Id:
    Description: Private Route Table 1 ID
    Value: !Ref PrivateRouteTable1
    Export:
      Name: !Sub ${EnvironmentSuffix}-PrivateRouteTable1Id

  PrivateRouteTable2Id:
    Description: Private Route Table 2 ID
    Value: !Ref PrivateRouteTable2
    Export:
      Name: !Sub ${EnvironmentSuffix}-PrivateRouteTable2Id

  PrivateRouteTable3Id:
    Description: Private Route Table 3 ID
    Value: !Ref PrivateRouteTable3
    Export:
      Name: !Sub ${EnvironmentSuffix}-PrivateRouteTable3Id

  NATGateway1Id:
    Description: NAT Gateway 1 ID
    Value: !Ref NATGateway1
    Export:
      Name: !Sub ${EnvironmentSuffix}-NATGateway1Id

  NATGateway2Id:
    Description: NAT Gateway 2 ID
    Value: !Ref NATGateway2
    Export:
      Name: !Sub ${EnvironmentSuffix}-NATGateway2Id

  NATGateway3Id:
    Description: NAT Gateway 3 ID
    Value: !Ref NATGateway3
    Export:
      Name: !Sub ${EnvironmentSuffix}-NATGateway3Id

  FlowLogsBucketName:
    Description: S3 Bucket Name for VPC Flow Logs
    Value: !Ref FlowLogsBucket
    Export:
      Name: !Sub ${EnvironmentSuffix}-FlowLogsBucketName

  FlowLogsBucketArn:
    Description: S3 Bucket ARN for VPC Flow Logs
    Value: !GetAtt FlowLogsBucket.Arn
    Export:
      Name: !Sub ${EnvironmentSuffix}-FlowLogsBucketArn

  S3EndpointId:
    Description: S3 VPC Endpoint ID
    Value: !Ref S3Endpoint
    Export:
      Name: !Sub ${EnvironmentSuffix}-S3EndpointId

  DynamoDBEndpointId:
    Description: DynamoDB VPC Endpoint ID
    Value: !Ref DynamoDBEndpoint
    Export:
      Name: !Sub ${EnvironmentSuffix}-DynamoDBEndpointId
```

## Implementation Details

### Core VPC Infrastructure
- **VPC**: 10.1.0.0/16 CIDR block with DNS support enabled
- **Subnets**: 3 public (10.1.1-3.0/24) and 3 private (10.1.11-13.0/24) across 3 AZs
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: 3 NAT Gateways (one per AZ) for high availability

### Routing Configuration
- **Public Route Table**: Single table routing all public subnets to Internet Gateway
- **Private Route Tables**: 3 separate route tables (one per AZ), each routing to its respective NAT Gateway
- This design ensures high availability and eliminates cross-AZ data transfer charges

### VPC Endpoints
- **S3 Gateway Endpoint**: Private S3 access without NAT Gateway
- **DynamoDB Gateway Endpoint**: Private DynamoDB access without NAT Gateway
- Both endpoints associated with all 3 private route tables

### Security Configuration
- **Web Security Group**: Allows inbound HTTP (80) and HTTPS (443) from anywhere
- **Database Security Group**: Allows inbound PostgreSQL (5432) only from Web Security Group
- **Network ACLs**: Configured with proper rule numbers for HTTP, HTTPS, PostgreSQL, and ephemeral ports

### VPC Flow Logs
- **S3 Bucket**: Encrypted bucket with 90-day retention policy
- **Bucket Policy**: Grants AWS Log Delivery service necessary permissions
- **Flow Log**: Captures ALL traffic (ACCEPT and REJECT) for compliance

### Resource Naming
- All resources use `!Sub` with `${EnvironmentSuffix}` parameter for environment isolation
- Naming convention: `{resource-type}-{environment-suffix}`
- Environment tags applied consistently across all resources

### Key Technical Decisions
1. **NAT Gateway per AZ**: Ensures high availability and redundancy
2. **Separate Private Route Tables**: Each AZ routes to its own NAT Gateway
3. **Gateway Endpoints**: Reduces costs and latency for S3 and DynamoDB access
4. **Parameter Constraints**: MinLength and MaxLength enforce valid environmentSuffix values
5. **Proper Dependencies**: DependsOn ensures EIPs created after Internet Gateway attachment
6. **Correct Resource Type**: `AWS::EC2::NatGateway` (lowercase 'nat') is critical for CloudFormation validation
7. **VPC Flow Log Property**: Uses `ResourceId` (singular) not `ResourceIds` (array) for single VPC resource
