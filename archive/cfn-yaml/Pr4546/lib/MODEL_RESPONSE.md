```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Environment - Complete Security Configuration Template'

Parameters:
  VpcCidrBlock:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
  
  SshAllowedCidr:
    Type: String
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
  
  DbInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
  
  DbMasterUsername:
    Type: String
    Default: 'admin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  DomainName:
    Type: String
    Description: 'Domain name for ACM certificate (e.g., example.com)'
    AllowedPattern: '^(\*\.)?(((?!-)[A-Za-z0-9-]{0,62}[A-Za-z0-9])\.)+((?!-)[A-Za-z0-9-]{1,62}[A-Za-z0-9])$'
  
  Owner:
    Type: String
    Description: 'Owner tag value'
    Default: 'SecurityTeam'
  
  Project:
    Type: String
    Description: 'Project tag value'
    Default: 'SecureInfrastructure'
  
  CostCenter:
    Type: String
    Description: 'Cost Center tag value'
    Default: 'IT-Security'
  
  Environment:
    Type: String
    Description: 'Environment tag value'
    Default: 'Production'
    AllowedValues:
      - Development
      - Staging
      - Production

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.11.0/24'

Resources:
  ### KMS KEYS ###
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
              - 'kms:DecryptDataKey*'
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
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Environment
          Value: !Ref Environment

  S3KmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-s3-key'
      TargetKeyId: !Ref S3KmsKey

  ### NETWORKING ###
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-1'
        - Key: Owner
          Value: !Ref Owner

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-2'
        - Key: Owner
          Value: !Ref Owner

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-1'
        - Key: Owner
          Value: !Ref Owner

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-2'
        - Key: Owner
          Value: !Ref Owner

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-rt'
        - Key: Owner
          Value: !Ref Owner

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-rt-1'
        - Key: Owner
          Value: !Ref Owner

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-rt-2'
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

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

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  ### SECURITY GROUPS ###
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb-sg'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SshAllowedCidr
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ec2-sg'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-rds-sg'
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  ### DATA PROTECTION - S3 BUCKETS ###
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-cloudtrail-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref S3KmsKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: ArchiveOldLogs
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            ExpirationInDays: 365
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

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
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  ### CLOUDTRAIL ###
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-trail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsLogging: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values: 
                - 'arn:aws:s3:::*/+/*'
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogRole.Arn
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${AWS::StackName}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt S3KmsKey.Arn

  CloudTrailLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  ### SECRETS MANAGER ###
  DbMasterSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-rds-master-password'
      Description: 'RDS Master Password'
      GenerateSecretString:
        SecretStringTemplate: !Sub |
          {
            "username": "${DbMasterUsername}"
          }
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref S3KmsKey
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  SecretRDSInstanceAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DbMasterSecret
      TargetId: !Ref RDSInstance
      TargetType: AWS::RDS::DBInstance

  ### DATABASE ###
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db-instance'
      DBInstanceClass: !Ref DbInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Sub '{{resolve:secretsmanager:${DbMasterSecret}::username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DbMasterSecret}::password}}'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref S3KmsKey
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  ### IAM ROLES ###
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt CloudTrailBucket.Arn
                  - !Sub '${CloudTrailBucket.Arn}/*'
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  ### COMPUTE - AUTO SCALING ###
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-launch-template'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref S3KmsKey
              DeleteOnTermination: true
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            # Install web server for ALB health checks
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Secure Instance in ${AWS::Region}</h1>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-instance'
              - Key: Owner
                Value: !Ref Owner
              - Key: Project
                Value: !Ref Project
              - Key: CostCenter
                Value: !Ref CostCenter
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-volume'
              - Key: Owner
                Value: !Ref Owner

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref TargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg-instance'
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref Project
          PropagateAtLaunch: true

  ### APPLICATION LOAD BALANCER ###
  ACMCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          HostedZoneId: !Ref AWS::NoValue
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: CostCenter
          Value: !Ref CostCenter

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificate

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ### WAF ###
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-web-acl'
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
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: SQLInjectionRule
          Priority: 2
          Statement:
            SqliMatchStatement:
              FieldToMatch:
                AllQueryArguments: {}
              TextTransformations:
                - Priority: 0
                  Type: URL_DECODE
                - Priority: 1
                  Type: HTML_ENTITY_DECODE
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLInjectionRule
        - Name: XSSRule
          Priority: 3
          Statement:
            XssMatchStatement:
              FieldToMatch:
                AllQueryArguments: {}
              TextTransformations:
                - Priority: 0
                  Type: URL_DECODE
                - Priority: 1
                  Type: HTML_ENTITY_DECODE
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: XSSRule
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-web-acl'
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WAFWebACL.Arn

  ### MONITORING & COMPLIANCE ###
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${AWS::StackName}-config-recorder'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-config-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref S3KmsKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${AWS::StackName}-delivery-channel'
      S3BucketName: !Ref ConfigBucket

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'
      Tags:
        - Key: Owner
          Value: !Ref Owner

  S3BucketPublicReadProhibited:
    Type: AWS::Config::ConfigRule
    DependsOn:
      - ConfigRecorder
      - ConfigDeliveryChannel
    Properties:
      ConfigRuleName: s3-bucket-public-read-prohibited
      Description: 'Checks that S3 buckets do not allow public read access'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_READ_PROHIBITED

  EncryptedVolumes:
    Type: AWS::Config::ConfigRule
    DependsOn:
      - ConfigRecorder
      - ConfigDeliveryChannel
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: 'Checks whether EBS volumes are encrypted'
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

  ### CLOUDWATCH ALARMS ###
  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: RootAccountUsage
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      MetricTransformations:
        - MetricNamespace: CloudTrailMetrics
          MetricName: RootAccountUsage
          MetricValue: '1'
          DefaultValue: 0

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-root-account-usage'
      AlarmDescription: 'Alert on root account usage'
      MetricName: RootAccountUsage
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  IAMPolicyChangesMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterName: IAMPolicyChanges
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.eventName=DeleteGroupPolicy) || ($.eventName=DeleteRolePolicy) || ($.eventName=DeleteUserPolicy) || ($.eventName=PutGroupPolicy) || ($.eventName=PutRolePolicy) || ($.eventName=PutUserPolicy) || ($.eventName=CreatePolicy) || ($.eventName=DeletePolicy) || ($.eventName=CreatePolicyVersion) || ($.eventName=DeletePolicyVersion) || ($.eventName=AttachRolePolicy) || ($.eventName=DetachRolePolicy) || ($.eventName=AttachUserPolicy) || ($.eventName=DetachUserPolicy) || ($.eventName=AttachGroupPolicy) || ($.eventName=DetachGroupPolicy) }'
      MetricTransformations:
        - MetricNamespace: CloudTrailMetrics
          MetricName: IAMPolicyChanges
          MetricValue: '1'
          DefaultValue: 0

  IAMPolicyChangesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-iam-policy-changes'
      AlarmDescription: 'Alert on IAM policy changes'
      MetricName: IAMPolicyChanges
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-alb-dns'

  CloudTrailBucketName:
    Description: 'CloudTrail S3 Bucket Name'
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-cloudtrail-bucket'

  ConfigBucketName:
    Description: 'AWS Config S3 Bucket Name'
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-config-bucket'

  RDSEndpoint:
    Description: 'RDS Instance Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-rds-endpoint'

  WAFWebACLId:
    Description: 'WAF Web ACL ID'
    Value: !Ref WAFWebACL
    Export:
      Name: !Sub '${AWS::StackName}-waf-acl-id'
```