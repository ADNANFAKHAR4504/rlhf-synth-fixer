```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: |
  Production-ready infrastructure for Recipe Blog with WordPress
  Prerequisites:
    - Valid EC2 KeyPair in the deployment region
    - Verified email address for CloudWatch notifications
  Expected Traffic: 4,000 daily visitors
  Architecture: WordPress on EC2 + RDS MySQL Multi-AZ + S3 + CloudFront

Metadata:
  AWS::CloudFormation::Designer:
    Designer: {}
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - Environment
      - Label:
          default: 'Security Configuration'
        Parameters:
          - KeyPairName
          - AdminIPAddress
          - DBUsername
          - DBPassword
      - Label:
          default: 'Domain Configuration'
        Parameters:
          - BlogDomainName
      - Label:
          default: 'Notification Configuration'
        Parameters:
          - NotificationEmail

Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment name for resource tagging

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access to WordPress instance
    ConstraintDescription: Must be a valid EC2 KeyPair

  AdminIPAddress:
    Type: String
    Description: IP address for SSH access (format x.x.x.x/32)
    AllowedPattern: ^(\d{1,3}\.){3}\d{1,3}/32$
    ConstraintDescription: Must be a valid IP CIDR range of the form x.x.x.x/32

  DBUsername:
    Type: String
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: ^[a-zA-Z][a-zA-Z0-9]*$
    Description: Database admin username
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: ^[a-zA-Z0-9!@#$%^&*()_+=-]*$
    Description: Database admin password (minimum 8 characters)
    ConstraintDescription: Must contain only alphanumeric characters and symbols

  BlogDomainName:
    Type: String
    Default: ''
    Description: Optional custom domain name for CloudFront distribution
    AllowedPattern: ^$|^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$
    ConstraintDescription: Must be a valid domain name or empty

  NotificationEmail:
    Type: String
    Description: Email address for CloudWatch alarm notifications
    AllowedPattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
    ConstraintDescription: Must be a valid email address

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381
    us-west-1:
      AMI: ami-0b2d8d1abb76a53d8
    us-west-2:
      AMI: ami-0a54c984b9f908c81
    eu-west-1:
      AMI: ami-0fc15d50d39e4503c
    eu-central-1:
      AMI: ami-0a1ee2fb28fe05df3
    ap-southeast-1:
      AMI: ami-0dc2d3e4c0f9ebd18

  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      DBInstanceClass: db.t3.micro
      BackupRetention: 1
      MultiAZ: false
    staging:
      InstanceType: t3.micro
      DBInstanceClass: db.t3.micro
      BackupRetention: 3
      MultiAZ: false
    prod:
      InstanceType: t3.small
      DBInstanceClass: db.t3.micro
      BackupRetention: 7
      MultiAZ: true

Resources:
  # ==================== NETWORKING ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.15.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-VPC
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: RecipeBlog
        - Key: ManagedBy
          Value: CloudFormation

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-IGW
        - Key: Environment
          Value: !Ref Environment

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnet for EC2
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.15.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-PublicSubnet
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.15.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-PrivateSubnet1
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.15.3.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-PrivateSubnet2
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-NAT-EIP
        - Key: Environment
          Value: !Ref Environment

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-NAT
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-PublicRouteTable
        - Key: Environment
          Value: !Ref Environment

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-PrivateRouteTable
        - Key: Environment
          Value: !Ref Environment

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # ==================== SECURITY GROUPS ====================
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for WordPress web server
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AdminIPAddress
          Description: Allow SSH from admin IP
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-WebServerSG
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS MySQL database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow MySQL from web server
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-DatabaseSG
        - Key: Environment
          Value: !Ref Environment

  # ==================== IAM ROLES ====================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3MediaAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub ${MediaBucket.Arn}
                  - !Sub ${MediaBucket.Arn}/*
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                Resource: !Sub arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${AWS::StackName}/*
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-EC2Role
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2Role

  # ==================== S3 STORAGE ====================
  MediaBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub ${AWS::StackName}-media-${AWS::AccountId}
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: STANDARD_IA
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 365
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders:
              - '*'
            AllowedMethods:
              - GET
              - PUT
              - POST
              - DELETE
              - HEAD
            AllowedOrigins:
              - '*'
            MaxAge: 3600
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-MediaBucket
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: WordPress Media Storage

  MediaBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref MediaBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontOAI
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}
            Action:
              - s3:GetObject
            Resource: !Sub ${MediaBucket.Arn}/*

  # ==================== DATABASE ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-DBSubnetGroup
        - Key: Environment
          Value: !Ref Environment

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: Custom parameter group for MySQL 8.0
      Family: mysql8.0
      Parameters:
        max_connections: 100
        character_set_server: utf8mb4
        collation_server: utf8mb4_unicode_ci
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}'
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-DBParameterGroup
        - Key: Environment
          Value: !Ref Environment

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub ${AWS::StackName}-mysql
      DBName: wordpress
      Engine: mysql
      EngineVersion: '8.0.35'
      DBInstanceClass:
        !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      AllocatedStorage: 20
      MaxAllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod:
        !FindInMap [EnvironmentConfig, !Ref Environment, BackupRetention]
      PreferredBackupWindow: 03:00-04:00
      PreferredMaintenanceWindow: sun:04:00-sun:05:00
      MultiAZ: !FindInMap [EnvironmentConfig, !Ref Environment, MultiAZ]
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      DeletionProtection: true
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-Database
        - Key: Environment
          Value: !Ref Environment

  # Store DB endpoint in Parameter Store
  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub /${AWS::StackName}/db/endpoint
      Type: String
      Value: !GetAtt RDSDatabase.Endpoint.Address
      Description: RDS Database endpoint

  # ==================== COMPUTE ====================
  WordPressEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-WordPress-EIP
        - Key: Environment
          Value: !Ref Environment

  WordPressInstance:
    Type: AWS::EC2::Instance
    DependsOn:
      - RDSDatabase
      - DBEndpointParameter
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType:
        !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
      KeyName: !Ref KeyPairName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PublicSubnet
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          # Log output for debugging
          exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

          # Update system
          yum update -y

          # Install required packages
          yum install -y httpd wget unzip amazon-cloudwatch-agent
          amazon-linux-extras install -y php8.1
          yum install -y php-mysqlnd php-gd php-xml php-mbstring php-json php-fpm

          # Configure PHP
          sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 10M/' /etc/php.ini
          sed -i 's/post_max_size = 8M/post_max_size = 10M/' /etc/php.ini
          sed -i 's/memory_limit = 128M/memory_limit = 256M/' /etc/php.ini

          # Start Apache
          systemctl start httpd
          systemctl enable httpd

          # Install WP-CLI
          wget https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
          chmod +x wp-cli.phar
          mv wp-cli.phar /usr/local/bin/wp

          # Download WordPress
          cd /var/www/html
          wget https://wordpress.org/latest.tar.gz
          tar -xzf latest.tar.gz
          mv wordpress/* .
          rm -rf wordpress latest.tar.gz

          # Set permissions
          chown -R apache:apache /var/www/html
          chmod -R 755 /var/www/html

          # Generate WordPress salts
          SALTS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)

          # Configure WordPress
          cat > /var/www/html/wp-config.php <<EOF
          <?php
          define('DB_NAME', 'wordpress');
          define('DB_USER', '${DBUsername}');
          define('DB_PASSWORD', '${DBPassword}');
          define('DB_HOST', '${RDSDatabase.Endpoint.Address}');
          define('DB_CHARSET', 'utf8mb4');
          define('DB_COLLATE', 'utf8mb4_unicode_ci');

          $SALTS

          \$table_prefix = 'wp_';

          define('WP_DEBUG', false);
          define('WP_DEBUG_LOG', false);
          define('WP_DEBUG_DISPLAY', false);

          // CloudFront support
          if (isset(\$_SERVER['HTTP_CLOUDFRONT_FORWARDED_PROTO'])) {
              \$_SERVER['HTTPS'] = 'on';
          }

          // S3 uploads configuration
          define('S3_UPLOADS_BUCKET', '${MediaBucket}');
          define('S3_UPLOADS_REGION', '${AWS::Region}');

          // Multisite ready
          define('WP_ALLOW_MULTISITE', true);

          if (!defined('ABSPATH')) {
              define('ABSPATH', dirname(__FILE__) . '/');
          }

          require_once(ABSPATH . 'wp-settings.php');
          EOF

          # Configure .htaccess for permalinks
          cat > /var/www/html/.htaccess <<EOF
          # BEGIN WordPress
          <IfModule mod_rewrite.c>
          RewriteEngine On
          RewriteBase /
          RewriteRule ^index\.php$ - [L]
          RewriteCond %{REQUEST_FILENAME} !-f
          RewriteCond %{REQUEST_FILENAME} !-d
          RewriteRule . /index.php [L]
          </IfModule>
          # END WordPress

          # Security headers
          <IfModule mod_headers.c>
          Header set X-Content-Type-Options "nosniff"
          Header set X-Frame-Options "SAMEORIGIN"
          Header set X-XSS-Protection "1; mode=block"
          </IfModule>
          EOF

          # Configure Apache virtual host
          cat > /etc/httpd/conf.d/wordpress.conf <<EOF
          <VirtualHost *:80>
              DocumentRoot /var/www/html
              <Directory /var/www/html>
                  Options Indexes FollowSymLinks
                  AllowOverride All
                  Require all granted
              </Directory>
              
              # Enable compression
              <IfModule mod_deflate.c>
                  AddOutputFilterByType DEFLATE text/plain
                  AddOutputFilterByType DEFLATE text/html
                  AddOutputFilterByType DEFLATE text/xml
                  AddOutputFilterByType DEFLATE text/css
                  AddOutputFilterByType DEFLATE application/xml
                  AddOutputFilterByType DEFLATE application/xhtml+xml
                  AddOutputFilterByType DEFLATE application/rss+xml
                  AddOutputFilterByType DEFLATE application/javascript
                  AddOutputFilterByType DEFLATE application/x-javascript
              </IfModule>
          </VirtualHost>
          EOF

          # Install and configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
          {
            "metrics": {
              "namespace": "RecipeBlog",
              "metrics_collected": {
                "cpu": {
                  "measurement": [
                    {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
                    {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
                  ],
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": [
                    {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
                  ],
                  "metrics_collection_interval": 60,
                  "resources": ["/"]
                },
                "mem": {
                  "measurement": [
                    {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                  ],
```
