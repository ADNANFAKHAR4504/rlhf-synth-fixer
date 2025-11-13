# CloudFormation YAML Solution: Secure VPC Foundation

This CloudFormation template creates a production-ready VPC foundation with security-first design for a fintech payment processing platform.

## Architecture Overview

- VPC with DNS support enabled
- 3 public subnets and 3 private subnets across 3 availability zones
- Internet Gateway for public subnet internet access
- NAT Gateways in 2 AZs for private subnet outbound traffic
- VPC Flow Logs to S3 with lifecycle policies
- S3 Gateway Endpoint with policy restrictions
- Network ACLs with explicit deny rules for malicious IPs
- Comprehensive tagging for compliance and cost tracking

## File: TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure VPC Foundation for Fintech Payment Processing Platform - PCI DSS Compliant'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Unique suffix for resource naming to prevent conflicts'
    AllowedPattern: '[a-zA-Z0-9-]+'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^10\.([0-9]|[1-9][0-9]|[1-2][0-5][0-5])\.0\.0/16$'
    ConstraintDescription: 'Must be a /16 CIDR block from 10.0.0.0/8 range'

  ProjectName:
    Type: String
    Default: 'fintech-payment-platform'
    Description: 'Project name for tagging'

  EnvironmentName:
    Type: String
    Default: 'production'
    Description: 'Environment name for tagging'
    AllowedValues:
      - development
      - staging
      - production

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - EnvironmentName
          - ProjectName
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCidr

Resources:
  # ===========================================
  # VPC and Internet Gateway
  # ===========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # ===========================================
  # Public Subnets (3 AZs)
  # ===========================================

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Tier
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Tier
          Value: Public

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Tier
          Value: Public

  # ===========================================
  # Private Subnets (3 AZs)
  # ===========================================

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Tier
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [4, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Tier
          Value: Private

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [5, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-3-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Tier
          Value: Private

  # ===========================================
  # NAT Gateways with Elastic IPs (2 AZs)
  # ===========================================

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # ===========================================
  # Public Route Table
  # ===========================================

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  # ===========================================
  # Private Route Tables (2 for NAT redundancy)
  # ===========================================

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable1

  # ===========================================
  # Network ACLs with Security Rules
  # ===========================================

  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-nacl-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # Deny known malicious IP ranges
  PublicNetworkAclEntryDenyMalicious1:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 10
      Protocol: -1
      RuleAction: deny
      CidrBlock: '198.18.0.0/15'

  PublicNetworkAclEntryDenyMalicious2:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 20
      Protocol: -1
      RuleAction: deny
      CidrBlock: '192.0.2.0/24'

  PublicNetworkAclEntryInboundAllow:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

  PublicNetworkAclEntryOutboundAllow:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

  PublicSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      NetworkAclId: !Ref PublicNetworkAcl

  PublicSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      NetworkAclId: !Ref PublicNetworkAcl

  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-nacl-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  PrivateNetworkAclEntryDenyMalicious1:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 10
      Protocol: -1
      RuleAction: deny
      CidrBlock: '198.18.0.0/15'

  PrivateNetworkAclEntryDenyMalicious2:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 20
      Protocol: -1
      RuleAction: deny
      CidrBlock: '192.0.2.0/24'

  PrivateNetworkAclEntryInboundAllow:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

  PrivateNetworkAclEntryOutboundAllow:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: '0.0.0.0/0'

  PrivateSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnet3NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      NetworkAclId: !Ref PrivateNetworkAcl

  # ===========================================
  # S3 Bucket for VPC Flow Logs
  # ===========================================

  FlowLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'vpc-flow-logs-${EnvironmentSuffix}'
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
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER
          - Id: ExpireOldLogs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flow-logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

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
            Action: 's3:PutObject'
            Resource: !Sub '${FlowLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt FlowLogsBucket.Arn

  # ===========================================
  # VPC Flow Logs
  # ===========================================

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    DependsOn: FlowLogsBucketPolicy
    Properties:
      ResourceType: VPC
      ResourceIds:
        - !Ref VPC
      TrafficType: ALL
      LogDestinationType: s3
      LogDestination: !GetAtt FlowLogsBucket.Arn
      LogFormat: '${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status}'
      Tags:
        - Key: Name
          Value: !Sub 'vpc-flow-log-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # ===========================================
  # S3 Gateway VPC Endpoint
  # ===========================================

  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcEndpointType: Gateway
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PublicRouteTable
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:ListBucket'
            Resource:
              - !Sub 'arn:aws:s3:::${ProjectName}-*/*'
              - !Sub 'arn:aws:s3:::${ProjectName}-*'
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
            Resource:
              - 'arn:aws:s3:::amazonlinux.*.amazonaws.com/*'
              - 'arn:aws:s3:::amazonlinux-2-repos-*/*'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  VPCCidr:
    Description: 'VPC CIDR Block'
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-VPCCidr'

  PublicSubnets:
    Description: 'Comma-delimited list of public subnet IDs'
    Value: !Sub '${PublicSubnet1},${PublicSubnet2},${PublicSubnet3}'
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnets'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2'

  PublicSubnet3Id:
    Description: 'Public Subnet 3 ID'
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet3'

  PrivateSubnets:
    Description: 'Comma-delimited list of private subnet IDs'
    Value: !Sub '${PrivateSubnet1},${PrivateSubnet2},${PrivateSubnet3}'
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2'

  PrivateSubnet3Id:
    Description: 'Private Subnet 3 ID'
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet3'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGateway'

  NatGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway1'

  NatGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NatGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway2'

  FlowLogsBucketName:
    Description: 'VPC Flow Logs S3 Bucket Name'
    Value: !Ref FlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-FlowLogsBucket'

  S3VPCEndpointId:
    Description: 'S3 VPC Endpoint ID'
    Value: !Ref S3VPCEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-S3VPCEndpoint'

  AvailabilityZones:
    Description: 'Availability Zones used'
    Value: !Sub '${PublicSubnet1.AvailabilityZone},${PublicSubnet2.AvailabilityZone},${PublicSubnet3.AvailabilityZone}'
    Export:
      Name: !Sub '${AWS::StackName}-AvailabilityZones'
```

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- Permissions to create VPC, subnets, NAT Gateways, S3 buckets, and related resources
- Available Elastic IP quota (at least 2 EIPs required)

### Deployment Command

```bash
aws cloudformation create-stack \
  --stack-name fintech-vpc-foundation \
  --template-body file://TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=EnvironmentName,ParameterValue=production \
    ParameterKey=ProjectName,ParameterValue=fintech-payment-platform \
    ParameterKey=VpcCidr,ParameterValue=10.0.0.0/16 \
  --region us-east-1 \
  --tags \
    Key=Environment,Value=production \
    Key=Project,Value=fintech-payment-platform \
    Key=ManagedBy,Value=CloudFormation
```

### Validation

After deployment, verify the stack:

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name fintech-vpc-foundation \
  --query 'Stacks[0].StackStatus'

# Get outputs
aws cloudformation describe-stacks \
  --stack-name fintech-vpc-foundation \
  --query 'Stacks[0].Outputs'

# Verify VPC Flow Logs are active
aws ec2 describe-flow-logs \
  --filter Name=resource-type,Values=VPC
```

### Cleanup

To delete the stack:

```bash
# Empty the S3 bucket first
aws s3 rm s3://vpc-flow-logs-prod-001 --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name fintech-vpc-foundation
```

## Architecture Details

### Network Design
- **VPC**: 10.0.0.0/16 (65,536 IP addresses)
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.3.0/24, 10.0.4.0/24, 10.0.5.0/24

### High Availability
- Resources distributed across 3 Availability Zones
- 2 NAT Gateways in different AZs for redundancy
- Private subnets 1 and 3 use NAT Gateway 1
- Private subnet 2 uses NAT Gateway 2

### Security Features
1. **Network ACLs**: Block known malicious IP ranges (198.18.0.0/15, 192.0.2.0/24)
2. **VPC Flow Logs**: Capture ALL traffic (accepted, rejected, all)
3. **S3 Encryption**: Server-side encryption (AES256) for Flow Logs bucket
4. **Public Access Block**: Enabled on S3 bucket
5. **S3 VPC Endpoint**: Restricts S3 access to specific bucket prefixes
6. **Private Subnets**: No direct internet access, only through NAT Gateways

### Cost Optimization
- S3 Lifecycle policies transition logs to lower-cost storage:
  - After 30 days: Standard-IA
  - After 90 days: Glacier
  - After 365 days: Deleted
- NAT Gateway redundancy balanced (2 instead of 3) to reduce costs while maintaining HA

### Compliance Considerations
- All resources tagged with Environment, Project, and ManagedBy
- VPC Flow Logs enabled for audit trail
- Network ACLs provide additional security layer
- S3 bucket has encryption and access controls
- DNS resolution enabled for service discovery

## Testing Recommendations

1. **Connectivity Testing**:
   - Deploy test EC2 instance in public subnet, verify internet access
   - Deploy test EC2 instance in private subnet, verify outbound access through NAT
   - Verify private instances cannot receive inbound internet traffic

2. **Flow Logs Validation**:
   - Wait 10-15 minutes after deployment
   - Check S3 bucket for flow log files
   - Verify log format includes all required fields

3. **VPC Endpoint Testing**:
   - From private subnet instance, test S3 access
   - Verify traffic uses VPC endpoint (check route tables)
   - Test access to allowed and denied bucket prefixes

4. **Network ACL Testing**:
   - Attempt connections from blocked CIDR ranges
   - Verify denials appear in Flow Logs

5. **High Availability Testing**:
   - Simulate NAT Gateway failure
   - Verify traffic fails over to alternate NAT Gateway
   - Check private subnet connectivity during failure

## PCI DSS Compliance Notes

This infrastructure supports PCI DSS compliance requirements:
- **Network Segmentation**: Public and private subnets isolated
- **Logging and Monitoring**: VPC Flow Logs capture all traffic
- **Encryption**: S3 bucket encrypted at rest
- **Access Control**: Network ACLs and VPC endpoints restrict access
- **High Availability**: Multi-AZ deployment

Additional PCI DSS requirements (not covered in VPC foundation):
- Application-layer firewalls (WAF)
- Intrusion detection/prevention systems
- Regular security scanning
- Access logging for all system components
