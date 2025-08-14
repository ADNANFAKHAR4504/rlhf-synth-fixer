### Below was given as model response:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'IaC - AWS Nova Model Breaking: Comprehensive Security Baseline Template'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'test', 'prod']
    Description: 'Environment type for resource naming and configuration'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
  
  AllowedIPRange:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'Allowed IP range for security group access (avoid 0.0.0.0/0)'
  
  DatabaseUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database master username'
  
  DomainName:
    Type: String
    Default: 'example.com'
    Description: 'Domain name for CloudFront distribution'

Mappings:
  RegionMap:
    us-east-1:
      LoggingBucket: 'aws-cloudtrail-logs-us-east-1'
    us-west-2:
      LoggingBucket: 'aws-cloudtrail-logs-us-west-2'

Resources:
  # ============================================================================
  # 1. IAM LEAST PRIVILEGE - Custom KMS Key for EBS Encryption
  # ============================================================================
  EBSEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer-managed KMS key for EBS encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EBS Service
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'ec2.${AWS::Region}.amazonaws.com'

  EBSEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/ebs-encryption-${Environment}'
      TargetKeyId: !Ref EBSEncryptionKey

  # ============================================================================
  # 6. MANDATORY EBS ENCRYPTION - Enable Default EBS Encryption
  # ============================================================================
  EBSEncryptionByDefault:
    Type: AWS::EC2::EBSEncryptionByDefault
    Properties:
      Encrypted: true

  EBSDefaultKMSKey:
    Type: AWS::EC2::EBSDefaultKMSKey
    Properties:
      KmsKeyId: !Ref EBSEncryptionKey
    DependsOn: EBSEncryptionByDefault

  # ============================================================================
  # 3. PROHIBIT PUBLIC S3 BUCKETS - Account Level Block Public Access
  # ============================================================================
  S3AccountPublicAccessBlock:
    Type: AWS::S3::AccountPublicAccessBlock
    Properties:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true

  # ============================================================================
  # 7. CENTRALIZED CLOUDTRAIL LOGGING
  # ============================================================================
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${Environment}'
      RetentionInDays: 365

  CloudTrailLogStream:
    Type: AWS::Logs::LogStream
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      LogStreamName: !Sub '${AWS::AccountId}_CloudTrail_${AWS::Region}'

  CloudTrailLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'CloudTrailLogsRole-${Environment}'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsRolePolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                Resource: !Sub '${CloudTrailLogGroup}:*'

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${Environment}-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub '${CloudTrailS3Bucket}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailS3Bucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub 'OrganizationTrail-${Environment}'
      S3BucketName: !Ref CloudTrailS3Bucket
      CloudWatchLogsLogGroupArn: !Sub '${CloudTrailLogGroup}:*'
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogsRole.Arn
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: ['arn:aws:s3:::*/*']
    DependsOn: CloudTrailS3BucketPolicy

  # ============================================================================
  # 4. VPC AND FLOW LOGS
  # ============================================================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-${Environment}'

  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'VPCFlowLogsRole-${Environment}'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: VPCFlowLogsDeliveryRolePolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${Environment}'
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
          Value: !Sub 'VPCFlowLogs-${Environment}'

  # ============================================================================
  # SUBNETS
  # ============================================================================
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnet1-${Environment}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnet2-${Environment}'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnet1-${Environment}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnet2-${Environment}'

  # ============================================================================
  # INTERNET GATEWAY AND ROUTING
  # ============================================================================
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${Environment}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PublicRouteTable-${Environment}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  # ============================================================================
  # 13. STRICT SECURITY GROUP RULES
  # ============================================================================
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'WebSecurityGroup-${Environment}'
      GroupDescription: 'Security group for web servers - restrictive rules'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS access from allowed IP range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP access from allowed IP range'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound'
      Tags:
        - Key: Name
          Value: !Sub 'WebSecurityGroup-${Environment}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'DatabaseSecurityGroup-${Environment}'
      GroupDescription: 'Security group for database - only web tier access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'MySQL access from web security group only'
      Tags:
        - Key: Name
          Value: !Sub 'DatabaseSecurityGroup-${Environment}'

  # ============================================================================
  # 11. ELIMINATE DIRECT SSH ACCESS - SSM ROLE FOR EC2
  # ============================================================================
  EC2SSMRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2SSMRole-${Environment}'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Name
          Value: !Sub 'EC2SSMRole-${Environment}'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'EC2InstanceProfile-${Environment}'
      Roles:
        - !Ref EC2SSMRole

  # ============================================================================
  # 15. CENTRALIZED SECRET MANAGEMENT
  # ============================================================================
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'rds-credentials-${Environment}'
      Description: 'RDS Database credentials'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DatabaseUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  DatabaseSecretRotation:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref DatabaseSecret
      RotationLambdaArn: !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:SecretsManagerRDSMySQLRotationSingleUser'
      RotationRules:
        AutomaticallyAfterDays: 30

  # ============================================================================
  # 10. SECURE RDS DEPLOYMENTS
  # ============================================================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'db-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'DBSubnetGroup-${Environment}'

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'database-${Environment}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref EBSEncryptionKey
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      PubliclyAccessible: false
      BackupRetentionPeriod: 7
      MultiAZ: !If [IsProd, true, false]
      DeletionProtection: !If [IsProd, true, false]
      Tags:
        - Key: Name
          Value: !Sub 'RDSDatabase-${Environment}'
    DeletionPolicy: Snapshot

  # ============================================================================
  # 14. ENABLE ALB SESSION STICKINESS
  # ============================================================================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'ALB-${Environment}'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref WebSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'ALB-${Environment}'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'ALBTargetGroup-${Environment}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetGroupAttributes:
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: lb_cookie
        - Key: stickiness.lb_cookie.duration_seconds
          Value: '86400'
      Tags:
        - Key: Name
          Value: !Sub 'ALBTargetGroup-${Environment}'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ============================================================================
  # 12. WEB APPLICATION FIREWALL (WAF)
  # ============================================================================
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'WebACL-${Environment}'
      Scope: REGIONAL
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
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
        - Name: AWSManagedRulesSQLiRuleSet
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'WebACL-${Environment}'
      Tags:
        - Key: Name
          Value: !Sub 'WebACL-${Environment}'

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # ============================================================================
  # 9. ENFORCE CLOUDFRONT ENCRYPTION
  # ============================================================================
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Aliases:
          - !Ref DomainName
        Origins:
          - DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            Id: ALBOrigin
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
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
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        ViewerCertificate:
          AcmCertificateArn: !Ref SSLCertificate
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        WebACLId: !GetAtt WebACL.Arn
      Tags:
        - Key: Name
          Value: !Sub 'CloudFront-${Environment}'

  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub 'SSLCert-${Environment}'

  # ============================================================================
  # 2. ROOT USER MFA - AWS CONFIG RULE
  # ============================================================================
  ConfigServiceRole:
    Type: AWS::IAM::ServiceLinkedRole
    Properties:
      AWSServiceName: config.amazonaws.com

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'ConfigDeliveryChannel-${Environment}'
      S3BucketName: !Ref ConfigS3Bucket

  ConfigS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'aws-config-${Environment}-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

  ConfigS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigS3Bucket
      PolicyDocument:
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub '${ConfigS3Bucket}'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !Sub '${ConfigS3Bucket}'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigS3Bucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'ConfigRecorder-${Environment}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  RootUserMFAConfigRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'root-user-mfa-enabled-${Environment}'
      Description: 'Checks whether MFA is enabled for the root user'
      Source:
        Owner: AWS
        SourceIdentifier: ROOT_USER_MFA_ENABLED
    DependsOn: ConfigurationRecorder

  # ============================================================================
  # 8. RESTRICT VOLUME CREATION VIA ENCRYPTED AMIS - IAM POLICY
  # ============================================================================
  EC2EncryptedAMIPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub 'EC2EncryptedAMIPolicy-${Environment}'
      PolicyDocument:
        Statement:
          - Effect: Deny
            Action: ec2:RunInstances
            Resource: 'arn:aws:ec2:*:*:instance/*'
            Condition:
              Bool:
                'ec2:Encrypted': 'false'
          - Effect: Allow
            Action:
              - ec2:RunInstances
              - ec2:DescribeImages
              - ec2:DescribeInstances
            Resource: '*'
            Condition:
              Bool:
                'ec2:Encrypted': 'true'
      Roles:
        - !Ref EC2SSMRole

Conditions:
  IsProd: !Equals [!Ref Environment, 'prod']

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-VPC-ID'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-DB-Endpoint'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-ALB-DNS'

  CloudFrontDomainName:
    Description: 'CloudFront Distribution Domain Name'
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${Environment}-CloudFront-Domain'

  SecretArn:
    Description: 'Database Secret ARN'
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${Environment}-DB-Secret-ARN'

  WebACLArn:
    Description: 'WAF Web ACL ARN'
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${Environment}-WebACL-ARN'
```