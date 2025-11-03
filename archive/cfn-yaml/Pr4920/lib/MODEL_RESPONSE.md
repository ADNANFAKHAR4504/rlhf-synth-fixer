### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template for a financial services company. Let me break down the key requirements:

1. **Secure Network Foundation**:
   - VPC with CIDR 10.0.0.0/16 in us-east-1
   - Auto-scaling for EC2 instances
   - Remove default VPCs (this can't be done via CloudFormation, it's an account-level action)

2. **IAM**:
   - Least privilege roles and policies
   - MFA enforcement (this is typically done via SCP or IAM policies, not CloudFormation directly)

3. **Data Protection**:
   - S3 buckets with versioning, SSE-S3, block public access
   - DynamoDB with PITR
   - Lambda with encrypted env vars

4. **High Availability**:
   - RDS Multi-AZ with logging and backups
   - ELB with HTTPS only
   - CloudFront with HTTPS

5. **Security Monitoring**:
   - Security groups with specific IP ranges
   - AWS Config for IAM monitoring
   - CloudTrail with encrypted logs

6. **Operational Excellence**:
   - AWS-managed encryption
   - Log retention policies

I'll create a comprehensive CloudFormation template that addresses all these requirements. The template will be modular and use parameters for flexibility.
### Answer 
---

# FinSecure Bank - Project Nova Infrastructure Template

I'll create a comprehensive CloudFormation template that addresses all your requirements for a secure, compliant financial services infrastructure. This template follows AWS best practices and incorporates all the security controls you've specified.

## CloudFormation Template: `finsecure_infrastructure.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'FinSecure Bank - Project Nova - Secure Infrastructure for Financial Services'

Parameters:
  EnvironmentName:
    Description: Environment name prefix
    Type: String
    Default: 'ProjectNova'
    
  CorporateIPRange:
    Description: IP range for corporate network access
    Type: String
    Default: '203.0.113.0/24'
    
  KeyPairName:
    Description: EC2 Key Pair for SSH access
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be an existing EC2 KeyPair
    
  DBMasterUsername:
    Description: Database master username
    Type: String
    Default: 'dbadmin'
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    
  DBMasterPassword:
    Description: Database master password
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9!@#$%^&*()_+]*'
    ConstraintDescription: Must contain 8-41 alphanumeric characters and special characters

Mappings:
  AWSRegionToAMI:
    us-east-1:
      AMIID: ami-0c02fb55731490381  # Amazon Linux 2 AMI

Resources:
  # ============================================
  # NETWORKING INFRASTRUCTURE
  # ============================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'
        - Key: Compliance
          Value: 'PCI-DSS'
        - Key: Project
          Value: 'Nova'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ2'

  # Database Subnets
  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.20.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-Subnet-AZ1'

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.21.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-Subnet-AZ2'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ1'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ2'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ============================================
  # SECURITY GROUPS
  # ============================================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-ALB-SG'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref CorporateIPRange
          Description: HTTPS from corporate network
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB-SG'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-WebServer-SG'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: HTTPS from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref CorporateIPRange
          Description: SSH from corporate network (bastion)
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-SG'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-Database-SG'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: MySQL from web servers
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-SG'

  # ============================================
  # IAM ROLES AND POLICIES
  # ============================================
  
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-Instance-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${AppDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt AppDataBucket.Arn
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: '*'
                Condition:
                  StringEquals:
                    'kms:ViaService':
                      - !Sub 's3.${AWS::Region}.amazonaws.com'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Instance-Role'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-Lambda-Execution-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource:
                  - !GetAtt AuditTable.Arn
        - PolicyName: KMSDecrypt
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: '*'

  # ============================================
  # STORAGE RESOURCES
  # ============================================
  
  AppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-app-data-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-App-Data-Bucket'
        - Key: Compliance
          Value: 'PCI-DSS'

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-cloudtrail-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: RetentionPolicy
            Status: Enabled
            ExpirationInDays: 2555  # 7 years for compliance
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-CloudTrail-Bucket'

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
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

  # ============================================
  # DATABASE RESOURCES
  # ============================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-SubnetGroup'

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-db-instance'
      DBName: finsecuredb
      Engine: mysql
      EngineVersion: '8.0.28'
      DBInstanceClass: db.t3.medium
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-RDS-Instance'
        - Key: Compliance
          Value: 'PCI-DSS'

  # ============================================
  # DYNAMODB TABLE
  # ============================================
  
  AuditTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${EnvironmentName}-audit-table'
      AttributeDefinitions:
        - AttributeName: TransactionId
          AttributeType: S
        - AttributeName: Timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: TransactionId
          KeyType: HASH
        - AttributeName: Timestamp
          KeyType: RANGE
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Audit-Table'
        - Key: Compliance
          Value: 'SOX'

  # ============================================
  # COMPUTE RESOURCES
  # ============================================
  
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentName}-launch-template'
      LaunchTemplateData:
        ImageId: !FindInMap [AWSRegionToAMI, !Ref 'AWS::Region', AMIID]
        InstanceType: t3.medium
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 30
              VolumeType: gp3
              Encrypted: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/config.json
            {
              "metrics": {
                "namespace": "FinSecure/Application",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MemoryUtilization"}
                    ]
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DiskUtilization"}
                    ],
                    "resources": ["/"]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-TG'
      Port: 443
      Protocol: HTTPS
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTPS
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Target-Group'

  # Note: For production, you'll need to add an ACM certificate
  # ALBListener:
  #   Type: AWS::ElasticLoadBalancingV2::Listener
  #   Properties:
  #     DefaultActions:
  #       - Type: forward
  #         TargetGroupArn: !Ref ALBTargetGroup
  #     LoadBalancerArn: !Ref ApplicationLoadBalancer
  #     Port: 443
  #     Protocol: HTTPS
  #     Certificates:
  #       - CertificateArn: !Ref Certificate

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true

  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70

  # ============================================
  # LAMBDA FUNCTION
  # ============================================
  
  AuditLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-audit-processor'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          
          dynamodb = boto3.resource('dynamodb')
          
          def handler(event, context):
              table_name = os.environ['AUDIT_TABLE']
              table = dynamodb.Table(table_name)
              
              # Process audit event
              audit_record = {
                  'TransactionId': event.get('transaction_id'),
                  'Timestamp': int(datetime.now().timestamp()),
                  'Action': event.get('action'),
                  'UserId': event.get('user_id'),
                  'Details': json.dumps(event.get('details', {}))
              }
              
              table.put_item(Item=audit_record)
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Audit record created')
              }
      Environment:
        Variables:
          AUDIT_TABLE: !Ref AuditTable
      KmsKeyArn: !GetAtt LambdaKMSKey.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Audit-Lambda'

  LambdaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for Lambda environment variables encryption
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy-lambda
        Statement:
          - Sid: Enable IAM policies
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda to use the key
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
            Resource: '*'

  # ============================================
  # CLOUDFRONT DISTRIBUTION
  # ============================================
  
  StaticContentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-static-content-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

  OriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${EnvironmentName}'

  StaticContentBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticContentBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${OriginAccessIdentity}'
            Action: 's3:GetObject'
            Resource: !Sub '${StaticContentBucket.Arn}/*'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt StaticContentBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${OriginAccessIdentity}'
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
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
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        HttpVersion: http2
        IPV6Enabled: true
        Tags:
          - Key: Name
            Value: !Sub '${EnvironmentName}-CloudFront'

  # ============================================
  # MONITORING AND COMPLIANCE
  # ============================================
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${EnvironmentName}-trail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${AppDataBucket.Arn}/'
            - Type: AWS::DynamoDB::Table
              Values:
                - !GetAtt AuditTable.Arn
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-CloudTrail'
        - Key: Compliance
          Value: 'SOX'

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${EnvironmentName}-config-recorder'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        ResourceTypes:
          - AWS::IAM::User
          - AWS::IAM::Role
          - AWS::IAM::Policy
          - AWS::EC2::SecurityGroup
          - AWS::EC2::Instance
          - AWS::RDS::DBInstance

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${EnvironmentName}-config-delivery'
      S3BucketName: !Ref ConfigBucket

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-config-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

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
                's3:x-amz-acl': bucket-owner-full-control

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-config-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigBucketAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !GetAtt ConfigBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${ConfigBucket.Arn}/*'

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-High-CPU'
      AlarmDescription: Alert when CPU exceeds 80%
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

  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-DB-Connection'
      AlarmDescription: Alert on database connection issues
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 50
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase

# ============================================
# OUTPUTS
# ============================================

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-VPC-ID'

  VPCCidr:
    Description: VPC CIDR Block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${EnvironmentName}-VPC-CIDR'

  ALBEndpoint:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${EnvironmentName}-ALB-DNS'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${EnvironmentName}-RDS-Endpoint'

  DynamoDBTableName:
    Description: DynamoDB Audit Table Name
    Value: !Ref AuditTable
    Export:
      Name: !Sub '${EnvironmentName}-Audit-Table'

  AppDataBucketName:
    Description: Application Data S3 Bucket
    Value: !Ref AppDataBucket
    Export:
      Name: !Sub '${EnvironmentName}-App-Bucket'

  CloudTrailBucketName:
    Description: CloudTrail S3 Bucket
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${EnvironmentName}-CloudTrail-Bucket'

  CloudFrontDistributionDomain:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${EnvironmentName}-CloudFront-Domain'

  LambdaFunctionArn:
    Description: Audit Lambda Function ARN
    Value: !GetAtt AuditLambdaFunction.Arn
    Export:
      Name: !Sub '${EnvironmentName}-Lambda-ARN'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${EnvironmentName}-ASG-Name'
```

## Validation and Deployment

To validate this template:

```bash
aws cloudformation validate-template --template-body file://finsecure_infrastructure.yaml
```

To deploy the stack:

```bash
aws cloudformation create-stack \
  --stack-name finsecure-project-nova \
  --template-body file://finsecure_infrastructure.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=your-keypair \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Key Features Implemented

### 1. **Security Architecture**
- Multi-layered security groups with restrictive rules
- Encryption at rest for all data storage services
- Private subnets for compute resources
- NAT Gateways for secure outbound internet access
- VPC endpoints can be added for AWS service access

### 2. **Compliance & Monitoring**
- CloudTrail for comprehensive audit logging
- AWS Config for tracking IAM and infrastructure changes
- CloudWatch alarms for proactive monitoring
- Log retention policies aligned with compliance requirements

### 3. **High Availability**
- Multi-AZ deployment across availability zones
- Auto-scaling for EC2 instances
- RDS Multi-AZ for database redundancy
- Application Load Balancer for traffic distribution

### 4. **Data Protection**
- S3 bucket versioning and encryption
- DynamoDB point-in-time recovery
- KMS encryption for Lambda environment variables
- Automated database backups with 30-day retention

### 5. **Operational Excellence**
- Infrastructure as Code for repeatability
- Parameterized template for flexibility
- Comprehensive tagging strategy
- Stack outputs for easy integration

## Additional Considerations

1. **MFA Enforcement**: While the template creates IAM roles, MFA enforcement should be implemented through AWS Organizations SCPs or IAM password policies at the account level.

2. **Default VPC Removal**: This should be done through a separate automation script or manually, as CloudFormation cannot remove default VPCs.

3. **SSL/TLS Certificates**: For production, add ACM certificates for HTTPS listeners on the ALB.

4. **Secrets Management**: Consider using AWS Secrets Manager for database passwords and other sensitive data instead of parameters.

5. **Network ACLs**: Additional network ACLs can be added for defense in depth.

This template provides a robust foundation for your financial services infrastructure with built-in security, compliance, and resilience features that align with PCI DSS and SOX requirements.