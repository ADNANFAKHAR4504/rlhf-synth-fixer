```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure infrastructure template for IaC - AWS Nova Model Breaking project with strong security best practices'

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, stg, prod]
    Description: Environment name for resource naming and tagging
    
  ProjectName:
    Type: String
    Default: 'IaC - AWS Nova Model Breaking'
    Description: Project name for resource tagging and naming
    
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: Existing VPC ID where resources will be deployed
    
  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: List of private subnet IDs within the specified VPC
    
  PublicSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: List of public subnet IDs within the specified VPC
    
  AllowedSshCidrs:
    Type: CommaDelimitedList
    Default: '10.0.0.0/8'
    Description: List of CIDR blocks allowed SSH access
    
  TrailBucketNameSuffix:
    Type: String
    Default: cloudtrail-logs
    AllowedPattern: '^[a-z0-9\-]*$'
    Description: Suffix for CloudTrail S3 bucket name (lowercase, hyphens allowed)
    
  KmsKeyArnForS3:
    Type: String
    Default: ''
    Description: Optional KMS Key ARN for S3 encryption. If empty, a new CMK will be created
    
  EnableCloudTrailToCloudWatch:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: Enable CloudTrail delivery to CloudWatch Logs
    
  EnableShieldAdvanced:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: Enable AWS Shield Advanced protection resources
    
  WafLogDestination:
    Type: String
    Default: s3
    AllowedValues: [s3, cloudwatch]
    Description: Destination for WAF logs (s3 or cloudwatch)
    
  Owner:
    Type: String
    Default: SecurityTeam
    Description: Owner tag value for all resources

Conditions:
  CreateKmsKey: !Equals [!Ref KmsKeyArnForS3, '']
  EnableCloudWatchLogs: !Equals [!Ref EnableCloudTrailToCloudWatch, 'true']
  EnableShield: !Equals [!Ref EnableShieldAdvanced, 'true']
  WafLogsToS3: !Equals [!Ref WafLogDestination, 's3']
  WafLogsToCloudWatch: !Equals [!Ref WafLogDestination, 'cloudwatch']

Resources:
  # KMS Key for S3 encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Condition: CreateKmsKey
    Properties:
      Description: !Sub 'KMS key for S3 encryption - ${ProjectName} ${Environment}'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow S3 service to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'S3Key-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Condition: CreateKmsKey
    Properties:
      AliasName: !Sub 'alias/s3-encryption-${Environment}-001'
      TargetKeyId: !Ref S3EncryptionKey

  # CloudTrail S3 Access Logs Bucket
  CloudTrailAccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-trail-access-logs-${Environment}-001-${TrailBucketNameSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !If
                - CreateKmsKey
                - !Ref S3EncryptionKey
                - !Ref KmsKeyArnForS3
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'TrailAccessLogs-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrailAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailAccessLogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${CloudTrailAccessLogsBucket}/*'
              - !Ref CloudTrailAccessLogsBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedPuts
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailAccessLogsBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  # CloudTrail S3 Bucket
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${TrailBucketNameSuffix}-${Environment}-001'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !If
                - CreateKmsKey
                - !Ref S3EncryptionKey
                - !Ref KmsKeyArnForS3
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref CloudTrailAccessLogsBucket
        LogFilePrefix: cloudtrail-bucket-access/
      Tags:
        - Key: Name
          Value: !Sub 'Trail-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref CloudTrailBucket
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:*:${AWS::AccountId}:trail/*'
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${CloudTrailBucket}/*'
              - !Ref CloudTrailBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedPuts
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  # CloudTrail Role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Condition: EnableCloudWatchLogs
    Properties:
      RoleName: !Sub 'CloudTrailRole-${Environment}-001'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:CloudTrailLogGroup-${Environment}-001:*'
      Tags:
        - Key: Name
          Value: !Sub 'CloudTrailRole-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # CloudWatch Log Group for CloudTrail
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Condition: EnableCloudWatchLogs
    Properties:
      LogGroupName: !Sub 'CloudTrailLogGroup-${Environment}-001'
      RetentionInDays: 90
      KmsKeyId: !If
        - CreateKmsKey
        - !Ref S3EncryptionKey
        - !Ref KmsKeyArnForS3
      Tags:
        - Key: Name
          Value: !Sub 'CloudTrailLogGroup-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub 'Trail-${Environment}-001'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: !Sub '${Environment}/cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !If
        - CreateKmsKey
        - !Ref S3EncryptionKey
        - !Ref KmsKeyArnForS3
      CloudWatchLogsLogGroupArn: !If
        - EnableCloudWatchLogs
        - !Sub '${CloudTrailLogGroup}:*'
        - !Ref 'AWS::NoValue'
      CloudWatchLogsRoleArn: !If
        - EnableCloudWatchLogs
        - !GetAtt CloudTrailRole.Arn
        - !Ref 'AWS::NoValue'
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: ['arn:aws:s3:::*/*']
            - Type: 'AWS::S3::Bucket'
              Values: ['arn:aws:s3:::*']
      Tags:
        - Key: Name
          Value: !Sub 'Trail-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # SSH Security Group
  SshSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'SshSG-${Environment}-001'
      GroupDescription: Security group allowing SSH access from specified CIDR blocks
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Select [0, !Ref AllowedSshCidrs]
          Description: SSH access from allowed CIDR
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'SshSG-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Additional SSH rules for multiple CIDRs
  SshSecurityGroupRule2:
    Type: AWS::EC2::SecurityGroupIngress
    Condition: !Not [!Equals [!Select [1, !Ref AllowedSshCidrs], !Select [0, !Ref AllowedSshCidrs]]]
    Properties:
      GroupId: !Ref SshSecurityGroup
      IpProtocol: tcp
      FromPort: 22
      ToPort: 22
      CidrIp: !Select [1, !Ref AllowedSshCidrs]
      Description: SSH access from allowed CIDR 2

  # EC2 Instance Role
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2InstanceRole-${Environment}-001'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: CloudWatchMetricsPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - ec2:DescribeVolumes
                  - ec2:DescribeTags
                  - logs:PutLogEvents
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:DescribeLogStreams
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': 'CWAgent'
      Tags:
        - Key: Name
          Value: !Sub 'EC2InstanceRole-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'EC2InstanceProfile-${Environment}-001'
      Roles:
        - !Ref EC2InstanceRole

  # WAF Logging Bucket
  WAFLogsBucket:
    Type: AWS::S3::Bucket
    Condition: WafLogsToS3
    Properties:
      BucketName: !Sub '${AWS::AccountId}-waf-logs-${Environment}-001'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !If
                - CreateKmsKey
                - !Ref S3EncryptionKey
                - !Ref KmsKeyArnForS3
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'WAFLogs-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  WAFLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: WafLogsToS3
    Properties:
      Bucket: !Ref WAFLogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${WAFLogsBucket}/*'
              - !Ref WAFLogsBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedPuts
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${WAFLogsBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  # WAF Logging Role
  WAFLoggingRole:
    Type: AWS::IAM::Role
    Condition: WafLogsToS3
    Properties:
      RoleName: !Sub 'WAFLoggingRole-${Environment}-001'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: wafv2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: WAFLoggingPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketLocation
                Resource:
                  - !Sub '${WAFLogsBucket}/*'
                  - !Ref WAFLogsBucket
      Tags:
        - Key: Name
          Value: !Sub 'WAFLoggingRole-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # WAF CloudWatch Log Group
  WAFLogGroup:
    Type: AWS::Logs::LogGroup
    Condition: WafLogsToCloudWatch
    Properties:
      LogGroupName: !Sub 'aws-waf-logs-${Environment}-001'
      RetentionInDays: 90
      KmsKeyId: !If
        - CreateKmsKey
        - !Ref S3EncryptionKey
        - !Ref KmsKeyArnForS3
      Tags:
        - Key: Name
          Value: !Sub 'WAFLogGroup-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # WAF Web ACL
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'WebACL-${Environment}-001'
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
        - Name: AWSManagedRulesSQLiRuleSet
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'WebACL-${Environment}-001'
      Tags:
        - Key: Name
          Value: !Sub 'WebACL-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # WAF Logging Configuration
  WAFLoggingConfiguration:
    Type: AWS::WAFv2::LoggingConfiguration
    Properties:
      ResourceArn: !GetAtt WAFWebACL.Arn
      LogDestinationConfigs:
        - !If
          - WafLogsToS3
          - !Sub '${WAFLogsBucket}'
          - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${WAFLogGroup}'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'ALB-${Environment}-001'
      Type: application
      Scheme: internet-facing
      Subnets: !Ref PublicSubnetIds
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'ALB-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ALB Security Group
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ALBSG-${Environment}-001'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'ALBSG-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # WAF Association with ALB
  WAFWebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WAFWebACL.Arn

  # Shield Protection for ALB
  ShieldProtection:
    Type: AWS::Shield::Protection
    Condition: EnableShield
    Properties:
      Name: !Sub 'Protect-${Environment}-001'
      ResourceArn: !Ref ApplicationLoadBalancer
      Tags:
        - Key: Name
          Value: !Sub 'Protect-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Secrets Manager Secret
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'DBSecret-${Environment}-001'
      Description: Database credentials for the application
      KmsKeyId: !If
        - CreateKmsKey
        - !Ref S3EncryptionKey
        - !Ref KmsKeyArnForS3
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub 'DBSecret-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # SNS Topic for Security Notifications
  SecurityNotificationsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'SecurityNotifications-${Environment}-001'
      KmsMasterKeyId: !If
        - CreateKmsKey
        - !Ref S3EncryptionKey
        - !Ref KmsKeyArnForS3
      Tags:
        - Key: Name
          Value: !Sub 'SecurityNotifications-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # CloudWatch Agent SSM Document
  CloudWatchAgentConfig:
    Type: AWS::SSM::Document
    Properties:
      DocumentType: Command
      Name: !Sub 'CloudWatchAgentConfig-${Environment}-001'
      Content:
        schemaVersion: '2.2'
        description: Install and configure CloudWatch Agent
        parameters:
          config:
            type: String
            description: CloudWatch Agent configuration
            default: |
              {
                "agent": {
                  "metrics_collection_interval": 60,
                  "run_as_user": "cwagent"
                },
                "metrics": {
                  "namespace": "CWAgent",
                  "metrics_collected": {
                    "cpu": {
                      "measurement": [
                        "cpu_usage_idle",
                        "cpu_usage_iowait",
                        "cpu_usage_user",
                        "cpu_usage_system"
                      ],
                      "metrics_collection_interval": 60
                    },
                    "disk": {
                      "measurement": [
                        "used_percent"
                      ],
                      "metrics_collection_interval": 60,
                      "resources": [
                        "*"
                      ]
                    },
                    "diskio": {
                      "measurement": [
                        "io_time"
                      ],
                      "metrics_collection_interval": 60,
                      "resources": [
                        "*"
                      ]
                    },
                    "mem": {
                      "measurement": [
                        "mem_used_percent"
                      ],
                      "metrics_collection_interval": 60
                    },
                    "netstat": {
                      "measurement": [
                        "tcp_established",
                        "tcp_time_wait"
                      ],
                      "metrics_collection_interval": 60
                    },
                    "swap": {
                      "measurement": [
                        "swap_used_percent"
                      ],
                      "metrics_collection_interval": 60
                    }
                  }
                }
              }
        mainSteps:
          - action: aws:runShellScript
            name: installCloudWatchAgent
            inputs:
              runCommand:
                - wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
                - rpm -U ./amazon-cloudwatch-agent.rpm
                - echo '{{ config }}' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
                - /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub 'CloudWatchAgentConfig-${Environment}-001'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

Outputs:
  CloudTrailBucketName:
    Description: Name of the CloudTrail S3 bucket
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-TrailBucketName'

  CloudTrailArn:
    Description: ARN of the CloudTrail
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-CloudTrailArn'

  SshSecurityGroupId:
    Description: Security Group ID for SSH access
    Value: !Ref SshSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-SshSecurityGroupId'

  EC2InstanceRoleArn:
    Description: ARN of the EC2 Instance Role
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-EC2InstanceRoleArn'

  EC2InstanceProfileArn:
    Description: ARN of the EC2 Instance Profile
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-EC2InstanceProfileArn'

  WAFWebACLArn:
    Description: ARN of the WAF Web ACL
    Value: !GetAtt WAFWebACL.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-WAFWebACLArn'

  ApplicationLoadBalancerArn:
    Description: ARN of the Application Load Balancer
    Value: !Ref Application