I'll create a comprehensive CloudFormation template that addresses all your security requirements. This is a production-ready template with strong security controls and proper parameterization.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-tier web application architecture with comprehensive security controls'

Parameters:
  # Network Configuration
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for VPC (must be /16-/28)'
    
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for public subnet in AZ1'
    
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for public subnet in AZ2'
    
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.3.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for private subnet in AZ1'
    
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.4.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for private subnet in AZ2'
    
  DatabaseSubnet1Cidr:
    Type: String
    Default: '10.0.5.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for database subnet in AZ1'
    
  DatabaseSubnet2Cidr:
    Type: String
    Default: '10.0.6.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for database subnet in AZ2'

  # Security Configuration
  AdminAccessCidr:
    Type: String
    Default: '203.0.113.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
    Description: 'CIDR block for admin access (SSH/RDP)'
    
  SslCertificateArn:
    Type: String
    AllowedPattern: '^arn:aws:acm:[a-z0-9-]+:[0-9]{12}:certificate\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
    Description: 'ARN of ACM SSL certificate for ALB'

  # Application Configuration
  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge']
    Description: 'EC2 instance type for application servers'
    
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

  # Database Configuration
  DatabaseInstanceType:
    Type: String
    Default: 'db.t3.medium'
    AllowedValues: ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.t3.large', 'db.r5.large', 'db.r5.xlarge']
    Description: 'RDS instance type'
    
  DatabaseName:
    Type: String
    Default: 'appdb'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    MinLength: 1
    MaxLength: 64
    Description: 'Database name'

  # Tagging
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'test', 'staging', 'prod']
    Description: 'Environment name'
    
  ProjectName:
    Type: String
    Default: 'secure-webapp'
    AllowedPattern: '^[a-zA-Z0-9-]+$'
    Description: 'Project name for tagging'
    
  CostCenter:
    Type: String
    Default: 'IT-001'
    AllowedPattern: '^[A-Z0-9-]+$'
    Description: 'Cost center for billing'
    
  Owner:
    Type: String
    Default: 'platform-team'
    Description: 'Resource owner'

  # Monitoring
  NotificationEmail:
    Type: String
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    Description: 'Email address for security notifications'

Resources:
  # ===========================================
  # KMS Keys for Encryption
  # ===========================================
  
  # Master KMS key for S3 encryption
  S3KmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for S3 bucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-s3-kms-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  S3KmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-s3-key'
      TargetKeyId: !Ref S3KmsKey

  # KMS key for RDS encryption
  RdsKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for RDS encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-rds-kms-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  RdsKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-rds-key'
      TargetKeyId: !Ref RdsKmsKey

  # KMS key for CloudWatch Logs encryption
  LogsKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for CloudWatch Logs encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-logs-kms-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  LogsKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-logs-key'
      TargetKeyId: !Ref LogsKmsKey

  # KMS key for EBS volumes
  EbsKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for EBS volume encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow service-linked role use of the customer managed key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow attachment of persistent resources
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling'
            Action:
              - 'kms:CreateGrant'
            Resource: '*'
            Condition:
              Bool:
                'kms:GrantIsForAWSResource': 'true'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ebs-kms-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  EbsKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-ebs-key'
      TargetKeyId: !Ref EbsKmsKey

  # ===========================================
  # VPC and Networking
  # ===========================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # Database Subnets (Isolated)
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref DatabaseSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-database-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref DatabaseSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-database-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-eip-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-eip-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gateway-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-routes'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-routes-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
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
          Value: !Sub '${ProjectName}-private-routes-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Database route table (no internet access)
  DatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-database-routes'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

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

  # ===========================================
  # Network ACLs (Additional Security Layer)
  # ===========================================
  
  # Public Network ACL - Restrictive but allows necessary web traffic
  PublicNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-nacl'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # Inbound rules for public subnets
  PublicInboundHttpsRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  PublicInboundHttpRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 80
        To: 80

  # Allow ephemeral ports for return traffic
  PublicInboundEphemeralRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Outbound rules for public subnets
  PublicOutboundAllRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PublicNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      Egress: true

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

  # Private Network ACL - More restrictive
  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-nacl'
        - Key: Environment
          Value: !Ref Environment
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # Allow traffic from public subnets (ALB to app servers)
  PrivateInboundFromPublicRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: !Ref PublicSubnet1Cidr
      PortRange:
        From: 8080
        To: 8080

  PrivateInboundFromPublic2Rule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 110
      Protocol: 6
      RuleAction: allow
      CidrBlock: !Ref PublicSubnet2Cidr
      PortRange:
        From: 8080
        To: 8080

  # Allow SSH from admin network
  PrivateInboundSshRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 120
      Protocol: 6
      RuleAction: allow
      CidrBlock: !Ref AdminAccessCidr
      PortRange:
        From: 22
        To: 22

  # Allow ephemeral ports for return traffic
  PrivateInboundEphemeralRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 130
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65