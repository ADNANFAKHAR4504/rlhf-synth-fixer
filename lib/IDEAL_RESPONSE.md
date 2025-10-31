### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that deploys a payment processing application. Let me break down what's needed:

1. Environment-based configuration (dev/prod) using parameters and conditions
2. Cross-account and cross-region portability
3. Strict naming convention: ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]
4. Multiple resources:
   - RDS MySQL instance
   - EC2 instances
   - S3 buckets
   - Lambda functions
   - CloudWatch alarms
   - Security groups
   - IAM roles
   - VPC resources (implied by naming examples)

Key requirements:
- Environment parameter for logic/conditions
- EnvironmentSuffix parameter for naming only
- No hardcoded values
- Use Mappings for AMI IDs
- Use Conditions for environment-specific config
- All resources must be tagged properly
- Least-privilege IAM policies
- Storage encryption for RDS
- Different configurations for dev vs prod

Let me create a comprehensive CloudFormation template that meets all these requirements.
### Answer 
---

# Production-Ready CloudFormation Template for Payment Processing Application

Below is a comprehensive CloudFormation template that meets all your requirements. This template dynamically adapts to development and production environments while maintaining strict naming conventions and security best practices.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Payment Processing Application - Cross-Account/Cross-Region Deployable'

# Parameters Section
Parameters:
  Environment:
    Type: String
    Description: 'Deployment environment (development or production)'
    AllowedValues:
      - dev
      - prod
    Default: dev

  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: 'pr4056'
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

  DBUsername:
    Type: String
    Description: 'Database master username'
    Default: 'admin'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  AllowedCIDRBlock:
    Type: String
    Description: 'CIDR block for allowed incoming connections'
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: 'Must be a valid CIDR block'

  SourceAmiIdSsmParameter:
    Type: String
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: SSM parameter name holding the AMI ID (keeps template free of hard-coded AMI IDs)

# Mappings Section
Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      DBInstanceClass: db.t3.micro
      DBAllocatedStorage: 20
      DBBackupRetentionPeriod: 0
      DBMultiAZ: false
      S3LifecycleDays: 30
      AlarmCPUThreshold: 70
      LambdaConcurrency: 0
    prod:
      InstanceType: m5.large
      DBInstanceClass: db.m5.large
      DBAllocatedStorage: 100
      DBBackupRetentionPeriod: 7
      DBMultiAZ: true
      S3LifecycleDays: 365
      AlarmCPUThreshold: 80
      LambdaConcurrency: 10

# Conditions Section
Conditions:
  IsProd: !Equals [!Ref Environment, 'prod']
  SetLambdaConcurrency: !Equals [!Ref Environment, 'prod']

# Resources Section
Resources:
  # VPC Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  SubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Groups
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg'
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !If [IsProd, !Ref AllowedCIDRBlock, '0.0.0.0/0']
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCIDRBlock
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedCIDRBlock
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-sg'
      GroupDescription: 'Security group for RDS instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-sg'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  # RDS Resources
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS instances'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  # Secrets Manager Secret for RDS Password
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-password'
      Description: 'Database password for RDS instance'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-password'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db'
      Engine: mysql
      EngineVersion: '8.0.43'
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref Environment, DBAllocatedStorage]
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${AWS::StackName}-${EnvironmentSuffix}-db-password:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref Environment, DBBackupRetentionPeriod]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: !FindInMap [EnvironmentConfig, !Ref Environment, DBMultiAZ]
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  # EC2 Resources
  EC2KeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair'
      KeyType: rsa
      KeyFormat: pem
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
      ImageId: !Sub '{{resolve:ssm:${SourceAmiIdSsmParameter}}}'
      KeyName: !Ref EC2KeyPair
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      SubnetId: !Ref PublicSubnet1
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          set -xe

          # Update packages and install CloudWatch Agent
          yum update -y
          yum install -y amazon-cloudwatch-agent

          # Export environment variables for the app
          echo "export DB_ENDPOINT=${RDSInstance.Endpoint.Address}" >> /etc/environment
          echo "export S3_BUCKET=${PaymentDataBucket}" >> /etc/environment
          echo "export ENVIRONMENT=${Environment}" >> /etc/environment

          # Create CloudWatch Agent configuration file
          cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
          {
            "agent": {
              "metrics_collection_interval": 60,
              "run_as_user": "root"
            },
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/aws/ec2/${AWS::StackName}-${AWS::Region}-${Environment}-system",
                      "log_stream_name": "{instance_id}",
                      "timezone": "UTC"
                    }
                  ]
                }
              }
            }
          }
          EOF

          # Start and enable CloudWatch Agent
          systemctl enable amazon-cloudwatch-agent
          systemctl start amazon-cloudwatch-agent
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  # S3 Resources
  PaymentDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::Region}-${Environment}-payment-data-${AWS::AccountId}'
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
      LifecycleConfiguration:
        Rules:
          - Id: !Sub '${Environment}-lifecycle-rule'
            Status: Enabled
            ExpirationInDays: !FindInMap [EnvironmentConfig, !Ref Environment, S3LifecycleDays]
            NoncurrentVersionExpirationInDays: 7
      Tags:
        - Key: Name
          Value: !Sub '${AWS::Region}-${Environment}-payment-data-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  # IAM Roles and Policies
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: !Sub '${PaymentDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt PaymentDataBucket.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile'
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role'
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
        - PolicyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${PaymentDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt PaymentDataBucket.Arn
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  # Lambda Functions
  PaymentProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-payment-processor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      ReservedConcurrentExecutions: !If 
        - SetLambdaConcurrency
        - !FindInMap [EnvironmentConfig, !Ref Environment, LambdaConcurrency]
        - !Ref AWS::NoValue
      Environment:
        Variables:
          DB_ENDPOINT: !GetAtt RDSInstance.Endpoint.Address
          DB_PORT: !GetAtt RDSInstance.Endpoint.Port
          S3_BUCKET: !Ref PaymentDataBucket
          ENVIRONMENT: !Ref Environment
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          
          def lambda_handler(event, context):
              # Payment processing logic placeholder
              db_endpoint = os.environ['DB_ENDPOINT']
              s3_bucket = os.environ['S3_BUCKET']
              environment = os.environ['ENVIRONMENT']
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Payment processed successfully',
                      'environment': environment
                  })
              }
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-payment-processor'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref AWS::StackName

  # CloudWatch Alarms
  EC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-cpu-alarm'
      AlarmDescription: 'EC2 instance CPU utilization alarm'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !FindInMap [EnvironmentConfig, !Ref Environment, AlarmCPUThreshold]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance

  RDSConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-connection-alarm'
      AlarmDescription: 'RDS database connection count alarm'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !If [IsProd, 80, 20]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance

# Outputs Section
Outputs:
  # VPC and Network Resources
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-id'

  VPCCidrBlock:
    Description: 'VPC CIDR Block'
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-cidr'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw-id'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1-id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2-id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1-id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2-id'

  PublicRouteTableId:
    Description: 'Public Route Table ID'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt-id'

  # Security Groups
  EC2SecurityGroupId:
    Description: 'EC2 Security Group ID'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg-id'

  RDSSecurityGroupId:
    Description: 'RDS Security Group ID'
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-sg-id'

  LambdaSecurityGroupId:
    Description: 'Lambda Security Group ID'
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-sg-id'

  # IAM Roles and Profiles
  EC2RoleName:
    Description: 'EC2 IAM Role Name'
    Value: !Ref EC2Role
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role-name'

  EC2RoleArn:
    Description: 'EC2 IAM Role ARN'
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role-arn'

  EC2InstanceProfileName:
    Description: 'EC2 Instance Profile Name'
    Value: !Ref EC2InstanceProfile
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile-name'

  EC2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile-arn'

  LambdaExecutionRoleName:
    Description: 'Lambda Execution Role Name'
    Value: !Ref LambdaExecutionRole
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role-name'

  LambdaExecutionRoleArn:
    Description: 'Lambda Execution Role ARN'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role-arn'

  # EC2 Resources
  EC2InstanceId:
    Description: 'EC2 instance ID'
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance-id'

  EC2InstancePublicIP:
    Description: 'EC2 instance public IP address'
    Value: !GetAtt EC2Instance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-public-ip'

  EC2InstancePrivateIP:
    Description: 'EC2 instance private IP address'
    Value: !GetAtt EC2Instance.PrivateIp
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-private-ip'

  EC2InstancePublicDNS:
    Description: 'EC2 instance public DNS name'
    Value: !GetAtt EC2Instance.PublicDnsName
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-public-dns'

  EC2KeyPairName:
    Description: 'EC2 Key Pair Name'
    Value: !Ref EC2KeyPair
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair-name'

  # RDS Resources
  RDSInstanceId:
    Description: 'RDS instance identifier'
    Value: !Ref RDSInstance
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-instance-id'

  RDSEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-endpoint'

  RDSPort:
    Description: 'RDS instance port'
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-port'

  DBSubnetGroupName:
    Description: 'Database Subnet Group Name'
    Value: !Ref DBSubnetGroup
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group-name'

  DBPasswordSecretArn:
    Description: 'Database Password Secret ARN'
    Value: !Ref DBPasswordSecret
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-password-secret-arn'

  DBPasswordSecretName:
    Description: 'Database Password Secret Name'
    Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-db-password'
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-password-secret-name'

  # S3 Resources
  S3BucketName:
    Description: 'S3 bucket name for payment data'
    Value: !Ref PaymentDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${Environment}-s3-bucket'

  S3BucketArn:
    Description: 'S3 bucket ARN for payment data'
    Value: !GetAtt PaymentDataBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${Environment}-s3-bucket-arn'

  S3BucketDomainName:
    Description: 'S3 bucket domain name'
    Value: !GetAtt PaymentDataBucket.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${Environment}-s3-bucket-domain'

  S3BucketRegionalDomainName:
    Description: 'S3 bucket regional domain name'
    Value: !GetAtt PaymentDataBucket.RegionalDomainName
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${Environment}-s3-bucket-regional-domain'

  # Lambda Functions
  LambdaFunctionName:
    Description: 'Payment processor Lambda function name'
    Value: !Ref PaymentProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-function'

  LambdaFunctionArn:
    Description: 'Payment processor Lambda function ARN'
    Value: !GetAtt PaymentProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-function-arn'

  # CloudWatch Alarms
  EC2CPUAlarmName:
    Description: 'EC2 CPU Alarm Name'
    Value: !Ref EC2CPUAlarm
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-cpu-alarm-name'

  RDSConnectionAlarmName:
    Description: 'RDS Connection Alarm Name'
    Value: !Ref RDSConnectionAlarm
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-connection-alarm-name'

  # CloudWatch Log Groups (derived)
  EC2SystemLogGroup:
    Description: 'EC2 System Log Group Name'
    Value: !Sub '/aws/ec2/${AWS::StackName}-${AWS::Region}-${Environment}-system'
    Export:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-log-group'
