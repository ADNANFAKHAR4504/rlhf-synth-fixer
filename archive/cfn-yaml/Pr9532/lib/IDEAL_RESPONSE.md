```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - OwnerEmail
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBInstanceClass
          - DBUsername

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  OwnerEmail:
    Type: String
    Description: 'Team email for resource ownership and notifications'
    Default: 'devops-team@company.com'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

  DBInstanceClass:
    Type: String
    Default: 'db.t3.small'
    Description: 'RDS instance class'
    AllowedValues:
      - 'db.t3.micro'
      - 'db.t3.small'
      - 'db.t3.medium'

  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

Conditions:
  IsProduction: !Equals [!Ref EnvironmentSuffix, 'prod']

Resources:
  # =============================================
  # NETWORKING - VPC AND SUBNETS
  # =============================================
  
  MainVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-main-vpc'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-igw'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref MainVPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-public-subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-public-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-nat-eip-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-nat-gateway-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  # =============================================
  # ROUTE TABLES AND ROUTES
  # =============================================

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-public-rt'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

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
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-rt-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

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

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2

  # =============================================
  # SECURITY GROUPS
  # =============================================

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentSuffix}-alb-sg'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from anywhere'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-alb-sg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentSuffix}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'Allow HTTP from Load Balancer'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/16'
          Description: 'Allow SSH from VPC'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-web-sg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentSuffix}-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'Allow MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-db-sg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  # =============================================
  # DATABASE AND STORAGE (MOVED UP TO RESOLVE DEPENDENCIES)
  # =============================================

  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-app-data-bucket'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  # =============================================
  # IAM ROLES AND POLICIES
  # =============================================

  EC2InstanceRole:
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
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub 'arn:aws:s3:::${ApplicationBucket}/*'
                  - !GetAtt ApplicationBucket.Arn
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationBucket.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # =============================================
  # LOAD BALANCER AND TARGET GROUP
  # =============================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentSuffix}-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-alb'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  WebServerTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentSuffix}-web-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref MainVPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-web-tg'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  # ADD MISSING ALB LISTENER
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebServerTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # =============================================
  # DATABASE
  # =============================================

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentSuffix}-db-secret'
      Description: 'RDS database master user credentials'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '@/\" '  # Exclude invalid characters for RDS passwords
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentSuffix}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-db-subnet-group'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentSuffix}-mysql-db'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.37'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: !If [IsProduction, 7, 1]
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-mysql-db'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  # =============================================
  # MONITORING
  # =============================================

  AlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${EnvironmentSuffix}-alerts'
      DisplayName: !Sub '${EnvironmentSuffix} Infrastructure Alerts'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-alerts-topic'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

  AlertsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref AlertsTopic
      Protocol: email
      Endpoint: !Ref OwnerEmail

  # =============================================
  # DYNAMODB TABLE
  # =============================================

  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'TurnAroundPromptTable${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref OwnerEmail

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref MainVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  ApplicationDataBucketName:
    Description: 'S3 Bucket Name for Application Data'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  TurnAroundPromptTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableName'

  TurnAroundPromptTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'


```