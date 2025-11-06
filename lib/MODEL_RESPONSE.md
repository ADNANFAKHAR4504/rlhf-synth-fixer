# Model Response
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Environment Infrastructure Template - Deploy for dev, staging, or production'

# ==========================================
# PARAMETERS
# ==========================================
Parameters:
  EnvType:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment type (dev, staging, or prod)
    
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]+'
    Description: RDS database master password
    ConstraintDescription: Must contain only alphanumeric characters, 8-41 characters
    
  KmsKeyArn:
    Type: String
    Default: ''
    Description: Optional KMS key ARN for encryption (leave empty to create new)
    
  ProjectName:
    Type: String
    Default: myapp
    Description: Project name used for resource naming
    
  DBUsername:
    Type: String
    Default: dbadmin
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: RDS database master username
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

# ==========================================
# MAPPINGS
# ==========================================
Mappings:
  EnvironmentConfig:
    dev:
      VpcCidr: '10.0.0.0/16'
      PublicSubnet1Cidr: '10.0.1.0/24'
      PublicSubnet2Cidr: '10.0.2.0/24'
      PrivateSubnet1Cidr: '10.0.10.0/24'
      PrivateSubnet2Cidr: '10.0.11.0/24'
      DBInstanceClass: 'db.t3.micro'
      DBAllocatedStorage: '20'
      DBBackupRetention: '1'
      LambdaMemory: '128'
      LambdaTimeout: '30'
      AlarmCPUThreshold: '80'
      S3LifecycleDays: '30'
      S3GlacierDays: '90'
    staging:
      VpcCidr: '10.1.0.0/16'
      PublicSubnet1Cidr: '10.1.1.0/24'
      PublicSubnet2Cidr: '10.1.2.0/24'
      PrivateSubnet1Cidr: '10.1.10.0/24'
      PrivateSubnet2Cidr: '10.1.11.0/24'
      DBInstanceClass: 'db.t3.small'
      DBAllocatedStorage: '50'
      DBBackupRetention: '7'
      LambdaMemory: '256'
      LambdaTimeout: '60'
      AlarmCPUThreshold: '75'
      S3LifecycleDays: '60'
      S3GlacierDays: '180'
    prod:
      VpcCidr: '10.2.0.0/16'
      PublicSubnet1Cidr: '10.2.1.0/24'
      PublicSubnet2Cidr: '10.2.2.0/24'
      PrivateSubnet1Cidr: '10.2.10.0/24'
      PrivateSubnet2Cidr: '10.2.11.0/24'
      DBInstanceClass: 'db.t3.medium'
      DBAllocatedStorage: '100'
      DBBackupRetention: '30'
      LambdaMemory: '512'
      LambdaTimeout: '120'
      AlarmCPUThreshold: '70'
      S3LifecycleDays: '90'
      S3GlacierDays: '365'

# ==========================================
# CONDITIONS
# ==========================================
Conditions:
  IsProd: !Equals [!Ref EnvType, prod]
  IsStaging: !Equals [!Ref EnvType, staging]
  IsDev: !Equals [!Ref EnvType, dev]
  IsNotDev: !Not [!Equals [!Ref EnvType, dev]]
  CreateKmsKey: !Equals [!Ref KmsKeyArn, '']
  EnableEnhancedMonitoring: !Or [!Condition IsProd, !Condition IsStaging]

# ==========================================
# RESOURCES
# ==========================================
Resources:

  # ==========================================
  # KMS KEY FOR ENCRYPTION
  # ==========================================
  KmsKey:
    Type: AWS::KMS::Key
    Condition: CreateKmsKey
    Properties:
      Description: !Sub 'KMS key for ${EnvType}-${ProjectName} encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for encryption
            Effect: Allow
            Principal:
              Service:
                - rds.amazonaws.com
                - s3.amazonaws.com
                - lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  KmsKeyAlias:
    Type: AWS::KMS::Alias
    Condition: CreateKmsKey
    Properties:
      AliasName: !Sub 'alias/${EnvType}-${ProjectName}-key'
      TargetKeyId: !Ref KmsKey

  # ==========================================
  # VPC AND NETWORKING
  # ==========================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvType, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-vpc'
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-igw'
        - Key: Environment
          Value: !Ref EnvType

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvType, PublicSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-public-subnet-1'
        - Key: Environment
          Value: !Ref EnvType

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvType, PublicSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-public-subnet-2'
        - Key: Environment
          Value: !Ref EnvType

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvType, PrivateSubnet1Cidr]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-private-subnet-1'
        - Key: Environment
          Value: !Ref EnvType

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref EnvType, PrivateSubnet2Cidr]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-private-subnet-2'
        - Key: Environment
          Value: !Ref EnvType

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-nat-eip-1'
        - Key: Environment
          Value: !Ref EnvType

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-nat-1'
        - Key: Environment
          Value: !Ref EnvType

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-public-rt'
        - Key: Environment
          Value: !Ref EnvType

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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
          Value: !Sub '${EnvType}-${ProjectName}-private-rt-1'
        - Key: Environment
          Value: !Ref EnvType

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable1

  # ==========================================
  # SECURITY GROUPS
  # ==========================================
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-lambda-sg'
        - Key: Environment
          Value: !Ref EnvType

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvType}-${ProjectName}-db-sg'
        - Key: Environment
          Value: !Ref EnvType

  # ==========================================
  # IAM ROLES AND POLICIES
  # ==========================================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvType}-${ProjectName}-lambda-role'
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
        - PolicyName: !Sub '${EnvType}-${ProjectName}-lambda-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${EnvType}-*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !If
                  - IsProd
                  - !Sub '${S3Bucket.Arn}/prod/*'
                  - !Sub '${S3Bucket.Arn}/${EnvType}/*'
              - !If
                - IsDev
                - Effect: Allow
                  Action:
                    - 's3:ListBucket'
                  Resource: !GetAtt S3Bucket.Arn
                - !Ref AWS::NoValue
      Tags:
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  StepFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvType}-${ProjectName}-stepfunction-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: states.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: !Sub '${EnvType}-${ProjectName}-stepfunction-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'lambda:InvokeFunction'
                Resource: !GetAtt LambdaFunction.Arn
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # S3 BUCKET WITH LIFECYCLE POLICY
  # ==========================================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvType}-${ProjectName}-${AWS::AccountId}-bucket'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: !If
                - CreateKmsKey
                - 'aws:kms'
                - 'AES256'
              KMSMasterKeyID: !If
                - CreateKmsKey
                - !GetAtt KmsKey.Arn
                - !Ref AWS::NoValue
      VersioningConfiguration:
        Status: !If [IsNotDev, 'Enabled', 'Suspended']
      LifecycleConfiguration:
        Rules:
          - Id: MoveToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: !FindInMap [EnvironmentConfig, !Ref EnvType, S3LifecycleDays]
              - StorageClass: GLACIER
                TransitionInDays: !FindInMap [EnvironmentConfig, !Ref EnvType, S3GlacierDays]
            NoncurrentVersionTransitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
            ExpirationInDays: !If [IsProd, 2555, 365]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # LAMBDA FUNCTION
  # ==========================================
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvType}-${ProjectName}-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import os
          
          def lambda_handler(event, context):
              environment = os.environ.get('ENVIRONMENT', 'unknown')
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': f'Hello from {environment} environment!',
                      'event': event
                  })
              }
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvType
          BUCKET_NAME: !Ref S3Bucket
          DB_ENDPOINT: !GetAtt RDSDatabase.Endpoint.Address
      MemorySize: !FindInMap [EnvironmentConfig, !Ref EnvType, LambdaMemory]
      Timeout: !FindInMap [EnvironmentConfig, !Ref EnvType, LambdaTimeout]
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${LambdaFunction}'
      RetentionInDays: !If [IsProd, 90, 7]

  # ==========================================
  # STEP FUNCTIONS STATE MACHINE
  # ==========================================
  StepFunction:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub '${EnvType}-${ProjectName}-statemachine'
      RoleArn: !GetAtt StepFunctionRole.Arn
      DefinitionString: !Sub |
        {
          "Comment": "Simple state machine for ${EnvType} environment",
          "StartAt": "InvokeLambda",
          "States": {
            "InvokeLambda": {
              "Type": "Task",
              "Resource": "${LambdaFunction.Arn}",
              "Parameters": {
                "environment": "${EnvType}",
                "input.$": "$"
              },
              "Next": "CheckResult"
            },
            "CheckResult": {
              "Type": "Choice",
              "Choices": [
                {
                  "Variable": "$.statusCode",
                  "NumericEquals": 200,
                  "Next": "Success"
                }
              ],
              "Default": "Fail"
            },
            "Success": {
              "Type": "Succeed"
            },
            "Fail": {
              "Type": "Fail",
              "Error": "ProcessingFailed",
              "Cause": "Lambda function returned non-200 status"
            }
          }
        }
      LoggingConfiguration:
        Level: !If [IsProd, 'ERROR', 'ALL']
        IncludeExecutionData: !If [IsDev, true, false]
        Destinations:
          - CloudWatchLogsLogGroup:
              LogGroupArn: !GetAtt StepFunctionLogGroup.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  StepFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vendedlogs/states/${EnvType}-${ProjectName}-statemachine'
      RetentionInDays: !If [IsProd, 30, 3]

  # ==========================================
  # RDS DATABASE
  # ==========================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvType}-${ProjectName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: !If [IsProd, 'Snapshot', 'Delete']
    Properties:
      DBInstanceIdentifier: !Sub '${EnvType}-${ProjectName}-db'
      DBName: !Sub '${ProjectName}db'
      Engine: mysql
      EngineVersion: '8.0.35'
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref EnvType, DBInstanceClass]
      AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref EnvType, DBAllocatedStorage]
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !If
        - CreateKmsKey
        - !GetAtt KmsKey.Arn
        - !Ref KmsKeyArn
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref EnvType, DBBackupRetention]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: !If [IsProd, true, false]
      EnablePerformanceInsights: !If [IsNotDev, true, false]
      DeletionProtection: !If [IsProd, true, false]
      Tags:
        - Key: Environment
          Value: !Ref EnvType
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # CLOUDWATCH ALARMS
  # ==========================================
  DBCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvType}-${ProjectName}-db-cpu-alarm'
      AlarmDescription: !Sub 'Alert when RDS CPU exceeds ${EnvironmentConfig.${EnvType}.AlarmCPUThreshold}%'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !FindInMap [EnvironmentConfig, !Ref EnvType, AlarmCPUThreshold]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      TreatMissingData: breaching

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvType}-${ProjectName}-lambda-error-alarm'
      AlarmDescription: Alert on Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: !If [IsProd, 1, 5]
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

  # ==========================================
  # WAIT CONDITION EXAMPLE
  # ==========================================
  WaitHandle:
    Type: AWS::CloudFormation::WaitConditionHandle
    Properties: {}

  WaitCondition:
    Type: AWS::CloudFormation::WaitCondition
    DependsOn: LambdaFunction
    Properties:
      Handle: !Ref WaitHandle
      Timeout: '300'
      Count: 0  # Set to 0 so it doesn't actually wait (example only)

# ==========================================
# OUTPUTS
# ==========================================
Outputs:
  # Environment Verification
  DeployedEnvironment:
    Description: Confirms which environment was deployed
    Value: !Ref EnvType
    Export:
      Name: !Sub '${AWS::StackName}-Environment'

  EnvironmentType:
    Description: Environment type verification
    Value: !Sub 'This stack deployed the ${EnvType} environment'
    
  # VPC and Networking
  VPCId:
    Description: VPC ID for this environment
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'
      
  VPCCidr:
    Description: VPC CIDR block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-VPCCidr'
      
  PublicSubnetIds:
    Description: Public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnets'
      
  PrivateSubnetIds:
    Description: Private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'
      
  # Lambda and Step Functions
  LambdaFunctionArn:
    Description: Lambda function ARN
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'
      
  LambdaFunctionName:
    Description: Lambda function name
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaName'
      
  StepFunctionArn:
    Description: Step Functions state machine ARN
    Value: !GetAtt StepFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-StepFunctionArn'
      
  StepFunctionName:
    Description: Step Functions state machine name
    Value: !GetAtt StepFunction.Name
    Export:
      Name: !Sub '${AWS::StackName}-StepFunctionName'
      
  # Storage and Database
  S3BucketName:
    Description: S3 bucket name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'
      
  S3BucketArn:
    Description: S3 bucket ARN
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketArn'
      
  RDSEndpoint:
    Description: RDS database endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBEndpoint'
      
  RDSPort:
    Description: RDS database port
    Value: !GetAtt RDSDatabase.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DBPort'
      
  # Security and IAM
  LambdaRoleArn:
    Description: Lambda execution role ARN
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaRoleArn'
      
  KmsKeyId:
    Description: KMS key ID used for encryption
    Value: !If
      - CreateKmsKey
      - !Ref KmsKey
      - !Ref KmsKeyArn
    Export:
      Name: !Sub '${AWS::StackName}-KmsKeyId'
      
  # Monitoring
  DBCPUAlarmName:
    Description: Database CPU alarm name
    Value: !Ref DBCPUAlarm
    Export:
      Name: !Sub '${AWS::StackName}-DBAlarm'
      
  LambdaErrorAlarmName:
    Description: Lambda error alarm name
    Value: !Ref LambdaErrorAlarm
    Export:
      Name: !Sub '${AWS::StackName}-LambdaAlarm'
      
  # Stack Information
  StackRegion:
    Description: AWS Region where stack is deployed
    Value: !Ref AWS::Region
    
  StackAccount:
    Description: AWS Account ID
    Value: !Ref AWS::AccountId
    
  TemplateVersion:
    Description: Template deployment timestamp
    Value: !Sub 'Deployed on ${AWS::StackName} at ${AWS::Region}'
```