```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with Strong IAM and Resource Security'

# Template Parameters
Parameters:
  BucketPrefix:
    Description: 'Lowercase prefix for S3 bucket names (must be lowercase, no underscores)'
    Type: String
    Default: 'tapstack-uq'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    MinLength: 3
    MaxLength: 37
    ConstraintDescription: 'Must be lowercase alphanumeric with hyphens, 3-37 characters'

  AllowedSSHIP:
    Description: 'IP address range allowed for SSH access (e.g., 203.0.113.0/24)'
    Type: String
    Default: '10.0.0.0/8'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/([0-9]|[1-2][0-9]|3[0-2])$'
    ConstraintDescription: 'Must be a valid IP CIDR range'
  
  AllowedS3AccessIP:
    Description: 'IP address range allowed for S3 bucket access'
    Type: String
    Default: '203.0.113.0/24'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/([0-9]|[1-2][0-9]|3[0-2])$'
    ConstraintDescription: 'Must be a valid IP CIDR range'
  
  DBUsername:
    Description: 'Database master username'
    Type: String
    Default: 'dbadmin'
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  DBPasswordLength:
    Description: 'Length of the auto-generated database password (8-41 characters)'
    Type: Number
    Default: 32
    MinValue: 8
    MaxValue: 41
    ConstraintDescription: 'Password length must be between 8 and 41 characters'

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID from SSM Parameter Store (region-agnostic)

# Resources Section
Resources:
  
  # ===== NETWORKING =====
  # VPC Configuration
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
          Value: Production
  
  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
  
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway
  
  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Type
          Value: Public
  
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Type
          Value: Public
  
  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Type
          Value: Private
  
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Type
          Value: Private
  
  # NAT Gateways for Private Subnets
  EIPForNAT1:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
  
  EIPForNAT2:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
  
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPForNAT1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT1'
  
  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPForNAT2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT2'
  
  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRT'
  
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway
  
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
  
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRT1'
  
  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1
  
  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1
  
  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRT2'
  
  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2
  
  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ===== IAM ROLES AND POLICIES =====
  # EC2 Instance Role
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
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
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
                  - !GetAtt ApplicationDataBucket.Arn
                  - !Sub '${ApplicationDataBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2Role'
  
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole
  
  # IAM Group with MFA Policy
  SecureAdminGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub '${AWS::StackName}-SecureAdmins'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/ReadOnlyAccess'
      Policies:
        - PolicyName: EnforceMFAPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: DenyAllExceptListedIfNoMFA
                Effect: Deny
                NotAction:
                  - 'iam:CreateVirtualMFADevice'
                  - 'iam:DeleteVirtualMFADevice'
                  - 'iam:ListVirtualMFADevices'
                  - 'iam:EnableMFADevice'
                  - 'iam:ResyncMFADevice'
                  - 'iam:ListAccountAliases'
                  - 'iam:ListUsers'
                  - 'iam:ListSSHPublicKeys'
                  - 'iam:ListAccessKeys'
                  - 'iam:ListServiceSpecificCredentials'
                  - 'iam:ListMFADevices'
                  - 'iam:GetAccountSummary'
                  - 'sts:GetSessionToken'
                Resource: '*'
                Condition:
                  BoolIfExists:
                    'aws:MultiFactorAuthPresent': false

  # ===== SECURITY GROUPS =====
  # ALB Security Group
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
          Description: 'HTTPS from anywhere'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP from anywhere (redirect to HTTPS)'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'
  
  # EC2 Instance Security Group
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
          Description: 'SSH from allowed IP range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-SG'
  
  # RDS Security Group
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
          Description: 'MySQL from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-SG'

  # ===== S3 BUCKETS =====
  # Lambda Role for S3 Bucket Cleanup
  EmptyS3BucketLambdaRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: EmptyS3BucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                  - 's3:ListBucketVersions'
                  - 's3:DeleteObject'
                  - 's3:DeleteObjectVersion'
                Resource:
                  - !Sub 'arn:aws:s3:::${AWS::StackName}-*'
                  - !Sub 'arn:aws:s3:::${AWS::StackName}-*/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EmptyS3BucketRole'

  # Lambda Function to Empty S3 Buckets
  EmptyS3BucketLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-EmptyS3Bucket'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt EmptyS3BucketLambdaRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          import boto3
          import cfnresponse
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          s3 = boto3.resource('s3')

          def handler(event, context):
              logger.info(f'Event: {event}')
              bucket_name = event['ResourceProperties'].get('BucketName')

              try:
                  if event['RequestType'] == 'Delete':
                      if bucket_name:
                          logger.info(f'Emptying bucket: {bucket_name}')
                          bucket = s3.Bucket(bucket_name)

                          # Delete all object versions and delete markers
                          bucket.object_versions.all().delete()

                          logger.info(f'Successfully emptied bucket: {bucket_name}')
                      else:
                          logger.warning('No bucket name provided')

                  cfnresponse.send(event, context, cfnresponse.SUCCESS, {})

              except Exception as e:
                  logger.error(f'Error: {str(e)}')
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EmptyS3BucketLambda'

  # CloudTrail Logs Bucket
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${BucketPrefix}-cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
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
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudTrailLogs'

  # Custom Resource to Empty CloudTrail Logs Bucket
  EmptyCloudTrailLogsBucket:
    Type: Custom::EmptyS3Bucket
    Properties:
      ServiceToken: !GetAtt EmptyS3BucketLambda.Arn
      BucketName: !Ref CloudTrailLogsBucket

  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailLogsBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
  
  # Application Data Bucket
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${BucketPrefix}-app-data-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-AppData'

  # Custom Resource to Empty Application Data Bucket
  EmptyApplicationDataBucket:
    Type: Custom::EmptyS3Bucket
    Properties:
      ServiceToken: !GetAtt EmptyS3BucketLambda.Arn
      BucketName: !Ref ApplicationDataBucket

  ApplicationDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowIPAccess
            Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt ApplicationDataBucket.Arn
              - !Sub '${ApplicationDataBucket.Arn}/*'
            Condition:
              IpAddress:
                'aws:SourceIp': !Ref AllowedS3AccessIP

  # ===== CLOUDTRAIL =====
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailLogsBucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-Trail'
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${ApplicationDataBucket.Arn}/'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudTrail'

  # ===== CLOUDWATCH LOG GROUPS =====
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}'
      RetentionInDays: 30

  # ===== EC2 INSTANCES =====
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t2.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-Instance'
              - Key: Environment
                Value: Production
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            
            # Install and configure CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Create CloudWatch agent config
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${EC2LogGroup}",
                        "log_stream_name": "{instance_id}/messages"
                      },
                      {
                        "file_path": "/var/log/secure",
                        "log_group_name": "${EC2LogGroup}",
                        "log_stream_name": "{instance_id}/secure"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  
  EC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Instance1'
  
  EC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Instance2'

  # ===== RDS DATABASE =====
  # Secrets Manager Secret for RDS Password
  RDSMasterPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-rds-master-password'
      Description: 'Auto-generated master password for RDS MySQL database'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: !Ref DBPasswordLength
        ExcludeCharacters: '"@/\\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-Secret'

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DBSubnetGroup'
  
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSMasterPasswordSecret}:SecretString:password}}'
      AllocatedStorage: '20'
      StorageType: gp2
      StorageEncrypted: true
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
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS'

  # ===== APPLICATION LOAD BALANCER =====
  # NOTE: SSL Certificate removed - no DNS validation available
  # To add HTTPS support, import a certificate to ACM manually and reference it

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB'
  
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Targets:
        - Id: !Ref EC2Instance1
        - Id: !Ref EC2Instance2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-TG'
  
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ===== AWS CONFIG =====
  # NOTE: AWS Config resources removed - account already has Config enabled
  # The account has reached the maximum of 1 delivery channel per region
  # To enable Config logging for this stack, use the existing Config setup

  ConfigBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${BucketPrefix}-config-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # Custom Resource to Empty Config Bucket
  EmptyConfigBucket:
    Type: Custom::EmptyS3Bucket
    Properties:
      ServiceToken: !GetAtt EmptyS3BucketLambda.Arn
      BucketName: !Ref ConfigBucket

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
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

  # NOTE: AWS Config Recorder, Delivery Channel, and Config Rules removed
  # Reason: Account already has AWS Config enabled (max 1 delivery channel per region)
  # The ConfigBucket above can still be used by the existing Config setup if needed
  # To add Config Rules, use the existing Config Recorder in your AWS account

# Outputs
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
  
  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'
  
  CloudTrailName:
    Description: 'CloudTrail Name'
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'
  
  RDSEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'
  
  ApplicationDataBucketName:
    Description: 'Application Data S3 Bucket Name'
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-AppBucket'
  
  SecureAdminGroupName:
    Description: 'IAM Group Name for Secure Admins'
    Value: !Ref SecureAdminGroup
    Export:
      Name: !Sub '${AWS::StackName}-AdminGroup'

  # Network Outputs
  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-IGW'

  NATGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NATGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NAT1'

  NATGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NATGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NAT2'

  # EC2 Outputs
  EC2Instance1Id:
    Description: 'EC2 Instance 1 ID'
    Value: !Ref EC2Instance1
    Export:
      Name: !Sub '${AWS::StackName}-EC2-1'

  EC2Instance2Id:
    Description: 'EC2 Instance 2 ID'
    Value: !Ref EC2Instance2
    Export:
      Name: !Sub '${AWS::StackName}-EC2-2'

  EC2InstanceRoleArn:
    Description: 'EC2 Instance Role ARN'
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Role-ARN'

  # RDS Outputs
  RDSSecretArn:
    Description: 'RDS Master Password Secret ARN'
    Value: !Ref RDSMasterPasswordSecret
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Secret-ARN'

  DBSubnetGroupName:
    Description: 'DB Subnet Group Name'
    Value: !Ref DBSubnetGroup
    Export:
      Name: !Sub '${AWS::StackName}-DB-SubnetGroup'

  # S3 Outputs
  CloudTrailBucketName:
    Description: 'CloudTrail Logs Bucket Name'
    Value: !Ref CloudTrailLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Bucket'

  ConfigBucketName:
    Description: 'Config Logs Bucket Name'
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-Config-Bucket'

  # Security Group Outputs
  ALBSecurityGroupId:
    Description: 'ALB Security Group ID'
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-SG'

  EC2SecurityGroupId:
    Description: 'EC2 Security Group ID'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2-SG'

  RDSSecurityGroupId:
    Description: 'RDS Security Group ID'
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-RDS-SG'

  # Load Balancer Outputs
  TargetGroupArn:
    Description: 'Target Group ARN'
    Value: !Ref TargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-TG-ARN'

  ALBArn:
    Description: 'Application Load Balancer ARN'
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-ALB-ARN'

  # CloudWatch Outputs
  EC2LogGroupName:
    Description: 'EC2 CloudWatch Log Group Name'
    Value: !Ref EC2LogGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2-LogGroup'
```