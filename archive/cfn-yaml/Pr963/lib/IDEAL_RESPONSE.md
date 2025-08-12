```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure - Production-Ready Multi-AZ Deployment with Comprehensive Security Controls'

# =============================================================================
# PARAMETERS
# =============================================================================
Parameters:
  Environment:
    Type: String
    Default: 'prod'
    Description: 'Environment name for resource tagging and configuration'

  KeyPairName:
    Type: String
    Default: ''
    Description: 'Optional: EC2 Key Pair name for emergency access'

  DBUsername:
    Type: String
    Default: 'admin'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    Description: 'Database administrator username'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  InstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type for web servers'

  AmiId:
    Description: 'AMI ID for EC2 instances'
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'

# =============================================================================
# CONDITIONS
# =============================================================================
Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  IsProduction: !Equals [!Ref Environment, 'prod']

# =============================================================================
# RESOURCES
# =============================================================================
Resources:
  # ---------------------------------------------------------------------------
  # KMS ENCRYPTION KEYS
  # ---------------------------------------------------------------------------
  MasterEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Master encryption key for secure infrastructure'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow Auto Scaling Service
            Effect: Allow
            Principal:
              Service: autoscaling.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'
          - Sid: Allow EC2 Service
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-master-key'
        - Key: Environment
          Value: !Ref Environment

  MasterKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-master-key'
      TargetKeyId: !Ref MasterEncryptionKey

  # ---------------------------------------------------------------------------
  # VPC AND NETWORKING
  # ---------------------------------------------------------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
        - Key: Environment
          Value: !Ref Environment

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
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Public'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: 'Private'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-1'
        - Key: Environment
          Value: !Ref Environment

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-2'
        - Key: Environment
          Value: !Ref Environment

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway-2'
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-routes'
        - Key: Environment
          Value: !Ref Environment

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub '${AWS::StackName}-private-routes-1'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub '${AWS::StackName}-private-routes-2'
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ---------------------------------------------------------------------------
  # SECURITY GROUPS
  # ---------------------------------------------------------------------------
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers - allows HTTP/HTTPS only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'Allow HTTP from Load Balancer'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'Allow HTTPS from Load Balancer'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP outbound'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS outbound'
        - IpProtocol: tcp
          FromPort: 53
          ToPort: 53
          CidrIp: '0.0.0.0/0'
          Description: 'Allow DNS'
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: '0.0.0.0/0'
          Description: 'Allow DNS'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-webserver-sg'
        - Key: Environment
          Value: !Ref Environment

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
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
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb-sg'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database - allows access from web servers only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow MySQL from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-database-sg'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # IAM ROLES AND POLICIES
  # ---------------------------------------------------------------------------
  WebServerRole:
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}'
        - PolicyName: LoggingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-webserver-role'
        - Key: Environment
          Value: !Ref Environment

  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref WebServerRole

  # IAM Group for Web Server Management
  WebServerGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub '${AWS::StackName}-webserver-group'
      Policies:
        - PolicyName: WebServerManagementPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:DescribeInstances'
                  - 'ec2:DescribeInstanceStatus'
                  - 'autoscaling:DescribeAutoScalingGroups'
                  - 'elasticloadbalancing:DescribeLoadBalancers'
                  - 'elasticloadbalancing:DescribeTargetHealth'
                Resource: '*'

  # ---------------------------------------------------------------------------
  # S3 SECURE BUCKET
  # ---------------------------------------------------------------------------
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref MasterEncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-bucket'
        - Key: Environment
          Value: !Ref Environment

  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref MasterEncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-access-logs-bucket'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # DATABASE INFRASTRUCTURE
  # ---------------------------------------------------------------------------
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: 'Database credentials for secure infrastructure'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref MasterEncryptionKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-secret'
        - Key: Environment
          Value: !Ref Environment

  SecureDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceClass: 'db.t3.small'
      Engine: 'mysql'
      EngineVersion: '8.0.42'
      AllocatedStorage: 20
      StorageType: 'gp3'
      StorageEncrypted: true
      KmsKeyId: !Ref MasterEncryptionKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-database'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # APPLICATION LOAD BALANCER
  # ---------------------------------------------------------------------------
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb'
        - Key: Environment
          Value: !Ref Environment

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: '/health'
      HealthCheckProtocol: HTTP
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-target-group'
        - Key: Environment
          Value: !Ref Environment

  LoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ---------------------------------------------------------------------------
  # WAF CONFIGURATION
  # ---------------------------------------------------------------------------
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-web-acl'
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
            MetricName: KnownBadInputsMetric
        - Name: RateLimitRule
          Priority: 3
          Action:
            Block: {}
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-web-acl'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-web-acl'
        - Key: Environment
          Value: !Ref Environment

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # ---------------------------------------------------------------------------
  # CLOUDWATCH MONITORING
  # ---------------------------------------------------------------------------
  WebServerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}/webserver'
      RetentionInDays: !If [IsProduction, 30, 7]
      KmsKeyId: !GetAtt MasterEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-webserver-logs'
        - Key: Environment
          Value: !Ref Environment

  DatabaseLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/rds/${AWS::StackName}/database'
      RetentionInDays: !If [IsProduction, 30, 7]
      KmsKeyId: !GetAtt MasterEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-database-logs'
        - Key: Environment
          Value: !Ref Environment

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${AWS::StackName}/access'
      RetentionInDays: !If [IsProduction, 30, 7]
      KmsKeyId: !GetAtt MasterEncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-s3-logs'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-high-cpu'
      AlarmDescription: 'Alarm when CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref SNSTopic

  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-db-connections'
      AlarmDescription: 'Alarm when database connections exceed threshold'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref SecureDatabase

  # SNS Topic for Notifications
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-alerts'
      KmsMasterKeyId: !Ref MasterEncryptionKey
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alerts'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # EC2 LAUNCH TEMPLATE AND AUTO SCALING
  # ---------------------------------------------------------------------------
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-launch-template'
      LaunchTemplateData:
        ImageId: !Ref AmiId
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt WebServerInstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeType: gp3
              VolumeSize: 20
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create simple web page
            echo "Hello AWS EC2 - Environment: ${Environment}" > /var/www/html/index.html
            echo "Stack: ${AWS::StackName}" >> /var/www/html/index.html
            
            # Create health check endpoint  
            echo "OK" > /var/www/html/health
            
            # Signal CloudFormation that instance is ready
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-webserver'
              - Key: Environment
                Value: !Ref Environment

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg'
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
    CreationPolicy:
      ResourceSignal:
        Count: 2
        Timeout: PT15M

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerDNS:
    Description: 'DNS name of the Application Load Balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-DNS'

  LoadBalancerURL:
    Description: 'URL of the Application Load Balancer'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-URL'

  DatabaseEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt SecureDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  S3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref MasterEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key'

  WebACLId:
    Description: 'WAF Web ACL ID'
    Value: !GetAtt WebACL.Id
    Export:
      Name: !Sub '${AWS::StackName}-WebACL-ID'

  PublicSubnets:
    Description: 'List of public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnets:
    Description: 'List of private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'
```