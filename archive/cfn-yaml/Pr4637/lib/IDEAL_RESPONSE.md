### Reasoning Trace

---

This is a comprehensive request for a production-grade AWS CloudFormation template. The solution must create complete YAML-based infrastructure that includes:

1. **Networking Foundation**:
   - VPC with IPv4 and IPv6 dual-stack support
   - Public and private subnets distributed across multiple availability zones
   - NAT Gateway for secure outbound internet access from private subnets
   - Comprehensive routing tables and security groups with least privilege

2. **Compute Infrastructure**:
   - EC2 instances deployed in private subnets for security
   - Auto Scaling Groups for high availability and resilience
   - Launch templates with encrypted EBS volumes using KMS
   - IAM roles following principle of least privilege
   - Application Load Balancer with health checks

3. **Database and Caching**:
   - RDS MySQL instance with encryption, automated backups, and Multi-AZ capability
   - ElastiCache Redis cluster with encryption at rest and in transit
   - Both services isolated in private subnets

4. **Security and Compliance**:
   - KMS encryption for all data at rest
   - AWS Secrets Manager for database passwords
   - S3 buckets with encryption, versioning, and strict access policies
   - WAF with rate limiting and geo-blocking rules
   - Security group remediation Lambda function
   - CloudWatch Logs with encryption

5. **Monitoring and Notifications**:
   - CloudWatch alarms for CPU and storage thresholds
   - SNS topic for infrastructure notifications
   - EventBridge rules for WAF change detection
   - Comprehensive logging with retention policies

6. **Best Practices**:
   - Parameters for environment-specific configurations
   - Conditions for production vs staging differences
   - Mappings for regional availability zone configuration
   - Consistent tagging across all resources (Owner, Environment, CostCenter, project, team-number)
   - DeletionPolicy and UpdateReplacePolicy for critical resources
   - EnvironmentSuffix parameter for resource name isolation

Key differences from a typical implementation:
- Uses Secrets Manager instead of SSM Parameter Store for database passwords
- Implements explicit security group egress rules for better control
- Includes comprehensive UserData for EC2 with httpd web server and health endpoint
- Uses lowercase S3 bucket names to comply with naming restrictions
- Commented HTTPS/SSL configuration for future enablement
- Proper KMS key policies for CloudWatch Logs, EC2, and Auto Scaling services
- MySQL 8.0.43 with appropriate CloudWatch log exports
- Required tags for RLHF tracking (project: iac-rlhf-amazon, team-number: 2)

### Answer

---

I'll create a comprehensive CloudFormation template that meets all requirements for production-grade AWS infrastructure with security, resilience, and compliance built-in.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade web application infrastructure with security, resilience, and compliance'

Parameters:
  Environment:
    Type: String
    Default: staging
    AllowedValues:
      - staging
      - production
    Description: Environment name
  
  Owner:
    Type: String
    Default: DevTeam
    Description: Owner tag for all resources
    MinLength: 1

  CostCenter:
    Type: String
    Default: Engineering
    Description: Cost center tag for billing
    MinLength: 1
  
  DBUsername:
    Type: String
    Default: admin
    Description: Database admin username
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
    Description: EC2 instance type

  NotificationEmail:
    Type: String
    Default: devops@example.com
    Description: Email for SNS notifications
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

  EnvironmentSuffix:
    Type: String
    Default: ''
    Description: Optional suffix to append to resource names for environment isolation

Mappings:
  AZConfig:
    us-east-1:
      AZs: ["a", "b", "c"]
    us-west-2:
      AZs: ["a", "b", "c"]
    eu-west-1:
      AZs: ["a", "b", "c"]

Conditions:
  IsProduction: !Equals [!Ref Environment, production]

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      InstanceTenancy: default
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  IPv6CidrBlock:
    Type: AWS::EC2::VPCCidrBlock
    Properties:
      VpcId: !Ref VPC
      AmazonProvidedIpv6CidrBlock: true
  
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway
  
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    DependsOn: IPv6CidrBlock
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.0.0/24
      Ipv6CidrBlock: !Select [0, !Cidr [!Select [0, !GetAtt VPC.Ipv6CidrBlocks], 8, 64]]
      AvailabilityZone: !Sub 
        - '${AWS::Region}${AZ}'
        - AZ: !Select [0, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    DependsOn: IPv6CidrBlock
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      Ipv6CidrBlock: !Select [1, !Cidr [!Select [0, !GetAtt VPC.Ipv6CidrBlocks], 8, 64]]
      AvailabilityZone: !Sub 
        - '${AWS::Region}${AZ}'
        - AZ: !Select [1, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    DependsOn: IPv6CidrBlock
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      Ipv6CidrBlock: !Select [2, !Cidr [!Select [0, !GetAtt VPC.Ipv6CidrBlocks], 8, 64]]
      AvailabilityZone: !Sub 
        - '${AWS::Region}${AZ}'
        - AZ: !Select [0, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    DependsOn: IPv6CidrBlock
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      Ipv6CidrBlock: !Select [3, !Cidr [!Select [0, !GetAtt VPC.Ipv6CidrBlocks], 8, 64]]
      AvailabilityZone: !Sub 
        - '${AWS::Region}${AZ}'
        - AZ: !Select [1, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.20.0/24
      AvailabilityZone: !Sub 
        - '${AWS::Region}${AZ}'
        - AZ: !Select [0, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.21.0/24
      AvailabilityZone: !Sub 
        - '${AWS::Region}${AZ}'
        - AZ: !Select [1, !FindInMap [AZConfig, !Ref 'AWS::Region', AZs]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-rt'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
  
  PublicRouteIPv6:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationIpv6CidrBlock: ::/0
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
  
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-rt'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway
  
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable
  
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable
  
  DBSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet1
      RouteTableId: !Ref PrivateRouteTable
  
  DBSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DBSubnet2
      RouteTableId: !Ref PrivateRouteTable
  
  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-alb-sg${EnvironmentSuffix}'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # Uncomment these rules when you have a valid ACM certificate for HTTPS
        # - IpProtocol: tcp
        #   FromPort: 443
        #   ToPort: 443
        #   CidrIp: 0.0.0.0/0
        #   Description: HTTPS from anywhere
        # - IpProtocol: tcp
        #   FromPort: 443
        #   ToPort: 443
        #   CidrIpv6: ::/0
        #   Description: HTTPS from anywhere IPv6
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIpv6: ::/0
          Description: HTTP from anywhere IPv6
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb-sg'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-ec2-sg${EnvironmentSuffix}'
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTP from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: SSH from within VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP to internet
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ec2-sg'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'

  ALBtoEC2SecurityGroupEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref ALBSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      DestinationSecurityGroupId: !Ref EC2SecurityGroup
      Description: HTTP to EC2 instances

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-db-sg${EnvironmentSuffix}'
      GroupDescription: Security group for RDS instance
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: MySQL from EC2 instances
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-sg'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  CacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-cache-sg${EnvironmentSuffix}'
      GroupDescription: Security group for ElastiCache
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: Redis from EC2 instances
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cache-sg'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'

  EC2toDBSecurityGroupEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref EC2SecurityGroup
      IpProtocol: tcp
      FromPort: 3306
      ToPort: 3306
      DestinationSecurityGroupId: !Ref DBSecurityGroup
      Description: MySQL to RDS

  EC2toCacheSecurityGroupEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref EC2SecurityGroup
      IpProtocol: tcp
      FromPort: 6379
      ToPort: 6379
      DestinationSecurityGroupId: !Ref CacheSecurityGroup
      Description: Redis to ElastiCache

  # Secrets Manager
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-db-password${EnvironmentSuffix}'
      Description: RDS database password
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DBUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-secret'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'

  # KMS Key
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${AWS::StackName}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
                - lambda.amazonaws.com
                - secretsmanager.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: Allow CloudWatch Logs to use the key
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'
          - Sid: Allow EC2 service to use the key for EBS encryption
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow Auto Scaling to use the key for EBS encryption
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling'
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-kms'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-key${EnvironmentSuffix}'
      TargetKeyId: !Ref KMSKey
  
  # IAM Roles
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-ec2-role${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: EC2MinimalPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${AWS::StackName}${EnvironmentSuffix}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole
  
  # Lambda Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-lambda-role${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: SecurityGroupRemediationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:DescribeSecurityGroups'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'ec2:AuthorizeSecurityGroupIngress'
                  - 'ec2:AuthorizeSecurityGroupEgress'
                  - 'ec2:RevokeSecurityGroupIngress'
                  - 'ec2:RevokeSecurityGroupEgress'
                Resource: !Sub 'arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:security-group/*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref SNSTopic
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # ACM Certificate - Uncomment when you have a valid domain and want to enable HTTPS
  # To enable HTTPS:
  # 1. Replace 'example.com' below with your actual domain name
  # 2. Uncomment this SSLCertificate resource
  # 3. Uncomment the HTTPSListener resource below
  # 4. Uncomment HTTPS security group rules in ALBSecurityGroup
  # 5. Update HTTPListener to redirect to HTTPS instead of forwarding
  #
  # SSLCertificate:
  #   Type: AWS::CertificateManager::Certificate
  #   Properties:
  #     DomainName: example.com
  #     DomainValidationOptions:
  #       - DomainName: example.com
  #         ValidationDomain: example.com
  #     SubjectAlternativeNames:
  #       - www.example.com
  #     ValidationMethod: DNS
  #     Tags:
  #       - Key: Name
  #         Value: !Sub '${AWS::StackName}-cert'
  #       - Key: Owner
  #         Value: !Ref Owner
  #       - Key: Environment
  #         Value: !Ref Environment
  #       - Key: CostCenter
  #         Value: !Ref CostCenter
  #       - Key: project
  #         Value: iac-rlhf-amazon
  #       - Key: team-number
  #         Value: '2'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: dualstack
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-tg'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # HTTPS Listener - Uncomment when you have a valid ACM certificate
  # To enable HTTPS, uncomment this listener and the SSLCertificate resource above
  # HTTPSListener:
  #   Type: AWS::ElasticLoadBalancingV2::Listener
  #   Properties:
  #     LoadBalancerArn: !Ref ApplicationLoadBalancer
  #     Port: 443
  #     Protocol: HTTPS
  #     Certificates:
  #       - CertificateArn: !Ref SSLCertificate
  #     DefaultActions:
  #       - Type: forward
  #         TargetGroupArn: !Ref ALBTargetGroup

  # HTTP Listener - Currently forwards to target group
  # To enable HTTPS redirection: Change DefaultActions Type to 'redirect' and uncomment RedirectConfig
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
        # Uncomment below to enable HTTP to HTTPS redirection (requires valid ACM certificate)
        # - Type: redirect
        #   RedirectConfig:
        #     Protocol: HTTPS
        #     Port: 443
        #     StatusCode: HTTP_301
  
  # EC2 Launch Template
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-lt${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        Monitoring:
          Enabled: true
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref KMSKey
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent httpd

            # Configure and start Apache web server
            systemctl start httpd
            systemctl enable httpd

            # Create health check endpoint
            cat <<'HTMLEOF' > /var/www/html/health
            OK
            HTMLEOF

            # Create a simple index page
            cat <<'HTMLEOF' > /var/www/html/index.html
            <!DOCTYPE html>
            <html>
            <head>
                <title>Application Server</title>
            </head>
            <body>
                <h1>Application Server Running</h1>
                <p>Instance ID: <span id="instance-id"></span></p>
                <script>
                    fetch('http://169.254.169.254/latest/meta-data/instance-id')
                        .then(response => response.text())
                        .then(data => document.getElementById('instance-id').textContent = data);
                </script>
            </body>
            </html>
            HTMLEOF

            # Configure CloudWatch Agent
            cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "metrics": {
                "namespace": "${AWS::StackName}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_active"
                    ],
                    "metrics_collection_interval": 60,
                    "totalcpu": true
                  },
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/${AWS::StackName}${EnvironmentSuffix}/ec2/system",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/${AWS::StackName}${EnvironmentSuffix}/ec2/httpd",
                        "log_stream_name": "{instance_id}/access"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/${AWS::StackName}${EnvironmentSuffix}/ec2/httpd",
                        "log_stream_name": "{instance_id}/error"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-ec2'
              - Key: Owner
                Value: !Ref Owner
              - Key: Environment
                Value: !Ref Environment
              - Key: CostCenter
                Value: !Ref CostCenter
              - Key: project
                Value: iac-rlhf-amazon
              - Key: team-number
                Value: '2'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-ebs'
              - Key: Owner
                Value: !Ref Owner
              - Key: Environment
                Value: !Ref Environment
              - Key: CostCenter
                Value: !Ref CostCenter
              - Key: project
                Value: iac-rlhf-amazon
              - Key: team-number
                Value: '2'
  
  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: !If [IsProduction, 2, 1]
      MaxSize: !If [IsProduction, 6, 3]
      DesiredCapacity: !If [IsProduction, 2, 1]
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg'
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true
        - Key: project
          Value: iac-rlhf-amazon
          PropagateAtLaunch: true
        - Key: team-number
          Value: '2'
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingReplacingUpdate:
        WillReplace: true
  
  # RDS
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub '${AWS::StackName}-db-params${EnvironmentSuffix}'
      Description: Parameter group for MySQL
      Family: mysql8.0
      Parameters:
        slow_query_log: 1
        long_query_time: 2
        general_log: 0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-params'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db${EnvironmentSuffix}'
      DBInstanceClass: !If [IsProduction, db.t3.small, db.t3.micro]
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      AllocatedStorage: !If [IsProduction, 100, 20]
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: !If [IsProduction, true, false]
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - slowquery
        - general
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # ElastiCache
  CacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      CacheSubnetGroupName: !Sub '${AWS::StackName}-cache-subnet-group${EnvironmentSuffix}'
      Description: Subnet group for ElastiCache
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cache-subnet-group'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  CacheParameterGroup:
    Type: AWS::ElastiCache::ParameterGroup
    Properties:
      CacheParameterGroupFamily: redis7
      Description: Parameter group for Redis
      Properties:
        timeout: 300
        maxmemory-policy: allkeys-lru
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cache-params'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  ElastiCacheCluster:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub '${AWS::StackName}-cache${EnvironmentSuffix}'
      ReplicationGroupDescription: Redis cluster for application caching
      Engine: redis
      CacheNodeType: !If [IsProduction, cache.t3.small, cache.t3.micro]
      NumCacheClusters: !If [IsProduction, 2, 1]
      AutomaticFailoverEnabled: !If [IsProduction, true, false]
      MultiAZEnabled: !If [IsProduction, true, false]
      CacheSubnetGroupName: !Ref CacheSubnetGroup
      CacheParameterGroupName: !Ref CacheParameterGroup
      SecurityGroupIds:
        - !Ref CacheSecurityGroup
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      KmsKeyId: !Ref KMSKey
      SnapshotRetentionLimit: !If [IsProduction, 7, 1]
      SnapshotWindow: '03:00-05:00'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cache'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # S3 Buckets
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tapstack-data-${AWS::AccountId}${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            NoncurrentVersionExpirationInDays: 30
            Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-data'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${S3Bucket.Arn}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt S3Bucket.Arn
              - !Sub '${S3Bucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
  
  # SSM Parameters
  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${AWS::StackName}${EnvironmentSuffix}/db/endpoint'
      Description: RDS endpoint
      Type: String
      Value: !GetAtt RDSInstance.Endpoint.Address
      Tags:
        Owner: !Ref Owner
        Environment: !Ref Environment
        CostCenter: !Ref CostCenter
        project: iac-rlhf-amazon
        team-number: '2'
  
  CacheEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${AWS::StackName}${EnvironmentSuffix}/cache/endpoint'
      Description: ElastiCache endpoint
      Type: String
      Value: !GetAtt ElastiCacheCluster.PrimaryEndPoint.Address
      Tags:
        Owner: !Ref Owner
        Environment: !Ref Environment
        CostCenter: !Ref CostCenter
        project: iac-rlhf-amazon
        team-number: '2'
  
  # SNS Topic
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-notifications${EnvironmentSuffix}'
      DisplayName: Infrastructure Notifications
      KmsMasterKeyId: !Ref KMSKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-notifications'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # WAF
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-waf${EnvironmentSuffix}'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
            SampledRequestsEnabled: true
        - Name: GeoMatchRule
          Priority: 2
          Statement:
            NotStatement:
              Statement:
                GeoMatchStatement:
                  CountryCodes:
                    - US
                    - CA
                    - GB
          Action:
            Block: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: GeoMatchRule
            SampledRequestsEnabled: true
      VisibilityConfig:
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-waf'
        SampledRequestsEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-waf'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn
  
  # Lambda Function for Security Group Remediation
  SecurityGroupRemediationFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-sg-remediation${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
      Code:
        ZipFile: |
          import boto3
          import os
          import json
          
          ec2 = boto3.client('ec2')
          sns = boto3.client('sns')
          
          def handler(event, context):
              # Get all security groups
              response = ec2.describe_security_groups()
              
              for sg in response['SecurityGroups']:
                  remediated = False
                  
                  # Check for overly permissive ingress rules
                  for rule in sg['IpPermissions']:
                      if rule.get('IpRanges'):
                          for ip_range in rule['IpRanges']:
                              if ip_range.get('CidrIp') == '0.0.0.0/0' and rule.get('FromPort') == 22:
                                  # Remove SSH access from anywhere
                                  ec2.revoke_security_group_ingress(
                                      GroupId=sg['GroupId'],
                                      IpPermissions=[rule]
                                  )
                                  remediated = True
                  
                  if remediated:
                      # Send notification
                      sns.publish(
                          TopicArn=os.environ['SNS_TOPIC_ARN'],
                          Subject='Security Group Remediation',
                          Message=f"Removed overly permissive SSH rule from security group {sg['GroupId']}"
                      )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Security group remediation completed')
              }
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-sg-remediation'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # EventBridge Rule for periodic security checks
  SecurityCheckRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-security-check${EnvironmentSuffix}'
      Description: Periodic security group checks
      ScheduleExpression: 'rate(1 hour)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt SecurityGroupRemediationFunction.Arn
          Id: '1'
  
  SecurityCheckPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecurityGroupRemediationFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt SecurityCheckRule.Arn
  
  # CloudWatch Log Groups
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${AWS::StackName}${EnvironmentSuffix}/ec2/system'
      RetentionInDays: !If [IsProduction, 30, 7]
      KmsKeyId: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ec2-logs'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'

  HttpdLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${AWS::StackName}${EnvironmentSuffix}/ec2/httpd'
      RetentionInDays: !If [IsProduction, 30, 7]
      KmsKeyId: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-httpd-logs'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-high-cpu${EnvironmentSuffix}'
      AlarmDescription: Triggers when CPU utilization is high
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-high-cpu'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  RDSStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-rds-storage${EnvironmentSuffix}'
      AlarmDescription: Triggers when RDS free storage is low
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5368709120  # 5 GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-rds-storage'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: '2'
  
  # WAF Change Detection
  WAFChangeEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-waf-changes${EnvironmentSuffix}'
      Description: Detects WAF rule changes
      EventPattern:
        source:
          - aws.wafv2
        detail-type:
          - AWS API Call via CloudTrail
        detail:
          eventSource:
            - wafv2.amazonaws.com
          eventName:
            - UpdateWebACL
            - UpdateRuleGroup
            - DeleteWebACL
            - DeleteRuleGroup
      State: ENABLED
      Targets:
        - Arn: !Ref SNSTopic
          Id: '1'

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'
  
  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-alb-dns'
  
  RDSEndpoint:
    Description: RDS Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-rds-endpoint'
  
  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-s3-bucket'
  
  SNSTopicArn:
    Description: SNS Topic ARN for notifications
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-sns-topic'```
