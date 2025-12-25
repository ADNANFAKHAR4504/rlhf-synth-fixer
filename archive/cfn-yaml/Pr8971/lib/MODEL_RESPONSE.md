```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, compliant infrastructure for web application with comprehensive security controls'

Parameters:
  ProjectName:
    Type: String
    Default: 'tapproject'
    Description: 'Project name for resource naming convention'
  
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment for resource naming convention'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
  
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for first public subnet'
  
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for second public subnet'
  
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.10.0/24'
    Description: 'CIDR block for first private subnet'
  
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.20.0/24'
    Description: 'CIDR block for second private subnet'
  
  AllowedIngressCidr:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed for HTTPS ingress'
  
  KmsKeyAdminArn:
    Type: String
    Description: 'ARN of IAM user/role that will administer KMS key'
  
  KmsKeyUserArns:
    Type: CommaDelimitedList
    Default: ''
    Description: 'Comma-delimited list of ARNs that can use KMS key'

Conditions:
  HasKmsKeyUsers: !Not [!Equals [!Join ['', !Ref KmsKeyUserArns], '']]

Resources:
  # KMS Key for encryption
  SecurityKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'kms-${ProjectName}-${Environment} encryption key'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Ref KmsKeyAdminArn
            Action:
              - 'kms:Create*'
              - 'kms:Describe*'
              - 'kms:Enable*'
              - 'kms:List*'
              - 'kms:Put*'
              - 'kms:Update*'
              - 'kms:Revoke*'
              - 'kms:Disable*'
              - 'kms:Get*'
              - 'kms:Delete*'
              - 'kms:ScheduleKeyDeletion'
              - 'kms:CancelKeyDeletion'
            Resource: '*'
          - Sid: Allow use of the key for services
            Effect: Allow
            Principal:
              Service:
                - cloudtrail.amazonaws.com
                - s3.amazonaws.com
                - logs.amazonaws.com
                - config.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - !If
            - HasKmsKeyUsers
            - Sid: Allow use of the key for specified users
              Effect: Allow
              Principal:
                AWS: !Ref KmsKeyUserArns
              Action:
                - 'kms:Encrypt'
                - 'kms:Decrypt'
                - 'kms:ReEncrypt*'
                - 'kms:GenerateDataKey*'
                - 'kms:DescribeKey'
              Resource: '*'
            - !Ref AWS::NoValue
      Tags:
        - Key: Name
          Value: !Sub 'kms-${ProjectName}-${Environment}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  SecurityKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/kms-${ProjectName}-${Environment}'
      TargetKeyId: !Ref SecurityKmsKey

  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${ProjectName}-${Environment}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${ProjectName}-${Environment}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-public-${ProjectName}-${Environment}-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'subnet-public-${ProjectName}-${Environment}-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub 'subnet-private-${ProjectName}-${Environment}-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub 'subnet-private-${ProjectName}-${Environment}-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-nat-${ProjectName}-${Environment}-1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eip-nat-${ProjectName}-${Environment}-2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-${ProjectName}-${Environment}-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-${ProjectName}-${Environment}-2'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'rt-public-${ProjectName}-${Environment}'

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
          Value: !Sub 'rt-private-${ProjectName}-${Environment}-1'

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
          Value: !Sub 'rt-private-${ProjectName}-${Environment}-2'

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

  # VPC Flow Logs
  VpcFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-vpcflowlogs-${ProjectName}-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: flowlogsDeliveryRolePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  VpcFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs-${ProjectName}-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecurityKmsKey.Arn

  VpcFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VpcFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VpcFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'flowlog-${ProjectName}-${Environment}'

  # Security Groups
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'sg-web-${ProjectName}-${Environment}'
      GroupDescription: 'Security group for web tier'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIngressCidr
          Description: 'HTTPS from allowed CIDR'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIngressCidr
          Description: 'HTTP from allowed CIDR'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound'
      Tags:
        - Key: Name
          Value: !Sub 'sg-web-${ProjectName}-${Environment}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'sg-db-${ProjectName}-${Environment}'
      GroupDescription: 'Security group for database tier'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'MySQL from web tier'
      Tags:
        - Key: Name
          Value: !Sub 'sg-db-${ProjectName}-${Environment}'

  # S3 Buckets
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-logs-${ProjectName}-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityKmsKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3AccessLogsGroup
      Tags:
        - Key: Name
          Value: !Sub 's3-logs-${ProjectName}-${Environment}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-data-${ProjectName}-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityKmsKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LogsBucket
        LogFilePrefix: 'access-logs/'
      Tags:
        - Key: Name
          Value: !Sub 's3-data-${ProjectName}-${Environment}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${LogsBucket}/*'
              - !Ref LogsBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowCloudTrailPuts
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${LogsBucket}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AllowCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !Ref LogsBucket
          - Sid: DenyCloudTrailLogDeletion
            Effect: Deny
            Principal: '*'
            Action:
              - 's3:DeleteObject'
              - 's3:DeleteObjectVersion'
            Resource: !Sub '${LogsBucket}/cloudtrail-logs/*'
            Condition:
              StringNotEquals:
                'aws:PrincipalServiceName': 'cloudtrail.amazonaws.com'

  DataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref DataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${DataBucket}/*'
              - !Ref DataBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: LogsBucketPolicy
    Properties:
      TrailName: !Sub 'cloudtrail-${ProjectName}-${Environment}'
      S3BucketName: !Ref LogsBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref SecurityKmsKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${DataBucket}/*'
      Tags:
        - Key: Name
          Value: !Sub 'cloudtrail-${ProjectName}-${Environment}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Logs and Alarms
  S3AccessLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/access-logs-${ProjectName}-${Environment}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecurityKmsKey.Arn

  SecurityAlarmsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/security/alarms-${ProjectName}-${Environment}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt SecurityKmsKey.Arn

  UnauthorizedAccessMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref SecurityAlarmsLogGroup
      FilterPattern: '[timestamp, request_id, event_name="ConsoleLogin", event_source, aws_region, source_ip, user_agent, error_code="Failed", error_message]'
      MetricTransformations:
        - MetricNamespace: 'Security'
          MetricName: 'UnauthorizedConsoleLogins'
          MetricValue: '1'
          DefaultValue: 0

  UnauthorizedAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'alarm-unauthorized-access-${ProjectName}-${Environment}'
      AlarmDescription: 'Alarm for unauthorized access attempts'
      MetricName: 'UnauthorizedConsoleLogins'
      Namespace: 'Security'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  # AWS Config
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-config-${ProjectName}-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigS3DeliveryPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource: !Ref LogsBucket
              - Effect: Allow
                Action: s3:PutObject
                Resource: !Sub '${LogsBucket}/config/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': 'bucket-owner-full-control'
              - Effect: Allow
                Action: s3:GetObject
                Resource: !Sub '${LogsBucket}/config/*'

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'config-recorder-${ProjectName}-${Environment}'
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'config-delivery-${ProjectName}-${Environment}'
      S3BucketName: !Ref LogsBucket
      S3KeyPrefix: 'config'

  ConfigRuleS3Encryption:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub 'config-rule-s3-encryption-${ProjectName}-${Environment}'
      Description: 'Checks whether S3 buckets have encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  ConfigRuleCloudTrailEnabled:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub 'config-rule-cloudtrail-enabled-${ProjectName}-${Environment}'
      Description: 'Checks whether CloudTrail is enabled'
      Source:
        Owner: AWS
        SourceIdentifier: CLOUD_TRAIL_ENABLED

  # Security Hub
  SecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'securityhub-${ProjectName}-${Environment}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  SecurityHubStandard:
    Type: AWS::SecurityHub::StandardsSubscription
    Properties:
      StandardsArn: !Sub 'arn:aws:securityhub:${AWS::Region}:${AWS::AccountId}:standard/aws-foundational-security-best-practices/v/1.0.0'

  # IAM Policy for CloudTrail Protection
  CloudTrailProtectionPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub 'policy-cloudtrail-protection-${ProjectName}-${Environment}'
      Description: 'Policy that prevents deletion of CloudTrail logs'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyCloudTrailLogDeletion
            Effect: Deny
            Action:
              - s3:DeleteObject
              - s3:DeleteObjectVersion
              - s3:PutLifecycleConfiguration
            Resource: !Sub '${LogsBucket}/cloudtrail-logs/*'
          - Sid: DenyCloudTrailDisable
            Effect: Deny
            Action:
              - cloudtrail:StopLogging
              - cloudtrail:DeleteTrail
              - cloudtrail:PutEventSelectors
            Resource: !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${CloudTrail}'

  # Parameter Store
  DatabasePasswordParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${Environment}/app/DB_PASSWORD'
      Type: SecureString
      Value: 'ChangeMe123!'
      KeyId: !Ref SecurityKmsKey
      Description: 'Database password for application'
      Tags:
        Project: !Ref ProjectName
        Environment: !Ref Environment

  ApiKeyParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${Environment}/app/API_KEY'
      Type: SecureString
      Value: 'api-key-placeholder'
      KeyId: !Ref SecurityKmsKey
      Description: 'API key for external service'
      Tags:
        Project: !Ref ProjectName
        Environment: !Ref Environment

  # Lambda Function and Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-lambda-${ProjectName}-${Environment}'
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
        - PolicyName: LambdaParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                Resource:
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/${Environment}/app/*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt SecurityKmsKey.Arn
                Condition:
                  StringEquals:
                    'kms:ViaService': !Sub 'ssm.${AWS::Region}.amazonaws.com'
        - PolicyName: LambdaS3ReadAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub '${DataBucket}/*'

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/lambda-${ProjectName}-${Environment}'
      RetentionInDays: 14
      KmsKeyId: !GetAtt SecurityKmsKey.Arn

  ExampleLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'lambda-${ProjectName}-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def lambda_handler(event, context):
              # Example function that reads from Parameter Store
              ssm = boto3.client('ssm')
              
              try:
                  # Get parameter from Parameter Store
                  response = ssm.get_parameter(
                      Name=f"/{os.environ['PROJECT_NAME']}/{os.environ['ENVIRONMENT']}/app/API_KEY",
                      WithDecryption=True
                  )
                  print("Successfully retrieved parameter from Parameter Store")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps('Function executed successfully')
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps('Error occurred')
                  }
      Environment:
        Variables:
          PROJECT_NAME: !Ref ProjectName
          ENVIRONMENT: !Ref Environment
      VpcConfig:
        SecurityGroupIds:
          - !Ref WebSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'lambda-${ProjectName}-${Environment}'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

Outputs:
  VpcId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export: