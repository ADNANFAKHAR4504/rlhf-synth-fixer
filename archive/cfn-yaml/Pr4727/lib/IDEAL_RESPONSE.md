```yml
# patient-portal-secure-foundation.yaml
# CloudFormation template for HIPAA-compliant Healthcare Patient Portal infrastructure
# All resources follow nova-prod-* naming convention for production environment

AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure foundation for Healthcare Patient Portal with HIPAA compliance'

Parameters:
  TrustedIP:
    Type: String
    Default: '203.0.113.0/32'
    Description: 'Trusted IP address for bastion SSH access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
    ConstraintDescription: 'Must be a valid IP CIDR range'
  
  AlertEmail:
    Type: String
    Default: 'admin@example.com'
    Description: 'Email address for security alerts'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    ConstraintDescription: 'Must be a valid email address'

  ACMCertificateArn:
    Type: String
    Description: 'ACM certificate ARN for the ALB HTTPS listener'
    Default: ''
    AllowedPattern: '^$|arn:aws:acm:[a-z0-9-]+:\d{12}:certificate\/[A-Za-z0-9-]+'
    ConstraintDescription: 'Provide a valid ACM certificate ARN or leave empty'

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
    DatabaseSubnet1:
      CIDR: '10.0.20.0/24'
    DatabaseSubnet2:
      CIDR: '10.0.21.0/24'

Conditions:
  HasACMCertificateArn: !Not [ !Equals [ !Ref ACMCertificateArn, '' ] ]
  NoACMCertificateArn: !Equals [ !Ref ACMCertificateArn, '' ]

Resources:
  # Secrets Manager Secret for RDS password
  NovaRDSPasswordSecret:
    Type: 'AWS::SecretsManager::Secret'
    Properties:
      Description: 'Master password for RDS database'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: "\"@/\\"
      KmsKeyId: !Ref NovaEncryptionKey
      Tags:
        - Key: Name
          Value: 'nova-prod-database-secret'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'


  # KMS Key for encryption across all resources
  NovaEncryptionKey:
    Type: 'AWS::KMS::Key'
    Properties:
      Description: 'nova-prod encryption key for all resources'
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
          - Sid: Allow EC2 to use key for EBS encryption
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - 'kms:CreateGrant'
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'ec2.${AWS::Region}.amazonaws.com'
          - Sid: Allow CloudWatch Logs to encrypt logs
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
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*'
          - Sid: Allow VPC Flow Logs to encrypt logs
            Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow RDS to use key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow SNS to use key
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: 'nova-prod-encryption-key'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # VPC for secure networking
  NovaVPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'nova-prod-vpc'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private Subnets for Application
  NovaPrivateSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'nova-prod-private-subnet-1'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPrivateSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'nova-prod-private-subnet-2'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Database Subnets
  NovaDatabaseSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'nova-prod-database-subnet-1'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaDatabaseSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: 'nova-prod-database-subnet-2'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Public Subnets for ALB and NAT Gateways
  NovaPublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'nova-prod-public-subnet-1'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'nova-prod-public-subnet-2'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Internet Gateway
  NovaInternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: 'nova-prod-igw'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Attach Internet Gateway to VPC
  NovaInternetGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      InternetGatewayId: !Ref NovaInternetGateway
      VpcId: !Ref NovaVPC

  # NAT Gateways for Private Subnets
  NovaNATGateway1EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: NovaInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'nova-prod-nat-gateway-1-eip'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaNATGateway2EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: NovaInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'nova-prod-nat-gateway-2-eip'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaNATGateway1:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NovaNATGateway1EIP.AllocationId
      SubnetId: !Ref NovaPublicSubnet1
      Tags:
        - Key: Name
          Value: 'nova-prod-nat-gateway-1'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaNATGateway2:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NovaNATGateway2EIP.AllocationId
      SubnetId: !Ref NovaPublicSubnet2
      Tags:
        - Key: Name
          Value: 'nova-prod-nat-gateway-2'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Route Tables
  NovaPublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: 'nova-prod-public-routes'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: NovaInternetGatewayAttachment
    Properties:
      RouteTableId: !Ref NovaPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref NovaInternetGateway

  NovaPublicSubnetRouteTableAssociation1:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref NovaPublicSubnet1
      RouteTableId: !Ref NovaPublicRouteTable

  NovaPublicSubnetRouteTableAssociation2:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref NovaPublicSubnet2
      RouteTableId: !Ref NovaPublicRouteTable

  NovaPrivateRouteTable1:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: 'nova-prod-private-routes-1'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPrivateRoute1:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref NovaPrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NovaNATGateway1

  NovaPrivateSubnetRouteTableAssociation1:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref NovaPrivateSubnet1
      RouteTableId: !Ref NovaPrivateRouteTable1

  NovaDatabaseSubnetRouteTableAssociation1:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref NovaDatabaseSubnet1
      RouteTableId: !Ref NovaPrivateRouteTable1

  NovaPrivateRouteTable2:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: 'nova-prod-private-routes-2'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPrivateRoute2:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref NovaPrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NovaNATGateway2

  NovaPrivateSubnetRouteTableAssociation2:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref NovaPrivateSubnet2
      RouteTableId: !Ref NovaPrivateRouteTable2

  NovaDatabaseSubnetRouteTableAssociation2:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref NovaDatabaseSubnet2
      RouteTableId: !Ref NovaPrivateRouteTable2

  # S3 Buckets
  NovaAppDataBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref NovaEncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'nova-prod-app-data-bucket'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPatientDocumentsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref NovaEncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldVersions'
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Name
          Value: 'nova-prod-patient-documents'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Compliance
          Value: 'HIPAA'

  # S3 Bucket for CloudTrail logs
  NovaCloudTrailBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref NovaEncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: GOVERNANCE
            Days: 2555  # 7 years retention for HIPAA compliance
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'TransitionToIA'
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: STANDARD_IA
              - TransitionInDays: 180
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: 'nova-prod-audit-logs'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Compliance
          Value: 'HIPAA'

  # S3 Bucket Policy for CloudTrail
  NovaCloudTrailBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref NovaCloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt NovaCloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${NovaCloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'


  # IAM Role for EC2 instances with minimal permissions
  NovaEC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
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
        - PolicyName: MinimalS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: 
                  - !Sub '${NovaAppDataBucket.Arn}/*'
                  - !Sub '${NovaPatientDocumentsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt NovaEncryptionKey.Arn
              - Effect: Allow
                Action:
                  - 'kms:Encrypt'
                Resource: !GetAtt NovaEncryptionKey.Arn
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref NovaRDSPasswordSecret
      Tags:
        - Key: Name
          Value: 'nova-prod-ec2-role'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Instance Profile for EC2 Role
  NovaEC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Roles:
        - !Ref NovaEC2Role

  # Launch Template for Application EC2 instances
  NovaAppLaunchTemplate:
    Type: 'AWS::EC2::LaunchTemplate'
    Properties:
      LaunchTemplateName: 'nova-prod-patient-app-lt'
      LaunchTemplateData:
        IamInstanceProfile:
          Name: !Ref NovaEC2InstanceProfile
        InstanceType: t3.small
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        SecurityGroupIds:
          - !Ref NovaApplicationSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
        UserData:
          Fn::Base64: |
            #!/bin/bash
            # Quick setup for health checks
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create health check endpoint immediately
            echo "OK" > /var/www/html/health
            echo "<h1>Nova Healthcare Portal</h1>" > /var/www/html/index.html
            
            # Update packages in background (non-blocking)
            nohup yum update -y &
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: 'nova-prod-app-instance'
              - Key: team
                Value: '2'
              - Key: iac-rlhf-amazon
                Value: 'true'
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: 'nova-prod-app-volume'
              - Key: team
                Value: '2'
              - Key: iac-rlhf-amazon
                Value: 'true'

  # Auto Scaling Group for Application
  NovaAppAutoScalingGroup:
    Type: 'AWS::AutoScaling::AutoScalingGroup'
    Properties:
      VPCZoneIdentifier:
        - !Ref NovaPrivateSubnet1
        - !Ref NovaPrivateSubnet2
      MinSize: '2'
      MaxSize: '4'
      DesiredCapacity: '2'
      LaunchTemplate:
        LaunchTemplateId: !Ref NovaAppLaunchTemplate
        Version: !GetAtt NovaAppLaunchTemplate.LatestVersionNumber
      TargetGroupARNs:
        - !Ref NovaALBTargetGroup
      Tags:
        - Key: Name
          Value: 'nova-prod-app-asg'
          PropagateAtLaunch: true
        - Key: team
          Value: '2'
          PropagateAtLaunch: true
        - Key: iac-rlhf-amazon
          Value: 'true'
          PropagateAtLaunch: true

  # Application Load Balancer
  NovaApplicationLoadBalancer:
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    Properties:
      Name: 'nova-prod-patient-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref NovaALBSecurityGroup
      Subnets:
        - !Ref NovaPublicSubnet1
        - !Ref NovaPublicSubnet2
      Tags:
        - Key: Name
          Value: 'nova-prod-alb'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaWAFAssociation:
    Type: 'AWS::WAFv2::WebACLAssociation'
    Properties:
      ResourceArn: !Ref NovaApplicationLoadBalancer
      WebACLArn: !GetAtt NovaWAFWebACL.Arn

  # Target Group for application instances
  NovaALBTargetGroup:
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup'
    Properties:
      Name: 'nova-prod-patient-app-tg'
      TargetType: instance
      Protocol: HTTP
      Port: 80
      VpcId: !Ref NovaVPC
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPort: '80'
      HealthCheckPath: '/health'
      HealthCheckIntervalSeconds: 15
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200-399'
      Tags:
        - Key: Name
          Value: 'nova-prod-app-tg'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # HTTPS Listener for ALB
  NovaALBHTTPSListener:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Condition: HasACMCertificateArn
    Properties:
      LoadBalancerArn: !Ref NovaApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref NovaALBTargetGroup

  # HTTP listener that redirects to HTTPS when ACM cert is provided
  NovaALBHTTPRedirectListener:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Condition: HasACMCertificateArn
    Properties:
      LoadBalancerArn: !Ref NovaApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301

  # HTTP listener that forwards to target group when ACM cert isn't provided
  NovaALBHTTPForwardListener:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Condition: NoACMCertificateArn
    Properties:
      LoadBalancerArn: !Ref NovaApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref NovaALBTargetGroup

  # AWS WAF Configuration
  NovaWAFWebACL:
    Type: 'AWS::WAFv2::WebACL'
    Properties:
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: 'AWSManagedRulesCommonRuleSet'
          Priority: 1
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'CommonRuleSetMetric'
        - Name: 'AWSManagedRulesKnownBadInputsRuleSet'
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'KnownBadInputsMetric'
        - Name: 'AWSManagedRulesSQLiRuleSet'
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'SQLiRuleSetMetric'
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: 'nova-prod-patient-waf-metric'
      Tags:
        - Key: Name
          Value: 'nova-prod-waf-acl'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # IAM Group with MFA enforcement
  NovaDevelopersGroup:
    Type: 'AWS::IAM::Group'
    Properties:
      Policies:
        - PolicyName: EnforceMFA
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowViewAccountInfo
                Effect: Allow
                Action:
                  - 'iam:GetAccountPasswordPolicy'
                  - 'iam:ListVirtualMFADevices'
                  - 'iam:ListAccountAliases'
                Resource: '*'
              - Sid: AllowManageOwnPasswords
                Effect: Allow
                Action:
                  - 'iam:ChangePassword'
                  - 'iam:GetUser'
                Resource: 'arn:aws:iam::*:user/${aws:username}'
              - Sid: AllowManageOwnMFA
                Effect: Allow
                Action:
                  - 'iam:CreateVirtualMFADevice'
                  - 'iam:DeleteVirtualMFADevice'
                  - 'iam:EnableMFADevice'
                  - 'iam:ResyncMFADevice'
                  - 'iam:DeactivateMFADevice'
                Resource:
                  - 'arn:aws:iam::*:mfa/${aws:username}'
                  - 'arn:aws:iam::*:user/${aws:username}'
              - Sid: DenyAllExceptUnlessSignedInWithMFA
                Effect: Deny
                NotAction:
                  - 'iam:CreateVirtualMFADevice'
                  - 'iam:EnableMFADevice'
                  - 'iam:GetUser'
                  - 'iam:ListMFADevices'
                  - 'iam:ListVirtualMFADevices'
                  - 'iam:ResyncMFADevice'
                  - 'sts:GetSessionToken'
                Resource: '*'
                Condition:
                  BoolIfExists:
                    'aws:MultiFactorAuthPresent': 'false'

  # Security Groups
  NovaBastionSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: 'nova-prod-patient-bastion-sg'
      GroupDescription: 'Security group for bastion host - SSH from trusted IP only'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIP
          Description: 'SSH from trusted IP'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: 'nova-prod-bastion-sg'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Bastion host in public subnet with encrypted EBS
  NovaBastionInstance:
    Type: 'AWS::EC2::Instance'
    Properties:
      SubnetId: !Ref NovaPublicSubnet1
      InstanceType: t3.micro
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      IamInstanceProfile: !Ref NovaEC2InstanceProfile
      SecurityGroupIds:
        - !Ref NovaBastionSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 8
            VolumeType: gp3
            Encrypted: true
      Tags:
        - Key: Name
          Value: 'nova-prod-bastion'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaALBSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: 'nova-prod-patient-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS from internet'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP for redirect/health checks if needed'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref NovaApplicationSecurityGroup
          Description: 'HTTP to application instances'
        - IpProtocol: tcp
          FromPort: 1024
          ToPort: 65535
          DestinationSecurityGroupId: !Ref NovaApplicationSecurityGroup
          Description: 'Ephemeral ports for health checks'
      Tags:
        - Key: Name
          Value: 'nova-prod-alb-sg'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaApplicationSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: 'nova-prod-patient-application-sg'
      GroupDescription: 'Security group for application instances'
      VpcId: !Ref NovaVPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: 'nova-prod-application-sg'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaApplicationSGIngressFromALB:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      GroupId: !Ref NovaApplicationSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref NovaALBSecurityGroup
      Description: 'HTTP from ALB after TLS termination'

  NovaApplicationSGHealthCheckFromALB:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      GroupId: !Ref NovaApplicationSecurityGroup
      IpProtocol: tcp
      FromPort: 1024
      ToPort: 65535
      SourceSecurityGroupId: !Ref NovaALBSecurityGroup
      Description: 'Ephemeral ports for ALB health checks if needed'

  NovaApplicationSGIngressFromBastion:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      GroupId: !Ref NovaApplicationSecurityGroup
      IpProtocol: tcp
      FromPort: 22
      ToPort: 22
      SourceSecurityGroupId: !Ref NovaBastionSecurityGroup
      Description: 'SSH from bastion'

  NovaDatabaseSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: 'nova-prod-patient-database-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref NovaApplicationSecurityGroup
          Description: 'MySQL from application instances'
      Tags:
        - Key: Name
          Value: 'nova-prod-database-sg'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # DB Subnet Group for RDS
  NovaDBSubnetGroup:
    Type: 'AWS::RDS::DBSubnetGroup'
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds:
        - !Ref NovaDatabaseSubnet1
        - !Ref NovaDatabaseSubnet2
      Tags:
        - Key: Name
          Value: 'nova-prod-db-subnet-group'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # RDS Instance with encryption
  NovaRDSInstance:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      AllocatedStorage: 100
      DBInstanceClass: 'db.t3.medium'
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Sub '{{resolve:secretsmanager:${NovaRDSPasswordSecret}::username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${NovaRDSPasswordSecret}::password}}'
      DBSubnetGroupName: !Ref NovaDBSubnetGroup
      VPCSecurityGroups:
        - !Ref NovaDatabaseSecurityGroup
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      StorageEncrypted: true
      KmsKeyId: !Ref NovaEncryptionKey
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub 'nova-prod-patient-database-${AWS::Region}'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaDatabaseSecretAttachment:
    Type: 'AWS::SecretsManager::SecretTargetAttachment'
    Properties:
      SecretId: !Ref NovaRDSPasswordSecret
      TargetId: !Ref NovaRDSInstance
      TargetType: 'AWS::RDS::DBInstance'


  # CloudWatch Log Group for VPC Flow Logs
  NovaVPCFlowLogsGroup:
    Type: 'AWS::Logs::LogGroup'
    DependsOn: NovaEncryptionKey
    Metadata:
      cfn-lint:
        config:
          ignore_checks:
            - W3005
    Properties:
      RetentionInDays: 30
      KmsKeyId: !GetAtt NovaEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: 'nova-prod-vpc-flow-logs-group'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # IAM Role for VPC Flow Logs
  NovaVPCFlowLogsRole:
    Type: 'AWS::IAM::Role'
    Properties:
      Tags:
        - Key: Name
          Value: 'nova-prod-vpc-flow-logs-role'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: VPCFlowLogsDeliveryRolePolicy
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

  # VPC Flow Logs
  NovaVPCFlowLogs:
    Type: 'AWS::EC2::FlowLog'
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref NovaVPC
      TrafficType: 'ALL'
      LogDestinationType: 'cloud-watch-logs'
      LogGroupName: !Ref NovaVPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt NovaVPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: 'nova-prod-vpc-flow-logs'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # SNS Topic for security notifications
  NovaSecurityNotificationsTopic:
    Type: 'AWS::SNS::Topic'
    Properties:
      DisplayName: 'Security Alerts for Healthcare Portal'
      KmsMasterKeyId: !Ref NovaEncryptionKey
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: 'nova-prod-security-alerts'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # CloudTrail for auditing
  NovaCloudTrail:
    Type: 'AWS::CloudTrail::Trail'
    DependsOn: NovaCloudTrailBucketPolicy
    Properties:
      TrailName: 'nova-prod-patient-cloudtrail'
      S3BucketName: !Ref NovaCloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref NovaEncryptionKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub 'arn:aws:s3:::${NovaAppDataBucket}/*'
                - !Sub 'arn:aws:s3:::${NovaPatientDocumentsBucket}/*'
      InsightSelectors:
        - InsightType: ApiCallRateInsight
      Tags:
        - Key: Name
          Value: 'nova-prod-cloudtrail'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # EventBridge Rules for Security Monitoring
  NovaIAMChangesRule:
    Type: 'AWS::Events::Rule'
    Properties:
      Tags:
        - Key: Name
          Value: 'nova-prod-iam-changes-rule'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'
      Description: 'Detect IAM policy and security group changes'
      EventPattern:
        source:
          - 'aws.iam'
          - 'aws.ec2'
        detail-type:
          - 'AWS API Call via CloudTrail'
        detail:
          eventSource:
            - 'iam.amazonaws.com'
            - 'ec2.amazonaws.com'
          eventName:
            - 'PutUserPolicy'
            - 'PutRolePolicy'
            - 'PutGroupPolicy'
            - 'CreateRole'
            - 'DeleteRole'
            - 'CreateUser'
            - 'DeleteUser'
            - 'AuthorizeSecurityGroupIngress'
            - 'AuthorizeSecurityGroupEgress'
            - 'RevokeSecurityGroupIngress'
            - 'RevokeSecurityGroupEgress'
      State: ENABLED
      Targets:
        - Arn: !Ref NovaSecurityNotificationsTopic
          Id: 'SecurityNotificationTarget'

  NovaSecurityGroupChangeRule:
    Type: 'AWS::Events::Rule'
    Properties:
      Description: 'Detect security group changes for compliance'
      EventPattern:
        source:
          - 'aws.ec2'
        detail-type:
          - 'AWS API Call via CloudTrail'
        detail:
          eventSource:
            - 'ec2.amazonaws.com'
          eventName:
            - 'AuthorizeSecurityGroupIngress'
            - 'AuthorizeSecurityGroupEgress'
            - 'RevokeSecurityGroupIngress'
            - 'RevokeSecurityGroupEgress'
            - 'CreateSecurityGroup'
            - 'DeleteSecurityGroup'
      State: ENABLED
      Targets:
        - Arn: !Ref NovaSecurityNotificationsTopic
          Id: 'SecurityAlertTarget'
          InputTransformer:
            InputPathsMap:
              eventName: '$.detail.eventName'
              userName: '$.detail.userIdentity.userName'
              sgId: '$.detail.requestParameters.groupId'
              time: '$.time'
            InputTemplate: |
              "SECURITY ALERT: Security Group Change Detected"
              "Time: <time>"
              "User: <userName>"
              "Action: <eventName>"
              "Security Group: <sgId>"
              "Please review this change immediately for compliance."

  # SNS Topic Policy for CloudWatch Events
  NovaSecurityNotificationsTopicPolicy:
    Type: 'AWS::SNS::TopicPolicy'
    Properties:
      Topics:
        - !Ref NovaSecurityNotificationsTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AllowEventBridge'
            Effect: Allow
            Principal:
              Service: 'events.amazonaws.com'
            Action: 'SNS:Publish'
            Resource: !Ref NovaSecurityNotificationsTopic

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref NovaVPC
    Export:
      Name: 'nova-prod-vpc-id'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref NovaEncryptionKey
    Export:
      Name: 'nova-prod-kms-key-id'

  AppDataBucket:
    Description: 'S3 Bucket for application data'
    Value: !Ref NovaAppDataBucket
    Export:
      Name: 'nova-prod-app-data-bucket'

  EC2Role:
    Description: 'IAM Role for EC2 instances'
    Value: !Ref NovaEC2Role
    Export:
      Name: 'nova-prod-ec2-role'

  RDSEndpoint:
    Description: 'RDS Instance Endpoint'
    Value: !GetAtt NovaRDSInstance.Endpoint.Address
    Export:
      Name: 'nova-prod-rds-endpoint'

  SecurityNotificationsTopic:
    Description: 'SNS Topic for security notifications'
    Value: !Ref NovaSecurityNotificationsTopic
    Export:
      Name: 'nova-prod-security-notifications-topic'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt NovaCloudTrail.Arn
    Export:
      Name: 'nova-prod-cloudtrail-arn'

  ApplicationSecurityGroupId:
    Description: 'Application Security Group ID'
    Value: !Ref NovaApplicationSecurityGroup
    Export:
      Name: 'nova-prod-app-sg-id'

  PatientDocumentsBucketName:
    Description: 'Patient Documents S3 Bucket Name'
    Value: !Ref NovaPatientDocumentsBucket
    Export:
      Name: 'nova-prod-patient-documents-bucket'

  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt NovaApplicationLoadBalancer.DNSName
    Export:
      Name: 'nova-prod-alb-dns'

  ALBArn:
    Description: 'Application Load Balancer ARN'
    Value: !Ref NovaApplicationLoadBalancer
    Export:
      Name: 'nova-prod-alb-arn'

  SecurityAlertTopicArn:
    Description: 'SNS Topic ARN for Security Alerts'
    Value: !Ref NovaSecurityNotificationsTopic
    Export:
      Name: 'nova-prod-security-alert-topic'

  VPCFlowLogsGroupName:
    Description: 'VPC Flow Logs CloudWatch Log Group Name'
    Value: !Ref NovaVPCFlowLogsGroup
    Export:
      Name: 'nova-prod-vpc-flow-logs-group'

  DatabaseSecretArn:
    Description: 'Secrets Manager ARN for the RDS master credential'
    Value: !Ref NovaRDSPasswordSecret
    Export:
      Name: 'nova-prod-db-secret-arn'

  BastionSecurityGroupId:
    Description: 'Bastion host Security Group ID'
    Value: !Ref NovaBastionSecurityGroup
    Export:
      Name: 'nova-prod-bastion-sg-id'

  ALBSecurityGroupId:
    Description: 'Application Load Balancer Security Group ID'
    Value: !Ref NovaALBSecurityGroup
    Export:
      Name: 'nova-prod-alb-sg-id'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref NovaDatabaseSecurityGroup
    Export:
      Name: 'nova-prod-db-sg-id'

  CloudTrailBucketName:
    Description: 'CloudTrail S3 bucket name'
    Value: !Ref NovaCloudTrailBucket
    Export:
      Name: 'nova-prod-cloudtrail-bucket'

  RDSInstanceIdentifier:
    Description: 'RDS Instance Identifier'
    Value: !Ref NovaRDSInstance
    Export:
      Name: 'nova-prod-rds-identifier'
```