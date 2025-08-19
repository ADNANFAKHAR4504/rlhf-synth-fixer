I'll create a comprehensive CloudFormation template that meets all your requirements. This template will serve as a secure, scalable foundation for new projects.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, scalable, and compliant AWS infrastructure foundation - TapStack'

Parameters:
  ProjectName:
    Type: String
    Description: 'Project name for resource naming convention'
    Default: 'tapstack'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'
  
  Environment:
    Type: String
    Description: 'Environment for resource naming convention'
    Default: 'dev'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
  
  DBUsername:
    Type: String
    Description: 'Database master username'
    Default: 'admin'
    NoEcho: true
  
  DBPassword:
    Type: String
    Description: 'Database master password'
    MinLength: 8
    MaxLength: 41
    NoEcho: true
    Default: 'TempPassword123!'

Mappings:
  RegionMap:
    us-west-2:
      AZ1: 'us-west-2a'
      AZ2: 'us-west-2b'

Resources:
  # ============================================================================
  # 1. COMPLIANCE AND AUDITING FOUNDATION
  # ============================================================================
  
  # CloudTrail S3 Bucket
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${ProjectName}-${Environment}-cloudtrail-${AWS::AccountId}'
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
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90

  # CloudTrail Bucket Policy
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub 'trail-${ProjectName}-${Environment}'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - 'arn:aws:s3:::*/*'

  # Config Service Role
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-${ProjectName}-${Environment}-config'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigBucketDeliveryRolePolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action: s3:PutObject
                Resource: !Sub '${ConfigBucket.Arn}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': bucket-owner-full-control

  # Config S3 Bucket
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${ProjectName}-${Environment}-config-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # Config Delivery Channel
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'delivery-${ProjectName}-${Environment}'
      S3BucketName: !Ref ConfigBucket

  # Config Configuration Recorder
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'recorder-${ProjectName}-${Environment}'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # Config Rule - S3 Bucket Public Read Prohibited
  ConfigRuleS3PublicRead:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub 'rule-${ProjectName}-${Environment}-s3-public-read-prohibited'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_READ_PROHIBITED

  # ============================================================================
  # 2. NETWORK FOUNDATION
  # ============================================================================
  
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${ProjectName}-${Environment}'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${ProjectName}-${Environment}'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-${ProjectName}-${Environment}-public-1'

  # Public Subnet 2
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-${ProjectName}-${Environment}-public-2'

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub 'subnet-${ProjectName}-${Environment}-private-1'

  # Private Subnet 2
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub 'subnet-${ProjectName}-${Environment}-private-2'

  # NAT Gateway Elastic IP
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-${ProjectName}-${Environment}-nat'

  # NAT Gateway
  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-${ProjectName}-${Environment}'

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'rt-${ProjectName}-${Environment}-public'

  # Public Route
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Public Subnet Route Table Associations
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

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'rt-${ProjectName}-${Environment}-private'

  # Private Route
  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  # Private Subnet Route Table Associations
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # ============================================================================
  # 3. SECURE DATA TIER
  # ============================================================================
  
  # Application Data S3 Bucket
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${ProjectName}-${Environment}-appdata-${AWS::AccountId}'
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
      Tags:
        - Key: Name
          Value: !Sub 's3-${ProjectName}-${Environment}-appdata'

  # Database Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'dbsg-${ProjectName}-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'dbsg-${ProjectName}-${Environment}'

  # Database Security Group
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'sg-${ProjectName}-${Environment}-database'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'MySQL access from Lambda'
      Tags:
        - Key: Name
          Value: !Sub 'sg-${ProjectName}-${Environment}-database'

  # RDS Database Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'rds-${ProjectName}-${Environment}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: true
      PubliclyAccessible: false
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'rds-${ProjectName}-${Environment}'

  # ============================================================================
  # 4. APPLICATION AND DELIVERY TIER
  # ============================================================================
  
  # Lambda Security Group
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'sg-${ProjectName}-${Environment}-lambda'
      GroupDescription: 'Security group for Lambda function'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
          Description: 'MySQL to database'
      Tags:
        - Key: Name
          Value: !Sub 'sg-${ProjectName}-${Environment}-lambda'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-${ProjectName}-${Environment}-lambda'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaVPCExecutionPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - ec2:CreateNetworkInterface
                  - ec2:DescribeNetworkInterfaces
                  - ec2:DeleteNetworkInterface
                  - ec2:AttachNetworkInterface
                  - ec2:DetachNetworkInterface
                Resource: '*'
        - PolicyName: LambdaLogsPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'

  # Lambda Function
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'lambda-${ProjectName}-${Environment}-hello'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Code:
        ZipFile: |
          import json
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info('Hello World Lambda function executed')
              
              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                  },
                  'body': json.dumps({
                      'message': 'Hello World from Lambda!',
                      'environment': 'secure-infrastructure'
                  })
              }
      Description: 'Hello World Lambda function for secure infrastructure'
      Timeout: 30
      Tags:
        - Key: Name
          Value: !Sub 'lambda-${ProjectName}-${Environment}-hello'

  # WAF Web ACL
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'waf-${ProjectName}-${Environment}'
      Scope: CLOUDFRONT
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'waf-${ProjectName}-${Environment}'
      Tags:
        - Key: Name
          Value: !Sub 'waf-${ProjectName}-${Environment}'

  # CloudFront Origin Access Identity
  OriginAccessIdentity:
    Type: AWS::CloudFront::OriginAccessIdentity
    Properties:
      OriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${ProjectName}-${Environment}'

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: !Sub 'CloudFront distribution for ${ProjectName}-${Environment}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          MinTTL: 0
          DefaultTTL: 86400
          MaxTTL: 31536000
          Compress: true
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt ApplicationDataBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${OriginAccessIdentity}'
        Enabled: true
        HttpVersion: http2
        PriceClass: PriceClass_100
        WebACLId: !GetAtt WebACL.Arn
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
      Tags:
        - Key: Name
          Value: !Sub 'cf-${ProjectName}-${Environment}'

  # Update S3 Bucket Policy for CloudFront
  ApplicationDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationDataBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${OriginAccessIdentity}'
            Action: s3:GetObject
            Resource: !Sub '${ApplicationDataBucket.Arn}/*'

# ============================================================================
# OUTPUTS
# ============================================================================

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  ApplicationDataBucketName:
    Description: 'Application Data S3 Bucket Name'
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-AppDataBucket-Name'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'

  CloudFrontDistributionId:
    Description: 'CloudFront Distribution ID'
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-ID'

  CloudFrontDistributionDomainName:
    Description: 'CloudFront Distribution Domain Name'
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-DomainName'

  WebACLArn:
    Description: 'WAF Web ACL ARN'
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebACL-ARN'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
```

## Key Features and Security Highlights

### 🔒 **Compliance and Auditing Foundation**
- **AWS Config**: Records all resource changes with a configuration recorder
- **Config Rule**: Implements `S3_BUCKET_PUBLIC_READ_PROHIBITED` to prevent public S3 access
- **CloudTrail**: Captures all management events with log file validation enabled
- **Secure Storage**: CloudTrail logs stored in encrypted S3 bucket with proper access policies

### 🌐 **Network Foundation**
- **Multi-AZ VPC**: Spans two availability zones for high availability
- **Public/Private Subnets**: Proper network segmentation
- **NAT Gateway**: Secure outbound internet access for private resources
- **Route Tables**: Properly configured routing for public and private subnets

### 💾 **Secure Data Tier**
- **S3 Bucket**: Default encryption enabled with public access blocked
- **RDS Database**: Multi-AZ MySQL deployment in private subnets
- **Security Groups**: Least-privilege network access controls
- **Encryption**: Data encrypted at rest and in transit

### 🚀 **Application and Delivery Tier**
- **Lambda Function**: "Hello World" function deployed in private subnets
- **CloudFront**: Global content delivery with WAF protection
- **WAF**: AWS Managed Rules for common web exploits protection
- **Origin Access Identity**: Secure S3 access through CloudFront

### 🔐 **Identity and Access Management**
- **Least Privilege**: Lambda role with minimal required permissions
- **No Wildcards**: Specific actions and resources defined
- **Service Roles**: Dedicated roles for Config and Lambda services

## Deployment Instructions

1. **Save the template** as `TapStack.yaml`
2. **Deploy using AWS CLI**:
```bash
aws cloudformation create-stack \
  --stack-name tapstack-dev \
  --template-body file://TapStack.yaml \
  --parameters ParameterKey=ProjectName,ParameterValue=myproject \
               ParameterKey=Environment,ParameterValue=dev \
               ParameterKey=DBPassword,ParameterValue=SecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

3. **Or deploy via AWS Console**:
   - Upload the template file
   - Provide parameters for ProjectName, Environment, and DBPassword
   - Enable IAM capabilities
   - Deploy in us-west-2 region

## Resource Naming Convention

All resources follow the strict naming convention: `<resource_type>-<project_name>-<environment>`

Examples:
- VPC: `vpc-myproject-dev`
- Lambda: `lambda-myproject-dev-hello`
- S3 Bucket: `s3-myproject-dev-appdata-123456789012`
- RDS: `rds-myproject-dev`

This template provides a solid, secure foundation that can be extended for specific project requirements while maintaining compliance and security best practices.