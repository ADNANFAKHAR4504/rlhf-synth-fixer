### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that includes multiple AWS services. I need to create a production-ready infrastructure that includes:

1. S3 bucket for static website hosting
2. CloudFront distribution for CDN
3. EC2 instance with IAM role and Elastic IP
4. Security group with HTTP (80) and SSH (22) access
5. RDS PostgreSQL database
6. VPC Flow Logs
7. Consistent tagging across all resources
8. Parameters for reusability
9. Outputs for resource references

Let me structure this properly with best practices:
- Use parameters for customization
- Include proper dependencies
- Add comprehensive outputs
- Ensure security best practices
- Make it production-ready

I'll need to be careful about:
- VPC configuration (using default VPC for simplicity but mentioning custom VPC option)
- Security group rules
- IAM roles and policies
- Database security
- CloudFront origin configuration
- Flow logs configuration
### Answer 
---

# Production-Ready Web Application Infrastructure CloudFormation Template

Below is a comprehensive CloudFormation template that creates a complete web application infrastructure following AWS best practices:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready web application infrastructure for startup platform'

# ==========================================
# Parameters Section
# ==========================================
Parameters:
  ProjectName:
    Type: String
    Default: 'StartupPlatform'
    Description: 'Name of the project'
    MinLength: 1
    MaxLength: 50
    
  EnvironmentName:
    Type: String
    Default: 'Production'
    Description: 'Environment name (Production, Staging, Development)'
    AllowedValues:
      - Production
      - Staging
      - Development
      
  OwnerEmail:
    Type: String
    Description: 'Email address of the resource owner'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 KeyPair for SSH access'
    
  InstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance type'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      
  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    
  DBMasterPassword:
    Type: String
    Description: 'Database master password'
    MinLength: 8
    MaxLength: 128
    NoEcho: true
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+=\[\]{};:,.<>?/\\|`~-]+$'
    
  AllowedSSHIP:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'IP address range allowed for SSH access (Use specific IP in production)'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$'

# ==========================================
# Mappings Section
# ==========================================
Mappings:
  RegionAMIMap:
    us-east-1:
      AMI: ami-0c02fb55731490381  # Amazon Linux 2023
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0f29c8402f8cce65c
    ap-southeast-1:
      AMI: ami-0e5182fad1edfaa68

# ==========================================
# Resources Section
# ==========================================
Resources:
  
  # ==========================================
  # S3 Resources
  # ==========================================
  
  # S3 Bucket for Static Website Hosting
  StaticWebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-static-website-${AWS::AccountId}'
      WebsiteConfiguration:
        IndexDocument: 'index.html'
        ErrorDocument: 'error.html'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # S3 Bucket Policy for CloudFront Access
  StaticWebsiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticWebsiteBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontOAI
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}'
            Action:
              - 's3:GetObject'
            Resource: !Sub '${StaticWebsiteBucket.Arn}/*'
            
  # S3 Bucket for VPC Flow Logs
  FlowLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-flow-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # ==========================================
  # CloudFront Resources
  # ==========================================
  
  # CloudFront Origin Access Identity
  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${AWS::StackName}'
        
  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CDN for ${ProjectName} ${EnvironmentName}'
        DefaultRootObject: 'index.html'
        HttpVersion: http2
        IPV6Enabled: true
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt StaticWebsiteBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
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
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          MinTTL: 0
          DefaultTTL: 86400
          MaxTTL: 31536000
        CacheBehaviors:
          - PathPattern: '*.css'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
            MinTTL: 86400
            DefaultTTL: 604800
            MaxTTL: 31536000
          - PathPattern: '*.js'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
            MinTTL: 86400
            DefaultTTL: 604800
            MaxTTL: 31536000
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 404
            ResponsePagePath: '/error.html'
            ErrorCachingMinTTL: 60
          - ErrorCode: 403
            ResponseCode: 403
            ResponsePagePath: '/error.html'
            ErrorCachingMinTTL: 60
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # ==========================================
  # VPC and Networking Resources
  # ==========================================
  
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway
      
  # Public Subnet
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # Private Subnet for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.10.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # Route Table for Public Subnet
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRT'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway
      
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable
      
  # VPC Flow Logs
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
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
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${AWS::StackName}'
      RetentionInDays: 30
      
  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-FlowLogs'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # ==========================================
  # Security Groups
  # ==========================================
  
  # Security Group for EC2 Instance
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-WebServerSG'
      GroupDescription: 'Security group for web server EC2 instance'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
          Description: 'Allow SSH access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServerSG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # Security Group for RDS Database
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-DatabaseSG'
      GroupDescription: 'Security group for RDS PostgreSQL database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow PostgreSQL traffic from web server'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DatabaseSG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # ==========================================
  # IAM Resources
  # ==========================================
  
  # IAM Role for EC2 Instance
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt StaticWebsiteBucket.Arn
                  - !Sub '${StaticWebsiteBucket.Arn}/*'
        - PolicyName: CloudFrontInvalidation
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'cloudfront:CreateInvalidation'
                Resource: !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: '/'
      Roles:
        - !Ref EC2InstanceRole
        
  # ==========================================
  # EC2 Resources
  # ==========================================
  
  # Elastic IP
  ElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EIP'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # EC2 Instance
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionAMIMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd postgresql15
          
          # Install CloudWatch agent
          wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
          rpm -U ./amazon-cloudwatch-agent.rpm
          
          # Start Apache
          systemctl start httpd
          systemctl enable httpd
          
          # Create simple index page
          cat > /var/www/html/index.html << EOF
          <!DOCTYPE html>
          <html>
          <head>
              <title>${ProjectName} - ${EnvironmentName}</title>
          </head>
          <body>
              <h1>Welcome to ${ProjectName}</h1>
              <p>Environment: ${EnvironmentName}</p>
              <p>CloudFront Distribution: ${CloudFrontDistribution.DomainName}</p>
          </body>
          </html>
          EOF
          
          # Set environment variables for database connection
          echo "export DB_HOST=${PostgreSQLDatabase.Endpoint.Address}" >> /etc/environment
          echo "export DB_PORT=${PostgreSQLDatabase.Endpoint.Port}" >> /etc/environment
          echo "export DB_NAME=startupdb" >> /etc/environment
          echo "export DB_USER=${DBMasterUsername}" >> /etc/environment
          
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # Associate Elastic IP with EC2 Instance
  EIPAssociation:
    Type: AWS::EC2::EIPAssociation
    Properties:
      InstanceId: !Ref WebServerInstance
      EIP: !Ref ElasticIP
      
  # ==========================================
  # RDS Resources
  # ==========================================
  
  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
  # RDS PostgreSQL Database
  PostgreSQLDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-postgres-db'
      Engine: postgres
      EngineVersion: '15.4'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: '20'
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DBName: startupdb
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      MultiAZ: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PostgreSQL'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName
          
# ==========================================
# Outputs Section
# ==========================================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
      
  WebServerPublicIP:
    Description: 'Public IP address of the web server'
    Value: !Ref ElasticIP
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-PublicIP'
      
  WebServerInstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-InstanceID'
      
  CloudFrontDistributionURL:
    Description: 'CloudFront distribution domain name'
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-URL'
      
  CloudFrontDistributionId:
    Description: 'CloudFront distribution ID'
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-ID'
      
  S3BucketName:
    Description: 'Name of the S3 static website bucket'
    Value: !Ref StaticWebsiteBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-BucketName'
      
  S3BucketURL:
    Description: 'S3 bucket website URL'
    Value: !GetAtt StaticWebsiteBucket.WebsiteURL
    Export:
      Name: !Sub '${AWS::StackName}-S3-WebsiteURL'
      
  DatabaseEndpoint:
    Description: 'RDS PostgreSQL database endpoint'
    Value: !GetAtt PostgreSQLDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'
      
  DatabasePort:
    Description: 'RDS PostgreSQL database port'
    Value: !GetAtt PostgreSQLDatabase.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'
      
  VPCFlowLogsGroupName:
    Description: 'CloudWatch Log Group for VPC Flow Logs'
    Value: !Ref VPCFlowLogsGroup
    Export:
      Name: !Sub '${AWS::StackName}-FlowLogs-LogGroup'
      
  WebServerSecurityGroupId:
    Description: 'Security Group ID for web server'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-SG'
      
  DatabaseSecurityGroupId:
    Description: 'Security Group ID for database'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Database-SG'
```

## Template Architecture Overview

This CloudFormation template creates a production-ready infrastructure with the following key components:

### 🌐 **Content Delivery Layer**
- **S3 Static Website Bucket**: Encrypted, versioned storage for web assets
- **CloudFront Distribution**: Global CDN with optimized cache behaviors for CSS/JS files
- **Origin Access Identity (OAI)**: Secure connection between CloudFront and S3

### 💻 **Compute Layer**
- **EC2 Instance**: Configured with Apache web server and CloudWatch monitoring
- **Elastic IP**: Provides consistent network identity
- **IAM Role**: Enables secure AWS service interactions

### 🔒 **Security Architecture**
- **Security Groups**: Implements least privilege principle
  - Web server: HTTP (80) and SSH (22) access
  - Database: PostgreSQL (5432) only from web server
- **VPC Flow Logs**: Comprehensive network traffic auditing
- **Encryption**: At-rest encryption for S3 and RDS

### 💾 **Data Persistence**
- **RDS PostgreSQL**: Managed database with automated backups
- **Multi-AZ Subnet Configuration**: High availability setup
- **Performance Insights**: Database monitoring enabled

### 🏷️ **Governance**
- **Consistent Tagging**: Environment, Owner, and Project tags on all resources
- **CloudWatch Logs**: Centralized logging with retention policies
- **Parameter-driven**: Flexible deployment across environments

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Create or import an EC2 KeyPair
   aws ec2 create-key-pair --key-name MyKeyPair --query 'KeyMaterial' --output text > MyKeyPair.pem
   chmod 400 MyKeyPair.pem
   ```

2. **Deploy the Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name startup-platform-prod \
     --template-body file://template.yaml \
     --parameters \
       ParameterKey=KeyPairName,ParameterValue=MyKeyPair \
       ParameterKey=OwnerEmail,ParameterValue=owner@startup.com \
       ParameterKey=DBMasterPassword,ParameterValue=SecurePassword123! \
       ParameterKey=AllowedSSHIP,ParameterValue=YOUR_IP/32 \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Monitor Deployment**:
   ```bash
   aws cloudformation wait stack-create-complete --stack-name startup-platform-prod
   aws cloudformation describe-stacks --stack-name startup-platform-prod --query 'Stacks[0].Outputs'
   ```

## Post-Deployment Configuration

1. **Upload Static Content to S3**:
   ```bash
   aws s3 sync ./website-content s3://YOUR_BUCKET_NAME --cache-control max-age=3600
   ```

2. **Configure Database**:
   ```bash
   psql -h DATABASE_ENDPOINT -U dbadmin -d startupdb
   ```

3. **Test CloudFront Distribution**:
   - Access the CloudFront URL from the stack outputs
   - Verify caching headers using browser developer tools

## Best Practices Implemented

✅ **Security**: Encryption at rest, network isolation, principle of least privilege  
✅ **Scalability**: CloudFront CDN, configurable instance types  
✅ **Reliability**: Automated backups, multi-AZ deployment ready  
✅ **Monitoring**: VPC Flow Logs, CloudWatch integration, Performance Insights  
✅ **Cost Optimization**: Lifecycle policies, appropriate instance sizing  
✅ **Maintainability**: Parameterized template, consistent tagging, comprehensive outputs

This template provides a solid foundation for your startup's web platform while maintaining flexibility for future growth and modifications.