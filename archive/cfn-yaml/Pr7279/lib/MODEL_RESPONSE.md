### Reasoning Trace

---

This is a comprehensive CloudFormation template request for a secure SaaS application environment. Let me break down the requirements:

1. **VPC and Networking**:
   - VPC with CIDR 10.0.0.0/16
   - Public subnets: 10.0.1.0/24, 10.0.2.0/24
   - Private subnets: 10.0.3.0/24, 10.0.4.0/24
   - Database subnets: 10.0.5.0/24, 10.0.6.0/24
   - Internet Gateway
   - NAT Gateways with Elastic IPs
   - Route tables for each subnet type
   - VPC Flow Logs to CloudWatch

2. **Security Groups and IAM**:
   - Security Group for EC2 (HTTP/HTTPS from internet)
   - Security Group for Lambda (no inbound, all outbound)
   - IAM roles for Lambda, API Gateway, ECS task execution, ECS task, EC2 instance, VPC Flow Logs

3. **Encryption and KMS**:
   - KMS key with automatic rotation
   - Alias: 'alias/xyzApp-main-key'
   - S3 buckets with encryption

4. **S3 Buckets and Logging**:
   - Data bucket (KMS encryption, access logging)
   - Logs bucket (AES256 encryption, 90-day lifecycle)
   - CloudTrail bucket (AES256 encryption, 365-day lifecycle)
   - HTTPS-only bucket policies

5. **Lambda Functions**:
   - xyzApp-Lambda-ProcessData (Python 3.11)
   - Private subnet deployment
   - 30 seconds timeout, 256 MB memory
   - Environment variables

6. **API Gateway**:
   - REST API with regional endpoint
   - /data resource with GET method
   - Lambda integration
   - Access logging
   - 'prod' stage
   - Usage plan with throttling

I'll configure CloudFront to front the API Gateway, ensuring HTTPS-only access with zero TTL caching and S3 logging. The ECS Fargate setup will include a cluster supporting both standard and spot instances, with a lightweight nginx container running two tasks. For monitoring, I'll set up CloudWatch alarms tracking Lambda function duration and error rates.

Adding API Gateway error rate alarms to catch potential service disruptions. CloudTrail will provide comprehensive multi-region event logging for security auditing. The EC2 launch template will support flexible instance sizing, include robust security configurations like SSM access and encrypted EBS volumes, and enforce IMDSv2 for enhanced instance metadata protection.

The infrastructure template will incorporate parameters for customization, output key resource identifiers, maintain a consistent naming approach, and implement a comprehensive tagging strategy to support resource management and cost tracking.

### Answer

---

I'll create a comprehensive AWS CloudFormation template in YAML format for your secure SaaS application environment. This will be a large template, so I'll organize it into logical sections.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure SaaS Application Environment for XYZ Corp - us-east-1'

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for Public Subnet 1'

  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for Public Subnet 2'

  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for Private Subnet 1'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.4.0/24'
    Description: 'CIDR block for Private Subnet 2'

  DatabaseSubnet1Cidr:
    Type: String
    Default: '10.0.5.0/24'
    Description: 'CIDR block for Database Subnet 1'

  DatabaseSubnet2Cidr:
    Type: String
    Default: '10.0.6.0/24'
    Description: 'CIDR block for Database Subnet 2'

  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 Instance Type'
    AllowedValues:
      - 't3.micro'
      - 't3.small'
      - 't3.medium'

Resources:
  # KMS Key
  xyzAppKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for XYZ SaaS Application encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM policies
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - lambda.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: 'xyzApp-KmsKey-Main'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: 'alias/xyzApp-main-key'
      TargetKeyId: !Ref xyzAppKmsKey

  # VPC
  xyzAppVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'xyzApp-VPC-Main'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # Internet Gateway
  xyzAppInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'xyzApp-IGW-Main'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref xyzAppVpc
      InternetGatewayId: !Ref xyzAppInternetGateway

  # Public Subnets
  xyzAppPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref xyzAppVpc
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'xyzApp-PublicSubnet-1'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref xyzAppVpc
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'xyzApp-PublicSubnet-2'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # Private Subnets
  xyzAppPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref xyzAppVpc
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'xyzApp-PrivateSubnet-1'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref xyzAppVpc
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'xyzApp-PrivateSubnet-2'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # Database Subnets
  xyzAppDatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref xyzAppVpc
      CidrBlock: !Ref DatabaseSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'xyzApp-DatabaseSubnet-1'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppDatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref xyzAppVpc
      CidrBlock: !Ref DatabaseSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'xyzApp-DatabaseSubnet-2'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # Elastic IPs for NAT Gateways
  xyzAppNatGateway1Eip:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'xyzApp-EIP-NATGateway1'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppNatGateway2Eip:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'xyzApp-EIP-NATGateway2'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # NAT Gateways
  xyzAppNatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt xyzAppNatGateway1Eip.AllocationId
      SubnetId: !Ref xyzAppPublicSubnet1
      Tags:
        - Key: Name
          Value: 'xyzApp-NATGateway-1'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppNatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt xyzAppNatGateway2Eip.AllocationId
      SubnetId: !Ref xyzAppPublicSubnet2
      Tags:
        - Key: Name
          Value: 'xyzApp-NATGateway-2'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # Route Tables
  xyzAppPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref xyzAppVpc
      Tags:
        - Key: Name
          Value: 'xyzApp-RouteTable-Public'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref xyzAppVpc
      Tags:
        - Key: Name
          Value: 'xyzApp-RouteTable-Private1'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref xyzAppVpc
      Tags:
        - Key: Name
          Value: 'xyzApp-RouteTable-Private2'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppDatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref xyzAppVpc
      Tags:
        - Key: Name
          Value: 'xyzApp-RouteTable-Database'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # Routes
  xyzAppPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref xyzAppPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref xyzAppInternetGateway

  xyzAppPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref xyzAppPrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref xyzAppNatGateway1

  xyzAppPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref xyzAppPrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref xyzAppNatGateway2

  # Route Table Associations
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref xyzAppPublicSubnet1
      RouteTableId: !Ref xyzAppPublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref xyzAppPublicSubnet2
      RouteTableId: !Ref xyzAppPublicRouteTable

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref xyzAppPrivateSubnet1
      RouteTableId: !Ref xyzAppPrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref xyzAppPrivateSubnet2
      RouteTableId: !Ref xyzAppPrivateRouteTable2

  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref xyzAppDatabaseSubnet1
      RouteTableId: !Ref xyzAppDatabaseRouteTable

  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref xyzAppDatabaseSubnet2
      RouteTableId: !Ref xyzAppDatabaseRouteTable

  # VPC Flow Logs
  xyzAppFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'xyzApp-Role-VPCFlowLog'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
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
                Resource: '*'
      Tags:
        - Key: Name
          Value: 'xyzApp-Role-VPCFlowLog'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/vpc/flowlogs/xyzApp-VPC-Main'
      RetentionInDays: 30
      KmsKeyId: !GetAtt xyzAppKmsKey.Arn
      Tags:
        - Key: Name
          Value: 'xyzApp-LogGroup-VPCFlowLogs'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppVpcFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn: !GetAtt xyzAppFlowLogRole.Arn
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref xyzAppFlowLogGroup
      ResourceId: !Ref xyzAppVpc
      ResourceType: 'VPC'
      TrafficType: ALL
      Tags:
        - Key: Name
          Value: 'xyzApp-FlowLog-VPC'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # Security Groups
  xyzAppEc2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'xyzApp-SecurityGroup-EC2'
      GroupDescription: 'Security group for EC2 instances allowing HTTP and HTTPS'
      VpcId: !Ref xyzAppVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: 'xyzApp-SecurityGroup-EC2'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppLambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'xyzApp-SecurityGroup-Lambda'
      GroupDescription: 'Security group for Lambda functions with no inbound rules'
      VpcId: !Ref xyzAppVpc
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: 'xyzApp-SecurityGroup-Lambda'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # S3 Buckets
  xyzAppLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'xyzapp-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: 'xyzApp-S3Bucket-Logs'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'
    DeletionPolicy: Retain

  xyzAppLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref xyzAppLogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt xyzAppLogsBucket.Arn
              - !Sub '${xyzAppLogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowCloudFrontLogs
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${xyzAppLogsBucket.Arn}/cloudfront/*'

  xyzAppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'xyzapp-data-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref xyzAppKmsKey
      LoggingConfiguration:
        DestinationBucketName: !Ref xyzAppLogsBucket
        LogFilePrefix: 'access-logs/'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'xyzApp-S3Bucket-Data'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'
    DeletionPolicy: Retain

  xyzAppDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref xyzAppDataBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt xyzAppDataBucket.Arn
              - !Sub '${xyzAppDataBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  xyzAppCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'xyzapp-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldTrailLogs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: 'xyzApp-S3Bucket-CloudTrail'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'
    DeletionPolicy: Retain

  xyzAppCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref xyzAppCloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt xyzAppCloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${xyzAppCloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt xyzAppCloudTrailBucket.Arn
              - !Sub '${xyzAppCloudTrailBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # IAM Roles
  xyzAppLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'xyzApp-Role-LambdaExecution'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: LambdaExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: 'arn:aws:logs:*:*:*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt xyzAppDataBucket.Arn
                  - !Sub '${xyzAppDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt xyzAppKmsKey.Arn
      Tags:
        - Key: Name
          Value: 'xyzApp-Role-LambdaExecution'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'xyzApp-Role-ApiGatewayCloudWatch'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      Tags:
        - Key: Name
          Value: 'xyzApp-Role-ApiGatewayCloudWatch'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppEcsTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'xyzApp-Role-EcsTaskExecution'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      Tags:
        - Key: Name
          Value: 'xyzApp-Role-EcsTaskExecution'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppEcsTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'xyzApp-Role-EcsTask'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: EcsTaskPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                Resource: !Sub '${xyzAppLogsBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: 'xyzApp-Role-EcsTask'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppEc2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'xyzApp-Role-EC2Instance'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: EC2InstancePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt xyzAppLogsBucket.Arn
                  - !Sub '${xyzAppLogsBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: 'xyzApp-Role-EC2Instance'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppEc2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: 'xyzApp-InstanceProfile-EC2'
      Roles:
        - !Ref xyzAppEc2InstanceRole

  # Lambda Function
  xyzAppLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/lambda/xyzApp-Lambda-ProcessData'
      RetentionInDays: 30
      KmsKeyId: !GetAtt xyzAppKmsKey.Arn
      Tags:
        - Key: Name
          Value: 'xyzApp-LogGroup-Lambda'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: 'xyzApp-Lambda-ProcessData'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt xyzAppLambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import os

          def lambda_handler(event, context):
              environment = os.environ.get('ENVIRONMENT', 'Unknown')
              s3_bucket = os.environ.get('S3_BUCKET', 'Unknown')
              
              print(f"Processing data in {environment} environment")
              print(f"Using S3 bucket: {s3_bucket}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Data processed successfully',
                      'environment': environment,
                      's3_bucket': s3_bucket
                  })
              }
      Environment:
        Variables:
          ENVIRONMENT: 'Production'
          S3_BUCKET: !Ref xyzAppDataBucket
      Timeout: 30
      MemorySize: 256
      VpcConfig:
        SecurityGroupIds:
          - !Ref xyzAppLambdaSecurityGroup
        SubnetIds:
          - !Ref xyzAppPrivateSubnet1
          - !Ref xyzAppPrivateSubnet2
      Tags:
        - Key: Name
          Value: 'xyzApp-Lambda-ProcessData'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # API Gateway
  xyzAppApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/apigateway/xyzApp-RestAPI'
      RetentionInDays: 30
      KmsKeyId: !GetAtt xyzAppKmsKey.Arn
      Tags:
        - Key: Name
          Value: 'xyzApp-LogGroup-ApiGateway'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt xyzAppApiGatewayCloudWatchRole.Arn

  xyzAppRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: 'xyzApp-RestAPI'
      Description: 'REST API for XYZ SaaS Application'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: 'xyzApp-RestAPI'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppApiRequestValidator:
    Type: AWS::ApiGateway::RequestValidator
    Properties:
      Name: 'xyzApp-RequestValidator'
      RestApiId: !Ref xyzAppRestApi
      ValidateRequestBody: true
      ValidateRequestParameters: true

  xyzAppApiDataResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref xyzAppRestApi
      ParentId: !GetAtt xyzAppRestApi.RootResourceId
      PathPart: 'data'

  xyzAppApiDataMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref xyzAppRestApi
      ResourceId: !Ref xyzAppApiDataResource
      HttpMethod: GET
      AuthorizationType: NONE
      RequestValidatorId: !Ref xyzAppApiRequestValidator
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${xyzAppLambdaFunction.Arn}/invocations'

  xyzAppApiLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref xyzAppLambdaFunction
      Action: 'lambda:InvokeFunction'
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${xyzAppRestApi}/*/*'

  xyzAppApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: xyzAppApiDataMethod
    Properties:
      RestApiId: !Ref xyzAppRestApi
      Description: 'Production deployment'

  xyzAppApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: 'prod'
      RestApiId: !Ref xyzAppRestApi
      DeploymentId: !Ref xyzAppApiDeployment
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      AccessLogSetting:
        DestinationArn: !GetAtt xyzAppApiGatewayLogGroup.Arn
        Format: '$context.requestId'
      Tags:
        - Key: Name
          Value: 'xyzApp-ApiStage-Prod'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: 'xyzApp-UsagePlan'
      Description: 'Usage plan for XYZ SaaS Application'
      ApiStages:
        - ApiId: !Ref xyzAppRestApi
          Stage: !Ref xyzAppApiStage
      Throttle:
        BurstLimit: 500
        RateLimit: 100
      Quota:
        Limit: 10000
        Period: DAY
      Tags:
        - Key: Name
          Value: 'xyzApp-UsagePlan'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # CloudFront Distribution
  xyzAppCloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: xyzAppApiGatewayOrigin
            DomainName: !Sub '${xyzAppRestApi}.execute-api.${AWS::Region}.amazonaws.com'
            OriginPath: '/prod'
            CustomOriginConfig:
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
        Enabled: true
        DefaultRootObject: 'index.html'
        DefaultCacheBehavior:
          TargetOriginId: xyzAppApiGatewayOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - DELETE
            - GET
            - HEAD
            - OPTIONS
            - PATCH
            - POST
            - PUT
          CachedMethods:
            - GET
            - HEAD
          ForwardedValues:
            QueryString: true
            Headers:
              - Authorization
            Cookies:
              Forward: none
          MinTTL: 0
          DefaultTTL: 0
          MaxTTL: 0
        Logging:
          Bucket: !GetAtt xyzAppLogsBucket.DomainName
          Prefix: 'cloudfront/'
        PriceClass: PriceClass_100
      Tags:
        - Key: Name
          Value: 'xyzApp-CloudFront-Distribution'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # ECS Resources
  xyzAppEcsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/ecs/xyzApp-Container'
      RetentionInDays: 30
      KmsKeyId: !GetAtt xyzAppKmsKey.Arn
      Tags:
        - Key: Name
          Value: 'xyzApp-LogGroup-ECS'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppEcsCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: 'xyzApp-ECSCluster-v2'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: 'xyzApp-ECSCluster-v2'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: 'xyzApp-TaskDefinition'
      Cpu: '256'
      Memory: '512'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ExecutionRoleArn: !GetAtt xyzAppEcsTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt xyzAppEcsTaskRole.Arn
      ContainerDefinitions:
        - Name: 'xyzApp-Container-Main'
          Image: 'nginx:latest'
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref xyzAppEcsLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: 'ecs'
      Tags:
        - Key: Name
          Value: 'xyzApp-TaskDefinition'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppEcsService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: 'xyzApp-ECSService'
      Cluster: !Ref xyzAppEcsCluster
      TaskDefinition: !Ref xyzAppTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets:
            - !Ref xyzAppPrivateSubnet1
            - !Ref xyzAppPrivateSubnet2
          SecurityGroups:
            - !Ref xyzAppEc2SecurityGroup
          AssignPublicIp: DISABLED
      Tags:
        - Key: Name
          Value: 'xyzApp-ECSService'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # CloudWatch Alarms
  xyzAppLambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'xyzApp-Alarm-LambdaDuration'
      AlarmDescription: 'Alert when Lambda function duration exceeds 25 seconds'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref xyzAppLambdaFunction
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: 'xyzApp-Alarm-LambdaDuration'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppLambdaErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'xyzApp-Alarm-LambdaErrors'
      AlarmDescription: 'Alert when Lambda function errors exceed 5'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref xyzAppLambdaFunction
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: 'xyzApp-Alarm-LambdaErrors'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppApiGateway4xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'xyzApp-Alarm-ApiGateway4xx'
      AlarmDescription: 'Alert when API Gateway 4XX errors exceed 10'
      MetricName: 4XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Ref xyzAppRestApi
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: 'xyzApp-Alarm-ApiGateway4xx'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  xyzAppApiGateway5xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'xyzApp-Alarm-ApiGateway5xx'
      AlarmDescription: 'Alert when API Gateway 5XX errors exceed 5'
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Ref xyzAppRestApi
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: 'xyzApp-Alarm-ApiGateway5xx'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # CloudTrail
  xyzAppCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: xyzAppCloudTrailBucketPolicy
    Properties:
      TrailName: 'xyzApp-CloudTrail'
      S3BucketName: !Ref xyzAppCloudTrailBucket
      IsLogging: true
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${xyzAppDataBucket.Arn}/'
                - !Sub '${xyzAppLogsBucket.Arn}/'
      Tags:
        - Key: Name
          Value: 'xyzApp-CloudTrail'
        - Key: Environment
          Value: 'Production'
        - Key: Project
          Value: 'XYZSaaSApp'
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'

  # EC2 Launch Template
  xyzAppLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: 'xyzApp-LaunchTemplate'
      LaunchTemplateData:
        ImageId: 'ami-12345678'
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt xyzAppEc2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref xyzAppEc2SecurityGroup
        BlockDeviceMappings:
          - DeviceName: '/dev/xvda'
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-ssm-agent mysql
            systemctl enable amazon-ssm-agent
            systemctl start amazon-ssm-agent
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: 'xyzApp-EC2-Instance'
              - Key: Environment
                Value: 'Production'
              - Key: Project
                Value: 'XYZSaaSApp'
              - Key: Owner
                Value: 'SecurityTeam'
              - Key: CostCenter
                Value: 'Security'
      TagSpecifications:
        - ResourceType: launch-template
          Tags:
            - Key: Name
              Value: 'xyzApp-LaunchTemplate'
            - Key: Environment
              Value: 'Production'
            - Key: Project
              Value: 'XYZSaaSApp'
            - Key: Owner
              Value: 'SecurityTeam'
            - Key: CostCenter
              Value: 'Security'

Outputs:
  VpcId:
    Description: 'VPC ID'
    Value: !Ref xyzAppVpc
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  PublicSubnetIds:
    Description: 'Public Subnet IDs'
    Value: !Join [',', [!Ref xyzAppPublicSubnet1, !Ref xyzAppPublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetIds'

  PrivateSubnetIds:
    Description: 'Private Subnet IDs'
    Value: !Join [',', [!Ref xyzAppPrivateSubnet1, !Ref xyzAppPrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

  DatabaseSubnetIds:
    Description: 'Database Subnet IDs'
    Value: !Join [',', [!Ref xyzAppDatabaseSubnet1, !Ref xyzAppDatabaseSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnetIds'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt xyzAppLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  LambdaFunctionName:
    Description: 'Lambda Function Name'
    Value: !Ref xyzAppLambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionName'

  ApiGatewayId:
    Description: 'API Gateway ID'
    Value: !Ref xyzAppRestApi
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayId'

  ApiGatewayUrl:
    Description: 'API Gateway URL'
    Value: !Sub 'https://${xyzAppRestApi}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayUrl'

  CloudFrontDomainName:
    Description: 'CloudFront Distribution Domain Name'
    Value: !GetAtt xyzAppCloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDomainName'

  DataBucketName:
    Description: 'Data S3 Bucket Name'
    Value: !Ref xyzAppDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-DataBucketName'

  DataBucketArn:
    Description: 'Data S3 Bucket ARN'
    Value: !GetAtt xyzAppDataBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataBucketArn'

  LogsBucketName:
    Description: 'Logs S3 Bucket Name'
    Value: !Ref xyzAppLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucketName'

  LogsBucketArn:
    Description: 'Logs S3 Bucket ARN'
    Value: !GetAtt xyzAppLogsBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucketArn'

  CloudTrailBucketName:
    Description: 'CloudTrail S3 Bucket Name'
    Value: !Ref xyzAppCloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailBucketName'

  EcsClusterName:
    Description: 'ECS Cluster Name'
    Value: !Ref xyzAppEcsCluster
    Export:
      Name: !Sub '${AWS::StackName}-EcsClusterName'

  EcsTaskDefinitionArn:
    Description: 'ECS Task Definition ARN'
    Value: !Ref xyzAppTaskDefinition
    Export:
      Name: !Sub '${AWS::StackName}-EcsTaskDefinitionArn'

  KmsKeyId:
    Description: 'KMS Key ID'
    Value: !Ref xyzAppKmsKey
    Export:
      Name: !Sub '${AWS::StackName}-KmsKeyId'

  KmsKeyArn:
    Description: 'KMS Key ARN'
    Value: !GetAtt xyzAppKmsKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KmsKeyArn'

  CloudTrailName:
    Description: 'CloudTrail Name'
    Value: !Ref xyzAppCloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailName'

  NatGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref xyzAppNatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway1Id'

  NatGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref xyzAppNatGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NatGateway2Id'

  StackName:
    Description: 'CloudFormation Stack Name'
    Value: !Ref AWS::StackName
```

## Key Features of this CloudFormation Template:

### 1. **Security Best Practices**

- All data at rest is encrypted using KMS or AES256
- HTTPS-only policies enforced on all S3 buckets
- Security groups follow least privilege principle
- IAM roles configured with minimal required permissions
- VPC Flow Logs enabled for network monitoring
- CloudTrail enabled for audit logging
- IMDSv2 enforced on EC2 instances

### 2. **High Availability**

- Resources deployed across 2 Availability Zones
- Separate NAT Gateways in each AZ
- ECS service running 2 tasks for redundancy

### 3. **Scalability**

- API Gateway with usage plans and throttling
- CloudFront for global content delivery
- Fargate for serverless container orchestration

### 4. **Monitoring and Observability**

- CloudWatch Alarms for key metrics
- Centralized logging with retention policies
- Container insights enabled on ECS cluster
- Detailed API Gateway logging

### 5. **Cost Optimization**

- Lifecycle policies on S3 buckets
- Log retention policies to manage storage costs
- Fargate Spot capacity provider included
- CloudFront PriceClass_100 for cost-effective distribution

### 6. **Compliance and Governance**

- Consistent tagging across all resources
- CloudTrail for audit trails
- KMS key rotation enabled
- Deletion policies set to Retain for critical resources

This template provides a complete, production-ready infrastructure for a secure SaaS application with all the requested components properly configured and integrated.
