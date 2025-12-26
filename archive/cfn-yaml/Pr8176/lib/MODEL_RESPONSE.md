```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Robust and secure AWS environment with VPC, S3, Lambda, and RDS PostgreSQL'

Parameters:
  DBUsername:
    Type: String
    Default: 'postgres'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database master password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

Resources:
  # VPC Configuration
  MyAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: MyApp-VPC
        - Key: Environment
          Value: Production

  # Internet Gateway
  MyAppInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: MyApp-IGW
        - Key: Environment
          Value: Production

  # Attach Internet Gateway to VPC
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyAppVPC
      InternetGatewayId: !Ref MyAppInternetGateway

  # Public Subnets for NAT Gateways
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-west-2a
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: MyApp-Public-Subnet-1
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-west-2b
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: MyApp-Public-Subnet-2
        - Key: Environment
          Value: Production

  # Private Subnets for RDS and Lambda
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-west-2a
      Tags:
        - Key: Name
          Value: MyApp-Private-Subnet-1
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyAppVPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: us-west-2b
      Tags:
        - Key: Name
          Value: MyApp-Private-Subnet-2
        - Key: Environment
          Value: Production

  # NAT Gateway EIPs
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: MyApp-NAT-EIP-1
        - Key: Environment
          Value: Production

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: MyApp-NAT-EIP-2
        - Key: Environment
          Value: Production

  # NAT Gateways
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: MyApp-NAT-Gateway-1
        - Key: Environment
          Value: Production

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: MyApp-NAT-Gateway-2
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyAppVPC
      Tags:
        - Key: Name
          Value: MyApp-Public-RT
        - Key: Environment
          Value: Production

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyAppVPC
      Tags:
        - Key: Name
          Value: MyApp-Private-RT-1
        - Key: Environment
          Value: Production

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyAppVPC
      Tags:
        - Key: Name
          Value: MyApp-Private-RT-2
        - Key: Environment
          Value: Production

  # Routes
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref MyAppInternetGateway

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  # Subnet Route Table Associations
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

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # S3 Bucket for Access Logs
  MyAppS3AccessLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub 'myapp-access-logs-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Environment
          Value: Production

  # Primary S3 Bucket with Access Logging
  MyAppS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub 'myapp-primary-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref MyAppS3AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt MyAppLambdaFunction.Arn
      Tags:
        - Key: Environment
          Value: Production

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'MyApp-Lambda-Execution-Role-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${MyAppS3Bucket}/*'
      Tags:
        - Key: Environment
          Value: Production

  # Security Group for Lambda
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: MyApp-Lambda-SG
      GroupDescription: Security group for Lambda function
      VpcId: !Ref MyAppVPC
      EgressRules:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: MyApp-Lambda-SG
        - Key: Environment
          Value: Production

  # Lambda Function
  MyAppLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: MyApp-S3-Event-Handler
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Code:
        ZipFile: |
          import json
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info(f"Received S3 event: {json.dumps(event)}")
              
              for record in event['Records']:
                  bucket = record['s3']['bucket']['name']
                  key = record['s3']['object']['key']
                  logger.info(f"Object {key} was created in bucket {bucket}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Successfully processed S3 event')
              }
      Timeout: 60
      Tags:
        - Key: Environment
          Value: Production

  # Lambda Permission for S3
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref MyAppLambdaFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub '${MyAppS3Bucket}/*'

  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: myapp-db-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: MyApp-DB-Subnet-Group
        - Key: Environment
          Value: Production

  # Security Group for RDS
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: MyApp-Database-SG
      GroupDescription: Security group for RDS PostgreSQL database
      VpcId: !Ref MyAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: Allow access from Lambda security group
      Tags:
        - Key: Name
          Value: MyApp-Database-SG
        - Key: Environment
          Value: Production

  # RDS PostgreSQL Instance
  MyAppRDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Retain
    Properties:
      DBInstanceIdentifier: myapp-postgres-db
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '13.13'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: MyApp-PostgreSQL-DB
        - Key: Environment
          Value: Production

Outputs:
  PrimaryS3BucketName:
    Description: 'Name of the primary S3 bucket'
    Value: !Ref MyAppS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryS3Bucket'

  AccessLogsS3BucketName:
    Description: 'Name of the S3 access logs bucket'
    Value: !Ref MyAppS3AccessLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AccessLogsS3Bucket'

  RDSInstanceEndpoint:
    Description: 'RDS PostgreSQL instance endpoint'
    Value: !GetAtt MyAppRDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref MyAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt MyAppLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'
```
