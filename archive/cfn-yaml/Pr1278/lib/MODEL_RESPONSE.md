AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and compliant AWS production environment with EC2, S3, RDS, Elasticsearch, Lambda, IAM, CloudWatch, and Parameter Store'

Parameters:
  ProjectName:
    Type: String
    Default: 'SecureProductionEnv'
    Description: 'Name of the project for resource naming'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
  
  PublicSubnetCidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet'
  
  PrivateSubnetCidr1:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for first private subnet'
  
  PrivateSubnetCidr2:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for second private subnet'
  
  AllowedSSHCidr:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
  
  AllowedHTTPCidr:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed for HTTP access'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
  
  EC2InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium', 't3.large']
    Description: 'EC2 instance type'
  
  RDSInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    AllowedValues: ['db.t3.micro', 'db.t3.small', 'db.t3.medium']
    Description: 'RDS instance class'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890  # This should be updated with actual latest Amazon Linux 2 AMI ID

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'
        - Key: Environment
          Value: Production

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnetCidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet'
        - Key: Environment
          Value: Production

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnetCidr1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-1'
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnetCidr2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-2'
        - Key: Environment
          Value: Production

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-eip'
        - Key: Environment
          Value: Production

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gateway'
        - Key: Environment
          Value: Production

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-rt'
        - Key: Environment
          Value: Production

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt'
        - Key: Environment
          Value: Production

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCidr
          Description: 'SSH access from allowed CIDR'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedHTTPCidr
          Description: 'HTTP access from allowed CIDR'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedHTTPCidr
          Description: 'HTTPS access from allowed CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-sg'
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-sg'
        - Key: Environment
          Value: Production

  ElasticsearchSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-es-sg'
      GroupDescription: 'Security group for Elasticsearch'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'HTTPS access from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-es-sg'
        - Key: Environment
          Value: Production

  # Parameter Store for Database Credentials
  DBMasterUsername:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/db/master-username'
      Type: String
      Value: 'admin'
      Description: 'Database master username'
      Tags:
        Environment: Production

  DBMasterPassword:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/db/master-password'
      Type: SecureString
      Value: 'TempPassword123!'  # Should be changed after deployment
      Description: 'Database master password'
      Tags:
        Environment: Production

  # IAM Roles and Policies
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-ec2-role'
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
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${S3Bucket}/*'
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-ec2-profile'
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${S3Bucket}/*'
      Tags:
        - Key: Environment
          Value: Production

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-secure-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-secure-bucket'
        - Key: Environment
          Value: Production

  # EC2 Instance
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref EC2InstanceType
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
          {
            "metrics": {
              "namespace": "CWAgent",
              "metrics_collected": {
                "cpu": {
                  "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": ["used_percent"],
                  "metrics_collection_interval": 60,
                  "resources": ["*"]
                },
                "mem": {
                  "measurement": ["mem_used_percent"],
                  "metrics_collection_interval": 60
                }
              }
            }
          }
          EOF
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-server'
        - Key: Environment
          Value: Production

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-db-subnet-group'
        - Key: Environment
          Value: Production

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-database'
      DBInstanceClass: !Ref RDSInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-database'
        - Key: Environment
          Value: Production

  # Elasticsearch Domain
  ElasticsearchDomain:
    Type: AWS::Elasticsearch::Domain
    Properties:
      DomainName: !Sub '${ProjectName}-es-domain'
      ElasticsearchVersion: '7.10'
      ElasticsearchClusterConfig:
        InstanceType: t3.small.elasticsearch
        InstanceCount: 2
        DedicatedMasterEnabled: false
      EBSOptions:
        EBSEnabled: true
        VolumeType: gp2
        VolumeSize: 20
      VPCOptions:
        SecurityGroupIds:
          - !Ref ElasticsearchSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      EncryptionAtRestOptions:
        Enabled: true
      NodeToNodeEncryptionOptions:
        Enabled: true
      DomainEndpointOptions:
        EnforceHTTPS: true
        TLSSecurityPolicy: 'Policy-Min-TLS-1-2-2019-07'
      AdvancedSecurityOptions:
        Enabled: true
        InternalUserDatabaseEnabled: true
        MasterUserOptions:
          MasterUserName: 'esadmin'
          MasterUserPassword: 'ESPassword123!'
      AccessPolicies:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'es:*'
            Resource: !Sub 'arn:aws:es:${AWS::Region}:${AWS::AccountId}:domain/${ProjectName}-es-domain/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-elasticsearch'
        - Key: Environment
          Value: Production

  # Lambda Function
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-lambda-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      ReservedConcurrencyLimit: 10
      Code:
        ZipFile: |
          import json
          import boto3
          
          def lambda_handler(event, context):
              # Sample Lambda function
              print(f"Event: {json.dumps(event)}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Hello from Lambda!',
                      'environment': 'Production'
                  })
              }
      Environment:
        Variables:
          ENVIRONMENT: Production
          PROJECT_NAME: !Ref ProjectName
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda'
        - Key: Environment
          Value: Production

  # CloudWatch Log Groups
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: Production

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-lambda-function'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-high-cpu'
      AlarmDescription: 'Alarm when server CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance
      Tags:
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-vpc-id'

  EC2InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${ProjectName}-ec2-id'

  EC2PublicIP:
    Description: 'EC2 Instance Public IP'
    Value: !GetAtt EC2Instance.PublicIp
    Export:
      Name: !Sub '${ProjectName}-ec2-public-ip'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${ProjectName}-s3-bucket'

  RDSEndpoint:
    Description: 'RDS Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${ProjectName}-rds-endpoint'

  ElasticsearchDomainEndpoint:
    Description: 'Elasticsearch Domain Endpoint'
    Value: !GetAtt ElasticsearchDomain.DomainEndpoint
    Export:
      Name: !Sub '${ProjectName}-es-endpoint'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-lambda-arn'