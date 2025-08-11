```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure CloudFormation template for FinancialApp - Financial Institution Compliant Infrastructure'

# Parameters for customization and security
Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for Private Subnet 1'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for Private Subnet 2'

  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.10.0/24'
    Description: 'CIDR block for Public Subnet 1'

  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.11.0/24'
    Description: 'CIDR block for Public Subnet 2'

  DBUsername:
    Type: String
    Default: 'financialapp'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  InstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type for application servers'
    AllowedValues:
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge

# Mappings for AMI selection
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2023 AMI

Resources:
  # ===============================
  # VPC AND NETWORKING RESOURCES
  # ===============================

  # Custom VPC for network isolation
  FinancialAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: 'Production'
        - Key: Application
          Value: 'FinancialApp'

  # Internet Gateway for public subnet connectivity
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref FinancialAppVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets for load balancers and NAT gateways
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinancialAppVPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinancialAppVPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-2'

  # Private Subnets for application and database tiers
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinancialAppVPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref FinancialAppVPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-2'

  # NAT Gateways for private subnet internet access
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FinancialAppVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
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
      VpcId: !Ref FinancialAppVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Routes-AZ1'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref FinancialAppVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Routes-AZ2'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ===============================
  # SECURITY GROUPS (DEFAULT DENY)
  # ===============================

  # Load Balancer Security Group - Default deny, explicit allow for HTTPS
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer - Default Deny'
      VpcId: !Ref FinancialAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access from internet'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access for redirect to HTTPS'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'

  # Application Server Security Group - Default deny, explicit allow from ALB
  AppServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Servers - Default Deny'
      VpcId: !Ref FinancialAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'Application port from Load Balancer'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH from Bastion Host'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-AppServer-SG'

  # Database Security Group - Default deny, explicit allow from app servers
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS Database - Default Deny'
      VpcId: !Ref FinancialAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AppServerSecurityGroup
          Description: 'MySQL access from Application Servers'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database-SG'

  # Bastion Host Security Group - Default deny, explicit allow SSH
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Bastion Host - Default Deny'
      VpcId: !Ref FinancialAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # In production, restrict to specific IP ranges
          Description: 'SSH access for administration'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Bastion-SG'

  # ===============================
  # KMS KEY FOR ENCRYPTION
  # ===============================

  # KMS Key for RDS encryption and other services
  FinancialAppKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for FinancialApp encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'

  FinancialAppKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-key'
      TargetKeyId: !Ref FinancialAppKMSKey

  # ===============================
  # S3 BUCKET WITH AES-256 ENCRYPTION
  # ===============================

  # S3 Bucket for application data with AES-256 encryption
  FinancialAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-data-${AWS::AccountId}-${AWS::Region}'
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
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref FinancialAppLoggingBucket
        LogFilePrefix: 'access-logs/'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Data-Bucket'
        - Key: Environment
          Value: 'Production'

  # S3 Bucket for access logging
  FinancialAppLoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Logging-Bucket'

  # ===============================
  # SECRETS MANAGER FOR DATABASE PASSWORD
  # ===============================

  # Database password stored in Secrets Manager
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}/database/password'
      Description: 'Database password for FinancialApp RDS instance'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  # ===============================
  # RDS DATABASE WITH KMS ENCRYPTION
  # ===============================

  # DB Subnet Group
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for FinancialApp RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DB-SubnetGroup'

  # RDS Database Instance with KMS encryption
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref FinancialAppKMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 30
      MultiAZ: true
      EnablePerformanceInsights: true
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database'

  # ===============================
  # IAM ROLES WITH MFA ENFORCEMENT
  # ===============================

  # IAM Role for EC2 instances with MFA enforcement for critical actions
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: 'S3AccessPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${FinancialAppS3Bucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !Ref FinancialAppS3Bucket
        - PolicyName: 'MFAEnforcementPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Deny
                Action:
                  - 'iam:CreatePolicy'
                  - 'iam:PutRolePolicy'
                  - 'iam:AttachRolePolicy'
                  - 'iam:DetachRolePolicy'
                Resource: '*'
                Condition:
                  BoolIfExists:
                    'aws:MultiFactorAuthPresent': 'false'

  # Instance Profile for EC2 instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # Administrative Role with strict MFA enforcement
  FinancialAppAdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-Admin-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
      Policies:
        - PolicyName: 'AdminPolicyWithMFA'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: '*'
                Resource: '*'
                Condition:
                  Bool:
                    'aws:MultiFactorAuthPresent': 'true'
              - Effect: Deny
                Action:
                  - 'iam:CreatePolicy'
                  - 'iam:PutRolePolicy'
                  - 'iam:AttachRolePolicy'
                  - 'iam:DetachRolePolicy'
                  - 'iam:CreateRole'
                  - 'iam:DeleteRole'
                Resource: '*'
                Condition:
                  BoolIfExists:
                    'aws:MultiFactorAuthPresent': 'false'

  # ===============================
  # CLOUDWATCH LOG GROUPS
  # ===============================

  # CloudWatch Log Group for API Gateway
  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${AWS::StackName}'
      RetentionInDays: 30

  # CloudWatch Log Group for Application Logs
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}'
      RetentionInDays: 30

  # ===============================
  # API GATEWAY WITH LOGGING
  # ===============================

  # API Gateway REST API
  FinancialAppAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${AWS::StackName}-API'
      Description: 'API Gateway for FinancialApp'
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Gateway Resource
  APIResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref FinancialAppAPI
      ParentId: !GetAtt FinancialAppAPI.RootResourceId
      PathPart: 'financial'

  # API Gateway Method
  APIMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref FinancialAppAPI
      ResourceId: !Ref APIResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: '{"message": "FinancialApp API is running"}'
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200

  # API Gateway Deployment
  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIMethod
    Properties:
      RestApiId: !Ref FinancialAppAPI
      StageName: 'prod'

  # API Gateway Stage with logging enabled
  APIStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref FinancialAppAPI
      DeploymentId: !Ref APIDeployment
      StageName: 'prod'
      AccessLogSetting:
        DestinationArn: !Sub '${APIGatewayLogGroup}:*'
        Format: '$requestId $requestTime $httpMethod $resourcePath $status $responseLength $requestTime'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true

  # ===============================
  # SYSTEMS MANAGER PATCH MANAGEMENT
  # ===============================

  # Patch Baseline for automated patching
  PatchBaseline:
    Type: AWS::SSM::PatchBaseline
    Properties:
      Name: !Sub '${AWS::StackName}-PatchBaseline'
      Description: 'Patch baseline for FinancialApp EC2 instances'
      OperatingSystem: AMAZON_LINUX_2
      PatchGroups:
        - !Sub '${AWS::StackName}-PatchGroup'
      ApprovalRules:
        PatchRules:
          - PatchFilterGroup:
              PatchFilters:
                - Key: CLASSIFICATION
                  Values:
                    - Security
                    - Bugfix
                    - Critical
                - Key: SEVERITY
                  Values:
                    - Critical
                    - Important
            ApproveAfterDays: 0
            EnableNonSecurity: true
      ApprovedPatches:
        - '*'
      ApprovedPatchesComplianceLevel: CRITICAL

  # Patch Group for organizing instances
  PatchGroup:
    Type: AWS::SSM::PatchGroup
    Properties:
      BaselineId: !Ref PatchBaseline
      PatchGroup: !Sub '${AWS::StackName}-PatchGroup'

  # Maintenance Window for patch deployment
  MaintenanceWindow:
    Type: AWS::SSM::MaintenanceWindow
    Properties:
      Name: !Sub '${AWS::StackName}-MaintenanceWindow'
      Description: 'Maintenance window for FinancialApp patching'
      Duration: 2
      Cutoff: 0
      Schedule: 'cron(0 2 ? * SUN *)'  # Every Sunday at 2 AM
      ScheduleTimezone: 'US/Eastern'
      AllowUnassociatedTargets: false

  # Maintenance Window Target
  MaintenanceWindowTarget:
    Type: AWS::SSM::MaintenanceWindowTarget
    Properties:
      WindowId: !Ref MaintenanceWindow
      ResourceType: INSTANCE
      Targets:
        - Key: tag:PatchGroup
          Values:
            - !Sub '${AWS::StackName}-PatchGroup'

  # Maintenance Window Task for patch installation
  MaintenanceWindowTask:
    Type: AWS::SSM::MaintenanceWindowTask
    Properties:
      WindowId: !Ref MaintenanceWindow
      Targets:
        - Key: WindowTargetIds
          Values:
            - !Ref MaintenanceWindowTarget
      TaskType: RUN_COMMAND
      TaskArn: AWS-RunPatchBaseline
      Priority: 1
      ServiceRoleArn: !GetAtt MaintenanceWindowRole.Arn
      TaskParameters:
        Operation:
          - Install

  # IAM Role for Maintenance Window
  MaintenanceWindowRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ssm.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonSSMMaintenanceWindowRole

  # ===============================
  # EC2 INSTANCES
  # ===============================

  # Launch Template for Application Servers
  AppServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-AppServer-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref AppServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${ApplicationLogGroup}",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

            # Add instance to patch group
            aws ssm add-tags-to-resource --resource-type "ManagedInstance" --resource-id $(curl -s http://169.254.169.254/latest/meta-data/instance-id) --tags Key=PatchGroup,Value=${AWS::StackName}-PatchGroup --region ${AWS::Region}
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-AppServer'
              - Key: PatchGroup
                Value: !Sub '${AWS::StackName}-PatchGroup'

  # Application Server Instance 1
  AppServerInstance1:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref AppServerLaunchTemplate
        Version: !GetAtt AppServerLaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-AppServer-1'

  # Application Server Instance 2
  AppServerInstance2:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref AppServerLaunchTemplate
        Version: !GetAtt AppServerLaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-AppServer-2'

  # Bastion Host for secure access
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      SubnetId: !Ref PublicSubnet1
      IamInstanceProfile: !Ref EC2InstanceProfile
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Bastion'
        - Key: PatchGroup
          Value: !Sub '${AWS::StackName}-PatchGroup'

# ===============================
# OUTPUTS
# ===============================

Outputs:
  VPCId:
    Description: 'VPC ID for the FinancialApp infrastructure'
    Value: !Ref FinancialAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName
```
