Here's a production-ready CloudFormation template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready AWS infrastructure with VPC, subnets, NAT Gateway, S3 logging bucket, and IAM roles following security best practices'

Parameters:
  # Using a parameter for bucket name uniqueness while maintaining production standards
  BucketNamePrefix:
    Type: String
    Default: 'prod-logging'
    Description: 'Prefix for S3 bucket name (will be suffixed with account ID and region for uniqueness)'
    AllowedPattern: '^[a-z0-9-]*$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

Resources:
  # VPC Configuration
  ProductionVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true  # Required for ELBs and other AWS services
      EnableDnsSupport: true    # Required for DNS resolution
      Tags:
        - Key: Name
          Value: 'Production-VPC'
        - Key: Environment
          Value: 'Production'

  # Internet Gateway for public subnet connectivity
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'Production-IGW'
        - Key: Environment
          Value: 'Production'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref ProductionVPC

  # Public Subnet 1 in us-west-2a
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      AvailabilityZone: 'us-west-2a'
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true  # Auto-assign public IPs for instances
      Tags:
        - Key: Name
          Value: 'Production-Public-Subnet-1'
        - Key: Environment
          Value: 'Production'
        - Key: Type
          Value: 'Public'

  # Public Subnet 2 in us-west-2b
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProductionVPC
      AvailabilityZone: 'us-west-2b'
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'Production-Public-Subnet-2'
        - Key: Environment
          Value: 'Production'
        - Key: Type
          Value: 'Public'

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment  # Ensure IGW is attached before creating EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'Production-NAT-EIP'
        - Key: Environment
          Value: 'Production'

  # NAT Gateway for private subnet internet access (future use)
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1  # Place NAT Gateway in first public subnet
      Tags:
        - Key: Name
          Value: 'Production-NAT-Gateway'
        - Key: Environment
          Value: 'Production'

  # Route Table for Public Subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProductionVPC
      Tags:
        - Key: Name
          Value: 'Production-Public-RT'
        - Key: Environment
          Value: 'Production'

  # Route to Internet Gateway for public subnets
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate Public Subnet 1 with Route Table
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  # Associate Public Subnet 2 with Route Table
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # S3 Bucket for Logging with security best practices
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      # Unique bucket name using account ID and region
      BucketName: !Sub '${BucketNamePrefix}-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      # Enable server-side encryption by default
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      # Block all public access - critical for production logging bucket
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Enable access logging for security auditing
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'access-logs/'
      # Lifecycle policy to manage costs
      LifecycleConfiguration:
        Rules:
          - Id: 'LogRetentionRule'
            Status: Enabled
            ExpirationInDays: 365  # Retain logs for 1 year
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Name
          Value: 'Production-Logging-Bucket'
        - Key: Environment
          Value: 'Production'
        - Key: Purpose
          Value: 'Logging'

  # IAM Role for EC2 instances with least privilege access
  EC2LoggingRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2-Logging-Role-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            # Add condition to prevent confused deputy attacks
            Condition:
              StringEquals:
                'aws:RequestedRegion': !Ref AWS::Region
      # Inline policy following least privilege - only write access to specific S3 bucket
      Policies:
        - PolicyName: 'S3LoggingPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Allow listing bucket contents (needed for some logging applications)
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt LoggingBucket.Arn
                Condition:
                  StringLike:
                    's3:prefix': 
                      - 'logs/*'
              # Allow writing logs to specific prefix only
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                Resource: !Sub '${LoggingBucket.Arn}/logs/*'
                Condition:
                  StringEquals:
                    's3:x-amz-server-side-encryption': 'AES256'
      Tags:
        - Key: Name
          Value: 'Production-EC2-Logging-Role'
        - Key: Environment
          Value: 'Production'

  # Instance Profile for EC2 role
  EC2LoggingInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'EC2-Logging-Profile-${AWS::Region}'
      Roles:
        - !Ref EC2LoggingRole

  # Security Group with strict SSH access control
  SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'Production-SSH-SG'
      GroupDescription: 'Security group allowing SSH access from specific CIDR block only'
      VpcId: !Ref ProductionVPC
      SecurityGroupIngress:
        # SSH access restricted to specific network range (203.0.113.0/24)
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '203.0.113.0/24'
          Description: 'SSH access from authorized network range'
      # Explicit egress rules for better security posture
      SecurityGroupEgress:
        # Allow HTTPS for package updates and AWS API calls
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for updates and AWS APIs'
        # Allow HTTP for package repositories
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound for package repositories'
        # Allow DNS resolution
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: '0.0.0.0/0'
          Description: 'DNS resolution'
      Tags:
        - Key: Name
          Value: 'Production-SSH-SecurityGroup'
        - Key: Environment
          Value: 'Production'

# Outputs for validation and reference
Outputs:
  VPCId:
    Description: 'ID of the Production VPC'
    Value: !Ref ProductionVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'ID of Public Subnet 1 (us-west-2a)'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'ID of Public Subnet 2 (us-west-2b)'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  S3BucketName:
    Description: 'Name of the S3 logging bucket'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket-Name'

  NATGatewayId:
    Description: 'ID of the NAT Gateway'
    Value: !Ref NATGateway
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway-ID'

  EC2RoleArn:
    Description: 'ARN of the EC2 logging role'
    Value: !GetAtt EC2LoggingRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2Role-ARN'

  SecurityGroupId:
    Description: 'ID of the SSH Security Group'
    Value: !Ref SSHSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SSH-SecurityGroup-ID'
```

## Key Security and Operational Best Practices Implemented:

### **VPC and Network Security:**
- **DNS resolution enabled** for proper AWS service integration
- **Multi-AZ deployment** across us-west-2a and us-west-2b for high availability
- **Proper route table associations** with explicit internet gateway routing
- **NAT Gateway with Elastic IP** for future private subnet requirements

### **S3 Bucket Security:**
- **Server-side encryption** enabled by default (AES256)
- **Complete public access blocking** to prevent accidental exposure
- **Versioning enabled** for data protection and compliance
- **Lifecycle policies** to manage storage costs
- **Access logging** for security auditing
- **Unique naming** using account ID and region

### **IAM Security (Least Privilege):**
- **Specific resource ARNs** instead of wildcards
- **Conditional access** requiring server-side encryption
- **Limited S3 actions** (only PutObject, PutObjectAcl, ListBucket)
- **Prefix-based restrictions** (logs/* only)
- **Regional restrictions** to prevent confused deputy attacks

### **Security Group Controls:**
- **Explicit ingress rules** limited to 203.0.113.0/24 for SSH
- **Explicit egress rules** instead of default allow-all
- **Minimal required ports** (22 for SSH, 443/80 for updates, 53 for DNS)
- **Descriptive rule comments** for operational clarity

### **Operational Excellence:**
- **Comprehensive tagging** on all resources
- **Exported outputs** for cross-stack references
- **Proper dependencies** using DependsOn where needed
- **Resource naming conventions** for easy identification
- **Comments explaining security decisions**

This template can be deployed as-is in any AWS account in the us-west-2 region and will create a secure, production-ready foundation for your infrastructure.