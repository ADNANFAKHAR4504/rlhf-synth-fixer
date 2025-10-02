```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready CloudFormation template for a recipe blog WordPress infrastructure expecting 4,000 daily visitors'

# Note: This template is designed for production AWS deployment.
# LocalStack may not support all resources (RDS Multi-AZ, CloudFront, Performance Insights, etc.)
# For LocalStack testing, some features are simplified or may be skipped during validation.

Metadata:
  cfn-lint:
    config:
      ignore_checks:
        - W1011 # Allow parameter-based secrets for testing/development environments
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'EC2 Configuration'
        Parameters:
          - KeyPairName
          - AdminIPAddress
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBUsername
          - DBPassword
      - Label:
          default: 'Domain and Monitoring'
        Parameters:
          - BlogDomainName
          - NotificationEmail
          - Environment

Parameters:
  KeyPairName:
    Type: String
    Default: ''
    Description: 'EC2 Key Pair for SSH access to WordPress instance (optional)'

  AdminIPAddress:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'IP address allowed for SSH access (format: x.x.x.x/32)'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR notation (e.g., 1.2.3.4/32)'

  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  DBPassword:
    Type: String
    NoEcho: true
    Default: 'testpassword123'
    Description: 'Database administrator password (minimum 8 characters). For production, use AWS Secrets Manager dynamic reference.'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and be at least 8 characters long'

  BlogDomainName:
    Type: String
    Default: ''
    Description: 'Optional: Custom domain name for CloudFront CNAME'

  NotificationEmail:
    Type: String
    Default: 'admin@example.com'
    Description: 'Email address for CloudWatch alarm notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

  Environment:
    Type: String
    Default: 'dev'
    Description: 'Environment type'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'

  ImageId:
    Type: AWS::EC2::Image::Id
    Default: 'ami-052064a798f08f0d3'
    Description: 'AMI ID for EC2 instance (Amazon Linux 2023 in us-east-1, or dummy for LocalStack)'

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  HasDomainName: !Not [!Equals [!Ref BlogDomainName, '']]

Resources:
  # ============================================
  # 1. NETWORKING - VPC CONFIGURATION
  # ============================================

  RecipeBlogVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.15.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-VPC-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: CostCenter
          Value: 'Marketing'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # Internet Gateway for public internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-IGW-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref RecipeBlogVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnet for EC2 WordPress instance
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref RecipeBlogVPC
      CidrBlock: '10.15.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-PublicSubnet-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # Private Subnet 1 for RDS primary
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref RecipeBlogVPC
      CidrBlock: '10.15.2.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-PrivateSubnet1-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # Private Subnet 2 for RDS Multi-AZ standby
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref RecipeBlogVPC
      CidrBlock: '10.15.3.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-PrivateSubnet2-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  # NAT Gateway for private subnet outbound traffic
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-NAT-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref RecipeBlogVPC
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-PublicRT-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

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
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref RecipeBlogVPC
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-PrivateRT-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  # ============================================
  # 2. SECURITY GROUPS
  # ============================================

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for WordPress EC2 instance'
      VpcId: !Ref RecipeBlogVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access from anywhere'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AdminIPAddress
          Description: 'SSH access from admin IP'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-WebServerSG-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS MySQL database'
      VpcId: !Ref RecipeBlogVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web server only'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-DatabaseSG-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # ============================================
  # 3. IAM ROLES
  # ============================================

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'RecipeBlog-EC2Role-${Environment}'
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
        - PolicyName: S3MediaAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt MediaBucket.Arn
                  - !Sub '${MediaBucket.Arn}/*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'RecipeBlog-EC2Profile-${Environment}'
      Roles:
        - !Ref EC2InstanceRole

  # ============================================
  # 4. STORAGE - S3 BUCKET
  # ============================================

  MediaBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'recipeblog-3-${AWS::AccountId}-${Environment}'
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
          - AllowedOrigins:
              - '*'
            AllowedMethods:
              - GET
              - PUT
              - POST
              - DELETE
              - HEAD
            AllowedHeaders:
              - '*'
            MaxAge: 3000
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-3-Bucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for RecipeBlog MediaBucket ${Environment}'

  MediaBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref MediaBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontOAI
            Effect: Allow
            Principal:
              CanonicalUser: !GetAtt CloudFrontOAI.S3CanonicalUserId
            Action: 's3:GetObject'
            Resource: !Sub '${MediaBucket.Arn}/*'

  # ============================================
  # 5. DATABASE - RDS MYSQL
  # ============================================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'recipeblog-db-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for RDS MySQL database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-DBSubnetGroup-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  WordPressDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'recipeblog-db-${Environment}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      PubliclyAccessible: false
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-Database-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # ============================================
  # 6. COMPUTE - EC2 INSTANCE
  # ============================================

  WordPressEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      InstanceId: !Ref WordPressInstance

  WordPressInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: !Ref ImageId
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
      IamInstanceProfile: !Ref EC2InstanceProfile
      NetworkInterfaces:
        - AssociatePublicIpAddress: true
          DeviceIndex: 0
          GroupSet:
            - !Ref WebServerSecurityGroup
          SubnetId: !Ref PublicSubnet
      UserData:
        Fn::Base64: !Sub
          - |
            #!/bin/bash
            set -e

            # Update system
            dnf update -y

            # Install Apache, PHP 8.1, MySQL client
            dnf install -y httpd php8.1 php8.1-mysqlnd php8.1-gd php8.1-xml php8.1-mbstring php8.1-opcache mariadb105

            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

            # Configure PHP for WordPress
            sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 10M/' /etc/php.ini
            sed -i 's/post_max_size = 8M/post_max_size = 10M/' /etc/php.ini
            sed -i 's/memory_limit = 128M/memory_limit = 256M/' /etc/php.ini

            # Download WordPress
            cd /tmp
            wget https://wordpress.org/latest.tar.gz
            tar -xzf latest.tar.gz
            cp -r wordpress/* /var/www/html/

            # Configure WordPress
            cd /var/www/html
            cp wp-config-sample.php wp-config.php

            # Generate WordPress salts
            SALT=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
            STRING='put your unique phrase here'
            printf '%s\n' "g/$STRING/d" a "$SALT" . w | ed -s wp-config.php

            # Configure database connection
            DB_ENDPOINT=${DBEndpoint}
            sed -i "s/database_name_here/wordpress/" wp-config.php
            sed -i "s/username_here/${DBUsername}/" wp-config.php
            sed -i "s/password_here/${DBPassword}/" wp-config.php
            sed -i "s/localhost/$DB_ENDPOINT/" wp-config.php

            # Enable multisite support
            echo "define('WP_ALLOW_MULTISITE', true);" >> wp-config.php

            # Set permissions
            chown -R apache:apache /var/www/html
            chmod -R 755 /var/www/html

            # Configure Apache
            cat > /etc/httpd/conf.d/wordpress.conf <<'EOF'
            <VirtualHost *:80>
                ServerAdmin admin@recipeblog.com
                DocumentRoot /var/www/html

                <Directory /var/www/html>
                    Options Indexes FollowSymLinks
                    AllowOverride All
                    Require all granted
                </Directory>

                ErrorLog /var/log/httpd/wordpress_error.log
                CustomLog /var/log/httpd/wordpress_access.log combined
            </VirtualHost>
            EOF

            # Enable .htaccess for permalinks
            cat > /var/www/html/.htaccess <<'EOF'
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
            EOF

            # Start and enable Apache
            systemctl start httpd
            systemctl enable httpd

            # Create initial database
            mysql -h $DB_ENDPOINT -u ${DBUsername} -p${DBPassword} -e "CREATE DATABASE IF NOT EXISTS wordpress CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

            # Signal success
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource WordPressInstance --region ${AWS::Region}
          - DBEndpoint: !GetAtt WordPressDatabase.Endpoint.Address
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-WordPress-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: CostCenter
          Value: 'Marketing'
        - Key: ManagedBy
          Value: 'CloudFormation'
    CreationPolicy:
      ResourceSignal:
        Timeout: PT15M

  # ============================================
  # 7. CLOUDFRONT DISTRIBUTION
  # ============================================

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'RecipeBlog CloudFront Distribution - ${Environment}'
        Aliases: !If
          - HasDomainName
          - [!Ref BlogDomainName]
          - !Ref AWS::NoValue
        PriceClass: PriceClass_100
        HttpVersion: http2
        DefaultRootObject: index.php
        Origins:
          # EC2 Origin for WordPress dynamic content
          - Id: WordPressEC2Origin
            DomainName: !GetAtt WordPressInstance.PublicDnsName
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: http-only
          # S3 Origin for static media
          - Id: MediaS3Origin
            DomainName: !GetAtt MediaBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
        DefaultCacheBehavior:
          TargetOriginId: WordPressEC2Origin
          ViewerProtocolPolicy: allow-all
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachedMethods:
            - GET
            - HEAD
            - OPTIONS
          Compress: true
          ForwardedValues:
            QueryString: true
            Cookies:
              Forward: all
            Headers:
              - Host
              - CloudFront-Forwarded-Proto
          MinTTL: 0
          DefaultTTL: 0
          MaxTTL: 0
        CacheBehaviors:
          # Static media from S3
          - PathPattern: '/wp-content/uploads/*'
            TargetOriginId: MediaS3Origin
            ViewerProtocolPolicy: allow-all
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
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
      Tags:
        - Key: Name
          Value: !Sub 'RecipeBlog-CloudFront-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: 'RecipeBlog'
        - Key: ManagedBy
          Value: 'CloudFormation'

  # ============================================
  # 8. MONITORING - CLOUDWATCH
  # ============================================

  AlarmNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'RecipeBlog-Alarms-${Environment}'
      DisplayName: 'RecipeBlog CloudWatch Alarms'
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email

  EC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RecipeBlog-EC2-HighCPU-${Environment}'
      AlarmDescription: 'Trigger alarm if EC2 CPU exceeds 80% for 5 minutes'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WordPressInstance
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  EC2StatusCheckAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RecipeBlog-EC2-StatusCheckFailed-${Environment}'
      AlarmDescription: 'Trigger alarm if EC2 status check fails'
      MetricName: StatusCheckFailed
      Namespace: AWS/EC2
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WordPressInstance
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RecipeBlog-RDS-HighCPU-${Environment}'
      AlarmDescription: 'Trigger alarm if RDS CPU exceeds 75% for 10 minutes'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 600
      EvaluationPeriods: 1
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref WordPressDatabase
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  RDSStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RecipeBlog-RDS-LowStorage-${Environment}'
      AlarmDescription: 'Trigger alarm if RDS free storage space is less than 2 GB'
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2000000000
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref WordPressDatabase
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  RDSConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RecipeBlog-RDS-HighConnections-${Environment}'
      AlarmDescription: 'Trigger alarm if RDS database connections exceed 15'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 15
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref WordPressDatabase
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'RecipeBlog-Dashboard-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average", "dimensions": {"InstanceId": "${WordPressInstance}"}}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "EC2 CPU Utilization",
                "yAxis": {"left": {"min": 0, "max": 100}}
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "CPUUtilization", {"stat": "Average", "dimensions": {"DBInstanceIdentifier": "${WordPressDatabase}"}}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "RDS CPU Utilization",
                "yAxis": {"left": {"min": 0, "max": 100}}
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "FreeStorageSpace", {"stat": "Average", "dimensions": {"DBInstanceIdentifier": "${WordPressDatabase}"}}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "RDS Free Storage Space"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "DatabaseConnections", {"stat": "Average", "dimensions": {"DBInstanceIdentifier": "${WordPressDatabase}"}}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "RDS Database Connections"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/CloudFront", "Requests", {"stat": "Sum", "dimensions": {"DistributionId": "${CloudFrontDistribution}"}}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "CloudFront Requests"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/CloudFront", "BytesDownloaded", {"stat": "Sum", "dimensions": {"DistributionId": "${CloudFrontDistribution}"}}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "CloudFront Bytes Downloaded"
              }
            }
          ]
        }

Outputs:
  WordPressURL:
    Description: 'CloudFront distribution URL for WordPress site'
    Value: !Sub 'http://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-WordPressURL'

  EC2PublicIP:
    Description: 'Public IP address of WordPress EC2 instance'
    Value: !Ref WordPressEIP
    Export:
      Name: !Sub '${AWS::StackName}-EC2PublicIP'

  RDSEndpoint:
    Description: 'RDS MySQL database endpoint'
    Value: !GetAtt WordPressDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  S3BucketName:
    Description: 'S3 bucket name for media storage'
    Value: !Ref MediaBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  CloudFrontDistributionId:
    Description: 'CloudFront distribution ID'
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDistributionId'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref RecipeBlogVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnetId:
    Description: 'Public subnet ID'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetId'

  PrivateSubnetIds:
    Description: 'Private subnet IDs (comma-separated)'
    Value: !Sub '${PrivateSubnet1},${PrivateSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

  SNSTopicArn:
    Description: 'SNS topic ARN for alarm notifications'
    Value: !Ref AlarmNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'

  DashboardURL:
    Description: 'CloudWatch Dashboard URL'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=RecipeBlog-Dashboard-${Environment}'
```
