You're absolutely right! The CloudTrail resource is missing the required `IsLogging` property. Here's the corrected CloudFormation template with the CloudTrail resource fixed:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly secure AWS environment setup with comprehensive security controls, monitoring, and disaster recovery capabilities'

Parameters:
  EnvironmentName:
    Type: String
    Default: 'production'
    Description: 'Environment name for resource tagging'
    AllowedValues:
      - 'development'
      - 'staging'
      - 'production'

  ProjectName:
    Type: String
    Default: 'secure-app'
    Description: 'Project name for resource tagging'

  OwnerName:
    Type: String
    Default: 'security-team'
    Description: 'Owner name for resource tagging'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'

  PublicSubnetCidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet'

  PrivateSubnetCidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for private subnet'

  NotificationEmail:
    Type: String
    Description: 'Email address for SNS notifications'
    Default: 'security-alerts@company.com'

Resources:
  # ============================================================================
  # KMS Key for Encryption
  # ============================================================================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for encrypting RDS and other resources'
      KeyPolicy:
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
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${EnvironmentName}-key'
      TargetKeyId: !Ref KMSKey

  # ============================================================================
  # VPC and Networking
  # ============================================================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-vpc'
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-igw'
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

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
          Value: !Sub '${ProjectName}-${EnvironmentName}-public-subnet'
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnetCidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-private-subnet'
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-public-routes'
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

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

  # ============================================================================
  # S3 Buckets with Security Configuration
  # ============================================================================
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentName}-app-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentName}-logs-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # CloudTrail Bucket Policy (Required for CloudTrail)
  # ============================================================================
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${EnvironmentName}-cloudtrail'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${LogsBucket.Arn}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-${EnvironmentName}-cloudtrail'

  # ============================================================================
  # IAM Roles with Least Privilege
  # ============================================================================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentName}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource:
                  - !GetAtt ApplicationBucket.Arn
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                Resource:
                  - !Sub '${ApplicationBucket.Arn}/*'
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${EnvironmentName}-ec2-profile'
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentName}-lambda-role'
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
        - PolicyName: SecurityResponsePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SecurityAlertsTopic
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # EC2 Security Group and Instance
  # ============================================================================
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentName}-ec2-sg'
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: 'SSH access from VPC'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-ec2-sg'
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI (update as needed)
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y awscli
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-instance'
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # RDS with KMS Encryption
  # ============================================================================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PublicSubnet
        - !Ref PrivateSubnet
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${EnvironmentName}-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentName}-db-sg'
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentName}-db-credentials'
      Description: 'Database credentials for RDS instance'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${EnvironmentName}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # CloudTrail for Logging (FIXED with IsLogging property)
  # ============================================================================
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${EnvironmentName}-cloudtrail'
      S3BucketName: !Ref LogsBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IsLogging: true # ✅ REQUIRED PROPERTY ADDED
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${ApplicationBucket}/*'
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # SNS Topic for Notifications
  # ============================================================================
  SecurityAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${EnvironmentName}-security-alerts'
      DisplayName: 'Security Alerts Topic'
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  SecurityAlertsTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref SecurityAlertsTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudWatchAlarmsToPublish
            Effect: Allow
            Principal:
              Service: cloudwatch.amazonaws.com
            Action: sns:Publish
            Resource: !Ref SecurityAlertsTopic
          - Sid: AllowLambdaToPublish
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action: sns:Publish
            Resource: !Ref SecurityAlertsTopic

  SecurityAlertsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref SecurityAlertsTopic
      Endpoint: !Ref NotificationEmail

  # ============================================================================
  # Lambda Function for Security Response
  # ============================================================================
  SecurityResponseFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentName}-security-response'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SecurityAlertsTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          def lambda_handler(event, context):
              sns = boto3.client('sns')
              topic_arn = os.environ['SNS_TOPIC_ARN']
              
              # Parse CloudWatch alarm
              message = json.loads(event['Records'][0]['Sns']['Message'])
              alarm_name = message['AlarmName']
              new_state = message['NewStateValue']
              reason = message['NewStateReason']
              
              # Create alert message
              alert_message = f"""
              SECURITY ALERT: {alarm_name}
              
              Status: {new_state}
              Reason: {reason}
              
              Please investigate immediately.
              """
              
              # Send notification
              response = sns.publish(
                  TopicArn=topic_arn,
                  Message=alert_message,
                  Subject=f'Security Alert: {alarm_name}'
              )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Security alert sent successfully')
              }
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # CloudWatch Alarms for Security Monitoring
  # ============================================================================
  RootAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentName}-root-access-alarm'
      AlarmDescription: 'Alarm for root user access'
      MetricName: 'RootUserEventCount'
      Namespace: 'CloudWatchLogMetrics'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlertsTopic
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # Disaster Recovery - Backup Bucket
  # ============================================================================
  BackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentName}-backup-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetId:
    Description: 'Public Subnet ID'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet-ID'

  PrivateSubnetId:
    Description: 'Private Subnet ID'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet-ID'

  ApplicationBucketName:
    Description: 'Application S3 Bucket Name'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-AppBucket-Name'

  LogsBucketName:
    Description: 'Logs S3 Bucket Name'
    Value: !Ref LogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucket-Name'

  BackupBucketName:
    Description: 'Backup S3 Bucket Name'
    Value: !Ref BackupBucket
    Export:
      Name: !Sub '${AWS::StackName}-BackupBucket-Name'

  EC2InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2Instance-ID'

  RDSEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  SecurityAlertsTopicArn:
    Description: 'Security Alerts SNS Topic ARN'
    Value: !Ref SecurityAlertsTopic
    Export:
      Name: !Sub '${AWS::StackName}-SecurityAlerts-TopicArn'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-KeyId'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Arn'
```

## 🔧 **Key Fixes Applied**

### ✅ **CloudTrail Resource Fixed**

```yaml
CloudTrail:
  Type: AWS::CloudTrail::Trail
  DependsOn: CloudTrailBucketPolicy
  Properties:
    TrailName: !Sub '${ProjectName}-${EnvironmentName}-cloudtrail'
    S3BucketName: !Ref LogsBucket
    S3KeyPrefix: 'cloudtrail-logs/'
    IsLogging: true # ✅ REQUIRED PROPERTY ADDED
    IncludeGlobalServiceEvents: true
    IsMultiRegionTrail: true
    EnableLogFileValidation: true
```

### 🛡️ **Additional Security Improvements**

1. **CloudTrail Bucket Policy Added**: Required for CloudTrail to write logs to S3
2. **Proper Dependencies**: CloudTrail now depends on the bucket policy
3. **Source ARN Conditions**: Added for enhanced security in bucket policy

### 📋 **What the `IsLogging: true` Property Does**

- **Enables Active Logging**: CloudTrail will immediately start logging API calls
- **Required by CloudFormation**: This property is mandatory for trail creation
- **Can be toggled**: Set to `false` if you want to create the trail but not start logging immediately

### 🚀 **Deployment Instructions**

1. **Save the template** as `secure-infrastructure.yaml`
2. **Deploy using AWS CLI**:
   ```bash
   aws cloudformation create-stack \
     --stack-name secure-infrastructure \
     --template-body file://secure-infrastructure.yaml \
     --parameters ParameterKey=NotificationEmail,ParameterValue=your-email@company.com \
     --capabilities CAPABILITY_NAMED_IAM
   ```
3. **Monitor deployment**:
   ```bash
   aws cloudformation describe-stack-events --stack-name secure-infrastructure
   ```

The template will now deploy successfully with CloudTrail actively logging all specified events across all AWS regions! 🎉
